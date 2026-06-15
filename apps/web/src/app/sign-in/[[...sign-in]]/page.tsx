'use client';

import { SignIn } from '@clerk/nextjs';
import { BarChart2, Bot, Trophy, DollarSign, Users, ArrowRight } from 'lucide-react';
import { useState, useCallback } from 'react';

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Real-time dashboard',
    desc: 'P&L, drawdown, win rate — updated every minute.',
  },
  {
    icon: Bot,
    title: 'Personalised AI Coach',
    desc: 'Insights based on your real trading history.',
  },
  {
    icon: Trophy,
    title: 'Challenge tracking',
    desc: 'Monitor your progress across all prop firms.',
  },
  {
    icon: DollarSign,
    title: 'Payouts & ROI control',
    desc: 'Know exactly how much you earn per firm.',
  },
];

export default function SignInPage() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div className="min-h-screen bg-[#080b12] flex">

      {/* ── Left panel — branding & features ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 border-r border-white/5 p-10 relative overflow-hidden"
        style={{ background: '#0d1117' }}
        onMouseMove={handleMouseMove}
      >
        {/* Mouse glow */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(380px at ${mouse.x}px ${mouse.y}px, rgba(26,95,106,0.18) 0%, transparent 70%)`,
          }}
        />

        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1a5f6a] flex items-center justify-center shadow-lg shadow-[#1a5f6a]/40">
            <span className="text-white font-bold text-base tracking-tight">P</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">PropOS</span>
        </div>

        {/* Feature list */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              The operating system<br />
              for the modern prop trader
            </h2>
            <p className="mt-3 text-[#6b7f8c] text-sm leading-relaxed">
              Centralise your challenges, trades, payouts and metrics in one intelligent platform.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 group cursor-default"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1a5f6a]/15 border border-[#1a5f6a]/25 flex items-center justify-center shrink-0 group-hover:bg-[#1a5f6a]/25 group-hover:border-[#1a5f6a]/40 transition-all duration-200">
                  <Icon className="w-4 h-4 text-[#3da5b4]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-[#3da5b4] transition-colors duration-200">{title}</p>
                  <p className="text-xs text-[#6b7f8c] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Orange accent CTA */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f97316]/8 border border-[#f97316]/20">
            <Users className="w-4 h-4 text-[#f97316] shrink-0" />
            <p className="text-xs text-[#f97316]/90 font-medium flex-1">
              Join thousands of prop traders already using PropOS
            </p>
            <ArrowRight className="w-3.5 h-3.5 text-[#f97316]/60 shrink-0" />
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-[#374151]">© 2026 PropOS. All rights reserved.</p>
      </div>

      {/* ── Right panel — sign-in form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#1a5f6a] flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-bold text-white">PropOS</span>
        </div>

        <SignIn />

        <p className="mt-6 text-xs text-[#374151] text-center">
          By signing in, you agree to our{' '}
          <a href="#" className="text-[#4b5563] hover:text-white transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#4b5563] hover:text-white transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
