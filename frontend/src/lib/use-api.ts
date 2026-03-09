"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
  [key: string]: string | number | undefined;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

function buildUrl(path: string, params?: PaginationParams): string {
  const queryString = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return queryString ? `${path}?${queryString}` : path;
}

export function useApiList<T>(path: string, params?: PaginationParams) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["api-list", path, params];

  const { data, isLoading, error, refetch: rqRefetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = buildUrl(path, params);
      const result = await api<{ data: T[]; total?: number; pagination?: PaginationInfo } | T[]>(url, { token: token! });
      if (Array.isArray(result)) {
        return { data: result, pagination: null };
      }
      const pagination = result.pagination ?? (result.total !== undefined ? {
        total: result.total,
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      } : null);
      return { data: result.data ?? [], pagination };
    },
    enabled: !!token,
  });

  const refetch = useCallback(async (overrideParams?: PaginationParams) => {
    if (overrideParams) {
      const merged = { ...params, ...overrideParams };
      const mergedKey = ["api-list", path, merged];
      await queryClient.invalidateQueries({ queryKey: mergedKey });
    } else {
      await rqRefetch();
    }
  }, [params, path, queryClient, rqRefetch]);

  return {
    data: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}

export function useApiGet<T>(path: string | null) {
  const { token } = useAuth();

  const { data, isLoading, error, refetch: rqRefetch } = useQuery({
    queryKey: ["api-get", path],
    queryFn: async () => {
      const res = await api<T>(path!, { token: token! });
      return res;
    },
    enabled: !!token && !!path,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: rqRefetch,
  };
}

export function useApiMutation<TReq, TRes = unknown>(
  path: string,
  method: string = "POST"
) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: TReq) => {
      if (!token) throw new Error("Not authenticated");
      return api<TRes>(path, { method, body, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-list"] });
    },
  });

  return {
    mutate: async (body: TReq): Promise<TRes | null> => {
      try {
        return await mutation.mutateAsync(body);
      } catch (err) {
        throw err;
      }
    },
    isSubmitting: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : mutation.error ? String(mutation.error) : null,
  };
}
