import { Fragment, useEffect, useMemo, useState } from "react";
import { useProgram } from "../context/ProgramContext";
import * as api from "../services/api";
import { buildMatrixSemesterData } from "../utils/matrix";

function DotCell({ v }) {
  if (v >= 3) return <span className="dot-3" />;
  if (v === 2) return <span className="dot-2" />;
  if (v === 1) return <span className="dot-1" />;
  return <span className="dot-0" />;
}

function MatrixPage() {
  const { programId, loading: progLoading, error: progError } = useProgram();
  const [tabs, setTabs] = useState([]);
  const [sortedPos, setSortedPos] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [courses, pos] = await Promise.all([api.getProgramCourses(programId), api.getProgramPOs(programId)]);
        if (cancelled) return;
        const posOrder = [...pos].sort((a, b) => String(a.po_number).localeCompare(String(b.po_number), undefined, { numeric: true }));
        setSortedPos(posOrder);
        const enriched = await Promise.all(
          courses.map(async (c) => {
            const [cos, maps] = await Promise.all([api.getCourseCos(c.id), api.getCourseCopomap(c.id)]);
            return { course: c, cos, maps };
          })
        );
        if (cancelled) return;
        const semNums = [...new Set(courses.map((c) => c.semester))].sort((a, b) => a - b);
        const built = semNums.map((sem) => {
          const list = enriched.filter((e) => e.course.semester === sem);
          const cosByCourseId = {};
          const mapByCourseId = {};
          for (const e of list) {
            cosByCourseId[e.course.id] = e.cos;
            mapByCourseId[e.course.id] = e.maps;
          }
          const coursesInSem = list.map((e) => e.course);
          const matrixCourses = buildMatrixSemesterData(coursesInSem, posOrder, cosByCourseId, mapByCourseId);
          return { key: `sem${sem}`, label: `Semester ${sem}`, matrixCourses };
        });
        setTabs(built);
        setSelected(built[0]?.key || "");
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to build matrix");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  const active = useMemo(() => tabs.find((t) => t.key === selected) || tabs[0], [tabs, selected]);

  useEffect(() => {
    if (tabs.length && !tabs.find((t) => t.key === selected)) {
      setSelected(tabs[0].key);
    }
  }, [tabs, selected]);

  if (progLoading || loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Loading CO–PO matrix…</p>
        </div>
      </div>
    );
  }

  if (progError || error) {
    return (
      <div className="page-wrap">
        <div className="card page-error-card">
          <p className="overview-desc">{progError || error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="section-header">
        <div>
          <div className="section-title">CO → PO attainment matrix</div>
          <div className="section-sub" style={{ marginTop: 4 }}>
            Course outcomes mapped to programme outcomes — NBA revised framework
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gray-600)" }}>
          <span className="dot-3" /> Strong (3)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gray-600)" }}>
          <span className="dot-2" /> Moderate (2)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gray-600)" }}>
          <span className="dot-1" /> Low (1)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gray-600)" }}>
          <span className="dot-0" /> None
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t.key} type="button" className={`sem-filter-btn ${selected === t.key ? "active" : ""}`} onClick={() => setSelected(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="matrix-wrap">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="row-head">Course / CO</th>
              {sortedPos.map((po) => (
                <th key={po.id} className="co-head" title={po.name}>
                  {po.po_number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(active?.matrixCourses || []).map((course) => (
              <Fragment key={course.code}>
                <tr className="course-group">
                  <td colSpan={sortedPos.length + 1}>
                    {course.code} — {course.name}
                  </td>
                </tr>
                {course.cos.map((row) => (
                  <tr key={`${course.code}-${row.co}`}>
                    <td className="row-label">{row.co}</td>
                    {row.map.map((v, i) => (
                      <td key={i}>
                        <DotCell v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MatrixPage;
