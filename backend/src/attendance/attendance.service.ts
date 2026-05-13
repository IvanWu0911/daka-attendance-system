import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import * as ExcelJS from 'exceljs';
import { HolidayService } from './holiday.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance) private repo: Repository<Attendance>,
    private holidayService: HolidayService,
  ) { }

  // 🛠️ 輔助方法：生成當天的開始與結束字串
  private getDayRange(date: string) {
    return { start: `${date} 00:00:00`, end: `${date} 23:59:59.999` };
  }

  // 1. 查詢狀態 (精簡版)
  async getStatus(userId: number) {
    const today = new Date().toLocaleString('sv', { timeZone: 'Asia/Taipei' }).split(' ')[0];
    const logs = await this.getHistoryByDate(userId, today);
    // 🚀 核心修正：計算「上班/下班/加班」的總數，奇數代表「已打卡/未退打卡」
    const workLogs = logs.filter(l => l.action !== '請假');
    const isClockedIn = workLogs.length % 2 !== 0;
    return { status: isClockedIn ? '上班' : '下班', logs };
  }

  // 2. 打卡與請假
  async clock(userId: number, action: string, lat?: number, lng?: number, leave?: any) {
    const todayStr = new Date().toLocaleString('sv', { timeZone: 'Asia/Taipei' }).split(' ')[0];
    const nowTaipei = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    
    // 🚀 使用 HolidayService 判斷是否為工作日 (國定假日會被判斷為非工作日，補班日會被判斷為工作日)
    const isWorkDay = this.holidayService.isWorkDay(todayStr, nowTaipei);

    // 🚀 更直觀的判斷：獲取當天最後一筆非請假紀錄
    const todayLogs = await this.repo.createQueryBuilder('att')
      .where('att.userId = :userId AND att.action != :leave AND DATE(att.time AT TIME ZONE \'UTC\' AT TIME ZONE \'Asia/Taipei\') = :today', { userId, leave: '請假', today: todayStr })
      .orderBy('att.time', 'DESC')
      .getMany();

    const lastLog = todayLogs[0];
    let finalAction = action;
    let overtimeValue = '';
    
    // 🚀 邏輯修正：
    // 1. 如果不是「請假」，且滿足「非工作日」或「當天已有 2 筆紀錄 (第三、四次打卡)」，則標註為加班
    if (action !== '請假' && (!isWorkDay || todayLogs.length >= 2)) {
      overtimeValue = '加班';
    }

    this.logger.debug(`[Clock] UserId: ${userId}, Action: ${action}, Overtime: ${overtimeValue}`);

    return this.repo.save({
      userId, 
      action: finalAction, 
      lat, 
      lng,
      startDate: leave?.startDate, 
      endDate: leave?.endDate, 
      overtime: overtimeValue,
      time: new Date()
    });
  }

  // 3. 歷史紀錄
  async getHistoryByDate(userId: number, date: string) {
    const { start, end } = this.getDayRange(date);
    return this.repo.createQueryBuilder('att')
      .where('att.userId = :userId AND att.time BETWEEN :start AND :end', { userId, start, end })
      .orderBy('att.time', 'ASC').getMany();
  }

  // 🚀 修正：直接回傳資料庫的原始時間物件，不要在後端轉字串
  async getAllLogsByDate(date: string) {
    const { start, end } = this.getDayRange(date);
    const raw = await this.repo.createQueryBuilder('att')
      .leftJoin('user', 'u', 'u.id = att.userId')
      .where('att.time BETWEEN :start AND :end', { start, end })
      .select(['att.id', 'att.userId', 'u.name', 'att.action', 'att.time', 'att.lat', 'att.lng'])
      .orderBy('att.time', 'DESC').getRawMany();

    return raw.map(r => ({
      id: r.att_id,
      userId: r.att_userId,
      userName: r.u_name || '未知',
      action: r.att_action,
      lat: r.att_lat,
      lng: r.att_lng,
      time: r.att_time // 👈 這裡直接傳原始 Date，不要用 .toLocaleString()
    }));
  }

  // 5. 匯出 Excel (精簡化迴圈)
  async exportExcel(startDate: string, endDate: string) {
    const raw = await this.repo.createQueryBuilder('att')
      .leftJoinAndSelect('user', 'u', 'u.id = att.userId')
      .where('att.time >= :s AND att.time <= :e', { s: `${startDate} 00:00:00`, e: `${endDate} 23:59:59` })
      .getRawMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('紀錄');
    ws.columns = [
      { header: '姓名', key: 'name' }, 
      { header: '動作', key: 'act' }, 
      { header: '是否加班', key: 'ot' },
      { header: '時間', key: 'time', width: 25 }
    ];

    raw.forEach(r => ws.addRow({
      name: r.u_name, 
      act: r.att_action,
      ot: r.att_overtime || '',
      time: new Date(r.att_time).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })
    }));
    return wb;
  }
}