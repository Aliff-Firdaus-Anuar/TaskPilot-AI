const Profile = {
  async show() {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'Profile';
    showLoading(container);

    try {
      const user = Auth.currentUser;
      if (!user) { showError(container, 'Not logged in.'); return; }

      const { data: profile, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const displayName = profile?.display_name || '';
      const bio = profile?.bio || '';
      const avatarUrl = profile?.avatar_url || '';
      const initials = this.getInitials(displayName || user.email);
      const joinedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

      container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">

          <div style="margin-bottom:16px">
            <a class="back-link" id="backFromProfile">&larr; Back</a>
          </div>

          <div style="border-radius:var(--radius);overflow:hidden">
            <div class="profile-cover"></div>
            <div style="display:flex;justify-content:center;margin-top:-46px;position:relative;z-index:3">
              ${avatarUrl
                ? `<img src="${escapeHtml(avatarUrl)}" alt="Avatar" style="width:92px;height:92px;border-radius:50%;object-fit:cover;border:4px solid var(--white);box-shadow:0 4px 20px var(--primary-glow)">`
                : `<div class="profile-avatar">${escapeHtml(initials)}</div>`
              }
            </div>
            <div class="profile-body" style="text-align:center;padding-top:8px">
              <div style="display:flex;justify-content:center;gap:8px;margin-top:4px;margin-bottom:8px">
                <label for="avatarUpload" style="width:30px;height:30px;border-radius:50%;background:var(--primary);color:var(--white);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.8rem;box-shadow:0 2px 8px rgba(0,0,0,0.12);transition:all 0.2s" title="Upload photo">&#128247;</label>
                <input type="file" id="avatarUpload" accept="image/*" style="display:none">
                ${avatarUrl ? `<button id="removeAvatarBtn" style="width:30px;height:30px;border-radius:50%;background:var(--gray-100);color:var(--danger);border:1px solid var(--border);cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;transition:all 0.2s" title="Remove photo">&times;</button>` : ''}
              </div>
              <h2 style="font-size:1.4rem">${escapeHtml(displayName || 'Unnamed')}</h2>
              <p style="color:var(--gray-400);font-size:0.9rem">${escapeHtml(user.email)}</p>
              <p style="color:var(--gray-400);font-size:0.85rem;margin-top:4px">Member since ${joinedDate}</p>

              ${bio ? `<p style="margin-top:12px;padding:8px 16px;background:var(--gray-50);border-radius:var(--radius);color:var(--gray-600);font-size:0.9rem">${escapeHtml(bio)}</p>` : ''}
            </div>
          </div>

          <div class="card" style="margin-top:16px">
            <div class="card-header">
              <h3>Account Details</h3>
              <button class="btn btn-sm btn-primary" id="editProfileBtn">Edit Profile</button>
            </div>
            <div>
              <div class="profile-row">
                <span class="profile-label">Display Name</span>
                <span class="profile-value">${escapeHtml(displayName || '\u2014')}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Email</span>
                <span class="profile-value">${escapeHtml(user.email)}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">User ID</span>
                <span class="profile-value" style="font-family:monospace;font-size:0.8rem;color:var(--gray-400)">${escapeHtml(user.id)}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Joined</span>
                <span class="profile-value">${joinedDate}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Bio</span>
                <span class="profile-value">${escapeHtml(bio || '\u2014')}</span>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top:16px;text-align:center">
            <p style="font-size:0.85rem;color:var(--gray-400)">
              Your data is protected by <strong>Supabase Row-Level Security</strong>.
              Only you can access your profile and projects.
            </p>
          </div>

        </div>
      `;

      document.getElementById('backFromProfile').onclick = () => window.history.back();
      document.getElementById('editProfileBtn').onclick = () => this.showEditForm(displayName, bio);
      document.getElementById('avatarUpload').onchange = (e) => this.uploadAvatar(e);
      if (avatarUrl) {
        document.getElementById('removeAvatarBtn').onclick = () => this.removeAvatar();
      }
    } catch (err) {
      showError(container, 'Failed to load profile.');
    }
  },

  async uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB.', 'error');
      return;
    }

    const user = Auth.currentUser;
    if (!user) return;

    showToast('Uploading...', 'info');

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError && uploadError.message.includes('bucket')) {
        const { error: createError } = await sb.storage.createBucket('avatars', { public: true });
        if (createError) throw createError;
        const { error: retryError } = await sb.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });
        if (retryError) throw retryError;
      } else if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = sb.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;

      const { error: dbError } = await sb.rpc('update_profile_avatar', { avatar_url: avatarUrl });
      if (dbError) throw dbError;

      showToast('Profile picture updated!', 'success');
      this.show();
    } catch (err) {
      showToast('Failed to upload: ' + err.message, 'error');
    }
  },

  async removeAvatar() {
    const user = Auth.currentUser;
    if (!user) return;

    try {
      const { data: profile } = await sb.from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        const pathMatch = profile.avatar_url.match(/avatars\/(.+)/);
        if (pathMatch) {
          await sb.storage.from('avatars').remove([pathMatch[1]]);
        }
      }

      const { error } = await sb.rpc('remove_profile_avatar');
      if (error) throw error;

      showToast('Profile picture removed.', 'success');
      this.show();
    } catch (err) {
      showToast('Failed to remove: ' + err.message, 'error');
    }
  },

  showEditForm(currentName, currentBio) {
    const modal = showModal(`
      <h3>Edit Profile</h3>
      <form id="editProfileForm">
        <div class="form-group">
          <label>Display Name</label>
          <input type="text" id="editDisplayName" value="${escapeHtml(currentName)}" maxlength="50" placeholder="Your name">
        </div>
        <div class="form-group">
          <label>Bio</label>
          <input type="text" id="editBio" value="${escapeHtml(currentBio)}" maxlength="200" placeholder="A short bio about yourself">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);

    document.getElementById('editProfileForm').onsubmit = async (e) => {
      e.preventDefault();
      const displayName = document.getElementById('editDisplayName').value.trim();
      const bio = document.getElementById('editBio').value.trim();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        const { error } = await sb.rpc('update_profile_info', { display_name: displayName, bio: bio });
        if (error) throw error;
        closeModal();
        this.show();
      } catch (err) {
        showToast('Failed to update profile: ' + err.message, 'error');
        btn.textContent = 'Save Changes';
        btn.disabled = false;
      }
    };
  },

  getInitials(text) {
    if (!text) return '?';
    const parts = text.split(/[@\s.]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  }
};