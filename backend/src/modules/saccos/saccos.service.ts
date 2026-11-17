import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Matatu } from '../matatus/entities/matatu.entity';
import { CreateSaccoDto } from './dto/create-sacco.dto';
import { UpdateSaccoDto } from './dto/update-sacco.dto';
import { Sacco } from './entities/sacco.entity';

@Injectable()
export class SaccosService {
  constructor(
    @InjectRepository(Sacco)
    private readonly saccosRepository: Repository<Sacco>,
    @InjectRepository(Matatu)
    private readonly matatusRepository: Repository<Matatu>,
  ) {}

  async create(dto: CreateSaccoDto): Promise<Sacco> {
    await this.assertUnique(dto);
    return this.saccosRepository.save(this.saccosRepository.create(dto));
  }

  findAll(): Promise<Sacco[]> {
    return this.saccosRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Sacco> {
    const sacco = await this.saccosRepository.findOneBy({ id });
    if (!sacco) {
      throw new NotFoundException('SACCO not found');
    }
    return sacco;
  }

  async update(id: number, dto: UpdateSaccoDto): Promise<Sacco> {
    const sacco = await this.findOne(id);
    await this.assertUnique(dto, id);
    return this.saccosRepository.save(Object.assign(sacco, dto));
  }

  async remove(id: number): Promise<void> {
    const sacco = await this.findOne(id);
    if (await this.matatusRepository.existsBy({ saccoId: id })) {
      throw new ConflictException(
        'This SACCO still has matatus. Move or delete them first',
      );
    }
    await this.saccosRepository.remove(sacco);
  }

  /** Name and registration number must each belong to one SACCO only. */
  private async assertUnique(
    dto: UpdateSaccoDto,
    ignoreId?: number,
  ): Promise<void> {
    const conditions: FindOptionsWhere<Sacco>[] = [];
    if (dto.name) {
      conditions.push({ name: dto.name });
    }
    if (dto.registrationNumber) {
      conditions.push({ registrationNumber: dto.registrationNumber });
    }
    if (!conditions.length) {
      return;
    }

    const matches = await this.saccosRepository.find({ where: conditions });
    const clash = matches.find((sacco) => sacco.id !== ignoreId);
    if (clash) {
      const field = clash.name === dto.name ? 'name' : 'registration number';
      throw new ConflictException(`A SACCO with this ${field} already exists`);
    }
  }
}
