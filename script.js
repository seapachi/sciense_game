document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');

    const startButton = document.getElementById('start-button');
    const retryButton = document.getElementById('retry-button');
    const nextButton = document.getElementById('next-button');

    const questionCounter = document.getElementById('question-counter');
    const questionText = document.getElementById('question-text');
    const optionButtons = document.querySelectorAll('.option');
    
    const feedbackText = document.getElementById('feedback-text');
    const explanationText = document.getElementById('explanation-text');

    const scoreText = document.getElementById('score-text');
    const resultMessage = document.getElementById('result-message');

    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');

    // ゲームの状態
    let allQuizData = [];
    let currentQuizData = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // CSVファイルを読み込む
    async function loadQuizData() {
        try {
            const response = await fetch('quiz_data.csv');
            const csvText = await response.text();
            // BOMを削除し、ヘッダーを除いて行ごとに分割
            const dataRows = csvText.trim().replace(/\uFEFF/g, '').split('\n').slice(1);
            allQuizData = dataRows.map(row => {
                const columns = row.split(',');
                return {
                    id: columns[0],
                    question: columns[1],
                    options: [columns[2], columns[3], columns[4], columns[5]],
                    correctAnswer: parseInt(columns[6], 10),
                    explanation: columns[7]
                };
            });
        } catch (error) {
            console.error('CSVファイルの読み込みに失敗しました。', error);
            questionText.textContent = 'クイズデータの読み込みに失敗しました。ファイルを確認してください。';
        }
    }

    // ゲーム開始処理
    function startGame() {
        // 画面切り替え
        startScreen.classList.remove('active');
        resultScreen.classList.remove('active');
        quizScreen.classList.add('active');

        // 状態リセット
        score = 0;
        currentQuestionIndex = 0;
        // クイズデータをシャッフルして新しいセッションを開始
        currentQuizData = [...allQuizData].sort(() => Math.random() - 0.5);
        
        showQuestion();
    }

    // 問題表示処理
    function showQuestion() {
        resetState();
        if (currentQuestionIndex < currentQuizData.length) {
            const question = currentQuizData[currentQuestionIndex];
            questionCounter.textContent = `第${currentQuestionIndex + 1}問 / 全${currentQuizData.length}問`;
            questionText.textContent = question.question;
            
            optionButtons.forEach((button, index) => {
                button.textContent = question.options[index];
                button.dataset.answerIndex = index + 1;
            });
        } else {
            showResult();
        }
    }

    // 回答選択時の処理
    function selectAnswer(e) {
        const selectedButton = e.target;
        const selectedAnswer = parseInt(selectedButton.dataset.answerIndex, 10);
        const question = currentQuizData[currentQuestionIndex];
        const correctAnswer = question.correctAnswer;

        // 全てのボタンを無効化
        optionButtons.forEach(button => button.disabled = true);

        if (selectedAnswer === correctAnswer) {
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
        nextButton.classList.remove('hidden');
    }

    // 次の問題へ進む処理
    function nextQuestion() {
        currentQuestionIndex++;
        showQuestion();
    }

    // 結果表示処理
    function showResult() {
        quizScreen.classList.remove('active');
        resultScreen.classList.add('active');

        scoreText.textContent = `${currentQuizData.length}問中、${score}問正解！`;

        let message = '';
        const correctRate = score / currentQuizData.length;
        if (correctRate === 1) {
            message = 'すごい！パーフェクト！理科ダマンはかせだね！';
        } else if (correctRate >= 0.7) {
            message = 'おしい！あともう少し！';
        } else if (correctRate >= 0.4) {
            message = 'よくがんばったね！また挑戦してみてね！';
        } else {
            message = 'むずかしかったかな？もう一度やってみよう！';
        }
        resultMessage.textContent = message;
    }

    // 状態をリセットする関数
    function resetState() {
        optionButtons.forEach(button => {
            button.className = 'btn option';
            button.disabled = false;
        });
        feedbackText.textContent = '';
        explanationText.textContent = '';
        explanationText.style.visibility = 'hidden';
        nextButton.classList.add('hidden');
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startGame);
    retryButton.addEventListener('click', startGame);
    nextButton.addEventListener('click', nextQuestion);
    optionButtons.forEach(button => {
        button.addEventListener('click', selectAnswer);
    });

    // 初期化
    loadQuizData();
});