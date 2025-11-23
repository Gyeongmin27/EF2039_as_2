// 게임 상태 관리
let gameState = {
    currentWord: '',
    currentDifficulty: '중',
    currentSpeed: '중',
    score: 0,
    isPlaying: false,
    timer: null,
    timeLeft: 1.5,
    fallingLetters: [],
    animationIntervals: [] // 애니메이션 인터벌 추적
};

// 속도 설정 (밀리초 단위, 작을수록 빠름)
const speedSettings = {
    '느림': 100,
    '중': 50,
    '빠름': 30,
    '매우빠름': 15
};

// 점수 설정 (난이도별)
const scoreSettings = {
    '하': 10,
    '중': 20,
    '상': 30
};

// DOM 요소
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const submitBtn = document.getElementById('submit-btn');
const wordInput = document.getElementById('word-input');
const gameArea = document.getElementById('game-area');
const timerDisplay = document.getElementById('timer');
const gameScoreDisplay = document.getElementById('game-score');
const currentScoreDisplay = document.getElementById('current-score');
const currentDifficultyDisplay = document.getElementById('current-difficulty');
const currentSpeedDisplay = document.getElementById('current-speed');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 설정 불러오기
    loadSettings();
    updateStartScreen();
    
    // 이벤트 리스너 등록
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetToStart);
    submitBtn.addEventListener('click', submitAnswer);
    wordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
});

// 설정 불러오기
function loadSettings() {
    gameState.currentDifficulty = localStorage.getItem('gameDifficulty') || '중';
    gameState.currentSpeed = localStorage.getItem('gameSpeed') || '중';
}

// 시작 화면 업데이트
function updateStartScreen() {
    if (currentDifficultyDisplay) {
        currentDifficultyDisplay.textContent = gameState.currentDifficulty;
    }
    if (currentSpeedDisplay) {
        currentSpeedDisplay.textContent = gameState.currentSpeed;
    }
    if (currentScoreDisplay) {
        currentScoreDisplay.textContent = gameState.score;
    }
}

// 게임 시작
function startGame() {
    // 설정 다시 불러오기
    loadSettings();
    
    // 게임 상태 초기화
    gameState.isPlaying = true;
    gameState.currentWord = getRandomWord(gameState.currentDifficulty);
    gameState.timeLeft = 1.5;
    gameState.fallingLetters = [];
    
    // 화면 전환
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    resultScreen.classList.remove('active');
    
    // 게임 영역 초기화
    gameArea.innerHTML = '';
    wordInput.value = '';
    wordInput.style.display = 'none';
    submitBtn.style.display = 'none';
    document.getElementById('input-section').style.display = 'none';
    
    // 애니메이션 인터벌 배열 초기화
    gameState.animationIntervals = [];
    
    // 점수 표시 업데이트
    gameScoreDisplay.textContent = gameState.score;
    
    // 글자 떨어뜨리기 시작
    startFallingLetters();
}

// 글자 떨어뜨리기 시작
function startFallingLetters() {
    const letters = splitWord(gameState.currentWord);
    const speed = speedSettings[gameState.currentSpeed] || 50;
    
    // 글자 순서를 랜덤으로 섞기
    const shuffledLetters = [...letters];
    for (let i = shuffledLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
    }
    
    // 랜덤 순서로 글자를 떨어뜨림
    shuffledLetters.forEach((letter, index) => {
        setTimeout(() => {
            createFallingLetter(letter, speed);
        }, index * 300); // 각 글자를 약간씩 지연시켜 떨어뜨림
    });
    
    // 모든 글자가 떨어진 후 입력 화면 표시
    const totalDelay = shuffledLetters.length * 300 + 2000; // 마지막 글자 떨어진 후 2초 대기
    setTimeout(() => {
        if (gameState.isPlaying) {
            showInputSection();
        }
    }, totalDelay);
}

// 떨어지는 글자 생성
function createFallingLetter(letter, speed) {
    if (!gameState.isPlaying) return; // 게임이 종료되면 생성하지 않음
    
    const letterElement = document.createElement('div');
    letterElement.className = 'falling-letter';
    letterElement.textContent = letter;
    
    const gameAreaWidth = gameArea.offsetWidth;
    const gameAreaHeight = gameArea.offsetHeight;
    
    // 중앙 주변 랜덤 위치에서 발사 (가장자리 제외: 20%~80% 범위)
    const margin = gameAreaWidth * 0.2; // 화면의 20%를 가장자리로 간주
    const minX = margin;
    const maxX = gameAreaWidth - margin;
    const startX = minX + Math.random() * (maxX - minX);
    const startY = 0;
    
    letterElement.style.left = startX + 'px';
    letterElement.style.top = startY + 'px';
    letterElement.style.transform = 'translate(-50%, -50%)'; // 중앙 정렬
    
    gameArea.appendChild(letterElement);
    gameState.fallingLetters.push(letterElement);
    
    // 중력 시뮬레이션을 위한 물리 변수
    let currentY = startY;
    let velocityY = 0; // 수직 초기 속도
    const gravity = 0.5; // 중력 가속도
    const baseSpeed = 100 / speed; // 속도 설정에 따른 기본 속도
    
    // 애니메이션 시작 (중력 효과만 적용)
    const animationInterval = setInterval(() => {
        if (!gameState.isPlaying) {
            clearInterval(animationInterval);
            return;
        }
        
        // 중력에 의한 수직 가속
        velocityY += gravity * baseSpeed;
        currentY += velocityY;
        
        letterElement.style.top = currentY + 'px';
        
        // 화면 밖으로 나가면 제거
        if (currentY > gameAreaHeight + 50) {
            clearInterval(animationInterval);
            const index = gameState.animationIntervals.indexOf(animationInterval);
            if (index > -1) {
                gameState.animationIntervals.splice(index, 1);
            }
            if (letterElement.parentNode) {
                letterElement.parentNode.removeChild(letterElement);
            }
        }
    }, 16); // 약 60fps
    
    gameState.animationIntervals.push(animationInterval);
}

