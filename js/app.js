// ===== App State =====
let currentDeck = null;       // { id, name, words }
let currentWords = [];        // words array from current deck
let selectedWordIds = new Set();
let gameState = {
  mode: '', quizType: '', questions: [], currentIndex: 0,
  score: 0, total: 0, answers: []
};
let challengeConfig = { type: 'zh2en', count: 20 };
let pendingMode = ''; // 'practice' or 'challenge'

// ===== Utility Functions =====
function groupByLetter(words) {
  const groups = {};
  words.forEach(w => {
    const letter = w.en[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(w);
  });
  return groups;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomPick(arr, n, exclude) {
  exclude = exclude || [];
  const filtered = arr.filter(item => !exclude.includes(item));
  return shuffle(filtered).slice(0, n);
}

// ===== Page Switching =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'page-home') renderHomeStats();
}

// ===== Home Page =====
window.addEventListener('DOMContentLoaded', function() {
  var saved = localStorage.getItem('vocabGame_playerName');
  if (saved) {
    document.getElementById('player-name').value = saved;
    showPlayerNameDisplay(saved);
  }

  // Restore remembered deck
  var savedDeckId = localStorage.getItem('vocabGame_currentDeckId');
  if (savedDeckId) {
    var allDecks = getAllDecks();
    var deck = allDecks.find(function(d) { return d.id === savedDeckId; });
    if (deck) {
      currentDeck = deck;
      currentWords = deck.words;
      updateHomeDeckInfo();
    }
  }
  renderHomeStats();

  var nameInput = document.getElementById('player-name');
  nameInput.addEventListener('input', function() {
    var val = nameInput.value.trim();
    document.getElementById('btn-confirm-name').style.display = val ? 'block' : 'none';
    renderHomeStats();
  });
  nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); confirmPlayerName(); }
  });
});

function showPlayerNameDisplay(name) {
  document.getElementById('player-name-text').textContent = '挑戰者：' + name;
  document.getElementById('player-name-display').style.display = 'block';
  document.getElementById('player-name-edit').style.display = 'none';
}

function showPlayerNameEdit() {
  document.getElementById('player-name-display').style.display = 'none';
  document.getElementById('player-name-edit').style.display = 'block';
  var input = document.getElementById('player-name');
  var label = document.querySelector('#player-name-edit .input-label');
  if (label) label.style.display = input.value.trim() ? 'none' : '';
  input.focus();
  document.getElementById('btn-confirm-name').style.display = input.value.trim() ? 'block' : 'none';
}

function editPlayerName() {
  showPlayerNameEdit();
}

function confirmPlayerName() {
  var name = document.getElementById('player-name').value.trim();
  if (!name) return;
  localStorage.setItem('vocabGame_playerName', name);
  showPlayerNameDisplay(name);
  renderHomeStats();
  updateHomeDeckInfo();
}

function getPlayerName() {
  var name = document.getElementById('player-name').value.trim();
  if (!name) {
    alert('請先輸入你的名字！');
    showPlayerNameEdit();
    return null;
  }
  localStorage.setItem('vocabGame_playerName', name);
  return name;
}

function startPractice() {
  if (!getPlayerName()) return;
  pendingMode = 'practice';
  if (currentDeck) {
    // Already have a deck selected, go directly to word selection
    renderPracticeSelect();
    showPage('page-practice-select');
  } else {
    renderDeckSelect();
    showPage('page-deck-select');
  }
}

function startChallenge() {
  if (!getPlayerName()) return;
  pendingMode = 'challenge';
  if (currentDeck) {
    // Start directly with defaults: zh2en + en2zh, 3 min
    challengeConfig = { types: new Set(['zh2en', 'en2zh']), timeLimit: 180 };
    startChallengeGame();
  } else {
    renderDeckSelect();
    showPage('page-deck-select');
  }
}

function goToDeckSelect() {
  pendingMode = '';
  renderDeckSelect();
  showPage('page-deck-select');
}

function updateHomeDeckInfo() {
  const icons = getDeckIcons();
  var nameEl = document.getElementById('home-deck-name');
  var statsEl = document.getElementById('home-deck-stats');
  var iconEl = document.getElementById('home-deck-icon');
  var infoBar = document.getElementById('home-deck-info');

  if (!currentDeck) {
    nameEl.textContent = '尚未選擇題庫';
    statsEl.textContent = '點擊選擇題庫';
    iconEl.textContent = '📚';
    infoBar.classList.remove('deck-selected');
    return;
  }

  iconEl.textContent = icons[currentDeck.id] || '📄';
  nameEl.textContent = currentDeck.name;
  infoBar.classList.add('deck-selected');

  // Calculate mastery
  var playerName = document.getElementById('player-name').value.trim();
  if (playerName) {
    var progress = JSON.parse(localStorage.getItem('vocabGame_practice_' + playerName + '_' + currentDeck.id) || '{}');
    var totalWords = currentDeck.words.length;
    // Count unique words mastered (word mastered = answered correctly in at least one quiz type)
    var masteredWords = new Set();
    Object.keys(progress).forEach(function(key) {
      var wordPart = key.replace(/_zh2en$|_en2zh$|_choice$/, '');
      masteredWords.add(wordPart);
    });
    var mastered = masteredWords.size;
    statsEl.textContent = '已掌握 ' + mastered + ' / ' + totalWords + ' 個單字';
  } else {
    statsEl.textContent = totalWords + ' 個單字';
  }
}

function getDeckIcons() {
  return { yilan400: '🏫', basic300: '📚', moe1200: '🎓', hualien300: '🌊', hualien600: '🌊', geptkids: '🏆', taichung300: '🏙️', jh2000: '📖', adv800: '📕' };
}

// Deck level categories
const DECK_LEVELS = {
  elementary: ['geptkids', 'taichung300', 'hualien300', 'hualien600', 'yilan400', 'basic300', 'moe1200'],
  junior: ['jh2000', 'adv800']
};

let currentLevel = 'elementary';
let pendingDeckId = null;

// ===== Deck Selection =====
function renderDeckSelect() {
  // Determine initial level from current deck
  if (currentDeck) {
    if (DECK_LEVELS.junior.includes(currentDeck.id)) {
      currentLevel = 'junior';
    } else if (currentDeck.id.startsWith('custom_')) {
      currentLevel = 'custom';
    } else {
      currentLevel = 'elementary';
    }
  }
  pendingDeckId = currentDeck ? currentDeck.id : null;
  switchLevel(currentLevel);
}

