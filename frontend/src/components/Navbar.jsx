import { useProgram } from "../context/ProgramContext";

const links = [
  { key: "/", label: "Overview" },
  { key: "/semesters", label: "Semesters" },
  { key: "/courses", label: "Courses" },
  { key: "/matrix", label: "CO→PO Matrix" },
  { key: "/pos", label: "Programme Outcomes" },
];

function Navbar({ currentPath, onNavigate }) {
  const { programs, programId, setProgramId } = useProgram();
  const current = programs.find((p) => p.id === programId);

  return (
    <nav className="navbar" aria-label="Primary">
      <div className="nav-inner">
        <div className="nav-brand">
          <button type="button" className="nav-logo nav-reset-btn" onClick={() => onNavigate("/")}>
            <img className="nav-logo-img" src="https://mietjmu.in/wp-content/uploads/2020/11/miet-logo-white.png" alt="" />
            <div className="nav-logo-text">
              <span className="nav-logo-main">CSE Curriculum</span>
              <span className="nav-logo-sub">B.Tech · Outcome-based</span>
            </div>
          </button>
        </div>

        <div className="nav-links" role="navigation" aria-label="Site sections">
          {links.map((link) => (
            <button
              key={link.key}
              type="button"
              className={`nav-link ${currentPath === link.key ? "active" : ""}`}
              onClick={() => onNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="nav-right">
          <label className="nav-program-label">
            <select
              className="nav-program-select"
              value={programId ?? ""}
              onChange={(e) => setProgramId(Number(e.target.value))}
              aria-label="Select programme"
              title={current ? `${current.name} (${current.code})` : "Select programme"}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
