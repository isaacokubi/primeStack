import { api } from '../services/api.js';

const STYLE_ID = 'primeStackAdminCompleteStyle';
const ROOT_ID = 'primeStackAdminCompletePanel';

const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .psCompleteOverlay{position:fixed;inset:0;background:rgba(7,12,24,.55);backdrop-filter:blur(6px);z-index:9999;display:flex;justify-content:flex-end}
    .psCompletePanel{width:min(720px,100%);height:100%;background:#fff;box-shadow:-18px 0 60px rgba(0,0,0,.22);display:flex;flex-direction:column;color:#111827}
    .psCompleteHead{padding:22px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .psCompleteHead h2{margin:0;font-size:20px}.psCompleteHead p{margin:5px 0 0;color:#6b7280;font-size:13px}
    .psCompleteClose{border:0;background:#f3f4f6;border-radius:10px;width:38px;height:38px;font-size:20px;cursor:pointer}
    .psCompleteBody{padding:20px 24px;overflow:auto;flex:1}.psCompleteSearch{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;margin-bottom:14px;font-size:14px}
    .psCompleteItem{border:1px solid #e5e7eb;border-radius:14px;padding:15px;margin-bottom:10px;background:#fff}.psCompleteItem strong{display:block}.psCompleteItem span{display:block;color:#6b7280;font-size:13px;margin-top:4px}.psCompleteItem p{margin:9px 0 0;color:#374151;font-size:14px;line-height:1.5}
    .psCompleteBtn{border:1px solid #d1d5db;background:#fff;border-radius:9px;padding:8px 11px;cursor:pointer;font-weight:600}.psCompleteBtn:hover{background:#f9fafb}
    .psCompleteEmpty{padding:36px 10px;text-align:center;color:#6b7280}.psCompleteError{padding:12px;border-radius:10px;background:#fef2f2;color:#991b1b;margin-bottom:14px}
    .psConversation{border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}.psMessages{max-height:420px;overflow:auto;padding:16px;background:#f9fafb}.psMsg{max-width:82%;padding:10px 12px;border-radius:12px;margin-bottom:10px;font-size:14px;line-height:1.45}.psMsg.admin{margin-left:auto;background:#111827;color:#fff}.psMsg.customer{background:#fff;border:1px solid #e5e7eb}.psMsg small{display:block;opacity:.65;margin-bottom:3px}.psReply{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb}.psReply textarea{flex:1;min-height:52px;resize:vertical;border:1px solid #d1d5db;border-radius:10px;padding:10px;font:inherit}.psReply button{align-self:flex-end}
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
  overlay.innerHTML = `<section class="psCompletePanel" role="dialog" aria-modal="true"><header class="psCompleteHead"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="psCompleteClose" aria-label="Close">×</button></header><div class="psCompleteBody"></div></section>`;
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
    const draw = () => { const q = search.value.toLowerCase(); const filtered = customers.filter(c => `${c.name||''} ${c.email||''} ${c.company||''}`.toLowerCase().includes(q)); list.innerHTML = filtered.length ? filtered.map(c => `<article class="psCompleteItem"><strong>${c.name || 'Unnamed customer'}</strong><span>${c.email}${c.company ? ` · ${c.company}` : ''}</span><p>${c.projectType || 'General inquiry'} · ${c.status || 'New'}</p></article>`).join('') : '<div class="psCompleteEmpty">No customers found.</div>'; };
    search.addEventListener('input', draw); draw();
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${error.response?.data?.message || 'Unable to load customers.'}</div>`; }
});

const openConversations = async () => showPanel('Conversations', 'Reply to customer inquiries from the admin workspace.', async body => {
  body.innerHTML = '<div class="psCompleteEmpty">Loading conversations…</div>';
  try {
    const response = await api.get('/inquiries/admin/inquiries');
    const inquiries = response.data?.data || [];
    if (!inquiries.length) { body.innerHTML = '<div class="psCompleteEmpty">No conversations yet.</div>'; return; }
    body.innerHTML = `<div id="psConversationList"></div>`;
    const list = body.querySelector('#psConversationList');
    const drawList = () => { list.innerHTML = inquiries.map(item => `<article class="psCompleteItem"><strong>${item.name || 'Customer'} · ${item.email || ''}</strong><span>${item.status || 'New'} · ${item.unreadCount || 0} unread</span><p>${String(item.message || '').slice(0,180)}</p><button class="psCompleteBtn" data-id="${item._id}">Open conversation</button></article>`).join(''); list.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => openConversation(btn.dataset.id, body))); };
    drawList();
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${error.response?.data?.message || 'Unable to load conversations.'}</div>`; }
});

const openConversation = async (id, body) => {
  body.innerHTML = '<div class="psCompleteEmpty">Loading messages…</div>';
  try {
    const response = await api.get(`/inquiries/${id}/messages`); const data = response.data?.data || {}; const inquiry = data.inquiry || {}; const messages = data.messages || [];
    body.innerHTML = `<button class="psCompleteBtn" id="psBack">← All conversations</button><h3>${inquiry.name || 'Customer'} · ${inquiry.email || ''}</h3><div class="psConversation"><div class="psMessages" id="psMessages">${messages.map(m => `<div class="psMsg ${m.senderType === 'admin' ? 'admin' : 'customer'}"><small>${m.senderName || m.senderType}</small>${String(m.message || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`).join('') || '<div class="psCompleteEmpty">No messages yet.</div>'}</div><form class="psReply"><textarea maxlength="5000" placeholder="Write a reply…" required></textarea><button class="psCompleteBtn" type="submit">Send</button></form></div>`;
    body.querySelector('#psBack').addEventListener('click', openConversations);
    const messagesBox = body.querySelector('#psMessages'); messagesBox.scrollTop = messagesBox.scrollHeight;
    body.querySelector('.psReply').addEventListener('submit', async e => { e.preventDefault(); const textarea = e.currentTarget.querySelector('textarea'); const message = textarea.value.trim(); if (!message) return; const button = e.currentTarget.querySelector('button'); button.disabled = true; button.textContent = 'Sending…'; try { await api.post(`/inquiries/${id}/messages`, { message }); await openConversation(id, body); } catch (error) { button.disabled = false; button.textContent = 'Send'; alert(error.response?.data?.message || 'Unable to send message.'); } });
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${error.response?.data?.message || 'Unable to load this conversation.'}</div>`; }
};

const openAccount = async () => showPanel('Account & Settings', 'Manage your administrator profile and session.', async body => {
  try {
    const response = await api.get('/auth/me'); const user = response.data?.data?.user || {};
    body.innerHTML = `<form id="psAccountForm"><label>Name</label><input class="psCompleteSearch" name="name" value="${String(user.name || '').replace(/"/g,'&quot;')}" required><label>Email</label><input class="psCompleteSearch" value="${user.email || ''}" disabled><label>New password (optional)</label><input class="psCompleteSearch" name="password" type="password" minlength="8" placeholder="Leave blank to keep current password"><button class="psCompleteBtn" type="submit">Save account</button><p id="psAccountMsg"></p></form>`;
    body.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); const form = new FormData(e.currentTarget); const payload = { name: form.get('name') }; if (form.get('password')) payload.password = form.get('password'); const msg = body.querySelector('#psAccountMsg'); try { await api.put('/auth/profile', payload); msg.textContent = 'Account updated successfully.'; } catch (error) { msg.textContent = error.response?.data?.message || 'Unable to update account.'; } });
  } catch (error) { body.innerHTML = `<div class="psCompleteError">${error.response?.data?.message || 'Unable to load account.'}</div>`; }
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
