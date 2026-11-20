import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DriverStatus } from '../enums/driver-status.enum';

/**
 * One registration: the driver, their licence, their own vehicle and the
 * Sacco they say it belongs to. The operator approves or rejects it as a
 * whole. The Sacco details are only what the driver wrote; they are never
 * linked to the operator's own Sacco records.
 */
@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // personal details
  @Column({ unique: true })
  nationalId: string;

  @Column()
  phone: string;

  // driving licence
  @Column({ unique: true })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 10 })
  licenseExpiry: string;

  @Column()
  psvBadgeNumber: string;

  // vehicle
  @Column({ unique: true })
  vehiclePlate: string;

  @Column()
  vehicleMake: string;

  @Column()
  vehicleModel: string;

  @Column()
  vehicleYear: number;

  @Column()
  vehicleCapacity: number;

  @Column()
  insurancePolicyNumber: string;

  @Column({ type: 'varchar', length: 10 })
  insuranceExpiry: string;

  // Sacco, as written by the driver. A driver may not belong to one.
  @Column({ type: 'varchar', nullable: true })
  saccoName: string | null;

  @Column({ type: 'varchar', nullable: true })
  saccoRegistrationNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  saccoPhone: string | null;

  // approval
  @Column({
    type: 'simple-enum',
    enum: DriverStatus,
    default: DriverStatus.PENDING,
  })
  status: DriverStatus;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
