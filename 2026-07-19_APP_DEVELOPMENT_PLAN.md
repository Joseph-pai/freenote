# 📋 FreeNote APP 開發計劃 v2.1（已確認版）

> **專案名稱**: FreeNote  
> **參考產品**: 滴答清單 (TickTick / DIDA365)  
> **代碼倉庫**: https://github.com/Joseph-pai/freenote  
> **部署平台**: Netlify（GitHub 導入自動部署）  
> **計劃版本**: v2.1 | 更新日期: 2026-07-19

---

## ✅ 已確認設計決策

| 項目 | 決策 |
|------|------|
| 代碼管理 | GitHub → Netlify 自動導入部署 |
| 登入方式 | Email/密碼 ＋ Google OAuth |
| 訊息加密 | Firebase TLS 傳輸加密（不做 E2E） |
| 邀請碼設計 | **方案 B**：一次性邀請碼（用完即廢） |
| 離線支援 | 離線可用所有非即時功能，連線後自動同步 |
| 平台規劃 | 先做 PWA，未來再打包 iOS/Android 原生 App |

---

## 🏗️ 一、技術架構

### 前端
| 技術 | 選擇 |
|------|------|
| 框架 | Next.js 14 (App Router + 靜態導出) |
| 語言 | TypeScript |
| 樣式 | Vanilla CSS + CSS Variables 設計系統 |
| 狀態管理 | Zustand |
| 國際化 | next-intl |
| PWA | next-pwa (Workbox) |
| Markdown | react-markdown + remark-gfm |
| 離線資料 | IndexedDB (idb 庫) |

### 後端（Firebase）
| 服務 | 用途 |
|------|------|
| Firebase Authentication | Email/密碼 + Google OAuth |
| Firestore | 主要資料庫（任務/記事/月曆/好友/權限）|
| Realtime Database | 即時私密訊息 |
| Cloud Storage | 頭像、圖片附件 |
| Cloud Functions | 邀請碼驗證/過期清理/推送通知 |

### 部署流程
```
本地開發 → git push → GitHub → Netlify 自動偵測 → Build → 部署
```

---

## 🔥 二、Firebase 完整建置步驟

### Step 1：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「**新增專案**」
3. 專案名稱輸入：`freenote`
4. **停用** Google Analytics（簡化配置）
5. 點擊「**建立專案**」

---

### Step 2：啟用 Authentication

1. 在 Firebase Console 左側選單 → **Authentication** → 「**開始使用**」
2. 點擊「**Sign-in method**」分頁
3. 啟用 **電子郵件/密碼**：
   - 點擊「電子郵件/密碼」→ 開啟第一個開關 → 儲存
4. 啟用 **Google**：
   - 點擊「Google」→ 開啟開關
   - 填入「專案的公開名稱」：`FreeNote`
   - 選擇「專案支援電子郵件」→ 儲存
5. 在「**Authorized domains**」分頁加入您的 Netlify 網域（部署後補填）

---

### Step 3：建立 Firestore 資料庫

1. 左側選單 → **Firestore Database** → 「**建立資料庫**」
2. 選擇「**以生產模式啟動**」（我們會自己設定 Security Rules）
3. 選擇位置：**asia-east1（台灣/香港附近）** 或 asia-northeast1（東京）
4. 點擊「啟用」

---

### Step 4：建立 Realtime Database

1. 左側選單 → **Realtime Database** → 「**建立資料庫**」
2. 選擇位置：**us-central1**（即時訊息延遲可接受）
3. 選擇「**以鎖定模式啟動**」
4. 建立後，Rules 分頁貼上初始規則（見 Step 9）

---

### Step 5：建立 Cloud Storage

1. 左側選單 → **Storage** → 「**開始使用**」
2. 選擇「**以生產模式啟動**」
3. 選擇位置：**asia-east1**

---

### Step 6：加入 Web App 並取得配置

1. Firebase Console 首頁 → 點擊 **`</>`（Web）** 圖示
2. 應用程式暱稱：`freenote-web`
3. **不勾選** Firebase Hosting（我們用 Netlify）
4. 點擊「**註冊應用程式**」
5. 複製下方的 `firebaseConfig` 物件：

