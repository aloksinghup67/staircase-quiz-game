const man = document.getElementById('man');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const modal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const answerFeedback = document.getElementById('answerFeedback');
const startBtn = document.getElementById('startBtn');

let currentStep = 0;
let score = 0;
let timeLeft = 180;
let timerId;
let currentQuestion = null;

const stairPositions = [
    { left: 27, top: 82.5 }, { left: 30, top: 77.5 },
    { left: 34, top: 72.5 }, { left: 38, top: 67 },
    { left: 44, top: 62 }, { left: 48, top: 56 },
    { left: 53, top: 51 }, { left: 61, top: 46 },
    { left: 66, top: 41 }, { left: 70, top: 35 }
];

function updateManPosition() {
    if (currentStep === 0) {
        man.style.left = '24vw';
        man.style.top = '87.5vh';
    } else {
        const stepIndex = currentStep - 1;
        if (stepIndex >= stairPositions.length) return;
        const { left, top } = stairPositions[stepIndex];
        man.style.left = `${left}vw`;
        man.style.top = `${top}vh`;
    }
}

async function generateQuestion() {
    try {
        const response = await fetch('/api/generate-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server Error:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.question || !data.correctAnswer) {
            throw new Error('Invalid response from the server');
        }

        return data;

    } catch (error) {
        console.error('Error fetching question:', error);
        alert('Failed to generate question. Please try again.');
        return null;
    }
}

function showQuestion(q) {
    if (!q) {
        console.error('No question data provided');
        return;
    }
    currentQuestion = q;
    questionText.textContent = q.question;
    answerInput.value = '';
    answerFeedback.style.display = 'none';
    modal.style.display = 'block';
    answerInput.focus();
}

function showFeedback(isCorrect, correctAnswer) {
    answerFeedback.textContent = `Correct answer: ${correctAnswer}`;
    answerFeedback.className = `answer-feedback ${isCorrect ? 'correct' : 'wrong'}`;
    answerFeedback.style.display = 'block';
}

async function submitAnswer() {
    const userAnswer = answerInput.value.trim().toLowerCase();
    if (!userAnswer) return alert('Please enter an answer!');

    const isCorrect = userAnswer === currentQuestion.correctAnswer.toLowerCase();
    showFeedback(isCorrect, currentQuestion.correctAnswer);

    score += isCorrect ? 10 : -5;
    currentStep = Math.max(0, Math.min(stairPositions.length, currentStep + (isCorrect ? 1 : -1)));

    updateManPosition();
    scoreElement.textContent = score;

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (timeLeft > 0) {
        generateQuestion().then(data => showQuestion(data));
    }
}

async function startGame() {
    startBtn.style.display = 'none';
    currentStep = 0;
    score = 0;
    timeLeft = 180;
    timerElement.textContent = timeLeft;
    scoreElement.textContent = score;
    updateManPosition();

    timerId = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerId);
            modal.style.display = 'none';
            alert(`Game Over! Final Score: ${score}`);
        }
    }, 1000);

    const data = await generateQuestion();
    if (data) {
        showQuestion(data);
    }
}

startBtn.addEventListener('click', startGame);
answerInput.addEventListener('keypress', (e) => e.key === 'Enter' && submitAnswer());
