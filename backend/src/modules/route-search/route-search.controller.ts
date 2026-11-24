import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchRoutesQueryDto } from './dto/search-routes-query.dto';
import { RouteResult, RouteSearchService } from './route-search.service';

@Controller('route-search')
@UseGuards(JwtAuthGuard)
export class RouteSearchController {
  constructor(private readonly routeSearchService: RouteSearchService) {}

  @Get('stages')
  stages(): Promise<string[]> {
    return this.routeSearchService.stages();
  }

  @Get()
  search(@Query() query: SearchRoutesQueryDto): Promise<RouteResult[]> {
    return this.routeSearchService.search(query.from, query.to);
  }
}