function switchLevel(level) {
  currentLevel = level;
  // Update toggle buttons
  document.querySelectorAll('.level-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.level-btn[data-level="' + level + '"]').classList.add('active');

  var dropdownArea = document.getElementById('deck-dropdown-area');
  var customArea = document.getElementById('custom-upload-area');
  var confirmBtn = document.getElementById('confirm-deck-btn');

  if (level === 'custom') {
    dropdownArea.style.display = 'none';
    customArea.style.display = 'block';
    renderCustomDeckList();
    confirmBtn.style.display = 'none';
  } else {
    dropdownArea.style.display = 'block';
    customArea.style.display = 'none';
    populateDeckDropdown(level);
  }
}

function populateDeckDropdown(level) {
  var dropdown = document.getElementById('deck-dropdown');
  var deckIds = DECK_LEVELS[level] || [];
  var icons = getDeckIcons();
  var html = '<option value="">-- 請選擇題庫 --</option>';

  deckIds.forEach(function(id) {
    var deck = BUILTIN_DECKS.find(function(d) { return d.id === id; });
    if (deck) {
      var icon = icons[id] || '📄';
      var selected = pendingDeckId === id ? ' selected' : '';
      html += '<option value="' + id + '"' + selected + '>' + icon + ' ' + deck.name + '（' + deck.words.length + ' 字）</option>';
    }
  });

  dropdown.innerHTML = html;
  onDeckDropdownChange();
}

function onDeckDropdownChange() {
  var dropdown = document.getElementById('deck-dropdown');
  var deckId = dropdown.value;
  var detail = document.getElementById('deck-detail');
  var confirmBtn = document.getElementById('confirm-deck-btn');

  if (!deckId) {
    detail.innerHTML = '';
    confirmBtn.style.display = 'none';
    pendingDeckId = null;
    return;
  }

  pendingDeckId = deckId;
  var deck = BUILTIN_DECKS.find(function(d) { return d.id === deckId; });
  if (deck) {
    detail.innerHTML = '<strong>' + deck.description + '</strong><br>共 ' + deck.words.length + ' 個單字';
    confirmBtn.style.display = 'block';
  }
}

function confirmDeckSelection() {
  if (!pendingDeckId) return;
  selectDeck(pendingDeckId);
}

function renderCustomDeckList() {
  var customs = getCustomDecks();
  var listEl = document.getElementById('custom-deck-list');
  if (customs.length === 0) {
    listEl.innerHTML = '<p style="text-align:center; color:var(--text-muted)">尚無自訂題庫</p>';
    return;
  }
  listEl.innerHTML = customs.map(function(deck) {
    return '<div style="display:flex; align-items:center; padding:10px; background:var(--bg-secondary); border:2px solid var(--border-color); border-radius:10px; margin-bottom:8px; cursor:pointer" onclick="selectDeck(\'' + deck.id + '\')">' +
      '<span style="flex:1; font-weight:600">' + deck.name + ' <span style="font-weight:normal; color:var(--text-muted)">(' + deck.words.length + ' 字)</span></span>' +
      '<button class="btn btn-xs" onclick="event.stopPropagation(); confirmDeleteDeck(\'' + deck.id + '\')" style="color:var(--danger)">刪除</button>' +
    '</div>';
  }).join('');
}

function selectDeck(deckId) {
  var allDecks = getAllDecks();
  currentDeck = allDecks.find(function(d) { return d.id === deckId; });
  if (!currentDeck) return;
  currentWords = currentDeck.words;

  // Remember selected deck
  localStorage.setItem('vocabGame_currentDeckId', deckId);
  updateHomeDeckInfo();

  if (pendingMode === 'practice') {
    renderPracticeSelect();
    showPage('page-practice-select');
  } else if (pendingMode === 'challenge') {
    challengeConfig = { types: new Set(['zh2en', 'en2zh']), timeLimit: 180 };
    startChallengeGame();
  } else {
    // Came from home page deck button (no pending mode), go back to home
    showPage('page-home');
  }
}

function backFromDeckSelect() {
  showPage('page-home');
}

function confirmDeleteDeck(deckId) {
  if (confirm('確定要刪除這個自訂題庫嗎？')) {
    deleteCustomDeck(deckId);
    renderDeckSelect();
  }
}

// ===== CSV Upload =====
function handleCSVUpload(event) {
  var file = event.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var words = parseCSV(text);
    var preview = document.getElementById('csv-preview');

    if (words.length === 0) {
      preview.innerHTML = '<div style="color:var(--danger)">無法解析 CSV 檔案，請確認格式為「英文,中文」</div>';
      return;
    }

    preview.innerHTML = '<div style="color:var(--success)">解析成功！共 ' + words.length + ' 個單字</div>' +
      '<div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px">前 5 個：' +
      words.slice(0, 5).map(function(w) { return w.en + '=' + w.zh; }).join(', ') + '...</div>' +
      '<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="saveCSVDeck()">儲存題庫</button>';

    // Store temporarily
    window._pendingCSVWords = words;
  };
  reader.readAsText(file);
}

function saveCSVDeck() {
  var name = document.getElementById('csv-deck-name').value.trim();
  if (!name) {
    alert('請輸入題庫名稱！');
    return;
  }
  if (!window._pendingCSVWords || window._pendingCSVWords.length === 0) {
    alert('請先上傳 CSV 檔案！');
    return;
  }

  var deck = {
    id: 'custom_' + Date.now(),
    name: name,
    description: '自訂題庫 (' + window._pendingCSVWords.length + ' 字)',
    words: window._pendingCSVWords
  };

  saveCustomDeck(deck);
  window._pendingCSVWords = null;
  document.getElementById('csv-deck-name').value = '';
  document.getElementById('csv-preview').innerHTML = '<div style="color:var(--success)">題庫已儲存！</div>';
  document.getElementById('csv-file-input').value = '';
  renderDeckSelect();
}

