# Daka System — 跨國員工地理定位打卡系統

> 專為管理跨國籍員工設計的出勤系統：以 GPS 定位驗證外勤打卡、
> 介面支援中／越／泰三語即時切換，並串接政府公開資料自動判定國定假日與補班日。

**作者：[IvanWu0911](https://github.com/IvanWu0911)** ｜ NestJS · TypeScript · PostgreSQL · Vanilla JS

---

## 為什麼做這個

一般打卡系統預設使用者看得懂中文、而且都在固定地點上班。
本系統針對兩個實際情境處理：**非母語員工的操作門檻**，以及**外勤人員的打卡地點真偽**。
假日與加班判定則不寫死在程式裡，改由政府公務日曆 API 每次同步，避免每年手動維護行事曆。

## 核心功能

### 多國語系即時切換
繁體中文、越南語（Tiếng Việt）、泰語（ภาษาไทย）三語切換，
時間格式與出勤紀錄表格會跟著語系重新渲染，不需重新整理頁面。

### GPS 地理定位與防偽打卡
打卡時記錄經緯度並以 Leaflet 地圖呈現，管理員可在後台直接查看每筆打卡的實際位置，
避免遠端代打卡。

### 智慧假日判斷（政府 Open Data）
串接政府公務日曆 API 自動判定國定假日、彈性放假與補班日，並據此判斷當日打卡是否屬於加班。
API 取得失敗時退回週末判斷，不會因外部服務中斷而停擺。

### 管理員後台
- Chart.js 動態甘特圖呈現當日員工出勤時間軸，快速找出異常紀錄
- ExcelJS 一鍵匯出出勤報表，供薪資結算使用

## 技術棧

| 層級 | 技術 |
|---|---|
| 後端 | NestJS、TypeScript、TypeORM、JWT 認證、ExcelJS、Axios |
| 資料庫 | PostgreSQL |
| 前端 | Vanilla JS、Tailwind CSS、Chart.js、Leaflet.js |

前端刻意不使用框架：整個打卡頁是單一 HTML 檔，方便直接部署到任何靜態主機，
也讓非技術人員能單檔備份與佈署。

## 專案結構

```
.
├── backend/              # NestJS API
│   └── src/
│       ├── attendance/   #   打卡、請假、歷史紀錄、Excel 匯出、假日判定
│       └── users/        #   註冊／登入、JWT 守衛、角色權限
└── daka-web/             # 前端單頁（打卡介面 + 管理員後台）
```

## API

| 方法 | 路徑 | 說明 |
|---|---|---|
| `POST` | `/api/users/login` | 登入，回傳 JWT |
| `POST` | `/api/users/register` | 新增員工（限管理員） |
| `GET` | `/api/users` | 員工清單 |
| `POST` | `/api/attendance/clock` | 打卡（帶經緯度） |
| `POST` | `/api/attendance/leave` | 請假 |
| `GET` | `/api/attendance/:userId/status` | 當日打卡狀態 |
| `GET` | `/api/attendance/:userId/history` | 個人出勤紀錄 |
| `GET` | `/api/attendance/all-records` | 全員出勤紀錄（限管理員） |
| `GET` | `/api/attendance/export` | 匯出 Excel 報表 |

## 快速開始

### 1. 後端

```bash
cd backend
npm install
cp .env.example .env    # 填入下方環境變數
npm run start:dev       # http://localhost:3000
```

### 2. 前端

`daka-web/index.html` 是靜態單頁，直接用瀏覽器開啟即可，
或以任意靜態伺服器提供（例如 `npx serve daka-web`）。

## 環境變數

在 `backend/.env` 設定（此檔不會提交進版本庫）：

| 變數 | 說明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 連線字串 |
| `JWT_SECRET` | JWT 簽章密鑰 |
| `ADMIN_PASSWORD` | 初始管理員密碼。**必填** —— 未設定時服務不會建立 ADMIN 帳號，以免固定預設密碼被公開原始碼的人直接使用 |

## 授權

Private — All rights reserved.
