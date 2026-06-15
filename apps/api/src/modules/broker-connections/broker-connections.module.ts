import { Module } from '@nestjs/common';
import { BrokerConnectionsController } from './broker-connections.controller';
import { BrokerConnectionsService } from './broker-connections.service';
import { ImportModule } from '../import/import.module';

@Module({
  imports: [ImportModule],
  controllers: [BrokerConnectionsController],
  providers: [BrokerConnectionsService],
})
export class BrokerConnectionsModule {}
