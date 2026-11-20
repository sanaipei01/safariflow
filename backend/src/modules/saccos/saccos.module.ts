import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matatu } from '../matatus/entities/matatu.entity';
import { Sacco } from './entities/sacco.entity';
import { SaccosController } from './saccos.controller';
import { SaccosService } from './saccos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sacco, Matatu])],
  controllers: [SaccosController],
  providers: [SaccosService],
})
export class SaccosModule {}
