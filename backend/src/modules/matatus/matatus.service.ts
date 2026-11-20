import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Sacco } from '../saccos/entities/sacco.entity';
import { CreateMatatuDto } from './dto/create-matatu.dto';
import { ListMatatusQueryDto } from './dto/list-matatus-query.dto';
import { UpdateMatatuDto } from './dto/update-matatu.dto';
import { Matatu } from './entities/matatu.entity';

@Injectable()
export class MatatusService {
  constructor(
    @InjectRepository(Matatu)
    private readonly matatusRepository: Repository<Matatu>,
    @InjectRepository(Sacco)
    private readonly saccosRepository: Repository<Sacco>,
  ) {}

  async create(dto: CreateMatatuDto): Promise<Matatu> {
    await this.assertPlateIsFree(dto.plateNumber);
    await this.assertSaccoExists(dto.saccoId);
    const matatu = await this.matatusRepository.save(
      this.matatusRepository.create(dto),
    );
    return this.findOne(matatu.id);
  }

  findAll(filters: ListMatatusQueryDto): Promise<Matatu[]> {
    const where: FindOptionsWhere<Matatu> = {};
    if (filters.saccoId) {
      where.saccoId = filters.saccoId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    return this.matatusRepository.find({
      where,
      relations: { sacco: true },
      order: { plateNumber: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Matatu> {
    const matatu = await this.matatusRepository.findOne({
      where: { id },
      relations: { sacco: true },
    });
    if (!matatu) {
      throw new NotFoundException('Matatu not found');
    }
    return matatu;
  }

  async update(id: number, dto: UpdateMatatuDto): Promise<Matatu> {
    await this.findOne(id);
    if (dto.plateNumber) {
      await this.assertPlateIsFree(dto.plateNumber, id);
    }
    if (dto.saccoId) {
      await this.assertSaccoExists(dto.saccoId);
    }
    if (Object.keys(dto).length) {
      await this.matatusRepository.update(id, dto);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const matatu = await this.findOne(id);
    await this.matatusRepository.remove(matatu);
  }

  private async assertPlateIsFree(
    plateNumber: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.matatusRepository.findOneBy({ plateNumber });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('A matatu with this plate number exists');
    }
  }

  private async assertSaccoExists(saccoId: number): Promise<void> {
    if (!(await this.saccosRepository.existsBy({ id: saccoId }))) {
      throw new BadRequestException('The selected SACCO does not exist');
    }
  }
}
