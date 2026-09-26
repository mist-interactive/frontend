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
    console.error('Failed to parse jwt:', error);
    return null;
  }
}

// save auth token and user claims to local storage
export function setAuth(token: string): boolean {
  try {
    localStorage.setItem('token', token);
    const claims = parseJwtSafe(token);
    if (claims) {
      localStorage.setItem('user_id', String(claims.user_id));
      localStorage.setItem('username', claims.username);
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

// clear all items from local storage on logout
export function clearAuth(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear auth:', error);
  }
}
