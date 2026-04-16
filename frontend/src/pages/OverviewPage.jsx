import { useEffect, useMemo, useState } from "react";
import CurriculumHero from "../components/CurriculumHero";
import SemesterGrid from "../components/SemesterGrid";
import { useProgram } from "../context/ProgramContext";
import * as api from "../services/api";
import { buildSemestersFromCourses, creditBreakdownByType } from "../utils/semesters";

function OverviewPage() {
  const { programId, programs, loading: progLoading, error: progError } = useProgram();
  const [courses, setCourses] = useState([]);
  const [pos, setPos] = useState([]);
  const [coTotal, setCoTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cList, pList] = await Promise.all([api.getProgramCourses(programId), api.getProgramPOs(programId)]);
        if (cancelled) return;
        setCourses(cList);
        setPos(pList);
        const coRows = await Promise.all(cList.map((c) => api.getCourseCos(c.id)));
        if (cancelled) return;
        setCoTotal(coRows.reduce((a, r) => a + r.length, 0));
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load curriculum");
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
  const breakdown = useMemo(() => creditBreakdownByType(courses), [courses]);
  const pct = (n) => (totalCredits ? Math.round((n / totalCredits) * 100) : 0);
  const humanitiesCredits = useMemo(
    () =>
      courses.reduce((sum, c) => {
        const code = String(c.code || "").toUpperCase();
        const name = String(c.name || "").toLowerCase();
        const isHum =
          code.startsWith("HUM") ||
          code.startsWith("HSS") ||
          code.startsWith("ENV") ||
          name.includes("humanities") ||
          name.includes("ethics") ||
          name.includes("communication") ||
          name.includes("environment");
        return sum + (isHum ? Number(c.credits) || 0 : 0);
      }, 0),
    [courses]
  );
  const categoryCards = useMemo(() => {
    const pctValue = (n) => (totalCredits ? Math.round((n / totalCredits) * 100) : 0);
    const coreLabs = Math.max((breakdown.core + breakdown.lab) - humanitiesCredits, 0);
    return [
      {
        id: "corelabs",
        label: "Core + Labs",
        credits: coreLabs,
        pct: pctValue(coreLabs),
        color: "var(--brand-light-blue)",
        sub: "Foundation courses",
      },
      {
        id: "modern",
        label: "Modern Tech (AI/ML/Cloud)",
        credits: breakdown.modern,
        pct: pctValue(breakdown.modern),
        color: "var(--brand-teal)",
        sub: "Cutting-edge skills",
      },
      {
        id: "elec",
        label: "Electives",
        credits: breakdown.elec,
        pct: pctValue(breakdown.elec),
        color: "var(--brand-brown)",
        sub: "Student choice",
      },
      {
        id: "proj",
        label: "Projects",
        credits: breakdown.proj,
        pct: pctValue(breakdown.proj),
        color: "var(--brand-purple)",
        sub: "Practical experience",
      },
      {
        id: "inter",
        label: "Internship / Industry",
        credits: breakdown.inter,
        pct: pctValue(breakdown.inter),
        color: "var(--brand-emerald)",
        sub: "Real-world exposure",
      },
      {
        id: "hum",
        label: "Humanities / Ethics",
        credits: humanitiesCredits,
        pct: pctValue(humanitiesCredits),
        color: "var(--brand-amber)",
        sub: humanitiesCredits ? "Integrated modules" : "Not yet integrated",
        warning: humanitiesCredits
          ? ""
          : "Consider integrating ethics modules into core courses",
      },
    ];
  }, [breakdown, humanitiesCredits, totalCredits]);

  if (progLoading || loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Loading curriculum…</p>
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
    <>
      <CurriculumHero
        totalCredits={totalCredits}
        semesterCount={semesters.length}
        courseCount={courses.length}
        poCount={pos.length}
        coTotal={coTotal}
        categories={categoryCards}
      />
      <div className="page-wrap">
        <div className="section-header">
          <div className="section-title">Curriculum at a glance</div>
          <div className="section-sub section-sub-hint">Click any semester to explore courses</div>
        </div>
        <SemesterGrid semesters={semesters} />
      </div>
    </>
  );
}

export default OverviewPage;
