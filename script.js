// 게임 상태 관리
let gameState = {
    currentWord: '',
    currentDifficulty: '중',
    currentSpeed: '중',
    score: 0,
    isPlaying: false,
    timer: null,
    timeLeft: 3,
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
    gameState.timeLeft = 3;
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
    const positions = ['top', 'left', 'right']; // 위, 왼쪽, 오른쪽
    const speed = speedSettings[gameState.currentSpeed] || 50;
    
    letters.forEach((letter, index) => {
        setTimeout(() => {
            createFallingLetter(letter, positions[index % positions.length], speed);
        }, index * 300); // 각 글자를 약간씩 지연시켜 떨어뜨림
    });
    
    // 모든 글자가 떨어진 후 입력 화면 표시
    const totalDelay = letters.length * 300 + 2000; // 마지막 글자 떨어진 후 2초 대기
    setTimeout(() => {
        if (gameState.isPlaying) {
            showInputSection();
        }
    }, totalDelay);
}

// 떨어지는 글자 생성
function createFallingLetter(letter, position, speed) {
    if (!gameState.isPlaying) return; // 게임이 종료되면 생성하지 않음
    
    const letterElement = document.createElement('div');
    letterElement.className = 'falling-letter';
    letterElement.textContent = letter;
    
    // 시작 위치 설정 (퍼센트 기반)
    let startXPercent;
    
    switch(position) {
        case 'top':
            startXPercent = 50; // 중앙
            break;
        case 'left':
            startXPercent = 20; // 왼쪽
            break;
        case 'right':
            startXPercent = 80; // 오른쪽
            break;
        default:
            startXPercent = 50;
    }
    
    letterElement.style.left = startXPercent + '%';
    letterElement.style.top = '0px';
    letterElement.style.transform = 'translateX(-50%)'; // 중앙 정렬
    
    gameArea.appendChild(letterElement);
    gameState.fallingLetters.push(letterElement);
    
    // 애니메이션 시작
    let currentY = 0;
    const gameAreaHeight = gameArea.offsetHeight;
    // 속도에 따라 떨어지는 거리 조절 (작을수록 빠름)
    const fallSpeed = 100 / speed; // speed가 작을수록 fallSpeed가 커짐
    
    const animationInterval = setInterval(() => {
        if (!gameState.isPlaying) {
            clearInterval(animationInterval);
            return;
        }
        
        currentY += fallSpeed;
        letterElement.style.top = currentY + 'px';
        
        // 화면 밖으로 나가면 제거
        if (currentY > gameAreaHeight) {
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
    gameState.timeLeft = 3;
    timerDisplay.textContent = gameState.timeLeft;
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        timerDisplay.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            submitAnswer(); // 시간 초과 시 자동 제출
        }
    }, 1000);
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
    gameScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const correctAnswerSpan = document.getElementById('correct-answer');
    const userAnswerSpan = document.getElementById('user-answer');
    
    if (isCorrect) {
        resultTitle.textContent = '정답입니다!';
        resultTitle.className = 'success';
        resultMessage.textContent = '축하합니다! 점수가 올라갑니다.';
        
        // 점수 증가
        gameState.score += scoreSettings[gameState.currentDifficulty] || 20;
        currentScoreDisplay.textContent = gameState.score;
    } else {
        resultTitle.textContent = '틀렸습니다';
        resultTitle.className = 'failure';
        resultMessage.textContent = '다시 시도해보세요!';
        
        // 점수 초기화 (요구사항에 따라)
        gameState.score = 0;
    }
    
    correctAnswerSpan.textContent = correctAnswer;
    userAnswerSpan.textContent = userAnswer || '(입력 없음)';
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

