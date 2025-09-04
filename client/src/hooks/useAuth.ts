
import { useQuery } from "@tanstack/react-query";
import { checkAuthStatus } from "@/lib/authUtils";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: checkAuthStatus,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAuthenticated = !!user && !error;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    refetch,
  };
}
