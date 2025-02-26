app.post('/api/generate-question', async (req, res) => {
    try {
        const categories = ['hard computer science', 'hard reasoning', 'hard general knowledge','hard general science','hard numeric','easy general science','easy computer science'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Generate a ${randomCategory} question with a one-word answer and if the question is numeric then answer should be also be in numbers ex - sum of 2 and 3 then answer 5 not five. And don't repeat questions Format:\nQuestion: ...\nCorrect Answer: ...` }]
                }]
            })
        });

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2)); 

        if (data.error) {
            console.error('API Error:', data.error);
            throw new Error(data.error.message || 'API Error');
        }

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No candidates found in the API response');
        }

        if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            throw new Error('Invalid API response format');
        }

        const questionText = data.candidates[0].content.parts[0].text;
        console.log('Generated Question:', questionText); 

        res.json({ text: questionText });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate question', details: error.message });
    }
});
