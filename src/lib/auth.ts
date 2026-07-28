// Shared between proxy.ts and the login Server Action — kept out of
// actions.ts because a "use server" file may only export async functions.
export const SITE_AUTH_COOKIE = "site_auth";
