import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "daymark-tasks-v1";

const initialTasks = [
  { id: 1, title: "Review weekly priorities", note: "Make space for the work that matters.", project: "Work", priority: "High", status: "today", due: todayISO(), createdAt: Date.now() - 3000 },
  { id: 2, title: "Book dentist appointment", note: "", project: "Personal", priority: "Medium", status: "today", due: todayISO(), createdAt: Date.now() - 2000 },
  { id: 3, title: "Outline project proposal", note: "Draft the problem statement and milestones.", project: "Work", priority: "High", status: "upcoming", due: offsetISO(2), createdAt: Date.now() - 1000 },
  { id: 4, title: "Morning walk", note: "Twenty minutes, no phone.", project: "Wellbeing", priority: "Low", status: "done", due: todayISO(), createdAt: Date.now() },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function offsetISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function readTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialTasks;
  } catch {
    return initialTasks;
  }
}

const Icons = {
  Check: ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Calendar: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 3v5M16 3v5M4 10h16" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

function formatDate(value) {
  if (!value) return "No date";
  if (value === todayISO()) return "Today";
  if (value === offsetISO(1)) return "Tomorrow";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function App() {
  const [tasks, setTasks] = useState(readTasks);
  const [view, setView] = useState("today");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("All");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)), [tasks]);

  const counts = useMemo(() => ({
    today: tasks.filter((task) => task.status === "today").length,
    upcoming: tasks.filter((task) => task.status === "upcoming").length,
    done: tasks.filter((task) => task.status === "done").length,
  }), [tasks]);

  const projects = ["All", ...new Set(tasks.map((task) => task.project))];
  const visibleTasks = tasks
    .filter((task) => view === "all" || task.status === view)
    .filter((task) => project === "All" || task.project === project)
    .filter((task) => `${task.title} ${task.note}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.createdAt - b.createdAt);

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, status: task.status === "done" ? (task.due <= todayISO() ? "today" : "upcoming") : "done" }
      : task));
  }

  function addTask(task) {
    setTasks((current) => [{ ...task, id: crypto.randomUUID(), createdAt: Date.now(), status: task.due <= todayISO() ? "today" : "upcoming" }, ...current]);
    setIsAdding(false);
    setView(task.due <= todayISO() ? "today" : "upcoming");
  }

  const viewLabels = { today: "Today", upcoming: "Upcoming", done: "Completed", all: "All tasks" };
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const completion = Math.round((counts.done / Math.max(tasks.length, 1)) * 100);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Daymark home"><span className="brand-mark"><Icons.Check /></span><span>daymark</span></a>
        <nav aria-label="Main navigation">
          <p className="nav-label">Plan</p>
          {[["today", "Today", counts.today], ["upcoming", "Upcoming", counts.upcoming], ["all", "All tasks", tasks.length], ["done", "Completed", counts.done]].map(([key, label, count]) => (
            <button className={`nav-item ${view === key ? "active" : ""}`} onClick={() => setView(key)} key={key}>
              <span>{label}</span><span className="nav-count">{count}</span>
            </button>
          ))}
          <p className="nav-label project-heading">Projects</p>
          {projects.filter((item) => item !== "All").map((item, i) => (
            <button className={`nav-item project-item ${project === item ? "active" : ""}`} key={item} onClick={() => { setProject(project === item ? "All" : item); setView("all"); }}>
              <span><i className={`project-dot dot-${i % 3}`} />{item}</span>
              <span className="nav-count">{tasks.filter((task) => task.project === item && task.status !== "done").length}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">Local by design</span>
          <p>Your plan stays on this device. No account, no noise.</p>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="mobile-brand brand-mark" aria-label="Open navigation"><Icons.Check /></button>
          <label className="search"><Icons.Search /><span className="sr-only">Search tasks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your plan…" /></label>
          <button className="add-button" onClick={() => setIsAdding(true)}><Icons.Plus /><span>Add task</span></button>
        </header>

        <div className="workspace">
          <section className="hero">
            <div>
              <p className="date-line">{dateLabel}</p>
              <h1>{viewLabels[view]}</h1>
              <p>{view === "today" ? "A clear plan for a focused day." : `Keep ${viewLabels[view].toLowerCase()} in view.`}</p>
            </div>
            <div className="progress-card" aria-label={`${completion}% of all tasks completed`}>
              <div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` }}><span>{completion}%</span></div>
              <div><strong>{counts.done} completed</strong><span>of {tasks.length} total tasks</span></div>
            </div>
          </section>

          <section className="metrics" aria-label="Task summary">
            <article><span className="metric-label">Open today</span><strong>{counts.today.toString().padStart(2, "0")}</strong><small>{counts.today ? "Ready when you are" : "Your day is clear"}</small></article>
            <article><span className="metric-label">Coming up</span><strong>{counts.upcoming.toString().padStart(2, "0")}</strong><small>On the horizon</small></article>
            <article className="accent-metric"><span className="metric-label">Momentum</span><strong>{counts.done}</strong><small>tasks completed</small></article>
          </section>

          <section className="task-section">
            <div className="section-heading">
              <h2>{project !== "All" ? project : viewLabels[view]}</h2>
              <select aria-label="Filter by project" value={project} onChange={(event) => setProject(event.target.value)}>
                {projects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="task-list">
              {visibleTasks.length ? visibleTasks.map((task) => (
                <article className={`task-row ${task.status === "done" ? "is-done" : ""}`} key={task.id}>
                  <button className="check-button" onClick={() => toggleTask(task.id)} aria-label={`${task.status === "done" ? "Reopen" : "Complete"} ${task.title}`}>
                    {task.status === "done" && <Icons.Check size={15} />}
                  </button>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.note && <p>{task.note}</p>}
                    <div className="task-meta"><span><Icons.Calendar />{formatDate(task.due)}</span><span className="project-tag">{task.project}</span></div>
                  </div>
                  <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                </article>
              )) : (
                <div className="empty-state"><span className="empty-check"><Icons.Check size={28} /></span><h3>Nothing here</h3><p>A little breathing room looks good on you.</p><button onClick={() => setIsAdding(true)}>Add a task</button></div>
              )}
            </div>
          </section>
        </div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[["today", "Today"], ["upcoming", "Upcoming"], ["all", "All"], ["done", "Done"]].map(([key, label]) => (
            <button className={view === key ? "active" : ""} onClick={() => setView(key)} key={key}>
              <span>{key === "done" ? "✓" : key === "upcoming" ? "○" : key === "all" ? "≡" : "•"}</span>{label}
            </button>
          ))}
        </nav>
      </main>

      {isAdding && <TaskModal onClose={() => setIsAdding(false)} onSubmit={addTask} projects={projects.filter((item) => item !== "All")} />}
    </div>
  );
}

function TaskModal({ onClose, onSubmit, projects }) {
  const [form, setForm] = useState({ title: "", note: "", project: projects[0] || "Personal", priority: "Medium", due: todayISO() });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    if (form.title.trim()) onSubmit({ ...form, title: form.title.trim(), note: form.note.trim() });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-header"><div><span className="eyebrow">New task</span><h2>What needs doing?</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icons.Close /></button></div>
        <label>Task name<input autoFocus required value={form.title} onChange={update("title")} placeholder="e.g. Send project update" /></label>
        <label>Note <span>Optional</span><textarea value={form.note} onChange={update("note")} placeholder="Add a little context…" /></label>
        <div className="form-grid">
          <label>Due date<input type="date" value={form.due} onChange={update("due")} /></label>
          <label>Priority<select value={form.priority} onChange={update("priority")}><option>Low</option><option>Medium</option><option>High</option></select></label>
        </div>
        <label>Project<select value={form.project} onChange={update("project")}>{projects.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="add-button" type="submit">Add to plan</button></div>
      </form>
    </div>
  );
}

export default App;
