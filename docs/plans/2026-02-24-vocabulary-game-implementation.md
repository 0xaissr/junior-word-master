# English Easy Go 單字王 - 實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立一個可在 Gemini Canvas 上運行的國小英語單字測驗遊戲（單一 HTML 檔案）

**Architecture:** 單一 `index.html` 內嵌所有 CSS/JS。用 vanilla JS 實現 SPA 頁面切換（顯示/隱藏 section）。400 字資料內嵌為 JS 陣列。AI 語意檢查和排行榜預留替換接口，開發階段用 localStorage 模擬。

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, localStorage

---

## Task 1: HTML 骨架 + 全域 CSS + 頁面切換機制

**Files:**
- Create: `index.html`

**Step 1: 建立 HTML 骨架**

建立 `index.html`，包含所有頁面的 `<section>` 骨架（先只放標題佔位文字）：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>English Easy Go 單字王</title>
  <style>/* Task 1 CSS */</style>
</head>
<body>
  <div id="app">
    <section id="page-home" class="page active">首頁</section>
    <section id="page-practice-select" class="page">練習-選字</section>
    <section id="page-practice-type" class="page">練習-題型</section>
    <section id="page-practice-game" class="page">練習-遊戲</section>
    <section id="page-challenge-setup" class="page">挑戰-設定</section>
    <section id="page-challenge-game" class="page">挑戰-遊戲</section>
    <section id="page-challenge-result" class="page">挑戰-結算</section>
  </div>
  <script>/* Task 1 JS */</script>
