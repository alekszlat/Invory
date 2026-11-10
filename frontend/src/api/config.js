export const apiMode = import.meta.env?.VITE_API_MODE ?? 'mock';
// The trailing slash is removed because every request path starts with "/".
export const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');

if (!['mock', 'api'].includes(apiMode)) throw new Error('VITE_API_MODE трябва да бъде mock или api.');
