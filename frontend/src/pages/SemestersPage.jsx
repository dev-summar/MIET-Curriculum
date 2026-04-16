import { useEffect, useMemo, useState } from "react";
import SemesterGrid from "../components/SemesterGrid";
import { useProgram } from "../context/ProgramContext";
import * as api from "../services/api";
import { buildSemestersFromCourses } from "../utils/semesters";

function SemestersPage() {
  const { programId, programs, loading: progLoading, error: progError } = useProgram();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cList = await api.getProgramCourses(programId);
        if (!cancelled) setCourses(cList);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  const semesters = useMemo(() => buildSemestersFromCourses(courses), [courses]);
  const program = programs.find((p) => p.id === programId);
  const totalCredits = program?.total_credits ?? courses.reduce((a, c) => a + (Number(c.credits) || 0), 0);

  const filtered = useMemo(() => {
    if (filter === "all") return semesters;
    return semesters.map((s) => ({ ...s, courses: s.courses.filter((c) => c.type === filter) })).filter((s) => s.courses.length);
  }, [filter, semesters]);

  if (progLoading || loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Loading semesters…</p>
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
          <div className="section-title">Semester-wise curriculum</div>
          <div className="section-sub" style={{ marginTop: 4 }}>
            All {semesters.length} semesters · {totalCredits} total credits
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {["all", "core", "modern", "lab", "elec", "proj"].map((f) => (
          <button key={f} className={`sem-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All semesters" : f}
          </button>
        ))}
      </div>
      <SemesterGrid semesters={filtered} />
    </div>
  );
}

export default SemestersPage;