</body>
</html>
```

**Step 2: 全域 CSS 基礎樣式**

寫入 `<style>` 區塊：
- CSS reset（box-sizing, margin, padding）
- 可愛卡通風格的 CSS 變數（色彩、圓角、字體大小）
- `.page` 預設 `display: none`，`.page.active` 為 `display: block`
- 頁面切換淡入動畫（`@keyframes fadeIn`）
- 按鈕共用樣式（圓角、大字、hover 效果）

CSS 變數：
```css
:root {
  --primary: #4A90D9;
  --secondary: #5BC0A0;
  --accent: #FF8C42;
  --danger: #E74C3C;
  --success: #2ECC71;
  --bg: #F0F4FF;
  --card-bg: #FFFFFF;
  --text: #2C3E50;
  --text-light: #7F8C8D;
  --radius: 16px;
  --radius-sm: 10px;
  --shadow: 0 4px 15px rgba(0,0,0,0.1);
  --font-size-lg: 1.5rem;
  --font-size-md: 1.1rem;
}
```

**Step 3: 頁面切換 JS**

寫入 `<script>` 區塊：
```js
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}
```

**Step 4: 驗證**

用瀏覽器開啟 `index.html`，確認：
- 只顯示「首頁」文字
- 在 console 輸入 `showPage('page-practice-select')` 能切換頁面

**Step 5: Commit**
```bash
git add index.html
git commit -m "feat: HTML skeleton with page switching and base CSS"
```

---

## Task 2: 單字資料

**Files:**
- Modify: `index.html`（在 `<script>` 區塊開頭加入）

**Step 1: 建立單字資料陣列**

從 PDF 轉錄全部 400 筆單字為 JS 陣列，放在 `<script>` 最頂部：

```js
const WORDS = [
  { id: 1, en: "afraid", zh: "害怕的" },
  { id: 2, en: "afternoon", zh: "下午" },
  { id: 3, en: "agree", zh: "同意" },
  // ... 完整 400 筆
  { id: 400, en: "zebra", zh: "斑馬" }
];
```

注意事項：
- 含空格的詞組保持原樣：`"cell phone"`, `"ice cream"`, `"hot dog"`, `"department store"`, `"police station"`, `"post office"`, `"train station"`, `"pencil case"`, `"police officer"`, `"living room"`, `"Double Tenth Day"`, `"Father's Day"`, `"Mother's Day"`, `"Moon Festival"`, `"New Year's Day"`, `"Teacher's Day"`
- 中文有多個意思的用頓號分隔（如 `"煮、烹調、廚師"`）

**Step 2: 建立輔助函式**

```js
// 依字母分組
function groupByLetter(words) {
  const groups = {};
  words.forEach(w => {
    const letter = w.en[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(w);
  });
  return groups;
}

// 隨機洗牌
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 從陣列隨機取 n 個（排除指定項）
function randomPick(arr, n, exclude = []) {
  const filtered = arr.filter(item => !exclude.includes(item));
  return shuffle(filtered).slice(0, n);
}
```

**Step 3: 驗證**

Console 輸入 `WORDS.length` 確認為 400。
Console 輸入 `groupByLetter(WORDS)` 確認分組正確。

**Step 4: Commit**
```bash
git add index.html
git commit -m "feat: add 400 vocabulary words data and utility functions"
```

---

## Task 3: 首頁

**Files:**
- Modify: `index.html`（`#page-home` 的 HTML + 對應 CSS + JS）

**Step 1: 首頁 HTML**

替換 `#page-home` 內容：

```html
<section id="page-home" class="page active">
  <div class="home-container">
    <div class="home-title">
      <h1>English Easy Go</h1>
      <p class="subtitle">單字王 400</p>
    </div>
    <div class="home-input">
      <label for="player-name">你的名字</label>
      <input type="text" id="player-name" placeholder="輸入玩家名稱..." maxlength="20">
    </div>
    <div class="home-buttons">
      <button class="btn btn-primary btn-lg" onclick="startPractice()">
        📖 練習模式
      </button>
      <button class="btn btn-accent btn-lg" onclick="startChallenge()">
        🏆 挑戰模式
      </button>
    </div>
  </div>
</section>
```

**Step 2: 首頁 CSS**

首頁置中排版、標題大字、按鈕大而圓潤、輸入框圓角帶陰影。

**Step 3: 首頁 JS**

```js
// 載入時回填記住的名稱
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('vocabGame_playerName');
  if (saved) document.getElementById('player-name').value = saved;
});

function getPlayerName() {
  const name = document.getElementById('player-name').value.trim();
  if (!name) {
    alert('請先輸入你的名字！');
    return null;
  }
  localStorage.setItem('vocabGame_playerName', name);
  return name;
}

function startPractice() {
  if (!getPlayerName()) return;
  renderPracticeSelect();
  showPage('page-practice-select');
}

function startChallenge() {
  if (!getPlayerName()) return;
  renderChallengeSetup();
  showPage('page-challenge-setup');
}
```

**Step 4: 驗證**

瀏覽器開啟，確認：
- 首頁排版正確、風格可愛
- 輸入名字後點按鈕能切換頁面
- 重新整理後名字仍在
- 不輸入名字點按鈕有 alert 提示

**Step 5: Commit**
```bash
git add index.html
git commit -m "feat: home page with player name input and mode selection"
```

---

## Task 4: 練習模式 - 單字選擇頁

**Files:**
- Modify: `index.html`（`#page-practice-select` 的 HTML + CSS + JS）

**Step 1: 單字選擇頁 HTML**

```html
<section id="page-practice-select" class="page">
  <div class="select-container">
    <div class="select-header">
      <button class="btn btn-sm btn-back" onclick="showPage('page-home')">← 返回</button>
      <h2>選擇要練習的單字</h2>
    </div>
    <div class="select-search">
      <input type="text" id="word-search" placeholder="🔍 搜尋單字..." oninput="filterWords()">
    </div>
    <div class="select-letters" id="letter-nav">
      <!-- A B C ... Z 按鈕由 JS 生成 -->
    </div>
    <div class="select-actions">
      <button class="btn btn-sm" onclick="selectAllWords()">全選</button>
      <button class="btn btn-sm" onclick="deselectAllWords()">取消全選</button>
    </div>
    <div class="select-list" id="word-list">
      <!-- 單字列表由 JS 生成 -->
    </div>
    <div class="select-footer">
      <span id="selected-count">已選 0 / 400 個單字</span>
      <button class="btn btn-primary" onclick="confirmSelection()">開始練習 →</button>
    </div>
  </div>
</section>
```

**Step 2: 單字選擇頁 CSS**

- 搜尋框全寬、圓角
- 字母導航：橫向捲動的按鈕列
- 單字列表：每組字母標題帶底線，每行單字含勾選框
- 底部固定列：`position: sticky; bottom: 0`

**Step 3: 單字選擇頁 JS**

```js
let selectedWordIds = new Set();

function renderPracticeSelect() {
  const playerName = getPlayerName();
  // 載入上次選擇
  const saved = localStorage.getItem(`vocabGame_selection_${playerName}`);
  selectedWordIds = saved ? new Set(JSON.parse(saved)) : new Set(WORDS.map(w => w.id));

  renderLetterNav();
  renderWordList();
  updateSelectedCount();
}

function renderLetterNav() {
  const groups = groupByLetter(WORDS);
  const nav = document.getElementById('letter-nav');
  nav.innerHTML = Object.keys(groups).sort().map(letter =>
    `<button class="letter-btn" onclick="scrollToLetter('${letter}')">${letter}</button>`
  ).join('');
}

function renderWordList(filter = '') {
  const groups = groupByLetter(WORDS);
  const list = document.getElementById('word-list');
  let html = '';

  Object.keys(groups).sort().forEach(letter => {
    let words = groups[letter];
    if (filter) {
      words = words.filter(w =>
        w.en.toLowerCase().includes(filter.toLowerCase()) ||
        w.zh.includes(filter)
      );
    }
    if (words.length === 0) return;

    const selectedInGroup = words.filter(w => selectedWordIds.has(w.id)).length;
    html += `<div class="word-group" id="group-${letter}">`;
    html += `<div class="group-header">
      <span class="group-title">— ${letter} (${selectedInGroup}/${words.length}) —</span>
      <button class="btn btn-xs" onclick="toggleGroup('${letter}', true)">全選</button>
      <button class="btn btn-xs" onclick="toggleGroup('${letter}', false)">取消</button>
    </div>`;

    words.forEach(w => {
      const checked = selectedWordIds.has(w.id) ? 'checked' : '';
      html += `<label class="word-item">
        <input type="checkbox" ${checked} onchange="toggleWord(${w.id})">
        <span class="word-en">${w.en}</span>
        <span class="word-zh">${w.zh}</span>
      </label>`;
    });

    html += `</div>`;
  });

  list.innerHTML = html;
}

function toggleWord(id) {
  if (selectedWordIds.has(id)) selectedWordIds.delete(id);
  else selectedWordIds.add(id);
  saveSelection();
  updateSelectedCount();
  // 更新該群組標題計數（不重繪整個列表）
  renderWordList(document.getElementById('word-search').value);
}

function toggleGroup(letter, select) {
  const groups = groupByLetter(WORDS);
  groups[letter].forEach(w => {
    if (select) selectedWordIds.add(w.id);
    else selectedWordIds.delete(w.id);
  });
  saveSelection();
  renderWordList(document.getElementById('word-search').value);
  updateSelectedCount();
}

function selectAllWords() {
  WORDS.forEach(w => selectedWordIds.add(w.id));
  saveSelection();
  renderWordList(document.getElementById('word-search').value);
  updateSelectedCount();
}

function deselectAllWords() {
  selectedWordIds.clear();
  saveSelection();
  renderWordList(document.getElementById('word-search').value);
  updateSelectedCount();
}

function filterWords() {
  const filter = document.getElementById('word-search').value;
  renderWordList(filter);
}

function scrollToLetter(letter) {
  const el = document.getElementById(`group-${letter}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveSelection() {
  const playerName = document.getElementById('player-name').value.trim();
  localStorage.setItem(`vocabGame_selection_${playerName}`, JSON.stringify([...selectedWordIds]));
}

function updateSelectedCount() {
  document.getElementById('selected-count').textContent = `已選 ${selectedWordIds.size} / ${WORDS.length} 個單字`;
}

function confirmSelection() {
  if (selectedWordIds.size === 0) {
    alert('請至少選擇一個單字！');
    return;
  }
  renderPracticeType();
  showPage('page-practice-type');
}
```

**Step 4: 驗證**

- 400 個單字全部列出且按字母分組
- 勾選/取消勾選正常，計數更新
- 搜尋能即時篩選
- 字母按鈕能跳轉
- 全選/取消全選正常
- 重新進入頁面記住上次選擇

**Step 5: Commit**
```bash
git add index.html
git commit -m "feat: practice mode word selection page with search and letter nav"
```

---

## Task 5: 練習模式 - 題型選擇頁

**Files:**
- Modify: `index.html`（`#page-practice-type` 的 HTML + CSS + JS）

**Step 1: 題型選擇頁 HTML**

```html
<section id="page-practice-type" class="page">
  <div class="type-container">
    <button class="btn btn-sm btn-back" onclick="showPage('page-practice-select')">← 返回</button>
    <h2>選擇題型</h2>
    <div class="type-cards" id="type-cards">
      <!-- 由 JS 生成 -->
    </div>
  </div>
</section>
```

**Step 2: 題型選擇 JS**

```js
function renderPracticeType() {
  const playerName = document.getElementById('player-name').value.trim();
  const progress = JSON.parse(localStorage.getItem(`vocabGame_practice_${playerName}`) || '{}');
  const selectedWords = WORDS.filter(w => selectedWordIds.has(w.id));

  const types = [
    { key: 'zh2en', label: '中翻英', desc: '看中文，寫英文', icon: '✏️' },
    { key: 'en2zh', label: '英翻中', desc: '看英文，寫中文', icon: '📝' },
    { key: 'choice', label: '選擇題', desc: '四選一', icon: '🔤' }
  ];

  const cards = document.getElementById('type-cards');
  cards.innerHTML = types.map(t => {
    const remaining = selectedWords.filter(w => !progress[`${w.en}_${t.key}`]).length;
    const total = selectedWords.length;
    const done = total - remaining;
    const allDone = remaining === 0;

    return `<div class="type-card ${allDone ? 'completed' : ''}" onclick="${allDone ? '' : `startPracticeGame('${t.key}')`}">
      <div class="type-icon">${t.icon}</div>
      <h3>${t.label}</h3>
      <p>${t.desc}</p>
      <div class="type-progress">
        ${allDone
          ? '<span class="done-badge">✅ 全部完成！</span>'
          : `<span class="remaining">還剩 <strong>${remaining}</strong> 個單字</span>`}
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${total ? (done/total*100) : 0}%"></div>
        </div>
      </div>
    </div>`;
  }).join('');
}
```

**Step 3: 題型卡片 CSS**

三張卡片排列（手機直排、桌面橫排），圓角陰影、hover 放大效果。完成的卡片半透明。

**Step 4: 驗證**

- 三張題型卡片正確顯示
- 剩餘練習數正確
- 點擊可進入遊戲頁面

**Step 5: Commit**
```bash
git add index.html
git commit -m "feat: practice mode quiz type selection with progress display"
```

---

## Task 6: 遊戲核心引擎（出題 + 判定 + 回饋）

**Files:**
- Modify: `index.html`（`<script>` 區塊加入遊戲引擎邏輯）

**Step 1: 遊戲狀態管理**

```js
let gameState = {
  mode: '',         // 'practice' | 'challenge'
  quizType: '',     // 'zh2en' | 'en2zh' | 'choice'
  questions: [],    // 待答題目（word 物件陣列）
  currentIndex: 0,
  score: 0,
  total: 0,
  answers: []       // { word, correct, userAnswer }
};
```

**Step 2: 出題邏輯**

```js
function generateQuestions(words, quizType, mode) {
  if (mode === 'practice') {
    const playerName = document.getElementById('player-name').value.trim();
    const progress = JSON.parse(localStorage.getItem(`vocabGame_practice_${playerName}`) || '{}');
    return shuffle(words.filter(w => !progress[`${w.en}_${quizType}`]));
  }
  return shuffle(words);
}

function generateChoiceOptions(correctWord, allWords, showEn) {
  // showEn: true = 題目顯示英文，選項是中文；false = 反過來
  const distractors = randomPick(allWords, 3, [correctWord]);
  const options = shuffle([correctWord, ...distractors]);
  return options.map(w => ({
    label: showEn ? w.zh : w.en,
    value: w.id,
    correct: w.id === correctWord.id
  }));
}
```

**Step 3: 判定邏輯**

```js
// 中翻英判定
function checkZh2En(correctEn, userInput) {
  return correctEn.toLowerCase().replace(/\s+/g, ' ').trim() ===
         userInput.toLowerCase().replace(/\s+/g, ' ').trim();
}

// 英翻中判定（開發階段模擬）
async function checkSemanticMatch(correctZh, userInput) {
  // 開發階段：正確答案拆分頓號，任一子項被包含即正確
  const input = userInput.trim();
  if (!input) return false;
  const parts = correctZh.split(/[、，,]/);
  return parts.some(part => {
    const p = part.trim();
    return p.includes(input) || input.includes(p);
  });
}

// 選擇題判定
function checkChoice(selectedId, correctId) {
  return selectedId === correctId;
}
```

**Step 4: 回饋動畫**

```js
function showFeedback(correct, correctAnswer) {
  const feedback = document.getElementById('game-feedback');
  if (correct) {
    feedback.innerHTML = '<div class="feedback-correct">✅ 答對了！</div>';
    feedback.className = 'feedback show correct';
  } else {
    feedback.innerHTML = `<div class="feedback-wrong">❌ 答錯了<br>正確答案：<strong>${correctAnswer}</strong></div>`;
    feedback.className = 'feedback show wrong';
  }
}
```

**Step 5: 驗證**

Console 測試：
- `checkZh2En("cell phone", "Cell Phone")` → `true`
- `checkZh2En("cat", "cats")` → `false`
- `await checkSemanticMatch("害怕的", "害怕")` → `true`
- `generateChoiceOptions(WORDS[0], WORDS, true).length` → `4`

**Step 6: Commit**
```bash
git add index.html
git commit -m "feat: game engine with question generation, answer checking, and feedback"
```

---

## Task 7: 練習遊戲頁面

**Files:**
- Modify: `index.html`（`#page-practice-game` HTML + CSS + JS）

**Step 1: 遊戲頁 HTML**

```html
<section id="page-practice-game" class="page">
  <div class="game-container">
    <div class="game-header">
      <button class="btn btn-sm btn-back" onclick="exitGame()">← 離開</button>
      <div class="game-progress">
        <span id="game-progress-text">第 1 題</span>
        <span id="game-remaining">還剩 20 個單字需要練習</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="game-progress-bar"></div>
      </div>
    </div>
    <div class="game-question" id="game-question">
      <!-- 題目由 JS 生成 -->
    </div>
    <div class="game-answer" id="game-answer">
      <!-- 輸入框或選項由 JS 生成 -->
    </div>
    <div class="feedback" id="game-feedback"></div>
    <div class="game-actions" id="game-actions">
      <!-- 下一題按鈕等 -->
    </div>
  </div>
</section>
```

**Step 2: 遊戲渲染 JS**

```js
function startPracticeGame(quizType) {
  const selectedWords = WORDS.filter(w => selectedWordIds.has(w.id));
  const questions = generateQuestions(selectedWords, quizType, 'practice');

  if (questions.length === 0) {
    alert('這個題型的選中單字都已經答對了！');
    return;
  }

  gameState = {
    mode: 'practice',
    quizType,
    questions,
    currentIndex: 0,
    score: 0,
    total: questions.length,
    answers: []
  };

  renderGameQuestion();
  showPage('page-practice-game');
}

function renderGameQuestion() {
  const { quizType, questions, currentIndex, total } = gameState;
  if (currentIndex >= questions.length) {
    // 練習完成
    showPracticeComplete();
    return;
  }

  const word = questions[currentIndex];
  const questionEl = document.getElementById('game-question');
  const answerEl = document.getElementById('game-answer');
  const actionsEl = document.getElementById('game-actions');
  const feedbackEl = document.getElementById('game-feedback');
  feedbackEl.className = 'feedback';
  feedbackEl.innerHTML = '';
  actionsEl.innerHTML = '';

  // 更新進度
  document.getElementById('game-progress-text').textContent = `第 ${currentIndex + 1} / ${questions.length} 題`;
  document.getElementById('game-remaining').textContent = `還剩 ${questions.length - currentIndex} 個單字需要練習`;
  document.getElementById('game-progress-bar').style.width = `${(currentIndex / questions.length) * 100}%`;

  if (quizType === 'zh2en') {
    questionEl.innerHTML = `<div class="question-prompt">請寫出英文</div><div class="question-word">${word.zh}</div>`;
    answerEl.innerHTML = `<input type="text" id="user-input" class="game-input" placeholder="輸入英文..." autofocus>
      <button class="btn btn-primary" onclick="submitAnswer()">確定</button>`;
    document.getElementById('user-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
  } else if (quizType === 'en2zh') {
    questionEl.innerHTML = `<div class="question-prompt">請寫出中文意思</div><div class="question-word">${word.en}</div>`;
    answerEl.innerHTML = `<input type="text" id="user-input" class="game-input" placeholder="輸入中文..." autofocus>
      <button class="btn btn-primary" onclick="submitAnswer()">確定</button>`;
    document.getElementById('user-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
  } else {
    const showEn = Math.random() > 0.5;
    questionEl.innerHTML = `<div class="question-prompt">${showEn ? '這個字的中文是？' : '這個字的英文是？'}</div>
      <div class="question-word">${showEn ? word.en : word.zh}</div>`;
    const options = generateChoiceOptions(word, WORDS, showEn);
    gameState._choiceCorrectId = word.id;
    answerEl.innerHTML = options.map(opt =>
      `<button class="btn btn-choice" onclick="submitChoice(${opt.value})">${opt.label}</button>`
    ).join('');
  }
}

async function submitAnswer() {
  const input = document.getElementById('user-input').value;
  if (!input.trim()) return;

  const word = gameState.questions[gameState.currentIndex];
  let correct = false;

  if (gameState.quizType === 'zh2en') {
    correct = checkZh2En(word.en, input);
    showFeedback(correct, word.en);
  } else {
    correct = await checkSemanticMatch(word.zh, input);
    showFeedback(correct, word.zh);
  }

  handleAnswer(word, correct);
}

function submitChoice(selectedId) {
  const word = gameState.questions[gameState.currentIndex];
  const correct = checkChoice(selectedId, word.id);
  const correctAnswer = gameState.quizType === 'choice' ? `${word.en} = ${word.zh}` : '';
  showFeedback(correct, correctAnswer);
  handleAnswer(word, correct);
}

function handleAnswer(word, correct) {
  gameState.answers.push({ word, correct });
  if (correct) gameState.score++;

  // 練習模式記錄答對
  if (gameState.mode === 'practice' && correct) {
    const playerName = document.getElementById('player-name').value.trim();
    const progress = JSON.parse(localStorage.getItem(`vocabGame_practice_${playerName}`) || '{}');
    progress[`${word.en}_${gameState.quizType}`] = true;
    localStorage.setItem(`vocabGame_practice_${playerName}`, JSON.stringify(progress));
  }

  // 下一題按鈕
  const actionsEl = document.getElementById('game-actions');
  if (correct && gameState.mode === 'practice') {
    // 練習模式答對自動下一題（延遲）
    setTimeout(() => {
      gameState.currentIndex++;
      renderGameQuestion();
    }, 1000);
  } else {
    actionsEl.innerHTML = `<button class="btn btn-primary" onclick="nextQuestion()">下一題 →</button>`;
  }

  // 禁用輸入
  const userInput = document.getElementById('user-input');
  if (userInput) userInput.disabled = true;
  document.querySelectorAll('.btn-choice').forEach(b => b.disabled = true);
}

function nextQuestion() {
  gameState.currentIndex++;
  renderGameQuestion();
}

function exitGame() {
  if (confirm('確定要離開嗎？')) {
    if (gameState.mode === 'practice') {
      renderPracticeType();
      showPage('page-practice-type');
    } else {
      showPage('page-home');
    }
  }
}

function showPracticeComplete() {
  const { score, total } = gameState;
  document.getElementById('game-question').innerHTML = `
    <div class="complete-message">
      <div class="complete-icon">🎉</div>
      <h2>練習完成！</h2>
      <p>答對 ${score} / ${total} 題</p>
    </div>`;
  document.getElementById('game-answer').innerHTML = '';
  document.getElementById('game-feedback').innerHTML = '';
  document.getElementById('game-actions').innerHTML = `
    <button class="btn btn-primary" onclick="renderPracticeType(); showPage('page-practice-type')">回題型選擇</button>
    <button class="btn btn-secondary" onclick="showPage('page-home')">回首頁</button>`;
}
```

**Step 3: 遊戲頁 CSS**

- 題目區域置中、大字體
- 輸入框全寬、大字
- 選擇題按鈕堆疊排列
- 答對/答錯動畫

**Step 4: 驗證**

- 練習模式中翻英：顯示中文，輸入英文，判定正確
- 練習模式英翻中：顯示英文，輸入中文，判定正確
- 練習模式選擇題：四個選項，點選判定
- 答對記錄進 localStorage，重新進入不再出已答對的題
- 進度條正確更新

**Step 5: Commit**
```bash
git add index.html
git commit -m "feat: practice game page with all quiz types and progress tracking"
```

---

## Task 8: 挑戰模式 - 設定頁 + 遊戲頁

**Files:**
- Modify: `index.html`（`#page-challenge-setup` + `#page-challenge-game` HTML + JS）

**Step 1: 挑戰設定頁 HTML + JS**

```html
<section id="page-challenge-setup" class="page">
  <div class="setup-container">
    <button class="btn btn-sm btn-back" onclick="showPage('page-home')">← 返回</button>
    <h2>🏆 挑戰模式</h2>
    <div class="setup-section">
      <h3>選擇題型</h3>
      <div class="setup-options" id="challenge-type-options">
        <button class="btn btn-option active" data-type="zh2en" onclick="selectChallengeType('zh2en')">✏️ 中翻英</button>
        <button class="btn btn-option" data-type="en2zh" onclick="selectChallengeType('en2zh')">📝 英翻中</button>
        <button class="btn btn-option" data-type="choice" onclick="selectChallengeType('choice')">🔤 選擇題</button>
      </div>
    </div>
    <div class="setup-section">
      <h3>選擇題數</h3>
      <div class="setup-options" id="challenge-count-options">
        <button class="btn btn-option" data-count="10" onclick="selectChallengeCount(10)">10 題</button>
        <button class="btn btn-option active" data-count="20" onclick="selectChallengeCount(20)">20 題</button>
        <button class="btn btn-option" data-count="30" onclick="selectChallengeCount(30)">30 題</button>
      </div>
    </div>
    <button class="btn btn-accent btn-lg" onclick="startChallengeGame()">開始挑戰！</button>
  </div>
</section>
```

```js
let challengeConfig = { type: 'zh2en', count: 20 };

function renderChallengeSetup() {
  challengeConfig = { type: 'zh2en', count: 20 };
  // 重設按鈕狀態
}

function selectChallengeType(type) {
  challengeConfig.type = type;
  document.querySelectorAll('#challenge-type-options .btn-option').forEach(b => b.classList.remove('active'));
  document.querySelector(`#challenge-type-options [data-type="${type}"]`).classList.add('active');
}

