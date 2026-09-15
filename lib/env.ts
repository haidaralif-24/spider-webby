/**
 * Server-side environment access.
 *
 * **Server-only.** This reads `process.env` with a dynamic key, which Next's
 * bundler cannot inline — so importing it from a client component would hand the
 * browser `undefined` rather than a value. Client-readable variables must be
 * referenced literally (`process.env.NEXT_PUBLIC_X`) at their use site; see
 * `lib/cloudinary.ts` for the pattern.
 *
 * Failing loudly here is deliberate. A missing Supabase URL should be a clear
 * error at the boundary, not a `undefined` that surfaces three calls later as a
 * confusing network failure.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}
