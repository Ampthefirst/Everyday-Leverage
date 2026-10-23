/**
 * GET /api/auth — is sign-in available, and who is signed in. POST — sign up, sign in, sign out.
 * Logic lives in api/_accounts (files starting with _ are not routes); see docs/accounts-setup.md.
 */
import { defaultLimits, handleAuth } from './_accounts/handlers.js';
import { backendFromEnv } from './_accounts/supabase.js';

const limits = defaultLimits();

export const GET = (req: Request) => handleAuth(req, { backend: backendFromEnv(), ...limits });
export const POST = GET;
