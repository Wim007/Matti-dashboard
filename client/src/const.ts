export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Interne loginpagina met wachtwoord — de externe Manus OAuth-portal
// (VITE_OAUTH_PORTAL_URL) is niet meer bereikbaar en wordt niet meer gebruikt.
export const getLoginUrl = () => "/login";
