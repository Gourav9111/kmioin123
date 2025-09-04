
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
  };
  token: string;
}

export function isUnauthorizedError(error: Error): boolean {
  return error.message === "Unauthorized" || 
         error.message === "Authentication required" ||
         (error as any).status === 401;
}

export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const result = await response.json();
  setToken(result.token);
  return result;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  const result = await response.json();
  setToken(result.token);
  return result;
};

export const logout = (): void => {
  removeToken();
  window.location.href = '/';
};

export const checkAuthStatus = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    if (response.status === 401 || response.status === 403) {
      removeToken();
    }
    
    return null;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
};
