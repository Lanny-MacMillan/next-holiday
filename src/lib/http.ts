import { NextResponse } from 'next/server';
import { z } from 'zod';

export function ok<T = unknown>(data?: T, headers?: Record<string, string>) {
  return NextResponse.json({ success: true, data }, { status: 200, headers });
}

export function created<T = unknown>(data?: T, headers?: Record<string, string>) {
  return NextResponse.json({ success: true, data }, { status: 201, headers });
}

export function badRequest(
  error: string | z.ZodIssue[],
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 400, headers });
}

export function unauthorized(
  error: string = 'Unauthorized',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 401, headers });
}

export function forbidden(
  error: string = 'Forbidden',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 403, headers });
}

export function notFound(
  error: string = 'Not found',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 404, headers });
}

export function serverError(
  error: string = 'Internal server error',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 500, headers });
}

// Route catch-alls: pass through a Response thrown by rbac helpers, map a missing session to 401.
export function routeError(error: unknown, label: string, message: string) {
  if (error instanceof Response) return error;
  if (error instanceof Error && error.message === 'Authentication required') {
    return unauthorized();
  }
  if ((error as { code?: string })?.code === 'P2025') return notFound();
  console.error(label, error);
  return serverError(message);
}
