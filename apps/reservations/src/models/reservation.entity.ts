import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '@app/common';

@Entity()
export class Reservation extends AbstractEntity<Reservation> {
  @Column({ type: 'timestamp', nullable: false })
  timestamp: Date;

  @Column({ type: 'timestamp', nullable: false })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: false })
  endDate: Date;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  invoiceId: string;
}
