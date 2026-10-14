import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness, Check,
  ChevronDown, Code2, ExternalLink, Eye, FileText, FolderKanban, Github,
  LayoutDashboard, LogOut, Mail, Menu, Pencil, Plus, Search, Settings,
  ShieldCheck, Sparkles, Trash2, UserRound, X, Zap
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api";

const initialProfile = {
  full_name: "Your Name", title: "Software Developer", bio: "",
  email: "", location: "", avatar_url: "", github_url: "", linkedin_url: ""
};
const blankProject = {
  title: "", description: "", tech_stack: "", image_url: "",
  project_url: "", github_url: "", featured: false
};
const blankSkill = { name: "", category: "Frontend", level: 70 };
const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "profile", label: "Profile settings", icon: Settings }
];

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("portfolio_admin_token", data.access_token);
      onLogin(data.admin);
    } catch (err) {
      setError(err.response?.data?.error || "Could not sign in. Check the if backend is running.");
    } finally { setLoading(false); }
  }

  return <main className="login-shell">
    <div className="login-glow glow-one" /><div className="login-glow glow-two" />
    <form className="login-card" onSubmit={submit}>
      <div className="brand-mark"><Code2 size={24} /></div>
      <span className="eyebrow">PERSONAL WORKSPACE</span>
      <h1>Welcome <span>back.</span></h1>
      <p className="muted">Sign in to manage your developer portfolio.</p>
      {error && <div className="alert error">{error}</div>}
      <label>Email address</label>
      <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
      <label>Password</label>
      <div className="password-wrap">
        <input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="icon-button password-toggle" type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility"><Eye size={17} /></button>
      </div>
      <button className="primary-button full-button" disabled={loading}>{loading ? "Signing in…" : "Sign in to dashboard"} <ArrowUpRight size={17} /></button>
      <div className="login-security"><ShieldCheck size={15} /> Protected administrator access</div>
      <p className="login-note">For first run, use the development credentials configured in <code>backend/.env</code>. Change them before deployment.</p>
    </form>
  </main>;
}

function Sidebar({ page, setPage, profile, unread, onLogout, mobileOpen, closeMobile }) {
  return <>
    {mobileOpen && <button className="mobile-scrim" onClick={closeMobile} aria-label="Close menu" />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark small"><Code2 size={20} /></div>
        <div><strong>folio<span>.</span></strong><small>PORTFOLIO STUDIO</small></div>
        <button className="icon-button mobile-close" onClick={closeMobile}><X size={18} /></button>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => { setPage(item.id); closeMobile(); }}>
            <Icon size={18} /><span>{item.label}</span>
            {item.id === "messages" && unread > 0 && <b className="nav-count">{unread}</b>}
            {page === item.id && <span className="active-bar" />}
          </button>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-plan"><div className="plan-icon"><Sparkles size={16} /></div><strong>Your creative space</strong><p>Keep your work fresh and your portfolio up to date.</p><div className="plan-progress"><span /></div><small>PORTFOLIO HEALTH <b>ACTIVE</b></small></div>
        <div className="sidebar-user">
          <div className="avatar">{(profile.full_name || "Y").slice(0, 1).toUpperCase()}</div>
          <div className="user-meta"><strong>{profile.full_name || "Your Name"}</strong><small>Administrator</small></div>
          <button className="icon-button logout-icon" onClick={onLogout} title="Log out"><LogOut size={17} /></button>
        </div>
      </div>
    </aside>
  </>;
}

function Topbar({ page, admin, onMenu, onViewSite }) {
  const current = navItems.find(n => n.id === page);
  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-button menu-trigger" onClick={onMenu}><Menu size={20} /></button>
      <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{current?.label || "Overview"}</strong></div>
    </div>
    <div className="topbar-actions">
      <div className="system-status"><span /> All systems normal</div>
      <button className="icon-button notification-button" title="Notifications"><Bell size={18} /><i /></button>
      <div className="topbar-divider" />
      <div className="admin-email"><div className="avatar tiny"><UserRound size={15} /></div><span>{admin?.email || "Admin"}</span><ChevronDown size={14} /></div>
      <button className="outline-button view-site" onClick={onViewSite}><ExternalLink size={15} /> View site</button>
    </div>
  </header>;
}

