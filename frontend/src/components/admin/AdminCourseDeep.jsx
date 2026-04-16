import { useEffect, useState } from "react";
import * as api from "../../services/api";

const CONTENT_TABS = [
  { id: "units", label: "Units & syllabus", hint: "Weekly units, topics, and teaching notes—this is what appears on the public course page under each unit." },
  { id: "cos", label: "Learning outcomes", hint: "What students should be able to do after the course. These feed the CO–PO matrix on the site." },
  { id: "resources", label: "Downloads & links", hint: "Videos, notes, and repositories linked from the course page." },
  { id: "copomap", label: "Outcome mapping", hint: "Connect each course outcome to a programme outcome (PO) and set how strong the link is." },
];

const RESOURCE_TYPES = [
  { value: "video", label: "Video" },
  { value: "notes", label: "Notes / PDF" },
  { value: "repo", label: "Code repository" },
];

const LEVEL_OPTIONS = [
  { value: "strong", label: "Strong" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
];

const REF_BOOK_TYPES = ["Textbook", "Reference", "Journal", "Online resource", "Other"];

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function normalizeTopics(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.length ? arr.map((x) => ({ m: String(x?.m ?? ""), s: String(x?.s ?? "") })) : [{ m: "", s: "" }];
}

function normalizeTeaching(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.length ? arr.map((x) => ({ n: String(x?.n ?? ""), d: String(x?.d ?? "") })) : [{ n: "", d: "" }];
}

function normalizeAssessments(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.length
    ? arr.map((x) => ({
        t: String(x?.t ?? ""),
        d: String(x?.d ?? ""),
        m: x?.m != null && x?.m !== "" ? String(x.m) : "",
      }))
    : [{ t: "", d: "", m: "" }];
}

function normalizeReferences(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.length
    ? arr.map((x) => ({
        ti: String(x?.ti ?? ""),
        au: String(x?.au ?? ""),
        ed: String(x?.ed ?? ""),
        type: String(x?.type ?? "Textbook"),
        col: HEX_COLOR.test(String(x?.col)) ? String(x.col) : "#1e40af",
      }))
    : [{ ti: "", au: "", ed: "", type: "Textbook", col: "#1e40af" }];
}

function stripTopics(rows) {
  return rows.map((r) => ({ m: r.m.trim(), s: r.s.trim() })).filter((r) => r.m || r.s);
}

function stripTeaching(rows) {
  return rows.map((r) => ({ n: r.n.trim(), d: r.d.trim() })).filter((r) => r.n || r.d);
}

function stripAssessments(rows) {
  return rows
    .map((r) => ({
      t: r.t.trim(),
      d: r.d.trim(),
      m: Number(String(r.m).replace(/,/g, ".")) || 0,
    }))
    .filter((r) => r.t || r.d || r.m);
}

function stripReferences(rows) {
  return rows
    .map((r) => ({
      ti: r.ti.trim(),
      au: r.au.trim(),
      ed: r.ed.trim(),
      type: r.type.trim() || "Textbook",
      col: HEX_COLOR.test(r.col) ? r.col : "#1e40af",
    }))
    .filter((r) => r.ti || r.au || r.ed);
}

const emptyUnit = () => ({
  unit_number: 1,
  title: "",
  hours: 12,
  bloom_level: "Understand / Apply",
  topics: [{ m: "", s: "" }],
  teaching_methods: [{ n: "", d: "" }],
  assessments: [{ t: "", d: "", m: "" }],
  references: [{ ti: "", au: "", ed: "", type: "Textbook", col: "#1e40af" }],
});

function AdminCourseDeep({ course, programId, onNotify, onClose }) {
  const courseId = course.id;
  const [units, setUnits] = useState([]);
  const [cos, setCos] = useState([]);
  const [resources, setResources] = useState([]);
  const [copomap, setCopomap] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("units");

  const [unitForm, setUnitForm] = useState(emptyUnit());
  const [unitEditId, setUnitEditId] = useState(null);

  const [coForm, setCoForm] = useState({ co_number: 1, description: "" });
  const [coEditId, setCoEditId] = useState(null);

  const [resForm, setResForm] = useState({ type: "notes", title: "", link: "#" });
  const [resEditId, setResEditId] = useState(null);

  const [mapForm, setMapForm] = useState({ co_id: "", po_id: "", level: "moderate" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [u, c, r, m, p] = await Promise.all([
          api.getCourseUnits(courseId),
          api.getCourseCos(courseId),
          api.getCourseResources(courseId),
          api.getCourseCopomap(courseId),
          api.getProgramPOs(programId),
        ]);
        if (cancelled) return;
        setUnits(u);
        setCos(c);
        setResources(r);
        setCopomap(m);
        setPos(p);
        setMapForm((f) => ({
          ...f,
          co_id: f.co_id || (c[0] ? String(c[0].id) : ""),
          po_id: f.po_id || (p[0] ? String(p[0].id) : ""),
        }));
      } catch (e) {
        if (!cancelled) onNotify(e.message || "Could not load this course.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, programId, onNotify]);

  function resetUnitForm() {
    setUnitEditId(null);
    setUnitForm(emptyUnit());
  }

  function startEditUnit(u) {
    setUnitEditId(u.id);
    setUnitForm({
      unit_number: u.unit_number,
      title: u.title,
      hours: u.hours,
      bloom_level: u.bloom_level || "",
      topics: normalizeTopics(u.topics),
      teaching_methods: normalizeTeaching(u.teaching_methods),
      assessments: normalizeAssessments(u.assessments),
      references: normalizeReferences(u.references),
    });
  }

  async function saveUnit(e) {
    e.preventDefault();
    try {
      const payload = {
        course_id: courseId,
        unit_number: Number(unitForm.unit_number),
        title: unitForm.title,
        hours: Number(unitForm.hours),
        bloom_level: unitForm.bloom_level,
        topics: stripTopics(unitForm.topics),
        teaching_methods: stripTeaching(unitForm.teaching_methods),
        assessments: stripAssessments(unitForm.assessments),
        references: stripReferences(unitForm.references),
      };
      if (unitEditId) {
        await api.adminUpdateUnit(unitEditId, payload);
        onNotify("Unit saved.");
      } else {
        await api.adminCreateUnit(payload);
        onNotify("Unit added.");
      }
      resetUnitForm();
      await reload();
    } catch (err) {
      onNotify(err.message || "Could not save this unit.", "error");
    }
  }

  async function reload() {
    const [u, c, r, m, p] = await Promise.all([
      api.getCourseUnits(courseId),
      api.getCourseCos(courseId),
      api.getCourseResources(courseId),
      api.getCourseCopomap(courseId),
      api.getProgramPOs(programId),
    ]);
    setUnits(u);
    setCos(c);
    setResources(r);
    setCopomap(m);
    setPos(p);
  }

  async function deleteUnit(id) {
    if (!window.confirm("Remove this unit from the syllabus?")) return;
    await api.adminDeleteUnit(id);
    onNotify("Unit removed.");
    await reload();
  }

  function resetCoForm() {
    setCoEditId(null);
    setCoForm({ co_number: 1, description: "" });
  }

  async function saveCO(e) {
    e.preventDefault();
    const payload = { course_id: courseId, co_number: Number(coForm.co_number), description: coForm.description };
    if (coEditId) {
      await api.adminUpdateCO(coEditId, payload);
      onNotify("Outcome saved.");
    } else {
      await api.adminCreateCO(payload);
      onNotify("Outcome added.");
    }
    resetCoForm();
    await reload();
  }

  async function deleteCO(id) {
    if (!window.confirm("Remove this learning outcome?")) return;
    await api.adminDeleteCO(id);
    onNotify("Outcome removed.");
    await reload();
  }

  function resetResForm() {
    setResEditId(null);
    setResForm({ type: "notes", title: "", link: "#" });
  }

  async function saveResource(e) {
    e.preventDefault();
    const payload = { course_id: courseId, ...resForm };
    if (resEditId) {
      await api.adminUpdateResource(resEditId, payload);
      onNotify("Link saved.");
    } else {
      await api.adminCreateResource(payload);
      onNotify("Link added.");
    }
    resetResForm();
    await reload();
  }

  async function deleteResource(id) {
    if (!window.confirm("Remove this link?")) return;
    await api.adminDeleteResource(id);
    onNotify("Link removed.");
    await reload();
  }

  async function addMap(e) {
    e.preventDefault();
    await api.adminCreateCopomap({
      co_id: Number(mapForm.co_id),
      po_id: Number(mapForm.po_id),
      level: mapForm.level,
    });
    onNotify("Mapping added.");
    await reload();
  }

  async function updateMapLevel(row, level) {
    await api.adminUpdateCopomap(row.id, { level });
    onNotify("Strength updated.");
    await reload();
  }

  async function deleteMap(id) {
    if (!window.confirm("Remove this mapping?")) return;
    await api.adminDeleteCopomap(id);
    onNotify("Mapping removed.");
    await reload();
  }

  const activeHint = CONTENT_TABS.find((t) => t.id === subTab)?.hint ?? "";

  if (loading && !units.length && !cos.length) {
    return (
      <div className="admin-subcard">
        <p className="overview-desc">Loading syllabus…</p>
      </div>
    );
  }

  return (
    <div className="admin-subcard">
      <div className="admin-subcard-head">
        <div>
          <div className="admin-subcard-title">
            {course.code} — {course.name}
          </div>
          <p className="admin-subcard-lead">Everything below is what visitors see on the public course page for this subject.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="admin-inner-tabs" role="tablist" aria-label="Course content">
        {CONTENT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={subTab === t.id}
            className={`admin-inner-tab ${subTab === t.id ? "active" : ""}`}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="admin-tab-blurb">{activeHint}</p>

      {subTab === "units" && (
        <div className="admin-panel-block">
          <div className="admin-info-box" style={{ marginBottom: 18 }}>
            Add <strong>rows</strong> for each topic, activity, assessment, or reference. You do not need to know JSON—the site saves this in the right format for the public pages.
          </div>

          <form className="admin-form-grid" onSubmit={saveUnit}>
            <div className="section-h admin-field-full" style={{ marginTop: 0 }}>
              {unitEditId ? "Edit unit" : "Add unit"}
            </div>
            <label className="admin-field">
              <span>Unit number</span>
              <input type="number" min={1} value={unitForm.unit_number} onChange={(e) => setUnitForm((s) => ({ ...s, unit_number: e.target.value }))} required />
            </label>
            <label className="admin-field admin-field-full">
              <span>Unit title</span>
              <input value={unitForm.title} onChange={(e) => setUnitForm((s) => ({ ...s, title: e.target.value }))} required />
            </label>
            <label className="admin-field">
              <span>Hours</span>
              <input type="number" min={0} value={unitForm.hours} onChange={(e) => setUnitForm((s) => ({ ...s, hours: e.target.value }))} />
            </label>
            <label className="admin-field admin-field-full">
              <span>Learning level (Bloom)</span>
              <input value={unitForm.bloom_level} onChange={(e) => setUnitForm((s) => ({ ...s, bloom_level: e.target.value }))} placeholder="e.g. Understand / Apply" />
            </label>

            <div className="admin-repeat-section admin-field-full">
              <span className="admin-repeat-label">Topics &amp; subtopics</span>
              <p className="admin-repeat-hint">One block per topic. Use the second box for a sub-line under that topic.</p>
              {unitForm.topics.map((row, i) => (
                <div key={`t-${i}`} className="admin-repeat-card">
                  <div className="admin-repeat-card-top">
                    <span>Topic {i + 1}</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setUnitForm((s) => ({
                          ...s,
                          topics: s.topics.filter((_, idx) => idx !== i).length ? s.topics.filter((_, idx) => idx !== i) : [{ m: "", s: "" }],
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-repeat-grid">
                    <div className="admin-field-compact">
                      <label>Main topic</label>
                      <input
                        value={row.m}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.topics];
                            next[i] = { ...next[i], m: e.target.value };
                            return { ...s, topics: next };
                          })
                        }
                        placeholder="e.g. Introduction to graphs"
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Subtopic (optional)</label>
                      <input
                        value={row.s}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.topics];
                            next[i] = { ...next[i], s: e.target.value };
                            return { ...s, topics: next };
                          })
                        }
                        placeholder="e.g. Terminology"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-repeat-add"
                onClick={() => setUnitForm((s) => ({ ...s, topics: [...s.topics, { m: "", s: "" }] }))}
              >
                + Add topic
              </button>
            </div>

            <div className="admin-repeat-section admin-field-full">
              <span className="admin-repeat-label">Teaching &amp; learning activities</span>
              <p className="admin-repeat-hint">e.g. Lecture, tutorial, hands-on lab — with a short description.</p>
              {unitForm.teaching_methods.map((row, i) => (
                <div key={`tm-${i}`} className="admin-repeat-card">
                  <div className="admin-repeat-card-top">
                    <span>Activity {i + 1}</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setUnitForm((s) => ({
                          ...s,
                          teaching_methods: s.teaching_methods.filter((_, idx) => idx !== i).length
                            ? s.teaching_methods.filter((_, idx) => idx !== i)
                            : [{ n: "", d: "" }],
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-repeat-grid">
                    <div className="admin-field-compact">
                      <label>Type / name</label>
                      <input
                        value={row.n}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.teaching_methods];
                            next[i] = { ...next[i], n: e.target.value };
                            return { ...s, teaching_methods: next };
                          })
                        }
                        placeholder="e.g. Lecture"
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Description</label>
                      <input
                        value={row.d}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.teaching_methods];
                            next[i] = { ...next[i], d: e.target.value };
                            return { ...s, teaching_methods: next };
                          })
                        }
                        placeholder="What students do"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-repeat-add"
                onClick={() => setUnitForm((s) => ({ ...s, teaching_methods: [...s.teaching_methods, { n: "", d: "" }] }))}
              >
                + Add activity
              </button>
            </div>

            <div className="admin-repeat-section admin-field-full">
              <span className="admin-repeat-label">Assessment tasks</span>
              <p className="admin-repeat-hint">Task name, details, and marks (weight).</p>
              {unitForm.assessments.map((row, i) => (
                <div key={`as-${i}`} className="admin-repeat-card">
                  <div className="admin-repeat-card-top">
                    <span>Assessment {i + 1}</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setUnitForm((s) => ({
                          ...s,
                          assessments: s.assessments.filter((_, idx) => idx !== i).length
                            ? s.assessments.filter((_, idx) => idx !== i)
                            : [{ t: "", d: "", m: "" }],
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-repeat-grid admin-repeat-grid--triple">
                    <div className="admin-field-compact">
                      <label>Task</label>
                      <input
                        value={row.t}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.assessments];
                            next[i] = { ...next[i], t: e.target.value };
                            return { ...s, assessments: next };
                          })
                        }
                        placeholder="e.g. Quiz"
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Details</label>
                      <input
                        value={row.d}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.assessments];
                            next[i] = { ...next[i], d: e.target.value };
                            return { ...s, assessments: next };
                          })
                        }
                        placeholder="Scope or rubric"
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Marks</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.m}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.assessments];
                            next[i] = { ...next[i], m: e.target.value };
                            return { ...s, assessments: next };
                          })
                        }
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-repeat-add"
                onClick={() => setUnitForm((s) => ({ ...s, assessments: [...s.assessments, { t: "", d: "", m: "" }] }))}
              >
                + Add assessment
              </button>
            </div>

            <div className="admin-repeat-section admin-field-full">
              <span className="admin-repeat-label">Textbooks &amp; references</span>
              <p className="admin-repeat-hint">Shown in the unit card on the public site. Colour is the small dot next to each line.</p>
              {unitForm.references.map((row, i) => (
                <div key={`ref-${i}`} className="admin-repeat-card">
                  <div className="admin-repeat-card-top">
                    <span>Reference {i + 1}</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setUnitForm((s) => ({
                          ...s,
                          references: s.references.filter((_, idx) => idx !== i).length
                            ? s.references.filter((_, idx) => idx !== i)
                            : [{ ti: "", au: "", ed: "", type: "Textbook", col: "#1e40af" }],
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-repeat-grid">
                    <div className="admin-field-compact">
                      <label>Title</label>
                      <input
                        value={row.ti}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.references];
                            next[i] = { ...next[i], ti: e.target.value };
                            return { ...s, references: next };
                          })
                        }
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Author</label>
                      <input
                        value={row.au}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.references];
                            next[i] = { ...next[i], au: e.target.value };
                            return { ...s, references: next };
                          })
                        }
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Edition</label>
                      <input
                        value={row.ed}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.references];
                            next[i] = { ...next[i], ed: e.target.value };
                            return { ...s, references: next };
                          })
                        }
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Type</label>
                      <input
                        list="refbook-types"
                        value={row.type}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.references];
                            next[i] = { ...next[i], type: e.target.value };
                            return { ...s, references: next };
                          })
                        }
                        placeholder="Textbook"
                      />
                    </div>
                    <div className="admin-field-compact">
                      <label>Accent colour</label>
                      <input
                        type="color"
                        value={HEX_COLOR.test(row.col) ? row.col : "#1e40af"}
                        onChange={(e) =>
                          setUnitForm((s) => {
                            const next = [...s.references];
                            next[i] = { ...next[i], col: e.target.value };
                            return { ...s, references: next };
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-repeat-add"
                onClick={() =>
                  setUnitForm((s) => ({
                    ...s,
                    references: [...s.references, { ti: "", au: "", ed: "", type: "Textbook", col: "#1e40af" }],
                  }))
                }
              >
                + Add reference
              </button>
              <datalist id="refbook-types">
                {REF_BOOK_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-primary" type="submit">
                {unitEditId ? "Save unit" : "Add unit"}
              </button>
              <button className="admin-btn admin-btn-ghost" type="button" onClick={resetUnitForm}>
                Clear
              </button>
            </div>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th className="admin-table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td>{u.unit_number}</td>
                    <td>{u.title}</td>
                    <td className="admin-table-actions">
                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => startEditUnit(u)}>
                        Edit
                      </button>
                      <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteUnit(u.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "cos" && (
        <div className="admin-panel-block">
          <form className="admin-form-grid" onSubmit={saveCO}>
            <div className="section-h admin-field-full" style={{ marginTop: 0 }}>
              {coEditId ? "Edit outcome" : "Add learning outcome"}
            </div>
            <label className="admin-field">
              <span>Outcome number</span>
              <input type="number" min={1} value={coForm.co_number} onChange={(e) => setCoForm((s) => ({ ...s, co_number: e.target.value }))} required />
            </label>
            <label className="admin-field admin-field-full">
              <span>Statement</span>
              <textarea rows={4} value={coForm.description} onChange={(e) => setCoForm((s) => ({ ...s, description: e.target.value }))} required placeholder="Students will be able to…" />
            </label>
            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-primary" type="submit">
                {coEditId ? "Save outcome" : "Add outcome"}
              </button>
              <button className="admin-btn admin-btn-ghost" type="button" onClick={resetCoForm}>
                Clear
              </button>
            </div>
          </form>
          <div className="admin-list" style={{ marginTop: 16 }}>
            {cos.map((co) => (
              <div className="admin-row" key={co.id}>
                <div className="admin-row-main">
                  <div className="admin-row-title">CO{co.co_number}</div>
                  <div className="admin-row-sub">{co.description}</div>
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={() => {
                      setCoEditId(co.id);
                      setCoForm({ co_number: co.co_number, description: co.description });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteCO(co.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "resources" && (
        <div className="admin-panel-block">
          <form className="admin-form-grid" onSubmit={saveResource}>
            <div className="section-h admin-field-full" style={{ marginTop: 0 }}>
              {resEditId ? "Edit link" : "Add link"}
            </div>
            <label className="admin-field">
              <span>Kind</span>
              <select value={resForm.type} onChange={(e) => setResForm((s) => ({ ...s, type: e.target.value }))}>
                {RESOURCE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field admin-field-full">
              <span>Title (shown on the page)</span>
              <input value={resForm.title} onChange={(e) => setResForm((s) => ({ ...s, title: e.target.value }))} required />
            </label>
            <label className="admin-field admin-field-full">
              <span>URL</span>
              <input value={resForm.link} onChange={(e) => setResForm((s) => ({ ...s, link: e.target.value }))} required placeholder="https://… or # for placeholder" />
            </label>
            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-primary" type="submit">
                {resEditId ? "Save link" : "Add link"}
              </button>
              <button className="admin-btn admin-btn-ghost" type="button" onClick={resetResForm}>
                Clear
              </button>
            </div>
          </form>
          <div className="admin-list" style={{ marginTop: 16 }}>
            {resources.map((r) => (
              <div className="admin-row" key={r.id}>
                <div className="admin-row-main">
                  <div className="admin-row-title">
                    {RESOURCE_TYPES.find((x) => x.value === r.type)?.label ?? r.type}: {r.title}
                  </div>
                  <div className="admin-row-sub">{r.link}</div>
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={() => {
                      setResEditId(r.id);
                      setResForm({ type: r.type, title: r.title, link: r.link });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteResource(r.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "copomap" && (
        <div className="admin-panel-block">
          <form className="admin-form-grid" onSubmit={addMap}>
            <div className="section-h admin-field-full" style={{ marginTop: 0 }}>
              Link a course outcome to a programme outcome
            </div>
            <label className="admin-field">
              <span>Course outcome (CO)</span>
              <select value={mapForm.co_id} onChange={(e) => setMapForm((f) => ({ ...f, co_id: e.target.value }))} required>
                <option value="">Choose…</option>
                {cos.map((c) => (
                  <option key={c.id} value={c.id}>
                    CO{c.co_number}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Programme outcome (PO)</span>
              <select value={mapForm.po_id} onChange={(e) => setMapForm((f) => ({ ...f, po_id: e.target.value }))} required>
                <option value="">Choose…</option>
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.po_number} — {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>How strong is the link?</span>
              <select value={mapForm.level} onChange={(e) => setMapForm((f) => ({ ...f, level: e.target.value }))}>
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-actions admin-field-full">
              <button className="admin-btn admin-btn-primary" type="submit">
                Add mapping
              </button>
            </div>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course outcome</th>
                  <th>Programme outcome</th>
                  <th>Strength</th>
                  <th className="admin-table-actions"> </th>
                </tr>
              </thead>
              <tbody>
                {copomap.map((row) => (
                  <tr key={row.id}>
                    <td>{row.co_number != null ? `CO${row.co_number}` : `CO #${row.co_id}`}</td>
                    <td>{row.po_number}</td>
                    <td>
                      <select value={row.level} onChange={(e) => updateMapLevel(row, e.target.value)} aria-label="Mapping strength">
                        {LEVEL_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="admin-table-actions">
                      <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteMap(row.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCourseDeep;
