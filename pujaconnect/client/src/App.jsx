import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Clock3, Download, Eye, Filter, Flower2, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import api from './api';

const statuses = ['Pending','Confirmed','In Progress','Completed'];
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n || 0);
const dateFmt = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
function Status({value}) { return <span className={`status ${value?.toLowerCase().replaceAll(' ','-')}`}>{value}</span>; }

export default function App() {
  const [token,setToken] = useState(localStorage.getItem('puja_token'));
  const [admin,setAdmin] = useState(null);
  const [data,setData] = useState({items:[],total:0,pages:1,page:1});
  const [stats,setStats] = useState({total:0,pending:0,confirmed:0,inProgress:0,completed:0,revenue:0,monthly:[]});
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('');
  const [puja,setPuja] = useState('');
  const [sortBy,setSortBy] = useState('createdAt');
  const [order,setOrder] = useState('desc');
  const [page,setPage] = useState(1);
  const [selected,setSelected] = useState(null);
  const [showCreate,setShowCreate] = useState(false);
  const [mobileNav,setMobileNav] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [toast,setToast] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const params = {page,limit:8,search,status,puja,sortBy,order};
      const [bookings,summary] = await Promise.all([api.get('/bookings',{params}),api.get('/bookings/stats')]);
      setData(bookings.data); setStats(summary.data);
    } catch(e) { setError(e.response?.data?.message || 'Unable to load bookings. Check that the API is running.'); }
    finally { setLoading(false); }
  },[token,page,search,status,puja,sortBy,order]);
  useEffect(()=>{ const t=setTimeout(load,250); return ()=>clearTimeout(t); },[load]);
  useEffect(()=>{ if(token) api.get('/auth/me').then(r=>setAdmin(r.data.admin)).catch(()=>{localStorage.removeItem('puja_token');setToken(null);}); },[]);
  const login = async e => {
    e.preventDefault(); setError('');
    try { const r=await api.post('/auth/login',{email:e.target.email.value,password:e.target.password.value}); localStorage.setItem('puja_token',r.data.token);setToken(r.data.token);setAdmin(r.data.admin); }
    catch(err){setError(err.response?.data?.message || 'Login failed');}
  };
  const logout=()=>{localStorage.removeItem('puja_token');setToken(null);setAdmin(null);};
  const notify=msg=>{setToast(msg);setTimeout(()=>setToast(''),2800);};
  const openBooking=async item=>{try{const r=await api.get(`/bookings/${item._id}`);setSelected(r.data);}catch(e){notify('Could not load booking details');}};
  const updateStatus=async (id,next)=>{try{const r=await api.patch(`/bookings/${id}/status`,{status:next});setSelected(r.data);notify('Booking status updated');load();}catch(e){notify(e.response?.data?.message || 'Update failed');}};
  const createBooking=async e=>{e.preventDefault();const f=new FormData(e.target);const body=Object.fromEntries(f.entries());body.amount=Number(body.amount);try{await api.post('/bookings',body);setShowCreate(false);e.target.reset();notify('New booking created');setPage(1);load();}catch(err){notify(err.response?.data?.message || 'Could not create booking');}};
  const pujas=useMemo(()=>[...new Set(data.items.map(x=>x.puja))],[data.items]);
  const exportCsv=()=>{const rows=[['Booking ID','Devotee','Puja','Date','Amount','Status'],...data.items.map(x=>[x.bookingCode,x.devotee.name,x.puja,dateFmt(x.bookingDate),x.amount,x.status])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='pujaconnect-bookings.csv';a.click();URL.revokeObjectURL(a.href);};
  if(!token) return <div className="login-page"><div className="login-card"><div className="brand-mark"><Flower2/></div><p className="eyebrow">TEMPLE ADMINISTRATION</p><h1>Welcome back</h1><p className="muted">Sign in to manage your puja bookings.</p>{error&&<div className="error">{error}</div>}<form onSubmit={login}><label>Email address<input name="email" type="email" placeholder="admin@pujaconnect.com" required/></label><label>Password<input name="password" type="password" placeholder="Enter your password" required/></label><button className="primary full">Sign in to dashboard <ChevronRight size={17}/></button></form><p className="login-foot"><ShieldCheck size={14}/> Secure administrator access</p></div></div>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}><div className="brand"><div className="brand-mark"><Flower2/></div><div><b>PujaConnect</b><small>ADMIN CONSOLE</small></div><button className="icon-btn mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div><div className="nav-label">WORKSPACE</div><button className="nav-item active"><LayoutDashboard size={18}/> Overview</button><button className="nav-item" onClick={()=>document.getElementById('bookings')?.scrollIntoView({behavior:'smooth'})}><ClipboardList size={18}/> All bookings <span className="nav-count">{stats.total}</span></button><div className="nav-label nav-label-spaced">MANAGEMENT</div><div className="side-note"><div className="note-icon"><Sparkles size={17}/></div><b>Keep every ritual in harmony</b><p>Manage devotee requests and keep your temple operations running smoothly.</p></div><div className="sidebar-bottom"><div className="admin-mini"><div className="avatar">{(admin?.name||'A')[0]}</div><div><b>{admin?.name||'Administrator'}</b><small>Super Admin</small></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div></aside>
    {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main"><header className="topbar"><button className="icon-btn menu-btn" onClick={()=>setMobileNav(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="today"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span><button className="icon-btn notification" title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{(admin?.name||'A')[0]}</div></div></header>
    <div className="content"><div className="welcome-row"><div><p className="eyebrow">YOUR TEMPLE AT A GLANCE</p><h1>Dashboard overview</h1><p className="muted">Here's what's happening with your puja bookings today.</p></div><button className="primary" onClick={()=>setShowCreate(true)}><Plus size={17}/> Add booking</button></div>
    {error&&<div className="error">{error}</div>}
    <section className="stats-grid">
      <Stat icon={<ClipboardList/>} label="Total bookings" value={stats.total} tone="violet" hint="All time"/>
      <Stat icon={<Clock3/>} label="Pending" value={stats.pending} tone="amber" hint="Awaiting confirmation"/>
      <Stat icon={<CheckCircle2/>} label="Confirmed" value={stats.confirmed} tone="green" hint="Ready for fulfilment"/>
      <Stat icon={<CircleDollarSign/>} label="Collected revenue" value={money(stats.revenue)} tone="blue" hint="Paid bookings"/>
    </section>
    <section className="insight-grid"><div className="panel chart-panel"><div className="panel-head"><div><h3>Booking activity</h3><p className="muted">Bookings created over recent months</p></div><span className="period-pill">Last 6 months</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.monthly}><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8065dc" stopOpacity={0.22}/><stop offset="100%" stopColor="#8065dc" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#efedf5" vertical={false}/><XAxis dataKey="_id" tickFormatter={v=>new Date(v+'-02').toLocaleDateString('en-IN',{month:'short'})} axisLine={false} tickLine={false} tick={{fill:'#9895a5',fontSize:12}}/><Tooltip/><Area type="monotone" dataKey="bookings" stroke="#8065dc" strokeWidth={2.5} fill="url(#areaFill)"/></AreaChart></ResponsiveContainer></div></div>
    <div className="panel status-panel"><div className="panel-head"><div><h3>Booking status</h3><p className="muted">Current booking distribution</p></div><Activity size={18} className="soft-icon"/></div><div className="status-summary"><div className="donut" style={{'--done':`${stats.total?stats.completed/stats.total*100:0}%`}}><div><b>{stats.total}</b><small>Bookings</small></div></div><div className="legend">{[['Pending',stats.pending,'#e7a33e'],['Confirmed',stats.confirmed,'#36a77a'],['In Progress',stats.inProgress,'#6387df'],['Completed',stats.completed,'#8065dc']].map(([n,v,c])=><div key={n}><i style={{background:c}}/><span>{n}</span><b>{v}</b></div>)}</div></div></div></section>
    <section className="panel bookings-panel" id="bookings"><div className="panel-head bookings-heading"><div><h3>Recent bookings</h3><p className="muted">Review and manage devotee reservations</p></div><button className="secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button></div>
      <div className="toolbar"><div className="searchbox"><Search size={17}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search booking ID, devotee or puja..."/></div><div className="filters"><div className="filter-wrap"><Filter size={15}/><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div><div className="filter-wrap"><select value={puja} onChange={e=>{setPuja(e.target.value);setPage(1)}}><option value="">All pujas</option>{pujas.map(p=><option key={p}>{p}</option>)}</select></div><div className="filter-wrap"><select value={sortBy+':'+order} onChange={e=>{const [s,o]=e.target.value.split(':');setSortBy(s);setOrder(o)}}><option value="createdAt:desc">Newest first</option><option value="bookingDate:asc">Date: earliest</option><option value="bookingDate:desc">Date: latest</option><option value="amount:desc">Amount: high to low</option><option value="amount:asc">Amount: low to high</option></select></div></div></div>
      <div className="table-wrap"><table><thead><tr><th>BOOKING ID</th><th>DEVOTEE</th><th>PUJA</th><th>BOOKING DATE</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead><tbody>{loading?<tr><td colSpan="7" className="empty">Loading bookings...</td></tr>:data.items.length===0?<tr><td colSpan="7" className="empty">No bookings found. Try changing your search or filters.</td></tr>:data.items.map(b=><tr key={b._id}><td><b className="booking-id">{b.bookingCode}</b></td><td><div className="person"><span className="person-avatar">{b.devotee.name[0]}</span><div><b>{b.devotee.name}</b><small>{b.devotee.email||b.devotee.phone}</small></div></div></td><td>{b.puja}</td><td>{dateFmt(b.bookingDate)}</td><td><b>{money(b.amount)}</b></td><td><Status value={b.status}/></td><td><button className="icon-btn view-btn" onClick={()=>openBooking(b)} title="View details"><Eye size={17}/></button></td></tr>)}</tbody></table></div>
      <div className="table-footer"><span>Showing <b>{data.items.length?((page-1)*8+1):0}–{Math.min(page*8,data.total)}</b> of <b>{data.total}</b> bookings</span><div className="pagination"><button className="icon-btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={17}/></button><span>Page {page} of {data.pages}</span><button className="icon-btn" disabled={page>=data.pages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={17}/></button></div></div>
    </section><footer>© {new Date().getFullYear()} PujaConnect · Made for smoother temple administration</footer></div></main>
    {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal detail-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">BOOKING DETAILS</p><h2>{selected.bookingCode}</h2></div><button className="icon-btn" onClick={()=>setSelected(null)}><X/></button></div><div className="detail-grid"><Detail label="Devotee" value={selected.devotee.name}/><Detail label="Phone" value={selected.devotee.phone}/><Detail label="Email" value={selected.devotee.email||'—'}/><Detail label="Puja" value={selected.puja}/><Detail label="Booking date" value={dateFmt(selected.bookingDate)}/><Detail label="Amount" value={money(selected.amount)}/><Detail label="Payment" value={selected.paymentStatus}/></div><div className="status-edit"><label>Update booking status<select value={selected.status} onChange={e=>updateStatus(selected._id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div>{selected.notes&&<p className="detail-notes"><b>Notes:</b> {selected.notes}</p>}<h4 className="timeline-title">Status history</h4><div className="timeline">{(selected.history||[]).slice().reverse().map((h,i)=><div className="timeline-item" key={i}><i/><div><b>{h.status}</b><p>{h.note}</p><small>{new Date(h.changedAt).toLocaleString('en-IN')} · {h.changedBy}</small></div></div>)}</div></div></div>}
    {showCreate&&<div className="modal-backdrop" onClick={()=>setShowCreate(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">NEW RESERVATION</p><h2>Create booking</h2></div><button className="icon-btn" onClick={()=>setShowCreate(false)}><X/></button></div><form className="create-form" onSubmit={createBooking}><label>Devotee name<input name="name" required placeholder="Full name"/></label><label>Email address<input name="email" type="email" placeholder="name@example.com"/></label><label>Phone number<input name="phone" required pattern="[0-9+() -]{7,20}" placeholder="Contact number"/></label><label>Puja<select name="puja" required><option value="">Select puja</option>{['Ganesh Abhishekam','Satyanarayana Puja','Lakshmi Puja','Navagraha Homam','Rudrabhishekam','Other'].map(p=><option>{p}</option>)}</select></label><label>Booking date<input name="bookingDate" type="date" required min={new Date().toISOString().slice(0,10)}/></label><label>Amount (INR)<input name="amount" type="number" min="0" step="1" required placeholder="0"/></label><label>Payment status<select name="paymentStatus"><option>Unpaid</option><option>Paid</option></select></label><label className="span-two">Notes<textarea name="notes" rows="2" placeholder="Optional instructions..."/></label><div className="form-actions"><button type="button" className="secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="primary"><Plus size={16}/> Create booking</button></div></form></div></div>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
function Stat({icon,label,value,tone,hint}){return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>}
function Detail({label,value}){return <div className="detail-cell"><small>{label}</small><b>{value||'—'}</b></div>}