function selectChallengeCount(count) {
  challengeConfig.count = count;
  document.querySelectorAll('#challenge-count-options .btn-option').forEach(b => b.classList.remove('active'));
  document.querySelector(`#challenge-count-options [data-count="${count}"]`).classList.add('active');
}

function startChallengeGame() {
  const questions = shuffle([...WORDS]).slice(0, challengeConfig.count);
  gameState = {
    mode: 'challenge',
    quizType: challengeConfig.type,
    questions,
    currentIndex: 0,
    score: 0,
    total: challengeConfig.count,
    answers: []
  };
  renderGameQuestion();
  showPage('page-practice-game'); // 共用遊戲頁面
}
```

**Step 2: 挑戰模式結束處理**

修改 `renderGameQuestion()`，當 `currentIndex >= questions.length` 且 mode 為 challenge 時，導向結算頁而非顯示完成訊息。

```js
// 在 renderGameQuestion 開頭加入：
if (currentIndex >= questions.length) {
  if (gameState.mode === 'challenge') {
    renderChallengeResult();
    showPage('page-challenge-result');
    return;
  }
  showPracticeComplete();
  return;
}
```

**Step 3: 驗證**

- 能選擇題型和題數
- 選項按鈕 active 狀態切換正確
- 開始挑戰後隨機出題、題數正確
- 不記錄練習進度

**Step 4: Commit**
```bash
git add index.html
git commit -m "feat: challenge mode setup page and game integration"
```

---

## Task 9: 挑戰結算頁 + 排行榜

**Files:**
- Modify: `index.html`（`#page-challenge-result` HTML + CSS + JS + 排行榜邏輯）