function StatCard({ label, value, note, icon: Icon, trend, accent }) {
  return <div className="stat-card">
    <div className="stat-top"><span>{label}</span><div className={`stat-icon ${accent}`}><Icon size={18} /></div></div>
    <div className="stat-number">{value}</div>
    <div className="stat-foot"><span className="stat-trend"><ArrowUpRight size={14} /> {trend}</span><span>{note}</span></div>
  </div>;
}

function Overview({ projects, skills, messages, profile, setPage }) {
  const unread = messages.filter(m => !m.is_read).length;
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const label = date.toLocaleDateString(undefined, { weekday: "short" });
      const created = projects.filter(p => p.created_at && new Date(p.created_at).toDateString() === date.toDateString()).length;
      return { day: label, projects: created, activity: Math.max(1, created + (index % 3)) };
    });
  }, [projects]);
  return <div className="page-content">
    <div className="welcome-row">
      <div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR CREATIVE HQ</div><h1>Good to see you, <span>{(profile.full_name || "there").split(" ")[0]}.</span></h1><p className="muted">Here’s what’s happening with your portfolio today.</p></div>
      <button className="primary-button" onClick={() => setPage("projects")}><Plus size={17} /> Add a project</button>
    </div>
    <div className="stats-grid">
      <StatCard label="Total projects" value={projects.length} note="In your portfolio" trend="Portfolio" icon={BriefcaseBusiness} accent="purple" />
      <StatCard label="Skills listed" value={skills.length} note="Across your skill set" trend="Skills" icon={Zap} accent="orange" />
      <StatCard label="Total messages" value={messages.length} note={`${unread} unread`} trend={unread ? "Needs attention" : "Up to date"} icon={Mail} accent="green" />
      <StatCard label="Featured work" value={projects.filter(p => p.featured).length} note="Highlighted projects" trend="Showcase" icon={Sparkles} accent="blue" />
    </div>
    <div className="overview-grid">
      <section className="panel activity-panel">
        <div className="panel-heading"><div><h2>Portfolio activity</h2><p>Recent activity snapshot</p></div><button className="select-pill">Last 7 days <ChevronDown size={14} /></button></div>
        <div className="chart-legend"><span><i className="legend-dot violet" /> Activity</span><span><i className="legend-dot mint" /> Projects added</span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
          <defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9c82ff" stopOpacity={0.27} /><stop offset="95%" stopColor="#9c82ff" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#282832" strokeDasharray="4 5" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#858594", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#858594", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#1b1b24", border: "1px solid #333341", borderRadius: 10, color: "#f5f5fa" }} />
          <Area type="monotone" dataKey="activity" stroke="#a18aff" strokeWidth={2.5} fill="url(#activityFill)" />
          <Area type="monotone" dataKey="projects" stroke="#65d6b0" strokeWidth={2} fill="transparent" />
        </AreaChart></ResponsiveContainer></div>
        <div className="chart-foot"><span><Activity size={15} /> Your portfolio at a glance</span><span className="chart-foot-value">Live database data</span></div>
      </section>
      <section className="panel profile-panel">
        <div className="panel-heading"><div><h2>Public profile</h2><p>How visitors see you</p></div><button className="text-action" onClick={() => setPage("profile")}>Edit profile <ArrowUpRight size={14} /></button></div>
        <div className="profile-preview">
          <div className="profile-cover"><div className="cover-orbit orbit-a" /><div className="cover-orbit orbit-b" /><div className="profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="Profile" /> : (profile.full_name || "Y").slice(0, 1)}</div></div>
          <div className="profile-preview-body"><h3>{profile.full_name || "Your Name"}</h3><span className="role-pill">{profile.title || "Software Developer"}</span><p>{profile.bio || "Add a short bio to introduce yourself to visitors."}</p><div className="profile-meta">{profile.location && <span><span className="meta-dot" />{profile.location}</span>}{profile.email && <span><Mail size={13} />{profile.email}</span>}</div></div>
        </div>
        <button className="wide-secondary" onClick={() => setPage("profile")}><Pencil size={15} /> Manage public profile</button>
      </section>
    </div>
    <section className="panel recent-panel">
      <div className="panel-heading"><div><h2>Recent projects</h2><p>Your latest portfolio additions</p></div><button className="text-action" onClick={() => setPage("projects")}>View all <ArrowUpRight size={14} /></button></div>
      {projects.length === 0 ? <EmptyState icon={FolderKanban} title="Your story starts here" text="Add your first project to start building your portfolio." action="Create project" onAction={() => setPage("projects")} /> :
        <div className="recent-project-list">{projects.slice(0, 4).map(project => <div className="recent-project" key={project.id}><div className="project-thumb">{project.image_url ? <img src={project.image_url} alt="" /> : <Code2 size={20} />}</div><div className="recent-project-info"><strong>{project.title}</strong><span>{project.tech_stack || "No technologies added"}</span></div><span className={`status-pill ${project.featured ? "featured" : ""}`}>{project.featured ? "Featured" : "Published"}</span><span className="recent-date">{formatDate(project.created_at)}</span><button className="icon-button" onClick={() => setPage("projects")} title="Manage project"><ArrowUpRight size={16} /></button></div>)}</div>}
    </section>
  </div>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><h3>{title}</h3><p>{text}</p>{action && <button className="outline-button" onClick={onAction}><Plus size={15} /> {action}</button>}</div>;
}

