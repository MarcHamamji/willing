export default async function requestServer<ReturnType>(path: string, request?: RequestInit, includeJwt?: boolean) {
  let options = request;
  if (includeJwt) {
    if (!options) {
      options = {};
    }
    if (!options.headers) {
      options.headers = {};
    }
    options.headers = new Headers(options.headers);
    options.headers.append('authorization', 'Bearer ' + localStorage.getItem('jwt'));
  }

  const response = await fetch('http://localhost:9090' + path, options);
  const json = await response.json();

  if (response.status >= 400) {
    throw new Error(json.message, { cause: response });
  }

  return json as ReturnType;
}
