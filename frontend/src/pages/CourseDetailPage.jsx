import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CourseDetail from "../components/CourseDetail";
import * as api from "../services/api";

function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [units, setUnits] = useState([]);
  const [cos, setCos] = useState([]);
  const [copomap, setCopomap] = useState([]);
  const [resources, setResources] = useState([]);
  const [posList, setPosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cid = Number(id);
    if (!Number.isInteger(cid)) {
      setError("Invalid course id");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const c = await api.getCourse(cid);
        if (cancelled) return;
        setCourse(c);
        const [u, co, m, r] = await Promise.all([
          api.getCourseUnits(cid),
          api.getCourseCos(cid),
          api.getCourseCopomap(cid),
          api.getCourseResources(cid)
        ]);
        if (cancelled) return;
        setUnits(u);
        setCos(co);
        setCopomap(m);
        setResources(r);
        if (c.program_id) {
          const pos = await api.getProgramPOs(c.program_id);
          if (!cancelled) setPosList(pos);
        } else {
          setPosList([]);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Loading course…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrap">
        <div className="card page-error-card">
          <p className="overview-desc">{error}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Course not found.</p>
        </div>
      </div>
    );
  }

  return <CourseDetail course={course} units={units} cos={cos} copomap={copomap} resources={resources} posList={posList} />;
}

export default CourseDetailPage;
