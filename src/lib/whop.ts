const whopAppId =
  process.env.NEXT_PUBLIC_WHOP_APP_ID ||
  "";

export function getWhopAppId(): string {
  return whopAppId;
}

export function isWhopConfigured(): boolean {
  return Boolean(whopAppId);
}

export function getWhopAppUrl(): string {
  if (!whopAppId) {
    return "https://whop.com";
  }

  return `https://whop.com/apps/${whopAppId}`;
}

export function getWhopInstallUrl(): string {
  if (!whopAppId) {
    return "https://whop.com/dashboard/developer";
  }

  return `https://whop.com/apps/${whopAppId}/install`;
}

export function getWhopPermissionsUrl(): string {
  return "https://whop.com/dashboard/developer";
}
