import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useAnalyticsOverview(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['analytics', 'overview', params],
    queryFn: () => api.analytics.overview(params),
    // API wraps the payload as { data: {...} } — unwrap so consumers read flat fields
    select: (res: any) => res?.data ?? res ?? {},
    staleTime: 60_000,
  });
}

export function useAnalyticsBreakdown(groupBy: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['analytics', 'breakdown', groupBy, params],
    queryFn: () => api.analytics.breakdown(groupBy, params),
    // Unwrap { data: [...] } → the rows array
    select: (res: any) => res?.data ?? res?.rows ?? res ?? [],
    staleTime: 60_000,
  });
}
