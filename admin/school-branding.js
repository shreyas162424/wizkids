/**
 * Admin-only school branding editor (deployers only — not linked from student portal).
 */
(function () {
  const form = document.getElementById('branding-form');
  const msg = document.getElementById('msg');
  const previewImg = document.getElementById('preview-img');
  const previewName = document.getElementById('preview-name');
  const previewTag = document.getElementById('preview-tag');
  const logoInput = document.getElementById('logo');
  const assistantGrid = document.getElementById('assistant-grid');
  const assistantMsg = document.getElementById('assistant-msg');
  let logoFile = null;
  let assistantsConfig = null;
  let selectedAssistantId = 'krishna';

  function showMsg(text, ok) {
    msg.textContent = text;
    msg.className = 'msg ' + (ok ? 'ok' : 'err');
  }

  function updatePreview() {
    previewName.textContent = document.getElementById('schoolName').value || 'School name';
    previewTag.textContent = document.getElementById('tagline').value || 'Tagline';
  }

  async function parseJsonResponse(res) {
    const text = await res.text();
    if (!text) {
      throw new Error(res.ok ? 'Empty server response' : 'Server error (' + res.status + '). Is npm start running?');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(
        'Server returned an invalid response. Use http://localhost:3000/admin/school-branding.html (not opening the file directly).'
      );
    }
  }

  async function loadCurrent() {
    try {
      const res = await fetch('/api/branding');
      const b = await parseJsonResponse(res);
      if (!res.ok) throw new Error(b.error || 'Could not load branding');
      document.getElementById('schoolName').value = b.schoolName || '';
      document.getElementById('tagline').value = b.tagline || '';
      document.getElementById('loginSubtitle').value = b.loginSubtitle || '';
      document.getElementById('portalHero').value = b.portalHero || '';
      if (b.logoPath) {
        previewImg.src = b.logoPath + '?t=' + Date.now();
      }
      updatePreview();
    } catch (e) {
      showMsg(e.message, false);
    }
  }

  document.getElementById('schoolName').addEventListener('input', updatePreview);
  document.getElementById('tagline').addEventListener('input', updatePreview);

  logoInput.addEventListener('change', (e) => {
    logoFile = e.target.files[0] || null;
    if (!logoFile) return;
    if (logoFile.size > 2 * 1024 * 1024) {
      showMsg('Logo must be under 2MB.', false);
      logoFile = null;
      logoInput.value = '';
      return;
    }
    previewImg.src = URL.createObjectURL(logoFile);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    msg.className = 'msg';

    const pin = document.getElementById('pin').value.trim();
    if (!pin) {
      showMsg('Enter the setup PIN.', false);
      btn.disabled = false;
      return;
    }

    const fd = new FormData();
    fd.append('setupPin', pin);
    fd.append('schoolName', document.getElementById('schoolName').value.trim());
    fd.append('tagline', document.getElementById('tagline').value.trim());
    fd.append('loginSubtitle', document.getElementById('loginSubtitle').value.trim());
    fd.append('portalHero', document.getElementById('portalHero').value.trim());
    if (logoFile) fd.append('logo', logoFile, logoFile.name);

    try {
      const res = await fetch('/api/admin/school-branding', {
        method: 'POST',
        body: fd
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Save failed');

      logoFile = null;
      logoInput.value = '';
      if (data.branding && data.branding.logoPath) {
        previewImg.src = data.branding.logoPath + '?t=' + Date.now();
      }
      showMsg('Saved. Open the student or portal page in a new tab and refresh to see changes.', true);
    } catch (err) {
      showMsg(err.message, false);
    } finally {
      btn.disabled = false;
    }
  });

  function showAssistantMsg(text, ok) {
    assistantMsg.textContent = text;
    assistantMsg.className = 'msg ' + (ok ? 'ok' : 'err');
  }

  function renderAssistantGrid() {
    if (!assistantsConfig || !assistantGrid) return;
    const list = assistantsConfig.assistants || [];
    selectedAssistantId = assistantsConfig.defaultAssistantId || list[0]?.id || 'krishna';
    assistantGrid.innerHTML = list.map(a => {
      const thumb = `../img/${(a.legacyFiles && a.legacyFiles.guide) || a.id + '-guide.png'}`;
      const active = a.id === selectedAssistantId ? ' active' : '';
      return `<button type="button" class="assistant-option${active}" data-id="${a.id}" aria-pressed="${a.id === selectedAssistantId}">
        <img src="${thumb}" alt="" onerror="this.src='../img/krishna-guide.png'" />
        <span class="assistant-option-meta">
          <strong>${a.emoji || ''} ${a.name}</strong>
          <span>${a.subtitle || ''}</span>
        </span>
      </button>`;
    }).join('');

    assistantGrid.querySelectorAll('.assistant-option').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAssistantId = btn.dataset.id;
        assistantGrid.querySelectorAll('.assistant-option').forEach(b => {
          const on = b.dataset.id === selectedAssistantId;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });
  }

  async function loadAssistants() {
    if (!assistantGrid) return;
    try {
      const res = await fetch('/api/ai-assistants');
      assistantsConfig = await parseJsonResponse(res);
      if (!res.ok) throw new Error(assistantsConfig.error || 'Could not load AI guides');
      renderAssistantGrid();
    } catch (e) {
      showAssistantMsg(e.message, false);
    }
  }

  document.getElementById('save-assistant-btn').addEventListener('click', async () => {
    const pin = document.getElementById('pin').value.trim();
    if (!pin) {
      showAssistantMsg('Enter the setup PIN above first.', false);
      return;
    }
    const btn = document.getElementById('save-assistant-btn');
    btn.disabled = true;
    assistantMsg.className = 'msg';
    try {
      const res = await fetch('/api/admin/ai-assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupPin: pin, defaultAssistantId: selectedAssistantId })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Save failed');
      assistantsConfig.defaultAssistantId = selectedAssistantId;
      showAssistantMsg('AI guide saved. Students will see this guide after they refresh the app.', true);
    } catch (err) {
      showAssistantMsg(err.message, false);
    } finally {
      btn.disabled = false;
    }
  });

  loadCurrent();
  loadAssistants();
})();
