import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const adminCount = await this.repo.count();
    if (adminCount === 0) {
      const defaultPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await this.repo.save({
        name: 'ADMIN',
        password: hashedPassword,
        role: 'admin',
        startDate: new Date().toISOString().split('T')[0],
      });
      this.logger.log('🚀 Default ADMIN user created');
    }
  }

  // 🚀 註冊 (精簡版)
  async register(name: string, pwd: string, startDate: string, role: string, adminRole: string) {
    if (adminRole !== 'admin') throw new UnauthorizedException('權限不足');
    const hashedPassword = await bcrypt.hash(pwd, 10);
    return this.repo.save({ name, password: hashedPassword, role, startDate });
  }

  // 🚀 撈取所有員工 (排除密碼)
  async findAll() {
    return this.repo.find({ select: ['id', 'name', 'role', 'startDate'], order: { id: 'ASC' } });
  }

  // 🚀 登入核心
  async login(id: number, pwd: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user || !(await bcrypt.compare(pwd, user.password))) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }
    const token = this.jwt.sign({ sub: user.id, username: user.name, role: user.role });
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  }
}