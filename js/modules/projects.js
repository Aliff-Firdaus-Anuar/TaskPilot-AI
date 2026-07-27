const Projects = {
  async showList() {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'Projects';
    showSkeleton(container, 'projects');

    try {
      const uid = Auth.getUserId();
      const { data: owned, error } = await sb
        .from('projects').select('*').eq('owner_id', uid).order('created_at', { ascending: false });
      if (error) throw error;

      const { data: memberRows } = await sb
        .from('project_members').select('project_id').eq('user_id', uid);
      const memberIds = [...new Set((memberRows || []).map(r => r.project_id))];
      const ownedIds = (owned || []).map(p => p.id);
      const allIds = [...new Set([...ownedIds, ...memberIds])];

      let memberProjects = [];
      if (memberIds.length > 0) {
        const extra = memberIds.filter(id => !ownedIds.includes(id));
        if (extra.length > 0) {
          const { data: mp } = await sb.from('projects').select('*').in('id', extra);
          memberProjects = mp || [];
        }
      }

      const allProjects = [...(owned || []), ...memberProjects];
      const statsMap = {};
      for (const p of allProjects) {
        const { data: tasks } = await sb.from('tasks').select('status').eq('project_id', p.id);
        const t = tasks || [];
        statsMap[p.id] = { total: t.length, done: t.filter(x => x.status === 'done').length };
      }

      const isMember = (id) => memberIds.includes(id) && !ownedIds.includes(id);

      container.innerHTML = `
        <div class="card" style="border-top:3px solid var(--primary)">
          <div class="card-header">
            <h3>All Projects</h3>
            <button class="btn-add" id="addProjectBtn">+ New Project</button>
          </div>
          <div id="projectList">
            ${allProjects.length === 0 ? '<div class="empty-state"><div class="empty-icon">&#128193;</div><h3>No projects yet</h3><p>Create your first project to get started.</p></div>' : ''}
            <div class="project-grid">
              ${allProjects.map(p => this.renderCard(p, statsMap[p.id] || { total: 0, done: 0 }, isMember(p.id))).join('')}
            </div>
          </div>
        </div>
      `;

      document.getElementById('addProjectBtn').onclick = () => this.showCreateForm();
      document.querySelectorAll('.project-card').forEach(card => {
        card.onclick = () => router.navigate(`projects/${card.dataset.id}`);
      });
    } catch (err) {
      showError(container, 'Failed to load projects.');
    }
  },

  renderCard(project, stats, isMember) {
    const colors = { blue: '#2563eb', green: '#059669', purple: '#7c3aed', orange: '#ea580c', red: '#dc2626' };
    const color = colors[project.color] || colors.blue;
    const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    return `
      <div class="project-card" data-id="${project.id}" style="border-left-color: ${color}">
        <h4>${escapeHtml(project.name)}${isMember ? ' <span style="font-size:0.7rem;padding:2px 8px;border-radius:20px;background:var(--primary-light);color:var(--primary);font-weight:600">Member</span>' : ''}</h4>
        <p>${escapeHtml(project.description || 'No description')}</p>
        ${stats.total > 0 ? `
        <div style="margin:8px 0;height:4px;background:var(--gray-200);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width 0.5s"></div>
        </div>` : ''}
        <div class="project-task-stats">
          <span class="project-task-stat" style="background:var(--gray-100);color:var(--gray-500)">${stats.total} tasks</span>
          <span class="project-task-stat" style="background:var(--secondary-light);color:var(--secondary)">${stats.done} done</span>
        </div>
        <div class="project-meta" style="margin-top:8px">
          <span>Created ${formatDate(project.created_at)}</span>
        </div>
      </div>
    `;
  },

  showCreateForm() {
    const modal = showModal(`
      <h3>New Project</h3>
      <form id="createProjectForm">
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" id="projectName" required placeholder="e.g. Mobile App Redesign">
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" id="projectDesc" placeholder="Brief description">
        </div>
        <div class="form-group">
          <label>Color</label>
          <select id="projectColor">
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="red">Red</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Project</button>
        </div>
      </form>
    `);

    document.getElementById('createProjectForm').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('projectName').value.trim();
      const description = document.getElementById('projectDesc').value.trim();
      const color = document.getElementById('projectColor').value;
      if (!name) return;

      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'Creating...';
      btn.disabled = true;

      try {
        const { data: project, error } = await sb.from('projects').insert({
          name, description, color, owner_id: Auth.getUserId()
        }).select().single();

        if (error) throw error;

        await sb.from('project_members').insert({
          project_id: project.id, user_id: Auth.getUserId(), role: 'owner'
        });

        closeModal();
        showToast('Project created successfully!', 'success');
        this.showList();
      } catch (err) {
        showToast('Failed to create project: ' + err.message, 'error');
        btn.textContent = 'Create Project';
        btn.disabled = false;
      }
    };
  },

  async showDetail(projectId) {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'Project';
    showLoading(container);

    try {
      const { data: project, error: projErr } = await sb
        .from('projects').select('*').eq('id', projectId).single();
      if (projErr || !project) { showError(container, 'Project not found.'); return; }

      const { data: tasks, error: taskErr } = await sb
        .from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (taskErr) throw taskErr;

      const taskList = tasks || [];
      const todoTasks = taskList.filter(t => t.status === 'todo');
      const inProgressTasks = taskList.filter(t => t.status === 'in-progress');
      const doneTasks = taskList.filter(t => t.status === 'done');

      const members = await Team.getMembers(projectId);
      const isOwner = project.owner_id === Auth.getUserId();

      container.innerHTML = `
        <div class="task-detail">
          <a class="back-link" id="backToProjects">&larr; Back to Projects</a>
          <div class="card" style="border-top:3px solid var(--primary)">
            <div class="card-header">
              <div>
                <h3>${escapeHtml(project.name)}</h3>
                <p style="font-size:0.85rem;color:var(--gray-400);margin-top:4px">${taskList.length} tasks &middot; ${doneTasks.length} done &middot; ${members.length} member${members.length !== 1 ? 's' : ''}</p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-sm btn-ghost" id="teamBtn">&#128101; Team</button>
                <button class="btn btn-sm btn-ghost" id="activityBtn">&#128196; Activity</button>
                <button class="btn btn-sm btn-ghost" id="aiSuggestBtn">&#9889; AI Suggest</button>
                <button class="btn btn-sm btn-ghost" id="exportCsvBtn">&#128230; Export CSV</button>
                ${isOwner ? `<button class="btn btn-sm btn-ghost" id="deleteProjectBtn">&#128465; Delete</button>` : ''}
                <button class="btn-add btn-sm" id="addTaskBtn">+ Task</button>
              </div>
            </div>
            ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ''}
          </div>

          <div class="search-bar">
            <input type="text" id="taskSearchInput" class="search-input" placeholder="Search tasks by name, priority or status...">
          </div>

          <div class="kanban-board">
            <div class="kanban-column" data-status="todo">
              <h4>To Do (${todoTasks.length})</h4>
              <div class="kanban-tasks">${todoTasks.map(t => Tasks.renderCard(t)).join('')}</div>
              ${todoTasks.length === 0 ? '<p style="color:var(--gray-400);font-size:0.85rem;text-align:center;padding:12px">No tasks</p>' : ''}
            </div>
            <div class="kanban-column" data-status="in-progress">
              <h4>In Progress (${inProgressTasks.length})</h4>
              <div class="kanban-tasks">${inProgressTasks.map(t => Tasks.renderCard(t)).join('')}</div>
              ${inProgressTasks.length === 0 ? '<p style="color:var(--gray-400);font-size:0.85rem;text-align:center;padding:12px">No tasks</p>' : ''}
            </div>
            <div class="kanban-column" data-status="done">
              <h4>Done (${doneTasks.length})</h4>
              <div class="kanban-tasks">${doneTasks.map(t => Tasks.renderCard(t)).join('')}</div>
              ${doneTasks.length === 0 ? '<p style="color:var(--gray-400);font-size:0.85rem;text-align:center;padding:12px">No tasks</p>' : ''}
            </div>
          </div>
        </div>
      `;

      document.getElementById('backToProjects').onclick = () => router.navigate('projects');
      document.getElementById('addTaskBtn').onclick = () => Tasks.showCreateForm(projectId);
      document.getElementById('teamBtn').onclick = () => Team.showMembers(projectId);
      document.getElementById('activityBtn').onclick = () => Activity.show(projectId);
      document.getElementById('aiSuggestBtn').onclick = () => {
        sessionStorage.setItem('aiTargetProject', projectId);
        router.navigate('ai-assist');
      };
      document.getElementById('exportCsvBtn').onclick = () => this.exportCsv(projectId, project);
      if (isOwner) {
        document.getElementById('deleteProjectBtn').onclick = () => this.confirmDelete(projectId);
      }
      document.getElementById('taskSearchInput').addEventListener('input', (e) => {
        Tasks.filterCards(projectId, e.target.value);
      });

      Tasks.attachCardListeners(projectId);
    } catch (err) {
      showError(container, 'Failed to load project.');
    }
  },

  confirmDelete(projectId) {
    const modal = showModal(`
      <h3>Delete Project</h3>
      <p>Are you sure you want to delete this project? All tasks and data will be permanently deleted.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirmDeleteProject">Delete</button>
      </div>
    `);
    document.getElementById('confirmDeleteProject').onclick = async () => {
      try {
        await sb.from('notifications').delete().eq('project_id', projectId);
        await sb.from('activity_log').delete().eq('project_id', projectId);
        await sb.from('task_comments').delete().eq('task_id', (await sb.from('tasks').select('id').eq('project_id', projectId)).data?.map(t => t.id) || []);
        await sb.from('tasks').delete().eq('project_id', projectId);
        await sb.from('project_invites').delete().eq('project_id', projectId);
        await sb.from('project_members').delete().eq('project_id', projectId);
        await sb.from('projects').delete().eq('id', projectId);
        closeModal();
        showToast('Project deleted.', 'info');
        router.navigate('projects');
      } catch (err) {
        showToast('Failed to delete project.', 'error');
      }
    };
  },

  async exportCsv(projectId, project) {
    try {
      const id = projectId || (window.location.hash.match(/projects\/(.+)/) || [])[1];
      if (!id) return;
      const p = project || (await sb.from('projects').select('name').eq('id', id).single()).data || {};
      const { data: tasks } = await sb.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true });
      const taskList = tasks || [];

      let csv = '\uFEFF'; // BOM for Excel UTF-8
      csv += 'Title,Description,Priority,Status,Due Date,Assignee,Created\n';

      for (const t of taskList) {
        let assigneeName = '';
        if (t.assignee_id) {
          const { data: p } = await sb.from('profiles').select('display_name').eq('id', t.assignee_id).single();
          assigneeName = p?.display_name || '';
        }
        const row = [
          `"${(t.title || '').replace(/"/g, '""')}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          t.priority || 'medium',
          t.status || 'todo',
          `"${t.due_date ? "'" + new Date(t.due_date).toLocaleDateString('en-MY') : ''}"`,
          `"${assigneeName.replace(/"/g, '""')}"`,
          `"${t.created_at ? "'" + new Date(t.created_at).toLocaleDateString('en-MY') : ''}"`
        ];
        csv += row.join(',') + '\n';
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.name.replace(/[^a-zA-Z0-9]/g, '_')}_tasks.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('CSV exported!', 'success');
    } catch (err) {
      showToast('Failed to export CSV.', 'error');
    }
  }
};
