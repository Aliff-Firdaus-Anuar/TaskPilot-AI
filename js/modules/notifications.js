const Notifications = {
  async create(userId, type, title, message, projectId, taskId) {
    try {
      await sb.from('notifications').insert({ user_id: userId, type, title, message, project_id: projectId, task_id: taskId });
    } catch (err) { /* silent */ }
  },

  async getUnreadCount() {
    try {
      const { count } = await sb.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', Auth.currentUser.id).eq('read', false);
      return count || 0;
    } catch { return 0; }
  },

  async fetch() {
    const { data } = await sb.from('notifications').select('*').eq('user_id', Auth.currentUser.id).order('created_at', { ascending: false }).limit(20);
    return data || [];
  },

  async markRead(id) {
    await sb.from('notifications').update({ read: true }).eq('id', id);
  },

  async markAllRead() {
    await sb.from('notifications').update({ read: true }).eq('user_id', Auth.currentUser.id).eq('read', false);
  },

  async updateBell() {
    const count = await this.getUnreadCount();
    const bell = document.getElementById('notificationBell');
    if (!bell) return;
    const badge = bell.querySelector('.notif-badge');
    if (count > 0) {
      if (!badge) {
        const b = document.createElement('span');
        b.className = 'notif-badge';
        b.textContent = count > 9 ? '9+' : count;
        bell.appendChild(b);
      } else {
        badge.textContent = count > 9 ? '9+' : count;
      }
    } else if (badge) {
      badge.remove();
    }
  },

  showDropdown() {
    const existing = document.querySelector('.notif-dropdown');
    if (existing) { existing.remove(); return; }

    this.fetch().then(async notifs => {
      const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
      const dropdown = document.createElement('div');
      dropdown.className = 'notif-dropdown';
      dropdown.innerHTML = `
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:0.9rem">Notifications</strong>
          ${unreadIds.length > 0 ? '<a id="markAllReadBtn" style="font-size:0.8rem;color:var(--primary);cursor:pointer">Mark all read</a>' : ''}
        </div>
        <div style="max-height:360px;overflow-y:auto">
          ${notifs.length === 0 ? '<div style="padding:24px;text-align:center;color:var(--gray-400);font-size:0.85rem">No notifications yet</div>' : ''}
          ${notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'notif-unread'}" data-id="${n.id}" style="cursor:pointer">
              <div style="font-weight:${n.read ? '400' : '600'};font-size:0.88rem">${escapeHtml(n.title)}</div>
              ${n.message ? `<div style="font-size:0.8rem;color:var(--gray-400);margin-top:2px">${escapeHtml(n.message)}</div>` : ''}
              <div style="font-size:0.7rem;color:var(--gray-400);margin-top:4px">${formatDate(n.created_at)}</div>
            </div>
          `).join('')}
        </div>
      `;

      const bell = document.getElementById('notificationBell');
      bell.parentElement.style.position = 'relative';
      bell.parentElement.appendChild(dropdown);

      if (document.getElementById('markAllReadBtn')) {
        document.getElementById('markAllReadBtn').onclick = async () => {
          await this.markAllRead();
          this.updateBell();
          document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('notif-unread'));
        };
      }
      document.querySelectorAll('.notif-item').forEach(el => {
        el.onclick = async () => {
          await this.markRead(el.dataset.id);
          el.classList.remove('notif-unread');
          this.updateBell();
          dropdown.remove();
        };
      });

      document.addEventListener('click', function closeNotif(e) {
        if (!e.target.closest('.notif-dropdown') && !e.target.closest('#notificationBell')) {
          const d = document.querySelector('.notif-dropdown');
          if (d) d.remove();
          document.removeEventListener('click', closeNotif);
        }
      });
    });
  }
};
