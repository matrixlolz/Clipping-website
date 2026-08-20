# Whop App Setup

Use this checklist when configuring the app in Whop.

## 1) Set app ID locally

- In `.env`, set `VITE_WHOP_APP_ID` to your Whop app ID (`app_...`).
- Restart `npm run dev` after env changes.

## 2) Configure permissions in Whop dashboard

1. Open `https://whop.com/dashboard/developer`
2. Select your app
3. Go to **Permissions**
4. Add required permissions for the API calls you use
5. Add justification text for each permission
6. Save

## 3) Install with direct install link

Use the Whop direct install URL format:

`https://whop.com/apps/<app_id>/install`

This app now uses that pattern in `getWhopInstallUrl()`.

## 4) Re-approve after permission changes

If you add permissions later, existing installs must re-approve them from Whop settings before those new API calls will work.
