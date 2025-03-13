require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility: Simple shuffle function
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Endpoint to start game and load questions from the selected category
app.post('/api/start-game', async (req, res) => {
  try {
    const categoryCode = req.body.category; // Expected to be a string representing the category code.
    if (!categoryCode) {
      throw new Error('No category provided');
    }
    console.log('Selected category:', categoryCode);
    
    // First try: Request 20 easy multiple-choice questions
    let apiUrl = `https://opentdb.com/api.php?amount=30&category=${categoryCode}&difficulty=easy&type=multiple`;
    let response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();
    
    // If no questions returned, try a fallback (10 questions, no difficulty filter)
    if (!data.results || data.results.length === 0) {
      console.warn("No questions returned for 20 easy questions; trying fallback...");
      apiUrl = `https://opentdb.com/api.php?amount=10&category=${categoryCode}&type=multiple`;
      response = await fetch(apiUrl);
      data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new Error("No questions returned from API even after fallback");
      }
    }
    
    // Process each question: shuffle options (correct + incorrect answers)
    const processedQuestions = data.results.map(questionData => {
      const question = questionData.question;
      const correctAnswer = questionData.correct_answer;
      let options = questionData.incorrect_answers.slice();
      options.push(correctAnswer);
      options = shuffle(options);
      return { question, options, correctAnswer };
    });
    
    res.json({ questions: processedQuestions });
  } catch (error) {
    console.error("Error in /api/start-game:", error);
    res.status(500).json({ error: 'Failed to start game', details: error.message });
  }
});

// Fallback route to serve index.html for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
