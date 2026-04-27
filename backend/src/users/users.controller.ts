import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from './auth.guard';

@Controller('api/users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @UseGuards(AuthGuard)
  @Post('register')
  register(@Body() b: any, @Req() r: any) {
    return this.service.register(b.name, b.password, b.startDate, b.role, r.user.role);
  }

  @Post('login')
  login(@Body() b: any) {
    return this.service.login(Number(b.id), b.password);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}