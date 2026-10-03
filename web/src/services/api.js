const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const PROFILE_KEY = 'up-tamha-profile-id';

export function getProfileId() {
  return window.localStorage.getItem(PROFILE_KEY);
}

export function setProfileId(profileId) {
  if (profileId) window.localStorage.setItem(PROFILE_KEY, profileId);
  else window.localStorage.removeItem(PROFILE_KEY);
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const profileId = getProfileId();
  if (profileId) headers.set('X-Profile-Id', profileId);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'ไม่สามารถเชื่อมต่อระบบได้');
    error.code = body.error;
    error.status = response.status;
    throw error;
  }
  return body;
}

export function imageUrl(imageId) {
  return `${API_BASE}/items/images/${imageId}/content`;
}

export function profileAvatarUrl(profileId) {
  return `${API_BASE}/profiles/${profileId}/avatar`;
}

