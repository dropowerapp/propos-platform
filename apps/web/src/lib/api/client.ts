const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function getToken(): Promise<string | null> {
  try {
    // Clerk loads itself onto window.Clerk after ClerkProvider mounts.
    // On a fresh page load the first queries can fire before Clerk is ready,
    // so poll briefly (up to ~3s) for the session before giving up.
    for (let i = 0; i < 30; i++) {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        return await clerk.session.getToken();
      }
      if (clerk?.loaded && !clerk.session) {
        return null; // Clerk ready but signed out — no token to wait for
      }
      await new Promise(r => setTimeout(r, 100));
    }
  } catch {
    // SSR or Clerk not initialised — degrade gracefully
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error?.message ?? res.statusText);
  }

  return res.json();
}

export const api = {
  // ─── Trades ──────────────────────────────────────────────────────────────
  trades: {
    list: (params?: Record<string, string>) =>
      request<any>(`/trades?${new URLSearchParams(params ?? {})}`),
    get: (id: string) => request<any>(`/trades/${id}`),
    create: (body: unknown) => request<any>('/trades', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => request<any>(`/trades/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/trades/${id}`, { method: 'DELETE' }),
  },

  // ─── Analytics ───────────────────────────────────────────────────────────
  analytics: {
    overview: (params?: Record<string, string>) =>
      request<any>(`/analytics/overview?${new URLSearchParams(params ?? {})}`),
    breakdown: (groupBy: string, params?: Record<string, string>) =>
      request<any>(`/analytics/breakdown?groupBy=${groupBy}&${new URLSearchParams(params ?? {})}`),
  },

  // ─── Journal ─────────────────────────────────────────────────────────────
  journal: {
    list: (params?: Record<string, string>) =>
      request<any>(`/journal?${new URLSearchParams(params ?? {})}`),
    get: (id: string) => request<any>(`/journal/${id}`),
    create: (body: unknown) => request<any>('/journal', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => request<any>(`/journal/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/journal/${id}`, { method: 'DELETE' }),
    psychologyStats: (days?: number) => request<any>(`/journal/psychology-stats${days ? `?days=${days}` : ''}`),
  },

  // ─── Prop Firms ──────────────────────────────────────────────────────────
  propFirms: {
    list: (params?: Record<string, string>) =>
      request<any>(`/prop-firms?${new URLSearchParams(params ?? {})}`),
    get: (slug: string) => request<any>(`/prop-firms/${slug}`),
    history: (slug: string) => request<any>(`/prop-firms/${slug}/history`),
    recommendations: () => request<any>('/prop-firms/recommendations'),
    reviews: (slug: string) => request<any>(`/prop-firms/${slug}/reviews`),
    reviewEligibility: () => request<any>('/prop-firms/review-eligibility'),
    createReview: (slug: string, body: unknown) =>
      request<any>(`/prop-firms/${slug}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  },

  // ─── Broker connections (live sync) ────────────────────────────────────────
  brokers: {
    list: () => request<any>('/broker-connections'),
    connect: (broker: string) => request<any>(`/broker-connections/${broker}/connect`),
    connectCtrader: () => request<any>('/broker-connections/ctrader/connect'),
    sync: (id: string, propFirmAccountId: string) =>
      request<any>(`/broker-connections/${id}/sync`, { method: 'POST', body: JSON.stringify({ propFirmAccountId }) }),
    disconnect: (id: string) => request<any>(`/broker-connections/${id}`, { method: 'DELETE' }),
  },

  // ─── Accounts ────────────────────────────────────────────────────────────
  accounts: {
    list: (status?: string) => request<any>(`/accounts${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<any>(`/accounts/${id}`),
    create: (body: unknown) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => request<any>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    reset: (id: string, body: unknown) => request<any>(`/accounts/${id}/reset`, { method: 'POST', body: JSON.stringify(body) }),
    portfolioSummary: () => request<any>('/accounts/portfolio-summary'),
  },

  // ─── Payouts ─────────────────────────────────────────────────────────────
  payouts: {
    list: (params?: Record<string, string>) =>
      request<any>(`/payouts?${new URLSearchParams(params ?? {})}`),
    roiSummary: () => request<any>('/payouts/roi-summary'),
    create: (body: unknown) => request<any>('/payouts', { method: 'POST', body: JSON.stringify(body) }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/payouts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  // ─── Alerts ──────────────────────────────────────────────────────────────
  alerts: {
    list: (params?: Record<string, string>) =>
      request<any>(`/alerts?${new URLSearchParams(params ?? {})}`),
    markRead: (id: string) => request<any>(`/alerts/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<any>('/alerts/mark-all-read', { method: 'POST' }),
  },

  // ─── AI ──────────────────────────────────────────────────────────────────
  ai: {
    conversations: () => request<any>('/ai/conversations'),
    createConversation: (body: unknown) => request<any>('/ai/conversations', { method: 'POST', body: JSON.stringify(body) }),
    sendMessage: (conversationId: string, content: string) =>
      request<any>(`/ai/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    streamUrl: (conversationId: string, content: string) =>
      `${API_BASE}/ai/conversations/${conversationId}/stream?content=${encodeURIComponent(content)}`,
    insights: (insightType: string, params?: Record<string, string>) =>
      request<any>(`/ai/insights?insightType=${insightType}&${new URLSearchParams(params ?? {})}`),
  },

  // ─── Import ───────────────────────────────────────────────────────────────
  import: {
    preview: (file: File, source: string) => {
      const form = new FormData();
      form.append('file', file);
      form.append('source', source);
      return fetch(`${API_BASE}/import/preview`, { method: 'POST', body: form })
        .then(r => r.json());
    },
    upload: (file: File, source: string, accountId: string) => {
      const form = new FormData();
      form.append('file', file);
      form.append('source', source);
      form.append('accountId', accountId);
      return fetch(`${API_BASE}/import/upload`, { method: 'POST', body: form })
        .then(r => r.json());
    },
    jobs: () => request<any>('/import/jobs'),
    job: (id: string) => request<any>(`/import/jobs/${id}`),
  },
};
