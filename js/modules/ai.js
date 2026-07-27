const AI = {
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

  showAssist() {
    const container = document.getElementById('viewContainer');
    document.getElementById('pageTitle').textContent = 'AI Assist';

    const preselectedProject = sessionStorage.getItem('aiTargetProject') || '';

    container.innerHTML = `
      <div class="ai-assist-container">
        <div class="card">
          <div class="card-header">
            <h3>&#9889; AI Task Breakdown</h3>
          </div>
          <p style="margin-bottom:16px;color:var(--gray-500)">Describe a high-level task and the AI will break it down into manageable subtasks. You can then add them to any project.</p>

          <form id="aiForm" class="ai-form">
            <div class="form-group">
              <label>Describe your task or goal</label>
              <textarea id="aiPrompt" placeholder="e.g. Build a login system with email verification and password reset..."></textarea>
            </div>
            <div class="form-group">
              <label>Target Project (optional)</label>
              <select id="aiProjectSelect">
                <option value="">-- Select a project --</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">&#9889; Generate Subtasks</button>
          </form>

          <div id="aiResult" class="ai-result"></div>
        </div>
      </div>
    `;

    this.loadProjects(preselectedProject);
    document.getElementById('aiForm').onsubmit = (e) => {
      e.preventDefault();
      this.generateTasks();
    };
  },

  async loadProjects(preselectedId) {
    try {
      const { data, error } = await sb
        .from('projects')
        .select('id, name')
        .eq('owner_id', Auth.getUserId())
        .order('created_at', { ascending: false });

      if (error) throw error;
      const select = document.getElementById('aiProjectSelect');
      (data || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (preselectedId && p.id === preselectedId) opt.selected = true;
        select.appendChild(opt);
      });
      sessionStorage.removeItem('aiTargetProject');
    } catch (err) { /* ignore */ }
  },

  async generateTasks() {
    const prompt = document.getElementById('aiPrompt').value.trim();
    const projectId = document.getElementById('aiProjectSelect').value;
    const resultDiv = document.getElementById('aiResult');

    if (!prompt) { alert('Please describe your task.'); return; }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">AI is thinking...</p></div>';

    try {
      const response = await fetch(this.GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Break down the following task into 5-8 specific, actionable subtasks. For each subtask, suggest a priority (high/medium/low).

Format your response as a JSON array only (no markdown, no code blocks):
[
  {"title": "Subtask 1", "priority": "high", "description": "Brief description"},
  {"title": "Subtask 2", "priority": "medium", "description": "Brief description"}
]

Task to break down: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024
          }
        })
      });

      const data = await response.json();

      if (data.error) {
        const errMsg = data.error.message || '';
        if (errMsg.includes('quota') || errMsg.includes('429')) {
          resultDiv.innerHTML = `
            <div class="empty-state">
              <h3>Quota Exceeded</h3>
              <p style="color:var(--gray-500);margin-top:8px">Gemini API quota exhausted for today. To get <strong>1,500 free requests/day</strong> instead of ~60:</p>
              <ol style="text-align:left;color:var(--gray-500);font-size:0.9rem;margin-top:8px;padding-left:20px">
                <li>Go to <a href="https://aistudio.google.com/" target="_blank" style="color:var(--primary)">aistudio.google.com</a></li>
                <li>Click <strong>"Get API Key"</strong> → <strong>"Create API Key"</strong></li>
                <li>Choose <strong>"Create API key in new project"</strong></li>
                <li>Click <strong>"Enable billing"</strong> (no charge — just adds a payment method)</li>
                <li>Copy the new key and paste it into <code>js/modules/ai.js</code></li>
              </ol>
            </div>
          `;
        } else {
          resultDiv.innerHTML = `
            <div class="empty-state">
              <h3>AI API Error</h3>
              <pre style="background:var(--gray-100);padding:12px;border-radius:var(--radius);font-size:0.8rem;text-align:left;max-height:200px;overflow:auto;white-space:pre-wrap">${escapeHtml(errMsg)}</pre>
            </div>
          `;
        }
        return;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        resultDiv.innerHTML = '<div class="empty-state"><h3>AI returned no response</h3><p>Try again or rephrase your task.</p></div>';
        return;
      }

      let subtasks;
      try {
        subtasks = JSON.parse(text);
      } catch (e) {
        try {
          const match = text.match(/\[\s*\{.*\}\s*\]/s);
          if (match) {
            subtasks = JSON.parse(match[0]);
          } else {
            const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            subtasks = JSON.parse(cleaned);
          }
        } catch (e2) {
          resultDiv.innerHTML = `
            <div class="empty-state">
              <h3>Could not parse AI response</h3>
              <p style="font-size:0.85rem;color:var(--gray-400);margin-top:8px">Raw response for debugging:</p>
              <pre style="background:var(--gray-100);padding:12px;border-radius:var(--radius);font-size:0.8rem;text-align:left;max-height:300px;overflow:auto;white-space:pre-wrap">${escapeHtml(text)}</pre>
              <p style="margin-top:8px;font-size:0.85rem;color:var(--gray-500)">Try again or rephrase your task.</p>
            </div>
          `;
          return;
        }
      }

      if (!Array.isArray(subtasks) || subtasks.length === 0) {
        resultDiv.innerHTML = '<div class="empty-state"><h3>No subtasks generated</h3><p>Please try a more detailed description.</p></div>';
        return;
      }

      resultDiv.innerHTML = `
        <h4>Generated ${subtasks.length} Subtasks</h4>
        ${subtasks.map((t, i) => `
          <div class="task-suggestion">
            <input type="checkbox" class="ai-task-checkbox" data-title="${escapeHtml(t.title)}" data-priority="${t.priority || 'medium'}" data-description="${escapeHtml(t.description || '')}">
            <div class="task-text">
              <strong>${escapeHtml(t.title)}</strong>
              ${t.description ? `<br><span style="font-size:0.85rem;color:var(--gray-500)">${escapeHtml(t.description)}</span>` : ''}
              <br><span class="task-badge ${t.priority === 'high' ? 'badge-high' : t.priority === 'low' ? 'badge-low' : 'badge-medium'}">${getPriorityLabel(t.priority)}</span>
            </div>
          </div>
        `).join('')}
        <div style="margin-top:16px;display:flex;gap:8px">
          <button class="btn btn-secondary" id="selectAllAI">Select All</button>
          ${projectId ? `<button class="btn btn-primary" id="addSelectedTasks">Add Selected to Project</button>` : ''}
        </div>
        ${!projectId ? '<p style="margin-top:12px;font-size:0.85rem;color:var(--gray-400)">Select a project above to add tasks.</p>' : ''}
      `;

      document.getElementById('selectAllAI').onclick = () => {
        document.querySelectorAll('.ai-task-checkbox').forEach(cb => cb.checked = true);
      };

      if (projectId) {
        document.getElementById('addSelectedTasks').onclick = () => this.addSelectedToProject(projectId);
      }

    } catch (err) {
      resultDiv.innerHTML = '<div class="empty-state"><h3>AI request failed</h3><p>Check your API key or try again later.</p></div>';
    }
  },

  async addSelectedToProject(projectId) {
    const checkboxes = document.querySelectorAll('.ai-task-checkbox:checked');
    if (checkboxes.length === 0) { alert('Select at least one task.'); return; }

    try {
      const tasks = [];
      checkboxes.forEach(cb => {
        tasks.push({
          project_id: projectId,
          title: cb.dataset.title,
          description: cb.dataset.description,
          priority: cb.dataset.priority,
          status: 'todo',
          ai_generated: true
        });
      });

      const { error } = await sb.from('tasks').insert(tasks);
      if (error) throw error;
      alert(`Added ${tasks.length} task(s) to the project!`);
      router.navigate(`projects/${projectId}`);
    } catch (err) {
      alert('Failed to add tasks: ' + err.message);
    }
  }
};
