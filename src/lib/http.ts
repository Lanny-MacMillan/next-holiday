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

export function conflict(
  error: string = 'Conflict',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 409, headers });
}

export function unprocessableEntity(
  error: string | z.ZodIssue[],
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 422, headers });
}

export function serverError(
  error: string = 'Internal server error',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 500, headers });
}

export function serviceUnavailable(
  error: string = 'Service unavailable',
  headers?: Record<string, string>,
) {
  return NextResponse.json({ success: false, error }, { status: 503, headers });
}
