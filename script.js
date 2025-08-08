// DOM要素の取得
const startScreen = document.getElementById('start-screen');
const quizSelectScreen = document.getElementById('quiz-select-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startButton = document.getElementById('start-button');
const backToStartButton = document.getElementById('back-to-start-button');
const quizList = document.getElementById('quiz-list');
const nextButton = document.getElementById('next-button');
const restartButton = document.getElementById('restart-button');

const feedbackText = document.getElementById('feedback-text');
const explanationText = document.getElementById('explanation-text');
const explanationImage = document.getElementById('explanation-image');

const scoreText = document.getElementById('score-text');
const resultMessage = document.getElementById('result-message');

// 音声要素
const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');

// ゲーム状態
let currentQuizData = [];
let currentQuestionIndex = 0;
let score = 0;
let availableQuizzes = [];
let selectedQuizFile = '';

// 初期化
init();

async function init() {
    await loadQuizList();
    setupEventListeners();
}

// クイズ一覧を読み込む
async function loadQuizList() {
    try {
        const response = await fetch('quizzes.json');
        const data = await response.json();
        availableQuizzes = data.quizzes;
        displayQuizList();
    } catch (error) {
        console.error('クイズ一覧の読み込みに失敗しました:', error);
        // フォールバック: デフォルトのクイズを使用
        selectedQuizFile = 'quiz_data2.csv';
        await loadQuizData();
    }
}

// クイズ一覧を表示
function displayQuizList() {
    quizList.innerHTML = '';
    availableQuizzes.forEach(quiz => {
        const quizCard = document.createElement('div');
        quizCard.className = 'quiz-card';
        quizCard.innerHTML = `
            <div class="quiz-card-title">${quiz.name}</div>
            <div class="quiz-card-description">${quiz.description}</div>
            <div class="quiz-card-info">
                <span class="quiz-card-count">${quiz.questionCount}問</span>
                <span>🎯</span>
            </div>
        `;
        quizCard.addEventListener('click', () => selectQuiz(quiz));
        quizList.appendChild(quizCard);
    });
}

// クイズを選択
async function selectQuiz(quiz) {
    selectedQuizFile = quiz.file;
    await loadQuizData();
    if (currentQuizData.length > 0) {
        showScreen('quiz-screen');
        startQuiz();
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    startButton.addEventListener('click', () => showScreen('quiz-select-screen'));
    backToStartButton.addEventListener('click', () => showScreen('start-screen'));
    nextButton.addEventListener('click', nextQuestion);
    restartButton.addEventListener('click', restartQuiz);
}

// 画面切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// CSVファイルを読み込む
async function loadQuizData() {
    try {
        const response = await fetch(selectedQuizFile);
        const csvText = await response.text();
        // BOMを削除し、ヘッダーを除いて行ごとに分割
        const dataRows = csvText.trim().replace(/\uFEFF/g, '').split('\n').slice(1);

        currentQuizData = dataRows.map(row => {
            // CSVの行をパース（カンマで分割、ただしクォート内のカンマは無視）
            const columns = parseCSVRow(row);
            return {
                id: parseInt(columns[0]),
                question: columns[1],
                options: [columns[2], columns[3], columns[4], columns[5]],
                correctAnswer: parseInt(columns[6]) - 1, // 1-based to 0-based
                explanation: columns[7]
            };
        });
    } catch (error) {
        console.error('クイズデータの読み込みに失敗しました:', error);
        alert('クイズデータの読み込みに失敗しました。');
    }
}

// CSVの行をパースする関数
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// クイズ開始
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

// 問題表示
function showQuestion() {
    if (currentQuestionIndex >= currentQuizData.length) {
        showResult();
        return;
    }

    const question = currentQuizData[currentQuestionIndex];

    // 問題番号とテキストを表示
    document.getElementById('question-counter').textContent =
        `第${currentQuestionIndex + 1}問/全${currentQuizData.length}問`;
    document.getElementById('question-text').textContent = question.question;

    // 選択肢ボタンを生成
    const btnGrid = document.querySelector('.btn-grid');
    btnGrid.innerHTML = '';

    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = `btn option-btn option-${index + 1}`;
        button.textContent = option;
        button.dataset.answerIndex = index;
        button.addEventListener('click', () => selectAnswer(index));
        btnGrid.appendChild(button);
    });

    // フィードバック要素をリセット
    feedbackText.textContent = '';
    explanationText.style.visibility = 'hidden';
    explanationImage.classList.add('hidden');
    nextButton.classList.add('hidden');
}

// 答えを選択
function selectAnswer(selectedIndex) {
    const question = currentQuizData[currentQuestionIndex];
    const correctAnswer = question.correctAnswer;
    const optionButtons = document.querySelectorAll('.option-btn');
    const selectedButton = optionButtons[selectedIndex];

    // すべてのボタンを無効化
    optionButtons.forEach(button => {
        button.disabled = true;
        button.style.pointerEvents = 'none';
    });

    // 正解・不正解の判定と表示
    if (selectedIndex === correctAnswer) {
        selectedButton.classList.add('correct');
        feedbackText.textContent = "せいかい！";
        feedbackText.className = 'correct';
        correctSound.play();
        score++;
    } else {
        selectedButton.classList.add('incorrect');
        feedbackText.textContent = "ざんねん…";
        feedbackText.className = 'incorrect';
        incorrectSound.play();
        // 正解の選択肢をハイライト
        optionButtons.forEach(button => {
            if (parseInt(button.dataset.answerIndex) === correctAnswer) {
                button.classList.add('correct');
            }
        });
    }

    explanationText.textContent = `【かいせつ】${question.explanation}`;
    explanationText.style.visibility = 'visible';

    // 解説画像の表示
    const imagePath = `images/explanations/explain_${String(question.id).padStart(3, '0')}.png`;
    explanationImage.src = imagePath;
    explanationImage.onerror = () => {
        explanationImage.classList.add('hidden');
    };
    explanationImage.onload = () => {
        explanationImage.classList.remove('hidden');
    };

    nextButton.classList.remove('hidden');
}

// 次の問題へ進む処理
function nextQuestion() {
    currentQuestionIndex++;
    explanationImage.classList.add('hidden'); // 次の問題へ進むときに画像を非表示にする
    showQuestion();
}

// 結果表示処理
function showResult() {
    showScreen('result-screen');

    scoreText.textContent = `${currentQuizData.length}問中、${score}問正解！`;

    let message = '';
    const correctRate = score / currentQuizData.length;
    if (correctRate === 1) {
        message = 'すごい！パーフェクト！理科はかせだね！';
    } else if (correctRate >= 0.7) {
        message = 'おしい！あともう少し！';
    } else if (correctRate >= 0.4) {
        message = 'がんばったね！また挑戦してみよう！';
    } else {
        message = '今度はもっとがんばろう！';
    }

    resultMessage.textContent = message;
}

// クイズ再開
function restartQuiz() {
    showScreen('quiz-select-screen');
}