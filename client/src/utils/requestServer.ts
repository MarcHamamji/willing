interface RequestServerOptions {
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
  includeJwt?: boolean;
}

export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL ?? 'http://localhost:9090';

export default async function requestServer<ReturnType>(path: string, { body, method = 'GET', includeJwt = false, query }: RequestServerOptions) {
  const headers = new Headers();
  const options: RequestInit = {
    method,
    headers,
  };

  if (includeJwt) {
    headers.append('Authorization', 'Bearer ' + localStorage.getItem('jwt'));
  }

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers.append('Content-Type', 'application/json');
    options.body = JSON.stringify(body);
  }

  let url = SERVER_BASE_URL;
  url += path;
  if (query) {
    url += '?';
    url += (new URLSearchParams(query)).toString();
  }

  const response = await fetch(url, options);
  const json = await response.json();

  if (response.status >= 400) {
    throw new Error(json.message, { cause: response });
  }

  return json as ReturnType;
}