// ===== Practice Word Selection =====
function renderPracticeSelect() {
  var playerName = getPlayerName();
  var saved = localStorage.getItem('vocabGame_selection_' + playerName + '_' + currentDeck.id);
  selectedWordIds = saved ? new Set(JSON.parse(saved)) : new Set(currentWords.map(function(w) { return w.id; }));
  document.getElementById('word-search').value = '';
  renderLetterNav();
  renderWordList();
  updateSelectedCount();
}

function renderLetterNav() {
  var groups = groupByLetter(currentWords);
  var nav = document.getElementById('letter-nav');
  nav.innerHTML = Object.keys(groups).sort().map(function(letter) {
    return '<button class="letter-btn" onclick="scrollToLetter(\'' + letter + '\')">' + letter + '</button>';
  }).join('');
}

function renderWordList(filter) {
  filter = filter || '';
  var groups = groupByLetter(currentWords);
  var list = document.getElementById('word-list');
  var html = '';
  Object.keys(groups).sort().forEach(function(letter) {
    var words = groups[letter];
    if (filter) {
      words = words.filter(function(w) {
        return w.en.toLowerCase().includes(filter.toLowerCase()) || w.zh.includes(filter);
      });
    }
    if (words.length === 0) return;
    var selectedInGroup = words.filter(function(w) { return selectedWordIds.has(w.id); }).length;
    html += '<div class="word-group" id="group-' + letter + '">';
    var allSelected = selectedInGroup === words.length;
    html += '<div class="group-header">' +
      '<label class="group-check-label">' +
        '<input type="checkbox" ' + (allSelected ? 'checked' : '') + ' onchange="toggleGroup(\'' + letter + '\', this.checked)">' +
      '</label>' +
      '<span class="group-title">' + letter + ' (' + selectedInGroup + '/' + words.length + ')</span>' +
    '</div>';
    words.forEach(function(w) {
      var checked = selectedWordIds.has(w.id) ? 'checked' : '';
      html += '<label class="word-item">' +
        '<input type="checkbox" ' + checked + ' onchange="toggleWord(' + w.id + ')">' +
        '<span class="word-en">' + w.en + '</span>' +
        '<span class="word-zh">' + w.zh + '</span>' +
      '</label>';
    });
    html += '</div>';
  });
  list.innerHTML = html;
}

function toggleWord(id) {
  if (selectedWordIds.has(id)) selectedWordIds.delete(id);
  else selectedWordIds.add(id);
  saveSelection();
  updateSelectedCount();
  renderWordList(document.getElementById('word-search').value);
}

function toggleGroup(letter, select) {
  var groups = groupByLetter(currentWords);
  groups[letter].forEach(function(w) {
    if (select) selectedWordIds.add(w.id);
    else selectedWordIds.delete(w.id);
  });
  saveSelection();
  renderWordList(document.getElementById('word-search').value);
  updateSelectedCount();
}

function toggleAllWords(checked) {
  if (checked) {
    currentWords.forEach(function(w) { selectedWordIds.add(w.id); });
  } else {
    selectedWordIds.clear();
  }
  saveSelection();
  renderWordList(document.getElementById('word-search').value);
  updateSelectedCount();
}

function filterWords() {
  renderWordList(document.getElementById('word-search').value);
}

function scrollToLetter(letter) {
  var el = document.getElementById('group-' + letter);
  var container = document.getElementById('word-list');
  if (el && container) {
    container.scrollTop = el.offsetTop - container.offsetTop;
  }
}

function saveSelection() {
  var playerName = document.getElementById('player-name').value.trim();
  localStorage.setItem('vocabGame_selection_' + playerName + '_' + currentDeck.id, JSON.stringify([...selectedWordIds]));
}

function updateSelectedCount() {
  document.getElementById('selected-count').textContent = '已選 ' + selectedWordIds.size + ' / ' + currentWords.length + ' 個單字';
  var checkAll = document.getElementById('check-all');
  if (checkAll) {
    checkAll.checked = currentWords.length > 0 && selectedWordIds.size === currentWords.length;
    checkAll.indeterminate = selectedWordIds.size > 0 && selectedWordIds.size < currentWords.length;
  }
}

function confirmSelection() {
  if (selectedWordIds.size === 0) {
    alert('請至少選擇一個單字！');
    return;
  }
  renderPracticeType();
  showPage('page-practice-type');
}

// ===== Practice Type Selection =====
let selectedPracticeTypes = new Set();

function renderPracticeType() {
  var playerName = document.getElementById('player-name').value.trim();
  var progress = JSON.parse(localStorage.getItem('vocabGame_practice_' + playerName + '_' + currentDeck.id) || '{}');
  var selectedWords = currentWords.filter(function(w) { return selectedWordIds.has(w.id); });
  var types = [
    { key: 'zh2en', label: '中翻英', desc: '看中文，寫英文', icon: '✏️' },
    { key: 'en2zh', label: '英翻中', desc: '看英文，寫中文', icon: '📝' },
    { key: 'choice', label: '選擇題', desc: '四選一', icon: '🔤' }
  ];
  selectedPracticeTypes = new Set();
  var cards = document.getElementById('type-cards');
  cards.innerHTML = types.map(function(t) {
    var remaining = selectedWords.filter(function(w) { return !progress[w.en + '_' + t.key]; }).length;
    var total = selectedWords.length;
    var done = total - remaining;
    var allDone = remaining === 0;
    var pct = total ? Math.round(done / total * 100) : 0;
    return '<div class="type-card ' + (allDone ? 'completed' : '') + '" data-type="' + t.key + '" onclick="togglePracticeType(\'' + t.key + '\')">' +
      '<div class="type-card-row">' +
        '<input type="checkbox" class="type-check" tabindex="-1"' + (allDone ? ' disabled' : '') + '>' +
        '<h3>' + t.label + '</h3>' +
        '<span class="type-card-stat">' +
          (allDone
            ? '<span class="done-badge">完成</span>'
            : '<span class="remaining">剩 ' + remaining + ' 字</span>') +
          '<span class="type-card-pct">' + pct + '%</span>' +
        '</span>' +
      '</div>' +
      '<div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
    '</div>';
  }).join('');

  // Add start button
  cards.innerHTML += '<div style="margin-top:16px; text-align:center">' +
    '<button class="btn btn-primary" id="start-practice-btn" onclick="startMultiPractice()" disabled>請選擇題型（可多選）</button>' +
    '</div>';
}

