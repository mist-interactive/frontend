import { HttpStatus } from '../utils/httpStatus';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // get token
  let token = localStorage.getItem("token");

  // intialize headers object
  const headers = new Headers(options.headers || {});

  // add Authorization key
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // update with new headers
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // execute old request
  let response = await fetch(url, fetchOptions);

  // if not 401 return reposne normally
  if (response.status !== HttpStatus.UNAUTHORIZED) {
    return response;
  }

  // if 401 (jwt expired), try silent refresh 
  try {
    const renewResponse = await fetch('/api/renew', {
          method: "POST",
      });

    if (renewResponse.ok) {
      // take new token
      const data = await renewResponse.json();
      
      // extract the token and explicitly type it as a string
      const newToken: string = data.token;
      
      // save to local storage
      localStorage.setItem("token", newToken);

      // update the original variable and the headers for the retry
      token = newToken;
      headers.set("Authorization", `Bearer ${token}`);
      
      const retryOptions: RequestInit = {
        ...options,
        headers,
      };

      // execute original request again with the new token
      response = await fetch(url, retryOptions);
      return response;
    } else {
      // session token expired
      throw new Error("Session expired");
    }
  } catch (error) {
    // clean token, and redirect to login page
    localStorage.removeItem("token");
    window.location.href = "/login";
    
    // return the old response
    return response;
  }
}