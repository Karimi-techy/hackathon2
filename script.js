// Global variables
let currentFlashcards = [];
let currentNotes = "";
let sessionId = null;

// Quiz variables
let quizCards = [];
let currentQuizIndex = 0;
let quizScore = 0;
let correctAnswers = [];
let incorrectAnswers = [];

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
  document.getElementById('quizBtn').style.display = 'none';
});

// Generate flashcards
document.getElementById('generateBtn').addEventListener('click', async () => {
  const notes = document.getElementById('notes').value.trim();
  if (!notes) { 
    alert('Please paste your study notes first!'); 
    return; 
  }

  currentNotes = notes;
  const btn = document.getElementById('generateBtn');
  const originalText = btn.textContent;
  
  btn.innerHTML = 'Generating<span class="spinner"></span>';
  btn.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/generate_flashcards', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'session-id': sessionId 
      },
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
    
    currentFlashcards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');
      cardElement.style.animationDelay = `${index * 0.1}s`;
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

    document.getElementById('saveBtn').style.display = 'block';
    document.getElementById('quizBtn').style.display = 'block';

  } catch (error) {
    alert('Error generating flashcards: ' + error.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// Save flashcards
document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!currentFlashcards.length) { 
    alert('No flashcards to save!'); 
    return; 
  }
  
  const btn = document.getElementById('saveBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;
  
  try {
    const response = await fetch('http://localhost:3000/save_flashcards', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'session-id': sessionId 
      },
      body: JSON.stringify({ flashcards: currentFlashcards, notes: currentNotes })
    });
    const data = await response.json();
    if (data.success) {
      alert('✅ Flashcards saved successfully!');
    } else {
      alert('❌ Save failed!');
    }
  } catch (error) {
    alert('Save failed: ' + error.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// Quiz Mode Functions
document.getElementById('quizBtn').addEventListener('click', () => {
  if (currentFlashcards.length === 0) {
    alert('No flashcards to quiz!');
    return;
  }
  startQuiz();
});

function startQuiz() {
  // Reset quiz state
  quizCards = [...currentFlashcards].sort(() => Math.random() - 0.5); // Shuffle
  currentQuizIndex = 0;
  quizScore = 0;
  correctAnswers = [];
  incorrectAnswers = [];
  
  // Update UI
  document.getElementById('total-questions').textContent = quizCards.length;
  document.getElementById('quiz-score').textContent = quizScore;
  
  // Show quiz page and load first question
  showPage('quiz-page');
  loadQuizQuestion();
}

function loadQuizQuestion() {
  if (currentQuizIndex >= quizCards.length) {
    showQuizResults();
    return;
  }
  
  const card = quizCards[currentQuizIndex];
  
  // Update question number
  document.getElementById('current-question-num').textContent = currentQuizIndex + 1;
  
  // Show question
  document.getElementById('quiz-question-text').textContent = card.question;
  
  // Hide answer section and show answer button
  document.getElementById('quiz-answer-section').style.display = 'none';
  document.getElementById('show-answer-btn').style.display = 'block';
  
  // Update progress bar
  const progress = ((currentQuizIndex) / quizCards.length) * 100;
  document.getElementById('progress-fill').style.width = progress + '%';
}

document.getElementById('show-answer-btn').addEventListener('click', () => {
  const card = quizCards[currentQuizIndex];
  
  // Show answer
  document.getElementById('quiz-answer-text').textContent = card.answer;
  document.getElementById('quiz-answer-section').style.display = 'block';
  document.getElementById('show-answer-btn').style.display = 'none';
});

document.getElementById('got-it-btn').addEventListener('click', () => {
  quizScore++;
  correctAnswers.push(quizCards[currentQuizIndex]);
  document.getElementById('quiz-score').textContent = quizScore;
  currentQuizIndex++;
  loadQuizQuestion();
});

document.getElementById('missed-it-btn').addEventListener('click', () => {
  incorrectAnswers.push(quizCards[currentQuizIndex]);
  currentQuizIndex++;
  loadQuizQuestion();
});

document.getElementById('exit-quiz-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
    showPage('app-page');
  }
});

function showQuizResults() {
  const totalQuestions = quizCards.length;
  const percentage = Math.round((quizScore / totalQuestions) * 100);
  
  // Update results
  document.getElementById('final-score').textContent = percentage + '%';
  document.getElementById('correct-count').textContent = quizScore;
  document.getElementById('incorrect-count').textContent = totalQuestions - quizScore;
  document.getElementById('total-count').textContent = totalQuestions;
  
  // Show/hide review button based on incorrect answers
  if (incorrectAnswers.length > 0) {
    document.getElementById('review-missed-btn').style.display = 'inline-block';
  } else {
    document.getElementById('review-missed-btn').style.display = 'none';
  }
  
  showPage('quiz-results-page');
}

document.getElementById('retake-quiz-btn').addEventListener('click', () => {
  startQuiz();
});

document.getElementById('review-missed-btn').addEventListener('click', () => {
  // Show missed cards
  const container = document.getElementById('missed-cards-container');
  container.innerHTML = '';
  
  incorrectAnswers.forEach((card, index) => {
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
  
  document.getElementById('missed-cards-section').style.display = 'block';
});

document.getElementById('back-to-app-btn').addEventListener('click', () => {
  document.getElementById('missed-cards-section').style.display = 'none';
  showPage('app-page');
});