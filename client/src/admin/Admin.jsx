import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import SiteCustomizer from './SiteCustomizer.jsx';
import './Admin.css';

const NAV = [
  ['overview', 'Overview', '⌂'],
  ['website', 'Website builder', '◉'],
  ['products', 'Products', '▦'],
  ['blog', 'Blog posts', '✎'],
  ['case-studies', 'Case studies', '◈'],
  ['jobs', 'Careers', '⌁'],
  ['testimonials', 'Testimonials', '♡'],
  ['contacts', 'Inquiries', '✦'],
];

const productBlank = {
  name: '', slug: '', tagline: '', description: '', longDescription: '',
  category: 'Business', status: 'Live', featured: false, published: true,
  websiteUrl: '', documentationUrl: '', features: [{ title: '', description: '' }],
};

const contentBlank = {
  title: '', slug: '', description: '', content: '', category: '', industry: '',
  department: '', location: '', employmentType: '', experienceLevel: '',
  challenge: '', solution: '', technologies: '', results: '', requirements: '',
  responsibilities: '', coverImage: '', author: '', published: true,
};

const testimonialBlank = {
  quote: '', customerName: '', position: '', company: '', photo: '', featured: false,
};

const clone = value => JSON.parse(JSON.stringify(value));
const csv = value => String(value || '').split(',').map(v => v.trim()).filter(Boolean);
const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const blankFor = tab => tab === 'products'
  ? clone(productBlank)
  : tab === 'testimonials'
    ? clone(testimonialBlank)
    : clone(contentBlank);

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(clone(productBlank));
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState(false);

  const isProduct = tab === 'products';
  const isTestimonial = tab === 'testimonials';
  const isContent = ['blog', 'case-studies', 'jobs'].includes(tab);
  const canDelete = user?.role === 'Admin';
  const title = useMemo(() => NAV.find(([key]) => key === tab)?.[1] || 'Overview', [tab]);

  const load = useCallback(async () => {
    try {
      setError('');
      const me = await api.get('/auth/me');
      const currentUser = me.data?.data?.user;
      if (!currentUser || !['Admin', 'Editor'].includes(currentUser.role)) {
        setUser(false);
        return;
      }
      setUser(currentUser);

      const requests = [api.get('/dashboard/stats').catch(() => ({ data: { data: {} } }))];
      if (tab === 'contacts') requests.push(api.get('/contact'));
      else if (isProduct) requests.push(api.get('/products', { params: { limit: 100 } }));
      else if (isTestimonial) requests.push(api.get('/testimonials'));
      else if (isContent) requests.push(api.get(`/${tab}`));

      const [statsResponse, dataResponse] = await Promise.all(requests);
      setStats(statsResponse.data?.data || {});

      if (tab === 'contacts') setContacts(dataResponse?.data?.data || []);
      else if (tab !== 'overview' && tab !== 'website') setItems(dataResponse?.data?.data || []);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) setUser(false);
      else setError(err.response?.data?.message || 'Unable to load the workspace.');
    }
  }, [tab, isProduct, isTestimonial, isContent]);

  useEffect(() => { load(); }, [load]);

  const reset = useCallback((targetTab = tab) => {
    setEditing(null);
    setSearch('');
    setNotice('');
    setError('');
    setForm(blankFor(targetTab));
  }, [tab]);

  const openTab = targetTab => {
    setTab(targetTab);
    setMobile(false);
    if (targetTab !== 'website' && targetTab !== 'overview') reset(targetTab);
    else {
      setEditing(null);
      setNotice('');
      setError('');
    }
  };

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const edit = item => {
    if (!item?._id) return;
    setEditing(item._id);
    if (isProduct) {
      setForm({ ...clone(productBlank), ...item, features: item.features?.length ? item.features : [{ title: '', description: '' }] });
    } else if (isTestimonial) {
      setForm({ ...clone(testimonialBlank), ...item });
    } else {
      setForm({
        ...clone(contentBlank),
        ...item,
        technologies: (item.technologies || []).join(', '),
        results: (item.results || []).join(', '),
        requirements: (item.requirements || []).join(', '),
        responsibilities: (item.responsibilities || []).join(', '),
      });
    }
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async event => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const body = { ...form };
      if (isProduct) {
        body.slug = body.slug || slugify(body.name);
        body.features = (body.features || []).filter(feature => feature.title || feature.description);
      }
      if (isContent) {
        body.slug = body.slug || slugify(body.title);
        body.type = tab;
        ['technologies', 'results', 'requirements', 'responsibilities'].forEach(key => { body[key] = csv(body[key]); });
        if (!editing) body.publishedAt = new Date().toISOString();
      }

      const endpoint = isProduct ? '/products' : isTestimonial ? '/testimonials' : `/${tab}`;
      if (editing) await api.put(`${endpoint}/${editing}`, body);
      else await api.post(endpoint, body);

      setNotice(editing ? 'Changes saved successfully.' : 'Created successfully.');
      reset(tab);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this item.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async id => {
    if (!canDelete || !id || deletingId) return;
    if (!window.confirm('Delete this item permanently? This cannot be undone.')) return;
    setDeletingId(id);
    setNotice('');
    setError('');
    try {
      const endpoint = isProduct ? '/products' : isTestimonial ? '/testimonials' : `/${tab}`;
      await api.delete(`${endpoint}/${id}`);
      if (editing === id) reset(tab);
      setNotice('Deleted successfully.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete this item.');
    } finally {
      setDeletingId(null);
    }
  };

  const updateContactStatus = async (id, status) => {
    if (!id || statusBusyId) return;
    setStatusBusyId(id);
    setNotice('');
    setError('');
    try {
      await api.put(`/contact/${id}`, { status });
      setContacts(current => current.map(contact => contact._id === id ? { ...contact, status } : contact));
      setNotice('Inquiry status updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update inquiry status.');
    } finally {
      setStatusBusyId(null);
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } finally { navigate('/login?mode=admin', { replace: true }); }
  };

  const filtered = items.filter(item => String(item.name || item.title || item.customerName || '').toLowerCase().includes(search.toLowerCase()));

  if (user === false) return <div className="loading"><h2>Admin authentication required</h2><button className="btn primary" onClick={() => navigate('/login?mode=admin')}>Sign in as Admin</button></div>;
  if (!user) return <div className="loading">Loading PrimeStack CMS…</div>;

  return (
    <div className="adminPro"><div className="adminProLayout">
      <aside className={`adminProSidebar ${mobile ? 'open' : ''}`}>
        <div className="adminProBrand"><span className="adminProLogo">P</span><div><strong>primeStack</strong><span>CMS · Control Center</span></div></div>
        <div className="adminProSectionLabel">Workspace</div>
        <nav className="adminProNav">
          {NAV.map(([key, label, icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => openTab(key)}><span className="adminProNavIcon">{icon}</span>{label}{key === 'contacts' && stats.newContacts > 0 ? <em className="adminProBadge">{stats.newContacts}</em> : null}</button>)}
        </nav>
        <div className="adminProSidebarBottom"><div className="adminProUser"><span className="adminProAvatar">{(user.name || 'A')[0].toUpperCase()}</span><div><strong>{user.name || 'Admin'}</strong><span>{user.role}</span></div></div><button className="adminProSignout" onClick={logout}>Sign out</button></div>
      </aside>

      <main className="adminProMain">
        <header className="adminProTopbar"><button className="adminProMenu" onClick={() => setMobile(value => !value)}>☰</button><div className="adminProCrumb"><small>PRIMESTACK CMS</small><strong>{title}</strong></div><div className="adminProTopActions"><Link className="adminProView" to="/">↗ View website</Link><span className="adminProProfile"><span className="adminProAvatar">{(user.name || 'A')[0].toUpperCase()}</span>{user.name}</span></div></header>
        <div className="adminProContent">
          {notice && <div className="adminProNotice adminProSuccess">✓ {notice}</div>}
          {error && <div className="adminProNotice adminProError">! {error}</div>}

          {tab === 'website' ? <SiteCustomizer /> : tab === 'overview' ? <>
            <section className="adminProHero"><div><span className="adminProEyebrow">ADMIN WORKSPACE</span><h1>Welcome back, {user.name?.split(' ')[0] || 'Admin'}.</h1><p>Manage content, customize the entire website and keep your business presence current.</p></div><div className="adminProActions"><button className="adminProBtn adminProBtnPrimary" onClick={() => openTab('website')}>Customize website</button><button className="adminProBtn" onClick={() => openTab('products')}>＋ New product</button></div></section>
            <section className="adminProKpis">{[['products', 'Products', stats.products || 0], ['blog', 'Blog posts', stats.blog || 0], ['case-studies', 'Case studies', stats.caseStudies || 0], ['jobs', 'Open jobs', stats.jobs || 0], ['contacts', 'New inquiries', stats.newContacts || 0]].map(([key, label, value]) => <button className="adminProKpi" key={key} onClick={() => openTab(key)}><div className="adminProKpiTop"><span>{NAV.find(x => x[0] === key)?.[2]}</span><span className="adminProKpiLabel">{label}</span></div><strong>{value}</strong><small>Open workspace</small></button>)}</section>
            <section className="adminProGrid"><div className="adminProPanel"><div className="adminProPanelHead"><div><span className="adminProEyebrow">WEBSITE</span><h2>Visual control</h2></div></div><div className="adminProShortcuts"><button className="adminProShortcut" onClick={() => openTab('website')}><strong>◉ Website builder</strong><span>Brand, colors, copy and page sections →</span></button><Link className="adminProShortcut" to="/"><strong>↗ Live website</strong><span>Preview the published experience →</span></Link></div></div><div className="adminProPanel"><div className="adminProPanelHead"><div><span className="adminProEyebrow">SYSTEM</span><h2>System health</h2></div></div><div className="adminProSystem"><div className="adminProSystemRow"><span>API</span><b className="adminProOnline">● Operational</b></div><div className="adminProSystemRow"><span>Account</span><b>{user.email}</b></div><div className="adminProSystemRow"><span>Role</span><b>{user.role}</b></div></div></div></section>
          </> : <>
            <section className="adminProPageHead"><div><span className="adminProEyebrow">CONTENT MANAGEMENT</span><h1>{title}</h1><p>Create, edit, publish and remove {title.toLowerCase()}.</p></div>{tab !== 'contacts' && <button type="button" className="adminProBtn adminProBtnPrimary" onClick={() => reset(tab)}>＋ Add {title.replace(/s$/, '')}</button>}</section>
            {tab !== 'contacts' && <div className="adminProToolbar"><div className="adminProSearch">⌕<input placeholder={`Search ${title.toLowerCase()}…`} value={search} onChange={event => setSearch(event.target.value)} /></div><span>{filtered.length} items</span></div>}

            {tab === 'contacts' ? <div className="adminProContacts"><div className="adminProPanelHead"><span className="adminProEyebrow">LEADS</span><h2>Contact inquiries</h2></div>{contacts.map(contact => <div className="adminProContact" key={contact._id}><div><strong>{contact.name} · {contact.email}</strong><span>{contact.company || 'No company'} · {contact.projectType || 'General'} · {contact.createdAt ? new Date(contact.createdAt).toLocaleString() : ''}</span><p>{contact.message}</p></div><div className="adminProContactActions"><select value={contact.status || 'New'} disabled={statusBusyId === contact._id} onChange={event => updateContactStatus(contact._id, event.target.value)}><option>New</option><option>Contacted</option><option>In Progress</option><option>Converted</option><option>Closed</option></select><button type="button" className="adminProContactDelete" disabled={!canDelete || deletingId === contact._id} title={canDelete ? 'Delete inquiry permanently' : 'Only an Admin can delete inquiries'} onClick={() => remove(contact._id)}>{deletingId === contact._id ? 'Deleting…' : 'Delete'}</button></div></div>)}{!contacts.length && <div className="adminProEmpty">No inquiries yet.</div>}</div> : <>
              <form className="adminProForm" onSubmit={save}>
                <div className="adminProFormHead"><div><span className="adminProEyebrow">{editing ? 'EDIT' : 'CREATE'} · {title.toUpperCase()}</span><h2>{editing ? 'Edit item' : `New ${title.replace(/s$/, '')}`}</h2></div></div>
                {isProduct && <div className="adminProFields"><input className="adminProInput" placeholder="Product name" value={form.name || ''} onChange={event => setField('name', event.target.value)} /><input className="adminProInput" placeholder="Slug (optional)" value={form.slug || ''} onChange={event => setField('slug', event.target.value)} /><input className="adminProInput" placeholder="Tagline" value={form.tagline || ''} onChange={event => setField('tagline', event.target.value)} /><input className="adminProInput" placeholder="Category" value={form.category || ''} onChange={event => setField('category', event.target.value)} /><input className="adminProInput" placeholder="Product URL" value={form.websiteUrl || ''} onChange={event => setField('websiteUrl', event.target.value)} /><input className="adminProInput" placeholder="Documentation URL" value={form.documentationUrl || ''} onChange={event => setField('documentationUrl', event.target.value)} /><select value={form.status || 'Live'} onChange={event => setField('status', event.target.value)}><option>Live</option><option>Beta</option><option>Coming Soon</option><option>Archived</option></select><label><input type="checkbox" checked={form.published !== false} onChange={event => setField('published', event.target.checked)} /> Published</label><label><input type="checkbox" checked={form.featured === true} onChange={event => setField('featured', event.target.checked)} /> Featured</label><textarea placeholder="Short description" value={form.description || ''} onChange={event => setField('description', event.target.value)} /><textarea placeholder="Long description" value={form.longDescription || ''} onChange={event => setField('longDescription', event.target.value)} /></div>}
                {isContent && <div className="adminProFields">{[['title', 'Title'], ['slug', 'Slug (optional)'], ['category', 'Category'], ['industry', 'Industry'], ['department', 'Department'], ['location', 'Location'], ['employmentType', 'Employment type'], ['experienceLevel', 'Experience level'], ['author', 'Author'], ['coverImage', 'Cover image URL']].map(([key, label]) => <input className="adminProInput" key={key} placeholder={label} value={form[key] || ''} onChange={event => setField(key, event.target.value)} />)}<textarea placeholder="Description / excerpt" value={form.description || ''} onChange={event => setField('description', event.target.value)} /><textarea placeholder="Main content" value={form.content || ''} onChange={event => setField('content', event.target.value)} /><textarea placeholder="Challenge" value={form.challenge || ''} onChange={event => setField('challenge', event.target.value)} /><textarea placeholder="Solution" value={form.solution || ''} onChange={event => setField('solution', event.target.value)} /><input className="adminProInput" placeholder="Technologies (comma separated)" value={form.technologies || ''} onChange={event => setField('technologies', event.target.value)} /><input className="adminProInput" placeholder="Results (comma separated)" value={form.results || ''} onChange={event => setField('results', event.target.value)} /><input className="adminProInput" placeholder="Requirements (comma separated)" value={form.requirements || ''} onChange={event => setField('requirements', event.target.value)} /><input className="adminProInput" placeholder="Responsibilities (comma separated)" value={form.responsibilities || ''} onChange={event => setField('responsibilities', event.target.value)} /><label><input type="checkbox" checked={form.published !== false} onChange={event => setField('published', event.target.checked)} /> Published</label></div>}
                {isTestimonial && <div className="adminProFields"><textarea placeholder="Customer quote" value={form.quote || ''} onChange={event => setField('quote', event.target.value)} /><input className="adminProInput" placeholder="Customer name" value={form.customerName || ''} onChange={event => setField('customerName', event.target.value)} /><input className="adminProInput" placeholder="Position" value={form.position || ''} onChange={event => setField('position', event.target.value)} /><input className="adminProInput" placeholder="Company" value={form.company || ''} onChange={event => setField('company', event.target.value)} /><input className="adminProInput" placeholder="Photo URL" value={form.photo || ''} onChange={event => setField('photo', event.target.value)} /><label><input type="checkbox" checked={form.featured === true} onChange={event => setField('featured', event.target.checked)} /> Featured</label></div>}
                <div className="adminProFormFooter"><button type="submit" className="adminProBtn adminProBtnPrimary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create item'}</button>{editing && <button type="button" className="adminProBtn" disabled={busy} onClick={() => reset(tab)}>Cancel</button>}</div>
              </form>
              <div className="adminProLibrary"><div className="adminProLibraryHead"><h2>Library</h2></div>{filtered.map(item => <div className="adminProRow" key={item._id}><div className="adminProIdentity"><span className="adminProRowIcon">{isProduct ? '▦' : isTestimonial ? '♡' : '◈'}</span><div><strong>{item.name || item.title || item.customerName}</strong><span>{item.category || item.industry || item.company || item.status || 'Published'}</span></div></div><div className="adminProRowActions"><button type="button" className="adminProBtn" disabled={busy || deletingId === item._id} title="Edit this item" onClick={() => edit(item)}>Edit</button>{canDelete && <button type="button" className="adminProDelete" disabled={busy || deletingId === item._id} title="Delete this item permanently" onClick={() => remove(item._id)}>{deletingId === item._id ? 'Deleting…' : 'Delete'}</button>}</div></div>)}{!filtered.length && <div className="adminProEmpty">No items found.</div>}</div>
            </>}
          </>}
        </div>
      </main>
    </div></div>
  );
}