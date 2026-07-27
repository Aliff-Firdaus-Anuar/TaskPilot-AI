# TaskPilot AI — Functional & Non-Functional Test Cases

**Tested by:** [Your Name]  
**Date:** [Test Date]  
**Environment:** Chrome 120+, Firefox 115+, Edge 120+  
**Device:** Desktop (1920x1080) / Mobile (375x667)  
**Backend:** Supabase (PostgreSQL + Auth) with Row-Level Security

---

## 1. Authentication (Supabase Auth)

| ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-01 | User Registration | 1. Navigate to `/register`<br>2. Enter email + password (≥6 chars)<br>3. Click Register | Account created, redirected to Dashboard | &#x2610; |
| TC-02 | Registration — weak password | Enter password < 6 characters | HTML5 form validation prevents submission | &#x2610; |
| TC-03 | Registration — duplicate email | Register with existing email | Supabase error "User already registered" shown | &#x2610; |
| TC-04 | Login — valid credentials | 1. Navigate to `/login`<br>2. Enter registered email + password<br>3. Click Sign In | Redirected to Dashboard, sidebar visible | &#x2610; |
| TC-05 | Login — invalid credentials | Enter wrong email or password | Error message "Invalid login credentials" displayed | &#x2610; |
| TC-06 | Logout | Click Logout button in sidebar | Redirected to Login page, sidebar hidden | &#x2610; |
| TC-07 | Session persistence | Close and reopen browser | User stays logged in (Supabase session cookie) | &#x2610; |

---

## 2. Projects (PostgreSQL via Supabase)

| ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-08 | Create project | 1. Go to Projects<br>2. Click "New Project"<br>3. Fill name, description, color<br>4. Click Create | Project appears in grid | &#x2610; |
| TC-09 | Create project — empty name | Submit form without name | Form validation prevents submission | &#x2610; |
| TC-10 | View project detail | Click on a project card | Kanban board with 3 columns loads | &#x2610; |
| TC-11 | Delete project (cascade) | 1. Open project<br>2. Click Delete<br>3. Confirm in modal | Project and all tasks removed (cascade delete) | &#x2610; |
| TC-12 | RLS — other users' projects | Log in as user B, navigate to user A's project URL | Error "Project not found" (RLS blocks access) | &#x2610; |

---

## 3. Tasks (CRUD + Kanban)

| ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-13 | Create task | 1. Open a project<br>2. Click "+ Task"<br>3. Fill title, priority, status, due date<br>4. Click Create | Task appears in correct kanban column | &#x2610; |
| TC-14 | Edit task | 1. Click a task card<br>2. Click Edit<br>3. Change title/priority/status<br>4. Click Save | Task updates in real-time | &#x2610; |
| TC-15 | Delete task | 1. Click a task card<br>2. Click Delete<br>3. Confirm | Task removed from kanban | &#x2610; |
| TC-16 | Drag & drop — change status | Drag a "To Do" task to "In Progress" column | Task status updates instantly | &#x2610; |
| TC-17 | Drag & drop — to Done | Drag from any column to "Done" | Status changes to done | &#x2610; |
| TC-18 | Priority colors | Create tasks with High/Medium/Low priority | High = red left border, Medium = amber, Low = green | &#x2610; |
| TC-19 | Due date display | Create task with a due date | Date shown on task card and detail view | &#x2610; |
| TC-20 | Empty kanban columns | View project with no tasks | "No tasks" placeholder shown per column | &#x2610; |

---

## 4. AI Assist (Gemini Integration)

| ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-21 | Generate subtasks | 1. Go to AI Assist<br>2. Enter a task description<br>3. Click "Generate Subtasks" | Loading spinner appears, then subtask list renders | &#x2610; |
| TC-22 | AI — empty prompt | Click generate with empty input | Alert: "Please describe your task" | &#x2610; |
| TC-23 | AI — select & add to project | 1. Generate subtasks<br>2. Select a project<br>3. Check some subtasks<br>4. Click "Add Selected" | Tasks appear in project kanban with "AI" badge | &#x2610; |
| TC-24 | AI — JSON parsing fallback | Send vague prompt | Graceful error: "Could not parse AI response" | &#x2610; |
| TC-25 | AI badge visibility | Check task detail of AI-generated task | "AI Generated" badge visible<br>`ai_generated = true` in PostgreSQL | &#x2610; |

---

## 5. Dashboard

| ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| TC-26 | Stats load correctly | Navigate to Dashboard | Total projects, tasks, completion %, high priority count shown | &#x2610; |
| TC-27 | Task overview counts | Create tasks in each status | To Do / In Progress / Done counts are accurate | &#x2610; |
| TC-28 | Priority distribution bars | Create tasks with different priorities | Bar widths correspond to percentages | &#x2610; |
| TC-29 | Recent projects list | Create multiple projects | Last 4 projects shown with clickable links | &#x2610; |
| TC-30 | Empty dashboard | New user with no data | Placeholder: "No projects yet" | &#x2610; |

---

## 6. Non-Functional Tests (PostgreSQL + Supabase)

| ID | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|
| NF-01 | Responsive — tablet (768px) | Resize browser to 768px width | Sidebar hides, hamburger menu appears, kanban stacks | &#x2610; |
| NF-02 | Responsive — mobile (375px) | Resize to 375px width | Single column layout, touch-friendly targets | &#x2610; |
| NF-03 | Page load time | Measure dashboard load | < 3 seconds on 10+ projects with 50+ tasks | &#x2610; |
| NF-04 | Browser compatibility | Test on Chrome, Firefox, Edge | No JS errors, identical layout | &#x2610; |
| NF-05 | RLS data isolation | User A creates data, User B logs in | User B sees zero projects (RLS enforced) | &#x2610; |
| NF-06 | Database referential integrity | Delete a project with tasks | CASCADE deletes all child tasks (no orphan rows) | &#x2610; |

---

## Summary

| Metric | Count |
|---|---|
| Total Test Cases | 36 |
| Passed | / |
| Failed | / |
| Pass Rate | / |
