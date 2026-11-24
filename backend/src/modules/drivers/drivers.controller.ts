import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { ApproveDriverDto } from './dto/approve-driver.dto';
import { ListDriversQueryDto } from './dto/list-drivers-query.dto';
import { RejectDriverDto } from './dto/reject-driver.dto';
import { SaveDriverDto } from './dto/save-driver.dto';
import { Driver } from './entities/driver.entity';
import { DriversService } from './drivers.service';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @Roles(Role.DRIVER)
  register(
    @CurrentUser() user: User,
    @Body() dto: SaveDriverDto,
  ): Promise<Driver> {
    return this.driversService.register(user.id, dto);
  }

  @Get('me')
  @Roles(Role.DRIVER)
  findMine(@CurrentUser() user: User): Promise<Driver> {
    return this.driversService.findMine(user.id);
  }

  @Patch('me')
  @Roles(Role.DRIVER)
  updateMine(
    @CurrentUser() user: User,
    @Body() dto: SaveDriverDto,
  ): Promise<Driver> {
    return this.driversService.updateMine(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll(@Query() filters: ListDriversQueryDto): Promise<Driver[]> {
    return this.driversService.findAll(filters);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.OPERATOR)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveDriverDto,
  ): Promise<Driver> {
    return this.driversService.approve(id, dto.saccoId);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.OPERATOR)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectDriverDto,
  ): Promise<Driver> {
    return this.driversService.reject(id, dto.reason);
  }
}
