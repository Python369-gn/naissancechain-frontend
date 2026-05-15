import { useState, useMemo, useEffect } from "react";
import "./pages.css";
import "./pages-content.css";
import { enregistrementService } from "./api/enregistrementService";
import { useApp } from "./App";
import type { Enregistrement } from "./data";
import { useAuth } from "./context/AuthContext";

type Filtre = "TOUS" | "VALIDÉ" | "EN ATTENTE" | "REJETÉ";

export default function PageEnregistrements() {
  const { setView } = useApp();
  const [records, setRecords] = useState<Enregistrement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [search, setSearch] = useState("");
  const [prefectureFilter, setPrefectureFilter] = useState("TOUTES");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const PER_PAGE = 8;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await enregistrementService.getAll();
        setRecords(data);
      } catch (err) {
        console.error("Failed to load records", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAction = async (statusUpdate: 'VALIDÉ' | 'REJETÉ') => {
    if (!selectedRecord) return;
    setActionLoading(true);
    try {
      const updated = await enregistrementService.updateStatus(selectedRecord.niu, statusUpdate);
      setRecords(prev => prev.map(r => r.niu === updated.niu ? updated : r));
      alert(`Acte ${statusUpdate === 'VALIDÉ' ? 'approuvé' : 'rejeté'} avec succès.`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      alert("Erreur lors de la mise à jour: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const prefectures = useMemo(() => ["TOUTES", ...Array.from(new Set(records.map((e) => e.prefecture)))], [records]);

  const filtered = useMemo(() => {
    return records.filter((e) => {
      const matchFiltre = filtre === "TOUS" || e.statut === filtre;
      const matchSearch =
        search === "" ||
        e.niu.toLowerCase().includes(search.toLowerCase()) ||
        e.nom.toLowerCase().includes(search.toLowerCase()) ||
        e.prenom.toLowerCase().includes(search.toLowerCase());
      const matchPref = prefectureFilter === "TOUTES" || e.prefecture === prefectureFilter;
      return matchFiltre && matchSearch && matchPref;
    });
  }, [records, filtre, search, prefectureFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selectedRecord = selected ? records.find((e) => e.niu === selected) : null;

  const counts = useMemo(() => ({
    TOUS: records.length,
    VALIDÉ: records.filter((e) => e.statut === "VALIDÉ").length,
    "EN ATTENTE": records.filter((e) => e.statut === "EN ATTENTE").length,
    REJETÉ: records.filter((e) => e.statut === "REJETÉ").length,
  }), [records]);

  if (loading) return <div className="page-container">Chargement des données...</div>;

  return (
    <div className="page-container full-width">
      <div className="page-header-premium">
        <div className="page-header-inner">
          <div className="page-title-group">
            <div className="page-icon-circle-premium">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
            <div>
              <h2 className="page-title-xl">Registre National</h2>
              <p className="page-sub-lg">{records.length} actes de naissance sécurisés par la blockchain</p>
            </div>
          </div>
          <button className="btn-add-agent" onClick={() => setView("enregistrement")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvel Acte
          </button>
        </div>
      </div>

      <div className="filter-tabs-row">
        <div className="filter-tabs">
          {(["TOUS", "VALIDÉ", "EN ATTENTE", "REJETÉ"] as Filtre[]).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filtre === f ? "active" : ""} ${f === "VALIDÉ" ? "green" : f === "EN ATTENTE" ? "yellow" : f === "REJETÉ" ? "red" : ""}`}
              onClick={() => { setFiltre(f); setPage(1); }}
            >
              {f} <span className="filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="filter-controls">
          <div className="search-box-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input placeholder="Rechercher NIU, nom..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="pref-select" value={prefectureFilter} onChange={(e) => { setPrefectureFilter(e.target.value); setPage(1); }}>
            {prefectures.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="enreg-layout">
        <div className={`table-panel ${selected ? "shrunk" : ""}`}>
          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>NIU</th><th>NOM COMPLET</th><th>SEXE</th><th>DATE</th>
                  <th>PRÉFECTURE</th><th>STATUT</th><th>AGENT</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.niu} className={selected === r.niu ? "row-selected" : ""} onClick={() => setSelected(selected === r.niu ? null : r.niu)}>
                    <td className="niu-cell">{r.niu}</td>
                    <td className="nom-cell">{r.prenom} {r.nom}</td>
                    <td><span className={`sexe-badge ${r.sexe}`}>{r.sexe === "M" ? "♂" : "♀"}</span></td>
                    <td>{r.date}</td>
                    <td>{r.prefecture}</td>
                    <td>
                      <span className={`statut-badge ${r.statut === "VALIDÉ" ? "valide" : r.statut === "REJETÉ" ? "rejete" : "attente"}`}>
                        {r.statut}
                      </span>
                    </td>
                    <td className="agent-cell">{r.agent}</td>
                    <td>
                      <button className="voir-acte" onClick={(e) => { e.stopPropagation(); setSelected(r.niu); }}>Détails →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-row">
            <span className="pagination-info">{filtered.length} résultats — Page {page}/{Math.max(totalPages,1)}</span>
            <div className="pagination-btns">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>
              {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === page ? "active" : ""} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          </div>
        </div>

        {/* MODAL DETAIL */}
        {selectedRecord && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
              <div className="cert-container">
                <div className="cert-header">
                  <button className="detail-close" style={{ color: 'white', opacity: 0.8 }} onClick={() => setSelected(null)}>✕</button>
                  <div className="cert-header-meta">
                    <div>
                      <div className="cert-label">Numéro d'Identification Unique</div>
                      <div className="cert-niu">{selectedRecord.niu}</div>
                    </div>
                    <div className={`cert-status-badge ${selectedRecord.statut === "VALIDÉ" ? "valide" : selectedRecord.statut === "REJETÉ" ? "rejete" : "attente"}`}>
                      {selectedRecord.statut}
                    </div>
                  </div>
                  <div className="cert-main-info">
                    <div className="cert-avatar">{selectedRecord.prenom[0]}{selectedRecord.nom[0]}</div>
                    <div>
                      <div className="cert-label" style={{ color: 'white' }}>Enfant</div>
                      <div className="cert-name">{selectedRecord.prenom} {selectedRecord.nom}</div>
                    </div>
                  </div>
                </div>

                <div className="cert-body">
                  <div className="cert-grid">
                    <div className="cert-section">
                      <div className="cert-section-title">👶 L'Enfant</div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Sexe</div>
                        <div className="cert-data-value">{selectedRecord.sexe === "M" ? "Masculin" : "Féminin"}</div>
                      </div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Né(e) le</div>
                        <div className="cert-data-value">{selectedRecord.date} à {selectedRecord.heure || '--:--'}</div>
                      </div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Lieu</div>
                        <div className="cert-data-value">{selectedRecord.lieuPrecis || selectedRecord.commune}</div>
                      </div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Préfecture</div>
                        <div className="cert-data-value">{selectedRecord.prefecture}</div>
                      </div>
                    </div>

                    <div className="cert-section">
                      <div className="cert-section-title">👪 Les Parents</div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Père</div>
                        <div className="cert-data-value">{selectedRecord.nomPere}</div>
                      </div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Mère</div>
                        <div className="cert-data-value">{selectedRecord.nomMere}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cert-footer">
                  <div className="cert-blockchain-meta">
                    <div className="cert-hash-label">Preuve d'existence Blockchain (Hash)</div>
                    <div className="cert-hash-value">{selectedRecord.hashBlock}</div>
                  </div>

                  {user?.role === 'NATIONAL_PORTAL' && selectedRecord.statut === 'EN ATTENTE' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => handleAction('VALIDÉ')}
                        className="btn-cert-primary"
                        style={{ background: '#22c55e' }}
                        disabled={actionLoading}
                      >
                        ✓ Approuver l'acte
                      </button>
                      <button 
                        onClick={() => handleAction('REJETÉ')}
                        className="btn-cert-primary"
                        style={{ background: '#ef4444' }}
                        disabled={actionLoading}
                      >
                        ✗ Rejeter
                      </button>
                    </div>
                  )}

                  <div className="cert-actions">
                    <button className="btn-cert-primary">Imprimer le certificat</button>
                    <button className="btn-cert-secondary">Exporter en PDF</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}