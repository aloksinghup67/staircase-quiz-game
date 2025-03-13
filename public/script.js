const man = document.getElementById('man');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const modal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const answerFeedback = document.getElementById('answerFeedback');
const startBtn = document.getElementById('startBtn');
const categorySelect = document.getElementById('categorySelect'); // Category selection element
const categorySelection = document.getElementById('categorySelection'); // Container for category selection

let currentStep = 0;
let score = 0;
let timeLeft = 120;
let timerId;
let questionSet = [];          // Array to hold loaded questions
let currentQuestionIndex = 0;  // Tracks which question is being shown

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

// Start game: load 20 questions based on the user-selected category
async function startGame() {
  // Check if a valid category has been selected
  if (!categorySelect.value) {
    alert('Please select a category before starting the game.');
    return;
  }
  
  // Hide the category selection for the duration of the game
  categorySelection.style.display = 'none';
  
  startBtn.style.display = 'none';
  currentStep = 0;
  score = 0;
  timeLeft = 120;
  currentQuestionIndex = 0;
  timerElement.textContent = timeLeft;
  scoreElement.textContent = score;
  updateManPosition();

  // Start the timer
  timerId = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      modal.style.display = 'none';
      // Show the category selection again after game over
      categorySelection.style.display = 'block';
      alert(`Game Over! Final Score: ${score}`);
    }
  }, 1000);

  const selectedCategory = categorySelect.value; // Get selected category code from dropdown
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
    // Show the category selection again if there is an error
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

  await new Promise(resolve => setTimeout(resolve, 1000));

  currentQuestionIndex++;
  if (currentQuestionIndex < questionSet.length && timeLeft > 0) {
    showQuestion(questionSet[currentQuestionIndex]);
  } else {
    modal.style.display = 'none';
    // Show the category selection again for the next game
    categorySelection.style.display = 'block';
    alert(`Game Over! Final Score: ${score}`);
  }
}

categorySelect.addEventListener('change', () => {
  console.log('Selected category:', categorySelect.value);
});

startBtn.addEventListener('click', startGame);
