import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  // action 會多一個選項：'上班', '下班', '請假'
  @Column()
  action!: string;

  @Column({ type: 'float', nullable: true })
  lat!: number;

  @Column({ type: 'float', nullable: true })
  lng!: number;

  // 🚀 新增：請假專用欄位 (nullable: true 代表可以不填)
  @Column({ nullable: true })
  startDate!: string;

  @Column({ nullable: true })
  endDate!: string;

  @Column({ nullable: true })
  reason!: string;

  // 狀態：'normal' (一般打卡), 'pending' (待審核), 'approved', 'rejected'
  @Column({ default: 'normal' })
  status!: string;

  @Column({ 
    type: 'timestamp', 
    default: () => "timezone('Asia/Taipei', now())" 
  })
  time!: Date;
}