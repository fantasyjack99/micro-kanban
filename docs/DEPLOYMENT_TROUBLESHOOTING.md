# 🚀 微看板部署問題與解決方案

> 本文档记录了「微看板」项目部署过程中遇到的所有问题及解决方案，供未来项目参考。

---

## 📋 問題總覽

| # | 問題描述 | 發生平台 | 解決方案 |
|---|---------|---------|---------|
| 1 | vite: command not found | Vercel / Render | 將 vite 從 devDependencies 移至 dependencies |
| 2 | npm install 子目錄依賴問題 | Render | 使用 `--prefix` 參數明確指定安裝目錄 |
| 3 | Build timeout (120分鐘超時) | Render | 優化 deploy.sh 脚本，跳過不必要的審計 |
| 4 | cd server: No such file or directory | Render | Root Directory 設為 `/` 或留空 |
| 5 | 前端無法連接後端 API | Vercel | 使用環境變數 `VITE_API_URL` 動態設定 API 路徑 |
| 6 | No Output Directory "dist" | Vercel | Output Directory 設為 `client/dist` |
| 7 | Static files 無法 serving | Render | 在後端加入 express.static 和 SPA fallback |

---

## 🔧 詳細問題與解決方案

### 問題 1：vite: command not found

**錯誤訊息：**
```
sh: line 1: vite: command not found
Error: Command "npm run build" exited with 127
```

**原因分析：**
- `vite` 被放在 `client/package.json` 的 `devDependencies` 中
- 部署環境只安裝 `dependencies`，跳過 `devDependencies`

**解決方案：**
```json
// client/package.json
{
  "dependencies": {
    "vite": "^5.0.11",  // 從 devDependencies 移至此處
    ...
  },
  "devDependencies": {
    // vite 移除
    ...
  }
}
```

**預防措施：**
- ✅ 生產環境需要的工具（如 vite、prisma）必須放在 `dependencies`
- ✅ 只有開發工具（如 nodemon、typescript）放在 `devDependencies`

---

### 問題 2：子目錄依賴無法正確安裝

**錯誤訊息：**
```
npm ERR! could not find package.json
```

**原因分析：**
- 專案結構為 monorepo（client/ + server/）
- Render 使用 Nixpacks，無法自動識別子目錄依賴

**解決方案：**
```bash
# 使用 --prefix 明確指定安裝目錄
npm install --prefix server
npm install --prefix client
```

**正確的 deploy.sh：**
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 安裝 server 依賴
npm install --prefix server

# 安裝 client 依賴
npm install --prefix client

# 生成 Prisma client
cd server && npx prisma generate && cd ..

# 建構 client
cd client && npm run build && cd ..

