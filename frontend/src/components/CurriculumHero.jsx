import "../styles/CurriculumHero.css";

function CurriculumHero({
  totalCredits,
  semesterCount,
  courseCount,
  poCount,
  coTotal,
  categories,
}) {
  const stats = [
    { id: "credits", value: totalCredits, label: "Total Credits", sub: "Core curriculum" },
    { id: "semesters", value: semesterCount, label: "Semesters", sub: "4-year program" },
    { id: "courses", value: courseCount, label: "Courses", sub: "Total offerings" },
    { id: "po", value: poCount, label: "Programme Outcomes", sub: "Learning goals" },
    { id: "co", value: coTotal, label: "Course Outcomes", sub: "Detailed targets" },
  ];

  return (
    <>
      <section className="ch-hero-wrap" aria-label="Curriculum overview hero">
        <div className="ch-hero-bg" aria-hidden="true" />
        <div className="ch-container">
          <p className="ch-eyebrow">Model Institute of Engineering & Technology</p>
          <h1 className="ch-title">
            B.Tech Computer Science
            <br />
            <span className="ch-title-accent">& Engineering</span>
          </h1>
          <p className="ch-description">
            A redesigned, industry-aligned curriculum built on outcome-based education principles,
            integrating AI/ML, cloud computing, cybersecurity and modern development practices.
          </p>

          <div className="ch-stats-grid">
            {stats.map((s) => (
              <article className="ch-stat" key={s.id}>
                <div className="ch-stat-label">{s.label}</div>
                <div className="ch-stat-value">{s.value}</div>
                <div className="ch-stat-sub">{s.sub}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ch-credit-wrap" aria-label="Credit distribution">
        <div className="ch-container">
          <h3 className="ch-credit-title">Credit distribution</h3>
          <div className="ch-cards-grid">
            {categories.map((item) => (
              <article
                key={item.id}
                className={`ch-credit-card ${item.id === "hum" ? "ch-card-hum" : ""}`}
                style={{ "--card-color": item.color }}
                tabIndex={0}
              >
                <div className="ch-card-content">
                  <div className="ch-card-label">{item.label}</div>
                  <div className="ch-card-value">{item.credits}</div>
                  <div className="ch-card-sub">{item.sub}</div>
                  <div className="ch-progress">
                    <div className="ch-progress-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                  <div className="ch-card-pct">{item.pct}% of curriculum</div>
                  {item.warning ? <div className="ch-card-warning">{item.warning}</div> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default CurriculumHero;

