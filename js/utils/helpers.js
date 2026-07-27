function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function getPriorityLabel(p) {
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };
  return labels[p] || 'Medium';
}

function getStatusLabel(s) {
  const labels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
  return labels[s] || 'To Do';
}

function showModal(html) {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  return overlay.querySelector('.modal');
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

function showLoading(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">Loading...</p></div>';
}

function showSkeleton(container, type) {
  if (type === 'stats') {
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
        ${Array(4).fill('<div class="skeleton skeleton-stat"></div>').join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${Array(2).fill('<div class="skeleton skeleton-card"></div>').join('')}
      </div>
    `;
  } else if (type === 'projects') {
    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
        ${Array(3).fill('<div class="skeleton skeleton-card"></div>').join('')}
      </div>
    `;
  } else {
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">Loading...</p></div>';
  }
}

function showEmpty(container, title, msg, icon) {
  const ico = icon || '&#128196;';
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">${ico}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(msg)}</p></div>`;
}

function showError(container, msg) {
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">&#9888;</div><h3>Error</h3><p style="color:var(--danger)">${escapeHtml(msg)}</p></div>`;
}

function showToast(message, type) {
  type = type || 'info';
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '&#10003;', error: '&#10007;', info: '&#9432;' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
