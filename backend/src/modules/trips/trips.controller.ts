import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { StartTripDto } from './dto/start-trip.dto';
import { TripsService, TripView } from './trips.service';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('routes')
  routes(): Promise<{ id: number; name: string }[]> {
    return this.tripsService.routeOptions();
  }

  @Post()
  start(
    @CurrentUser() user: User,
    @Body() dto: StartTripDto,
  ): Promise<TripView> {
    return this.tripsService.start(user.id, dto.routeId);
  }

  @Get('current')
  current(@CurrentUser() user: User): Promise<TripView | null> {
    return this.tripsService.current(user.id);
  }

  @Patch('current/end')
  end(@CurrentUser() user: User): Promise<TripView> {
    return this.tripsService.end(user.id);
  }
}
