# 佈局與元件自適應調整計畫 (日曆高度與內部拖曳條)

針對您的反饋，我整理了以下調整計畫來解決這三個問題。

## User Review Required

> [!IMPORTANT]
> 1. **日曆高度調整**：目前的日曆因為隨寬度放大，導致高度也跟著無限變長。我會將日曆改為「填滿剩餘高度 (flex: 1)」並讓格子均分高度，這樣在電腦螢幕上就能完美一屏顯示，不會超過底部。
> 2. **記事與私訊的左右分隔線**：我會在 `notes/page.tsx` 與 `messages/page.tsx` 中加入和側邊欄一樣的拖曳功能，讓左側的列表（記事列表/好友列表）與右側的內容區也能自由手動調整寬度。
> 
> 請確認這份計畫是否符合您的需求？若同意，我會開始修改。

## Proposed Changes

---

### 1. Calendar Layout (日曆高度修正)

#### [MODIFY] [responsive.css](file:///Users/joseph/Downloads/freenote/src/app/responsive.css)
- 移除或降低 `.calendar-day-cell` 強制的 `min-height` (原本使用 `12cqi` 會導致過高)。
- 加入 `flex: 1` 相關設定，讓日曆網格自動適應高度。

#### [MODIFY] [page.tsx (Calendar)](file:///Users/joseph/Downloads/freenote/src/app/dashboard/calendar/page.tsx)
- 將最外層容器加上 `height: '100%', display: 'flex', flexDirection: 'column'`。
- 日曆的網格 (`grid`) 設定 `flex: 1`，並加入 `gridAutoRows: '1fr'` 讓每個禮拜的格子高度自動均分，不再隨寬度無限延伸。

---

### 2. Notes Layout (記事清單分隔線)

#### [MODIFY] [page.tsx (Notes)](file:///Users/joseph/Downloads/freenote/src/app/dashboard/notes/page.tsx)
- 引入拖曳狀態 (`listWidth`, `startResizing`, `resize`, `stopResizing`)。
- 在左側 `.list-panel` (預設 260px) 的右緣加入隱藏的分隔拖曳條 (Resizer Handler)，支援滑鼠與觸控拖曳。
- 限制寬度在 `200px` 到 `500px` 之間。

---

### 3. Messages Layout (私訊列表分隔線)

#### [MODIFY] [page.tsx (Messages)](file:///Users/joseph/Downloads/freenote/src/app/dashboard/messages/page.tsx)
- 同樣引入拖曳狀態。
- 在左側 `.list-panel` (預設 280px) 的右緣加入拖曳條。
- 確保在手機版時拖曳條不會影響原本的排版。

## Verification Plan
1. **日曆檢視**：打開日曆頁面，拖曳整個工作區寬度，確認日曆只會在水平方向縮放文字，垂直方向會完美限制在螢幕內，不需上下捲動。
2. **記事檢視**：點擊並拖曳記事列表與內容中間的分隔邊界，確認可以調整寬度。
3. **私訊檢視**：點擊並拖曳好友名單與對話內容中間的分隔邊界，確認可以自由調整。
