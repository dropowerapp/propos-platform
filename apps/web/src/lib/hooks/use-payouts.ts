import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function usePayouts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['payouts', params],
    queryFn: () => api.payouts.list(params),
    staleTime: 60_000,
  });
}

export function useRoiSummary() {
  return useQuery({
    queryKey: ['payouts', 'roi-summary'],
    queryFn: () => api.payouts.roiSummary(),
    staleTime: 60_000,
  });
}

export function useCreatePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.payouts.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] });
      qc.invalidateQueries({ queryKey: ['portfolio-summary'] });
    },
  });
}