echo "✅ Deployment ready!"
```

**預防措施：**
- ✅ Monorepo 結構必須使用 `--prefix` 參數
- ✅ 不要假設 Nixpacks 會自動處理子目錄

---

### 問題 3：Build timeout 超時

**錯誤訊息：**
```
Timed out
```

**原因分析：**
- npm install 執行過久
- 安全審計（audit）耗費大量時間

**解決方案：**
```bash
# 使用 --prefer-offline 和 --no-audit 加速
npm install --prefix server --prefer-offline --no-audit
npm install --prefix client --prefer-offline --no-audit
```

**預防措施：**
- ✅ 生產部署使用 `--prefer-offline` 優先使用快取
- ✅ 使用 `--no-audit` 跳過安全審計（部署後可手動執行）
- ✅ 考慮使用 `npm ci` 替代 `npm install`（需要 lockfile）

---

### 問題 4：cd server: No such file or directory

**錯誤訊息：**
```
bash: line 1: cd: server: No such file or directory
Port scan timeout reached, no open ports detected
```

**原因分析：**
- Render 的 Root Directory 設為 `server`
- 但專案結構中 server 是根目錄的子目錄

**解決方案：**
在 Render Settings 中：
```
Root Directory: （留空，不要填 server）
Start Command: cd server && npm start
```

**專案結構：**
```
micro-kanban/
├── server/     ← Start Command 從這裡進入
│   └── package.json
├── client/
└── package.json  ← Root Directory 應該指向這裡
```

**預防措施：**
- ✅ Root Directory 設為 `/` 或留空（指向 repo 根目錄）
- ✅ 在 Start Command 中使用 `cd <folder>` 進入子目錄

---

### 問題 5：前端無法連接後端 API

**錯誤訊息：**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**原因分析：**
- 前端程式碼中 API 路徑寫死為相對路徑 `/api`
- 部署後前端和後端在不同網域

**解決方案：**

1. **前端 API 配置（client/src/api.js）：**
```javascript
const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api'
})
```

2. **環境變數（.env）：**
```
VITE_API_URL=https://your-backend-domain.onrender.com
```

3. **Vercel Environment Variables：**
```
Key: VITE_API_URL
Value: https://micro-kanban.onrender.com
```

**預防措施：**
- ✅ 永遠不要在程式碼中 hardcode API 路徑
- ✅ 使用環境變數（`import.meta.env.VITE_*`）動態設定
- ✅ 預設值設為本地開發路徑（`/api`）

---

### 問題 6：No Output Directory "dist"

**錯誤訊息：**
```
Error: No Output Directory named "dist" found after the Build completed
```

**原因分析：**
- Vercel 預期靜態檔案在根目錄的 `dist`
- 但 client 的輸出在 `client/dist`

**解決方案：**

在 Vercel Settings 中：
```
Build Command: cd client && npm install && npm run build
Output Directory: client/dist
```

**預防措施：**
- ✅ 清楚記錄前端輸出目錄位置
- ✅ Vercel 和 Render 的設定分開記錄

---

### 問題 7：後端無法 serving 前端靜態檔案

**錯誤訊息：**
```
Cannot GET /
```

**原因分析：**
- 部署架構改為「前端 Vercel + 後端 Render」
- 但後端原本設計 serving 前端檔案

**解決方案（已廢棄）：**
```javascript
// server/src/index.js（不再需要）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  })
}
```

**最終架構：**
- ✅ 前端 → Vercel（靜態托管）
- ✅ 後端 → Render（API 服務）
- ✅ 資料庫 → Render PostgreSQL

**預防措施：**
- ✅ 決定部署架構後，移除不需要的程式碼
- ✅ 前後端分離時，API 服務不需要 serving 靜態檔案

---

## 📝 部署檢查清單

### 部署前檢查

- [ ] `vite` 在 `dependencies`（非 `devDependencies`）
- [ ] `package-lock.json` 已提交到 GitHub
- [ ] `.env.example` 已建立
- [ ] 所有環境變數已記錄

### Render 部署檢查

- [ ] Root Directory 留空或設為 `/`
- [ ] Start Command 正確（`cd server && npm start`）
- [ ] `DATABASE_URL` 已設定
- [ ] `JWT_SECRET` 已生成
- [ ] `NODE_ENV=production` 已設定

### Vercel 部署檢查

- [ ] Build Command 正確（`cd client && npm install && npm run build`）
- [ ] Output Directory 正確（`client/dist`）
- [ ] `VITE_API_URL` 已設定（後端網址）

---

## 🔗 常用網址

| 服務 | 網址 |
|------|------|
| GitHub Repo | https://github.com/fantasyjack99/micro-kanban |
| 後端 (Render) | https://micro-kanban.onrender.com |
| 前端 (Vercel) | https://micro-kanban.vercel.app |
| Render Dashboard | https://dashboard.render.com |
| Vercel Dashboard | https://vercel.com |

---

## 📚 參考資源

- [Render Deploys Documentation](https://render.com/docs/deploys)
- [Vercel Documentation](https://vercel.com/docs)
- [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Vite Deployment](https://vitejs.dev/guide/build.html#deployment)

---

## 🏷️ 版本資訊

- **建立日期:** 2026-02-12
- **作者:** Sabrina
- **專案:** micro-kanban

---

> 💡 **提示：** 未來建立類似專案時，請先閱讀此文件，避免重蹈覆轍！
