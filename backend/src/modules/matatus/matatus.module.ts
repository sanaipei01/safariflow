import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sacco } from '../saccos/entities/sacco.entity';
import { Matatu } from './entities/matatu.entity';
import { MatatusController } from './matatus.controller';
import { MatatusService } from './matatus.service';

@Module({
  imports: [TypeOrmModule.forFeature([Matatu, Sacco])],
  controllers: [MatatusController],
  providers: [MatatusService],
  exports: [MatatusService],
})
export class MatatusModule {}
