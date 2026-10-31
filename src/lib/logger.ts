type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Anything under a key that looks like one of these never reaches the logs
const SENSITIVE_KEY =
  /authorization|token|password|secret|cookie|api[-_]?key|email|phone|address/i;

const MAX_STRING = 500;
const MAX_DEPTH = 4;
const MAX_ITEMS = 20;

function threshold() {
  const configured = process.env.LOG_LEVEL as Level | undefined;
  return ORDER[configured ?? 'info'] ?? ORDER.info;
}

function clean(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...` : value;
  }
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Error) return describeError(value);
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (Array.isArray(value))
    return value.slice(0, MAX_ITEMS).map(v => clean(v, depth + 1));

  // fromEntries defines own properties, so a key such as __proto__ cannot reach the prototype
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[redacted]' : clean(inner, depth + 1),
    ]),
  );
}

function describeError(error: Error) {
  const { code } = error as { code?: unknown };
  return {
    name: error.name,
    message: clean(error.message),
    ...(code !== undefined && { code }),
    stack: error.stack?.split('\n').slice(0, 6).join('\n'),
  };
}

function write(level: Level, message: unknown, details: unknown[]) {
  if (ORDER[level] < threshold()) return;

  const entry: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    message: typeof message === 'string' ? clean(message) : 'error',
  };
  // console.error(error) style calls pass the error as the first argument
  const rest = typeof message === 'string' ? details : [message, ...details];
  if (rest.length === 1) entry.detail = clean(rest[0]);
  else if (rest.length > 1) entry.detail = rest.map(item => clean(item));

  let line: string;
  try {
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({ level, time: entry.time, message: entry.message });
  }
  const sink =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : console.log;
  sink(line);
}

// Same call shape as console, but one JSON line per event, with a level and no secrets.
export const logger = {
  debug: (message: unknown, ...details: unknown[]) =>
    write('debug', message, details),
  info: (message: unknown, ...details: unknown[]) => write('info', message, details),
  warn: (message: unknown, ...details: unknown[]) => write('warn', message, details),
  error: (message: unknown, ...details: unknown[]) =>
    write('error', message, details),
};
