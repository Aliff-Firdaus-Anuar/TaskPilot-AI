const Dashboard = {
  async show() {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    showSkeleton(container, 'stats');

    try {
      const uid = Auth.getUserId();
      const { data: ownedProjects, error: projErr } = await sb
        .from('projects').select('*').eq('owner_id', uid).order('created_at', { ascending: false });
      if (projErr) throw projErr;

      const { data: memberRows } = await sb
        .from('project_members').select('project_id').eq('user_id', uid);
      const ownedIds = (ownedProjects || []).map(p => p.id);
      const extraIds = [...new Set((memberRows || []).map(r => r.project_id).filter(id => !ownedIds.includes(id)))];

      let memberProjects = [];
      if (extraIds.length > 0) {
        const { data: mp } = await sb.from('projects').select('*').in('id', extraIds);
        memberProjects = mp || [];
      }

      const projectList = [...(ownedProjects || []), ...memberProjects];
      const totalProjects = projectList.length;
      const projectIds = projectList.map(p => p.id);

      let totalTasks = 0, todoCount = 0, inProgressCount = 0, doneCount = 0;
      let highPriorityCount = 0, lowCount = 0;

      for (const pid of projectIds) {
        const { data: tasks } = await sb.from('tasks').select('status, priority').eq('project_id', pid);
        (tasks || []).forEach(t => {
          totalTasks++;
          if (t.status === 'todo') todoCount++;
          else if (t.status === 'in-progress') inProgressCount++;
          else if (t.status === 'done') doneCount++;
          if (t.priority === 'high') highPriorityCount++;
          if (t.priority === 'low') lowCount++;
        });
      }

      const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
      const mediumCount = totalTasks - highPriorityCount - lowCount;
      const circumference = 2 * Math.PI * 40;
      const offset = circumference - (completionRate / 100) * circumference;

      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">${totalProjects}</div><div class="stat-label">Total Projects</div></div>
          <div class="stat-card"><div class="stat-number">${totalTasks}</div><div class="stat-label">Total Tasks</div></div>
          <div class="stat-card">
            <div class="progress-ring-container">
              <svg class="progress-ring" width="100" height="100" viewBox="0 0 100 100">
                <circle class="progress-ring-bg" cx="50" cy="50" r="40"/>
                <circle class="progress-ring-fill" cx="50" cy="50" r="40"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
              </svg>
              <div style="position:absolute;font-size:1.3rem;font-weight:700;color:var(--primary)">${completionRate}%</div>
            </div>
            <div class="stat-label" style="margin-top:4px">Completion Rate</div>
          </div>
          <div class="stat-card"><div class="stat-number" style="color:var(--warning)">${highPriorityCount}</div><div class="stat-label">High Priority</div></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="dashboard-card">
            <div class="card-header"><h3>Task Overview</h3></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div style="flex:1;padding:16px;background:var(--gray-100);border-radius:var(--radius);text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--gray-500)">${todoCount}</div>
                <div style="font-size:0.8rem;color:var(--gray-400)">To Do</div>
              </div>
              <div style="flex:1;padding:16px;background:var(--primary-light);border-radius:var(--radius);text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--primary)">${inProgressCount}</div>
                <div style="font-size:0.8rem;color:var(--gray-400)">In Progress</div>
              </div>
              <div style="flex:1;padding:16px;background:var(--secondary-light);border-radius:var(--radius);text-align:center">
                <div style="font-size:1.5rem;font-weight:700;color:var(--secondary)">${doneCount}</div>
                <div style="font-size:0.8rem;color:var(--gray-400)">Done</div>
              </div>
            </div>
          </div>

          <div class="dashboard-card">
            <div class="card-header"><h3>Priority Distribution</h3></div>
            <div>
              ${this.renderBar('High', highPriorityCount, totalTasks, '#dc2626')}
              ${this.renderBar('Medium', mediumCount, totalTasks, '#d97706')}
              ${this.renderBar('Low', lowCount, totalTasks, '#059669')}
            </div>
          </div>
        </div>

        <div class="dashboard-card" style="margin-top:16px">
          <div class="card-header">
            <h3>Recent Projects</h3>
            <a id="viewAllProjects" style="color:var(--primary);cursor:pointer;font-size:0.9rem">View All</a>
          </div>
          <div id="recentProjectsList">
            ${projectList.slice(0, 4).map(p => `
              <div style="padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center" class="recent-project" data-id="${p.id}">
                <span>${escapeHtml(p.name)}</span>
                <span style="font-size:0.8rem;color:var(--gray-400)">${formatDate(p.created_at)}</span>
              </div>
            `).join('')}
            ${projectList.length === 0 ? '<p style="color:var(--gray-400);text-align:center;padding:20px">No projects yet. Create one to get started!</p>' : ''}
          </div>
        </div>
      `;

      if (document.getElementById('viewAllProjects')) {
        document.getElementById('viewAllProjects').onclick = () => router.navigate('projects');
      }
      document.querySelectorAll('.recent-project').forEach(el => {
        el.onclick = () => router.navigate(`projects/${el.dataset.id}`);
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      container.innerHTML = `
        <div class="dashboard-card" style="text-align:center;padding:60px 20px">
          <div style="font-size:3rem;margin-bottom:16px">&#127968;</div>
          <h2 style="margin-bottom:8px">Welcome to TaskPilot AI</h2>
          <p style="color:var(--gray-400);margin-bottom:24px">Get started by creating your first project</p>
          <button class="btn btn-primary" onclick="router.navigate('projects')">Create a Project</button>
        </div>
      `;
    }
  },

  renderBar(label, count, total, color) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return `
      <div style="margin-bottom:12px">
        <div class="chart-bar-label"><span>${label}</span><span>${count} (${Math.round(pct)}%)</span></div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
    `;
  }
};
