export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'nb-secure-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

export const SESSION_KEY = 'nb_crm_session';

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    lang_pref: user.lang_pref || 'FR',
    savedAt: Date.now(),
  }));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Session expires after 8 hours
    if (Date.now() - session.savedAt > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
