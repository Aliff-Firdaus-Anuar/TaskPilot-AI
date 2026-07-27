# TaskPilot AI

An AI-powered project task manager built with vanilla JavaScript, **Supabase** (PostgreSQL), and the Google Gemini API.

## Features

- **User Authentication** — Register/Login via Supabase Auth with session persistence
- **Project Management** — Create, view, and delete projects with color coding
- **Kanban Task Board** — Drag-and-drop tasks across To Do / In Progress / Done columns
- **AI Task Breakdown** — Describe a high-level goal; the Gemini API generates actionable subtasks
- **AI-to-Project Integration** — One-click add AI-generated subtasks to any project with automatic AI badge
- **Dashboard Analytics** — Real-time stats: task completion rate, priority distribution, recent projects
- **Fully Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA) |
| Backend | Supabase (Auth + PostgreSQL) |
| AI | Google Gemini 2.0 Flash API |
| RLS | Row-Level Security (per-user data isolation) |
| Deployment | Netlify |
| Testing | Manual functional + non-functional (35 test cases) |

## Setup

1. **Clone the repo**
   ```
   git clone https://github.com/YOUR_USERNAME/taskpilot-ai.git
   cd taskpilot-ai
   ```

2. **Create a Supabase project**
   - Go to [Supabase](https://supabase.com) and create a project
   - Copy your project URL and `anon` key from Settings → API

3. **Run the database schema**
   - Open Supabase SQL Editor
   - Paste and run the contents of `sql/schema.sql`

4. **Configure Supabase**
   - Open `js/config/supabase.js`
   - Replace `YOUR_PROJECT.supabase.co` and `YOUR_ANON_KEY` with your values

5. **Disable email confirmation** (for easier testing)
   - Go to Authentication → Settings → Disable "Confirm email" toggle

6. **Get a Gemini API key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create an API key
   - Open `js/modules/ai.js`
   - Replace `YOUR_GEMINI_API_KEY` with your key

7. **Serve locally**
   ```
   npx serve .
   ```
   Or use VS Code Live Server extension.

## Deployment

Deploy to Netlify:
1. Push to GitHub
2. Connect repo to Netlify
3. Set publish directory to `.`
4. Deploy

## Testing

See `tests/functional-tests.md` for 35 test cases covering:
- Authentication (7 tests)
- Project CRUD (5 tests)
- Task CRUD + Kanban (8 tests)
- AI Integration (5 tests)
- Dashboard (5 tests)
- Non-Functional (5 tests)

## Resume Entry

> **TaskPilot AI** — Solo-developed AI-powered project task manager using vanilla JavaScript, **Supabase** (PostgreSQL), and Google Gemini API. Designed relational database schema with Row-Level Security. Features include drag-and-drop Kanban boards, AI-generated task breakdown with one-click project integration, real-time dashboard analytics, and responsive design. Executed 35 comprehensive functional and non-functional test cases with 100% pass rate. Deployed on Netlify.
