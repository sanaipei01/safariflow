import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { Stage } from './entities/stage.entity';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routesRepository: Repository<Route>,
  ) {}

  async create(dto: CreateRouteDto): Promise<Route> {
    await this.assertNameIsFree(dto.name);
    this.assertStagesAreDistinct(dto.stages);
    const route = await this.routesRepository.save(
      this.routesRepository.create({
        name: dto.name,
        isActive: dto.isActive,
        stages: this.buildStages(dto.stages),
      }),
    );
    return this.findOne(route.id);
  }

  findAll(): Promise<Route[]> {
    return this.routesRepository.find({
      relations: { stages: true },
      order: { name: 'ASC', stages: { sequence: 'ASC' } },
    });
  }

  async findOne(id: number): Promise<Route> {
    const route = await this.routesRepository.findOne({
      where: { id },
      relations: { stages: true },
      order: { stages: { sequence: 'ASC' } },
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return route;
  }

  async update(id: number, dto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    if (dto.name !== undefined) {
      await this.assertNameIsFree(dto.name, id);
      route.name = dto.name;
    }
    if (dto.isActive !== undefined) {
      route.isActive = dto.isActive;
    }
    if (dto.stages !== undefined) {
      this.assertStagesAreDistinct(dto.stages);
      // the old stages are no longer listed, so TypeORM deletes them
      route.stages = this.buildStages(dto.stages);
    }
    await this.routesRepository.save(route);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const route = await this.findOne(id);
    await this.routesRepository.remove(route);
  }

  /** The position of each stage comes from its place in the list. */
  private buildStages(names: string[]): Stage[] {
    return names.map((name, index) =>
      Object.assign(new Stage(), { name, sequence: index + 1 }),
    );
  }

  private assertStagesAreDistinct(names: string[]): void {
    const unique = new Set(names.map((name) => name.toLowerCase()));
    if (unique.size !== names.length) {
      throw new BadRequestException('A route cannot list the same stage twice');
    }
  }

  private async assertNameIsFree(
    name: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.routesRepository.findOneBy({ name });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('A route with this name already exists');
    }
  }
}
