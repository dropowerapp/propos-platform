import { Module } from '@nestjs/common';
import { PropFirmsController } from './prop-firms.controller';
import { PropFirmsService } from './prop-firms.service';

@Module({
  controllers: [PropFirmsController],
  providers: [PropFirmsService],
  exports: [PropFirmsService],
})
export class PropFirmsModule {}
