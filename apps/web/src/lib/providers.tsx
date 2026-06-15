'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Clerk appearance — PropOS dark theme
const clerkAppearance = {
  variables: {
    colorPrimary: '#1a5f6a',
    colorBackground: '#111827',
    colorInputBackground: '#1f2937',
    colorInputText: '#f9fafb',
    colorText: '#f9fafb',
    colorTextSecondary: '#9ca3af',
    colorNeutral: '#374151',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  elements: {
    // Card
    card: 'bg-[#111827] shadow-2xl border border-white/10',
    // Header
    headerTitle: 'text-white font-bold text-xl',
    headerSubtitle: 'text-[#9ca3af]',
    // Social button
    socialButtonsBlockButton: 'bg-[#1f2937] border border-white/10 text-white hover:bg-[#374151]',
    socialButtonsBlockButtonText: 'text-white font-medium',
    // Divider
    dividerLine: 'bg-white/10',
    dividerText: 'text-[#6b7280]',
    // Labels
    formFieldLabel: 'text-[#d1d5db] font-medium',
    // Inputs
    formFieldInput: 'bg-[#1f2937] border-white/10 text-white placeholder:text-[#6b7280] focus:border-[#1a5f6a] focus:ring-[#1a5f6a]/20',
    // Primary button
    formButtonPrimary: 'bg-[#1a5f6a] hover:bg-[#134f56] text-black font-semibold shadow-lg shadow-[#1a5f6a]/20',
    // Footer
    footer: 'bg-[#0d1117] border-t border-white/5',
    footerActionText: 'text-[#9ca3af]',
    footerActionLink: 'text-[#1a5f6a] hover:text-[#4ade80] font-semibold',
    // Internal link
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-[#1a5f6a]',
    // Alert/error
    formFieldErrorText: 'text-red-400',
    alertText: 'text-red-400',
    // "Secured by Clerk"
    footerPages: 'opacity-50',
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    }),
  );

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ClerkProvider>
  );
}
