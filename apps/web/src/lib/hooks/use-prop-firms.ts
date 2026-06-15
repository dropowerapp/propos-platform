import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function usePropFirms(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['prop-firms', params],
    queryFn: () => api.propFirms.list(params),
    staleTime: 5 * 60_000,
  });
}

export function usePropFirm(slug: string) {
  return useQuery({
    queryKey: ['prop-firms', slug],
    queryFn: () => api.propFirms.get(slug),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}

export function useFirmRecommendations() {
  return useQuery({
    queryKey: ['prop-firms', 'recommendations'],
    queryFn: () => api.propFirms.recommendations(),
    staleTime: 10 * 60_000,
  });
}

export function useFirmReviews(slug: string) {
  return useQuery({
    queryKey: ['prop-firms', slug, 'reviews'],
    queryFn: () => api.propFirms.reviews(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

// Firms the signed-in user owns an account with — eligible for a verified review
export function useReviewEligibility() {
  return useQuery({
    queryKey: ['prop-firms', 'review-eligibility'],
    queryFn: () => api.propFirms.reviewEligibility(),
    staleTime: 60_000,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: unknown }) =>
      api.propFirms.createReview(slug, body),
    onSuccess: (_data, { slug }) => {
      qc.invalidateQueries({ queryKey: ['prop-firms', slug, 'reviews'] });
      qc.invalidateQueries({ queryKey: ['prop-firms'] });
    },
  });
}
