import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { Stage } from './entities/stage.entity';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Route, Stage])],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
