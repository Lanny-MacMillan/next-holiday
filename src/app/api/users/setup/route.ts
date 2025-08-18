import { NextRequest } from "next/server";
import { addUserToDb } from "@/lib/server/userActions";
import { ok, serverError, badRequest } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auth0User } = body;

    if (!auth0User || !auth0User.sub) {
      return badRequest("Auth0 user data is required");
    }

    const result = await addUserToDb(auth0User);
    
    if (result.success) {
      return ok(result);
    } else {
      return serverError(result.error || "Failed to set up user");
    }
  } catch (error) {
    console.error("Error in user setup API:", error);
    return serverError("Failed to set up user");
  }
}
