# 📋 時間管理APP開發計劃

## 一、功能分析與需求對照

### 參考滴答清單核心功能
| 功能模組 | 滴答清單功能 | 本APP對應功能 |
|---------|-------------|--------------|
| 任務管理 | 待辦事項、優先級、標籤、過濾器 | ✅ 工作清單 |
| 記事管理 | 筆記、便簽 | ✅ 個人記事 |
| 日曆規劃 | 年/月/周/日視圖、日程視圖 | ✅ 大事月曆 |
| 社交協作 | 共享清單、分配任務 | ✅ 好友邀請+權限控制 |
| 即時通訊 | - | ✅ 即時私密互通 |

### 本APP特色功能
- **邀請碼好友系統**: 用戶發送邀請碼，對方使用邀請碼加入好友
- **細粒度權限控制**: 對每個功能選項/內容設定個別好友的觀看/編輯權限
- **多語言支持**: 繁體中文為主，可切換多語言

---

## 二、技術架構

### 前端框架
| 平台 | 技術方案 | 說明 |
|-----|---------|------|
| iOS/Android | **Flutter** | 跨平台開發，一套代碼多端運行 |
| 桌面端 | **Flutter Desktop** | 未來可擴展 |

### Firebase 服務架構
| 服務 | 使用場景 |
|-----|---------|
| **Firebase Authentication** | 用戶註冊、登入、密碼重置 |
| **Firestore** | 用戶資料、工作清單、個人記事、月曆事件、好友關係、權限設定 |
| **Realtime Database** | 即時私密訊息（低延遲、高頻更新） |
| **Cloud Storage** | 附件、頭像等檔案存儲 |
| **Cloud Functions** | 邀請碼生成/驗證、通知觸發 |
| **Firebase Messaging** | 推送通知 |

### 多語言方案
- 使用 Flutter `intl` 套件
- 語言包存放在 `lib/l10n/` 目錄

---

## 三、Firestore 資料模型設計

### 1. Users（用戶集合）
```typescript
{
  uid: string,                    // Firebase UID
  email: string,                  // 註冊信箱
  nickname: string,               // 顯示名稱
  avatarUrl: string | null,       // 頭像URL
  createdAt: timestamp,           // 註冊時間
  language: string,               // 語言偏好 (zh-TW/en/ja)
  theme: string,                  // 主題偏好
}
```

### 2. Friendships（好友關係）
```typescript
{
  id: string,                     // 關係ID
  userId: string,                 // 主用戶UID
  friendId: string,               // 好友UID
  status: 'pending' | 'accepted', // 好友狀態
  invitedBy: string,              // 邀請發起者
  createdAt: timestamp,
}
```

### 3. InvitationCodes（邀請碼）
```typescript
{
  code: string,                   // 邀請碼（隨機6位字元）
  userId: string,                 // 發起邀請的用戶
  usedBy: string | null,          // 使用邀請碼的用戶
  expiresAt: timestamp,           // 過期時間（24小時）
  createdAt: timestamp,
  isUsed: boolean,                // 是否已使用
}
```

### 4. Tasks（工作清單）
```typescript
{
  id: string,
  userId: string,                 // 擁有者
  title: string,                  // 任務標題
  description: string | null,     // 詳細描述
  priority: 'low' | 'medium' | 'high', // 優先級
  status: 'todo' | 'doing' | 'done',   // 狀態
  dueDate: timestamp | null,      // 截止日期
  tags: string[],                 // 標籤
  reminders: timestamp[],         // 提醒時間
  createdAt: timestamp,
  updatedAt: timestamp,
  permissions: {                  // 權限設定
    [friendUid: string]: {
      canView: boolean,
      canEdit: boolean,
    }
  }
}
```

### 5. Notes（個人記事）
```typescript
{
  id: string,
  userId: string,
  title: string,
  content: string,                // Markdown格式
  color: string,                  // 便簽顏色
  isPinned: boolean,              // 是否置頂
  createdAt: timestamp,
  updatedAt: timestamp,
  permissions: {
    [friendUid: string]: {
      canView: boolean,
      canEdit: boolean,
    }
  }
}
```

### 6. CalendarEvents（大事月曆）
```typescript
{
  id: string,
  userId: string,
  title: string,
  description: string | null,
  startDate: timestamp,           // 開始時間
  endDate: timestamp,             // 結束時間
  isAllDay: boolean,              // 是否全天事件
  color: string,                  // 事件顏色
  location: string | null,        // 地點
  isRecurring: boolean,           // 是否重複事件
  recurrenceRule: string | null,  // 重複規則
  createdAt: timestamp,
  updatedAt: timestamp,
  permissions: {
    [friendUid: string]: {
      canView: boolean,
      canEdit: boolean,
    }
  }
}
```

### 7. Messages（即時訊息 - Realtime Database）
```typescript
{
  chatId: string,                 // 聊天ID (uid1_uid2)
  messages: [
    {
      id: string,
      senderId: string,
      content: string,
      timestamp: timestamp,
      type: 'text' | 'image' | 'file',
      fileUrl: string | null,
    }
  ]
}
```

---

## 四、Firestore Security Rules 設計原則

