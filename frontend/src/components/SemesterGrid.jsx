import { Link } from "react-router-dom";
import { TYPE_BADGE, TYPE_LABEL } from "../constants/courseTypes";

/**
 * Semester cards: header + footer link to course list; each course name links to detail (no nested router Links).
 */
function SemesterGrid({ semesters }) {
  const PREVIEW_COUNT = 7;

  return (
    <div className="sem-grid">
      {semesters.map((sem) => (
        <div className="sem-card" key={sem.id}>
          <Link to={`/courses?semester=${sem.id}`} className="sem-card-head-link">
            <div className="sem-card-head">
              <div className="sem-kicker">Semester {sem.id}</div>
              <div className="sem-theme-row">
                <div className="sem-theme">{sem.theme}</div>
                <div className="sem-pill">{sem.courses.length} courses</div>
              </div>
              <div className="sem-subline">Structured core + practical track</div>
            </div>
          </Link>
          <div className="sem-card-body">
            {sem.courses.slice(0, PREVIEW_COUNT).map((course) => (
              <div className="sem-course-row" key={course.code}>
                <span className="sem-course-code">{course.code}</span>
                <Link to={`/courses/${course.id}`} className="sem-course-name sem-course-detail-link">
                  {course.name}
                </Link>
                <div className="sem-course-meta">
                  <span className={`badge ${TYPE_BADGE[course.type] || "badge-core"}`}>{TYPE_LABEL[course.type] || course.type}</span>
                  <span className="sem-course-cr">{course.credits}</span>
                </div>
              </div>
            ))}
            {sem.courses.length > PREVIEW_COUNT ? (
              <div className="sem-course-more">+{sem.courses.length - PREVIEW_COUNT} more courses</div>
            ) : null}
          </div>
          <Link to={`/courses?semester=${sem.id}`} className="sem-card-foot-link">
            <div className="sem-card-foot">
              <div className="sem-foot-summary" aria-label={`Semester ${sem.id} credits`}>
                <strong>{sem.credits}</strong>
                <span>credits</span>
              </div>
              <div className="sem-foot-cta">
                View courses <span className="sem-card-arrow">→</span>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default SemesterGrid;