```javascript
// 這是範例格式，您的實際值會不同
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "freenote-xxxxx.firebaseapp.com",
  projectId: "freenote-xxxxx",
  storageBucket: "freenote-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  databaseURL: "https://freenote-xxxxx-default-rtdb.firebaseio.com"
};
```

6. 在專案根目錄建立 `.env.local` 檔案（**不要推上 GitHub！**）：

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=freenote-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=freenote-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=freenote-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://freenote-xxxxx-default-rtdb.firebaseio.com
```

7. 確認 `.gitignore` 包含：

```
.env.local
.env*.local
```

---

### Step 7：安裝 Firebase CLI 並初始化

```bash
# 安裝 Firebase CLI（全域）
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 在專案目錄初始化
cd /Users/joseph/Downloads/freenote
firebase init

# 選擇以下服務（空白鍵選取，Enter 確認）：
# ✅ Firestore
# ✅ Functions
# ✅ Storage
# ✅ Emulators（本地開發用）

# 選擇現有專案：freenote-xxxxx
# Functions 語言：TypeScript
# Emulators：Auth, Firestore, Functions, Storage, Realtime Database
```

---

### Step 8：部署 Firestore Security Rules

在 `firestore.rules` 檔案貼上以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return request.auth.uid == uid;
    }

    function canView(resource) {
      return resource.data.sharedWith[request.auth.uid].canView == true;
    }

    function canEdit(resource) {
      return resource.data.sharedWith[request.auth.uid].canEdit == true;
    }

    match /users/{userId} {
      allow read: if isAuth();
      allow write: if isOwner(userId);
    }

    match /friendships/{id} {
      allow read: if isAuth() && request.auth.uid in resource.data.userIds;
      allow create: if isAuth() && isOwner(request.resource.data.initiatorId);
      allow update: if isAuth() && request.auth.uid in resource.data.userIds;
      allow delete: if isAuth() && request.auth.uid in resource.data.userIds;
    }

    match /invitationCodes/{code} {
      allow read: if isAuth();
      allow create: if isAuth() && isOwner(request.resource.data.creatorId);
      allow update: if isAuth();
      allow delete: if isAuth() && isOwner(resource.data.creatorId);
    }

    match /taskLists/{listId} {
      allow read, write: if isAuth() && isOwner(resource.data.ownerId);
    }

    match /tasks/{taskId} {
      allow read: if isAuth() && (isOwner(resource.data.ownerId) || canView(resource));
      allow create: if isAuth() && isOwner(request.resource.data.ownerId);
      allow update: if isAuth() && (isOwner(resource.data.ownerId) || canEdit(resource));
      allow delete: if isAuth() && isOwner(resource.data.ownerId);
    }

    match /notes/{noteId} {
      allow read: if isAuth() && (isOwner(resource.data.ownerId) || canView(resource));
      allow create: if isAuth() && isOwner(request.resource.data.ownerId);
      allow update: if isAuth() && (isOwner(resource.data.ownerId) || canEdit(resource));
      allow delete: if isAuth() && isOwner(resource.data.ownerId);
    }

    match /calendarEvents/{eventId} {
      allow read: if isAuth() && (isOwner(resource.data.ownerId) || canView(resource));
      allow create: if isAuth() && isOwner(request.resource.data.ownerId);
      allow update: if isAuth() && (isOwner(resource.data.ownerId) || canEdit(resource));
      allow delete: if isAuth() && isOwner(resource.data.ownerId);
    }
  }
}
```

---

### Step 9：部署 Realtime Database Rules

在 Firebase Console → Realtime Database → Rules 分頁貼上：

```json
{
  "rules": {
    "chats": {
      "$chatId": {
        ".read": "auth != null && ($chatId.contains(auth.uid))",
        ".write": "auth != null && ($chatId.contains(auth.uid))",
        "messages": {
          "$messageId": {
            ".validate": "newData.hasChildren(['senderId', 'content', 'timestamp', 'type'])"
          }
        }
      }
    },
    "userChats": {
      "$userId": {
        ".read": "auth != null && auth.uid === $userId",
        ".write": "auth != null && auth.uid === $userId"
      }
    }
  }
}
```

