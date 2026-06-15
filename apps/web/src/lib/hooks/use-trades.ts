import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useTrades(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['trades', params],
    queryFn: () => api.trades.list(params),
    staleTime: 30_000,
  });
}

export function useTrade(id: string) {
  return useQuery({
    queryKey: ['trades', id],
    queryFn: () => api.trades.get(id),
    enabled: !!id,
  });
}

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.trades.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.trades.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
