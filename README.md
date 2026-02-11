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