function Modal({ title, subtitle, onClose, children, onSubmit, saving }) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="modal-card" onSubmit={onSubmit}>
    <div className="modal-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" type="button" onClick={onClose}><X size={19} /></button></div>
    <div className="modal-body">{children}</div>
    <div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save changes"} <Check size={16} /></button></div>
  </form></div>;
}

function ProjectsPage({ projects, refresh, notify }) {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankProject);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const filtered = projects.filter(p => `${p.title} ${p.description} ${p.tech_stack}`.toLowerCase().includes(query.toLowerCase()));

  function openNew() { setEditing(null); setForm(blankProject); setModal(true); }
  function openEdit(project) { setEditing(project); setForm({ ...project }); setModal(true); }
  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form, featured: Boolean(form.featured) };
      if (editing) await api.put(`/projects/${editing.id}`, body);
      else await api.post("/projects", body);
      await refresh(); setModal(false); notify(editing ? "Project updated successfully." : "Project created successfully.");
    } catch (err) { notify(err.response?.data?.error || "Could not save project.", "error"); }
    finally { setSaving(false); }
  }
  async function remove(project) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setDeleting(project.id);
    try { await api.delete(`/projects/${project.id}`); await refresh(); notify("Project deleted."); }
    catch (err) { notify(err.response?.data?.error || "Could not delete project.", "error"); }
    finally { setDeleting(null); }
  }
  return <div className="page-content">
    <div className="page-title-row"><div><div className="eyebrow">SHOWCASE MANAGEMENT</div><h1>Your <span>projects.</span></h1><p className="muted">Curate the work you want the world to see.</p></div><button className="primary-button" onClick={openNew}><Plus size={17} /> New project</button></div>
    <div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Search projects or technologies…" value={query} onChange={e => setQuery(e.target.value)} /></div><span className="result-count">{filtered.length} project{filtered.length === 1 ? "" : "s"}</span></div>
    {filtered.length === 0 ? <section className="panel"><EmptyState icon={FolderKanban} title={query ? "No matching projects" : "No projects yet"} text={query ? "Try another search term." : "Create your first project and give visitors a look at your work."} action={query ? undefined : "Add your first project"} onAction={openNew} /></section> :
      <div className="project-grid">{filtered.map(project => <article className="project-card" key={project.id}>
        <div className="project-image">{project.image_url ? <img src={project.image_url} alt={project.title} onError={e => { e.currentTarget.style.display = "none"; }} /> : <div className="image-placeholder"><Code2 size={32} /><span>PROJECT PREVIEW</span></div>}
          <div className="project-image-overlay"><span className={`status-pill ${project.featured ? "featured" : ""}`}>{project.featured ? <><Sparkles size={12} /> Featured</> : "Portfolio"}</span><div className="image-actions"><button className="icon-button" onClick={() => openEdit(project)} title="Edit project"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(project)} disabled={deleting === project.id} title="Delete project"><Trash2 size={15} /></button></div></div>
        </div>
        <div className="project-card-body"><div className="project-card-top"><h3>{project.title}</h3><span className="project-id">#{String(project.id).padStart(3, "0")}</span></div><p>{project.description || "No description added yet."}</p><div className="tech-tags">{(project.tech_stack || "").split(",").map(t => t.trim()).filter(Boolean).slice(0, 4).map(t => <span key={t}>{t}</span>)}</div>
          <div className="project-card-footer"><span>Added {formatDate(project.created_at)}</span><div>{project.project_url && <a href={project.project_url} target="_blank" rel="noreferrer" title="Open live project"><ExternalLink size={15} /></a>}{project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" title="Open GitHub"><Github size={15} /></a>}</div></div></div>
      </article>)}</div>}
    {modal && <Modal title={editing ? "Edit project" : "Create a project"} subtitle="Add details that help your work stand out." onClose={() => setModal(false)} onSubmit={submit} saving={saving}>
      <div className="form-grid"><div className="field full-field"><label>Project title *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. E-commerce platform" /></div>
      <div className="field full-field"><label>Description</label><textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this project do?" /></div>
      <div className="field full-field"><label>Technologies <small>Separate with commas</small></label><input value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Flask, PostgreSQL" /></div>
      <div className="field full-field"><label>Preview image URL</label><input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></div>
      <div className="field"><label>Live project URL</label><input type="url" value={form.project_url} onChange={e => setForm({ ...form, project_url: e.target.value })} placeholder="https://…" /></div>
      <div className="field"><label>GitHub URL</label><input type="url" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/…" /></div>
      <label className="check-field full-field"><input type="checkbox" checked={Boolean(form.featured)} onChange={e => setForm({ ...form, featured: e.target.checked })} /><span><strong>Feature this project</strong><small>Highlight it on your public portfolio.</small></span></label></div>
    </Modal>}
  </div>;
}