// 입력 섹션 표시
function showInputSection() {
    wordInput.style.display = 'block';
    submitBtn.style.display = 'inline-block';
    document.getElementById('input-section').style.display = 'flex';
    
    // 타이머 시작
    startTimer();
    
    // 입력창에 포커스
    wordInput.focus();
}

// 타이머 시작
function startTimer() {
    gameState.timeLeft = 1.5;
    timerDisplay.textContent = gameState.timeLeft.toFixed(1);
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft -= 0.1;
        if (gameState.timeLeft < 0) {
            gameState.timeLeft = 0;
        }
        timerDisplay.textContent = gameState.timeLeft.toFixed(1);
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            submitAnswer(); // 시간 초과 시 자동 제출
        }
    }, 100); // 0.1초마다 업데이트
}

// 답안 제출
function submitAnswer() {
    if (!gameState.isPlaying) return;
    
    // 모든 애니메이션 정리
    gameState.isPlaying = false;
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    gameState.animationIntervals.forEach(interval => {
        clearInterval(interval);
    });
    gameState.animationIntervals = [];
    
    const userAnswer = wordInput.value.trim();
    const correctAnswer = gameState.currentWord;
    
    // 결과 화면 표시
    showResult(userAnswer === correctAnswer, correctAnswer, userAnswer);
}

// 결과 화면 표시
function showResult(isCorrect, correctAnswer, userAnswer) {
    if (isCorrect) {
        // 정답일 경우 점수 증가하고 바로 다음 라운드 시작
        gameState.score += scoreSettings[gameState.currentDifficulty] || 20;
        currentScoreDisplay.textContent = gameState.score;
        gameScoreDisplay.textContent = gameState.score;
        
        // 짧은 성공 메시지 표시 후 바로 다음 라운드
        showSuccessMessage();
        
        // 0.5초 후 다음 라운드 시작
        setTimeout(() => {
            startNextRound();
        }, 500);
    } else {
        // 오답일 경우 결과 화면 표시
        gameScreen.classList.remove('active');
        resultScreen.classList.add('active');
        
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        const correctAnswerSpan = document.getElementById('correct-answer');
        const userAnswerSpan = document.getElementById('user-answer');
        
        resultTitle.textContent = '틀렸습니다';
        resultTitle.className = 'failure';
        resultMessage.textContent = '다시 시도해보세요!';
        
        // 점수 초기화
        gameState.score = 0;
        currentScoreDisplay.textContent = gameState.score;
        
        correctAnswerSpan.textContent = correctAnswer;
        userAnswerSpan.textContent = userAnswer || '(입력 없음)';
    }
}

// 성공 메시지 표시 (간단한 피드백)
function showSuccessMessage() {
    const messageElement = document.createElement('div');
    messageElement.textContent = '정답!';
    messageElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #52C41A;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-size: 2rem;
        font-weight: 700;
        z-index: 1000;
        animation: fadeOut 0.5s ease-out forwards;
    `;
    
    // CSS 애니메이션 추가
    if (!document.getElementById('success-animation-style')) {
        const style = document.createElement('style');
        style.id = 'success-animation-style';
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 500);
}

// 다음 라운드 시작
function startNextRound() {
    // 게임 영역 초기화
    gameArea.innerHTML = '';
    wordInput.value = '';
    wordInput.style.display = 'none';
    submitBtn.style.display = 'none';
    document.getElementById('input-section').style.display = 'none';
    
    // 애니메이션 인터벌 배열 초기화
    gameState.animationIntervals = [];
    gameState.fallingLetters = [];
    
    // 새로운 단어 선택
    gameState.isPlaying = true;
    gameState.currentWord = getRandomWord(gameState.currentDifficulty);
    
    // 점수 표시 업데이트
    gameScoreDisplay.textContent = gameState.score;
    
    // 다음 라운드 시작
    startFallingLetters();
}

// 처음 화면으로 리셋
function resetToStart() {
    // 게임 상태 종료
    gameState.isPlaying = false;
    
    // 모든 타이머 정리
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // 모든 애니메이션 인터벌 정리
    gameState.animationIntervals.forEach(interval => {
        clearInterval(interval);
    });
    gameState.animationIntervals = [];
    
    // 떨어지는 글자들 정리
    gameState.fallingLetters.forEach(letter => {
        if (letter.parentNode) {
            letter.parentNode.removeChild(letter);
        }
    });
    gameState.fallingLetters = [];
    
    // 화면 전환
    startScreen.classList.add('active');
    gameScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    
    // 시작 화면 업데이트
    updateStartScreen();
}

