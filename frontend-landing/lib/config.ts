/**
 * URL of the frontend-app (auth, dashboard, etc.)
 * In development: http://localhost:3000
 * In production: set NEXT_PUBLIC_APP_URL to our app domain
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const APP_ROUTES = {
  register: `${APP_URL}/auth/register`,
  registerClub: `${APP_URL}/auth/register/club`,
  registerManager: `${APP_URL}/auth/register/manager`,
}
