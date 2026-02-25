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
}

// ===== Home Page =====
window.addEventListener('DOMContentLoaded', function() {
  const saved = localStorage.getItem('vocabGame_playerName');
  if (saved) document.getElementById('player-name').value = saved;

  // Restore remembered deck
  const savedDeckId = localStorage.getItem('vocabGame_currentDeckId');
  if (savedDeckId) {
    const allDecks = getAllDecks();
    const deck = allDecks.find(function(d) { return d.id === savedDeckId; });
    if (deck) {
      currentDeck = deck;
      currentWords = deck.words;
      updateHomeDeckInfo();
    }
  }
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
    renderChallengeSetup();
    showPage('page-challenge-setup');
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
    infoBar.style.borderStyle = 'dashed';
    return;
  }

  iconEl.textContent = icons[currentDeck.id] || '📄';
  nameEl.textContent = currentDeck.name;
  infoBar.style.borderStyle = 'solid';
  infoBar.style.borderColor = 'var(--primary)';

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

// ===== Deck Selection =====
function renderDeckSelect() {
  const allDecks = getAllDecks();
  const list = document.getElementById('deck-list');
  const icons = getDeckIcons();
  const builtinIds = new Set(BUILTIN_DECKS.map(function(d) { return d.id; }));
  let html = '';

  allDecks.forEach(function(deck) {
    const isCustom = !builtinIds.has(deck.id);
    const icon = icons[deck.id] || '📄';
    html += '<div class="deck-card" onclick="selectDeck(\'' + deck.id + '\')">' +
      '<div class="deck-icon">' + icon + '</div>' +
      '<div class="deck-info">' +
        '<div class="deck-name">' + deck.name + '</div>' +
        '<div class="deck-desc">' + (deck.description || '自訂題庫') + '</div>' +
        '<div class="deck-count">' + deck.words.length + ' 個單字</div>' +
      '</div>' +
      (isCustom ? '<button class="deck-delete" onclick="event.stopPropagation(); confirmDeleteDeck(\'' + deck.id + '\')" title="刪除題庫">🗑️</button>' : '') +
    '</div>';
  });

  list.innerHTML = html;
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
    renderChallengeSetup();
    showPage('page-challenge-setup');
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
      '<div style="font-size:0.85rem; color:var(--text-light); margin-top:4px">前 5 個：' +
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
    html += '<div class="group-header">' +
      '<span class="group-title">— ' + letter + ' (' + selectedInGroup + '/' + words.length + ') —</span>' +
      '<button class="btn btn-xs" onclick="toggleGroup(\'' + letter + '\', true)">全選</button>' +
      '<button class="btn btn-xs" onclick="toggleGroup(\'' + letter + '\', false)">取消</button>' +
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

function selectAllWords() {
  currentWords.forEach(function(w) { selectedWordIds.add(w.id); });
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
    return '<div class="type-card ' + (allDone ? 'completed' : '') + '" data-type="' + t.key + '" onclick="togglePracticeType(\'' + t.key + '\')">' +
      '<div class="type-check" style="position:absolute;top:8px;right:8px;font-size:1.2rem;display:none">✅</div>' +
      '<div class="type-icon">' + t.icon + '</div>' +
      '<h3>' + t.label + '</h3>' +
      '<p>' + t.desc + '</p>' +
      '<div class="type-progress">' +
        (allDone
          ? '<span class="done-badge">全部完成！</span>'
          : '<span class="remaining">還剩 <strong>' + remaining + '</strong> 個單字</span>') +
        '<div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:' + (total ? (done/total*100) : 0) + '%"></div></div>' +
      '</div></div>';
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
    card.querySelector('.type-check').style.display = 'none';
  } else {
    selectedPracticeTypes.add(typeKey);
    card.classList.add('selected');
    card.querySelector('.type-check').style.display = 'block';
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

  if (currentIndex >= questions.length) {
    if (mode === 'challenge') {
      renderChallengeResult();
      showPage('page-challenge-result');
      return;
    }
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

  document.getElementById('game-progress-text').textContent = '第 ' + (currentIndex + 1) + ' / ' + questions.length + ' 題';
  var remainText = mode === 'practice' ? '還剩 ' + (questions.length - currentIndex) + ' 個需練習' : '得分: ' + gameState.score;
  document.getElementById('game-remaining').textContent = remainText;
  document.getElementById('game-progress-bar').style.width = (currentIndex / questions.length * 100) + '%';

  if (quizType === 'zh2en') {
    questionEl.innerHTML = '<div class="question-prompt">請寫出英文</div><div class="question-word">' + word.zh + '</div>';
    answerEl.innerHTML = '<input type="text" id="user-input" class="game-input" placeholder="輸入英文..." autofocus>' +
      '<button class="btn btn-primary" onclick="submitAnswer()">確定</button>';
    setTimeout(function() { var inp = document.getElementById('user-input'); if (inp) inp.focus(); }, 100);
    document.getElementById('user-input').addEventListener('keydown', function(e) { if (e.key === 'Enter') submitAnswer(); });
  } else if (quizType === 'en2zh') {
    questionEl.innerHTML = '<div class="question-prompt">請寫出中文意思</div><div class="question-word">' + word.en + '</div>';
    answerEl.innerHTML = '<input type="text" id="user-input" class="game-input" placeholder="輸入中文..." autofocus>' +
      '<button class="btn btn-primary" onclick="submitAnswer()">確定</button>';
    setTimeout(function() { var inp = document.getElementById('user-input'); if (inp) inp.focus(); }, 100);
    document.getElementById('user-input').addEventListener('keydown', function(e) { if (e.key === 'Enter') submitAnswer(); });
  } else {
    var showEn = Math.random() > 0.5;
    questionEl.innerHTML = '<div class="question-prompt">' + (showEn ? '這個字的中文是？' : '這個字的英文是？') + '</div>' +
      '<div class="question-word">' + (showEn ? word.en : word.zh) + '</div>';
    var options = generateChoiceOptions(word, currentWords, showEn);
    answerEl.innerHTML = options.map(function(opt) {
      return '<button class="btn-choice" data-value="' + opt.value + '" data-correct="' + opt.correct + '" onclick="submitChoice(' + opt.value + ')">' + opt.label + '</button>';
    }).join('');
  }
}

async function submitAnswer() {
  var inputEl = document.getElementById('user-input');
  if (!inputEl) return;
  var input = inputEl.value;
  if (!input.trim()) return;
  inputEl.disabled = true;

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

  if (gameState.mode === 'practice' && correct) {
    var playerName = document.getElementById('player-name').value.trim();
    var progress = JSON.parse(localStorage.getItem('vocabGame_practice_' + playerName + '_' + currentDeck.id) || '{}');
    var actualType = gameState.quizType;
    if (actualType === 'mixed' && gameState.mixedQuestions) {
      actualType = gameState.mixedQuestions[gameState.currentIndex].quizType;
    }
    progress[word.en + '_' + actualType] = true;
    localStorage.setItem('vocabGame_practice_' + playerName + '_' + currentDeck.id, JSON.stringify(progress));
  }

  var actionsEl = document.getElementById('game-actions');
  if (correct && gameState.mode === 'practice') {
    setTimeout(function() {
      gameState.currentIndex++;
      renderGameQuestion();
    }, 1000);
  } else {
    actionsEl.innerHTML = '<button class="btn btn-primary" onclick="nextQuestion()">下一題 →</button>';
  }
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

// ===== Challenge Mode =====
function renderChallengeSetup() {
  challengeConfig = { types: new Set(['zh2en']), count: 20 };
  document.querySelectorAll('#challenge-type-options .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#challenge-type-options [data-type="zh2en"]').classList.add('active');
  document.querySelectorAll('#challenge-count-options .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#challenge-count-options [data-count="20"]').classList.add('active');
}

function toggleChallengeType(type) {
  if (!challengeConfig.types) challengeConfig.types = new Set(['zh2en']);
  var btn = document.querySelector('#challenge-type-options [data-type="' + type + '"]');
  if (challengeConfig.types.has(type)) {
    if (challengeConfig.types.size > 1) {
      challengeConfig.types.delete(type);
      btn.classList.remove('active');
    }
    // Don't allow deselecting last type
  } else {
    challengeConfig.types.add(type);
    btn.classList.add('active');
  }
}

function selectChallengeCount(count) {
  challengeConfig.count = count;
  document.querySelectorAll('#challenge-count-options .btn-option').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('#challenge-count-options [data-count="' + count + '"]').classList.add('active');
}

function startChallengeGame() {
  var types = challengeConfig.types ? [...challengeConfig.types] : ['zh2en'];
  var count = Math.min(challengeConfig.count, currentWords.length);
  var selectedQuestions = shuffle([...currentWords]).slice(0, count);

  if (types.length === 1) {
    gameState = {
      mode: 'challenge',
      quizType: types[0],
      questions: selectedQuestions,
      currentIndex: 0,
      score: 0,
      total: count,
      answers: []
    };
  } else {
    // Mixed types: assign random type to each question
    var mixedQuestions = selectedQuestions.map(function(w) {
      var randomType = types[Math.floor(Math.random() * types.length)];
      return { word: w, quizType: randomType };
    });
    gameState = {
      mode: 'challenge',
      quizType: 'mixed',
      mixedQuestions: mixedQuestions,
      questions: mixedQuestions.map(function(q) { return q.word; }),
      currentIndex: 0,
      score: 0,
      total: count,
      answers: []
    };
  }
  renderGameQuestion();
  showPage('page-practice-game');
}

// ===== Leaderboard =====
async function saveScore(data) {
  var board = JSON.parse(localStorage.getItem('vocabGame_leaderboard') || '[]');
  board.push(data);
  localStorage.setItem('vocabGame_leaderboard', JSON.stringify(board));
}

async function getLeaderboard(quizType, total, deckId) {
  var board = JSON.parse(localStorage.getItem('vocabGame_leaderboard') || '[]');
  return board
    .filter(function(e) { return e.quizType === quizType && e.total === total && (!deckId || e.deckId === deckId); })
    .sort(function(a, b) { return b.score - a.score || a.timestamp - b.timestamp; })
    .slice(0, 10);
}

async function renderChallengeResult() {
  var score = gameState.score;
  var total = gameState.total;
  var quizType = gameState.quizType;
  var playerName = document.getElementById('player-name').value.trim();
  var rate = Math.round((score / total) * 100);

  document.getElementById('result-score').textContent = score + ' / ' + total;
  document.getElementById('result-rate').textContent = '正確率 ' + rate + '%';

  await saveScore({
    playerName: playerName,
    score: score,
    total: total,
    quizType: quizType,
    deckId: currentDeck.id,
    timestamp: Date.now()
  });

  var entries = await getLeaderboard(quizType, total, currentDeck.id);
  var typeLabels = { zh2en: '中翻英', en2zh: '英翻中', choice: '選擇題' };

  var table = document.getElementById('leaderboard-table');
  var tableHtml = '<caption>' + typeLabels[quizType] + ' ' + total + ' 題 Top 10</caption>' +
    '<thead><tr><th>名次</th><th>玩家</th><th>分數</th><th>正確率</th></tr></thead><tbody>';

  var currentTimestamp = Date.now();
  entries.forEach(function(e, i) {
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    var isMe = e.playerName === playerName && Math.abs(e.timestamp - currentTimestamp) < 5000;
    tableHtml += '<tr class="' + (isMe ? 'highlight' : '') + '">' +
      '<td>' + medal + '</td>' +
      '<td>' + e.playerName + '</td>' +
      '<td>' + e.score + '/' + e.total + '</td>' +
      '<td>' + Math.round((e.score/e.total)*100) + '%</td></tr>';
  });

  tableHtml += '</tbody>';
  table.innerHTML = tableHtml;
}
