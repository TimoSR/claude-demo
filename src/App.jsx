import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "daymark.tasks.v2";
const PROJECTS = ["Work", "Personal", "Studio", "Reading"];

function localISO(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const seedTasks = [
  { id: "seed-1", title: "Review launch brief", project: "Work", priority: "High", due: localISO(), completed: false },
  { id: "seed-2", title: "Send revised homepage copy", project: "Studio", priority: "Medium", due: localISO(), completed: false },
  { id: "seed-3", title: "Pick up groceries", project: "Personal", priority: "Low", due: localISO(), completed: false },
  { id: "seed-4", title: "Read 20 pages", project: "Reading", priority: "Low", due: localISO(1), completed: false },
  { id: "seed-5", title: "Plan the week", project: "Personal", priority: "Medium", due: localISO(), completed: true },
];

function isTask(value) {
  return value && typeof value.id === "string" && typeof value.title === "string"
    && typeof value.project === "string" && typeof value.due === "string"
    && typeof value.completed === "boolean";
}

function loadTasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) && parsed.every(isTask) ? parsed : seedTasks;
  } catch {
    return seedTasks;
  }
}

function formatDue(due) {
  if (due === localISO()) return "Today";
  if (due === localISO(1)) return "Tomorrow";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" })
    .format(new Date(`${due}T12:00:00`));
}

