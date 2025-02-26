require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route to generate a question using the new API
app.post('/api/generate-question', async (req, res) => {
    try {
        console.log('Generating question...');
        const categories = [
            'hard computer science', 'hard reasoning', 'hard general knowledge',
            'hard general science', 'hard numeric', 'easy general science', 'easy computer science'
        ];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        console.log('Selected category:', randomCategory);

        const userInput = `Generate a ${randomCategory} question with a one-word answer. If the question is numeric, the answer should be in numbers (e.g., "sum of 2 and 3" should answer "5" not "five"). Format:\nQuestion: ...\nCorrect Answer: ...`;

        const payload = {
            messages: [
                {
                    role: 'user',
                    content: userInput
                }
            ],
            web_access: false
        };

        const response = await fetch('https://chatgpt-42.p.rapidapi.com/o3mini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY // Ensure this is set in your .env file
            },
            body: JSON.stringify(payload)
        });

        console.log('API Response Status:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API HTTP Error:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2)); // Log the full response

        // Adjust parsing logic based on the actual API response structure
        if (!data.result) {
            throw new Error('Invalid API response format: Missing "result" field');
        }

        const generatedText = data.result;
        console.log('Generated Text:', generatedText);

        // Extract question and answer
        const questionMatch = generatedText.match(/Question:\s*(.*?)\s*Correct Answer:/i);
        const answerMatch = generatedText.match(/Correct Answer:\s*(.*)/i);

        if (!questionMatch || !answerMatch) {
            throw new Error('Invalid question or answer format in generated text');
        }

        const question = questionMatch[1].trim();
        const correctAnswer = answerMatch[1].trim();

        if (!question || !correctAnswer) {
            throw new Error('Invalid question or answer format');
        }

        res.json({ question, correctAnswer });

    } catch (error) {
        console.error('Error in /api/generate-question:', error);
        res.status(500).json({ error: 'Failed to generate question', details: error.message });
    }
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
