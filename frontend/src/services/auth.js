import { apiRequest } from './api';

export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getCurrentUser() {
  return apiRequest('/auth/me', {
    method: 'GET',
  });
}

export default {
  login,
  register,
  getCurrentUser,
};
