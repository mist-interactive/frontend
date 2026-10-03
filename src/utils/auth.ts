// safe base64url and utf-8 jwt parser
export function parseJwtSafe(token: string): { user_id: number; username: string; [key: string]: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    // convert base64url to standard base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    // add padding if missing
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }

    // decode binary string and safely decode multi-byte utf-8 characters
    const decodedBinary = atob(base64);
    const jsonPayload = decodeURIComponent(
      decodedBinary
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    return {
      ...parsed,
      user_id: Number(parsed.user_id),
      username: parsed.username || '',
    };
  } catch (error) {
    console.error('failed to parse jwt:', error);
    return null;
  }
}

// storage keys used by the auth system
const AUTH_STORAGE_KEYS = ['token', 'user_id', 'username'] as const;

// background auto renewal timer reference
let autoRenewTimer: ReturnType<typeof setTimeout> | null = null;

// single shared promise for in-flight renewals so we avoid duplicate requests
let renewPromise: Promise<string | null> | null = null;

// stops background auto renewal timer
export function stopAutoRenew(): void {
  if (autoRenewTimer) {
    clearTimeout(autoRenewTimer);
    autoRenewTimer = null;
  }
}

// schedules background token renewal 60 seconds before it expires
export function scheduleAutoRenew(token?: string): void {
  stopAutoRenew();

  const currentToken = token || localStorage.getItem('token');
  if (!currentToken) return;

  const claims = parseJwtSafe(currentToken);
  if (!claims?.exp) return;

  const nowMs = Date.now();
  const expMs = claims.exp * 1000;

  // trigger renewal 60 seconds before expiration, with a minimum 5 second delay
  const renewInMs = Math.max(expMs - nowMs - 60000, 5000);

  autoRenewTimer = setTimeout(async () => {
    const newToken = await renewToken();
    if (!newToken) {
      console.warn('background auto renewal failed: session cookie may be expired');
    }
  }, renewInMs);
}

// silent token renewal using httponly session cookie
export async function renewToken(): Promise<string | null> {
  // if renewal is already in progress, return the existing promise
  if (renewPromise) {
    return renewPromise;
  }

  renewPromise = (async () => {
    try {
      const res = await fetch('/api/renew', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setAuth(data.token);
          return data.token;
        }
      }
    } catch (error) {
      console.error('failed to renew token:', error);
    } finally {
      renewPromise = null;
    }
    return null;
  })();

  return renewPromise;
}

// retrieves a valid token, auto-renewing if missing, expired, or expiring within 60s
export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const claims = parseJwtSafe(token);
  const nowSec = Math.floor(Date.now() / 1000);

  // if token has no expiration or expires within 60 seconds, renew it
  if (!claims?.exp || claims.exp <= nowSec + 60) {
    const renewed = await renewToken();
    return renewed || token;
  }

  return token;
}

// save auth token and user claims to local storage and schedule auto renewal
export function setAuth(token: string): boolean {
  try {
    localStorage.setItem('token', token);
    const claims = parseJwtSafe(token);
    if (claims) {
      localStorage.setItem('user_id', String(claims.user_id));
      localStorage.setItem('username', claims.username);
      scheduleAutoRenew(token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// retrieve current authenticated user details from storage or token fallback
export function getAuthUser(): { userId: number; username: string } | null {
  try {
    let userIdStr = localStorage.getItem('user_id');
    let username = localStorage.getItem('username');

    // fallback for existing sessions: parse once and cache in local storage
    if (!userIdStr || !username) {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const claims = parseJwtSafe(token);
      if (!claims) return null;

      userIdStr = String(claims.user_id);
      username = claims.username;
      localStorage.setItem('user_id', userIdStr);
      localStorage.setItem('username', username);
    }

    const userId = Number(userIdStr);
    if (isNaN(userId) || !username) return null;

    return { userId, username };
  } catch {
    return null;
  }
}

// clear auth credentials from local storage and stop auto renewal
export function clearAuth(): void {
  try {
    stopAutoRenew();
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('failed to clear auth:', error);
  }
}

// check if user has a token saved
export function isAuthenticated(): boolean {
  return localStorage.getItem('token') !== null;
}

// sets up listeners for window focus and tab visibility to handle waking up from sleep
let listenersAttached = false;
export function initAuthSession(): void {
  // schedule renewal for existing token in storage
  const token = localStorage.getItem('token');
  if (token) {
    scheduleAutoRenew(token);
  }

  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  // when tab becomes visible or gains focus, verify token is still fresh
  const checkFreshness = () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    const claims = parseJwtSafe(currentToken);
    const nowSec = Math.floor(Date.now() / 1000);

    // if expired or expiring within 60 seconds, renew immediately
    if (!claims?.exp || claims.exp <= nowSec + 60) {
      renewToken();
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkFreshness();
    }
  });

  window.addEventListener('focus', checkFreshness);
}

// initialize listeners and timers immediately on module load in browser
if (typeof window !== 'undefined') {
  initAuthSession();
}

