# Vocabulary Game - English Easy Go

## 專案概要

國小英語單字王 400 字互動測驗遊戲，目標部署於 Gemini Canvas。

## 技術限制

- **單一 HTML 檔案**：所有 CSS/JS 必須內嵌於 `index.html`，不可有外部檔案引用（CDN 除外）
- **Vanilla JS**：不使用框架，用原生 DOM 操作實現 SPA
- **Gemini Canvas 相容**：最終產出必須能直接貼到 Canvas 中運行

## 檔案結構

```
index.html              # 遊戲主體（唯一產出檔案）
docs/plans/             # 設計文件
```

## 架構約定

### 頁面切換
用 `showPage(pageId)` 函式切換顯示/隱藏 `<section>` 元素，不使用 URL routing。

### 外部服務接口
以下兩個函式預留替換接口，開發時用 localStorage 模擬：

```js
// AI 語意檢查（英翻中判定）
async function checkSemanticMatch(correctAnswer, userInput) → boolean

// 排行榜操作
async function saveScore(data) → void
async function getLeaderboard(quizType, total) → array
```

搬到 Gemini Canvas 時只需替換這三個函式的實作。

### 資料儲存
- 練習進度：`localStorage` key `vocabGame_practice_{playerName}`
- 單字選擇：`localStorage` key `vocabGame_selection_{playerName}`
- 玩家名稱：`localStorage` key `vocabGame_playerName`
- 排行榜：開發用 `localStorage` key `vocabGame_leaderboard`

## 單字資料

400 個單字來自「宜蘭縣 114 學年度 English Easy Go 國小英語單字王題庫」PDF。
資料格式：`{ id: number, en: string, zh: string }`

## 視覺風格

可愛卡通風：鮮豔色彩（藍/綠/橘）、圓角卡片、大字體、答對答錯動畫回饋。
