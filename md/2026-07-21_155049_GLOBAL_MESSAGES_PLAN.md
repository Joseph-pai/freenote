# 全局即時訊息接收與提示功能 (Global Real-time Messages & Notifications)

目前因為負責「訂閱對話紀錄 (subscribeToConversations)」的元件只在「訊息頁面 (`MessagesPage`)」中載入，所以當您在其他頁面時，系統不會去監聽最新的對話狀態，導致您覺得發送與接收不夠即時，也無法在其他頁面獲得通知。

為解決此問題，將進行以下修改：

## 用戶確認事項 (User Review Required)
> [!IMPORTANT]
> 請問是否同意以此計畫進行修改？（修改前我會先自動備份受影響的檔案）

## 待確認問題 (Open Questions)
> [!NOTE]
> 提示訊息（Toast）預計會設計在畫面的「右下角」或是「上方置中」浮現，過 3~5 秒後自動消失。請問您有偏好的位置嗎？（如果沒有，我將預設實作於右上方）

## Proposed Changes

### [MODIFY] src/app/dashboard/layout.tsx
- 在這裡將引入 `MessageProvider`，或是建立一個 `GlobalMessageListener`，這樣只要使用者登入並停留在 Dashboard 的任何一頁，都會即時監聽訊息狀態。

### [MODIFY] src/components/messages/MessageProvider.tsx 或新增 GlobalMessageListener.tsx
- 建立並啟動一個全域的訊息監聽器。
- 利用 `React.useEffect` 監聽 `conversations` store 狀態。當發現有對話的 `lastMessageAt` 更新時：
  1. 檢查發送方是否為自己。
  2. 若不是自己，且自己當前不在該聊天室 (`activeConversationId !== conv.id`)，則彈出「新訊息提示」。

### [MODIFY] src/components/layout/AppShell.tsx
- 加入自訂的 Toast (通知氣泡) UI 系統。當 `GlobalMessageListener` 觸發新訊息事件時，顯示此通知，包含發送者暱稱（套用自訂暱稱功能）及部分訊息內容。
- 點擊該提示氣泡後，會自動跳轉至 `/dashboard/messages` 並開啟該對話。

### [MODIFY] src/app/dashboard/messages/page.tsx
- 因為監聽器已經移至外層全域，需將 `MessagesPage` 中重複的 `MessageProvider` 移除或精簡，避免重複訂閱。

## Verification Plan
1. 開啟兩個視窗（或不同瀏覽器）登入不同帳號並成為好友。
2. 帳號 A 停留在「行事曆」或「記事本」等非訊息頁面。
3. 帳號 B 傳送訊息給帳號 A。
4. 驗證帳號 A 是否能立即在畫面上方/右上方看到新訊息的彈出提示。
5. 點擊提示是否能成功跳轉到訊息頁面並打開與帳號 B 的聊天室。
