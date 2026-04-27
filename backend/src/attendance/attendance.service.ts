import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AttendanceService {
  constructor(@InjectRepository(Attendance) private repo: Repository<Attendance>) { }

  // 🛠️ 輔助方法：生成當天的開始與結束字串
  private getDayRange(date: string) {
    return { start: `${date} 00:00:00`, end: `${date} 23:59:59.999` };
  }

  // 1. 查詢狀態 (精簡版)
  async getStatus(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const logs = await this.getHistoryByDate(userId, today);
    const isClockedIn = logs.length > 0 && logs[logs.length - 1].action === '上班';
    return { status: isClockedIn ? '上班' : '下班', logs };
  }

  // 2. 打卡與請假 (加入自動修復資料表功能)
  async clock(userId: number, action: string, lat?: number, lng?: number, leave?: any) {
    const saveRecord = () => this.repo.save({
      userId, action, lat, lng,
      startDate: leave?.startDate, endDate: leave?.endDate, reason: leave?.reason,
      status: action === '請假' ? 'pending' : 'normal'
    });

    try {
      return await saveRecord();
    } catch (error) {
      // 如果報錯，嘗試重新同步資料表結構 (自動建立缺失的 Table)
      console.log('檢測到資料庫異常，正在嘗試自動修復資料表...');
      await this.repo.manager.connection.synchronize();
      // 修復後重試一次
      return await saveRecord();
    }
  }

  // 3. 歷史紀錄 (加入自動修復邏輯)
  async getHistoryByDate(userId: number, date: string) {
    const { start, end } = this.getDayRange(date);
    const query = () => this.repo.createQueryBuilder('att')
      .where('att.userId = :userId AND att.time BETWEEN :start AND :end', { userId, start, end })
      .orderBy('att.time', 'ASC').getMany();

    try {
      return await query();
    } catch (error) {
      console.log('檢測到查詢異常，嘗試自動同步資料結構...');
      await this.repo.manager.connection.synchronize();
      return await query();
    }
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
      { header: '姓名', key: 'name' }, { header: '動作', key: 'act' }, { header: '時間', key: 'time', width: 25 }
    ];

    raw.forEach(r => ws.addRow({
      name: r.u_name, act: r.att_action,
      time: new Date(r.att_time).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })
    }));
    return wb;
  }

  async getPendingLeaves() { return this.repo.find({ where: { action: '請假', status: 'pending' }, order: { time: 'ASC' } }); }
  async approveLeave(id: number, ok: boolean) { return this.repo.update(id, { status: ok ? 'approved' : 'rejected' }); }
}