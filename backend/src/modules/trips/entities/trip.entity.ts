import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Driver } from '../../drivers/entities/driver.entity';
import { Route } from '../../routes/entities/route.entity';
import { TripStatus } from '../enums/trip-status.enum';

/** One run of a driver's matatu along a route, from start to end. */
@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  driverId: number;

  @ManyToOne(() => Driver, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column()
  routeId: number;

  @ManyToOne(() => Route, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @Column({
    type: 'simple-enum',
    enum: TripStatus,
    default: TripStatus.ACTIVE,
  })
  status: TripStatus;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endedAt: Date | null;
}
