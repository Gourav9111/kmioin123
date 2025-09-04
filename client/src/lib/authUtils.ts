export function isUnauthorizedError(error: Error): boolean {
  return error.message === "Unauthorized" || 
         error.message === "Authentication required" ||
         (error as any).status === 401;
}

export const loginWithReplit = () => {
  window.location.href = '/api/login';
};

export const logoutFromReplit = () => {
  window.location.href = '/api/logout';
};

export const checkAuthStatus = async () => {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
};