**Step 1: 結算頁 HTML**

```html
<section id="page-challenge-result" class="page">
  <div class="result-container">
    <div class="result-score">
      <h2>挑戰結束！</h2>
      <div class="score-display" id="result-score">18 / 20</div>
      <div class="score-rate" id="result-rate">正確率 90%</div>
    </div>
    <div class="result-leaderboard">
      <h3>🏆 排行榜</h3>
      <table id="leaderboard-table">
        <!-- 由 JS 生成 -->
      </table>
    </div>
    <div class="result-actions">
      <button class="btn btn-accent" onclick="startChallengeGame()">再挑戰一次</button>
      <button class="btn btn-secondary" onclick="showPage('page-home')">回首頁</button>
    </div>
  </div>
</section>
```

**Step 2: 排行榜 JS（localStorage 版）**

```js
async function saveScore(data) {
  // 開發版：localStorage
  const board = JSON.parse(localStorage.getItem('vocabGame_leaderboard') || '[]');
  board.push(data);
  localStorage.setItem('vocabGame_leaderboard', JSON.stringify(board));
}

async function getLeaderboard(quizType, total) {
  // 開發版：localStorage
  const board = JSON.parse(localStorage.getItem('vocabGame_leaderboard') || '[]');
  return board
    .filter(e => e.quizType === quizType && e.total === total)
    .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp)
    .slice(0, 10);
}

async function renderChallengeResult() {
  const { score, total, quizType } = gameState;
  const rate = Math.round((score / total) * 100);
  const playerName = document.getElementById('player-name').value.trim();

  document.getElementById('result-score').textContent = `${score} / ${total}`;
  document.getElementById('result-rate').textContent = `正確率 ${rate}%`;

  // 儲存分數
  await saveScore({
    playerName,
    score,
    total,
    quizType,
    timestamp: Date.now()
  });

  // 載入排行榜
  const entries = await getLeaderboard(quizType, total);
  const typeLabels = { zh2en: '中翻英', en2zh: '英翻中', choice: '選擇題' };

  const table = document.getElementById('leaderboard-table');
  table.innerHTML = `
    <caption>${typeLabels[quizType]} ${total} 題 Top 10</caption>
    <thead><tr><th>名次</th><th>玩家</th><th>分數</th><th>正確率</th></tr></thead>
    <tbody>
      ${entries.map((e, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        const isMe = e.playerName === playerName && e.timestamp === entries[i].timestamp;
        return `<tr class="${isMe ? 'highlight' : ''}">
          <td>${medal}</td>
          <td>${e.playerName}</td>
          <td>${e.score}/${e.total}</td>
          <td>${Math.round((e.score/e.total)*100)}%</td>
        </tr>`;
      }).join('')}
    </tbody>`;
}
```

