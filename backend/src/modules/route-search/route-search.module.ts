import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from '../routes/entities/route.entity';
import { TripsModule } from '../trips/trips.module';
import { RouteSearchController } from './route-search.controller';
import { RouteSearchService } from './route-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Route]), TripsModule],
  controllers: [RouteSearchController],
  providers: [RouteSearchService],
})
export class RouteSearchModule {}
