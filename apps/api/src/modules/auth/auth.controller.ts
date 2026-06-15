import { Controller, Post, Headers, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  /** Clerk webhook — syncs user/org creation events to our DB */
  @Post('webhook')
  @HttpCode(200)
  async clerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() rawBody: Buffer,
  ) {
    const secret = this.config.get<string>('CLERK_WEBHOOK_SECRET')!;
    const wh = new Webhook(secret);

    const payload = wh.verify(rawBody.toString(), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: Record<string, unknown> };

    const { type, data } = payload;

    if (type === 'user.created' || type === 'user.updated') {
      const email = (data.email_addresses as { email_address: string }[])[0]?.email_address;
      await this.authService.syncUser(data.id as string, email);
    }

    return { received: true };
  }
}