function togglePracticeType(typeKey) {
  var card = document.querySelector('.type-card[data-type="' + typeKey + '"]');
  if (!card || card.classList.contains('completed')) return;

  if (selectedPracticeTypes.has(typeKey)) {
    selectedPracticeTypes.delete(typeKey);
    card.classList.remove('selected');
    card.querySelector('.type-check').checked = false;
  } else {
    selectedPracticeTypes.add(typeKey);
    card.classList.add('selected');
    card.querySelector('.type-check').checked = true;
  }

  var btn = document.getElementById('start-practice-btn');
  if (selectedPracticeTypes.size > 0) {
    var labels = [];
    if (selectedPracticeTypes.has('zh2en')) labels.push('中翻英');
    if (selectedPracticeTypes.has('en2zh')) labels.push('英翻中');
    if (selectedPracticeTypes.has('choice')) labels.push('選擇題');
    btn.textContent = '開始練習（' + labels.join(' + ') + '）→';
    btn.disabled = false;
  } else {
    btn.textContent = '請選擇題型（可多選）';
    btn.disabled = true;
  }
}

function startMultiPractice() {
  if (selectedPracticeTypes.size === 0) return;
  var types = [...selectedPracticeTypes];
  if (types.length === 1) {
    startPracticeGame(types[0]);
  } else {
    // Mix questions from multiple quiz types
    var selectedWords = currentWords.filter(function(w) { return selectedWordIds.has(w.id); });
    var playerName = document.getElementById('player-name').value.trim();
    var progress = JSON.parse(localStorage.getItem('vocabGame_practice_' + playerName + '_' + currentDeck.id) || '{}');
    var allQuestions = [];
    types.forEach(function(qt) {
      var words = selectedWords.filter(function(w) { return !progress[w.en + '_' + qt]; });
      words.forEach(function(w) {
        allQuestions.push({ word: w, quizType: qt });
      });
    });
    if (allQuestions.length === 0) {
      alert('所有選中的題型都已完成！');
      return;
    }
    allQuestions = shuffle(allQuestions);
    gameState = {
      mode: 'practice',
      quizType: 'mixed',
      mixedQuestions: allQuestions,
      questions: allQuestions.map(function(q) { return q.word; }),
      currentIndex: 0,
      score: 0,
      total: allQuestions.length,
      answers: []
    };
    incrementPlayCount(document.getElementById('player-name').value.trim());
    renderGameQuestion();
    showPage('page-practice-game');
  }
}

function resetPracticeProgress() {
  if (!confirm('確定要重置所有練習進度嗎？')) return;
  var playerName = document.getElementById('player-name').value.trim();
  localStorage.removeItem('vocabGame_practice_' + playerName + '_' + currentDeck.id);
  renderPracticeType();
}

// ===== Game Engine =====
function checkZh2En(correctEn, userInput) {
  return userInput.trim().toLowerCase() === correctEn.trim().toLowerCase();
}

async function checkSemanticMatch(correctZh, userInput) {
  // Dev version: partial string match
  var input = userInput.trim();
  var correct = correctZh.trim();
  if (!input) return false;
  // Check contains or equal (ignoring punctuation)
  var cleanInput = input.replace(/[，、。！？\s]/g, '');
  var cleanCorrect = correct.replace(/[，、。！？\s]/g, '');
  // Split correct answer by common separators
  var parts = cleanCorrect.split(/[、，,;；]/);
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p && (cleanInput.includes(p) || p.includes(cleanInput))) return true;
  }
  return cleanInput === cleanCorrect;
}

function generateQuestions(words, quizType, mode) {
  if (mode === 'practice') {
    var playerName = document.getElementById('player-name').value.trim();
    var progress = JSON.parse(localStorage.getItem('vocabGame_practice_' + playerName + '_' + currentDeck.id) || '{}');
    words = words.filter(function(w) { return !progress[w.en + '_' + quizType]; });
  }
  return shuffle(words);
}

function generateChoiceOptions(correctWord, allWords, showEn) {
  var wrongWords = randomPick(allWords, 3, [correctWord]);
  var options = shuffle([correctWord, ...wrongWords]);
  return options.map(function(w) {
    return {
      label: showEn ? w.zh : w.en,
      value: w.id,
      correct: w.id === correctWord.id
    };
  });
}

// ===== Practice Game =====
function startPracticeGame(quizType) {
  var selectedWords = currentWords.filter(function(w) { return selectedWordIds.has(w.id); });
  var questions = generateQuestions(selectedWords, quizType, 'practice');
  if (questions.length === 0) {
    alert('這個題型的選中單字都已經答對了！');

    return;
  }
  gameState = {
    mode: 'practice',
    quizType: quizType,
    questions: questions,
    currentIndex: 0,
    score: 0,
    total: questions.length,
    answers: []
  };
  incrementPlayCount(document.getElementById('player-name').value.trim());
  document.getElementById('game-row-timer').style.display = 'none';
  document.querySelector('.game-exit-practice').style.visibility = 'visible';
  renderGameQuestion();
  showPage('page-practice-game');
}