```typescript
// 用戶只能讀寫自己的資料
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// 好友關係：雙方都能讀取
match /friendships/{friendshipId} {
  allow read: if request.auth.uid == resource.data.userId || 
              request.auth.uid == resource.data.friendId;
  allow write: if request.auth.uid == resource.data.userId;
}

// 任務：檢查權限
match /tasks/{taskId} {
  allow read: if request.auth.uid == resource.data.userId || 
              (resource.data.permissions[request.auth.uid]?.canView == true);
  allow write: if request.auth.uid == resource.data.userId || 
               (resource.data.permissions[request.auth.uid]?.canEdit == true);
}
```

---

## 五、開發階段規劃

### 階段一：Firebase 基礎建設與用戶認證 ⏱️ 預計 3-5 天

**功能列表：**
1. Firebase 專案初始化
2. Email/密碼認證實現
3. 用戶註冊/登入/登出
4. 用戶資料編輯（暱稱、頭像、語言）
5. 密碼重置功能

**交付物：**
- Firebase 配置文件
- 認證頁面 UI
- 用戶資料管理頁面
- 基本路由架構

---

### 階段二：核心功能 CRUD ⏱️ 預計 7-10 天

**功能列表：**
1. 工作清單（新增、編輯、刪除、標記完成、優先級）
2. 個人記事（新增、編輯、刪除、Markdown渲染、顏色標籤）
3. 大事月曆（月視圖、日視圖、事件新增/編輯）

**交付物：**
- 工作清單頁面與邏輯
- 個人記事頁面與邏輯
- 月曆頁面與邏輯
- 數據持久化到 Firestore

---

### 階段三：邀請碼好友系統 ⏱️ 預計 3-5 天

**功能列表：**
1. 生成邀請碼（隨機6位，24小時過期）
2. 分享邀請碼（複製到剪貼板）
3. 使用邀請碼加入好友
4. 好友請求管理（接受/拒絕）
5. 好友列表展示

**交付物：**
- Cloud Function 生成驗證邀請碼
- 邀請碼頁面
- 好友列表頁面
- 好友請求處理

---

### 階段四：細粒度權限控制層 ⏱️ 預計 5-7 天

**功能列表：**
1. 權限設定頁面設計
2. 對每個任務/記事/事件設定個別好友權限
3. Firestore Security Rules 實現
4. 權限繼承邏輯
5. 基於權限的數據查詢過濾

**交付物：**
- 權限設定 UI 組件
- Security Rules 完整配置
- 權限過濾查詢邏輯

---

### 階段五：即時私密通訊與多語言 ⏱️ 預計 5-7 天

**功能列表：**
1. 即時訊息頁面
2. Realtime Database 消息同步
3. 聊天列表展示
4. 多語言支持（繁體中文、英文、日文）
5. 推送通知配置

**交付物：**
- 聊天界面與邏輯
- 消息實時同步
- 多語言包文件
- 推送通知服務

---

### 階段六：優化與測試 ⏱️ 預計 3-5 天

**功能列表：**
1. 性能優化（列表加載、圖片緩存）
2. 錯誤處理與異常捕獲
3. 單元測試與集成測試
4. UI 精細調整

**交付物：**
- 優化後的代碼
- 測試報告
- 可發佈版本

---

## 六、技術風險點

| 風險 | 影響 | 緩解策略 |
|-----|------|---------|
| Firestore 查詢複雜度 | 權限過濾可能導致 N+1 查詢 | 預加載好友列表，使用複合查詢 |
| Realtime DB 費用 | 即時通訊寫入頻率高 | 實現消息壓縮，清理歷史消息 |
| 邀請碼濫用 | 惡意用戶大量生成 | 限制每用戶每日生成數量 |
| 權限安全漏洞 | 越權訪問風險 | 嚴格 Security Rules 驗證 |

---

## 七、文件結構預覽

```
lib/
├── main.dart                     # 入口文件
├── firebase_options.dart         # Firebase 配置
├── app.dart                      # 根組件
├── localization/                 # 多語言
│   ├── app_localizations.dart
│   └── l10n/
├── models/                       # 數據模型
│   ├── user.dart
│   ├── task.dart
│   ├── note.dart
│   ├── event.dart
│   ├── friendship.dart
│   └── message.dart
├── services/                     # 服務層
│   ├── auth_service.dart
│   ├── firestore_service.dart
│   ├── realtime_service.dart
│   ├── storage_service.dart
│   └── notification_service.dart
├── widgets/                      # 通用組件
│   ├── task_card.dart
│   ├── note_card.dart
│   ├── event_card.dart
│   └── permission_picker.dart
├── screens/                      # 頁面
│   ├── auth/
│   ├── task/
│   ├── note/
│   ├── calendar/
│   ├── friends/
│   ├── chat/
│   └── settings/
└── utils/                        # 工具函數
    ├── permission_utils.dart
    ├── date_utils.dart
    └── invitation_code.dart
```

---

## 八、驗收標準

### 每階段驗收
- ✅ 功能完整實現
- ✅ UI/UX 符合設計稿
- ✅ 數據正確存儲與同步
- ✅ 權限控制有效

### 整體驗收
- ✅ 跨平台一致性（iOS/Android）
- ✅ 性能滿意（列表加載 < 1秒）
- ✅ 安全合規（無越權訪問）
- ✅ 多語言切換正常

---

*計劃版本：v1.0*
*建立日期：2026-07-19*