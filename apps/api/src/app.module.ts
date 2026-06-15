import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TradesModule } from './modules/trades/trades.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { JournalModule } from './modules/journal/journal.module';
import { PropFirmsModule } from './modules/prop-firms/prop-firms.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AiModule } from './modules/ai/ai.module';
import { ImportModule } from './modules/import/import.module';
import { BrokerConnectionsModule } from './modules/broker-connections/broker-connections.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TradesModule,
    AnalyticsModule,
    JournalModule,
    PropFirmsModule,
    AccountsModule,
    PayoutsModule,
    AlertsModule,
    AiModule,
    ImportModule,
    BrokerConnectionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
