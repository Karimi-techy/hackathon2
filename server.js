const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

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

// Generate flashcards (mock)
app.post('/generate_flashcards', (req, res) => {
  const sessionId = req.headers['session-id'];
  const username = sessions[sessionId];
  if (!username) return res.json({ error: 'Not authenticated' });

  const { notes } = req.body;
  if (!notes) return res.json({ error: 'No notes provided' });

  const sentences = notes.split(/[\.\n]+/).filter(s => s.trim() !== '');
  const flashcards = sentences.map((sentence, idx) => {
    const trimmed = sentence.trim();
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        return {
          question: `What is ${parts[0].trim()}?`,
          answer: parts.slice(1).join(':').trim()
        };
      }
    }
    return {
      question: `Question ${idx + 1}: What is the main idea of this statement?`,
      answer: trimmed
    };
  });

  res.json({ flashcards });
});

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
