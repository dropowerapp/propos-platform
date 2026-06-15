import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * AlertsGateway — real-time push for alert events.
 *
 * Clients connect with optional query param ?tenantId=<id>
 * and are auto-joined to room `tenant:<tenantId>`.
 *
 * Events emitted to clients:
 *   alert:new    — { id, type, severity, title, message, createdAt }
 *   alert:read   — { id }
 *   alert:all_read — { tenantId }
 *
 * Events received from clients:
 *   join:tenant  — { tenantId } — join a tenant room (auth bypass for dev)
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/alerts',
  transports: ['websocket', 'polling'],
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AlertsGateway.name);

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query?.tenantId as string | undefined;
    if (tenantId) {
      void client.join(`tenant:${tenantId}`);
      this.logger.log(`Client ${client.id} joined tenant:${tenantId}`);
    } else {
      this.logger.log(`Client ${client.id} connected (no tenant)`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join:tenant')
  handleJoinTenant(
    @MessageBody() payload: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (payload?.tenantId) {
      void client.join(`tenant:${payload.tenantId}`);
      this.logger.log(`Client ${client.id} joined tenant:${payload.tenantId}`);
    }
  }

  // ─── Server-side emitters (called from AlertsService / other services) ────

  /**
   * Emit a new alert event to all clients in a tenant room.
   */
  emitAlert(tenantId: string, alert: {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    createdAt: Date;
  }) {
    this.server.to(`tenant:${tenantId}`).emit('alert:new', alert);
  }

  /**
   * Notify clients that an alert has been marked read.
   */
  emitAlertRead(tenantId: string, alertId: string) {
    this.server.to(`tenant:${tenantId}`).emit('alert:read', { id: alertId });
  }

  /**
   * Notify clients that all alerts have been marked read.
   */
  emitAllRead(tenantId: string) {
    this.server.to(`tenant:${tenantId}`).emit('alert:all_read', { tenantId });
  }
}
