import { Controller, Post, Body, Get, Param, Query, Res, UseGuards, Patch, Req, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard } from '../users/auth.guard';

@Controller('api/attendance')
@UseGuards(AuthGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get(':userId/status')
  async getStatus(@Param('userId') id: string, @Req() req: any) {
    if (req.user.role !== 'admin' && req.user.sub !== Number(id)) throw new ForbiddenException();
    return this.service.getStatus(Number(id));
  }

  @Post('clock')
  clock(@Body() b: any, @Req() req: any) {
    if (req.user.sub !== Number(b.userId)) throw new ForbiddenException();
    return this.service.clock(Number(b.userId), b.action, b.lat, b.lng);
  }

  @Post('leave')
  applyLeave(@Body() b: any, @Req() req: any) {
    if (req.user.sub !== Number(b.userId)) throw new ForbiddenException();
    return this.service.clock(Number(b.userId), '請假', undefined, undefined, b);
  }

  @Get(':userId/history')
  getHistory(@Param('userId') id: string, @Query('date') d: string, @Req() req: any) {
    if (req.user.role !== 'admin' && req.user.sub !== Number(id)) throw new ForbiddenException();
    return this.service.getHistoryByDate(Number(id), d);
  }

  @Get('all-records')
  getAllRecords(@Query('date') d: string, @Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.service.getAllLogsByDate(d);
  }

  @Get('leave/pending')
  getPendingLeaves(@Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.service.getPendingLeaves();
  }

  @Patch('leave/:id')
  reviewLeave(@Param('id') id: string, @Body('isApproved') ok: boolean, @Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.service.approveLeave(Number(id), ok);
  }

  @Get('export')
  async exportExcel(@Query('start') s: string, @Query('end') e: string, @Res() res: any) {
    const wb = await this.service.exportExcel(s, e);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await wb.xlsx.write(res);
    res.end();
  }
}