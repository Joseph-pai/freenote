# 增加好友自訂暱稱功能 (Custom Friend Nickname Feature)

為了解決用戶可以編輯並顯示好友的自訂暱稱的需求，將進行以下修改。自訂暱稱的設定將優先顯示，若無設定則顯示對方原本的帳號名稱（原暱稱）。此變更將套用於所有顯示好友名稱的地方，包含共用名單及私訊（包含過去與對方的私訊）。

## 用戶確認事項 (User Review Required)
> [!IMPORTANT]
> 請問是否同意以此計畫進行修改？（修改前不會覆蓋任何檔案，會按照您的指示：不需特別備份或按照常規自動備份？）

## 待確認問題 (Open Questions)
> [!NOTE]
> 在私訊中，過去已經發出的訊息（包含對方發來的）如果我們動態抓取「目前的自訂暱稱」，是否可以接受每當打開私訊時都以最新設定的「自訂暱稱」來顯示對方的名字？（通常是這樣設計的）

## Proposed Changes

### Types

#### [MODIFY] src/types/index.ts
- 於 `AppUser` 介面中新增 `friendNicknames?: Record<string, string>;` 欄位。這會用來儲存「當前用戶為每個好友設定的自訂暱稱」。

---

### Firebase & Stores

#### [MODIFY] src/lib/firebase/friends.ts
- 新增 `updateFriendNickname` 函數，用於更新 `users` 集合中當前使用者的 `friendNicknames` 物件。

---

### UI Components

#### [MODIFY] src/app/dashboard/friends/page.tsx
- 在好友列表（My Friends）中增加「編輯暱稱」的按鈕或直接允許內聯編輯（Inline Edit）。
- 顯示好友名稱時，改為顯示 `user.friendNicknames?.[friend.uid] || friend.nickname`。

#### [MODIFY] src/app/dashboard/messages/page.tsx
- 聊天室列表與對話內容中，針對對方發來的訊息或對方的名稱顯示，將動態讀取 `user.friendNicknames?.[otherUserId] || msg.senderNickname`。這樣就算對方改了名字或以前傳的訊息，都會顯示你設定的自訂暱稱。

#### [MODIFY] src/components/shared/ShareModal.tsx
- 在共用名單的選擇列表中，顯示好友名稱時同樣套用 `user.friendNicknames?.[friend.uid] || friend.nickname`。

## Verification Plan

### Manual Verification
1. 進入好友列表，為一位好友設定自訂暱稱。
2. 確認好友列表中該名好友的名稱已更新為自訂暱稱。
3. 進入私訊頁面，確認與該好友的對話清單以及對話泡泡上方，都顯示了剛剛設定的自訂暱稱。
4. 打開共用 Modal，確認好友選單中也是顯示自訂暱稱。
5. 將自訂暱稱清除，確認名稱恢復為對方的原帳號名稱。
