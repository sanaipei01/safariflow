import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { MatatusService } from '../matatus/matatus.service';
import { ListDriversQueryDto } from './dto/list-drivers-query.dto';
import { DriverDetails, SaveDriverDto } from './dto/save-driver.dto';
import { Driver } from './entities/driver.entity';
import { DriverStatus } from './enums/driver-status.enum';

const DRIVER_RELATIONS: FindOptionsRelations<Driver> = { user: true };

/** The optional Sacco fields are cleared when the driver leaves them out. */
function toColumns(dto: DriverDetails) {
  return {
    ...dto,
    saccoName: dto.saccoName ?? null,
    saccoRegistrationNumber: dto.saccoRegistrationNumber ?? null,
    saccoPhone: dto.saccoPhone ?? null,
  };
}

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepository: Repository<Driver>,
    private readonly matatusService: MatatusService,
  ) {}

  async register(userId: number, dto: SaveDriverDto): Promise<Driver> {
    if (await this.driversRepository.existsBy({ userId })) {
      throw new ConflictException('You have already registered as a driver');
    }
    await this.assertDetailsAreFree(dto);
    const driver = await this.driversRepository.save(
      this.driversRepository.create({ userId, ...toColumns(dto) }),
    );
    return this.findOne(driver.id);
  }

  async findMine(userId: number): Promise<Driver> {
    const driver = await this.driversRepository.findOne({
      where: { userId },
      relations: DRIVER_RELATIONS,
    });
    if (!driver) {
      throw new NotFoundException('You have not registered as a driver yet');
    }
    return driver;
  }

  /** A rejected driver corrects their details and goes back into the queue. */
  async updateMine(userId: number, dto: SaveDriverDto): Promise<Driver> {
    const driver = await this.findMine(userId);
    if (driver.status === DriverStatus.APPROVED) {
      throw new ConflictException(
        'An approved driver cannot change these details',
      );
    }
    await this.assertDetailsAreFree(dto, driver.id);
    await this.driversRepository.update(driver.id, {
      ...toColumns(dto),
      status: DriverStatus.PENDING,
      rejectionReason: null,
    });
    return this.findOne(driver.id);
  }

  findAll(filters: ListDriversQueryDto): Promise<Driver[]> {
    return this.driversRepository.find({
      where: filters.status ? { status: filters.status } : {},
      relations: DRIVER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Driver> {
    const driver = await this.driversRepository.findOne({
      where: { id },
      relations: DRIVER_RELATIONS,
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  /** Approving adds the driver's vehicle to the Matatus list under the chosen Sacco. */
  async approve(id: number, saccoId: number): Promise<Driver> {
    const driver = await this.findPending(id);
    await this.matatusService.ensureForVehicle(
      driver.vehiclePlate,
      driver.vehicleCapacity,
      saccoId,
    );
    return this.decide(id, { status: DriverStatus.APPROVED });
  }

  async reject(id: number, reason: string): Promise<Driver> {
    await this.findPending(id);
    return this.decide(id, {
      status: DriverStatus.REJECTED,
      rejectionReason: reason,
    });
  }

  /** Only a pending application can be decided, so a decision is never silently overwritten. */
  private async findPending(id: number): Promise<Driver> {
    const driver = await this.findOne(id);
    if (driver.status !== DriverStatus.PENDING) {
      throw new ConflictException(`This driver is already ${driver.status}`);
    }
    return driver;
  }

  private async decide(
    id: number,
    changes: Pick<Driver, 'status'> & Partial<Pick<Driver, 'rejectionReason'>>,
  ): Promise<Driver> {
    await this.driversRepository.update(id, {
      rejectionReason: null,
      ...changes,
    });
    return this.findOne(id);
  }

  /** Licence number, national ID and vehicle plate must each belong to one driver only. */
  private async assertDetailsAreFree(
    dto: SaveDriverDto,
    ignoreId?: number,
  ): Promise<void> {
    const matches = await this.driversRepository.find({
      where: [
        { licenseNumber: dto.licenseNumber },
        { nationalId: dto.nationalId },
        { vehiclePlate: dto.vehiclePlate },
      ],
    });
    const clash = matches.find((driver) => driver.id !== ignoreId);
    if (!clash) {
      return;
    }
    const field =
      clash.licenseNumber === dto.licenseNumber
        ? 'licence number'
        : clash.nationalId === dto.nationalId
          ? 'national ID'
          : 'vehicle plate';
    throw new ConflictException(`This ${field} is already registered`);
  }
}
