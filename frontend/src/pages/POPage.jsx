import { useEffect, useState } from "react";
import { useProgram } from "../context/ProgramContext";
import * as api from "../services/api";

function POPage() {
  const { programId, loading: progLoading, error: progError } = useProgram();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await api.getProgramPOs(programId);
        if (!cancelled) setPos(list);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load POs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (progLoading || loading) {
    return (
      <div className="page-wrap">
        <div className="card">
          <p className="overview-desc">Loading programme outcomes…</p>
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
          <div className="section-title">Programme Outcomes</div>
          <div className="section-sub" style={{ marginTop: 4 }}>
            NBA revised framework · {pos.length} POs
          </div>
        </div>
      </div>
      <div className="po-grid">
        {pos.map((po) => (
          <div className="po-card" key={po.id}>
            <div className="po-id">{po.po_number}</div>
            <div className="po-name">{po.name}</div>
            <div className="po-desc">{po.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default POPage;
