# 手機與平板適應性 (RWD) 實作計畫

目前的排版在手機豎屏顯示不完整，主要原因是「訊息 (`Messages`)」與「記事 (`Notes`)」採用了固定的**雙欄版面（左側列表、右側內容）**，導致在寬度不足的手機螢幕上互相擠壓。

為了支援手機與平板（含直立與橫向旋轉），將進行以下調整：

## 用戶確認事項 (User Review Required)
> [!IMPORTANT]
> 請問是否同意以此計畫進行修改？（修改前我會先自動備份受影響的檔案）

## Proposed Changes

### [MODIFY] src/app/responsive.css & globals.css
- 新增 `.mobile-only` (手機專用顯示) 與 `.desktop-only` (電腦/平板專用顯示) 輔助類別。
- 新增雙欄切換邏輯 (`.layout-container`, `.list-panel`, `.detail-panel`)：
  - 在 **電腦與平板 (>= 768px)**：保持雙欄並排顯示。
  - 在 **手機 (< 768px)**：改為「單欄切換」模式。如果未選擇項目，只顯示左側列表；若點擊了某個對話/記事，則隱藏列表，全螢幕顯示右側詳細內容。

### [MODIFY] src/app/dashboard/messages/page.tsx
- 套用上述的響應式 Class (`layout-container`, `list-panel`, `detail-panel`)。
- 依據 `activeConversationId` 動態切換顯示「列表」或「對話內容」。
- 在對話內容的頂端加入一顆**「返回 (Back)」按鈕**（僅在手機版顯示），點擊後可回到對話列表。

### [MODIFY] src/app/dashboard/notes/page.tsx
- 同上，套用響應式 Class，依據 `activeNoteId` 切換「列表」或「編輯器」。
- 在編輯器工具列的最左側加入**「返回 (Back)」按鈕**（僅在手機版顯示），點擊後回到記事列表。

### [MODIFY] 各個主頁面 (friends/tasks/calendar)
- 將頂部的標題區塊 (`flex`) 加上 `flexWrap: 'wrap'` 與 `gap`，防止在手機豎屏時按鈕與標題互相重疊或超出畫面。

## Verification Plan
1. 使用 Chrome DevTools 或實際手機測試。
2. 進入「訊息」與「記事」頁面：
   - 確認豎屏時只會看到列表。
   - 點擊列表項目後，畫面切換至內容。
   - 點擊「返回」按鈕能成功回到列表。
3. 旋轉手機至橫向（若寬度仍小於 768px 則維持單欄切換，若大於則自動恢復雙欄）。
4. 使用 iPad (768px 以上) 測試，應維持原本良好的雙欄體驗。
