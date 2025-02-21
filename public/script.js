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
let timeLeft = 120;
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
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.text) {
            throw new Error('Invalid response from the server');
        }

        return data;
    } catch (error) {
        console.error('Error fetching question:', error);
        return null;
    }
}

function parseQuestion(text) {
    try {
        if (!text.includes('Question: ') && !text.includes('Correct Answer: ')) {
            throw new Error('Invalid question format');
        }

        const question = text.split('Question: ')[1].split('Correct Answer: ')[0].trim();
        const correctAnswer = text.split('Correct Answer: ')[1].trim().toLowerCase();

        if (!question || !correctAnswer) {
            throw new Error('Invalid question or answer');
        }

        return { question, correctAnswer };
    } catch (error) {
        console.error('Error parsing question:', error);
        return { question: 'Invalid question', correctAnswer: '' };
    }
}

function showQuestion(q) {
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

    const isCorrect = userAnswer === currentQuestion.correctAnswer;
    showFeedback(isCorrect, currentQuestion.correctAnswer);

    score += isCorrect ? 10 : -5;
    currentStep = Math.max(0, Math.min(stairPositions.length, currentStep + (isCorrect ? 1 : -1)));
    
    updateManPosition();
    scoreElement.textContent = score;

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (timeLeft > 0) {
        generateQuestion().then(data => showQuestion(parseQuestion(data.text)));
    }
}

function startGame() {
    startBtn.style.display = 'none';
    currentStep = 0;
    score = 0;
    timeLeft = 120;
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

    generateQuestion().then(data => showQuestion(parseQuestion(data.text)));
}

startBtn.addEventListener('click', startGame);
answerInput.addEventListener('keypress', (e) => e.key === 'Enter' && submitAnswer());

let activeSkies = 0;
const maxSkies = 5;
const animationDuration = 20000; // 20 seconds

function createSky() {
    if (activeSkies >= maxSkies) return;

    const sky = document.createElement('div');
    sky.className = 'sky';

    // Set a random vertical position within the viewport
    const randomStartY = Math.random() * (window.innerHeight - 130); // Avoid overflowing past screen

    sky.style.top = `${randomStartY}px`; // Set random vertical position
    sky.style.position = "fixed"; // Ensure it's positioned correctly
    sky.style.right = "-1200px"; // Start off-screen

    document.body.appendChild(sky);
    activeSkies++;

    console.log("Sky created at:", sky.style.top); // Debugging

    sky.addEventListener('animationend', () => {
        sky.remove();
        activeSkies--;
    });
}

// Start the animation loop
setInterval(createSky, animationDuration / maxSkies);

// Initial skies
createSky();
setTimeout(createSky, animationDuration / maxSkies);
setTimeout(createSky, (animationDuration / maxSkies) * 2);
