import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useAlerts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => api.alerts.list(params),
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every minute for new alerts
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.alerts.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.alerts.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
