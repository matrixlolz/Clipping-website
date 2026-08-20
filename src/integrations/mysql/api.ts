// API client for MySQL backend
// Since MySQL can't run in browser, we call backend API endpoints

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Helper to get auth token
function getAuthToken(): string | null {
  // Try both possible token keys for compatibility
  return localStorage.getItem('apex_auth_token') || localStorage.getItem('access_token');
}

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Try to get error message from response
    let errorData;
    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : { error: 'Request failed' };
    } catch {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T;
  }

  // Get response text first
  const text = await response.text();
  
  // Handle empty text
  if (!text || text.trim() === '') {
    return null as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error, 'Response text:', text.substring(0, 200));
    throw new Error(`Invalid JSON response from server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Query helper (for SELECT)
export async function query<T = any>(
  table: string,
  filters?: Record<string, any>,
  orderBy?: string
): Promise<T[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }
  
  if (orderBy) {
    params.append('orderBy', orderBy);
  }

  return apiCall<T[]>(`/${table}?${params.toString()}`);
}

// Get single record
export async function get<T = any>(
  table: string,
  id: string
): Promise<T> {
  return apiCall<T>(`/${table}/${id}`);
}

// Insert helper
export async function insert<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  return apiCall<T>(`/${table}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update helper
export async function update<T = any>(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<T> {
  return apiCall<T>(`/${table}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Delete helper
export async function remove(
  table: string,
  id: string
): Promise<void> {
  return apiCall<void>(`/${table}/${id}`, {
    method: 'DELETE',
  });
}

// Custom query (for complex queries)
export async function customQuery<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  return apiCall<T[]>('/query', {
    method: 'POST',
    body: JSON.stringify({ sql, params }),
  });
}

export const mysqlApi = {
  query,
  get,
  insert,
  update,
  remove,
  customQuery,
  // Auth endpoints
  auth: {
    signUp: (email: string, password: string, fullName: string, role: string) =>
      apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, role }),
      }),
    signIn: (email: string, password: string) =>
      apiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getUser: () =>
      apiCall('/auth/user', {
        method: 'GET',
      }),
  },
  // Profile endpoints
  profiles: {
    getById: (id: string) =>
      apiCall(`/profiles/${id}`, {
        method: 'GET',
      }),
    update: (id: string, updates: Record<string, any>) =>
      apiCall(`/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },
  // User roles endpoints
  userRoles: {
    getByUserId: (userId: string) =>
      apiCall(`/user-roles/${userId}`, {
        method: 'GET',
      }),
  },
  // Expose apiCall for custom endpoints
  apiCall: async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return apiCall<T>(endpoint, options);
  },
  // Social accounts endpoints
  socialAccounts: {
    getMine: () =>
      apiCall('/social-accounts/mine', {
        method: 'GET',
      }),
    getAll: () =>
      apiCall('/social-accounts', {
        method: 'GET',
      }),
    create: (data: Record<string, any>) =>
      apiCall('/social-accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: Record<string, any>) =>
      apiCall(`/social-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      apiCall(`/social-accounts/${id}`, {
        method: 'DELETE',
      }),
  },
  // Settings endpoints
  settings: {
    get: () =>
      apiCall('/settings', {
        method: 'GET',
      }),
    update: (updates: Record<string, any>) =>
      apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },
  // Account endpoints
  account: {
    delete: () =>
      apiCall('/auth/account', {
        method: 'DELETE',
      }),
  },
  // Campaigns endpoints
  campaigns: {
    getFiltered: (filters?: Record<string, any>) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });
      }
      return apiCall(`/campaigns?${params.toString()}`, {
        method: 'GET',
      });
    },
    getById: (id: string) =>
      apiCall(`/campaigns/${id}`, {
        method: 'GET',
      }),
    create: (data: Record<string, any>) =>
      apiCall('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, updates: Record<string, any>) =>
      apiCall(`/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },
};

