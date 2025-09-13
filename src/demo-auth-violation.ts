// DEMO: This file intentionally violates Auth v2 protection rules
// It should be blocked by the auth-static-guards check

import { useState } from 'react';

// VIOLATION 1: Absolute URL in auth-related code
const AUTH_BASE_URL = 'https://api.example.com/auth';

// VIOLATION 2: Authorization header usage (should use cookies only)
const authHeaders = {
  'Authorization': 'Bearer some-token',
  'Content-Type': 'application/json'
};

// VIOLATION 3: Token storage in localStorage (should use cookies only)
export const saveAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  sessionStorage.setItem('refresh_token', token);
};

// VIOLATION 4: Throwing on /api/auth/me 401 (should treat as valid unauthenticated state)
export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/me');
    if (response.status === 401) {
      throw new Error('AUTH_REQUIRED'); // This should NOT throw
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

// This file demonstrates multiple Auth v2 protection violations:
// 1. Absolute URLs in auth code
// 2. Authorization/Bearer headers  
// 3. Token storage in localStorage/sessionStorage
// 4. Throwing on /me 401 responses
//
// The auth-static-guards check should detect these patterns and block the PR.

