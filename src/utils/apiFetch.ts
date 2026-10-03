import { HttpStatus } from '../utils/httpStatus';
import { getValidToken, renewToken, clearAuth } from './auth';

// wrapper around fetch that adds auth header and auto-renews token
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // get valid token, auto-renewing if expired or close to expiring
  let token = await getValidToken();

  // initialize headers object
  const headers = new Headers(options.headers || {});

  // add authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // update options with headers
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // execute original request
  let response = await fetch(url, fetchOptions);

  // if not 401 return response normally
  if (response.status !== HttpStatus.UNAUTHORIZED) {
    return response;
  }

  // if 401 returned, try silent renewal
  try {
    const newToken = await renewToken();
    if (!newToken) {
      throw new Error("session expired");
    }

    // retry request with renewed token
    headers.set("Authorization", `Bearer ${newToken}`);
    const retryOptions: RequestInit = {
      ...options,
      headers,
    };

    return await fetch(url, retryOptions);
  } catch (error) {
    // on failure clear auth state and redirect to login
    clearAuth();
    window.location.href = "/login";

    // return original response
    return response;
  }
}