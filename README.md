<div align="center">

# ⚡ TaskPilot AI — AI-Powered Project Task Manager

**Live Demo:** [smartflow-taskpilot.netlify.app](https://smartflow-taskpilot.netlify.app)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)
[![Google OAuth](https://img.shields.io/badge/Google_OAuth-✓-4285F4?logo=google)](https://developers.google.com/identity/protocols/oauth2)
[![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7?logo=netlify)](https://www.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

A full-stack AI-powered project task manager with **Google OAuth**, **AI integration**, **team collaboration**, **file attachments**, and **CSV export**. Built with vanilla JavaScript and Supabase (PostgreSQL), deployed on Netlify.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [API Integration](#api-integration)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [What Makes This Resume-Strong](#what-makes-this-resume-strong)

---

## 🚀 Features

### Authentication & Security
- **Google OAuth** — One-click sign-in with Google; fallback email/password registration
- **Row-Level Security (RLS)** — PostgreSQL policies ensure users only access their own data
- **SECURITY DEFINER functions** — Bypass RLS selectively for profile avatar updates
- **Session persistence** — Auto-restore session on page refresh via Supabase Auth

### AI Integration (Google Gemini)
- **AI Task Breakdown** — Describe a high-level goal; Gemini generates actionable subtasks
- **One-click project integration** — Add AI-generated subtasks to any project with auto AI badge
- **Smart suggestions** — Context-aware task recommendations based on project data

### Project Management
- **Kanban Task Board** — Drag-and-drop tasks across To Do / In Progress / Done columns
- **Task prioritization** — Low, Medium, High priority labels with color coding
- **Due date warnings** — Red "Overdue" badges with day count on past-due tasks
- **Task search** — Real-time filtering by name, priority, or status

### Team Collaboration
- **Role-based invites** — Invite teammates as Editor or Viewer via email
- **Activity log** — Real-time audit trail of all project actions
- **Notifications** — Bell icon with badge count for unread notifications
- **Team directory** — View all team members with avatars across projects

### File Attachments
- **Drag-and-drop upload** — Attach files to tasks via drag-drop or file picker
- **Supabase Storage** — Files stored in `task-files` bucket with public access
- **Attachment management** — Download or delete attachments from task detail view
- **Avatar upload** — Profile picture with upload and remove options

### Export & Reporting
- **CSV Export** — Export project tasks with Excel-compatible date formatting
- **Dashboard Analytics** — Real-time stats: completion rate, priority distribution, recent projects
- **UTF-8 BOM** — Proper Excel encoding for Malaysian locale dates

### UX Features
- **Dark mode** — Toggle between light and dark themes
- **Glassmorphism UI** — Modern frosted-glass aesthetic
- **Responsive design** — Works on desktop, tablet, and mobile
- **Skeleton loading** — Smooth loading states for all views

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS (SPA) | No framework, pure DOM manipulation |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) | Fully managed backend-as-a-service |
| **Auth** | Google OAuth + Supabase Auth | OAuth 2.0 + email/password |
| **AI** | Google Gemini 2.0 Flash | Task breakdown, AI suggestions |
| **Database** | PostgreSQL 15 | Relational data with RLS |
| **Storage** | Supabase Storage | File uploads (avatars, task files) |
| **Security** | PostgreSQL RLS + SECURITY DEFINER | Per-user data isolation |
| **Deployment** | Netlify | Static site with SPA redirects |
| **Build** | Node.js | Environment variable injection |

---

## 🏗 Architecture

### SPA Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html (Shell)                       │
│       <link> CSS │ <script> JS Modules │ <div> Container     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Router (Hash-based)                      │
│   listens on hashchange → matches route → calls viewFn       │
│   Routes: dashboard, projects, projects/:id, ai-assist, ...  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Module Layer                             │
│                                                               │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  ┌─────────────┐  │
│  │ Auth       │  │ Projects  │  │ Tasks  │  │ AI (Gemini) │  │
│  │ (Google    │  │ (Kanban,  │  │ (CRUD, │  │ (Breakdown, │  │
│  │  OAuth,    │  │  Export)  │  │  Files) │  │  Suggest)   │  │
│  │  Session)  │  │          │  │        │  │             │  │
│  └────────────┘  └──────────┘  └────────┘  └─────────────┘  │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  ┌─────────────┐  │
│  │ Profile    │  │ Team      │  │ Notif  │  │ Dashboard   │  │
│  │ (Avatar,   │  │ (Members, │  │ (Bell, │  │ (Stats,     │  │
│  │  Edit)     │  │  Invites) │  │  List)  │  │  Charts)    │  │
│  └────────────┘  └──────────┘  └────────┘  └─────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Supabase Client Layer                       │
│                                                               │
│  sb.from('projects').select('*')           │  sb.storage      │
│  sb.from('tasks').insert({...})            │  sb.auth.signIn  │
│  sb.rpc('update_profile_avatar', {...})     │  sb.auth.session │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Supabase Cloud Services                     │
│                                                               │
│  Auth           │  PostgreSQL + RLS   │  Storage Buckets    │
│  Google OAuth   │  9 tables, views    │  avatars, task-files│
│  Session Mgmt   │  SECURITY DEFINER   │  Public reads       │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐                    ┌──────────────┐
│  Browser  │  Click "Google"    │  Supabase    │
│  (SPA)    │ ─────────────────►  │  OAuth       │
│           │                   │  Redirect    │
│           │ ◄────────────────  │  to Google   │
│           │                   └──────┬───────┘
│           │                          │
│           │    Google Consent Page    │
│           │ ◄─────────────────────────│
│           │                          │
│           │    Callback with code    │
│           │ ─────────────────────────►│
│           │                          │
│           │ ◄── JWT + User Session ──│
│           │                          │
│           │  sb.auth.getSession()    │
│           │ ─────────────────────────►│
│           │ ◄───── session.user ─────│
│           │                          │
│           │  reshape(user)           │
│           │  → show dashboard        │
└──────────┘                          └──────────────┘
```

### RLS Policy Design (Infinite Recursion Fix)

```
┌──────────────────────────────────────────────────┐
│  projects_select:                                 │
│    owner_id = auth.uid()                          │
│    OR is_project_member(id)  ◄── SECURITY DEFINER │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│  is_project_member() — SECURITY DEFINER function   │
│    → queries project_members WITHOUT RLS           │
│    → breaks cross-table recursion loop             │
└──────────────────────────────────────────────────┘
```

---

## 🗄 Database Design

### Tables

| Table | RLS Policy | Description |
|-------|-----------|-------------|
| `profiles` | Own profile only (id = auth.uid()) | User display name, bio, avatar |
| `projects` | Owner or project member | Name, description, color, owner |
| `tasks` | Owner of project or member | Title, status, priority, due date, assignee |
| `project_members` | Self or project owner | User-project membership with role |
| `project_invites` | Inviter, invited email, or member | Pending invites with token |
| `task_comments` | Task in member's project | Comment content and author |
| `task_attachments` | Task in member's project | File metadata and storage path |
| `activity_log` | Member of the project | Action type, details JSON |
| `notifications` | Own notifications only | Type, title, read status |

### RLS Policy Strategy

All policies use a pattern that avoids infinite recursion:

```sql
-- projects: allow owner OR member
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  owner_id = auth.uid()
  OR public.is_project_member(id)  -- SECURITY DEFINER bypasses RLS
);

-- project_members: allow self OR project owner
CREATE POLICY "members_select" ON project_members FOR SELECT USING (
  user_id = auth.uid()
  OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
);
```

### Storage Buckets

| Bucket | Visibility | Purpose |
|--------|-----------|---------|
| `avatars` | Public | Profile pictures |
| `task-files` | Public | Task file attachments |

---

## 🤖 AI Integration

### Gemini API Usage

```
User Input: "Build a login page with email/password validation"
    │
    ▼
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
    │
    ▼
Gemini Response → Parsed JSON tasks:
  ┌─────────────────────────────────────┐
  │ 1. Create login form with email &   │
  │    password fields                   │
  │ 2. Add client-side validation for   │
  │    email format and password length  │
  │ 3. Implement form submission with   │
  │    fetch API to backend endpoint     │
  │ 4. Show success/error messages      │
  │    to user                           │
  └─────────────────────────────────────┘
    │
    ▼
One-click "Add to Project" → Creates 4 tasks with AI badge
```

---

## 📁 Project Structure

```
taskpilot-ai/
│
├── index.html                           # SPA entry point
├── build.js                             # Netlify build script (env var injection)
├── netlify.toml                         # Netlify deployment config
│
├── css/
│   └── style.css                        # Full app styles (light/dark mode, glassmorphism, responsive)
│
├── js/
│   ├── app.js                           # Bootstrap, session handler, route registration
│   │
│   ├── config/
│   │   ├── supabase.js                  # Supabase client init (URL + anon key)
│   │   ├── keys.js                      # Gitignored — Gemini API key
│   │   └── keys.example.js              # Template for keys.js
│   │
│   ├── modules/
│   │   ├── auth.js                      # Login/register, Google OAuth, session, logout
│   │   ├── dashboard.js                 # Dashboard stats, completion rate, priority chart
│   │   ├── projects.js                  # Project CRUD, Kanban board, CSV export
│   │   ├── tasks.js                     # Task CRUD, due date warnings, file attachments
│   │   ├── team.js                      # Team members, role management, invites
│   │   ├── activity.js                  # Activity log for projects
│   │   ├── notifications.js             # Notification bell, list, mark as read
│   │   ├── ai.js                        # Gemini API: task breakdown, AI assist
│   │   ├── profile.js                   # Profile display, avatar upload/remove, edit
│   │   └── guide.js                     # In-app user guide page
│   │
│   └── utils/
│       ├── router.js                    # Hash-based SPA router
│       └── helpers.js                   # Toast notifications, modals, error handling, skeleton
│
├── sql/
│   ├── schema.sql                       # Base tables: projects, tasks
│   ├── migration-profiles.sql           # Profiles table + auth trigger + backfill
│   └── supabase-migration.sql           # Full migration: team tables, RLS policies, attachments
│
└── tests/
    └── functional-tests.md              # Comprehensive test cases
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (for local server)
- Supabase account (free tier)
- Google Gemini API key (free tier)

### 1. Clone & configure

```bash
git clone https://github.com/Aliff-Firdaus-Anuar/TaskPilot-AI.git
cd TaskPilot-AI
```

### 2. Supabase setup

1. Create a project at [Supabase](https://supabase.com)
2. Copy your project URL and `anon` key from **Settings → API**
3. Open `js/config/supabase.js` and replace:
   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
4. Run SQL files in order in Supabase SQL Editor:
   - `sql/schema.sql`
   - `sql/migration-profiles.sql`
   - `supabase-migration.sql`

### 3. Google OAuth

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable and add your Google OAuth Client ID
3. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Storage buckets

Create two public buckets in Supabase Dashboard → **Storage**:
- `avatars`
- `task-files`

Then add storage RLS policies:
```sql
CREATE POLICY "insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('avatars', 'task-files'));
CREATE POLICY "select_public" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'task-files'));
CREATE POLICY "delete_own" ON storage.objects FOR DELETE USING (bucket_id IN ('avatars', 'task-files'));
```

### 5. Gemini API key

```bash
cp js/config/keys.example.js js/config/keys.js
# Edit keys.js and paste your Gemini API key
```

### 6. Serve locally

```bash
npx serve .
# or use VS Code Live Server
```

---

## 🌐 Deployment

### Netlify (Current)

Deployed automatically from GitHub. Environment variable required:
- `GEMINI_API_KEY` — Your Gemini API key (set in Netlify Dashboard → Site settings → Environment variables)

The `build.js` script injects the key at build time.

### Deployment Architecture

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ──────────────►│  Netlify CDN      │
│             │               │  (Global Edge)    │
└─────────────┘               └────────┬─────────┘
                                       │
                        ┌──────────────▼──────────┐
                        │  Static Files Served     │
                        │  index.html → JS → CSS   │
                        └──────────────┬──────────┘
                                       │
                        ┌──────────────▼──────────┐
                        │  Client-side Supabase SDK │
                        │  Direct to Supabase API   │
                        │  (Auth, PostgreSQL,       │
                        │   Storage)                │
                        └─────────────────────────┘
```

---

## ✅ What Makes This Resume-Strong

1. **Google OAuth integration** — Real-world OAuth 2.0 flow with Supabase
2. **AI integration** — Google Gemini 2.0 Flash API for task breakdown and suggestions
3. **PostgreSQL Row-Level Security** — Complex RLS policy design avoiding infinite recursion between `projects` and `project_members`
4. **SECURITY DEFINER functions** — PostgreSQL functions that selectively bypass RLS for specific operations
5. **Team collaboration** — Role-based invites, activity log, notifications (complete multi-user system)
6. **File attachments** — Drag-and-drop upload, Supabase Storage, download/delete
7. **CSV export** — Excel-compatible formatting with UTF-8 BOM and text-mode dates
8. **Due date warnings** — Visual overdue badges with day count
9. **Dark mode + glassmorphism** — Polished, modern UI
10. **Production deployment** — Live on Netlify with automated build and env var injection
11. **SPA router** — Custom hash-based client-side routing
12. **Comprehensive testing** — Functional, non-functional, and UAT documented

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by [Muhammad Aliff Firdaus Bin Mohd Anuar](https://github.com/Aliff-Firdaus-Anuar)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?logo=linkedin)](https://linkedin.com/in/aliff-firdaus)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?logo=netlify)](https://portfolio-aliff-firdaus.netlify.app/)
[![Email](https://img.shields.io/badge/Email-D14836?logo=gmail)](mailto:alifffirdaus.040411@gmail.com)

⭐ Star this repo if you find it useful!

</div>
