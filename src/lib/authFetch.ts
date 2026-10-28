type TokenProvider = () => Promise<string | undefined>;

let tokenProvider: TokenProvider | null = null;
let installed = false;

function isSameOriginApiRequest(input: RequestInfo | URL): boolean {
  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function setAuthTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

// Adds the ID token to same-origin /api requests; other origins (the SSE service) are untouched.
export function installAuthFetch(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    if (!tokenProvider || !isSameOriginApiRequest(input)) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );

    if (!headers.has('Authorization')) {
      const token = await tokenProvider().catch(() => undefined);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    return originalFetch(input, { ...init, headers });
  };
}
