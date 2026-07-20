# FreeNote 任務追蹤

## ✅ Phase 0：專案初始化（完成）
## ✅ Phase 1：用戶認證（完成）

## Phase 2：任務管理核心（完成 ✅）

- [x] 新增 Task 資料型別 (`types/index.ts`)
- [x] 建立 Zustand `taskStore`
- [x] 建立 IndexedDB 離線存儲 (`lib/idb.ts`)
- [x] Firebase 任務 CRUD 服務 (`lib/firebase/tasks.ts`)
- [x] Firestore 離線持久化 + 同步佇列
- [x] TaskProvider（監聽即時任務更新）
- [x] 任務列表 UI（`/dashboard/tasks`）
- [x] 新增/編輯/刪除任務 Modal
- [x] 完成/取消完成 切換
- [x] 優先級標籤 + 截止日期顯示
- [x] 過濾分頁（全部 / 待完成 / 已完成）
- [x] AppShell 導航重構（桌面側邊欄 + 手機底部導航）
- [x] 編譯成功並推送 GitHub

## Phase 3：個人記事（完成 ✅）
- [x] 新增 Note 資料型別
- [x] 建立 Zustand `noteStore`
- [x] 建立 IndexedDB 離線存儲 (`lib/idb.ts`)
- [x] Firebase 記事 CRUD 服務 (`lib/firebase/notes.ts`)
- [x] 記事列表與分欄 UI
- [x] Markdown 編輯器與預覽切換
- [x] 自動儲存機制
- [x] 置頂、刪除功能

## Phase 4：大事月曆（完成 ✅）
- [x] 新增 CalendarEvent 資料型別
- [x] 建立 Zustand `calendarStore`
- [x] 建立 IndexedDB 離線存儲
- [x] Firebase 月曆事件 CRUD 服務
- [x] 日曆網格 UI（月份切換）
- [x] 當日事件面板
- [x] 新增/編輯事件 Modal（含顏色選擇）
## Phase 5：好友系統（完成 ✅）
- [x] 新增 InviteCode 和 FriendRequest 資料型別
- [x] 在 AppUser 中新增 friends 陣列
- [x] 建立 Firebase friends 服務（產生邀請碼、使用邀請碼）
- [x] 建立 Firebase 好友申請與清單訂閱邏輯
- [x] 建立 Zustand `friendStore`
- [x] 實作好友清單與待處理邀請介面
- [x] 實作產生/輸入邀請碼 Modal
- [x] 更新 AppShell 加入導航連結
## Phase 6：細粒度權限（完成 ✅）
- [x] 更新 `Task`, `Note`, `CalendarEvent` 型別加入 `sharedUserIds` 和 `sharedWith` (區分 view/edit)
- [x] 建立 `ShareModal` 組件
- [x] 在 Task, Note, Event 的 UI 中加入共用按鈕
- [x] 修改 Firebase 訂閱邏輯，同時查詢並合併個人與被共用的資料

## Phase 7：即時私訊（完成 ✅）
- [x] 定義 `Conversation` 和 `Message` 資料結構
- [x] 實作 `messages.ts` (Firebase service)
- [x] 建立 `messageStore` (Zustand)
- [x] 開發訊息頁面 UI (聊天室列表與對話視窗)
- [x] 在「好友」列表加入「發訊息」按鈕以建立/前往聊天室
## Phase 8：多語言 + 主題（完成 ✅）
- [x] 更新 `globals.css` 支援 `:root.dark` class
- [x] 建立 `i18n.ts` hook 處理英、中切換
- [x] 建立 `SettingsModal.tsx`，允許使用者設定並存入 Firebase
- [x] 在 `AppShell` 加入系統與暗色主題判斷邏輯，並套用多國語系文字

## Phase 9：PWA 完善 + 最終部署（完成 ✅）
- [x] 配置 `public/manifest.json` 與 PWA 圖示
- [x] 更新 `next.config.ts` 套用 `next-pwa` 產生 Service Worker
- [x] 靜態輸出 `out` 資料夾測試無誤
- [x] 程式碼整理，確認所有環境變數可透過 Vercel/Netlify 注入
- [x] 最後推送 GitHub，準備在 Netlify 進行部署
