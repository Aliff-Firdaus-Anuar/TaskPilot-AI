const Activity = {
  async log(projectId, action, details) {
    try {
      await sb.from('activity_log').insert({
        project_id: projectId, user_id: Auth.currentUser.id, action, details: details || {}
      });
    } catch (err) { /* silent */ }
  },

  async logTaskAction(projectId, task, action) {
    await this.log(projectId, action, {
      task_id: task.id, task_title: task.title, task_status: task.status, task_priority: task.priority
    });
  },

  async show(projectId) {
    const { data: logs } = await sb.from('activity_log')
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50);

    const userIds = [...new Set((logs || []).map(l => l.user_id))];
    const { data: profiles } = await sb.from('profiles').select('id, display_name').in('id', userIds);
    const nameMap = {}; (profiles || []).forEach(p => nameMap[p.id] = p.display_name);

    const getUserName = (uid) => nameMap[uid] || uid.substring(0, 8);

    const actionLabels = {
      task_created: 'created task', task_moved: 'moved task', task_updated: 'updated task',
      task_deleted: 'deleted task', comment_added: 'commented on task',
      member_added: 'added member', member_removed: 'removed member',
      invite_sent: 'sent invitation'
    };

    showModal(`
      <h3>Activity Log</h3>
      <div style="max-height:400px;overflow-y:auto">
        ${(logs || []).length === 0 ? '<p style="color:var(--gray-400);text-align:center;padding:20px">No activity yet.</p>' : ''}
        ${(logs || []).map(l => `
          <div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:0.85rem">
            <strong>${escapeHtml(getUserName(l.user_id))}</strong>
            <span style="color:var(--gray-500)"> ${escapeHtml(actionLabels[l.action] || l.action)}</span>
            ${l.details?.task_title ? `<span style="color:var(--gray-400)"> &mdash; ${escapeHtml(l.details.task_title)}</span>` : ''}
            <div style="font-size:0.75rem;color:var(--gray-400);margin-top:2px">${formatDate(l.created_at)}</div>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>
    `);
  }
};
