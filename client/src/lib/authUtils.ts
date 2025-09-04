export function isUnauthorizedError(error: Error): boolean {
  return error.message === "Unauthorized" || 
         error.message === "Authentication required" ||
         (error as any).status === 401;
}
