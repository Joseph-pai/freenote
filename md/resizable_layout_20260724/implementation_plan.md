# 使左側功能區與右側工作區可調整，並讓內容自適應縮放

此計劃將實現您要求的響應式與可調整佈局功能，讓用戶可以在電腦與平板上手動調整左側功能區（側邊欄）與右側工作區的寬度，並且讓文字與日曆等內容根據容器大小自動縮放。

## User Review Required

> [!IMPORTANT]
> 1. **拖曳調整寬度的實作方式**：為了避免引入過多外部依賴，我計劃使用 React 內建的 State 和滑鼠事件 (onMouseDown, onMouseMove, onMouseUp) 來實作一個自定義的拖曳條 (Drag Handle)。這樣可以保持專案輕量。您是否同意這種方式？或者您更傾向於安裝如 `react-resizable-panels` 這樣的第三方套件？
> 2. **關於保留或刪除文件**：根據您的規則，本次修改完成後，我會詢問您是否要「保留」或「刪除」這些 Markdown 文件。

## Proposed Changes

---

### Layout Components

我們將在 `AppShell.tsx` 中加入拖曳控制邏輯，讓用戶手動調整側邊欄的寬度。

#### [MODIFY] [AppShell.tsx](file:///Users/joseph/Downloads/freenote/src/components/layout/AppShell.tsx)
- 引入 React 的 `useState`, `useCallback`, `useEffect` 以及 `useRef`。
- 新增 `sidebarWidth` 狀態，預設為 `220px`。
- 在 `<aside>` 與 `<main>` 之間加入一個分隔條 (Resizer Handler)，允許使用者點擊並拖曳來改變 `sidebarWidth`。
- **支援觸控螢幕**：除了滑鼠事件 (`onMouseDown`, `onMouseMove`, `onMouseUp`) 之外，同時加入觸控事件 (`onTouchStart`, `onTouchMove`, `onTouchEnd`)，確保在平板與手機上也能流暢地拖曳調整。
- 限制側邊欄的最小與最大寬度 (例如：最小 180px，最大 400px)。

---

### Styles & Responsive Auto-scaling

我們需要更新全局樣式，讓文字、日曆以及其他工作區元件能「根據容器可用空間自動縮放」，而不僅僅是根據整個螢幕寬度。

#### [MODIFY] [globals.css](file:///Users/joseph/Downloads/freenote/src/app/globals.css)
- **Container Queries**: 在 `<main>` 元素上設定 `container-type: inline-size; container-name: main-workspace;`。
- 這樣可以讓內部元件 (如日曆網格、文字大小) 根據 `main-workspace` 的寬度動態調整 (`@container`)。
- **Fluid Typography**: 將主要文字的 `font-size` 修改為使用 `clamp()` 函數 (例如 `clamp(0.875rem, 1cqi + 0.5rem, 1.25rem)`)，使其根據父容器寬度平滑縮放。
- 更新其他工作區的佈局，確保它們使用 Flexbox 或 CSS Grid 並設定為 `flex-wrap: wrap` 或自適應欄位 `repeat(auto-fit, minmax(...))`，以實現自適應屏幕縮放。

#### [MODIFY] [responsive.css](file:///Users/joseph/Downloads/freenote/src/app/responsive.css)
- 針對不同寬度設定更好的過渡效果，確保在拖曳邊框時，右側內容的變化是流暢的。

## Verification Plan

### Manual Verification
1. 在電腦端打開網頁，使用滑鼠拖曳左側與右側之間的分隔線，確認寬度是否可以自由調整且不卡頓。
2. 觀察右側內容（如日曆格子、筆記文字），確認在縮小或放大右側工作區時，文字大小是否會自動適配縮放。
3. 確保在手機端 (小於 768px) 時，側邊欄依然會自動隱藏，不受拖曳邏輯影響。
