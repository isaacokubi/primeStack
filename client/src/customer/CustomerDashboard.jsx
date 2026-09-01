import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Box, ClipboardList, LogOut, Mail, Settings, ShieldCheck } from 'lucide-react';
import api, { getStoredAuthUser, saveAuthUser, clearAuthUser, siteSettingsApi } from '../services/api.js';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const nav = useNavigate();
  const storedUser = getStoredAuthUser();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState({ name: 'primeStack' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardResponse, catalogResponse] = await Promise.all([
        api.get('/customer/dashboard'),
        api.get('/products', { params: { page: 1, limit: 50 } })
      ]);

      const payload = dashboardResponse?.data?.data;
      if (!payload || !payload.user) throw new Error('The dashboard response is missing account data.');

      const catalog = catalogResponse?.data?.data;
      const catalogMeta = catalogResponse?.data?.meta || {};
      const catalogProducts = Array.isArray(catalog) ? catalog : [];
      const dashboardProducts = Array.isArray(payload.products) ? payload.products : [];
      const products = catalogProducts.length ? catalogProducts : dashboardProducts;

      const normalized = {
        user: payload.user,
        stats: { products: Number(catalogMeta.total ?? products.length), requests: Number(payload.stats?.requests ?? payload.requests?.length ?? 0) },
        products,
        requests: Array.isArray(payload.requests) ? payload.requests : [],
      };
      saveAuthUser(normalized.user);
      window.dispatchEvent(new Event('primeStackAuthChanged'));
      setDashboard(normalized);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) { clearAuthUser(); nav('/login', { replace: true }); return; }
      if (status === 403) { setError('This account is not a customer account. Please sign in with the correct account.'); return; }
      setError(err.response?.data?.message || err.message || 'Unable to load your dashboard.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); siteSettingsApi.get().then(r=>setSite({name:r.data?.data?.name||'primeStack'})).catch(()=>{}); }, []);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {} finally {
      clearAuthUser();
      window.dispatchEvent(new Event('primeStackAuthChanged'));
      nav('/login', { replace: true });
    }
  };

  if (loading) return <div className="dashboardLoading">Loading your workspace...</div>;
  if (error) return <div className="dashboardLoading"><div><p className="error">{error}</p><button className="btn primary" type="button" onClick={load}>Retry</button></div></div>;

  const user = dashboard?.user || storedUser || {};
  const stats = dashboard?.stats || { products: 0, requests: 0 };
  const products = dashboard?.products || [];
  const requests = dashboard?.requests || [];
  const firstName = user.name?.trim()?.split(/\s+/)[0] || 'there';
  const initials = (user.name || 'Customer').trim().charAt(0).toUpperCase();

  return (
    <div className="customerShell">
      <aside className="dashboardSide">
        <Link className="dashboardBrand" to="/"><span className="logo">&lt;/&gt;</span><span>{site.name}</span></Link>
        <nav aria-label="Customer workspace">
          <Link className="active" to="/dashboard"><Box />Overview</Link>
          <Link to="/products"><ClipboardList />Products</Link>
          <Link to="/dashboard/settings"><Settings />Account settings</Link>
        </nav>
        <div className="dashboardHelp"><strong>Need help?</strong><p>Talk to the {site.name} team about your next project.</p><Link to="/contact">Contact team <ArrowRight size={13} /></Link></div>
        <button className="sideLogout" type="button" onClick={logout}><LogOut /><span>Sign out</span></button>
      </aside>

      <div className="customerMain">
        <header className="dashboardHeader">
          <div><span className="eyebrow">CUSTOMER WORKSPACE</span><h1>Good to see you, {firstName}.</h1><p>Manage your products, account and conversations with {site.name}.</p></div>
          <div className="profileChip"><span>{initials}</span><div><b>{user.name || 'Customer'}</b><small>{user.email || ''}</small></div></div>
        </header>

        <section className="customerStats" aria-label="Account summary">
          <div><span>Account</span><strong>Active</strong><small><ShieldCheck size={14} /> Account protected</small></div>
          <div><span>Products</span><strong>{stats.products}</strong><small>Available to you</small></div>
          <div><span>Requests</span><strong>{stats.requests}</strong><small>Contact enquiries</small></div>
          <div><span>Security</span><strong>Protected</strong><small><ShieldCheck size={14} /> Secure account access</small></div>
        </section>

        <section className="dashboardSection">
          <div className="dashboardSectionHead"><div><span className="eyebrow">YOUR PRODUCTS</span><h2>Products &amp; services</h2><p>Software available in your {site.name} workspace.</p></div><Link to="/products">View catalog <ArrowRight size={16} /></Link></div>
          {products.length ? <div className="dashboardProductGrid">{products.map(product => <Link className="dashboardProduct" key={product._id || product.slug} to={`/products/${product.slug}`}><span className="pill">{product.category || 'Business'} · {product.status || 'Live'}</span><h3>{product.name || 'Product'}</h3><p>{product.tagline || product.description || `Explore this ${site.name} product.`}</p><span>View product <ArrowRight size={15} /></span></Link>)}</div> : <div className="dashboardEmpty"><Box /><h3>No products available yet</h3><p>Products published by {site.name} will appear here.</p><Link className="btn primary" to="/products">Browse catalog <ArrowRight size={15} /></Link></div>}
        </section>

        <section className="dashboardSection">
          <div className="dashboardSectionHead"><div><span className="eyebrow">ACTIVITY</span><h2>Recent enquiries</h2><p>Keep track of conversations with the {site.name} team.</p></div><Link to="/contact">New enquiry <ArrowRight size={16} /></Link></div>
          {requests.length ? <div className="requestList">{requests.map(request => { const status = request.status || 'New'; return <div className="requestItem" key={request._id || `${request.email}-${request.createdAt}`}><div><b>{request.projectType || 'General enquiry'}</b><p>{request.message || 'No message provided.'}</p></div><span className={`status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span></div>; })}</div> : <div className="dashboardEmpty"><Mail /><h3>No enquiries yet</h3><p>Have a software idea or business challenge? Start a conversation with the {site.name} team.</p><Link className="btn primary" to="/contact">Start a conversation <ArrowRight size={15} /></Link></div>}
        </section>
      </div>
    </div>
  );
}
