// ======================
// Memorial Query Hooks
// React Query hooks for memorial data
// ======================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memorial } from "@/lib/supabase/types";

// ======================
// Query Keys
// ======================

export const memorialKeys = {
  all: ["memorials"] as const,
  lists: () => [...memorialKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...memorialKeys.lists(), filters] as const,
  details: () => [...memorialKeys.all, "detail"] as const,
  detail: (id: string) => [...memorialKeys.details(), id] as const,
  bySlug: (slug: string) => [...memorialKeys.all, "slug", slug] as const,
};

// ======================
// API Functions
// ======================

async function fetchMemorials(): Promise<{ memorials: Memorial[] }> {
  const response = await fetch("/api/memorials");
  if (!response.ok) {
    throw new Error("Failed to fetch memorials");
  }
  return response.json();
}

async function fetchMemorial(id: string): Promise<{ memorial: Memorial }> {
  const response = await fetch(`/api/memorials/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch memorial");
  }
  return response.json();
}

interface CreateMemorialData {
  firstName: string;
  lastName: string;
  middleName?: string;
  nickname?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  restingPlace?: string;
  obituary?: string;
  isPublic?: boolean;
  inviteEmails?: string[];
}

async function createMemorial(
  data: CreateMemorialData
): Promise<{ memorial: Memorial; slug: string }> {
  const response = await fetch("/api/memorials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create memorial");
  }
  return response.json();
}

interface UpdateMemorialData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nickname?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  restingPlace?: string;
  obituary?: string;
  isPublic?: boolean;
}

async function updateMemorial(
  id: string,
  data: UpdateMemorialData
): Promise<{ memorial: Memorial }> {
  const response = await fetch(`/api/memorials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update memorial");
  }
  return response.json();
}

async function deleteMemorial(id: string): Promise<void> {
  const response = await fetch(`/api/memorials/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete memorial");
  }
}

// ======================
// Query Hooks
// ======================

/**
 * Fetch all memorials for the current user
 */
export function useMemorials() {
  return useQuery({
    queryKey: memorialKeys.lists(),
    queryFn: fetchMemorials,
    select: (data) => data.memorials,
  });
}

/**
 * Fetch a single memorial by ID
 */
export function useMemorial(id: string | undefined) {
  return useQuery({
    queryKey: memorialKeys.detail(id!),
    queryFn: () => fetchMemorial(id!),
    enabled: !!id,
    select: (data) => data.memorial,
  });
}

// ======================
// Mutation Hooks
// ======================

/**
 * Create a new memorial
 */
export function useCreateMemorial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMemorial,
    onSuccess: () => {
      // Invalidate memorials list to refetch
      queryClient.invalidateQueries({ queryKey: memorialKeys.lists() });
    },
  });
}

/**
 * Update an existing memorial
 */
export function useUpdateMemorial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemorialData }) =>
      updateMemorial(id, data),
    onSuccess: (result, { id }) => {
      // Update cache directly
      queryClient.setQueryData(memorialKeys.detail(id), result);
      // Also invalidate the list
      queryClient.invalidateQueries({ queryKey: memorialKeys.lists() });
    },
  });
}

/**
 * Delete a memorial
 */
export function useDeleteMemorial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMemorial,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: memorialKeys.detail(id) });
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: memorialKeys.lists() });
    },
  });
}

// ======================
// Prefetch Functions
// ======================

/**
 * Prefetch memorials for faster initial load
 */
export function usePrefetchMemorials() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: memorialKeys.lists(),
      queryFn: fetchMemorials,
    });
  };
}

/**
 * Prefetch a specific memorial
 */
export function usePrefetchMemorial() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: memorialKeys.detail(id),
      queryFn: () => fetchMemorial(id),
    });
  };
}
