const Guide = {
  show() {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'User Guide';

    container.innerHTML = `
      <div style="max-width:800px;margin:0 auto">

        <div class="card" style="text-align:center;padding:32px;background:linear-gradient(135deg,var(--dark),var(--dark-light));color:var(--white)">
          <h2 style="font-size:1.8rem;margin-bottom:8px">&#9997; Welcome to TaskPilot AI</h2>
          <p style="color:var(--white);max-width:500px;margin:0 auto;opacity:0.75">Your intelligent project task manager with AI-powered task breakdown, kanban boards, and real-time analytics.</p>
        </div>

        ${this.section('Getting Started', [
          { icon: '1', title: 'Register an Account', desc: 'Go to the Register page, enter your email and a password (min 6 characters). After registration, sign in with your credentials.' },
          { icon: '2', title: 'Log In', desc: 'Enter your email and password on the Login page. Your session will persist even after closing the browser.' },
          { icon: '3', title: 'Dashboard', desc: 'After logging in, you\'ll land on the Dashboard — your command center showing project stats, task counts, and priority distribution.' }
        ])}

        ${this.section('Dashboard', [
          { icon: '&#9632;', title: 'Stats Cards', desc: 'Four cards show your total projects, total tasks, completion rate (percentage of done tasks), and high-priority task count.' },
          { icon: '&#9632;', title: 'Task Overview', desc: 'Three colored boxes break down your tasks by status: To Do, In Progress, and Done.' },
          { icon: '&#9632;', title: 'Priority Bars', desc: 'See how your tasks distribute across High/Medium/Low priority at a glance.' },
          { icon: '&#9632;', title: 'Recent Projects', desc: 'The last 4 projects you created are listed. Click any project to jump directly to its kanban board.' }
        ])}

        ${this.section('Managing Projects', [
          { icon: '&#9776;', title: 'Create a Project', desc: 'Go to Projects → click "+ New Project". Give it a name, optional description, and pick a color. The color appears as a left border on the project card.' },
          { icon: '&#9776;', title: 'View Project Tasks', desc: 'Click any project card to open its kanban board showing all tasks organized in three columns.' },
          { icon: '&#9776;', title: 'Delete a Project', desc: 'Inside a project, click the Delete button. A confirmation modal appears. Deleting a project permanently removes all its tasks (database cascade).' }
        ])}

        ${this.section('Working with Tasks & Kanban', [
          { icon: '&#9744;', title: 'Create a Task', desc: 'Inside a project, click "+ Task". Fill in the title, description, priority (Low/Medium/High), status (To Do/In Progress/Done), and optional due date.' },
          { icon: '&#9744;', title: 'Priority Colors', desc: 'Tasks are color-coded on the left border: Red = High priority, Amber = Medium, Green = Low.' },
          { icon: '&#9744;', title: 'Edit a Task', desc: 'Click any task card to open its detail view, then click "Edit". Modify any field and save.' },
          { icon: '&#9744;', title: 'Drag & Drop', desc: 'Grab any task card and drag it to a different column (To Do → In Progress → Done). The status updates automatically in the database.' },
          { icon: '&#9744;', title: 'Delete a Task', desc: 'Open a task\'s detail view and click "Delete". Confirm in the modal to remove it.' }
        ])}

        ${this.section('AI Assist', [
          { icon: '&#9889;', title: 'Generate Subtasks', desc: 'Go to AI Assist. Type a high-level task description (e.g. "Build a payment gateway with Stripe"). Click "Generate Subtasks". The Gemini API will return 5-8 actionable subtasks with priorities.' },
          { icon: '&#9889;', title: 'Select a Project', desc: 'Choose which project to add the generated tasks to from the dropdown.' },
          { icon: '&#9889;', title: 'Add to Project', desc: 'Check the subtasks you want, then click "Add Selected to Project". Each task is created with an "AI" badge and ai_generated flag set to true in the database.' },
          { icon: '&#9889;', title: 'AI Badge', desc: 'Tasks created by the AI show an "AI" badge on the card and "AI Generated" label in the detail view.' }
        ])}

        ${this.section('Tips & Best Practices', [
          { icon: '&#10003;', title: 'Use AI for Planning', desc: 'When starting a new feature, use AI Assist to break it down first. It saves time and catches details you might miss.' },
          { icon: '&#10003;', title: 'Update Status via Drag', desc: 'Drag-and-drop is the fastest way to move tasks through your workflow. No need to open each task.' },
          { icon: '&#10003;', title: 'Prioritize with Colors', desc: 'Use the priority system (High/Medium/Low) to visually identify what needs attention first in your kanban board.' },
          { icon: '&#10003;', title: 'Check Dashboard Daily', desc: 'The Dashboard gives you a bird\'s-eye view of your completion rate and high-priority items.' }
        ])}

        <div class="card" style="text-align:center;padding:24px;background:var(--primary-light);border:1px solid var(--primary)">
          <p style="font-size:0.95rem;color:var(--gray-600)">Need help? The system uses <strong>Supabase</strong> (PostgreSQL) for data storage with Row-Level Security, and <strong>Google Gemini</strong> for AI features. All your data is private and isolated.</p>
        </div>

      </div>
    `;
  },

  section(title, items) {
    return `
      <div class="card" style="margin-top:16px">
        <h3 style="margin-bottom:16px;color:var(--primary);border-bottom:2px solid var(--primary-light);padding-bottom:8px">${title}</h3>
        ${items.map(item => `
          <div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
            <div style="min-width:32px;height:32px;background:var(--primary-light);color:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${item.icon}</div>
            <div style="flex:1">
              <strong style="font-size:0.95rem">${item.title}</strong>
              <p style="font-size:0.9rem;color:var(--gray-500);margin-top:2px">${item.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
};
