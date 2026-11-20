import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Route } from './route.entity';

/** One stop on a route. `sequence` is its position, starting at 1. */
@Entity('stages')
export class Stage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column()
  routeId: number;

  @ManyToOne(() => Route, (route) => route.stages, {
    nullable: false,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'routeId' })
  route: Route;
}
