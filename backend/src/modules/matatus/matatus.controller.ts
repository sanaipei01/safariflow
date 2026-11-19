import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMatatuDto } from './dto/create-matatu.dto';
import { ListMatatusQueryDto } from './dto/list-matatus-query.dto';
import { UpdateMatatuDto } from './dto/update-matatu.dto';
import { Matatu } from './entities/matatu.entity';
import { MatatusService } from './matatus.service';

@Controller('matatus')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class MatatusController {
  constructor(private readonly matatusService: MatatusService) {}

  @Post()
  create(@Body() dto: CreateMatatuDto): Promise<Matatu> {
    return this.matatusService.create(dto);
  }

  @Get()
  findAll(@Query() filters: ListMatatusQueryDto): Promise<Matatu[]> {
    return this.matatusService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Matatu> {
    return this.matatusService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMatatuDto,
  ): Promise<Matatu> {
    return this.matatusService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.matatusService.remove(id);
  }
}
