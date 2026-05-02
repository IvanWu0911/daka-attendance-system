import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ type: 'text' }) // 🚀 強制使用 text 類型，避開資料庫可能存在的 ENUM 限制
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

  // 🚀 新增：加班欄位，符合條件寫「加班」，否則為空字串
  @Column({ default: '' })
  overtime!: string;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP'
  })
  time!: Date;
}