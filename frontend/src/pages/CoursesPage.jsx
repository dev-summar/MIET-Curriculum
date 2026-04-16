import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CourseList from "../components/CourseList";
import { useProgram } from "../context/ProgramContext";
import * as api from "../services/api";
import { buildSemestersFromCourses } from "../utils/semesters";

function CoursesPage() {
  const [searchParams] = useSearchParams();
  const semesterParam = searchParams.get("semester");
  const { programId, loading: progLoading, error: progError } = useProgram();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const filtered = useMemo(() => {
    if (!semesterParam) return semesters;
    const n = Number(semesterParam);
    return semesters.filter((s) => s.id === n);
  }, [semesters, semesterParam]);

  if (progLoading || loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Loading courses…</p>
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
    <CourseList
      courses={courses}
      semesterFilter={semesterParam ? Number(semesterParam) : null}
      semestersMeta={semesters}
    />
  );
}

export default CoursesPage;
