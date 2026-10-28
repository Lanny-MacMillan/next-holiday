/** @jest-environment node */
import fs from 'fs';
import path from 'path';

const SRC = path.join(process.cwd(), 'src');
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'generated' && entry.name !== '__tests__') walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const rel = (f: string) => path.relative(process.cwd(), f).split(path.sep).join('/');
const allFiles = walk(SRC);
const isRoute = (f: string) => rel(f).startsWith('src/app/api/');

type Route = { path: string; methods: Set<string> };
const routes: Route[] = allFiles
  .filter(f => isRoute(f) && f.endsWith('route.ts'))
  .map(f => ({
    path:
      '/api/' +
      rel(f)
        .replace('src/app/api/', '')
        .replace(/\/route\.ts$/, ''),
    methods: new Set(
      [
        ...fs
          .readFileSync(f, 'utf8')
          .matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g),
      ].map(m => m[1]),
    ),
  }));

type Call = { file: string; url: string; method: string };
const calls: Call[] = [];

const methodNear = (text: string) =>
  text.slice(0, 300).match(/method:\s*['"](\w+)['"]/)?.[1] ?? 'GET';

for (const f of allFiles.filter(f => !isRoute(f))) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(
    /fetch\(\s*([`'"])(\/api\/[^`'"]*)\1(?=([\s\S]{0,400}))/g,
  )) {
    calls.push({ file: rel(f), url: m[2], method: methodNear(m[3]) });
  }
}
// Trailing context is captured in a lookahead so adjacent calls are not skipped
// RTK Query endpoints are relative to the '/api' base URL
for (const m of fs
  .readFileSync(path.join(SRC, 'store/api.ts'), 'utf8')
  .matchAll(/url:\s*([`'"])([^`'"]+)\1(?=([\s\S]{0,200}))/g)) {
  calls.push({
    file: 'src/store/api.ts',
    url: '/api/' + m[2].replace(/^\//, ''),
    method: methodNear(m[3]),
  });
}

const segments = (p: string) =>
  p
    .split('?')[0]
    .replace(/\$\{[^}]*\}/g, '*')
    .split('/')
    .filter(Boolean);

function matchingRoutes(url: string): Route[] {
  const want = segments(url);
  return routes.filter(r => {
    const have = segments(r.path);
    return (
      have.length === want.length &&
      have.every(
        (seg, i) =>
          seg === want[i] ||
          (/^\[.+\]$/.test(seg) && want[i] !== '') ||
          want[i] === '*',
      )
    );
  });
}

// Calls to a route that does not exist. Remove an entry when its call is deleted.
const KNOWN_DEAD_CALLS = ['PUT /api/shares/*'];

// Route handlers with no literal call in the client code. A caller built from a
// variable would not be found here, so this is an inventory, not a list of dead code.
// Update it when a route gains or loses its caller.
const ROUTES_WITHOUT_LITERAL_CALLER = [
  'DELETE /api/accounts/[id]',
  'DELETE /api/holidays/[id]',
  'DELETE /api/holidays/[id]/gifts/[giftId]',
  'DELETE /api/holidays/[id]/tasks/[taskId]',
  'DELETE /api/notifications',
  'GET /api/accounts',
  'GET /api/accounts/[id]',
  'GET /api/budget-transactions',
  'GET /api/budgets',
  'GET /api/contacts',
  'GET /api/holidays',
  'GET /api/holidays/[id]/delete-cascade',
  'GET /api/notifications/stream',
  'GET /api/performance',
  'GET /api/users/me',
  'GET /api/users/me/account',
  'GET /api/users/me/notification-preferences',
  'PATCH /api/holidays/[id]/gifts/[giftId]',
  'POST /api/accounts',
  'POST /api/budget-transactions',
  'POST /api/holidays',
  'POST /api/holidays/[id]/clear-data',
  'POST /api/performance',
  'PUT /api/accounts/[id]',
  'PUT /api/holidays/[id]',
];

describe('client API calls match server routes', () => {
  it('finds a believable number of routes and calls', () => {
    expect(routes.length).toBeGreaterThan(30);
    expect(calls.length).toBeGreaterThan(100);
  });

  it('every client call has a route that handles its method', () => {
    const problems = calls
      .filter(c => {
        const found = matchingRoutes(c.url);
        return !found.some(r => r.methods.has(c.method));
      })
      .map(c => `${c.method} ${c.url.replace(/\$\{[^}]*\}/g, '*').split('?')[0]}`)
      .filter(key => !KNOWN_DEAD_CALLS.includes(key));

    expect([...new Set(problems)]).toEqual([]);
  });

  it('the known dead calls are still dead (delete the entry once the call is gone)', () => {
    for (const known of KNOWN_DEAD_CALLS) {
      const [method, url] = known.split(' ');
      const exists = calls.some(
        c =>
          c.method === method &&
          c.url.replace(/\$\{[^}]*\}/g, '*').split('?')[0] === url,
      );
      expect({ known, stillCalled: exists }).toEqual({ known, stillCalled: true });
    }
  });

  it('every method on every route is a real HTTP method', () => {
    for (const r of routes) {
      for (const m of r.methods) expect(METHODS).toContain(m);
      expect(r.methods.size).toBeGreaterThan(0);
    }
  });

  it('the set of routes with no literal client caller has not drifted', () => {
    const called = new Set<string>();
    for (const c of calls) {
      for (const r of matchingRoutes(c.url))
        if (r.methods.has(c.method)) called.add(`${c.method} ${r.path}`);
    }
    const uncalled = routes
      .flatMap(r => [...r.methods].map(m => `${m} ${r.path}`))
      .filter(key => !called.has(key))
      .sort();

    expect(uncalled).toEqual([...ROUTES_WITHOUT_LITERAL_CALLER].sort());
  });
});
