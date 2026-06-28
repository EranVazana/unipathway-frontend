const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// Reads the logged-in user from localStorage so every request can identify itself
// to the backend via x-user-id / x-user-role (the backend has no real tokens).
function getAuthHeaders() {
  const stored = localStorage.getItem('unipathway_user');
  if (!stored) return {};

  try {
    const user = JSON.parse(stored);
    return {
      'x-user-id': String(user.userId),
      'x-user-role': user.userRole
    };
  } catch {
    return {};
  }
}

// Core request helper. Unwraps the backend's { success, data, error } envelope
// and throws on failure so callers can use try/catch instead of checking success each time.
async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  // Backend may return non-JSON on network-level failures; guard against that
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Server returned an invalid response.');
  }

  if (!payload.success) {
    const message = payload.error?.message || 'Request failed.';
    const error = new Error(message);
    error.code = payload.error?.code;
    error.details = payload.error?.details;
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

export const apiClient = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' })
};