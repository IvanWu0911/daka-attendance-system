import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HolidayService implements OnModuleInit {
  private holidayCache: Set<string> = new Set();
  // 增加 size 到 4000 確保能抓到多個年份的資料 (一年約 365 筆)
  private readonly apiUrl = 'https://data.ntpc.gov.tw/api/datasets/308DCD75-6434-45BC-A913-363595FC2B74/json?size=4000';

  async onModuleInit() {
    await this.updateHolidays();
    // 設定每 24 小時自動更新一次資料 (86400000 毫秒)
    setInterval(() => {
      this.updateHolidays();
    }, 86400000);
  }

  // 抓取政府日曆資料 (包含國定假日與補班日)
  async updateHolidays() {
    try {
      console.log('正在更新國定假日資料...');
      const response = await axios.get(this.apiUrl);
      const data = response.data;

      this.holidayCache.clear();
      data.forEach((item: any) => {
        // isHoliday: '是' 代表放假 (包含週末、國定假日)
        // isHoliday: '否' 代表上班 (包含補班日)
        if (item.isHoliday === '是') {
          this.holidayCache.add(item.date.replace(/\//g, '-')); // 統一存為 YYYY-MM-DD
        }
      });
      console.log(`假日資料更新完成，共載入 ${this.holidayCache.size} 個假日。`);
    } catch (error) {
      console.error('無法取得假日資料，將退回使用預設週末判斷', error.message);
    }
  }

  /**
   * 判定是否為工作日
   * @param dateStr 格式 YYYY-MM-DD
   */
  isWorkDay(dateStr: string, date: Date): boolean {
    // 1. 先查快取 (政府資料最準確，包含補班與彈性放假)
    if (this.holidayCache.size > 0) {
      return !this.holidayCache.has(dateStr);
    }

    // 2. 如果 API 失敗，退回基本的週末判斷
    const day = date.getDay();
    return day !== 0 && day !== 6;
  }
}
