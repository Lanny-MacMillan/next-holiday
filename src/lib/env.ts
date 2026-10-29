const REQUIRED = [
  'DATABASE_URL',
  'NEXT_PUBLIC_AUTH0_DOMAIN',
  'NEXT_PUBLIC_AUTH0_CLIENT_ID',
] as const;

export function missingEnv(env: Record<string, string | undefined> = process.env) {
  return REQUIRED.filter(name => !env[name]?.trim());
}
