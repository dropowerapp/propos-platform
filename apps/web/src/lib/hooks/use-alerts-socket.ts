'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface AlertPayload {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

/**
 * Connects to the NestJS AlertsGateway via Socket.io.
 * Listens for real-time alert events and invalidates the alerts query cache
 * so the UI re-fetches and shows new alerts immediately.
 *
 * Usage: call in any component that needs live alert updates.
 * The hook is a no-op if the server is unreachable.
 */
export function useAlertsSocket(tenantId?: string) {
  const qc = useQueryClient();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let socket: any;

    async function connect() {
      try {
        // Lazy-load socket.io-client so it doesn't break SSR
        const { io } = await import('socket.io-client');

        socket = io(`${WS_URL}/alerts`, {
          transports: ['websocket', 'polling'],
          query: tenantId ? { tenantId } : {},
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (tenantId) {
            socket.emit('join:tenant', { tenantId });
          }
        });

        socket.on('alert:new', (_payload: AlertPayload) => {
          // Invalidate so the alerts list re-fetches and shows the new alert
          qc.invalidateQueries({ queryKey: ['alerts'] });
        });

        socket.on('alert:read', (_payload: { id: string }) => {
          qc.invalidateQueries({ queryKey: ['alerts'] });
        });

        socket.on('alert:all_read', () => {
          qc.invalidateQueries({ queryKey: ['alerts'] });
        });
      } catch {
        // socket.io-client not available or server unreachable — silently ignore
      }
    }

    void connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [tenantId, qc]);
}
