import { useState, useEffect, useMemo } from "react";
import "./pages.css";
import "./pages-content.css";
import { agentService } from "./api/agentService";
import type { Agent } from "./data";

export default function PageAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [prefFilter, setPrefFilter] = useState("TOUTES");
  const [statutFilter, setStatutFilter] = useState<"TOUS" | "ACTIF" | "INACTIF">("TOUS");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ nom: "", prenom: "", prefecture: "CONAKRY", grade: "Officier", tel: "", email: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await agentService.getAll();
        setAgents(data);
      } catch (err) {
        console.error("Failed to load agents", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prefectures = useMemo(() => ["TOUTES", ...Array.from(new Set(agents.map((a) => a.prefecture)))], [agents]);
  const filtered = useMemo(() => agents.filter((a) => {
    const q = search.toLowerCase();
    return (
      (prefFilter === "TOUTES" || a.prefecture === prefFilter) &&
      (statutFilter === "TOUS" || a.statut === statutFilter) &&
      (q === "" || a.nom.toLowerCase().includes(q) || a.prenom.toLowerCase().includes(q) || (a.id || "").toLowerCase().includes(q))
    );
  }), [agents, search, prefFilter, statutFilter]);

  const selectedAgent = selected ? agents.find((a) => a.id === selected) : null;

  if (loading) return <div className="page-container">Chargement des agents...</div>;

  return (
    <div className="page-container full-width">
      <div className="page-header-premium">
        <div className="page-header-inner">
          <div className="page-title-group">
            <div className="page-icon-circle-premium">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h2 className="page-title-xl">Agents de l'État Civil</h2>
              <p className="page-sub-lg">Gestion et monitoring des officiers délégués sur le territoire national</p>
            </div>
          </div>
          <button className="btn-add-agent" onClick={() => setShowAddModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvel Agent
          </button>
        </div>
        
        <div className="header-stats-row">
          <div className="header-stat">
            <span className="h-stat-val">{agents.filter(a => a.statut === "ACTIF").length}</span>
            <span className="h-stat-lbl">ACTIFS</span>
          </div>
          <div className="header-stat-sep" />
          <div className="header-stat">
            <span className="h-stat-val">{agents.filter(a => a.statut === "INACTIF").length}</span>
            <span className="h-stat-lbl">INACTIFS</span>
          </div>
          <div className="header-stat-sep" />
          <div className="header-stat">
            <span className="h-stat-val">{agents.length}</span>
            <span className="h-stat-lbl">TOTAL</span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-tabs-row">
        <div className="filter-tabs">
          {(["TOUS", "ACTIF", "INACTIF"] as const).map((s) => (
            <button
              key={s}
              className={`filter-tab ${statutFilter === s ? "active" : ""} ${s === "ACTIF" ? "green" : s === "INACTIF" ? "red" : ""}`}
              onClick={() => setStatutFilter(s)}
            >
              {s} <span className="filter-count">{s === "TOUS" ? agents.length : agents.filter(a => a.statut === s).length}</span>
            </button>
          ))}
        </div>
        <div className="filter-controls">
          <div className="search-box-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Nom, prénom, ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="pref-select" value={prefFilter} onChange={(e) => setPrefFilter(e.target.value)}>
            {prefectures.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="agents-layout">
        <div className="agents-grid">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className={`agent-card ${selected === agent.id ? "selected" : ""}`}
              onClick={() => setSelected(selected === agent.id ? null : (agent.id || null))}
            >
              <div className="agent-card-top">
                <div className={`agent-avatar-card ${agent.statut === "ACTIF" ? "" : "inactive"}`}>{agent.avatar}</div>
                <div className={`agent-statut-badge ${agent.statut === "ACTIF" ? "actif" : "inactif"}`}>{agent.statut}</div>
              </div>
              <div className="agent-card-name">{agent.prenom} {agent.nom}</div>
              <div className="agent-card-grade">{agent.grade}</div>
              <div className="agent-card-prefecture">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"/></svg>
                {agent.prefecture}
              </div>
              <div className="agent-card-stats">
                <div className="agent-card-stat">
                  <span className="agent-stat-num">{agent.enregistrements || 0}</span>
                  <span className="agent-stat-label">Enreg.</span>
                </div>
                <div className="agent-card-stat-div" />
                <div className="agent-card-stat">
                  <span className="agent-stat-num">{agent.id}</span>
                  <span className="agent-stat-label">ID Agent</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL AJOUT AGENT */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content agent-form-modal" onClick={(e) => e.stopPropagation()}>
              <div className="detail-panel-header">
                <span className="detail-panel-title">Inscrire un Nouvel Agent</span>
                <button className="detail-close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="form-scroll">
                <div className="form-section-title">Informations Personnelles</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom</label>
                    <input type="text" placeholder="Ex: Mamadou" value={newAgent.prenom} onChange={e => setNewAgent({...newAgent, prenom: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input type="text" placeholder="Ex: Diallo" value={newAgent.nom} onChange={e => setNewAgent({...newAgent, nom: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Professionnel</label>
                  <input type="email" placeholder="m.diallo@etatcivil.gn" value={newAgent.email} onChange={e => setNewAgent({...newAgent, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Numéro de Téléphone</label>
                  <input type="tel" placeholder="+224 6XX XX XX XX" value={newAgent.tel} onChange={e => setNewAgent({...newAgent, tel: e.target.value})} />
                </div>

                <div className="form-section-title" style={{marginTop: 20}}>Affectation</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Préfecture</label>
                    <select value={newAgent.prefecture} onChange={e => setNewAgent({...newAgent, prefecture: e.target.value})}>
                      {prefectures.filter(p => p !== "TOUTES").map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grade / Fonction</label>
                    <select value={newAgent.grade} onChange={e => setNewAgent({...newAgent, grade: e.target.value})}>
                      <option>Officier d'État Civil</option>
                      <option>Délégué Communal</option>
                      <option>Superviseur Régional</option>
                      <option>Administrateur IT</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="detail-actions">
                <button className="btn-detail-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button className="btn-detail-primary" onClick={() => { alert("Agent inscrit avec succès (Simulation)"); setShowAddModal(false); }}>Confirmer l'Inscription</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL */}
        {selectedAgent && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-content agent-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="detail-panel-header">
                <span className="detail-panel-title">Profil Agent</span>
                <button className="detail-close" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className="agent-detail-top">
                <div className={`agent-avatar-xl ${selectedAgent.statut === "ACTIF" ? "" : "inactive"}`}>{selectedAgent.avatar}</div>
                <div className="agent-detail-name">{selectedAgent.prenom} {selectedAgent.nom}</div>
                <div className="agent-detail-grade">{selectedAgent.grade}</div>
                <span className={`agent-statut-badge ${selectedAgent.statut === "ACTIF" ? "actif" : "inactif"}`}>{selectedAgent.statut}</span>
              </div>

              <div className="agent-detail-kpi">
                <div className="agent-kpi-box">
                  <div className="agent-kpi-num">{selectedAgent.enregistrements || 0}</div>
                  <div className="agent-kpi-lbl">Enregistrements</div>
                </div>
                <div className="agent-kpi-box yellow">
                  <div className="agent-kpi-num">{Math.round((selectedAgent.enregistrements || 0) / 12)}</div>
                  <div className="agent-kpi-lbl">/ mois (moy.)</div>
                </div>
              </div>

              <div className="detail-rows" style={{ marginTop: 20 }}>
                {[
                  ["ID Agent", selectedAgent.id],
                  ["Préfecture", selectedAgent.prefecture],
                  ["Grade", selectedAgent.grade],
                  ["Téléphone", selectedAgent.tel],
                  ["Email", selectedAgent.email],
                  ["Date d'entrée", selectedAgent.dateEntree],
                ].map(([l, v]) => (
                  <div key={l} className="detail-row">
                    <span className="detail-row-label">{l}</span>
                    <span className="detail-row-value">{v}</span>
                  </div>
                ))}
              </div>

              <div className="detail-actions">
                <button className="btn-detail-primary">Voir Rapports Détaillés</button>
                <button className="btn-detail-secondary">Modifier le Profil</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
