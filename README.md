## Where it's live

- https://hackathon2-5bbw.onrender.com



# Budy 2.0  Study & Revision Helper

Budy 2.0 helps students revise notes more effectively. Users paste or type their notes into the app; Budy 2.0 automatically generates flashcards and practice questions, presents them in an interactive study view, and grades answers so students can track progress and focus on weak areas.

## Key features

- Paste or import notes and extract key facts
- Auto-generate flashcards (front/back) from pasted content
- Auto-generate short-answer and multiple-choice practice questions
- Immediate grading with feedback and a strengths/weaknesses summary




## Stack

- Frontend: HTML, CSS, JavaScript (`index.html`, `style.css`, `script.js`)
- Backend: Node.js (`server.js`)
- Optional storage: SQL (schema in `schema.sql`) for persisting cards and progress
- Project config: `package.json`

## Quick start (PowerShell)

```powershell
# Install dependencies
npm install

# Start the server (try npm start first; otherwise fallback to node server.js)
npm start; if ($LASTEXITCODE -ne 0) { node server.js }
```

Open http://localhost:3000 (or the port shown by the server), paste your notes, and start a study session.

## How it works (brief)

1. The frontend accepts pasted text and sends it to the generator.
2. The generator extracts candidate facts and composes flashcards + practice questions.
3. The study UI presents cards/questions and grades answers.
4. Results update a lightweight progress view so users can focus their next sessions.

## Files of interest

- `index.html`, `style.css`, `script.js` — frontend UI and client logic
- `server.js` — server and any API endpoints used for generation or storage
- `schema.sql` — optional database schema
- `package.json` — npm scripts and dependencies