function SkillsPage({ skills, refresh, notify }) {
  const [form, setForm] = useState(blankSkill);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const groups = useMemo(() => skills.reduce((acc, skill) => { (acc[skill.category || "General"] ||= []).push(skill); return acc; }, {}), [skills]);
  function edit(skill) { setEditing(skill.id); setForm({ name: skill.name, category: skill.category, level: skill.level }); }
  function cancelEdit() { setEditing(null); setForm(blankSkill); }
  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/skills/${editing}`, form); else await api.post("/skills", form);
      await refresh(); notify(editing ? "Skill updated." : "Skill added."); cancelEdit();
    } catch (err) { notify(err.response?.data?.error || "Could not save skill.", "error"); }
    finally { setSaving(false); }
  }
  async function remove(skill) {
    if (!window.confirm(`Remove ${skill.name} from your skills?`)) return;
    try { await api.delete(`/skills/${skill.id}`); await refresh(); notify("Skill removed."); if (editing === skill.id) cancelEdit(); }
    catch (err) { notify(err.response?.data?.error || "Could not remove skill.", "error"); }
  }
  return <div className="page-content">
    <div className="page-title-row"><div><div className="eyebrow">YOUR TOOLKIT</div><h1>Skills & <span>expertise.</span></h1><p className="muted">Keep your technical strengths current and organized.</p></div><div className="count-chip"><Code2 size={16} /> {skills.length} skills</div></div>
    <div className="skills-layout">
      <section className="panel skill-form-panel"><div className="panel-heading"><div><h2>{editing ? "Edit skill" : "Add a skill"}</h2><p>{editing ? "Update the skill details." : "Add a tool to your toolkit."}</p></div><div className="form-heading-icon"><Plus size={17} /></div></div>
        <form onSubmit={submit} className="skill-form"><div className="field"><label>Skill name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. React" /></div>
          <div className="field"><label>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Frontend</option><option>Backend</option><option>Database</option><option>Programming</option><option>Design</option><option>Tools</option><option>General</option></select></div>
          <div className="field"><div className="label-row"><label>Proficiency</label><strong>{form.level}%</strong></div><input className="range-input" type="range" min="0" max="100" value={form.level} onChange={e => setForm({ ...form, level: Number(e.target.value) })} /><div className="range-labels"><span>Learning</span><span>Expert</span></div></div>
          <div className="form-actions">{editing && <button className="outline-button" type="button" onClick={cancelEdit}>Cancel</button>}<button className="primary-button" disabled={saving}>{saving ? "Saving…" : editing ? "Update skill" : "Add skill"} <Plus size={16} /></button></div>
        </form>
      </section>
      <div className="skill-groups">{Object.keys(groups).length === 0 ? <section className="panel"><EmptyState icon={Code2} title="Your toolkit is empty" text="Add skills to show your strengths." /></section> : Object.entries(groups).map(([category, items]) => <section className="panel skill-group" key={category}><div className="skill-group-heading"><div className="category-icon"><Code2 size={17} /></div><div><h2>{category}</h2><p>{items.length} skill{items.length === 1 ? "" : "s"}</p></div></div>
        <div className="skill-list">{items.map(skill => <div className="skill-row" key={skill.id}><div className="skill-row-top"><div className="skill-symbol">{skill.name.slice(0, 1).toUpperCase()}</div><div className="skill-info"><strong>{skill.name}</strong><span>{skill.level >= 85 ? "Advanced" : skill.level >= 65 ? "Proficient" : skill.level >= 40 ? "Intermediate" : "Learning"}</span></div><b>{skill.level}%</b><button className="icon-button compact" onClick={() => edit(skill)} title="Edit"><Pencil size={14} /></button><button className="icon-button compact danger-icon" onClick={() => remove(skill)} title="Delete"><Trash2 size={14} /></button></div><div className="skill-track"><span style={{ width: `${skill.level}%` }} /></div></div>)}</div>
      </section>)}</div>
    </div>
  </div>;
}

function MessagesPage({ messages, refresh, notify }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = messages.filter(m => `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(query.toLowerCase()));
  async function markRead(message) {
    try { await api.put(`/messages/${message.id}`, { is_read: !message.is_read }); await refresh(); if (selected?.id === message.id) setSelected({ ...message, is_read: !message.is_read }); }
    catch (err) { notify(err.response?.data?.error || "Could not update message.", "error"); }
  }
  async function remove(message) {
    if (!window.confirm("Delete this message?")) return;
    try { await api.delete(`/messages/${message.id}`); await refresh(); setSelected(null); notify("Message deleted."); }
    catch (err) { notify(err.response?.data?.error || "Could not delete message.", "error"); }
  }
  return <div className="page-content">
    <div className="page-title-row"><div><div className="eyebrow">INBOX</div><h1>Messages & <span>inquiries.</span></h1><p className="muted">Keep up with the people reaching out to you.</p></div><div className="count-chip"><Mail size={16} /> {messages.filter(m => !m.is_read).length} unread</div></div>
    <section className="panel messages-panel"><div className="messages-toolbar"><div className="search-box"><Search size={17} /><input placeholder="Search your inbox…" value={query} onChange={e => setQuery(e.target.value)} /></div><span className="result-count">{filtered.length} messages</span></div>
      {filtered.length === 0 ? <EmptyState icon={Mail} title={query ? "No matching messages" : "Your inbox is clear"} text={query ? "Try a different search." : "Messages submitted through your public contact form will appear here."} /> :
        <div className="message-list">{filtered.map(message => <button className={`message-row ${!message.is_read ? "unread" : ""} ${selected?.id === message.id ? "selected" : ""}`} key={message.id} onClick={() => { setSelected(message); if (!message.is_read) markRead(message); }}>
          <div className="message-avatar">{message.name.slice(0, 1).toUpperCase()}</div><div className="message-main"><div className="message-title-line"><strong>{message.name}</strong>{!message.is_read && <i className="unread-dot" />}</div><span className="message-email">{message.email}</span><p><b>{message.subject || "New inquiry"}</b> — {message.message}</p></div><time>{formatDate(message.created_at)}</time><ArrowUpRight size={16} className="message-open-icon" />
        </button>)}</div>}
    </section>
    {selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><div className="modal-card message-detail">
      <div className="modal-heading"><div><span className="eyebrow">MESSAGE DETAILS</span><h2>{selected.subject || "New inquiry"}</h2></div><button className="icon-button" onClick={() => setSelected(null)}><X size={19} /></button></div>
      <div className="sender-card"><div className="message-avatar large">{selected.name.slice(0, 1).toUpperCase()}</div><div><strong>{selected.name}</strong><a href={`mailto:${selected.email}`}>{selected.email}</a></div><span className={`status-pill ${selected.is_read ? "" : "featured"}`}>{selected.is_read ? "Read" : "Unread"}</span></div>
      <p className="message-detail-date">Received {formatDate(selected.created_at)}</p><div className="message-content">{selected.message}</div>
      <div className="modal-footer"><button className="outline-button danger-outline" onClick={() => remove(selected)}><Trash2 size={15} /> Delete</button><button className="outline-button" onClick={() => markRead(selected)}>{selected.is_read ? "Mark unread" : "Mark read"}</button><a className="primary-button" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your inquiry"}`)}`}>Reply by email <ArrowUpRight size={15} /></a></div>
    </div></div>}
  </div>;
}

