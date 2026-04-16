import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TYPE_LABEL } from "../constants/courseTypes";

function scheduleFromLtp(ltp) {
  const p = String(ltp || "3-1-0").split("-");
  return `L:${p[0] || 0} T:${p[1] || 0} P:${p[2] || 0}`;
}

function resourceIconClass(type) {
  if (type === "video") return "video";
  if (type === "repo") return "repo";
  return "notes";
}

function resourceIconGlyph(type) {
  if (type === "video") return "▶";
  if (type === "repo") return "⎇";
  return "◆";
}

function poTagClass(level) {
  if (level === "strong") return "strong";
  if (level === "moderate") return "moderate";
  return "low";
}

function CourseDetail({ course, units, cos, copomap, resources, posList }) {
  const [tab, setTab] = useState("overview");
  const [activeUnit, setActiveUnit] = useState(() => units[0]?.unit_number ?? null);

  const sortedUnits = useMemo(() => [...units].sort((a, b) => a.unit_number - b.unit_number), [units]);

  useEffect(() => {
    const first = sortedUnits[0]?.unit_number;
    if (first != null) setActiveUnit(first);
  }, [sortedUnits]);

  const meta = useMemo(() => {
    const ltpParts = String(course?.ltp || "3-1-0").split("-");
    return {
      ltp: course?.ltp || "3-1-0",
      credits: course?.credits,
      courseTypeLabel: TYPE_LABEL[course?.type] || course?.type || "—",
      description: course?.description || "—",
      prerequisites: "—"
    };
  }, [course]);

  if (!course) return null;

  const sched = scheduleFromLtp(course.ltp);
  const nUnits = sortedUnits.length;
  const sem = course.semester;

  const poName = (poId) => posList?.find((p) => p.id === poId)?.name || "";

  const mapsForCo = (coId) => copomap.filter((m) => m.co_id === coId);

  const currentUnitNum = activeUnit ?? sortedUnits[0]?.unit_number;

  return (
    <div className="page-wrap">
      <div className="breadcrumb">
        <Link to="/semesters">Semesters</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/courses?semester=${sem}`}>Semester {sem}</Link>
        <span className="breadcrumb-sep">›</span>
        <span style={{ color: "var(--gray-700)" }}>{course.name}</span>
      </div>

      <div className="course-hero">
        <div className="course-hero-top">
          <div>
            <div className="course-code-badge">{course.code}</div>
            <div className="course-hero-title">{course.name}</div>
          </div>
        </div>
        <div className="course-meta-pills">
          <span className="meta-pill">
            <strong>{meta.credits}</strong> credits
          </span>
          <span className="meta-pill">
            <strong>—</strong> contact hours
          </span>
          <span className="meta-pill">
            <strong>{meta.ltp}</strong> L-T-P
          </span>
          <span className="meta-pill">
            <strong>{sched}</strong> per week
          </span>
          <span className="meta-pill">{meta.courseTypeLabel}</span>
          <span className="meta-pill">
            Semester <strong>{sem}</strong>
          </span>
          <span className="meta-pill">
            <strong>{nUnits}</strong> units · <strong>{cos.length}</strong> course outcomes
          </span>
        </div>
      </div>

      <div className="course-detail-tabs">
        <div className="cd-tab-bar" role="tablist" aria-label="Course sections">
          {["overview", "units", "resources", "assessments", "faculty", "downloads"].map((id) => (
            <button key={id} type="button" className={`cd-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              {id === "overview"
                ? "Overview"
                : id === "units"
                  ? "Units"
                  : id === "resources"
                    ? "Resources"
                    : id === "assessments"
                      ? "Assessments"
                      : id === "faculty"
                        ? "Faculty"
                        : "Downloads"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div id="cd-panel-overview" className="cd-panel active">
            <div className="card">
              <div className="section-h" style={{ marginTop: 0, border: "none", paddingBottom: 8 }}>
                About this course
              </div>
              <p className="overview-desc">{meta.description}</p>
            </div>
            <div className="overview-grid" style={{ marginTop: 14 }}>
              <div className="overview-card">
                <div className="overview-card-label">Prerequisites</div>
                <div className="overview-card-val">{meta.prerequisites}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "units" && (
          <div id="cd-panel-units" className="cd-panel active">
            <div className="unit-layout">
              <aside className="unit-sidebar">
                <div className="unit-nav">
                  {sortedUnits.map((u) => (
                    <button
                      key={u.unit_number}
                      type="button"
                      className={`unit-nav-item ${activeUnit === u.unit_number ? "active" : ""}`}
                      onClick={() => setActiveUnit(u.unit_number)}
                    >
                      <div className="unit-nav-num">Unit {u.unit_number}</div>
                      <div>{u.title.split(" ").slice(0, 4).join(" ")}…</div>
                    </button>
                  ))}
                </div>
              </aside>
              <div className="unit-content">
                {sortedUnits.map((u) => {
                  if (currentUnitNum != null && u.unit_number !== currentUnitNum) return null;
                  const topics = Array.isArray(u.topics) ? u.topics : [];
                  const teaching = Array.isArray(u.teaching_methods) ? u.teaching_methods : [];
                  const assessment = Array.isArray(u.assessments) ? u.assessments : [];
                  const refs = Array.isArray(u.references) ? u.references : [];
                  const coRow = cos.find((c) => c.co_number === u.unit_number);
                  const coText = coRow?.description || "—";
                  const poTags = coRow ? mapsForCo(coRow.id) : [];

                  return (
                    <div key={u.unit_number} className="unit-panel active">
                      <div className="unit-card">
                        <div className="unit-card-head">
                          <div className="unit-head-top">
                            <span className="unit-label">
                              Unit {u.unit_number} of {nUnits}
                            </span>
                            <span className="bloom-tag">{u.bloom_level || "—"}</span>
                          </div>
                          <div className="unit-head-title">{u.title}</div>
                          <div className="unit-head-hours">{u.hours} contact hours</div>
                        </div>
                        <div className="unit-body">
                          <div className="co-block">
                            <div className="co-block-label">Course outcome (CO{u.unit_number}) — mapped to this unit</div>
                            <div className="co-block-text">{coText}</div>
                            <div className="co-block-label" style={{ marginBottom: 6 }}>
                              Programme outcome mapping
                            </div>
                            <div className="po-map">
                              {poTags.map((m) => (
                                <span key={`${m.co_id}-${m.po_id}`} className={`po-tag ${poTagClass(m.level)}`} title={poName(m.po_id)}>
                                  {m.po_number} · {m.level?.charAt(0).toUpperCase()}
                                  {m.level?.slice(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="section-h">Topics and subtopics</div>
                          <div className="topic-list">
                            {topics.map((t, i) => (
                              <div className="topic-row" key={i}>
                                <div className="topic-main">{t.m}</div>
                                <div className="topic-subs">{t.s}</div>
                              </div>
                            ))}
                          </div>
                          <div className="section-h">Teaching and learning methods</div>
                          <div className="method-list">
                            {teaching.map((t, i) => (
                              <div className="method-card" key={i}>
                                <div className="method-name">{t.n}</div>
                                <div className="method-detail">{t.d}</div>
                              </div>
                            ))}
                          </div>
                          <div className="section-h">Textbooks and references</div>
                          <div className="ref-list">
                            {refs.map((r, i) => (
                              <div className="ref-item" key={i}>
                                <span className="ref-type-dot" style={{ background: r.col || "#1e40af" }} />
                                <div className="ref-info">
                                  <div className="ref-title">
                                    {r.ti}{" "}
                                    <span className="badge" style={{ background: `${r.col}22`, color: r.col, border: `1px solid ${r.col}44`, fontSize: 9 }}>
                                      {r.type}
                                    </span>
                                  </div>
                                  <div className="ref-authors">{r.au}</div>
                                  <div className="ref-edition">{r.ed}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "resources" && (
          <div className="cd-panel active">
            {resources?.length ? (
              <div className="resource-grid">
                {resources.map((r) => (
                  <div className="resource-row" key={r.id}>
                    <span className={`resource-icon ${resourceIconClass(r.type)}`}>{resourceIconGlyph(r.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-800)", marginBottom: 4 }}>{r.title}</div>
                      <a className="resource-link" href={r.link || "#"} target="_blank" rel="noopener noreferrer">
                        Open resource
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-tab-hint">No resources listed for this course yet.</p>
            )}
          </div>
        )}

        {tab === "assessments" && (
          <div className="cd-panel active">
            {sortedUnits.map((u) => {
              const assessment = Array.isArray(u.assessments) ? u.assessments : [];
              if (!assessment.length) return null;
              return (
                <div className="card" style={{ marginBottom: 14 }} key={u.unit_number}>
                  <div className="section-h" style={{ marginTop: 0, border: "none", paddingBottom: 0 }}>
                    Unit {u.unit_number} — {u.title}
                  </div>
                  <div className="assess-list">
                    {assessment.map((a, i) => (
                      <div className="assess-item" key={i}>
                        <div className="assess-marks">{a.m}</div>
                        <div className="assess-info">
                          <div className="assess-type">{a.t}</div>
                          <div className="assess-detail">{a.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!sortedUnits.some((u) => (u.assessments || []).length) && <p className="empty-tab-hint">No per-unit assessments captured yet.</p>}
          </div>
        )}

        {tab === "faculty" && (
          <div className="cd-panel active">
            <p className="empty-tab-hint">Faculty details are not stored in the database for this build. Add instructor info via your admin workflow when the API supports it.</p>
          </div>
        )}

        {tab === "downloads" && (
          <div className="cd-panel active">
            <p className="empty-tab-hint">No downloads configured. Syllabus PDFs and papers can be linked here when provided by the backend.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseDetail;
