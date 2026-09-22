# daka-backend

Daka System 的 NestJS 後端。專案總覽與功能說明見 [根目錄 README](../README.md)。

**作者：[IvanWu0911](https://github.com/IvanWu0911)**

## 模組

| 目錄 | 職責 |
|---|---|
| `src/users/` | 註冊／登入、JWT 簽發與 `AuthGuard`、角色權限（admin / employee）、啟動時建立初始 ADMIN |
| `src/attendance/` | 打卡與請假、出勤查詢、Excel 報表匯出 |
| `src/attendance/holiday.service.ts` | 串接政府公務日曆 API 判定國定假日／補班日，失敗時退回週末判斷 |

## 指令

```bash
npm install
npm run start:dev     # 開發模式（watch）
npm run start:prod    # 執行 dist/main
npm run build
npm run lint
```

## 環境變數

複製 `.env.example` 為 `.env` 後填入：`DATABASE_URL`、`JWT_SECRET`、`ADMIN_PASSWORD`。

`ADMIN_PASSWORD` 為必填 —— 未設定時 `onModuleInit` 會記錄錯誤並略過建立 ADMIN 帳號，
而不是退回固定的預設密碼。
