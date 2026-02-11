# 📋 微看板 (Micro-Kanban)

一個極簡、直覺的專案管理工具，仿照 Trello 的核心功能。

## ✨ 功能特色

- 📊 **看板管理** - 建立多個看板，追蹤專案進度
- 📝 **卡片系統** - 支援標題、描述、分類標籤、顏色標記
- 🔥 **拖拽功能** - 直覺的拖拽操作，輕鬆移動任務
- ⏰ **逾期提醒** - 自動偵測逾期任務，視覺化提醒
- 🔐 **用戶認證** - JWT 安全登入系統
- 📱 **響應式設計** - 支援手機與電腦

## 🛠️ 技術棧

### 前端
- **React 18** - UI 框架
- **Vite** - 建構工具
- **TailwindCSS** - 樣式框架
- **SortableJS** - 拖拽功能
- **React Router** - 路由管理
- **Axios** - HTTP 客戶端
- **date-fns** - 日期處理

### 後端
- **Node.js** - 執行環境
- **Express** - Web 框架
- **Prisma** - ORM 資料庫工具
- **PostgreSQL** - 資料庫
- **JWT** - 身份驗證
- **bcryptjs** - 密碼加密

## 🚀 快速開始

### 環境需求
- Node.js 18+
- PostgreSQL 14+

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/fantasyjack99/micro-kanban.git
cd micro-kanban

# 2. 安裝依賴
npm run install:all

# 3. 設定環境變數
cp server/.env.example server/.env
# 編輯 server/.env，填入資料庫連接資訊和 JWT Secret

# 4. 初始化資料庫
cd server
npm run prisma:generate
npm run prisma:push

# 5. 啟動開發伺服器
npm run dev
```

### 環境變數 (server/.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/micro_kanban?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
```

## 📁 專案結構

```
micro-kanban/
├── client/                 # 前端 React 專案
│   ├── src/
│   │   ├── components/     # 可复用元件
│   │   ├── pages/          # 頁面元件
│   │   ├── context/        # React Context
│   │   ├── hooks/          # 自定義 Hooks
│   │   └── utils/          # 工具函數
│   └── ...
├── server/                 # 後端 Node.js 專案
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中間件
│   │   └── utils/          # 工具函數
│   └── prisma/             # Prisma Schema
└── ...
```

## 🔧 可用的 npm 指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動前後端開發伺服器 |
| `npm run dev:server` | 只啟動後端伺服器 |
| `npm run dev:client` | 只啟動前端開發伺服器 |
| `npm run build` | 建構前端 production 版本 |
| `npm run install:all` | 安裝所有依賴 |

## 🌐 API 文件

### 認證 API
| 方法 | 端點 | 說明 |
|------|------|------|
| POST | /api/auth/register | 註冊新用戶 |
| POST | /api/auth/login | 用戶登入 |
| GET | /api/auth/me | 獲取當前用戶資訊 |

### 看板 API
| 方法 | 端點 | 說明 |
|------|------|------|
| GET | /api/boards | 獲取所有看板 |
| GET | /api/boards/:id | 獲取單個看板 |
| POST | /api/boards | 建立看板 |
| PUT | /api/boards/:id | 更新看板 |
| DELETE | /api/boards/:id | 刪除看板 |

### 卡片 API
| 方法 | 端點 | 說明 |
|------|------|------|
| POST | /api/cards | 建立卡片 |
| PUT | /api/cards/:id | 更新卡片 |
| DELETE | /api/cards/:id | 刪除卡片 |
| POST | /api/cards/move | 移動卡片 |

## 🎨 螢幕截圖

[待添加]

## 📝 License

MIT License

## 👤 作者

**fantasyjack99**
- GitHub: [@fantasyjack99](https://github.com/fantasyjack99)

---

建立日期: 2026-02-11

---

## 🚀 部署到 Render.com（完全免費）

### 步驟 1：建立 Render 帳號

1. 打開 https://render.com
2. 用 GitHub 登入
3. 連接 GitHub 帳號

### 步驟 2：建立 PostgreSQL 資料庫

1. 點擊 **"New +"** → **"PostgreSQL"**
2. 設定：
   - **Name:** `micro-kanban-db`
   - **Plan:** Free（免費）
   - **Region:** 選擇離你最近的
3. 點擊 **"Create Database"**
4. 複製 **External Database URL**（等一下要用）

### 步驟 3：建立 Web Service

1. 點擊 **"New +"** → **"Web Service"**
2. 選擇 GitHub repository: `fantasyjack99/micro-kanban`
3. 設定：
   - **Name:** `micro-kanban`
   - **Root Directory:** `/`（或留空）
   - **Build Command:** `npm install && npm run install:all && npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** Free（免費）

### 步驟 4：設定環境變數

在 Web Service 的 **"Environment Variables"** 頁面，新增：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | PostgreSQL 的 External Database URL |
| `JWT_SECRET` | 一個隨機字串（可以用 `openssl rand -hex 32` 生成） |
| `NODE_ENV` | `production` |

### 步驟 5：部署

1. 點擊 **"Create Web Service"**
2. Render 會自動建置並部署
3. 等待狀態變成 **"Live"**

### 步驟 6：完成 🎉

- 訪問你的專案網址：`https://micro-kanban.onrender.com`
- 註冊帳號並開始使用！

---

## 🔧 常見問題

### Q: 網站載入很慢？
A: 免費版 15 分鐘無活動會休眠，首次訪問需要 30-60 秒喚醒。

### Q: 如何升級？
A: 在 Render Dashboard 選擇你的服務 → Settings → Plan

### Q: 資料會不見嗎？
A: 免費版不會刪除資料，除非你手動刪除資料庫服務。

---

## 📝 部署完成後

1. 設定自訂網域（可選）
2. 啟用 HTTPS（自動）
3. 監控使用量：https://dashboard.render.com

