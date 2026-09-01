import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Box, ClipboardList, LogOut, Mail, Settings, ShieldCheck } from 'lucide-react';
import api, { getStoredAuthUser, saveAuthUser, clearAuthUser } from '../services/api.js';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const nav = useNavigate();
  const storedUser = getStoredAuthUser();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/customer/dashboard');
      const payload = response?.data?.data;

      if (!payload || !payload.user) {
        throw new Error('The dashboard response is missing account data.');
      }

      const normalized = {
        user: payload.user,
        stats: {
          products: Number(payload.stats?.products ?? payload.products?.length ?? 0),
          requests: Number(payload.stats?.requests ?? payload.requests?.length ?? 0),
        },
        products: Array.isArray(payload.products) ? payload.products : [],
        requests: Array.isArray(payload.requests) ? payload.requests : [],
      };

      saveAuthUser(normalized.user);
      window.dispatchEvent(new Event('primeStackAuthChanged'));
      setDashboard(normalized);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        clearAuthUser();
        nav('/login', { replace: true });
        return;
      }
      if (status === 403) {
        setError('This account is not a customer account. Please sign in with the correct account.');
        return;
      }
      setError(err.response?.data?.message || err.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Local session is still cleared if the API is unavailable.
    } finally {
      clearAuthUser();
      window.dispatchEvent(new Event('primeStackAuthChanged'));
      nav('/login', { replace: true });
    }
  };

  if (loading) {
    return <div className="dashboardLoading">Loading your workspace...</div>;
  }

  if (error) {
    return (
      <div className="dashboardLoading">
        <div>
          <p className="error">{error}</p>
          <button className="btn primary" type="button" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  const user = dashboard?.user || storedUser || {};
  const stats = dashboard?.stats || { products: 0, requests: 0 };
  const products = dashboard?.products || [];
  const requests = dashboard?.requests || [];
  const firstName = user.name?.trim()?.split(/\s+/)[0] || 'there';
  const initials = (user.name || 'Customer').trim().charAt(0).toUpperCase();

  return (
    <div className="customerShell">
      <aside className="dashboardSide">
        <Link className="dashboardBrand" to="/">
          <span className="logo">&lt;/&gt;</span>
          <span>primeStack</span>
        </Link>

        <nav aria-label="Customer workspace">
          <Link className="active" to="/dashboard"><Box />Overview</Link>
          <Link to="/products"><ClipboardList />Products</Link>
          <Link to="/dashboard/settings"><Settings />Account settings</Link>
        </nav>

        <div className="dashboardHelp">
          <strong>Need help?</strong>
          <p>Talk to the primeStack team about your next project.</p>
          <Link to="/contact">Contact team <ArrowRight size={13} /></Link>
        </div>

        <button className="sideLogout" type="button" onClick={logout}>
          <LogOut />
          <span>Sign out</span>
        </button>
      </aside>

      <main className="customerMain">
        <header className="dashboardHeader">
          <div>
            <span className="eyebrow">CUSTOMER WORKSPACE</span>
            <h1>Good to see you, {firstName}.</h1>
            <p>Manage your products, account and conversations with primeStack.</p>
          </div>

          <div className="profileChip">
            <span>{initials}</span>
            <div>
              <b>{user.name || 'Customer'}</b>
              <small>{user.email || ''}</small>
            </div>
          </div>
        </header>

        <section className="customerStats" aria-label="Account summary">
          <div>
            <span>Account</span>
            <strong>Active</strong>
            <small><ShieldCheck size={14} /> Account protected</small>
          </div>
          <div>
            <span>Products</span>
            <strong>{stats.products}</strong>
            <small>Available to you</small>
          </div>
          <div>
            <span>Requests</span>
            <strong>{stats.requests}</strong>
            <small>Contact enquiries</small>
          </div>
          <div>
            <span>Security</span>
            <strong>Protected</strong>
            <small><ShieldCheck size={14} /> Secure account access</small>
          </div>
        </section>

        <section className="dashboardSection">
          <div className="dashboardSectionHead">
            <div>
              <span className="eyebrow">YOUR PRODUCTS</span>
              <h2>Products &amp; services</h2>
              <p>Software available in your primeStack workspace.</p>
            </div>
            <Link to="/products">View catalog <ArrowRight size={16} /></Link>
          </div>

          {products.length ? (
            <div className="dashboardProductGrid">
              {products.map((product) => (
                <Link className="dashboardProduct" key={product._id || product.slug} to={`/products/${product.slug}`}>
                  <span className="pill">{product.category || 'Business'} · {product.status || 'Live'}</span>
                  <h3>{product.name || 'Product'}</h3>
                  <p>{product.tagline || product.description || 'Explore this primeStack product.'}</p>
                  <span>View product <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboardEmpty">
              <Box />
              <h3>No products available yet</h3>
              <p>Products published by primeStack will appear here.</p>
              <Link className="btn primary" to="/products">Browse catalog <ArrowRight size={15} /></Link>
            </div>
          )}
        </section>

        <section className="dashboardSection">
          <div className="dashboardSectionHead">
            <div>
              <span className="eyebrow">ACTIVITY</span>
              <h2>Recent enquiries</h2>
              <p>Keep track of conversations with the primeStack team.</p>
            </div>
            <Link to="/contact">New enquiry <ArrowRight size={16} /></Link>
          </div>

          {requests.length ? (
            <div className="requestList">
              {requests.map((request) => {
                const status = request.status || 'New';
                const statusClass = status.toLowerCase().replace(/\s+/g, '-');
                return (
                  <div className="requestItem" key={request._id || `${request.email}-${request.createdAt}`}>
                    <div>
                      <b>{request.projectType || 'General enquiry'}</b>
                      <p>{request.message || 'No message provided.'}</p>
                    </div>
                    <span className={`status status-${statusClass}`}>{status}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboardEmpty">
              <Mail />
              <h3>No enquiries yet</h3>
              <p>Have a software idea or business challenge? Start a conversation with the primeStack team.</p>
              <Link className="btn primary" to="/contact">Start a conversation <ArrowRight size={15} /></Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
