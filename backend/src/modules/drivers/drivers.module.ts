import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatatusModule } from '../matatus/matatus.module';
import { Driver } from './entities/driver.entity';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Driver]), MatatusModule],
  controllers: [DriversController],
  providers: [DriversService],
})
export class DriversModule {}
