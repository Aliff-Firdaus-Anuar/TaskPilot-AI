const Tasks = {
  async getMembersList(projectId) {
    const members = await Team.getMembers(projectId);
    const profiles = await Team.getProfiles();
    return members.map(m => {
      const uid = typeof m.user_id === 'string' ? m.user_id : m.user_id?.id;
      const p = profiles[uid] || {};
      return { id: uid, name: p.display_name || uid?.substring(0, 8) || 'Unknown' };
    });
  },

  async getComments(taskId) {
    const { data } = await sb.from('task_comments').select('*, user_id:user_id(id)').eq('task_id', taskId).order('created_at', { ascending: true });
    const userIds = [...new Set((data || []).map(c => c.user_id?.id || c.user_id))];
    const { data: profiles } = await sb.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
    const nameMap = {}; (profiles || []).forEach(p => nameMap[p.id] = p.display_name || p.id.substring(0, 8));
    return (data || []).map(c => ({
      ...c,
      userName: nameMap[c.user_id?.id || c.user_id] || 'Unknown'
    }));
  },

  isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  },

  daysOverdue(task) {
    if (!this.isOverdue(task)) return 0;
    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today - due) / (1000 * 60 * 60 * 24));
  },

  renderCard(task) {
    const priorityClass = `priority-${task.priority || 'medium'}`;
    const aiBadge = task.ai_generated ? '<span class="task-badge badge-ai">AI</span>' : '';
    const assigneeHtml = task.assignee_name ? `<span style="font-size:0.7rem;color:var(--gray-400)">${escapeHtml(task.assignee_name)}</span>` : '';
    const overdue = this.isOverdue(task);
    const overdueDays = this.daysOverdue(task);
    const overdueBadge = overdue ? `<span class="task-badge badge-overdue">${overdueDays > 0 ? overdueDays + 'd' : ''} Overdue</span>` : '';
    const dueDateHtml = task.due_date ? `<span style="font-size:0.75rem;${overdue ? 'color:var(--danger);font-weight:600' : 'color:var(--gray-400)'}">${formatDate(task.due_date)}</span>` : '';
    return `
      <div class="task-card ${priorityClass}${overdue ? ' task-overdue' : ''}" data-id="${task.id}" data-status="${task.status || 'todo'}" data-search="${escapeHtml(task.title + ' ' + (task.description || '') + ' ' + (task.priority || '') + ' ' + (task.status || ''))}" draggable="true">
        <h5>${escapeHtml(task.title)}</h5>
        ${task.description ? `<p>${escapeHtml(task.description.substring(0, 60))}</p>` : ''}
        <div class="task-meta">
          <span class="task-badge ${task.priority === 'high' ? 'badge-high' : task.priority === 'low' ? 'badge-low' : 'badge-medium'}">${getPriorityLabel(task.priority)}</span>
          ${aiBadge}
          ${overdueBadge}
          ${dueDateHtml}
        </div>
        ${assigneeHtml ? `<div style="margin-top:6px">${assigneeHtml}</div>` : ''}
      </div>
    `;
  },

  filterCards(projectId, query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.task-card').forEach(card => {
      const searchText = (card.dataset.search || '').toLowerCase();
      card.style.display = !q || searchText.includes(q) ? '' : 'none';
    });
    document.querySelectorAll('.kanban-column').forEach(col => {
      const hidden = col.querySelectorAll('.task-card[style*="display: none"]').length;
      const total = col.querySelectorAll('.task-card').length;
      const heading = col.querySelector('h4');
      if (heading) {
        const match = heading.textContent.match(/^(.+?)\(\d+\)/);
        if (match) {
          const visible = total - hidden;
          heading.textContent = `${match[1].trim()} (${visible})`;
        }
      }
    });
  },

  attachCardListeners(projectId) {
    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.task-card')) {
          e.stopPropagation();
          this.showDetail(projectId, card.dataset.id);
        }
      });
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: card.dataset.id, projectId }));
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.projectId && data.taskId && col.dataset.status) {
            this.updateStatus(data.projectId, data.taskId, col.dataset.status);
          }
        } catch (err) { /* ignore */ }
      });
    });
  },

  async updateStatus(projectId, taskId, newStatus) {
    try {
      const { data: task } = await sb.from('tasks').select('title, status').eq('id', taskId).single();
      await sb.from('tasks').update({ status: newStatus }).eq('id', taskId);
      await Activity.log(projectId, 'task_moved', { task_id: taskId, task_title: task?.title, from: task?.status, to: newStatus });
      showToast(`Task moved to ${getStatusLabel(newStatus)}`, 'success');
      Projects.showDetail(projectId);
    } catch (err) {
      showToast('Failed to update task status.', 'error');
    }
  },

  async showCreateForm(projectId) {
    const assignees = await this.getMembersList(projectId);
    const assigneeOptions = assignees.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

    const modal = showModal(`
      <h3>New Task</h3>
      <form id="createTaskForm">
        <div class="form-group">
          <label>Task Title</label>
          <input type="text" id="taskTitle" required placeholder="e.g. Design login page">
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" id="taskDesc" placeholder="Optional details">
        </div>
        <div class="form-group">
          <label>Assignee</label>
          <select id="taskAssignee">
            <option value="">Unassigned</option>
            ${assigneeOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="taskPriority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="taskStatus">
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div class="form-group">
          <label>Due Date</label>
          <input type="date" id="taskDueDate">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Task</button>
        </div>
      </form>
    `);

    document.getElementById('createTaskForm').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value.trim();
      const description = document.getElementById('taskDesc').value.trim();
      const priority = document.getElementById('taskPriority').value;
      const status = document.getElementById('taskStatus').value;
      const dueDate = document.getElementById('taskDueDate').value;
      const assigneeId = document.getElementById('taskAssignee').value;
      if (!title) return;

      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'Creating...';
      btn.disabled = true;

      try {
        const { data: newTask, error } = await sb.from('tasks').insert({
          project_id: projectId, title, description, priority, status,
          due_date: dueDate || null, ai_generated: false, assignee_id: assigneeId || null
        }).select().single();

        if (error) throw error;
        await Activity.logTaskAction(projectId, newTask, 'task_created');
        if (assigneeId) {
          await Notifications.create(assigneeId, 'task_assigned', `New task: ${title}`, `You were assigned to "${title}"`, projectId, newTask.id);
        }
        closeModal();
        showToast('Task created!', 'success');
        Projects.showDetail(projectId);
      } catch (err) {
        showToast('Failed to create task.', 'error');
        btn.textContent = 'Create Task';
        btn.disabled = false;
      }
    };
  },

  async showDetail(projectId, taskId) {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'Task Detail';
    showLoading(container);

    try {
      const { data: task, error } = await sb.from('tasks').select('*').eq('id', taskId).single();
      if (error || !task) { showError(container, 'Task not found.'); return; }

      let assigneeName = '';
      if (task.assignee_id) {
        const { data: p } = await sb.from('profiles').select('display_name').eq('id', task.assignee_id).single();
        assigneeName = p?.display_name || task.assignee_id.substring(0, 8);
      }

      const comments = await this.getComments(taskId);

      const { data: attachments } = await sb.from('task_attachments')
        .select('*').eq('task_id', taskId).order('created_at', { ascending: true });

      const commentsHtml = comments.map(c => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <strong style="font-size:0.85rem">${escapeHtml(c.userName)}</strong>
            <span style="font-size:0.7rem;color:var(--gray-400)">${formatDate(c.created_at)}</span>
          </div>
          <p style="font-size:0.88rem;color:var(--gray-600)">${escapeHtml(c.content)}</p>
        </div>
      `).join('');

      const attachHtml = (attachments || []).map(a => `
        <div class="attachment-item">
          <a href="${sb.storage.from('task-files').getPublicUrl(a.storage_path).data.publicUrl}" target="_blank" download="${escapeHtml(a.file_name)}">${escapeHtml(a.file_name)}</a>
          <span class="delete-attachment" data-id="${a.id}" title="Delete">&times;</span>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="task-detail">
          <a class="back-link" id="backToProject">&larr; Back to Project</a>
          <div class="card">
            <div class="card-header">
              <h3>${escapeHtml(task.title)}</h3>
              <div style="display:flex;gap:8px">
                <button class="btn btn-sm btn-secondary" id="editTaskBtn">Edit</button>
                <button class="btn btn-sm btn-danger" id="deleteTaskBtn">Delete</button>
              </div>
            </div>
            <div style="padding:12px 0">
              <div class="profile-row"><span class="profile-label">Description</span><span class="profile-value">${escapeHtml(task.description || '\u2014')}</span></div>
              <div class="profile-row"><span class="profile-label">Assignee</span><span class="profile-value">${escapeHtml(assigneeName || 'Unassigned')}</span></div>
              <div class="profile-row"><span class="profile-label">Priority</span><span class="profile-value"><span class="task-badge ${task.priority === 'high' ? 'badge-high' : task.priority === 'low' ? 'badge-low' : 'badge-medium'}">${getPriorityLabel(task.priority)}</span></span></div>
              <div class="profile-row"><span class="profile-label">Status</span><span class="profile-value">${getStatusLabel(task.status)}</span></div>
              ${task.due_date ? `<div class="profile-row"><span class="profile-label">Due Date</span><span class="profile-value">${formatDate(task.due_date)}</span></div>` : ''}
              ${task.ai_generated ? `<div class="profile-row"><span class="profile-label">Source</span><span class="profile-value"><span class="task-badge badge-ai">AI Generated</span></span></div>` : ''}
            </div>
          </div>

          <div class="card" style="margin-top:16px">
            <h4 style="margin-bottom:12px">Comments (${comments.length})</h4>
            <div id="commentsList">
              ${comments.length === 0 ? '<p style="color:var(--gray-400);font-size:0.85rem">No comments yet.</p>' : commentsHtml}
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <input type="text" id="commentInput" class="search-input" placeholder="Write a comment..." style="flex:1">
              <button class="btn btn-sm btn-primary" id="postCommentBtn">Post</button>
            </div>
          </div>

          <div class="card" style="margin-top:16px">
            <h4 style="margin-bottom:12px">Attachments (${(attachments || []).length})</h4>
            <div class="attachment-list" id="attachmentList">${attachHtml || '<p style="color:var(--gray-400);font-size:0.85rem">No attachments.</p>'}</div>
            <div class="drop-zone" id="dropZone">
              <p>Drag & drop files here or click to upload</p>
            </div>
          </div>
        </div>
      `;

      document.getElementById('backToProject').onclick = () => router.navigate(`projects/${projectId}`);
      document.getElementById('editTaskBtn').onclick = () => this.showEditForm(projectId, taskId, task);
      document.getElementById('deleteTaskBtn').onclick = () => this.confirmDelete(projectId, taskId);
      document.getElementById('postCommentBtn').onclick = () => this.addComment(projectId, taskId);
      document.getElementById('commentInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addComment(projectId, taskId);
      });

      this.attachFileUpload(projectId, taskId);
    } catch (err) {
      showError(container, 'Failed to load task.');
    }
  },

  async addComment(projectId, taskId) {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    if (!content) return;
    const btn = document.getElementById('postCommentBtn');
    btn.disabled = true;
    try {
      await sb.from('task_comments').insert({ task_id: taskId, user_id: Auth.currentUser.id, content });
      await Activity.log(projectId, 'comment_added', { task_id: taskId, comment: content.substring(0, 100) });
      input.value = '';
      showToast('Comment posted!', 'success');
      this.showDetail(projectId, taskId);
    } catch (err) {
      showToast('Failed to post comment.', 'error');
      btn.disabled = false;
    }
  },

  showEditForm(projectId, taskId, task) {
    this.getMembersList(projectId).then(assignees => {
      const assigneeOptions = assignees.map(a =>
        `<option value="${a.id}" ${task.assignee_id === a.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`
      ).join('');

      const modal = showModal(`
        <h3>Edit Task</h3>
        <form id="editTaskForm">
          <div class="form-group">
            <label>Task Title</label>
            <input type="text" id="editTaskTitle" value="${escapeHtml(task.title)}" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="editTaskDesc" value="${escapeHtml(task.description || '')}">
          </div>
          <div class="form-group">
            <label>Assignee</label>
            <select id="editTaskAssignee">
              <option value="">Unassigned</option>
              ${assigneeOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="editTaskPriority">
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="editTaskStatus">
              <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
              <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
            </select>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="editTaskDueDate" value="${formatDateForInput(task.due_date)}">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      `);

      document.getElementById('editTaskForm').onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDesc').value.trim();
        const priority = document.getElementById('editTaskPriority').value;
        const status = document.getElementById('editTaskStatus').value;
        const dueDate = document.getElementById('editTaskDueDate').value;
        const assigneeId = document.getElementById('editTaskAssignee').value;
        if (!title) return;

        try {
          await sb.from('tasks').update({
            title, description, priority, status, due_date: dueDate || null,
            assignee_id: assigneeId || null
          }).eq('id', taskId);
          await Activity.log(projectId, 'task_updated', { task_id: taskId, task_title: title });
          closeModal();
          showToast('Task updated!', 'success');
          this.showDetail(projectId, taskId);
        } catch (err) {
          showToast('Failed to update task.', 'error');
        }
      };
    });
  },

  confirmDelete(projectId, taskId) {
    const modal = showModal(`
      <h3>Delete Task</h3>
      <p>Are you sure you want to delete this task?</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirmDeleteTask">Delete</button>
      </div>
    `);
    document.getElementById('confirmDeleteTask').onclick = async () => {
      try {
        const { data: task } = await sb.from('tasks').select('title').eq('id', taskId).single();
        await sb.from('tasks').delete().eq('id', taskId);
        await Activity.log(projectId, 'task_deleted', { task_title: task?.title });
        closeModal();
        showToast('Task deleted.', 'info');
        router.navigate(`projects/${projectId}`);
      } catch (err) {
        showToast('Failed to delete task.', 'error');
      }
    };
  },

  attachFileUpload(projectId, taskId) {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';

    dropZone.parentNode.appendChild(input);

    dropZone.addEventListener('click', () => input.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      this.uploadFiles(projectId, taskId, e.dataTransfer.files);
    });

    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        this.uploadFiles(projectId, taskId, input.files);
        input.value = '';
      }
    });

    document.querySelectorAll('.delete-attachment').forEach(el => {
      el.onclick = () => this.deleteAttachment(projectId, taskId, el.dataset.id);
    });
  },

  async uploadFiles(projectId, taskId, files) {
    const dropZone = document.getElementById('dropZone');
    const originalText = dropZone.innerHTML;
    dropZone.innerHTML = '<p>Uploading...</p>';

    try {
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const storagePath = `${taskId}/${generateUUID()}.${ext}`;

        const { error: uploadErr } = await sb.storage.from('task-files').upload(storagePath, file);
        if (uploadErr) throw uploadErr;

        await sb.from('task_attachments').insert({
          task_id: taskId,
          user_id: Auth.currentUser.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: storagePath
        });
      }
      showToast('Files uploaded!', 'success');
      this.showDetail(projectId, taskId);
    } catch (err) {
      dropZone.innerHTML = originalText;
      showToast('Failed to upload files.', 'error');
    }
  },

  async deleteAttachment(projectId, taskId, attachmentId) {
    try {
      const { data: att } = await sb.from('task_attachments').select('storage_path').eq('id', attachmentId).single();
      if (att) {
        await sb.storage.from('task-files').remove([att.storage_path]);
      }
      await sb.from('task_attachments').delete().eq('id', attachmentId);
      showToast('Attachment removed.', 'info');
      this.showDetail(projectId, taskId);
    } catch (err) {
      showToast('Failed to delete attachment.', 'error');
    }
  }
};
