# TaskPilot AI

**AI-powered project task manager** with team collaboration, built with vanilla JavaScript, **Supabase** (PostgreSQL + Auth + Storage), and the **Google Gemini API**.

> Deployed live: [smartflow-taskpilot.netlify.app](https://smartflow-taskpilot.netlify.app)

---

## Features

### Authentication & Security
- **Google OAuth** — One-click sign-in with Google, plus email/password registration
- **Row-Level Security** — Per-user data isolation via PostgreSQL RLS policies
- **Session persistence** — Auto-restore session on page refresh

### Project Management
- **Kanban Task Board** — Drag-and-drop tasks across To Do / In Progress / Done columns
- **Task prioritization** — Low, Medium, High priority labels with color coding
- **Due date warnings** — Red "Overdue" badges with day count on past-due tasks
- **Task search** — Real-time search by name, priority, or status

### AI Integration (Google Gemini)
- **AI Task Breakdown** — Describe a high-level goal; Gemini generates actionable subtasks
- **One-click integration** — Add AI-generated subtasks to any project with automatic AI badge
- **AI Assist** — Smart suggestions and automated project insights

### Team Collaboration
- **Role-based invites** — Invite teammates as Editor or Viewer via email
- **Activity log** — Real-time audit trail of all project actions
- **Notifications** — Bell icon with badge count for unread notifications
- **Team directory** — View all team members with avatars across projects

### File Attachments
- **Drag-and-drop upload** — Attach files to tasks via drag-drop or file picker
- **Supabase Storage** — Files stored in `task-files` bucket with public access
- **Attachment list** — Download or delete attachments from task detail view
- **Avatar upload** — Profile picture upload with remove option

### Export & Reporting
- **CSV Export** — Export project tasks to CSV with Excel-compatible formatting
  - Handles date formatting (text mode) to prevent "###" display issues
  - UTF-8 BOM for proper Excel encoding
- **Dashboard Analytics** — Real-time stats: task completion rate, priority distribution, recent projects

### UX
- **Dark mode** — Toggle between light and dark themes
- **Responsive design** — Works on desktop, tablet, and mobile
- **Glassmorphism UI** — Modern frosted-glass aesthetic
- **Skeleton loading** — Smooth loading states for all views

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA Router) |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| AI | Google Gemini 2.0 Flash API |
| Auth | Google OAuth + Supabase Auth (email/password) |
| Storage | Supabase Storage (avatars, task-files) |
| Security | Row-Level Security (RLS), PostgreSQL SECURITY DEFINER |
| Deployment | Netlify (static site) |
| Testing | Manual functional + UAT |

---

## Database Schema

The project uses PostgreSQL on Supabase with the following tables:

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | User profiles linked to `auth.users` | Own profile only |
| `projects` | Project metadata (name, color, owner) | Owner + members |
| `tasks` | Task details with status, priority, due date | Project-based access |
| `project_members` | Role-based team membership | Self + owner |
| `project_invites` | Pending team invitations | Invited user + owner |
| `task_comments` | Comments on tasks | Project-based access |
| `task_attachments` | File metadata linked to storage | Project-based access |
| `activity_log` | Audit trail for project actions | Project-based access |
| `notifications` | User-specific notifications | Own notifications only |

Full schema: `sql/schema.sql`, `sql/migration-profiles.sql`, `supabase-migration.sql`

---

## Setup

### Prerequisites
- Node.js (for local dev server)
- Supabase project (free tier)
- Google Gemini API key (free tier)

### 1. Clone & configure
```bash
git clone https://github.com/Aliff-Firdaus-Anuar/TaskPilot-AI.git
cd TaskPilot-AI
```