**Step 3: 結算頁 CSS**

分數大字居中、排行榜表格美化、前三名金銀銅色、自己的成績高亮。

**Step 4: 驗證**

- 挑戰結束後正確顯示分數和正確率
- 排行榜儲存成功，重複玩多次後排名正確
- 前三名有獎牌圖示

**Step 5: Commit**
```bash
git add index.html
git commit -m "feat: challenge result page with leaderboard"
```

---

## Task 10: 視覺打磨 + 動畫效果 + RWD

**Files:**
- Modify: `index.html`（CSS 區塊）

**Step 1: 答對答錯動畫**

```css
@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes shakeX {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.feedback.show.correct { animation: bounceIn 0.5s; }
.feedback.show.wrong { animation: shakeX 0.5s; }
```

**Step 2: 頁面切換動畫**

```css
.page { display: none; opacity: 0; }
.page.active { display: block; animation: fadeIn 0.3s forwards; }
@keyframes fadeIn { to { opacity: 1; } }
```

**Step 3: RWD 響應式**

- 手機（< 600px）：按鈕堆疊、字體適中
- 平板/桌面（>= 600px）：並排排列、更大間距

**Step 4: 全面外觀微調**

- 確認所有頁面風格一致
- 按鈕 hover/active 效果
- 選擇題按鈕被選中後的顏色回饋（正確綠、錯誤紅）
- 進度條顏色漸變

