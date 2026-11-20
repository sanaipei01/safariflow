import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sacco } from '../../saccos/entities/sacco.entity';
import { MatatuStatus } from '../enums/matatu-status.enum';

@Entity('matatus')
export class Matatu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  plateNumber: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({
    type: 'simple-enum',
    enum: MatatuStatus,
    default: MatatuStatus.ACTIVE,
  })
  status: MatatuStatus;

  @Column()
  saccoId: number;

  @ManyToOne(() => Sacco, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'saccoId' })
  sacco: Sacco;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