### 2. Supabase setup
1. Create a project at [Supabase](https://supabase.com)
2. Copy your project URL and `anon` key from **Settings → API**
3. Open `js/config/supabase.js` and replace the values:
   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```
4. Run the SQL files in order in Supabase SQL Editor:
   - `sql/schema.sql`
   - `sql/migration-profiles.sql`
   - `supabase-migration.sql`

### 3. Google OAuth setup
1. In Supabase Dashboard: **Authentication → Providers → Google**
2. Enable Google provider
3. Add your Google OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com)
4. OAuth redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Storage buckets
Create two public buckets in Supabase Dashboard → **Storage**:
- `avatars` — for profile pictures
- `task-files` — for task attachments

### 5. Gemini API key
1. Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Copy `js/config/keys.example.js` to `js/config/keys.js`
3. Paste your API key into `keys.js`

### 6. Serve locally
```bash
npx serve .
```
Or use VS Code Live Server extension.

---

## Deployment (Netlify)

1. Push to GitHub
2. Connect repo to Netlify
3. Set build command: `node build.js`
4. Set publish directory: `.`
5. Set environment variable in Netlify Dashboard → **Site settings → Environment variables**:
   - `GEMINI_API_KEY` = your Gemini API key
6. Deploy

The `build.js` script reads `GEMINI_API_KEY` from environment and generates `js/config/keys.js` at build time.

---

## Project Structure

```
├── css/style.css           # All styles (light + dark mode, glassmorphism, responsive)
├── js/
│   ├── app.js              # App bootstrap, session handling, route setup
│   ├── config/
│   │   ├── supabase.js     # Supabase client initialization
│   │   ├── keys.js         # Gitignored — contains Gemini API key
│   │   └── keys.example.js # Template for keys.js
│   ├── modules/
│   │   ├── auth.js         # Login/register, Google OAuth, session management
│   │   ├── dashboard.js    # Dashboard analytics and stats
│   │   ├── projects.js     # Project CRUD, Kanban board, CSV export
│   │   ├── tasks.js        # Task CRUD, due date warnings, file attachments
│   │   ├── team.js         # Team members, role management
│   │   ├── activity.js     # Activity log
│   │   ├── notifications.js# Notification bell and list
│   │   ├── ai.js           # Gemini API integration, AI task breakdown
│   │   ├── profile.js      # Profile management, avatar upload
│   │   └── guide.js        # In-app guide page
│   └── utils/
│       ├── router.js       # SPA hash-based router
│       └── helpers.js      # Toast, modals, error handling utilities
├── sql/
│   ├── schema.sql          # Base tables (projects, tasks)
│   ├── migration-profiles.sql  # Profiles table and trigger
├── supabase-migration.sql  # Full migration with RLS policies
├── tests/
│   └── functional-tests.md # Test cases
├── build.js                # Netlify build script (env var injection)
├── netlify.toml            # Netlify deployment config
└── index.html              # Entry point (SPA shell)
```

---

## Security

- **Row-Level Security (RLS)** on all tables ensures users can only access their own data
- **PostgreSQL SECURITY DEFINER functions** bypass RLS only for specific operations (avatar upload, profile updates)
- **RLS policies use UNIONS** to avoid infinite recursion between `projects` and `project_members` tables
- **Storage bucket policies** allow authenticated uploads and public reads
- **Google OAuth** provides secure third-party authentication
- **Supabase anon key** is restricted by RLS — safe to expose client-side

---

## Testing

See `tests/functional-tests.md` for comprehensive test cases covering:
- Authentication (login, register, Google OAuth, logout)
- Project CRUD (create, view, edit, delete)
- Task CRUD + Kanban (status updates, search, due dates)
- AI Integration (task breakdown, one-click add)
- Team Collaboration (invites, activity log, notifications)
- File Attachments (upload, download, delete)
- CSV Export (data accuracy, date formatting)
- Dashboard (stats accuracy)
- Profile (avatar upload/remove, edit)
- Non-Functional (responsive design, loading states)

---

## Resume Entry

**TaskPilot AI** — Solo-developed AI-powered project task manager using vanilla JavaScript, Supabase (PostgreSQL), and Google Gemini API. Features include Google OAuth, role-based team collaboration (invites, notifications, activity log), Kanban boards with drag-and-drop, file attachments via Supabase Storage, CSV export, due-date overdue warnings, and AI task breakdown with one-click project integration. Secured with PostgreSQL Row-Level Security. Deployed on Netlify.