**Step 5: 驗證**

- 手機尺寸（DevTools 模擬）外觀正常
- 所有動畫流暢
- 答對答錯的視覺回饋明確

**Step 6: Commit**
```bash
git add index.html
git commit -m "feat: visual polish with animations, feedback effects, and responsive design"
```

---

## Task 11: 最終整合測試 + 修正

**Files:**
- Modify: `index.html`（修正任何問題）

**Step 1: 端到端測試清單**

手動測試所有流程：

- [ ] 首頁：輸入名字、記住名字、空名字提示
- [ ] 練習模式：單字選擇（全選/取消/搜尋/字母跳轉/記住選擇）
- [ ] 練習模式：題型選擇（剩餘數量正確、完成標記）
- [ ] 練習模式 - 中翻英：出題、判定、答對記錄、不重複出已答對的題
- [ ] 練習模式 - 英翻中：出題、語意判定、答對記錄
- [ ] 練習模式 - 選擇題：四選一、判定、答對記錄
- [ ] 練習完成畫面
- [ ] 挑戰模式：設定頁（題型/題數選擇）
- [ ] 挑戰遊戲：隨機出題、不記錄練習進度
- [ ] 結算頁：分數、正確率、排行榜
- [ ] 排行榜：儲存、排序、前三名獎牌
- [ ] 所有返回按鈕正常
- [ ] RWD 手機/桌面都正常

**Step 2: 修正問題**

修正測試中發現的任何問題。

**Step 3: Commit**
```bash
git add index.html
git commit -m "fix: final integration testing and bug fixes"
```
