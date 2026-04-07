const BASE_URL = 'http://localhost:3000';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) =>
    request('POST', '/api/auth/register', { name, email, password }),
  login: (email, password) =>
    request('POST', '/api/auth/login', { email, password }),
  getMe: (token) =>
    request('GET', '/api/auth/me', null, token),
  updateMe: (token, data) =>
    request('PUT', '/api/auth/me', data, token),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: () =>
    request('GET', '/api/products'),
  getOne: (id) =>
    request('GET', `/api/products/${id}`),
  create: (token, data) =>
    request('POST', '/api/products', data, token),
  update: (token, id, data) =>
    request('PUT', `/api/products/${id}`, data, token),
  remove: (token, id) =>
    request('DELETE', `/api/products/${id}`, null, token),
};

// ── Basket ────────────────────────────────────────────────────────────────────
export const basketAPI = {
  get: (token) =>
    request('GET', '/api/basket', null, token),
  addItem: (token, productId, quantity = 1) =>
    request('POST', '/api/basket/items', { productId, quantity }, token),
  setQuantity: (token, productId, quantity) =>
    request('PUT', `/api/basket/items/${productId}`, { quantity }, token),
  removeItem: (token, productId) =>
    request('DELETE', `/api/basket/items/${productId}`, null, token),
  clear: (token) =>
    request('DELETE', '/api/basket', null, token),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (token, status) =>
    request('GET', `/api/orders${status ? `?status=${status}` : ''}`, null, token),
  getOne: (token, id) =>
    request('GET', `/api/orders/${id}`, null, token),
  create: (token, deliveryAddress, notes, skipApproval = false) =>
    request('POST', '/api/orders', { deliveryAddress, notes, skipApproval }, token),
  uploadPhoto: (token, id, photo) =>
    request('PUT', `/api/orders/${id}/photo`, { photo }, token),
  approve: (token, id, approved) =>
    request('PUT', `/api/orders/${id}/approval`, { approved }, token),
  setStatus: (token, id, status) =>
    request('PUT', `/api/orders/${id}/status`, { status }, token),
  getTracking: (token, id) =>
    request('GET', `/api/orders/${id}/tracking`, null, token),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesAPI = {
  get: (token, orderId) =>
    request('GET', `/api/orders/${orderId}/messages`, null, token),
  send: (token, orderId, text) =>
    request('POST', `/api/orders/${orderId}/messages`, { text }, token),
};

// ── Recipes ───────────────────────────────────────────────────────────────────
export const recipesAPI = {
  fromCart: (token) =>
    request('GET', '/api/recipes/from-cart', null, token),
  getByName: (token, name) =>
    request('GET', `/api/recipes/${encodeURIComponent(name)}`, null, token),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (token, messages) =>
    request('POST', '/api/chat', { messages }, token),
};
