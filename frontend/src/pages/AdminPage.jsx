import { useCallback, useEffect, useMemo, useState } from "react";
import { useProgram } from "../context/ProgramContext";
import * as api from "../services/api";
import AdminCourseDeep from "../components/admin/AdminCourseDeep";

const initialCourseForm = { code: "", name: "", credits: 3, ltp: "3-1-0", semester: 1, type: "core", description: "" };

const COURSE_TYPE_OPTIONS = [
  { value: "core", label: "Core" },
  { value: "modern", label: "Modern / emerging" },
  { value: "lab", label: "Laboratory" },
  { value: "elec", label: "Elective" },
  { value: "proj", label: "Project" },
  { value: "inter", label: "Interdisciplinary" },
];

const TAB_HINTS = {
  courses:
    "Work applies to the programme shown in the banner below. Use Course info for codes and credits; use Syllabus for units, outcomes, and downloads.",
  pos: "These statements describe what graduates achieve. They appear on the public Programme outcomes page for this degree.",
  programs: "Create or rename degree programmes, or copy an entire curriculum. Day-to-day updates usually happen under Courses.",
};

function courseTypeLabel(value) {
  return COURSE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function AdminPage() {
  const { programId, programs, refreshPrograms } = useProgram();
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [isAuthed, setIsAuthed] = useState(!!api.authApi.getToken());
  const [mainTab, setMainTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [courseEditId, setCourseEditId] = useState(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [deepCourse, setDeepCourse] = useState(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseSemesterFilter, setCourseSemesterFilter] = useState("all");
  const [courseTypeFilter, setCourseTypeFilter] = useState("all");

  const [progList, setProgList] = useState([]);
  const [progForm, setProgForm] = useState({ name: "", code: "", total_credits: 164 });
  const [progEditId, setProgEditId] = useState(null);
  const [cloneForm, setCloneForm] = useState({ sourceId: "", name: "", code: "", total_credits: 164 });

  const [poList, setPoList] = useState([]);
  const [poForm, setPoForm] = useState({ po_number: "PO1", name: "", description: "" });
  const [poEditId, setPoEditId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const notify = useCallback((text, kind = "success") => {
    if (kind === "error") setError(text);
    else {
      setError("");
      setMsg(text);
    }
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 6000);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    if (!deepCourse && !courseFormOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [deepCourse, courseFormOpen]);

  async function loadCourses() {
    if (!programId) return;
    setLoading(true);
    setError("");
    try {
      setCourses(await api.getProgramCourses(programId));
    } catch (e) {
      setError(e.message || "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProgramsList() {
    try {
      setProgList(await api.getPrograms());
    } catch (e) {
      setError(e.message || "Could not load programmes.");
    }
  }

  async function loadPOs() {
    if (!programId) return;
    try {
      setPoList(await api.getProgramPOs(programId));
    } catch (e) {
      setError(e.message || "Could not load programme outcomes.");
    }
  }

  useEffect(() => {
    if (!isAuthed) return;
    loadCourses();
  }, [isAuthed, programId]);

  useEffect(() => {
    if (!isAuthed || mainTab !== "programs") return;
    loadProgramsList();
  }, [isAuthed, mainTab]);

  useEffect(() => {
    if (!isAuthed || mainTab !== "pos") return;
    loadPOs();
  }, [isAuthed, mainTab, programId]);

  async function onLogin(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const res = await api.authApi.login(auth.email, auth.password);
      api.authApi.setToken(res.token);
      setIsAuthed(true);
      setMsg("Welcome back.");
    } catch (err) {
      setError(err.message || "Sign-in failed. Check your email and password.");
    }
  }

  function onLogout() {
    api.authApi.clearToken();
    setIsAuthed(false);
    setCourses([]);
    setDeepCourse(null);
    setMsg("You have signed out.");
  }

  function resetCourseForm() {
    setCourseEditId(null);
    setCourseForm(initialCourseForm);
    setCourseFormOpen(false);
  }

  async function onSubmitCourse(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const payload = { ...courseForm, program_id: programId, credits: Number(courseForm.credits), semester: Number(courseForm.semester) };
      if (courseEditId) {
        await api.adminUpdateCourse(courseEditId, payload);
        setMsg("Course saved.");
      } else {
        await api.adminCreateCourse(payload);
        setMsg("Course added.");
      }
      resetCourseForm();
      await loadCourses();
    } catch (err) {
      setError(err.message || "Could not save the course.");
    }
  }

  async function onDeleteCourse(id) {
    if (!window.confirm("Remove this course and all of its syllabus data? This cannot be undone.")) return;
    setError("");
    setMsg("");
    try {
      await api.adminDeleteCourse(id);
      if (deepCourse?.id === id) setDeepCourse(null);
      setMsg("Course removed.");
      await loadCourses();
    } catch (err) {
      setError(err.message || "Could not remove the course.");
    }
  }

  function startEditCourse(c) {
    setCourseEditId(c.id);
    if (deepCourse) setDeepCourse(null);
    setCourseForm({
      code: c.code,
      name: c.name,
      credits: c.credits,
      ltp: c.ltp || "3-1-0",
      semester: c.semester,
      type: c.type,
      description: c.description || "",
    });
    setCourseFormOpen(true);
  }

  function startAddCourse() {
    setCourseEditId(null);
    setCourseForm(initialCourseForm);
    if (deepCourse) setDeepCourse(null);
    setCourseFormOpen(true);
  }

  async function saveProgram(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const body = { name: progForm.name, code: progForm.code, total_credits: Number(progForm.total_credits) };
      if (progEditId) {
        await api.adminUpdateProgram(progEditId, body);
        setMsg("Programme saved.");
      } else {
        await api.adminCreateProgram(body);
        setMsg("Programme created.");
      }
      setProgEditId(null);
      setProgForm({ name: "", code: "", total_credits: 164 });
      await loadProgramsList();
      await refreshPrograms();
    } catch (err) {
      setError(err.message || "Could not save the programme.");
    }
  }

  function editProgram(p) {
    setProgEditId(p.id);
    setProgForm({ name: p.name, code: p.code, total_credits: p.total_credits });
  }

  async function deleteProgram(id) {
    if (!window.confirm("Delete this programme and all courses and outcomes under it? This cannot be undone.")) return;
    try {
      await api.adminDeleteProgram(id);
      setMsg("Programme removed.");
      await loadProgramsList();
      await refreshPrograms();
    } catch (err) {
      setError(err.message || "Could not delete the programme.");
    }
  }

  async function doClone(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.adminCloneProgram(Number(cloneForm.sourceId), {
        name: cloneForm.name,
        code: cloneForm.code,
        total_credits: Number(cloneForm.total_credits),
      });
      setMsg("Copy created. You can switch to it from the site header.");
      setCloneForm({ sourceId: "", name: "", code: "", total_credits: 164 });
      await loadProgramsList();
      await refreshPrograms();
    } catch (err) {
      setError(err.message || "Could not duplicate the programme.");
    }
  }

  async function savePO(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const body = { program_id: programId, ...poForm };
      if (poEditId) {
        await api.adminUpdatePO(poEditId, body);
        setMsg("Outcome saved.");
      } else {
        await api.adminCreatePO(body);
        setMsg("Outcome added.");
      }
      setPoEditId(null);
      setPoForm({ po_number: "PO1", name: "", description: "" });
      await loadPOs();
    } catch (err) {
      setError(err.message || "Could not save this outcome.");
    }
  }

  async function deletePO(id) {
    if (!window.confirm("Remove this programme outcome?")) return;
    try {
      await api.adminDeletePO(id);
      setMsg("Outcome removed.");
      await loadPOs();
    } catch (err) {
      setError(err.message || "Could not remove the outcome.");
    }
  }

  if (!isAuthed) {
    return (
      <div className="page-wrap admin-page">
        <div className="admin-eyebrow">Staff only</div>
        <h1 className="admin-page-title">Curriculum editor</h1>
        <p className="admin-page-lead">Sign in to update courses, syllabus, and programme information. Visitors only see published content on the main site.</p>

        <div className="card admin-login-card" style={{ marginTop: 28 }}>
          <form onSubmit={onLogin}>
            <label className="admin-field">
              <span>Work email</span>
              <input value={auth.email} onChange={(e) => setAuth((s) => ({ ...s, email: e.target.value }))} type="email" autoComplete="username" required placeholder="you@miet.ac.in" />
            </label>
            <label className="admin-field" style={{ marginTop: 12 }}>
              <span>Password</span>
              <input value={auth.password} onChange={(e) => setAuth((s) => ({ ...s, password: e.target.value }))} type="password" autoComplete="current-password" required />
            </label>
            <div className="admin-actions" style={{ marginTop: 20 }}>
              <button className="admin-btn admin-btn-primary" type="submit">
                Sign in
              </button>
            </div>
            {error ? <div className="admin-error">{error}</div> : null}
          </form>
        </div>
      </div>
    );
  }

  const currentProgram = programs.find((p) => p.id === programId);
  const semesterOptions = useMemo(
    () => [...new Set(courses.map((c) => Number(c.semester)).filter((s) => Number.isFinite(s)))].sort((a, b) => a - b),
    [courses]
  );
  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses
      .filter((c) => {
        if (courseSemesterFilter !== "all" && Number(c.semester) !== Number(courseSemesterFilter)) return false;
        if (courseTypeFilter !== "all" && c.type !== courseTypeFilter) return false;
        if (!q) return true;
        return `${c.code} ${c.name}`.toLowerCase().includes(q);
      })
      .sort((a, b) => Number(a.semester) - Number(b.semester) || String(a.code).localeCompare(String(b.code)));
  }, [courses, courseSearch, courseSemesterFilter, courseTypeFilter]);
  const coursesBySemester = useMemo(() => {
    const grouped = new Map();
    for (const c of filteredCourses) {
      const sem = Number(c.semester) || 0;
      if (!grouped.has(sem)) grouped.set(sem, []);
      grouped.get(sem).push(c);
    }
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, [filteredCourses]);

  return (
    <div className="page-wrap admin-page admin-page-wide">
      <div className="admin-topbar">
        <div>
          <div className="admin-eyebrow">Staff dashboard</div>
          <h1 className="admin-page-title">Manage curriculum</h1>
          <p className="admin-page-lead">Update what students and faculty see on the public site. Changes save to the database immediately.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-program-banner">
        <span>
          You are editing <strong>{currentProgram?.name ?? "—"}</strong>
          {currentProgram?.code ? ` (${currentProgram.code})` : ""}. To work on another degree, switch programme in the <strong>site header</strong> above.
        </span>
      </div>

      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      {msg ? <div className="admin-alert admin-alert-success">{msg}</div> : null}

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {[
          { id: "courses", label: "Courses" },
          { id: "pos", label: "Programme outcomes" },
          { id: "programs", label: "Programmes" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mainTab === t.id}
            className={`admin-tab ${mainTab === t.id ? "active" : ""}`}
            onClick={() => setMainTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="admin-tab-blurb">{TAB_HINTS[mainTab]}</p>

      {mainTab === "programs" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="admin-card-head">
            <div className="admin-card-title">{progEditId ? "Edit programme" : "New programme"}</div>
            <div className="admin-card-desc">Official name, short code, and total credits for the degree.</div>
          </div>
          <form className="admin-form-grid" onSubmit={saveProgram}>
            <label className="admin-field">
              <span>Programme name</span>
              <input value={progForm.name} onChange={(e) => setProgForm((s) => ({ ...s, name: e.target.value }))} required placeholder="e.g. B.Tech Computer Science" />
            </label>
            <label className="admin-field">
              <span>Short code</span>
              <input value={progForm.code} onChange={(e) => setProgForm((s) => ({ ...s, code: e.target.value }))} required placeholder="e.g. CSE" />
            </label>
            <label className="admin-field">
              <span>Total credits (degree)</span>
              <input type="number" value={progForm.total_credits} onChange={(e) => setProgForm((s) => ({ ...s, total_credits: e.target.value }))} required min={1} />
            </label>
            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-primary" type="submit">
                {progEditId ? "Save programme" : "Create programme"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => {
                  setProgEditId(null);
                  setProgForm({ name: "", code: "", total_credits: 164 });
                }}
              >
                Clear form
              </button>
            </div>
          </form>

          <div className="section-h" style={{ marginTop: 24 }}>
            Duplicate a programme
          </div>
          <p className="admin-help" style={{ marginBottom: 12 }}>
            Copies all courses, units, and mappings into a new programme. Useful for a new batch or a sibling degree.
          </p>
          <form className="admin-form-grid" onSubmit={doClone}>
            <label className="admin-field">
              <span>Copy from</span>
              <select value={cloneForm.sourceId} onChange={(e) => setCloneForm((s) => ({ ...s, sourceId: e.target.value }))} required>
                <option value="">Choose programme…</option>
                {progList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>New programme name</span>
              <input value={cloneForm.name} onChange={(e) => setCloneForm((s) => ({ ...s, name: e.target.value }))} required />
            </label>
            <label className="admin-field">
              <span>New short code</span>
              <input value={cloneForm.code} onChange={(e) => setCloneForm((s) => ({ ...s, code: e.target.value }))} required />
            </label>
            <label className="admin-field">
              <span>Total credits</span>
              <input type="number" value={cloneForm.total_credits} onChange={(e) => setCloneForm((s) => ({ ...s, total_credits: e.target.value }))} required min={1} />
            </label>
            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-secondary" type="submit">
                Create copy
              </button>
            </div>
          </form>

          <div className="admin-table-wrap" style={{ marginTop: 20 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Code</th>
                  <th>Credits</th>
                  <th className="admin-table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {progList.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.code}</td>
                    <td>{p.total_credits}</td>
                    <td className="admin-table-actions">
                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => editProgram(p)}>
                        Edit
                      </button>{" "}
                      <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteProgram(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mainTab === "pos" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="admin-card-head">
            <div className="admin-card-title">{poEditId ? "Edit outcome" : "Add programme outcome"}</div>
            <div className="admin-card-desc">Identifier (e.g. PO1), short title, and full text. These match the public PO page.</div>
          </div>
          <form className="admin-form-grid" onSubmit={savePO}>
            <label className="admin-field">
              <span>Label</span>
              <input value={poForm.po_number} onChange={(e) => setPoForm((s) => ({ ...s, po_number: e.target.value }))} required placeholder="PO1" />
            </label>
            <label className="admin-field admin-field-full">
              <span>Short name</span>
              <input value={poForm.name} onChange={(e) => setPoForm((s) => ({ ...s, name: e.target.value }))} required />
            </label>
            <label className="admin-field admin-field-full">
              <span>Full description</span>
              <textarea rows={4} value={poForm.description} onChange={(e) => setPoForm((s) => ({ ...s, description: e.target.value }))} required />
            </label>
            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-primary" type="submit">
                {poEditId ? "Save outcome" : "Add outcome"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => {
                  setPoEditId(null);
                  setPoForm({ po_number: "PO1", name: "", description: "" });
                }}
              >
                Clear form
              </button>
            </div>
          </form>
          <div className="admin-list" style={{ marginTop: 16 }}>
            {poList.map((p) => (
              <div className="admin-row" key={p.id}>
                <div className="admin-row-main">
                  <div className="admin-row-title">
                    {p.po_number} — {p.name}
                  </div>
                  <div className="admin-row-sub">
                    {p.description.slice(0, 160)}
                    {p.description.length > 160 ? "…" : ""}
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={() => {
                      setPoEditId(p.id);
                      setPoForm({ po_number: p.po_number, name: p.name, description: p.description });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="admin-btn admin-btn-danger" onClick={() => deletePO(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mainTab === "courses" && (
        <>
          <div className="card">
            <div className="admin-card-head">
              <div className="admin-card-title">Courses in this programme</div>
              <div className="admin-card-desc">Edit listing fields here, or open the syllabus editor for units, outcomes, files, and outcome mapping.</div>
            </div>
            <div className="admin-actions" style={{ marginBottom: 12 }}>
              <button type="button" className="admin-btn admin-btn-primary" onClick={startAddCourse}>
                Add course
              </button>
            </div>
            <div className="admin-course-toolbar">
              <label className="admin-field admin-field-search">
                <span>Search course</span>
                <input
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search by code or title"
                />
              </label>
              <label className="admin-field">
                <span>Semester</span>
                <select value={courseSemesterFilter} onChange={(e) => setCourseSemesterFilter(e.target.value)}>
                  <option value="all">All semesters</option>
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Category</span>
                <select value={courseTypeFilter} onChange={(e) => setCourseTypeFilter(e.target.value)}>
                  <option value="all">All categories</option>
                  {COURSE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-actions" style={{ alignSelf: "end" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={() => {
                    setCourseSearch("");
                    setCourseSemesterFilter("all");
                    setCourseTypeFilter("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
            <p className="admin-help" style={{ marginBottom: 12 }}>
              Showing <strong>{filteredCourses.length}</strong> of <strong>{courses.length}</strong> courses
            </p>
            {loading ? <p className="overview-desc">Loading courses…</p> : (
              <>
                <div className="admin-list">
                  {coursesBySemester.map(([sem, list]) => (
                    <section key={sem} className="admin-semester-group">
                      <div className="admin-semester-head">
                        <h4>Semester {sem}</h4>
                        <span>{list.length} course{list.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="admin-list">
                        {list.map((c) => (
                          <div className="admin-row" key={c.id}>
                            <div className="admin-row-main">
                              <div className="admin-row-title">
                                {c.code} — {c.name}
                              </div>
                              <div className="admin-row-sub">
                                {c.credits} credits · {courseTypeLabel(c.type)}
                              </div>
                            </div>
                            <div className="admin-row-actions">
                              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => startEditCourse(c)}>
                                Course info
                              </button>
                              <button type="button" className="admin-btn admin-btn-primary" onClick={() => setDeepCourse(c)}>
                                Syllabus &amp; outcomes
                              </button>
                              <button type="button" className="admin-btn admin-btn-danger" onClick={() => onDeleteCourse(c.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                {!courses.length ? <p className="overview-desc">No courses yet for this programme. Add one above.</p> : null}
                {!!courses.length && !filteredCourses.length ? (
                  <p className="overview-desc">No courses match your filters. Try clearing filters.</p>
                ) : null}
              </>
            )}
          </div>

          {deepCourse && programId ? (
            <div className="admin-modal-backdrop" onClick={() => setDeepCourse(null)}>
              <div className="admin-modal-shell" onClick={(e) => e.stopPropagation()}>
                <AdminCourseDeep course={deepCourse} programId={programId} onNotify={notify} onClose={() => setDeepCourse(null)} />
              </div>
            </div>
          ) : null}

          {courseFormOpen ? (
            <div className="admin-modal-backdrop" onClick={() => setCourseFormOpen(false)}>
              <div className="admin-modal-shell admin-modal-shell-sm" onClick={(e) => e.stopPropagation()}>
                <form className="card admin-form-grid admin-course-form-target" onSubmit={onSubmitCourse} style={{ marginBottom: 0 }}>
                  <div className="admin-card-head admin-field-full" style={{ paddingBottom: 12 }}>
                    <div className="admin-card-title">{courseEditId ? "Edit course details" : "Add a course"}</div>
                    <div className="admin-card-desc">Code, title, semester, and type. For syllabus content, use “Syllabus &amp; outcomes”.</div>
                  </div>
                  <label className="admin-field">
                    <span>Course code</span>
                    <input value={courseForm.code} onChange={(e) => setCourseForm((s) => ({ ...s, code: e.target.value }))} required placeholder="e.g. CS301" />
                  </label>
                  <label className="admin-field">
                    <span>Course title</span>
                    <input value={courseForm.name} onChange={(e) => setCourseForm((s) => ({ ...s, name: e.target.value }))} required />
                  </label>
                  <label className="admin-field">
                    <span>Credits</span>
                    <input type="number" min="0" value={courseForm.credits} onChange={(e) => setCourseForm((s) => ({ ...s, credits: e.target.value }))} required />
                  </label>
                  <label className="admin-field">
                    <span>L–T–P</span>
                    <input value={courseForm.ltp} onChange={(e) => setCourseForm((s) => ({ ...s, ltp: e.target.value }))} required placeholder="3-1-0" />
                  </label>
                  <label className="admin-field">
                    <span>Semester</span>
                    <input type="number" min="1" value={courseForm.semester} onChange={(e) => setCourseForm((s) => ({ ...s, semester: e.target.value }))} required />
                  </label>
                  <label className="admin-field">
                    <span>Category</span>
                    <select value={courseForm.type} onChange={(e) => setCourseForm((s) => ({ ...s, type: e.target.value }))}>
                      {COURSE_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field admin-field-full">
                    <span>Short description (optional)</span>
                    <textarea value={courseForm.description} onChange={(e) => setCourseForm((s) => ({ ...s, description: e.target.value }))} rows={3} placeholder="Shown on the course overview." />
                  </label>
                  <div className="admin-actions admin-field-full">
                    <button className="admin-btn admin-btn-primary" type="submit" disabled={loading}>
                      {courseEditId ? "Save course details" : "Add course"}
                    </button>
                    <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setCourseFormOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default AdminPage;
