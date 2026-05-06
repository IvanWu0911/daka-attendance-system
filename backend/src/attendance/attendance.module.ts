import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance } from './attendance.entity';
import { UsersModule } from '../users/users.module';
import { HolidayService } from './holiday.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    UsersModule,
  ],
  providers: [AttendanceService, HolidayService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}