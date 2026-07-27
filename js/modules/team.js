const Team = {
  async getMembers(projectId) {
    const { data } = await sb.from('project_members').select('*, user_id:user_id(id, email)').eq('project_id', projectId);
    return data || [];
  },

  async getProfiles() {
    const { data } = await sb.from('profiles').select('id, display_name, avatar_url');
    const map = {};
    (data || []).forEach(p => map[p.id] = p);
    return map;
  },

  async showMembers(projectId) {
    const members = await this.getMembers(projectId);
    const profiles = await this.getProfiles();
    const modal = showModal(`
      <h3>Team Members</h3>
      <div style="margin-bottom:16px">
        ${members.length === 0 ? '<p style="color:var(--gray-400);font-size:0.9rem">No members yet.</p>' : ''}
        ${members.map(m => {
          const p = profiles[m.user_id] || {};
          const email = m.user_id?.email || '';
          const name = p.display_name || email.split('@')[0] || 'Unknown';
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem">${escapeHtml(name.charAt(0).toUpperCase())}</div>
                <div>
                  <div style="font-size:0.9rem;font-weight:600">${escapeHtml(name)}</div>
                  <div style="font-size:0.75rem;color:var(--gray-400)">${escapeHtml(email)}</div>
                </div>
              </div>
              <span style="font-size:0.75rem;padding:3px 10px;border-radius:20px;background:var(--primary-light);color:var(--primary);font-weight:600;text-transform:capitalize">${m.role}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-primary" id="inviteMemberBtn" style="flex:1">Invite Member</button>
        <button class="btn btn-sm btn-secondary" onclick="closeModal()">Close</button>
      </div>
    `);
    document.getElementById('inviteMemberBtn').onclick = () => { closeModal(); this.showInviteForm(projectId); };
  },

  showInviteForm(projectId) {
    const modal = showModal(`
      <h3>Invite Member</h3>
      <form id="inviteForm">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="inviteEmail" placeholder="colleague@company.com" required>
        </div>
        <div class="form-group">
          <label>Role</label>
          <select id="inviteRole">
            <option value="editor">Editor (can edit tasks)</option>
            <option value="viewer">Viewer (read-only)</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Send Invite</button>
        </div>
      </form>
    `);
    document.getElementById('inviteForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('inviteEmail').value.trim();
      const role = document.getElementById('inviteRole').value;
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        const { data: project } = await sb.from('projects').select('name').eq('id', projectId).single();
        const token = generateUUID();
        const { error } = await sb.from('project_invites').insert({
          project_id: projectId, email, token, role, invited_by: Auth.currentUser.id
        });
        if (error) throw error;
        closeModal();
        showToast(`Invitation sent to ${email}!`, 'success');
        await Activity.log(projectId, 'invite_sent', { email, role });
      } catch (err) {
        showToast('Failed to send invite: ' + err.message, 'error');
        btn.textContent = 'Send Invite';
        btn.disabled = false;
      }
    };
  },

  async acceptInvite(token) {
    const { data: invite, error } = await sb.from('project_invites').select('*').eq('token', token).single();
    if (error || !invite) { showToast('Invalid or expired invitation link.', 'error'); return; }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) { showToast('This invitation has expired.', 'error'); return; }
    try {
      await sb.from('project_members').insert({
        project_id: invite.project_id, user_id: Auth.currentUser.id, role: invite.role
      });
      await sb.from('project_invites').update({ accepted: true }).eq('id', invite.id);
      showToast('You joined the project!', 'success');
      router.navigate(`projects/${invite.project_id}`);
    } catch (err) {
      showToast('Failed to accept invite.', 'error');
    }
  },

  async getMemberProfiles(projectId) {
    const members = await this.getMembers(projectId);
    const memberIds = members.map(m => typeof m.user_id === 'string' ? m.user_id : m.user_id?.id).filter(Boolean);
    const { data: profiles } = await sb.from('profiles').select('id, display_name, avatar_url').in('id', memberIds);
    const map = {};
    (profiles || []).forEach(p => map[p.id] = p);
    const { data: users } = await sb.from('users').select('id, email').in('id', memberIds);
    const emailMap = {};
    (users || []).forEach(u => emailMap[u.id] = u.email);
    return { profiles: map, emails: emailMap };
  }
};
