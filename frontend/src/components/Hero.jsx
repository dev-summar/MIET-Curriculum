function Hero({ totalCredits, semesterCount, courseCount, poCount, coTotal }) {
  return (
    <div className="hero">
      <div className="hero-inner">
        <div className="hero-eyebrow">Model Institute of Engineering & Technology</div>
        <div className="hero-title">
          B.Tech Computer Science
          <br />
          <span>& Engineering</span>
        </div>
        <div className="hero-sub">
          A redesigned, industry-aligned curriculum built on Outcome-Based Education principles — integrating AI/ML, cloud computing, cybersecurity and modern development practices.
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="hero-stat-val">{totalCredits}</span><span className="hero-stat-lbl">Total credits</span></div>
          <div className="hero-stat"><span className="hero-stat-val">{semesterCount}</span><span className="hero-stat-lbl">Semesters</span></div>
          <div className="hero-stat"><span className="hero-stat-val">{courseCount}</span><span className="hero-stat-lbl">Courses</span></div>
          <div className="hero-stat"><span className="hero-stat-val">{poCount}</span><span className="hero-stat-lbl">Programme Outcomes</span></div>
          <div className="hero-stat"><span className="hero-stat-val">{coTotal ?? "—"}</span><span className="hero-stat-lbl">Course Outcomes</span></div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
