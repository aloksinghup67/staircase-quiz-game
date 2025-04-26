const man = document.getElementById('man');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const modal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const answerFeedback = document.getElementById('answerFeedback');
const startBtn = document.getElementById('startBtn');
const categorySelect = document.getElementById('categorySelect');
const categorySelection = document.getElementById('categorySelection');
const restartBtn = document.getElementById('restartBtn');

let currentStep = 0;
let score = 0;
let timeLeft = 120;
let timerId;
let questionSet = [];
let currentQuestionIndex = 0;

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

async function startGame() {
  if (!categorySelect.value) {
    alert('Please select a category before starting the game.');
    return;
  }
  
  categorySelection.style.display = 'none';
  
  startBtn.style.display = 'none';
  currentStep = 0;
  score = 0;
  timeLeft = 120;
  currentQuestionIndex = 0;
  timerElement.textContent = timeLeft;
  scoreElement.textContent = score;
  updateManPosition();

  timerId = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      modal.style.display = 'none';
      categorySelection.style.display = 'block';
      alert(`Game Over! Final Score: ${score}`);
    }
  }, 1000);

  const selectedCategory = categorySelect.value;
  try {
    const response = await fetch('/api/start-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: selectedCategory })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.error}`);
    }
    const data = await response.json();
    if (!data.questions || data.questions.length === 0) {
      throw new Error("No questions received from server");
    }
    questionSet = data.questions;
    showQuestion(questionSet[currentQuestionIndex]);
  } catch (error) {
    console.error('Error starting game:', error);
    alert('Failed to load questions. Please try again.');
    categorySelection.style.display = 'block';
  }
}

function showQuestion(q) {
  if (!q) {
    console.error('No question data provided');
    return;
  }
  questionText.innerHTML = q.question;
  optionsContainer.innerHTML = '';
  q.options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.classList.add('option-btn');
    btn.addEventListener('click', () => handleOptionClick(option));
    optionsContainer.appendChild(btn);
  });
  answerFeedback.style.display = 'none';
  modal.style.display = 'block';
}

function showFeedback(isCorrect, correctAnswer) {
  answerFeedback.textContent = isCorrect ? 'Correct!' : `Wrong! Correct answer: ${correctAnswer}`;
  answerFeedback.className = `answer-feedback ${isCorrect ? 'correct' : 'wrong'}`;
  answerFeedback.style.display = 'block';
}

function showWinningAnimation() {
  man.style.animation = 'celebrate 2s infinite';
  setTimeout(() => {
    man.style.animation = '';
    showGameCompleteModal();
  }, 2000);
}

function showGameCompleteModal() {
  modal.style.display = 'block';
  modal.style.top = '40%';
  modal.style.left= '50%';
  questionText.innerHTML = `Congratulations! You've reached the top!<br>Final Score: ${score}<br>Here's your reward!`;
  optionsContainer.innerHTML = '';
  answerFeedback.style.display = 'none';
  
  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';
  videoContainer.innerHTML = `
    <iframe 
      width="100%" 
      height="315" 
      src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=t_YbfCe15Ew22nYn" 
      title="YouTube video player" 
      frameborder="0" 
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      referrerpolicy="strict-origin-when-cross-origin" 
      allowfullscreen>
    </iframe>
  `;
  optionsContainer.appendChild(videoContainer);
  
  const restartButton = document.createElement('button');
  restartButton.textContent = 'Play Again';
  restartButton.classList.add('option-btn');
  restartButton.addEventListener('click', () => {
    modal.style.display = 'none';
    categorySelection.style.display = 'block';
    startBtn.style.display = 'block';
  });
  optionsContainer.appendChild(restartButton);
}

async function handleOptionClick(selectedOption) {
  Array.from(document.getElementsByClassName('option-btn')).forEach(btn => {
    btn.disabled = true;
  });
  const currentQuestion = questionSet[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion.correctAnswer;
  showFeedback(isCorrect, currentQuestion.correctAnswer);

  score += isCorrect ? 10 : -5;
  currentStep = Math.max(0, Math.min(stairPositions.length, currentStep + (isCorrect ? 1 : -1)));
  updateManPosition();
  scoreElement.textContent = score;

  if (currentStep === stairPositions.length) {
    clearInterval(timerId);
    modal.style.display = 'none';
    showWinningAnimation();
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  currentQuestionIndex++;
  if (currentQuestionIndex < questionSet.length && timeLeft > 0) {
    showQuestion(questionSet[currentQuestionIndex]);
  } else {
    modal.style.display = 'none';
    categorySelection.style.display = 'block';
    alert(`Game Over! Final Score: ${score}`);
  }
}

categorySelect.addEventListener('change', () => {
  console.log('Selected category:', categorySelect.value);
});

startBtn.addEventListener('click', startGame);
