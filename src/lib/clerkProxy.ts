export const CLERK_PROXY_PATH = "/__clerk";

export function getClerkProxyUrl(publishableKey: string | undefined): string | undefined {
  // Clerk development instances cannot use a proxy. Preview builds also run in
  // NODE_ENV=production, so select by instance key instead of the build mode.
  return publishableKey?.startsWith("pk_live_") ? CLERK_PROXY_PATH : undefined;
}
