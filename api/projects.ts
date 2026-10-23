/** GET, PUT and DELETE /api/projects — the signed-in person's saved designs. See api/_accounts. */
import { defaultLimits, handleProjects } from './_accounts/handlers.js';
import { backendFromEnv } from './_accounts/supabase.js';

const limits = defaultLimits();

const handle = (req: Request) => handleProjects(req, { backend: backendFromEnv(), ...limits });
export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
