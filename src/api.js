const BASE_URL = 'http://52.6.166.111:8081';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (res.status === 204 || !text) return null;
  let data;
  try { data = JSON.parse(text); } catch { throw { status: res.status, message: text }; }
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// Auth
export const authAPI = {
  register: (name, email, password) =>
    request('POST', '/backend/auth/register', { name, email, password }),
  login: (email, password) =>
    request('POST', '/backend/auth/login', { email, password }),
  getMe: (token) =>
    request('GET', '/backend/auth/me', null, token),
  updateMe: (token, data) =>
    request('PUT', '/backend/auth/me', data, token),
};

// Products
export const productsAPI = {
  getAll: () =>
    request('GET', '/backend/products'),
  getOne: (id) =>
    request('GET', `/backend/products/${id}`),
  create: (token, data) =>
    request('POST', '/backend/products', data, token),
  update: (token, id, data) =>
    request('PUT', `/backend/products/${id}`, data, token),
  remove: (token, id) =>
    request('DELETE', `/backend/products/${id}`, null, token),
};

// Basket
export const basketAPI = {
  get: (token) =>
    request('GET', '/backend/basket', null, token),
  addItem: (token, productId, quantity = 1) =>
    request('POST', '/backend/basket/items', { productId, quantity }, token),
  setQuantity: (token, productId, quantity) =>
    request('PUT', `/backend/basket/items/${productId}`, { quantity }, token),
  removeItem: (token, productId) =>
    request('DELETE', `/backend/basket/items/${productId}`, null, token),
  clear: (token) =>
    request('DELETE', '/backend/basket', null, token),
};

// Orders
export const ordersAPI = {
  getAll: (token, status) =>
    request('GET', `/backend/orders${status ? `?status=${status}` : ''}`, null, token),
  getOne: (token, id) =>
    request('GET', `/backend/orders/${id}`, null, token),
  create: (token, deliveryAddress, notes = '', skipApproval = false) =>
    request('POST', '/backend/orders', { deliveryAddress, notes, skipApproval }, token),
  uploadPhoto: (token, id, photo) =>
    request('PUT', `/backend/orders/${id}/photo`, { photo }, token),
  approve: (token, id, approved) =>
    request('PUT', `/backend/orders/${id}/approval`, { approved }, token),
  setStatus: (token, id, status) =>
    request('PUT', `/backend/orders/${id}/status`, { status }, token),
  setTracking: (token, id, trackingNumber) =>
    request('PUT', `/backend/orders/${id}/tracking`, { trackingNumber }, token),
  getTracking: (token, id) =>
    request('GET', `/backend/orders/${id}/tracking`, null, token),
};

// Messages
export const messagesAPI = {
  get: (token, orderId) =>
    request('GET', `/backend/orders/${orderId}/messages`, null, token),
  send: (token, orderId, text) =>
    request('POST', `/backend/orders/${orderId}/messages`, { text }, token),
};

// Recipes
export const recipesAPI = {
  fromCart: (token) =>
    request('GET', '/backend/recipes/from-cart', null, token),
  getByName: (token, name) =>
    request('GET', `/backend/recipes/${encodeURIComponent(name)}`, null, token),
};

// Specials
export const specialsAPI = {
  get: (token) =>
    request('GET', '/backend/specials', null, token),
  regenerate: (token) =>
    request('POST', '/backend/specials/regenerate', null, token),
};

// Chat
export const chatAPI = {
  send: (token, messages) =>
    request('POST', '/backend/chat', { messages }, token),
};
