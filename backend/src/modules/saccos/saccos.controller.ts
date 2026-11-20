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
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSaccoDto } from './dto/create-sacco.dto';
import { UpdateSaccoDto } from './dto/update-sacco.dto';
import { Sacco } from './entities/sacco.entity';
import { SaccosService } from './saccos.service';

@Controller('saccos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class SaccosController {
  constructor(private readonly saccosService: SaccosService) {}

  @Post()
  create(@Body() dto: CreateSaccoDto): Promise<Sacco> {
    return this.saccosService.create(dto);
  }

  @Get()
  findAll(): Promise<Sacco[]> {
    return this.saccosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Sacco> {
    return this.saccosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaccoDto,
  ): Promise<Sacco> {
    return this.saccosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.saccosService.remove(id);
  }
}
