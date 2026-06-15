import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async syncUser(clerkUserId: string, email: string, orgId?: string, orgName?: string) {
    // Upsert tenant from Clerk org
    let tenant = orgId
      ? await this.prisma.tenant.upsert({
          where: { clerkOrgId: orgId },
          create: {
            clerkOrgId: orgId,
            name: orgName ?? email.split('@')[0],
            slug: orgId,
          },
          update: {},
        })
      : await this.prisma.tenant.findFirst({ where: { users: { some: { clerkUserId } } } });

    // Create personal tenant if no org
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          name: email.split('@')[0],
          slug: `personal-${clerkUserId.slice(-8)}`,
        },
      });
    }

    // Upsert user
    const user = await this.prisma.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        tenantId: tenant.id,
        email,
        role: 'owner',
      },
      update: { email },
    });

    return { user, tenant };
  }
}
