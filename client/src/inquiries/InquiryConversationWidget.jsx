import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, X, RefreshCw, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api, { getStoredAuthUser } from '../services/api.js';
import './InquiryConversationWidget.css';

const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'];

const formatDate = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

export default function InquiryConversationWidget() {
  const location = useLocation();
  const user = getStoredAuthUser();
  const isAdmin = ['Admin', 'Editor'].includes(user?.role);
  const isCustomer = user?.role === 'Customer';
  const enabled = isAdmin ? location.pathname.startsWith('/admin') : isCustomer && location.pathname.startsWith('/dashboard');

  const [open, setOpen] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const listEndpoint = isAdmin ? '/inquiries/admin/inquiries' : '/inquiries/customer/inquiries';
  const unreadTotal = useMemo(() => inquiries.reduce((sum, inquiry) => sum + Number(inquiry.unreadCount || 0), 0), [inquiries]);

  const loadInquiries = useCallback(async () => {
    if (!enabled || !user) return;
    try {
      const response = await api.get(listEndpoint);
      setInquiries(response.data?.data || []);
    } catch (err) {
      if (err.response?.status !== 401) setError(err.response?.data?.message || 'Unable to load inquiries.');
    }
  }, [enabled, listEndpoint, user]);

  const loadConversation = useCallback(async id => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/inquiries/${id}/messages`);
      setConversation(response.data?.data || null);
      setInquiries(current => current.map(item => item._id === id ? { ...item, unreadCount: 0 } : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this conversation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    loadInquiries();
    const timer = window.setInterval(loadInquiries, 15000);
    return () => window.clearInterval(timer);
  }, [enabled, loadInquiries]);

  useEffect(() => {
    if (!open || !selectedId) return undefined;
    loadConversation(selectedId);
    const timer = window.setInterval(() => loadConversation(selectedId), 8000);
    return () => window.clearInterval(timer);
  }, [open, selectedId, loadConversation]);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      setSelectedId(null);
      setConversation(null);
    }
  }, [enabled]);

  if (!enabled) return null;

  const selectInquiry = id => {
    setSelectedId(id);
    setConversation(null);
    setMessage('');
    loadConversation(id);
  };

  const sendMessage = async event => {
    event.preventDefault();
    const text = message.trim();
    if (!selectedId || !text || sending) return;

    setSending(true);
    setError('');
    try {
      await api.post(`/inquiries/${selectedId}/messages`, { message: text });
      setMessage('');
      await loadConversation(selectedId);
      await loadInquiries();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async status => {
    if (!selectedId || !isAdmin || user?.role !== 'Admin') return;
    try {
      setError('');
      await api.put(`/contact/${selectedId}`, { status });
      await Promise.all([loadConversation(selectedId), loadInquiries()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update inquiry status.');
    }
  };

  const currentInquiry = conversation?.inquiry || inquiries.find(item => item._id === selectedId);

  return (
    <div className={`inquiryWidget ${open ? 'is-open' : ''}`}>
      {!open && (
        <button className="inquiryWidgetLauncher" type="button" onClick={() => setOpen(true)} aria-label={isAdmin ? 'Open customer inquiries' : 'Open conversations'}>
          <MessageCircle size={21} />
          <span>{isAdmin ? 'Conversations' : 'Messages'}</span>
          {unreadTotal > 0 && <b>{unreadTotal > 99 ? '99+' : unreadTotal}</b>}
        </button>
      )}

      {open && (
        <section className="inquiryWidgetPanel" aria-label={isAdmin ? 'Customer inquiry conversations' : 'Customer conversations'}>
          <header className="inquiryWidgetHeader">
            <div>
              <span>{isAdmin ? 'PRIMESTACK CMS' : 'PRIMESTACK SUPPORT'}</span>
              <h2>{isAdmin ? 'Inquiry conversations' : 'Your conversations'}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close conversations"><X size={19} /></button>
          </header>

          {error && <div className="inquiryWidgetError">{error}</div>}

          <div className="inquiryWidgetBody">
            <aside className={`inquiryList ${selectedId ? 'has-selection' : ''}`}>
              <div className="inquiryListTop">
                <strong>{inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}</strong>
                <button type="button" onClick={loadInquiries} title="Refresh inquiries"><RefreshCw size={15} /></button>
              </div>
              {inquiries.length ? inquiries.map(inquiry => (
                <button type="button" key={inquiry._id} className={`inquiryListItem ${selectedId === inquiry._id ? 'selected' : ''}`} onClick={() => selectInquiry(inquiry._id)}>
                  <span className="inquiryAvatar">{String(inquiry.name || '?').trim().charAt(0).toUpperCase()}</span>
                  <span className="inquiryListCopy">
                    <strong>{inquiry.name || 'Customer'}</strong>
                    <small>{inquiry.projectType || 'General enquiry'} · {formatDate(inquiry.updatedAt || inquiry.createdAt)}</small>
                    <em>{inquiry.message || 'No message provided.'}</em>
                  </span>
                  <span className="inquiryListMeta">
                    <i>{inquiry.status || 'New'}</i>
                    {Number(inquiry.unreadCount || 0) > 0 && <b>{inquiry.unreadCount}</b>}
                  </span>
                </button>
              )) : <div className="inquiryWidgetEmpty"><MessageCircle size={25} /><strong>No conversations yet</strong><p>{isAdmin ? 'Customer enquiries will appear here.' : 'Your enquiries and replies will appear here.'}</p></div>}
            </aside>

            <main className={`inquiryConversation ${selectedId ? 'active' : ''}`}>
              {!selectedId ? (
                <div className="inquiryWidgetEmpty inquiryConversationEmpty"><MessageCircle size={32} /><h3>{isAdmin ? 'Select an inquiry' : 'Select a conversation'}</h3><p>{isAdmin ? 'Open an inquiry to reply, discuss requirements and move it through the workflow.' : 'Choose an inquiry to continue the conversation with the primeStack team.'}</p></div>
              ) : loading && !conversation ? (
                <div className="inquiryWidgetEmpty"><RefreshCw className="spin" size={25} /><p>Loading conversation…</p></div>
              ) : (
                <>
                  <div className="inquiryConversationHeader">
                    <button type="button" className="inquiryBack" onClick={() => { setSelectedId(null); setConversation(null); }}><ChevronLeft size={17} /> Back</button>
                    <div className="inquiryConversationIdentity">
                      <strong>{currentInquiry?.name || 'Customer'}</strong>
                      <small>{currentInquiry?.email || ''}</small>
                    </div>
                    {isAdmin && user?.role === 'Admin' && currentInquiry && <select value={currentInquiry.status || 'New'} onChange={event => updateStatus(event.target.value)} aria-label="Inquiry status">{STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}</select>}
                  </div>

                  <div className="inquiryMessages">
                    {currentInquiry?.message && (
                      <div className="inquiryMessage customer initial">
                        <span>{currentInquiry.name || 'Customer'}</span>
                        <p>{currentInquiry.message}</p>
                        <small>{formatDate(currentInquiry.createdAt)}</small>
                      </div>
                    )}
                    {(conversation?.messages || []).map(item => (
                      <div className={`inquiryMessage ${item.senderType === 'admin' ? 'admin' : 'customer'}`} key={item._id}>
                        <span>{item.senderName || (item.senderType === 'admin' ? 'PrimeStack Admin' : currentInquiry?.name || 'Customer')}</span>
                        <p>{item.message}</p>
                        <small>{formatDate(item.createdAt)}</small>
                      </div>
                    ))}
                  </div>

                  {currentInquiry?.status === 'Closed' ? (
                    <div className="inquiryClosed"><CheckCircle2 size={17} /><span>This conversation is closed.</span>{isAdmin && user?.role === 'Admin' && <button type="button" onClick={() => updateStatus('In Progress')}>Reopen conversation</button>}</div>
                  ) : (
                    <form className="inquiryComposer" onSubmit={sendMessage}>
                      <textarea value={message} onChange={event => setMessage(event.target.value)} placeholder={isAdmin ? 'Reply to the customer and continue the discussion…' : 'Reply to the primeStack team…'} maxLength={5000} rows={3} />
                      <div><small>{message.length}/5000</small><button className="inquirySend" type="submit" disabled={sending || !message.trim()}>{sending ? 'Sending…' : 'Send reply'} <Send size={15} /></button></div>
                    </form>
                  )}
                </>
              )}
            </main>
          </div>
        </section>
      )}
    </div>
  );
}
