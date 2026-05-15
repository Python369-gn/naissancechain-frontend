import { useState, useEffect, useMemo } from "react";
import "./pages.css";
import "./pages-content.css";
import { prefectureService } from "./api/prefectureService";
import { enregistrementService } from "./api/enregistrementService";
import type { Prefecture, Enregistrement } from "./data";

export default function PagePrefectures() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [records, setRecords] = useState<Enregistrement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"enregistrements" | "couverture" | "agents">("enregistrements");

  useEffect(() => {
    const load = async () => {
      try {
        const [pData, rData] = await Promise.all([
          prefectureService.getAll(),
          enregistrementService.getAll()
        ]);
        setPrefectures(pData);
        setRecords(rData);
      } catch (err) {
        console.error("Failed to load prefecture data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sorted = useMemo(() => [...prefectures].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0)), [prefectures, sortBy]);
  const max = useMemo(() => prefectures.length > 0 ? Math.max(...prefectures.map((p) => p.enregistrements || 0)) : 1, [prefectures]);
  const selectedPref = useMemo(() => selected ? prefectures.find((p) => p.nom === selected) : null, [prefectures, selected]);
  const prefRecords = useMemo(() => selected ? records.filter((e) => e.prefecture === selected) : [], [records, selected]);

  const totalEnreg = useMemo(() => prefectures.reduce((s, p) => s + (p.enregistrements || 0), 0), [prefectures]);
  const avgCouverture = useMemo(() => prefectures.length > 0 ? Math.round(prefectures.reduce((s, p) => s + (p.couverture || 0), 0) / prefectures.length) : 0, [prefectures]);

  if (loading) return <div className="page-container">Chargement des statistiques...</div>;

  return (
    <div className="page-container full-width">
      <div className="page-header-premium">
        <div className="page-header-inner">
          <div className="page-title-group">
            <div className="page-icon-circle-premium yellow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <h2 className="page-title-xl">Statistiques Régionales</h2>
              <p className="page-sub-lg">{prefectures.length} préfectures · Couverture moyenne {avgCouverture}%</p>
            </div>
          </div>
          <div className="sort-btns">
            <span className="sort-label">Trier par :</span>
            {(["enregistrements", "couverture", "agents"] as const).map((s) => (
              <button key={s} className={`sort-btn ${sortBy === s ? "active" : ""}`} onClick={() => setSortBy(s)}>
                {s === "enregistrements" ? "Actes" : s === "couverture" ? "Couv." : "Agents"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="pref-kpi-row">
        <div className="pref-kpi-card">
          <div className="pref-kpi-num">{totalEnreg.toLocaleString()}</div>
          <div className="pref-kpi-label">Total Enregistrements</div>
        </div>
        <div className="pref-kpi-card green">
          <div className="pref-kpi-num">{avgCouverture}%</div>
          <div className="pref-kpi-label">Couverture Moyenne</div>
        </div>
        <div className="pref-kpi-card yellow">
          <div className="pref-kpi-num">{prefectures.reduce((s, p) => s + (p.agents || 0), 0)}</div>
          <div className="pref-kpi-label">Agents Actifs</div>
        </div>
        <div className="pref-kpi-card dark">
          <div className="pref-kpi-num">{prefectures.filter((p) => (p.couverture || 0) >= 60).length}</div>
          <div className="pref-kpi-label">Préf. au-dessus 60%</div>
        </div>
      </div>

      <div className="pref-layout">
        {/* BARS + LIST */}
        <div className="pref-bars-panel">
          <h3 className="pref-panel-title">Classement des Préfectures</h3>
          <div className="pref-bars">
            {sorted.map((p, i) => (
              <div
                key={p.nom}
                className={`pref-bar-row ${selected === p.nom ? "selected" : ""}`}
                onClick={() => setSelected(selected === p.nom ? null : p.nom)}
              >
                <div className="pref-rank">#{i + 1}</div>
                <div className="pref-bar-content">
                  <div className="pref-bar-top">
                    <span className="pref-bar-name">{p.nom}</span>
                    <div className="pref-bar-stats">
                      <span className="pref-stat-chip enreg">{(p.enregistrements || 0).toLocaleString()} enreg.</span>
                      <span className={`pref-stat-chip couv ${(p.couverture || 0) >= 70 ? "high" : (p.couverture || 0) >= 50 ? "mid" : "low"}`}>{(p.couverture || 0)}%</span>
                      <span className={`pref-trend ${(p.tendance || 0) > 10 ? "up-high" : "up"}`}>▲ {(p.tendance || 0)}%</span>
                    </div>
                  </div>
                  <div className="pref-bar-track">
                    <div
                      className="pref-bar-fill"
                      style={{ width: `${((p.enregistrements || 0) / max) * 100}%`, background: p.couleur }}
                    />
                  </div>
                  <div className="pref-bar-bottom">
                    <span className="pref-agents-count">👥 {p.agents || 0} agents</span>
                    <span className="pref-pop">Pop. {((p.population || 0) / 1_000_000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DETAIL */}
        {selectedPref ? (
          <div className="pref-detail-panel">
            <div className="pref-detail-header">
              <div>
                <div className="pref-detail-name">{selectedPref.nom}</div>
                <div className="pref-detail-region">Région {selectedPref.region}</div>
              </div>
              <button className="detail-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="pref-donut-container">
              <svg viewBox="0 0 120 120" className="pref-donut">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#F0F2F5" strokeWidth="12"/>
                <circle
                  cx="60" cy="60" r="48" fill="none"
                  stroke={selectedPref.couleur} strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 48 * (selectedPref.couverture ?? 0) / 100} ${2 * Math.PI * 48 * (1 - (selectedPref.couverture ?? 0) / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0B3D2E">{selectedPref.couverture ?? 0}%</text>
                <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#888">COUVERTURE</text>
              </svg>
            </div>

            <div className="pref-detail-stats">
              <div className="pref-ds-row"><span>Enregistrements</span><strong>{(selectedPref.enregistrements ?? 0).toLocaleString()}</strong></div>
              <div className="pref-ds-row"><span>Population estimée</span><strong>{(selectedPref.population ?? 0).toLocaleString()}</strong></div>
              <div className="pref-ds-row"><span>Agents actifs</span><strong>{selectedPref.agents ?? 0}</strong></div>
              <div className="pref-ds-row"><span>Tendance mensuelle</span><strong className="trend-up">▲ {selectedPref.tendance ?? 0}%</strong></div>
              <div className="pref-ds-row"><span>Objectif 2028</span><strong>95%</strong></div>
              <div className="pref-ds-row">
                <span>Écart objectif</span>
                <strong className="trend-warn">{95 - (selectedPref.couverture ?? 0)}% restants</strong>
              </div>
            </div>

            {prefRecords.length > 0 && (
              <div className="pref-recent">
                <div className="pref-recent-title">Enregistrements récents</div>
                {prefRecords.slice(0, 3).map((r) => (
                  <div key={r.niu} className="pref-recent-row">
                    <div>
                      <div className="pref-recent-niu">{r.niu}</div>
                      <div className="pref-recent-name">{r.prenom} {r.nom}</div>
                    </div>
                    <span className={`statut-badge ${r.statut === "VALIDÉ" ? "valide" : r.statut === "REJETÉ" ? "rejete" : "attente"}`}>
                      {r.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="pref-empty-panel">
            <div style={{ fontSize: 48 }}>🗺️</div>
            <p style={{ color: "#888", textAlign: "center", marginTop: 16 }}>Cliquez sur une préfecture pour voir ses statistiques détaillées</p>
          </div>
        )}
      </div>
    </div>
  );
}
