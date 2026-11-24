import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Stage } from './stage.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  /** The number painted on the matatu, for example "237". */
  @Column({ type: 'varchar', length: 10, nullable: true })
  routeNumber: string | null;

  /** The usual fare for the whole route, in Kenya shillings. */
  @Column({ type: 'int', nullable: true })
  fare: number | null;

  @Column({ default: true })
  isActive: boolean;

  /** The stops in travel order: the first is the origin and the last is the destination. */
  @OneToMany(() => Stage, (stage) => stage.route, { cascade: true })
  stages: Stage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
