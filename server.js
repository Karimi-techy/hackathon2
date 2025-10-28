const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();
console.log('HF Token loaded:', process.env.HUGGINGFACE_API_TOKEN ? 'Yes' : 'No');


const app = express();
const PORT = 3000;

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory stores
let users = []; // {username, email, password}
let sessions = {}; // { sessionId: username }
let flashcardsStore = {}; // { username: [{notes, flashcards}] }

// Helper to generate simple session ID
const generateSessionId = () => Math.random().toString(36).substr(2, 9);

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ error: 'Invalid credentials' });

  const sessionId = generateSessionId();
  sessions[sessionId] = username;

  res.json({ username: user.username, sessionId });
});

// Register
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (users.find(u => u.username === username)) return res.json({ error: 'Username already exists' });

  users.push({ username, email, password });
  const sessionId = generateSessionId();
  sessions[sessionId] = username;

  res.json({ username, sessionId });
});

// Check auth
app.get('/check_auth', (req, res) => {
  const sessionId = req.headers['session-id'];
  const username = sessions[sessionId];
  if (username) res.json({ authenticated: true, username });
  else res.json({ authenticated: false });
});

// Logout
app.post('/logout', (req, res) => {
  const sessionId = req.headers['session-id'];
  if (sessions[sessionId]) delete sessions[sessionId];
  res.json({ success: true });
});

// Generate flashcards using Hugging Face AI
app.post('/generate_flashcards', async (req, res) => {
  const sessionId = req.headers['session-id'];
  const username = sessions[sessionId];
  if (!username) return res.json({ error: 'Not authenticated' });

  const { notes } = req.body;
  if (!notes) return res.json({ error: 'No notes provided' });

  try {
    // Create a prompt for the AI to generate flashcards
    const prompt = `You are a helpful study assistant. Given the following study notes, create 5-8 high-quality flashcards. 
Each flashcard should have a clear question and a concise answer.

Format your response EXACTLY like this (no extra text):
Q: [Question 1]
A: [Answer 1]

Q: [Question 2]
A: [Answer 2]

Study Notes:
${notes}

Generate flashcards:`;

    // Use Hugging Face text generation
    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false
      }
    });

    // Parse the AI response to extract flashcards
    const generatedText = response.generated_text;
    const flashcards = parseFlashcardsFromText(generatedText);

    // Fallback: if AI parsing fails, use simple algorithm
    if (flashcards.length === 0) {
      console.log('AI parsing failed, using fallback');
      const fallbackCards = generateFallbackFlashcards(notes);
      return res.json({ flashcards: fallbackCards });
    }

    res.json({ flashcards });

  } catch (error) {
    console.error('Hugging Face API error:', error);
    
    // Fallback to simple algorithm if API fails
    const fallbackCards = generateFallbackFlashcards(notes);
    res.json({ flashcards: fallbackCards });
  }
});

// Helper function to parse flashcards from AI text
function parseFlashcardsFromText(text) {
  const flashcards = [];
  
  // Split by Q: to find question blocks
  const blocks = text.split(/Q:/i).filter(b => b.trim());
  
  blocks.forEach(block => {
    // Split by A: to separate question and answer
    const parts = block.split(/A:/i);
    if (parts.length >= 2) {
      const question = parts[0].trim();
      const answer = parts[1].trim().split(/Q:/i)[0].trim(); // Get answer before next Q
      
      if (question && answer) {
        flashcards.push({
          question: question,
          answer: answer
        });
      }
    }
  });
  
  return flashcards;
}

// Fallback flashcard generator (simple algorithm)
function generateFallbackFlashcards(notes) {
  const sentences = notes
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const flashcards = [];

  sentences.forEach((sentence) => {
    // Look for definitions
    if (sentence.match(/\b(is|are|means|refers to|defined as)\b/i)) {
      const parts = sentence.split(/\b(is|are|means|refers to|defined as)\b/i);
      if (parts.length >= 3) {
        const subject = parts[0].trim();
        const definition = parts.slice(2).join('').trim();
        flashcards.push({
          question: `What is ${subject}?`,
          answer: definition
        });
        return;
      }
    }

    // Look for key-value pairs with colons
    if (sentence.includes(':')) {
      const parts = sentence.split(':');
      if (parts.length >= 2) {
        flashcards.push({
          question: `What is ${parts[0].trim()}?`,
          answer: parts.slice(1).join(':').trim()
        });
        return;
      }
    }

    // General important facts
    if (sentence.length > 30 && flashcards.length < 8) {
      const words = sentence.split(' ');
      const topic = words.slice(0, 5).join(' ');
      flashcards.push({
        question: `Explain: ${topic}`,
        answer: sentence
      });
    }
  });

  // Ensure at least one flashcard
  if (flashcards.length === 0) {
    flashcards.push({
      question: 'What are the main points from these notes?',
      answer: notes.substring(0, 200) + (notes.length > 200 ? '...' : '')
    });
  }

  return flashcards.slice(0, 8); // Return max 8 cards
}

// Save flashcards
app.post('/save_flashcards', (req, res) => {
  const sessionId = req.headers['session-id'];
  const username = sessions[sessionId];
  if (!username) return res.json({ error: 'Not authenticated' });

  const { flashcards, notes } = req.body;
  if (!flashcardsStore[username]) flashcardsStore[username] = [];
  flashcardsStore[username].push({ notes, flashcards });

  res.json({ success: true });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));