# Vocabulary Game - English Easy Go

## 專案概要

國小英語單字測驗遊戲，支援多題庫（內建 + 自訂 CSV 上傳），部署於 GitHub Pages。

## 技術架構

- **多檔案結構**：HTML / CSS / JS 分離
- **Vanilla JS**：不使用框架，用原生 DOM 操作實現 SPA
- **GitHub Pages**：靜態網站部署

## 檔案結構

```
index.html              # HTML 頁面結構
css/style.css           # 所有樣式
js/data.js              # 內建題庫資料 + 題庫管理函式
js/app.js               # 遊戲邏輯、頁面互動
docs/plans/             # 設計文件
CLAUDE.md               # 專案說明
LOG.md                  # 開發日誌
```

## 架構約定

### 頁面切換
用 `showPage(pageId)` 函式切換顯示/隱藏 `<section>` 元素，不使用 URL routing。

### 題庫系統
- 三套內建題庫：宜蘭縣400字、國小必學300字、教育部國小1000字
- 自訂 CSV 上傳：格式 `英文,中文`，存入 localStorage
- `getAllDecks()` 統一取得所有題庫

### 外部服務接口
以下函式預留替換接口，開發時用 localStorage 模擬：

```js
// AI 語意檢查（英翻中判定）
async function checkSemanticMatch(correctAnswer, userInput) → boolean

// 排行榜操作
async function saveScore(data) → void
async function getLeaderboard(quizType, total, deckId) → array
```

### 資料儲存（localStorage）
- 練習進度：`vocabGame_practice_{playerName}_{deckId}`
- 單字選擇：`vocabGame_selection_{playerName}_{deckId}`
- 玩家名稱：`vocabGame_playerName`
- 排行榜：`vocabGame_leaderboard`
- 自訂題庫：`vocabGame_customDecks`

## 單字資料

- 宜蘭縣 400 字：來自「宜蘭縣 114 學年度 English Easy Go 國小英語單字王題庫」
- 國小必學 300 字：來自克林頓美語教學團隊國小必學 300 單字表
- 教育部國小 1000 字：來自教育部國小 1000 個英語單字
- 花蓮縣初級 300 字：來自花蓮縣鑄強國小英語字彙王初級字表
- 花蓮縣中級 600 字：來自花蓮縣鑄強國小英語字彙王中級字表
- 小學英檢 GEPT Kids 652 字：來自 LTTC 小學英檢參考字表
- 台中市常用 300 字：來自台中市國小常用英文 300 字彙表

資料格式：`{ id: number, en: string, zh: string }`

## 視覺風格

可愛卡通風：鮮豔色彩（藍/綠/橘）、圓角卡片、大字體、答對答錯動畫回饋。

## 開發規則

- **每次修改都必須 commit**，commit message 用英文，格式遵循 conventional commits（feat/fix/docs/refactor 等）
- **每次修改都必須更新 LOG.md**，記錄變更內容（用中文），格式如下：
  ```
  ## YYYY-MM-DD
  - [commit hash 前 7 碼] 變更說明
  ```