---

### Step 10：啟用 Cloud Functions 並部署

```bash
# 部署所有規則與 Functions
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

### Step 11：Netlify 設定 GitHub 導入

1. 登入 [Netlify](https://netlify.com) → 「**Add new site**」→「**Import an existing project**」
2. 選擇 **GitHub** → 授權 → 選擇 `Joseph-pai/freenote`
3. 設定 Build：
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `out`（Next.js 靜態導出目錄）
4. 展開「**Environment variables**」→ 填入所有 `NEXT_PUBLIC_FIREBASE_*` 變數
5. 點擊「**Deploy site**」

> ⚠️ 部署完成後，回到 Firebase Console → Authentication → Authorized domains，加入您的 Netlify 網域（格式：`your-site-name.netlify.app`）。否則 Google 登入會失敗！

---

### Step 12：本地開發環境（Firebase Emulators）

```bash
# 啟動 Firebase 模擬器
firebase emulators:start

# 新開一個 Terminal，啟動 Next.js
npm run dev

# 訪問模擬器 UI
# http://localhost:4000
```

在 `src/lib/firebase/config.ts` 中設定模擬器連接：

```typescript
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectDatabaseEmulator(database, 'localhost', 9000);
}
```

---

## 🗃️ 三、資料模型（已確認版）

### Users
```typescript
// /users/{uid}
{
  uid: string,
  email: string,
  nickname: string,
  avatarUrl: string | null,
  language: 'zh-TW' | 'en' | 'ja' | 'ko',
  theme: 'light' | 'dark' | 'system',
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### InvitationCodes（一次性邀請碼）
```typescript
// /invitationCodes/{code}
{
  code: string,             // 8位英數字大寫，例如 "A3F9KX2R"
  creatorId: string,        // 創建者 UID
  isUsed: boolean,          // 是否已使用（用完即廢）
  usedBy: string | null,    // 使用者 UID
  usedAt: Timestamp | null,
  expiresAt: Timestamp,     // 48小時後過期
  createdAt: Timestamp,
}
```

### Tasks / Notes / CalendarEvents（含細粒度權限）
```typescript
{
  // ...各自欄位
  sharedWith: {
    [friendUid: string]: {
      canView: boolean,
      canEdit: boolean,
      sharedAt: Timestamp,
    }
  }
}
```

### Messages（Realtime Database）
```json
// /chats/{uid1_uid2}/messages/{messageId}
{
  "senderId": "uid",
  "content": "訊息內容",
  "type": "text | image | file",
  "fileUrl": null,
  "timestamp": 1721394000000,
  "readBy": { "uid2": 1721394001000 },
  "isDeleted": false
}
```

---

## 📅 四、分階段開發計劃

### 🔵 Phase 0：專案初始化（1-2 天）
- [ ] 建立 Next.js 14 + TypeScript 專案
- [ ] 配置 next-pwa
- [ ] 配置 next-intl（繁體中文/英文/日文/韓文）
- [ ] 整合 Firebase SDK + Emulators
- [ ] 建立 CSS 設計系統（CSS Variables）
- [ ] AppShell 佈局（桌面側邊欄 + 移動端底部導航）
- [ ] 配置 Netlify GitHub 自動部署
- [ ] 確認 `git push` → Netlify 自動更新流程

### 🔵 Phase 1：Firebase 建置 + 用戶認證（2-3 天）
- [ ] Firebase Console 完整配置（依 Step 1-12）
- [ ] Email/密碼 註冊頁面
- [ ] Email/密碼 登入頁面
- [ ] Google OAuth 登入
- [ ] 密碼重置（發送重置信）
- [ ] 用戶資料設定（暱稱、頭像上傳、語言）
- [ ] 認證路由保護（未登入自動跳轉）
- [ ] Firestore Security Rules 部署

### 🔵 Phase 2：工作清單（4-5 天）
- [ ] 清單分類 CRUD
- [ ] 任務 CRUD（含子任務）
- [ ] 優先級 / 截止日期 / 標籤
- [ ] 排序過濾
- [ ] IndexedDB 離線快取（Workbox 策略）
- [ ] 離線新增/編輯 → 連線後自動同步

### 🔵 Phase 3：個人記事（3-4 天）
- [ ] 記事 CRUD
- [ ] Markdown 編輯器
- [ ] 顏色便簽 / 置頂 / 標籤 / 搜尋
- [ ] IndexedDB 離線快取
- [ ] 卡片瀑布流視圖

### 🔵 Phase 4：大事月曆（4-5 天）
- [ ] 月視圖 + 日程視圖
- [ ] 事件 CRUD（全天/重複/顏色/地點）
- [ ] 重複事件（每日/周/月/年）
- [ ] 事件提醒
- [ ] IndexedDB 離線快取

### 🔵 Phase 5：一次性邀請碼系統（3-4 天）
- [ ] 生成一次性邀請碼（8位，48小時過期，用完即廢）
- [ ] 複製 / 分享邀請碼
- [ ] 使用邀請碼發送好友申請
- [ ] App 內通知（新好友申請）
- [ ] 接受 / 拒絕好友申請
- [ ] 好友列表（頭像、暱稱）
- [ ] 封鎖好友
- [ ] Cloud Function：邀請碼驗證 + 自動過期清理

### 🔵 Phase 6：細粒度權限控制（3-4 天）
- [ ] 每個內容的「分享設定」UI
- [ ] 對個別好友設定：可查看 / 可編輯
- [ ] 好友視角：只能看到被授權內容
- [ ] 被授權內容視覺標示
- [ ] 權限修改即時生效

### 🔵 Phase 7：即時私密通訊（4-5 天）
- [ ] 好友聊天列表
- [ ] 點對點即時文字訊息（Realtime Database）
- [ ] 圖片發送
- [ ] 訊息已讀狀態
- [ ] 訊息刪除（軟刪除）
- [ ] 離線訊息隊列（連線後自動發送）
- [ ] 系統通知（新訊息徽標）

### 🔵 Phase 8：多語言 + 主題（2-3 天）
- [ ] 繁體中文完整翻譯（主要語言）
- [ ] 英文 / 日文 翻譯
- [ ] 語言切換 UI
- [ ] 深色模式 / 淺色模式 / 跟隨系統
- [ ] 主題顏色自訂

### 🔵 Phase 9：PWA 完善 + 最終部署（2-3 天）
- [ ] Service Worker 離線快取策略
- [ ] PWA Manifest 完整配置（圖標、主題色、方向）
- [ ] 安裝提示 UI（Add to Home Screen）
- [ ] 離線指示器（顯示目前連線狀態）
- [ ] 離線佇列指示（顯示待同步筆數）
- [ ] Lighthouse 審核（目標 PWA 分數 ≥ 85）
- [ ] Netlify 最終部署驗證
- [ ] Firebase Console → Authorized Domains 加入正式網域

---

## 📁 五、專案文件結構

```
freenote/
├── public/
│   ├── manifest.json           # PWA Manifest
│   ├── icons/                  # PWA 圖標（48, 72, 96, 128, 192, 512px）
│   └── locales/
│
├── src/
│   ├── app/[locale]/           # 多語言 App Router
│   │   ├── layout.tsx
│   │   ├── auth/               # 登入 / 註冊 / 重置密碼
│   │   ├── tasks/              # 工作清單
│   │   ├── notes/              # 個人記事
│   │   ├── calendar/           # 大事月曆
│   │   ├── messages/           # 即時通訊
│   │   ├── friends/            # 好友管理
│   │   └── settings/           # 設定
│   │
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, BottomNav, Header
│   │   ├── tasks/              # TaskCard, TaskForm, SubTaskList, ListPicker
│   │   ├── notes/              # NoteCard, MarkdownEditor, ColorPicker
│   │   ├── calendar/           # MonthView, AgendaView, EventForm
│   │   ├── messages/           # ChatBubble, MessageInput, ChatList
│   │   ├── friends/            # FriendCard, InviteModal, PermissionPicker
│   │   └── ui/                 # Button, Modal, Toast, Avatar, Badge, Spinner
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts       # Firebase 初始化 + Emulator 連接
│   │   │   ├── auth.ts         # 認證服務（Email + Google）
│   │   │   ├── firestore.ts    # Firestore CRUD 封裝
│   │   │   ├── realtime.ts     # Realtime DB 訊息封裝
│   │   │   └── storage.ts      # Storage 上傳封裝
│   │   ├── offline/
│   │   │   ├── indexeddb.ts    # IndexedDB 操作封裝
│   │   │   ├── syncQueue.ts    # 離線操作佇列
│   │   │   └── syncManager.ts  # 連線恢復後自動同步
│   │   └── utils/
│   │       ├── invitation.ts   # 邀請碼生成（8位大寫英數字）
│   │       ├── permission.ts   # 權限工具
│   │       └── date.ts         # 日期格式化
│   │
│   ├── stores/                 # Zustand 狀態管理
│   │   ├── authStore.ts
│   │   ├── taskStore.ts
│   │   ├── noteStore.ts
│   │   ├── calendarStore.ts
│   │   ├── messageStore.ts
│   │   ├── friendStore.ts
│   │   └── offlineStore.ts     # 離線狀態 + 待同步計數
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOnlineStatus.ts  # 監聽網路連線狀態
│   │   ├── useTasks.ts
│   │   ├── useNotes.ts
│   │   ├── useCalendar.ts
│   │   ├── useMessages.ts
│   │   └── useFriends.ts
│   │
│   ├── types/index.ts          # 所有 TypeScript 類型定義
│   └── styles/
│       ├── globals.css
│       ├── variables.css       # 設計系統 CSS Variables
│       └── animations.css
│
├── messages/                   # i18n 翻譯文件
│   ├── zh-TW.json              # 繁體中文（主要）
│   ├── en.json
│   └── ja.json
│
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       ├── invitations.ts      # 邀請碼生成、驗證、清理
│       └── notifications.ts    # 推送通知
│
├── firestore.rules             # Firestore 安全規則
├── firestore.indexes.json      # Firestore 複合索引
├── storage.rules               # Storage 安全規則
├── firebase.json               # Firebase 服務配置
├── .firebaserc                 # Firebase 專案綁定
├── next.config.js              # Next.js + PWA 配置
├── .env.local                  # 本地環境變數（不推上 GitHub）
├── .env.example                # 環境變數範本（推上 GitHub，供參考）
├── .gitignore
└── package.json
```

---

## 🔒 六、離線策略設計

```
用戶操作
    ↓
檢查網路狀態 (useOnlineStatus)
    ├── 在線 → 直接寫入 Firestore
    └── 離線 → 寫入 IndexedDB + 加入 syncQueue
                    ↓
            網路恢復時 (syncManager)
                    ↓
            按序批次同步到 Firestore
                    ↓
            清除 syncQueue + 更新 UI
```

**即時通訊離線處理**：
- 離線時訊息存入本地 IndexedDB
- 連線後自動發送，並標記「延遲送達」時間戳記

---

## ⚠️ 七、技術風險與對策

| 風險 | 對策 |
|------|------|
| Firestore 權限查詢複雜度 | 使用 `array-contains-any` + 預加載好友 UID 清單 |
| 離線同步衝突 | Last-Write-Wins，顯示「此內容已被更新」提示 |
| 邀請碼暴力猜測 | 8位英數字，每用戶每小時最多生成 10 個 |
| Google OAuth 網域限制 | 部署後立即加入 Netlify 網域到 Authorized Domains |
| Next.js 靜態導出限制 | 所有 API 改用 Firebase SDK 直接調用，不用 API Routes |

---

## ✅ 八、驗收標準

| 項目 | 標準 |
|------|------|
| 跨平台 | 手機/平板/桌面 UI 正常 |
| 離線功能 | 無網路仍可讀取/新增/編輯 |
| 離線同步 | 連線後 ≤ 5 秒自動同步 |
| PWA 安裝 | 可加入手機主畫面 |
| Lighthouse | PWA 分數 ≥ 85 |
| 即時訊息 | 訊息延遲 ≤ 500ms |
| 好友權限 | 無越權訪問（Security Rules 驗證） |
| 部署 | GitHub push → Netlify 自動更新 |

---

*計劃版本：v2.1（已確認版）| 更新日期：2026-07-19*
