import { Link } from "react-router-dom";
import { useMemo } from "react";
import { TYPE_BADGE, TYPE_LABEL } from "../constants/courseTypes";

/**
 * Matches legacy buildCourseList(): breadcrumb, title, subtitle, card-sm rows with View →
 */
function CourseList({ courses, semesterFilter, semestersMeta }) {
  const list = useMemo(() => {
    if (!courses?.length) return [];
    let arr = [...courses];
    if (semesterFilter != null) {
      arr = arr.filter((c) => c.semester === semesterFilter);
    }
    return arr.sort((a, b) => (a.semester !== b.semester ? a.semester - b.semester : a.code.localeCompare(b.code)));
  }, [courses, semesterFilter]);

  const title =
    semesterFilter != null
      ? (() => {
          const meta = semestersMeta?.find((s) => s.id === semesterFilter);
          return meta ? `Semester ${semesterFilter} — ${meta.theme}` : `Semester ${semesterFilter}`;
        })()
      : "All courses";

  return (
    <div className="page-wrap">
      <div className="breadcrumb">
        <Link to="/semesters">Semesters</Link>
        {semesterFilter != null ? (
          <>
            <span className="breadcrumb-sep">›</span>
            <Link to={`/courses?semester=${semesterFilter}`}>Semester {semesterFilter}</Link>
          </>
        ) : null}
      </div>

      <div className="section-header">
        <div className="section-title">{title}</div>
        <div className="section-sub">{list.length} courses</div>
      </div>

      <div className="course-list-stack">
        {list.length === 0 ? (
          <p className="overview-desc">No courses match this view.</p>
        ) : (
          list.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="course-list-row card-sm">
              <span className="course-list-code">{c.code}</span>
              <span className="course-list-title">{c.name}</span>
              <span className={`badge ${TYPE_BADGE[c.type] || "badge-core"}`}>{TYPE_LABEL[c.type] || c.type}</span>
              <span className="course-list-cr">{c.credits} cr</span>
              <span className="course-list-cta">View →</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default CourseList;