// ===== Game Rendering =====
function renderGameQuestion() {
  var quizType = gameState.quizType;
  // For mixed mode, get the quiz type from the mixed question list
  if (quizType === 'mixed' && gameState.mixedQuestions) {
    if (gameState.currentIndex < gameState.mixedQuestions.length) {
      quizType = gameState.mixedQuestions[gameState.currentIndex].quizType;
    }
  }
  var questions = gameState.questions;
  var currentIndex = gameState.currentIndex;
  var mode = gameState.mode;

  if (mode === 'challenge' && currentIndex >= questions.length) {
    refillChallengeQuestions();
    questions = gameState.questions;
  }
  if (mode === 'practice' && currentIndex >= questions.length) {
    showPracticeComplete();
    return;
  }

  var word = questions[currentIndex];
  var questionEl = document.getElementById('game-question');
  var answerEl = document.getElementById('game-answer');
  var actionsEl = document.getElementById('game-actions');
  var feedbackEl = document.getElementById('game-feedback');
  feedbackEl.innerHTML = '';
  actionsEl.innerHTML = '';

  if (mode === 'challenge') {
    document.getElementById('game-progress-text').textContent = '第 ' + (currentIndex + 1) + ' 題';
    document.getElementById('game-remaining').textContent = (gameState.score * 10) + ' 分';
    document.getElementById('game-progress-bar').style.width = (challengeTimeLeft / (gameState.timeLimit || 180) * 100) + '%';
  } else {
    document.getElementById('game-progress-text').textContent = '第 ' + (currentIndex + 1) + ' / ' + questions.length + ' 題';
    document.getElementById('game-remaining').textContent = '還剩 ' + (questions.length - currentIndex) + ' 個需練習';
    document.getElementById('game-progress-bar').style.width = (currentIndex / questions.length * 100) + '%';
  }

  if (quizType === 'zh2en') {
    questionEl.innerHTML = '<div class="question-word">' + word.zh + '</div>';
    answerEl.innerHTML = '<input type="text" id="user-input" class="game-input" autofocus>' +
      '<button class="btn btn-primary" id="btn-submit" onclick="submitAnswer()">確定</button>';
    setTimeout(function() { var inp = document.getElementById('user-input'); if (inp) inp.focus(); }, 100);
    document.getElementById('user-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    });
  } else if (quizType === 'en2zh') {
    questionEl.innerHTML = '<div class="question-word">' + word.en + '</div>';
    answerEl.innerHTML = '<input type="text" id="user-input" class="game-input" autofocus>' +
      '<button class="btn btn-primary" id="btn-submit" onclick="submitAnswer()">確定</button>';
    setTimeout(function() { var inp = document.getElementById('user-input'); if (inp) inp.focus(); }, 100);
    document.getElementById('user-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    });
  } else {
    var showEn = Math.random() > 0.5;
    questionEl.innerHTML = '<div class="question-word">' + (showEn ? word.en : word.zh) + '</div>';
    var options = generateChoiceOptions(word, currentWords, showEn);
    answerEl.innerHTML = options.map(function(opt) {
      return '<button class="btn-choice" data-value="' + opt.value + '" data-correct="' + opt.correct + '" onclick="submitChoice(' + opt.value + ')">' + opt.label + '</button>';
    }).join('');
  }
}

async function submitAnswer() {
  var inputEl = document.getElementById('user-input');
  if (!inputEl || inputEl.disabled) return;
  var input = inputEl.value;
  if (!input.trim()) return;
  inputEl.disabled = true;
  inputEl.blur();
  _lastSubmitTime = Date.now();

  var word = gameState.questions[gameState.currentIndex];
  var correct = false;
  var correctAnswer = '';

  var activeType = gameState.quizType;
  if (activeType === 'mixed' && gameState.mixedQuestions) {
    activeType = gameState.mixedQuestions[gameState.currentIndex].quizType;
  }
  if (activeType === 'zh2en') {
    correct = checkZh2En(word.en, input);
    correctAnswer = word.en;
  } else {
    correct = await checkSemanticMatch(word.zh, input);
    correctAnswer = word.zh;
  }
  if (!correct) correctAnswer = word.en + ' = ' + word.zh;

  showFeedback(correct, correctAnswer);
  handleAnswer(word, correct);
}

function submitChoice(selectedId) {
  var word = gameState.questions[gameState.currentIndex];
  var correct = selectedId === word.id;
  var correctAnswer = word.en + ' = ' + word.zh;

  document.querySelectorAll('.btn-choice').forEach(function(btn) {
    btn.disabled = true;
    if (parseInt(btn.dataset.value) === word.id) {
      btn.classList.add('correct');
    } else if (parseInt(btn.dataset.value) === selectedId && !correct) {
      btn.classList.add('wrong');
    }
  });

  showFeedback(correct, correctAnswer);
  handleAnswer(word, correct);
}

function showFeedback(correct, correctAnswer) {
  var feedback = document.getElementById('game-feedback');
  if (correct) {
    feedback.innerHTML = '<div class="feedback-correct">答對了！</div>';
  } else {
    feedback.innerHTML = '<div class="feedback-wrong">答錯了<br>正確答案：<strong>' + correctAnswer + '</strong></div>';
  }
}

function handleAnswer(word, correct) {
  gameState.answers.push({ word: word, correct: correct });
  if (correct) gameState.score++;

  // Update player stats
  var playerName = document.getElementById('player-name').value.trim();
  updatePlayerStats(playerName, word.en, correct);

  if (gameState.mode === 'practice' && correct) {
    var progress = JSON.parse(localStorage.getItem('vocabGame_practice_' + playerName + '_' + currentDeck.id) || '{}');
    var actualType = gameState.quizType;
    if (actualType === 'mixed' && gameState.mixedQuestions) {
      actualType = gameState.mixedQuestions[gameState.currentIndex].quizType;
    }
    progress[word.en + '_' + actualType] = true;
    localStorage.setItem('vocabGame_practice_' + playerName + '_' + currentDeck.id, JSON.stringify(progress));
  }

  // Convert submit button to next button (for text input questions)
  var submitBtn = document.getElementById('btn-submit');
  if (submitBtn) {
    submitBtn.id = 'btn-next';
    submitBtn.textContent = '下一題 →';
    submitBtn.setAttribute('onclick', 'nextQuestion()');
  } else {
    // For choice questions, add next button in actions area
    var actionsEl = document.getElementById('game-actions');
    actionsEl.innerHTML = '<button class="btn btn-primary" id="btn-next" onclick="nextQuestion()">下一題 →</button>';
  }
}

function nextQuestion() {
  gameState.currentIndex++;
  renderGameQuestion();
}

function exitGame() {
  if (confirm('確定要離開嗎？')) {
    if (gameState.mode === 'challenge') {
      stopChallengeTimer();
      if (gameState.currentIndex > 0) {
        var playerName = document.getElementById('player-name').value.trim();
        saveScore({
          playerName: playerName,
          score: gameState.score * 10,
          total: gameState.currentIndex,
          deckId: currentDeck.id,
          timeLimit: gameState.timeLimit || 180,
          timestamp: Date.now()
        });
      }
    }
    if (gameState.mode === 'practice') {
      renderPracticeType();
      showPage('page-practice-type');
    } else {
      showPage('page-home');
    }
  }
}

function showPracticeComplete() {
  var score = gameState.score;
  var total = gameState.total;
  document.getElementById('game-question').innerHTML =
    '<div class="complete-message">' +
    '<div class="complete-icon">🎉</div>' +
    '<h2>練習完成！</h2>' +
    '<p>答對 ' + score + ' / ' + total + ' 題</p></div>';
  document.getElementById('game-answer').innerHTML = '';
  document.getElementById('game-feedback').innerHTML = '';
  document.getElementById('game-actions').innerHTML =
    '<button class="btn btn-primary" onclick="renderPracticeType(); showPage(\'page-practice-type\')">回題型選擇</button> ' +
    '<button class="btn btn-secondary" onclick="showPage(\'page-home\')">回首頁</button>';
}

// ===== Challenge Mode (Timed) =====
var challengeTimer = null;
var challengeTimeLeft = 0;

function renderChallengeSetup() {
  challengeConfig = { types: new Set(['zh2en']), timeLimit: 180 };
  document.querySelectorAll('#challenge-type-options .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#challenge-type-options [data-type="zh2en"]').classList.add('active');
  document.querySelectorAll('#challenge-time-options .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#challenge-time-options [data-time="180"]').classList.add('active');
}

function toggleChallengeType(type) {
  if (!challengeConfig.types) challengeConfig.types = new Set(['zh2en']);
  var btn = document.querySelector('#challenge-type-options [data-type="' + type + '"]');
  if (challengeConfig.types.has(type)) {
    if (challengeConfig.types.size > 1) {
      challengeConfig.types.delete(type);
      btn.classList.remove('active');
    }
  } else {
    challengeConfig.types.add(type);
    btn.classList.add('active');
  }
}

function selectChallengeTime(seconds) {
  challengeConfig.timeLimit = seconds;
  document.querySelectorAll('#challenge-time-options .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#challenge-time-options [data-time="' + seconds + '"]').classList.add('active');
}

function generateChallengeQuestions(types) {
  // Generate a large pool of questions (shuffle all words, assign random types)
  var pool = shuffle([...currentWords]);
  // Double pool to avoid running out quickly
  pool = pool.concat(shuffle([...currentWords]));
  if (types.length === 1) {
    return { quizType: types[0], questions: pool, mixedQuestions: null };
  }
  var mixed = pool.map(function(w) {
    return { word: w, quizType: types[Math.floor(Math.random() * types.length)] };
  });
  return { quizType: 'mixed', questions: pool, mixedQuestions: mixed };
}

function startChallengeGame() {
  var types = challengeConfig.types ? [...challengeConfig.types] : ['zh2en'];
  var timeLimit = challengeConfig.timeLimit || 180;
  var gen = generateChallengeQuestions(types);

  gameState = {
    mode: 'challenge',
    quizType: gen.quizType,
    mixedQuestions: gen.mixedQuestions,
    questions: gen.questions,
    currentIndex: 0,
    score: 0,
    total: 0,
    answers: [],
    timeLimit: timeLimit
  };

  incrementPlayCount(document.getElementById('player-name').value.trim());
  document.getElementById('game-row-timer').style.display = 'flex';
  document.querySelector('.game-exit-practice').style.visibility = 'hidden';
  startChallengeTimer(timeLimit);
  renderGameQuestion();
  showPage('page-practice-game');
}

function startChallengeTimer(seconds) {
  stopChallengeTimer();
  challengeTimeLeft = seconds;
  updateTimerDisplay();
  challengeTimer = setInterval(function() {
    challengeTimeLeft--;
    updateTimerDisplay();
    if (challengeTimeLeft <= 0) {
      stopChallengeTimer();
      endChallengeByTime();
    }
  }, 1000);
}

function stopChallengeTimer() {
  if (challengeTimer) { clearInterval(challengeTimer); challengeTimer = null; }
}

function updateTimerDisplay() {
  var el = document.getElementById('game-timer');
  var min = Math.floor(challengeTimeLeft / 60);
  var sec = challengeTimeLeft % 60;
  el.textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
  if (challengeTimeLeft <= 30) {
    el.classList.add('urgent');
  } else {
    el.classList.remove('urgent');
  }
}

function endChallengeByTime() {
  gameState.total = gameState.currentIndex;
  renderChallengeResult();
  showPage('page-challenge-result');
}

function refillChallengeQuestions() {
  // If running low on questions, add more
  var types = challengeConfig.types ? [...challengeConfig.types] : ['zh2en'];
  var extra = shuffle([...currentWords]);
  gameState.questions = gameState.questions.concat(extra);
  if (gameState.mixedQuestions) {
    var mixed = extra.map(function(w) {
      return { word: w, quizType: types[Math.floor(Math.random() * types.length)] };
    });
    gameState.mixedQuestions = gameState.mixedQuestions.concat(mixed);
  }
}

// ===== Leaderboard =====
// Migrate old leaderboard data
(function migrateLeaderboard() {
  var old = localStorage.getItem('vocabGame_leaderboard');
  if (!old) return;
  var entries = JSON.parse(old);
  entries.forEach(function(e) {
    if (!e.deckId) return;
    var key = 'vocabGame_lb_' + e.deckId;
    var board = JSON.parse(localStorage.getItem(key) || '[]');
    var existing = board.findIndex(function(b) { return b.playerName === e.playerName; });
    if (existing >= 0) {
      if (e.score > board[existing].score) board[existing] = e;
    } else {
      board.push(e);
    }
    board.sort(function(a, b) { return b.score - a.score || a.timestamp - b.timestamp; });
    localStorage.setItem(key, JSON.stringify(board.slice(0, 100)));
  });
  localStorage.removeItem('vocabGame_leaderboard');
})();

function saveScore(data) {
  var timeKey = data.timeLimit || 180;
  var key = 'vocabGame_lb_' + data.deckId + '_' + timeKey;
  var board = JSON.parse(localStorage.getItem(key) || '[]');
  // Keep only best score per player
  var existing = board.findIndex(function(e) { return e.playerName === data.playerName; });
  if (existing >= 0) {
    if (data.score > board[existing].score ||
        (data.score === board[existing].score && data.timestamp < board[existing].timestamp)) {
      board[existing] = data;
    }
  } else {
    board.push(data);
  }
  board.sort(function(a, b) { return b.score - a.score || a.timestamp - b.timestamp; });
  board = board.slice(0, 100);
  localStorage.setItem(key, JSON.stringify(board));
  // Also save to legacy key for backward compat
  var legacyKey = 'vocabGame_lb_' + data.deckId;
  var legacyBoard = JSON.parse(localStorage.getItem(legacyKey) || '[]');
  var legacyExisting = legacyBoard.findIndex(function(e) { return e.playerName === data.playerName; });
  if (legacyExisting >= 0) {
    if (data.score > legacyBoard[legacyExisting].score) legacyBoard[legacyExisting] = data;
  } else {
    legacyBoard.push(data);
  }
  legacyBoard.sort(function(a, b) { return b.score - a.score || a.timestamp - b.timestamp; });
  localStorage.setItem(legacyKey, JSON.stringify(legacyBoard.slice(0, 100)));
}

function getLeaderboard(deckId, timeLimit) {
  if (timeLimit) {
    var key = 'vocabGame_lb_' + deckId + '_' + timeLimit;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  // fallback: legacy key (all times combined)
  var key = 'vocabGame_lb_' + deckId;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function renderChallengeResult() {
  stopChallengeTimer();
  var correctCount = gameState.score;
  var totalAnswered = gameState.total || gameState.currentIndex;
  var points = correctCount * 10;
  var playerName = document.getElementById('player-name').value.trim();
  var rate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  document.getElementById('result-score').textContent = points + ' 分';
  document.getElementById('result-rate').textContent = '答對 ' + correctCount + ' / ' + totalAnswered + ' 題（正確率 ' + rate + '%）';

  var timeLimit = gameState.timeLimit || 180;
  saveScore({
    playerName: playerName,
    score: points,
    total: totalAnswered,
    deckId: currentDeck.id,
    timeLimit: timeLimit,
    timestamp: Date.now()
  });

  var entries = getLeaderboard(currentDeck.id, timeLimit).slice(0, 10);

  var table = document.getElementById('leaderboard-table');
  var tableHtml = '<thead><tr><th>名次</th><th>玩家</th><th>分數</th></tr></thead><tbody>';

  entries.forEach(function(e, i) {
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    var isMe = e.playerName === playerName;
    tableHtml += '<tr class="' + (isMe ? 'highlight' : '') + '">' +
      '<td>' + medal + '</td>' +
      '<td>' + e.playerName + '</td>' +
      '<td>' + e.score + ' 分</td></tr>';
  });

  tableHtml += '</tbody>';
  table.innerHTML = tableHtml;
}

// ===== Leaderboard Page =====
var lbSelectedTime = 180;

function selectLbTime(time) {
  lbSelectedTime = time;
  document.querySelectorAll('.lb-time-toggle .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.lb-time-toggle [data-lb-time="' + time + '"]').classList.add('active');
  renderLeaderboardPage();
}

function goToLeaderboard() {
  var select = document.getElementById('lb-deck-select');
  var allDecks = getAllDecks();
  select.innerHTML = allDecks.map(function(d) {
    return '<option value="' + d.id + '"' + (currentDeck && currentDeck.id === d.id ? ' selected' : '') + '>' + d.name + '</option>';
  }).join('');
  renderLeaderboardPage();
  showPage('page-leaderboard');
}

function renderLeaderboardPage() {
  var deckId = document.getElementById('lb-deck-select').value;
  var entries = getLeaderboard(deckId, lbSelectedTime);
  var table = document.getElementById('lb-table');
  var emptyMsg = document.getElementById('lb-empty');
  var playerName = document.getElementById('player-name').value.trim();

  if (entries.length === 0) {
    table.innerHTML = '';
    table.style.display = 'none';
    emptyMsg.style.display = 'block';
    return;
  }

  table.style.display = '';
  emptyMsg.style.display = 'none';

  var html = '<thead><tr><th>名次</th><th>玩家</th><th>最高分</th></tr></thead><tbody>';
  entries.forEach(function(e, i) {
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    var isMe = e.playerName === playerName;
    html += '<tr class="' + (isMe ? 'highlight' : '') + '">' +
      '<td>' + medal + '</td>' +
      '<td>' + e.playerName + '</td>' +
      '<td>' + e.score + ' 分</td></tr>';
  });
  html += '</tbody>';
  table.innerHTML = html;
}

// ===== Player Stats =====
function getPlayerStats(playerName) {
  return JSON.parse(localStorage.getItem('vocabGame_stats_' + playerName) || '{"plays":0,"correct":0,"total":0,"words":{}}');
}

function updatePlayerStats(playerName, wordEn, correct) {
  var stats = getPlayerStats(playerName);
  stats.total++;
  if (correct) {
    stats.correct++;
    stats.words[wordEn] = true;
  }
  localStorage.setItem('vocabGame_stats_' + playerName, JSON.stringify(stats));
}

function incrementPlayCount(playerName) {
  var stats = getPlayerStats(playerName);
  stats.plays++;
  localStorage.setItem('vocabGame_stats_' + playerName, JSON.stringify(stats));
}

function renderHomeStats() {
  var playerName = document.getElementById('player-name').value.trim();
  var container = document.getElementById('home-stats');
  if (!playerName) { container.innerHTML = ''; return; }
  var stats = getPlayerStats(playerName);
  var rate = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
  var wordCount = Object.keys(stats.words).length;
  container.innerHTML =
    '<div class="stat-item"><div class="stat-value">' + stats.plays + '</div><div class="stat-label">遊玩次數</div></div>' +
    '<div class="stat-item"><div class="stat-value">' + wordCount + '</div><div class="stat-label">已記單字</div></div>' +
    '<div class="stat-item"><div class="stat-value">' + rate + '%</div><div class="stat-label">總答對率</div></div>';
  renderHomeLeaderboard();
}

var homeLbTime = 180;

function switchHomeLbTime(time) {
  homeLbTime = time;
  document.querySelectorAll('.home-lb-toggle .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.home-lb-toggle [data-hlb-time="' + time + '"]').classList.add('active');
  renderHomeLbList();
}

function renderHomeLeaderboard() {
  var container = document.getElementById('home-leaderboard');
  if (!currentDeck) { container.style.display = 'none'; return; }

  var entries3 = getLeaderboard(currentDeck.id, 180);
  var entries5 = getLeaderboard(currentDeck.id, 300);

  if (entries3.length === 0 && entries5.length === 0) {
    container.style.display = 'none'; return;
  }

  var html = '<div class="home-lb-toggle">' +
    '<button class="btn-option' + (homeLbTime === 180 ? ' active' : '') + '" data-hlb-time="180" onclick="switchHomeLbTime(180)">3 分鐘</button>' +
    '<button class="btn-option' + (homeLbTime === 300 ? ' active' : '') + '" data-hlb-time="300" onclick="switchHomeLbTime(300)">5 分鐘</button>' +
    '</div>' +
    '<div id="home-lb-list"></div>';

  container.innerHTML = html;
  container.style.display = 'block';
  renderHomeLbList();
}

function renderHomeLbList() {
  var listEl = document.getElementById('home-lb-list');
  if (!listEl || !currentDeck) return;

  var entries = getLeaderboard(currentDeck.id, homeLbTime).slice(0, 10);

  if (entries.length === 0) {
    listEl.innerHTML = '<div class="home-lb-empty">尚無紀錄</div>';
    return;
  }

  var playerName = document.getElementById('player-name').value.trim();
  var medals = ['🥇', '🥈', '🥉'];
  var leftCol = entries.slice(0, 5);
  var rightCol = entries.slice(5, 10);

  function buildRow(e, i) {
    var rank = i < 3 ? medals[i] : (i + 1);
    var isMe = e.playerName === playerName;
    return '<div class="home-lb-row' + (isMe ? ' is-me' : '') + '">' +
      '<span class="home-lb-rank">' + rank + '</span>' +
      '<span class="home-lb-name">' + e.playerName + '</span>' +
      '<span class="home-lb-score">' + e.score + '</span>' +
    '</div>';
  }

  var leftHtml = '';
  leftCol.forEach(function(e, i) { leftHtml += buildRow(e, i); });
  var rightHtml = '';
  rightCol.forEach(function(e, i) { rightHtml += buildRow(e, i + 5); });

  listEl.innerHTML = '<div class="home-lb-columns">' +
    '<div>' + leftHtml + '</div>' +
    '<div>' + rightHtml + '</div>' +
  '</div>';
}

// ===== Mastered Words Page =====
function goToMasteredWords() {
  var playerName = document.getElementById('player-name').value.trim();
  if (!playerName) { alert('請先輸入你的名字！'); return; }
  renderMasteredWords();
  showPage('page-mastered');
}

function getMasteredWordsList() {
  var playerName = document.getElementById('player-name').value.trim();
  var stats = getPlayerStats(playerName);
  var masteredKeys = Object.keys(stats.words || {});
  if (masteredKeys.length === 0) return [];

  // Look up zh translation from all decks
  var allDecks = getAllDecks();
  var wordMap = {};
  allDecks.forEach(function(d) {
    d.words.forEach(function(w) {
      if (!wordMap[w.en.toLowerCase()]) wordMap[w.en.toLowerCase()] = w.zh;
    });
  });

  return masteredKeys.map(function(en) {
    return { en: en, zh: wordMap[en.toLowerCase()] || '' };
  }).sort(function(a, b) { return a.en.localeCompare(b.en); });
}

function renderMasteredWords(filter) {
  var words = getMasteredWordsList();
  var list = document.getElementById('mastered-list');
  var emptyMsg = document.getElementById('mastered-empty');
  var summary = document.getElementById('mastered-summary');
  document.getElementById('mastered-search').value = filter || '';

  if (words.length === 0) {
    list.innerHTML = '';
    list.style.display = 'none';
    emptyMsg.style.display = 'block';
    summary.textContent = '';
    return;
  }

  list.style.display = '';
  emptyMsg.style.display = 'none';

  var filtered = words;
  if (filter) {
    var f = filter.toLowerCase();
    filtered = words.filter(function(w) {
      return w.en.toLowerCase().includes(f) || w.zh.includes(f);
    });
  }

  summary.textContent = '共記住 ' + words.length + ' 個單字' + (filter && filtered.length !== words.length ? '（顯示 ' + filtered.length + ' 筆）' : '');

  // Group by letter
  var groups = {};
  filtered.forEach(function(w) {
    var letter = w.en[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(w);
  });

  var html = '';
  Object.keys(groups).sort().forEach(function(letter) {
    html += '<div class="word-group">';
    html += '<div class="group-header"><span class="group-title">' + letter + ' (' + groups[letter].length + ')</span></div>';
    groups[letter].forEach(function(w) {
      html += '<div class="word-item" style="cursor:default">' +
        '<span class="word-en">' + w.en + '</span>' +
        '<span class="word-zh">' + w.zh + '</span>' +
      '</div>';
    });
    html += '</div>';
  });
  list.innerHTML = html;
}

function filterMasteredWords() {
  var filter = document.getElementById('mastered-search').value;
  renderMasteredWords(filter);
}

// ===== Global Keyboard Controls =====
var _lastSubmitTime = 0;

document.addEventListener('keydown', function(e) {
  var gamePage = document.getElementById('page-practice-game');
  if (!gamePage || !gamePage.classList.contains('active')) return;

  // Skip if an input is focused (let input's own handler deal with Enter)
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

  // Debounce: ignore Enter within 300ms of last submit
  if (e.key === 'Enter' && Date.now() - _lastSubmitTime < 300) return;

  // Enter → next question (when "下一題" button is visible)
  if (e.key === 'Enter') {
    var nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
      e.preventDefault();
      nextQuestion();
      return;
    }
    // Enter to select focused choice
    var focusedChoice = document.querySelector('.btn-choice.focused:not(:disabled)');
    if (focusedChoice) {
      e.preventDefault();
      focusedChoice.click();
      return;
    }
  }

  // Arrow keys for choice questions
  var choices = document.querySelectorAll('.btn-choice:not(:disabled)');
  if (choices.length === 0) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    var focused = document.querySelector('.btn-choice.focused');
    var idx = -1;
    if (focused) {
      choices.forEach(function(btn, i) { if (btn === focused) idx = i; });
      focused.classList.remove('focused');
    }
    if (e.key === 'ArrowDown') {
      idx = (idx + 1) % choices.length;
    } else {
      idx = idx <= 0 ? choices.length - 1 : idx - 1;
    }
    choices[idx].classList.add('focused');
    choices[idx].scrollIntoView({ block: 'nearest' });
  }
});
