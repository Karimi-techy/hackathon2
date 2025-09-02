// Global variables
let currentFlashcards = [];
let currentNotes = "";
let sessionId = null;

// Page management
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// Login using API
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
    } else {
      sessionId = data.sessionId;
      showPage('app-page');
      document.getElementById('current-user').textContent = data.username;
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
    } else {
      sessionId = data.sessionId;
      showPage('app-page');
      document.getElementById('current-user').textContent = data.username;
    }
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
});

// Page navigation
document.getElementById('get-started-btn').addEventListener('click', () => showPage('login-page'));
document.getElementById('back-to-landing').addEventListener('click', () => showPage('landing-page'));
document.getElementById('back-to-login').addEventListener('click', () => showPage('login-page'));
document.getElementById('register-link').addEventListener('click', (e) => { e.preventDefault(); showPage('register-page'); });
document.getElementById('login-link').addEventListener('click', (e) => { e.preventDefault(); showPage('login-page'); });

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch('http://localhost:3000/logout', {
      method: 'POST',
      headers: { 'session-id': sessionId }
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  sessionId = null;
  showPage('landing-page');
  document.getElementById('current-user').textContent = '';
  currentFlashcards = [];
  currentNotes = '';
  document.getElementById('notes').value = '';
  document.getElementById('flashcards').innerHTML = '';
  document.getElementById('saveBtn').style.display = 'none';
});

// Generate flashcards
document.getElementById('generateBtn').addEventListener('click', async () => {
  const notes = document.getElementById('notes').value.trim();
  if (!notes) { alert('Please paste your study notes first!'); return; }

  currentNotes = notes;

  document.getElementById('generateBtn').textContent = 'Generating...';
  document.getElementById('generateBtn').disabled = true;

  try {
    const response = await fetch('http://127.0.0.1:5000/generate_flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });

    const data = await response.json();

    if (data.error) {
      alert('Error: ' + data.error);
      return;
    }

    currentFlashcards = data.flashcards;

    const container = document.getElementById('flashcards');
    container.innerHTML = '';
    currentFlashcards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');
      cardElement.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <h3>Question</h3>
            <p>${card.question}</p>
          </div>
          <div class="card-back">
            <h3>Answer</h3>
            <p>${card.answer}</p>
          </div>
        </div>
      `;
      cardElement.addEventListener('click', () => cardElement.classList.toggle('flipped'));
      container.appendChild(cardElement);
    });

    document.getElementById('saveBtn').style.display = 'inline-block';

  } catch (error) {
    alert('Error generating flashcards: ' + error.message);
  } finally {
    document.getElementById('generateBtn').textContent = 'Generate Flashcards';
    document.getElementById('generateBtn').disabled = false;
  }
});


// Save flashcards
document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!currentFlashcards.length) { alert('No flashcards to save!'); return; }
  try {
    const response = await fetch('http://localhost:3000/save_flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'session-id': sessionId },
      body: JSON.stringify({ flashcards: currentFlashcards, notes: currentNotes })
    });
    const data = await response.json();
    if (data.success) {
      alert('Flashcards saved!');
    } else {
      alert('Save failed!');
    }
  } catch (error) {
    alert('Save failed: ' + error.message);
  }
});