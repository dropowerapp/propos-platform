import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing auth token');
    }

    const token = authHeader.slice(7);
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');

    try {
      // verifyToken is a standalone function in @clerk/backend v3+
      const payload = await verifyToken(token, { secretKey });
      const clerkUserId = payload.sub;
      const clerkOrgId = payload.org_id as string | undefined;

      // Look up local user — lazily bootstrap on first login if webhook
      // hasn't fired yet (race condition safety net).
      let user: any = await this.prisma.user.findUnique({
        where: { clerkUserId },
        include: { tenant: true },
      });

      if (!user) {
        const email = (payload as any).email ?? `${clerkUserId}@clerk.local`;

        let tenant = clerkOrgId
          ? await this.prisma.tenant.upsert({
              where: { clerkOrgId },
              create: { clerkOrgId, name: clerkOrgId, slug: clerkOrgId },
              update: {},
            })
          : null;

        if (!tenant) {
          tenant = await this.prisma.tenant.create({
            data: {
              name: email.split('@')[0],
              slug: `personal-${clerkUserId.slice(-8)}`,
            },
          });
        }

        user = await this.prisma.user.create({
          data: { clerkUserId, tenantId: tenant.id, email, role: 'owner' },
          include: { tenant: true },
        });
      }

      request.currentUser = user;
      request.tenant = user.tenant;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
