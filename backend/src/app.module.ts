import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AttendanceModule } from './attendance/attendance.module';
import { UsersModule } from './users/users.module';
import { Attendance } from './attendance/attendance.entity';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        entities: [Attendance, User],
        synchronize: true,
      }),
    }),
    AttendanceModule,
    UsersModule,
  ],
})
export class AppModule {}