function ProfilePage({ profile, refresh, notify }) {
  const [form, setForm] = useState(profile || initialProfile);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(profile || initialProfile); }, [profile]);
  function change(key, value) { setForm(prev => ({ ...prev, [key]: value })); }
  async function submit(e) {
    e.preventDefault(); setSaving(true);
    try { await api.put("/profile", form); await refresh(); notify("Profile settings saved."); }
    catch (err) { notify(err.response?.data?.error || "Could not save profile.", "error"); }
    finally { setSaving(false); }
  }
  return <div className="page-content">
    <div className="page-title-row"><div><div className="eyebrow">MAKE IT PERSONAL</div><h1>Profile <span>settings.</span></h1><p className="muted">The details people see when they discover your work.</p></div><div className="count-chip"><ShieldCheck size={16} /> Public profile</div></div>
    <form className="profile-settings-layout" onSubmit={submit}>
      <section className="panel settings-main"><div className="panel-heading"><div><h2>Personal information</h2><p>Introduce yourself in your own words.</p></div><div className="form-heading-icon"><UserRound size={17} /></div></div>
        <div className="form-grid"><div className="field"><label>Full name *</label><input required value={form.full_name || ""} onChange={e => change("full_name", e.target.value)} placeholder="Your name" /></div><div className="field"><label>Professional title *</label><input required value={form.title || ""} onChange={e => change("title", e.target.value)} placeholder="Software Developer" /></div>
          <div className="field"><label>Email address</label><input type="email" value={form.email || ""} onChange={e => change("email", e.target.value)} placeholder="you@example.com" /></div><div className="field"><label>Location</label><input value={form.location || ""} onChange={e => change("location", e.target.value)} placeholder="Kampala, Uganda" /></div>
          <div className="field full-field"><label>Short bio</label><textarea rows="5" value={form.bio || ""} onChange={e => change("bio", e.target.value)} placeholder="Tell visitors what you build, what motivates you, and what you are interested in…" /></div>
          <div className="field full-field"><label>Profile image URL</label><input type="url" value={form.avatar_url || ""} onChange={e => change("avatar_url", e.target.value)} placeholder="https://…" /><small className="field-hint">Use a publicly accessible image URL.</small></div>
        </div>
      </section>
      <div className="settings-side"><section className="panel settings-social"><div className="panel-heading"><div><h2>Social links</h2><p>Help people find your work.</p></div></div>
        <div className="field"><label><Github size={14} /> GitHub profile</label><input type="url" value={form.github_url || ""} onChange={e => change("github_url", e.target.value)} placeholder="https://github.com/username" /></div>
        <div className="field"><label><ExternalLink size={14} /> LinkedIn profile</label><input type="url" value={form.linkedin_url || ""} onChange={e => change("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/username" /></div>
        <button className="primary-button full-button" disabled={saving}>{saving ? "Saving…" : "Save profile"} <Check size={16} /></button>
      </section>
      <section className="profile-tip"><div><Sparkles size={18} /></div><strong>A little personality goes a long way.</strong><p>Keep your bio clear, highlight the work you enjoy, and make it easy for visitors to contact you.</p></section></div>
    </form>
  </div>;
}

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState("overview");
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(initialProfile);
  const [toast, setToast] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const unread = messages.filter(m => !m.is_read).length;

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("portfolio_admin_token");
    setAdmin(null); setProjects([]); setSkills([]); setMessages([]);
  }, []);

  const loadPublic = useCallback(async () => {
    const [p, s, prof] = await Promise.all([api.get("/projects"), api.get("/skills"), api.get("/profile")]);
    setProjects(p.data); setSkills(s.data); setProfile(prof.data);
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await api.get("/messages");
    setMessages(data);
  }, []);

  const refreshProjects = useCallback(async () => {
    const { data } = await api.get("/projects"); setProjects(data);
  }, []);
  const refreshSkills = useCallback(async () => {
    const { data } = await api.get("/skills"); setSkills(data);
  }, []);
  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);
  const refreshProfile = useCallback(async () => {
    const { data } = await api.get("/profile"); setProfile(data);
  }, []);

  useEffect(() => {
    async function checkSession() {
      if (!localStorage.getItem("portfolio_admin_token")) { setAuthChecked(true); return; }
      try {
        const { data } = await api.get("/auth/me");
        setAdmin(data);
      } catch (_) { localStorage.removeItem("portfolio_admin_token"); }
      finally { setAuthChecked(true); }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (!admin) return;
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [p, s, m, prof] = await Promise.all([
          api.get("/projects"), api.get("/skills"), api.get("/messages"), api.get("/profile")
        ]);
        if (!alive) return;
        setProjects(p.data); setSkills(s.data); setMessages(m.data); setProfile(prof.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) logout();
        else notify(err.response?.data?.error || "Unable to load dashboard data.", "error");
      } finally { if (alive) setLoading(false); }
    }
    load();
    return () => { alive = false; };
  }, [admin, logout, notify]);

  const viewSite = () => window.open("/", "_blank", "noopener,noreferrer");

  if (!authChecked) return <div className="loading-screen"><div className="loader" /><span>Preparing your workspace…</span></div>;
  if (!admin) return <Login onLogin={setAdmin} />;

  const pageTitle = navItems.find(n => n.id === page)?.label || "Overview";
  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} profile={profile} unread={unread} onLogout={logout} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
    <main className="main-shell">
      <Topbar page={page} admin={admin} onMenu={() => setMobileOpen(true)} onViewSite={viewSite} />
      <div className="mobile-page-label"><span>{pageTitle}</span><span className="live-indicator"><i /> Live workspace</span></div>
      {loading && <div className="loading-strip"><span /> Syncing workspace data…</div>}
      {page === "overview" && <Overview projects={projects} skills={skills} messages={messages} profile={profile} setPage={setPage} />}
      {page === "projects" && <ProjectsPage projects={projects} refresh={refreshProjects} notify={notify} />}
      {page === "skills" && <SkillsPage skills={skills} refresh={refreshSkills} notify={notify} />}
      {page === "messages" && <MessagesPage messages={messages} refresh={refreshMessages} notify={notify} />}
      {page === "profile" && <ProfilePage profile={profile} refresh={refreshProfile} notify={notify} />}
      <footer className="app-footer"><span>© {new Date().getFullYear()} Folio Studio</span><span><i /> Saved to your database</span><span>Made for creators <Sparkles size={13} /></span></footer>
    </main>
    {toast && <div className={`toast toast-${toast.type}`}><span className="toast-symbol">{toast.type === "error" ? <X size={16} /> : <Check size={16} />}</span>{toast.message}<button className="icon-button" onClick={() => setToast(null)}><X size={15} /></button></div>}
  </div>;
}
