import { NextRequest } from 'next/server';
import { addUserToDb } from '@/lib/server/userActions';
import { ok, serverError, badRequest } from '@/lib/http';
import { authenticateClaims, forbiddenResponse } from '@/lib/routeAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateClaims(request);
    if (auth.response) return auth.response;
    const { claims } = auth;

    let body;

    // Handle potential empty body or malformed JSON
    try {
      const text = await request.text();
      if (!text.trim()) {
        return badRequest('Request body is empty');
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return badRequest('Invalid JSON in request body');
    }

    const { auth0User } = body;

    if (!auth0User || !auth0User.sub) {
      return badRequest('Auth0 user data is required');
    }

    // The record is always the caller's own; identity, email and picture come
    // from the verified token rather than the request body.
    if (auth0User.sub !== claims.sub) {
      return forbiddenResponse();
    }

    const result = await addUserToDb({
      sub: claims.sub,
      email: claims.email,
      name: auth0User.name ?? claims.name,
      picture: claims.picture,
    });

    if (result.success) {
      return ok(result);
    } else {
      return serverError(result.error || 'Failed to set up user');
    }
  } catch (error) {
    console.error('Error in user setup API:', error);
    return serverError('Failed to set up user');
  }
}
