import { api } from '../services/api.js';

const STYLE_ID = 'primeStackAdminCompleteStyle';
const ROOT_ID = 'primeStackAdminCompletePanel';

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .psCompleteOverlay{position:fixed;inset:0;background:rgba(7,12,24,.55);backdrop-filter:blur(6px);z-index:9999;display:flex;justify-content:flex-end}
    .psCompletePanel{width:min(720px,100%);height:100%;background:#fff;box-shadow:-18px 0 60px rgba(0,0,0,.22);display:flex;flex-direction:column;color:#0f766e}
    .psCompleteHead{padding:22px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .psCompleteHead h2{margin:0;font-size:20px;color:#115e59}.psCompleteHead p{margin:5px 0 0;color:#0e7490;font-size:13px}
    .psCompleteClose{border:0;background:#f3f4f6;border-radius:10px;width:38px;height:38px;font-size:20px;cursor:pointer}
    .psCompleteBody{padding:20px 24px;overflow:auto;flex:1}.psCompleteSearch{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;margin-bottom:14px;font-size:14px;color:#115e59;background:#fff}
    .psCompleteItem{border:1px solid #e5e7eb;border-radius:14px;padding:15px;margin-bottom:10px;background:#fff}.psCompleteItem strong{display:block;color:#0f766e}.psCompleteItem span{display:block;color:#0e7490;font-size:13px;margin-top:4px}.psCompleteItem p{margin:9px 0 0;color:#0369a1;font-size:14px;line-height:1.5}
    .psCompleteBtn{border:1px solid #d1d5db;background:#fff;border-radius:9px;padding:8px 11px;cursor:pointer;font-weight:600;color:#0369a1}.psCompleteBtn:hover{background:#f0fdfa}
    .psCompleteEmpty{padding:36px 10px;text-align:center;color:#0e7490}.psCompleteError{padding:12px;border-radius:10px;background:#fef2f2;color:#991b1b;margin-bottom:14px}
    .psConversation{border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}.psMessages{max-height:420px;overflow:auto;padding:16px;background:#f9fafb}.psMsg{max-width:82%;padding:10px 12px;border-radius:12px;margin-bottom:10px;font-size:14px;line-height:1.45}.psMsg.admin{margin-left:auto;background:#111827;color:#fff}.psMsg.customer{background:#fff;border:1px solid #e5e7eb}.psMsg small{display:block;opacity:.65;margin-bottom:3px}.psReply{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb}.psReply textarea{flex:1;min-height:52px;resize:vertical;border:1px solid #d1d5db;border-radius:10px;padding:10px;font:inherit}.psReply button{align-self:flex-end}
    .psAccountForm label{display:block;margin:0 0 6px;font-size:13px;font-weight:700;color:#0f766e}.psAccountForm .psCompleteSearch{margin-bottom:14px}.psAccountEmail{background:#f8fafc!important;color:#0369a1!important;cursor:not-allowed}.psAccountMeta{margin:4px 0 16px;color:#0e7490;font-size:13px}.psAccountStatus{margin-top:12px;font-size:13px;font-weight:700;color:#0f766e}
    @media(max-width:900px){.psCompletePanel{width:100%}.psCompleteOverlay{z-index:10001}}
  `;
  document.head.appendChild(style);
};

const makeButton = (label, icon, action) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'adminProCompleteNav';
  button.innerHTML = `<span class="adminProNavIcon">${icon}</span><span>${label}</span>`;
  button.addEventListener('click', action);
  return button;
};

const closePanel = () => document.getElementById(ROOT_ID)?.remove();

const showPanel = (title, subtitle, render) => {
  closePanel(); injectStyles();
  const overlay = document.createElement('div'); overlay.id = ROOT_ID; overlay.className = 'psCompleteOverlay';
  overlay.innerHTML = `<section class="psCompletePanel" role="dialog" aria-modal="true"><header class="psCompleteHead"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="psCompleteClose" aria-label="Close">×</button></header><div class="psCompleteBody"></div></section>`;
  overlay.querySelector('.psCompleteClose').addEventListener('click', closePanel);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePanel(); });
  document.body.appendChild(overlay);
  render(overlay.querySelector('.psCompleteBody'));
};

const openCustomers = async () => showPanel('Customers', 'Customer accounts and contacts collected through PrimeStack.', async body => {
  body.innerHTML = '<div class="psCompleteEmpty">Loading customers…</div>';
  try {
    const response = await api.get('/contact');
    const contacts = response.data?.data?.data || response.data?.data || [];
    const map = new Map();
    contacts.forEach(item => { const email = String(item.email || '').trim().toLowerCase(); if (email && !map.has(email)) map.set(email, item); });
    const customers = [...map.values()].sort((a,b) => String(a.name||'').localeCompare(String(b.name||'')));
    body.innerHTML = `<input class="psCompleteSearch" placeholder="Search customers…"><div id="psCustomersList"></div>`;
    const list = body.querySelector('#psCustomersList'); const search = body.querySelector('input');
    const draw = () => { const q = search.value.toLowerCase(); const filtered = customers.filter(c => `${c.name||''} ${c.email||''} ${c.company||''}`.toLowerCase().includes(q)); list.innerHTML = filtered.length ? filtered.map(c => `<article class="psCompleteItem"><strong>${escapeHtml(c.name || 'Unnamed customer')}</strong><span>${escapeHtml(c.email)}${c.company ? ` · ${escapeHtml(c.company)}` : ''}</span><p>${escapeHtml(c.projectType || 'General inquiry')} · ${escapeHtml(c.status || 'New')}</p></article>`).join('') : '<div class="psCompleteEmpty">No customers found.</div>'; };
    search.addEventListener('input', draw); draw();
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${escapeHtml(error.response?.data?.message || 'Unable to load customers.')}</div>`; }
});

const openConversations = async () => showPanel('Conversations', 'Reply to customer inquiries from the admin workspace.', async body => {
  body.innerHTML = '<div class="psCompleteEmpty">Loading conversations…</div>';
  try {
    const response = await api.get('/inquiries/admin/inquiries');
    const inquiries = response.data?.data || [];
    if (!inquiries.length) { body.innerHTML = '<div class="psCompleteEmpty">No conversations yet.</div>'; return; }
    body.innerHTML = `<div id="psConversationList"></div>`;
    const list = body.querySelector('#psConversationList');
    const drawList = () => { list.innerHTML = inquiries.map(item => `<article class="psCompleteItem"><strong>${escapeHtml(item.name || 'Customer')} · ${escapeHtml(item.email || '')}</strong><span>${escapeHtml(item.status || 'New')} · ${escapeHtml(item.unreadCount || 0)} unread</span><p>${escapeHtml(String(item.message || '').slice(0,180))}</p><button class="psCompleteBtn" data-id="${escapeHtml(item._id)}">Open conversation</button></article>`).join(''); list.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => openConversation(btn.dataset.id, body))); };
    drawList();
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${escapeHtml(error.response?.data?.message || 'Unable to load conversations.')}</div>`; }
});

const openConversation = async (id, body) => {
  body.innerHTML = '<div class="psCompleteEmpty">Loading messages…</div>';
  try {
    const response = await api.get(`/inquiries/${id}/messages`); const data = response.data?.data || {}; const inquiry = data.inquiry || {}; const messages = data.messages || [];
    body.innerHTML = `<button class="psCompleteBtn" id="psBack">← All conversations</button><h3>${escapeHtml(inquiry.name || 'Customer')} · ${escapeHtml(inquiry.email || '')}</h3><div class="psConversation"><div class="psMessages" id="psMessages">${messages.map(m => `<div class="psMsg ${m.senderType === 'admin' ? 'admin' : 'customer'}"><small>${escapeHtml(m.senderName || m.senderType)}</small>${escapeHtml(m.message || '')}</div>`).join('') || '<div class="psCompleteEmpty">No messages yet.</div>'}</div><form class="psReply"><textarea maxlength="5000" placeholder="Write a reply…" required></textarea><button class="psCompleteBtn" type="submit">Send</button></form></div>`;
    body.querySelector('#psBack').addEventListener('click', openConversations);
    const messagesBox = body.querySelector('#psMessages'); messagesBox.scrollTop = messagesBox.scrollHeight;
    body.querySelector('.psReply').addEventListener('submit', async e => { e.preventDefault(); const textarea = e.currentTarget.querySelector('textarea'); const message = textarea.value.trim(); if (!message) return; const button = e.currentTarget.querySelector('button'); button.disabled = true; button.textContent = 'Sending…'; try { await api.post(`/inquiries/${id}/messages`, { message }); await openConversation(id, body); } catch (error) { button.disabled = false; button.textContent = 'Send'; alert(error.response?.data?.message || 'Unable to send message.'); } });
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${escapeHtml(error.response?.data?.message || 'Unable to load this conversation.')}</div>`; }
};

const openAccount = async () => showPanel('Account & Settings', 'Manage your administrator profile and session.', async body => {
  body.innerHTML = '<div class="psCompleteEmpty">Loading account details…</div>';
  try {
    const response = await api.get('/auth/me');
    const user = response.data?.data?.user;
    if (!user) throw new Error('Account details were not returned by the server.');

    body.innerHTML = `<form id="psAccountForm" class="psAccountForm">
      <label for="psAccountName">Name</label>
      <input id="psAccountName" class="psCompleteSearch" name="name" value="${escapeHtml(user.name || '')}" required minlength="2" autocomplete="name">
      <label for="psAccountEmail">Email</label>
      <input id="psAccountEmail" class="psCompleteSearch psAccountEmail" value="${escapeHtml(user.email || '')}" readonly disabled>
      <div class="psAccountMeta">Role: <strong>${escapeHtml(user.role || 'Admin')}</strong> · Status: <strong>${escapeHtml(user.status || 'Active')}</strong></div>
      <label for="psAccountPassword">New password (optional)</label>
      <input id="psAccountPassword" class="psCompleteSearch" name="password" type="password" minlength="8" autocomplete="new-password" placeholder="Leave blank to keep current password">
      <button class="psCompleteBtn" type="submit">Save account</button>
      <p id="psAccountMsg" class="psAccountStatus" aria-live="polite"></p>
    </form>`;

    const formElement = body.querySelector('#psAccountForm');
    formElement.addEventListener('submit', async e => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const name = String(form.get('name') || '').trim();
      const password = String(form.get('password') || '');
      const payload = { name };
      if (password) payload.password = password;
      const button = e.currentTarget.querySelector('button[type="submit"]');
      const msg = body.querySelector('#psAccountMsg');
      button.disabled = true;
      msg.textContent = 'Saving account…';
      try {
        const saved = await api.put('/auth/profile', payload);
        const updated = saved.data?.data?.user || { ...user, name };
        body.querySelector('#psAccountName').value = updated.name || name;
        body.querySelector('#psAccountPassword').value = '';
        msg.textContent = saved.data?.message || 'Account updated successfully.';
      } catch (error) {
        msg.textContent = error.response?.data?.message || 'Unable to update account.';
      } finally {
        button.disabled = false;
      }
    });
  } catch (error) {
    body.innerHTML = `<div class="psCompleteError">${escapeHtml(error.response?.data?.message || error.message || 'Unable to load account.')}</div>`;
  }
});

const install = () => {
  const nav = document.querySelector('.adminProNav');
  if (!nav || nav.dataset.completeInstalled === '1') return;
  nav.dataset.completeInstalled = '1';
  const existing = [...nav.querySelectorAll('button')];
  const divider = document.createElement('div'); divider.className = 'adminProSectionLabel adminProCompleteLabel'; divider.textContent = 'Management'; nav.appendChild(divider);
  nav.appendChild(makeButton('Conversations', '◌', openConversations));
  nav.appendChild(makeButton('Customers', '♙', openCustomers));
  nav.appendChild(makeButton('Account & Settings', '⚙', openAccount));
  if (existing.length) existing[0].setAttribute('aria-label', 'Overview');
};

const boot = () => { install(); const observer = new MutationObserver(() => install()); observer.observe(document.body, { childList: true, subtree: true }); window.addEventListener('beforeunload', () => observer.disconnect(), { once: true }); };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