function Icon({ name, size = 19 }) {
  const paths = {
    check: <path d="m5 12 4 4 10-10" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M8 3v5M16 3v5M4 10h16" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7" /><path d="M10 11v5M14 11v5" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [view, setView] = useState("today");
  const [project, setProject] = useState("All");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const addButtonRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage can be unavailable in private contexts; state remains usable in memory.
    }
  }, [tasks]);

  const counts = useMemo(() => ({
    today: tasks.filter((task) => !task.completed && task.due <= localISO()).length,
    upcoming: tasks.filter((task) => !task.completed && task.due > localISO()).length,
    completed: tasks.filter((task) => task.completed).length,
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks
    .filter((task) => {
      if (view === "today") return !task.completed && task.due <= localISO();
      if (view === "upcoming") return !task.completed && task.due > localISO();
      if (view === "completed") return task.completed;
      return true;
    })
    .filter((task) => project === "All" || task.project === project)
    .filter((task) => task.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.due.localeCompare(b.due)), [tasks, view, project, query]);

  const setPlanView = (nextView) => {
    setView(nextView);
    setProject("All");
  };

  const closeModal = () => {
    setModalOpen(false);
    requestAnimationFrame(() => addButtonRef.current?.focus());
  };

  const addTask = (task) => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setTasks((current) => [{ ...task, id, completed: false }, ...current]);
    setView(task.due <= localISO() ? "today" : "upcoming");
    setProject("All");
    closeModal();
  };

  const navigation = [
    ["today", "Today", counts.today],
    ["upcoming", "Upcoming", counts.upcoming],
    ["all", "All tasks", tasks.length],
    ["completed", "Completed", counts.completed],
  ];
  const title = navigation.find(([key]) => key === view)?.[1] || "Today";
  const completion = Math.round((counts.completed / Math.max(tasks.length, 1)) * 100);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Icon name="check" /></span><span>daymark</span></div>
        <nav aria-label="Task views">
          <p className="nav-label">Plan</p>
          {navigation.map(([key, label, count]) => (
            <button key={key} className={view === key && project === "All" ? "active" : ""} onClick={() => setPlanView(key)}>
              <span>{label}</span><small>{count}</small>
            </button>
          ))}
          <p className="nav-label projects-label">Projects</p>
          {PROJECTS.map((item, index) => (
            <button key={item} className={project === item ? "active" : ""} onClick={() => { setProject(item); setView("all"); }}>
              <span><i className={`dot dot-${index}`} />{item}</span>
              <small>{tasks.filter((task) => task.project === item && !task.completed).length}</small>
            </button>
          ))}
        </nav>
        <div className="local-note"><strong>Local by design</strong><span>Your plan stays on this device.</span></div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Icon name="check" /></span><strong>daymark</strong></div>
          <label className="search"><Icon name="search" /><span className="sr-only">Search tasks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your plan…" /></label>
          <button ref={addButtonRef} className="primary" onClick={() => setModalOpen(true)}><Icon name="plus" /><span>Add task</span></button>
        </header>

        <div className="workspace">
          <section className="hero">
            <div>
              <p className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p>
              <h1>{project === "All" ? title : project}</h1>
              <p>A clear plan for focused work and a quieter mind.</p>
            </div>
            <div className="progress-card">
              <div className="ring" style={{ "--progress": `${completion * 3.6}deg` }}><strong>{completion}%</strong></div>
              <div><strong>{counts.completed} completed</strong><span>of {tasks.length} total tasks</span></div>
            </div>
          </section>

          <section className="metrics" aria-label="Task summary">
            <article><span>Open today</span><strong>{String(counts.today).padStart(2, "0")}</strong><small>Ready when you are</small></article>
            <article><span>Coming up</span><strong>{String(counts.upcoming).padStart(2, "0")}</strong><small>On the horizon</small></article>
            <article className="metric-accent"><span>Momentum</span><strong>{counts.completed}</strong><small>tasks completed</small></article>
          </section>

          <section className="tasks">
            <div className="section-head">
              <div><p className="eyebrow">Your plan</p><h2>{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</h2></div>
              <select aria-label="Filter tasks by project" value={project} onChange={(event) => setProject(event.target.value)}>
                <option>All</option>{PROJECTS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="task-list">
              {visibleTasks.map((task) => (
                <article className={`task-row ${task.completed ? "done" : ""}`} key={task.id}>
                  <button className="check-button" onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item))} aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}>
                    {task.completed && <Icon name="check" size={16} />}
                  </button>
                  <div className="task-copy"><h3>{task.title}</h3><div><span><Icon name="calendar" size={16} />{formatDue(task.due)}</span><span className="tag">{task.project}</span></div></div>
                  <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <button className="delete-button" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={`Delete ${task.title}`}><Icon name="trash" /></button>
                </article>
              ))}
              {!visibleTasks.length && <div className="empty"><span className="empty-icon"><Icon name="check" size={28} /></span><h3>Your day is clear</h3><p>No tasks match this view. Make space for something that matters.</p><button className="text-button" onClick={() => setModalOpen(true)}>Add a task</button></div>}
            </div>
          </section>
        </div>

        <nav className="bottom-nav" aria-label="Mobile task views">
          {navigation.map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => setPlanView(key)}><span>{key === "completed" ? "✓" : key === "upcoming" ? "○" : key === "all" ? "≡" : "•"}</span>{label.replace(" tasks", "")}</button>)}
        </nav>
      </main>

      {modalOpen && <TaskDialog projects={PROJECTS} onClose={closeModal} onSubmit={addTask} />}
    </div>
  );
}

function TaskDialog({ projects, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: "", project: projects[0], priority: "Medium", due: localISO() });
  const dialogRef = useRef(null);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const items = [...dialogRef.current.querySelectorAll("button, input, select")];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onSubmit={(event) => { event.preventDefault(); if (form.title.trim()) onSubmit({ ...form, title: form.title.trim() }); }}>
        <div className="dialog-head"><div><p className="eyebrow">New task</p><h2 id="dialog-title">What needs doing?</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>
        <label>Task name<input autoFocus required value={form.title} onChange={update("title")} placeholder="e.g. Send project update" /></label>
        <div className="form-grid"><label>Due date<input type="date" required value={form.due} onChange={update("due")} /></label><label>Priority<select value={form.priority} onChange={update("priority")}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
        <label>Project<select value={form.project} onChange={update("project")}>{projects.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="dialog-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" type="submit">Add to plan</button></div>
      </form>
    </div>
  );
}
