// A thunk's unwrap() rejects with a plain { message } object, not an Error
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return 'Unknown error';
}
