import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./pages.css";
import "./PortailNational.css";
import { useApp } from "./App";
import PageEnregistrements from "./PageEnregistrements";
import PageVerification from "./PageVerification";
import PagePrefectures from "./PagePrefectures";
import PageAgents from "./PageAgents";
import PageParametres from "./PageParametres";
import { enregistrementService } from "./api/enregistrementService";
import { parseQRData } from "./utils/qrUtils";
import type { Enregistrement } from "./data";

// Global window properties are defined in src/types/globals.d.ts

export default function PortailNational() {
  const { setView } = useApp();
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const validTabs = ["dashboard", "enregistrements", "verification", "prefectures", "agents", "settings"];
    return tab && validTabs.includes(tab) ? tab : "dashboard";
  };

  const [activeTab, setActiveTabRaw] = useState(getInitialTab());

  const setActiveTab = (tab: string) => {
    if (activeTab !== tab) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState(null, '', url.toString());
      setActiveTabRaw(tab);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabRaw(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [recentRecords, setRecentRecords] = useState<Enregistrement[]>([]);
  const [stats, setStats] = useState({ total: 0, valide: 0, attente: 0, rejete: 0 });
  
  // Dashboard Quick Verification State
  const [quickSearch, setQuickSearch] = useState("");
  const [quickResult, setQuickResult] = useState<Enregistrement | null>(null);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [records, s] = await Promise.all([
          enregistrementService.getAll(),
          enregistrementService.getStats()
        ]);
        setRecentRecords(records.slice(0, 5));
        setStats(s);
      } catch (err) {
        console.error("Dashboard data load failed", err);
      }
    };
    if (activeTab === "dashboard") {
      loadData();
    }
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, [activeTab]);

  const handleQuickSearch = async () => {
    if (!quickSearch.trim()) return;
    try {
      const found = await enregistrementService.search(quickSearch);
      if (found.length > 0) setQuickResult(found[0]);
      else alert("Aucun acte trouvé");
    } catch {
      alert("Erreur de recherche");
    }
  };

  const handleQuickAction = async (statusUpdate: 'VALIDÉ' | 'REJETÉ') => {
    if (!quickResult) return;
    try {
      const updated = await enregistrementService.updateStatus(quickResult.niu, statusUpdate);
      setQuickResult(updated);
      setRecentRecords(prev => prev.map(r => r.niu === updated.niu ? updated : r));
      alert(`Acte ${statusUpdate === 'VALIDÉ' ? 'approuvé' : 'rejeté'} avec succès.`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      alert("Erreur lors de la mise à jour: " + (error.response?.data?.message || error.message));
    }
  };

  const startQuickScan = async () => {
    setQuickResult(null);
    setScanState("scanning");

    setTimeout(async () => {
      try {
        const target = document.getElementById("dashboard-qr-target");
        if (!target) {
          console.error("Target div not found");
          setScanState("idle");
          return;
        }

        if (scannerRef.current) await scannerRef.current.stop().catch(() => {});

        const scanner = new Html5Qrcode("dashboard-qr-target");
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        
        await scanner.start(
          { facingMode: "environment" },
          config,
          (text: string) => {
            scanner.stop().then(async () => {
              const parsed = parseQRData(text);
              if (typeof parsed === "object" && parsed !== null) {
                setQuickResult(parsed as Enregistrement);
              } else if (typeof parsed === "string") {
                const found = await enregistrementService.getByNiu(parsed);
                if (found) setQuickResult(found);
              }
              setScanState("done");
              setTimeout(() => setScanState("idle"), 1000);
            }).catch(console.error);
          },
          () => {}
        );
      } catch (err) {
        console.error("Dashboard scanner error:", err);
        setScanState("idle");
      }
    }, 400);
  };

  return (
    <div className="portail-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">◆</div>
          <div>
            <div className="sidebar-logo-title">Souveraineté</div>
            <div className="sidebar-logo-sub">Numérique</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">PRINCIPAL</div>
          <button className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            Tableau de Bord
          </button>
          <button className={`sidebar-item ${activeTab === "enregistrements" ? "active" : ""}`} onClick={() => setActiveTab("enregistrements")}>
            Enregistrements
          </button>
          <button className={`sidebar-item ${activeTab === "verification" ? "active" : ""}`} onClick={() => setActiveTab("verification")}>
            Vérification
          </button>
          <button className={`sidebar-item ${activeTab === "prefectures" ? "active" : ""}`} onClick={() => setActiveTab("prefectures")}>
            Préfectures
          </button>
          <div className="sidebar-section-label" style={{ marginTop: 24 }}>ADMINISTRATION</div>
          <button className={`sidebar-item ${activeTab === "agents" ? "active" : ""}`} onClick={() => setActiveTab("agents")}>
            Agents
          </button>
          <button className={`sidebar-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
            Paramètres
          </button>
        </nav>

        <div className="sidebar-back">
          <button className="sidebar-back-btn" onClick={() => setView("home")}>Retour au site</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="portail-main">
        {activeTab === "dashboard" && (
          <header className="portail-header">
            <div>
              <h1 className="portail-page-title">Registre National de l'État Civil</h1>
              <p className="portail-page-sub">Portail d'administration — République de Guinée</p>
            </div>
            <div className="portail-header-actions">
              <button className="btn-new-record" onClick={() => setView("enregistrement")}>Nouvel Enregistrement</button>
              <div className="portail-avatar">AD</div>
            </div>
          </header>
        )}

        {activeTab === "dashboard" && (
          <div className="portail-content">
            <div className="kpi-grid">
              <div className="kpi-card white">
                <div className="kpi-label">NAISSANCES ENREGISTRÉES</div>
                <div className="kpi-value">{stats.total}</div>
                <div className="kpi-trend">Système Initialisé</div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-label">CE MOIS-CI</div>
                <div className="kpi-value">{stats.valide}</div>
                <div className="kpi-badge-row"><span className="blockchain-dot"></span><span className="kpi-badge-text">Blockchain Active</span></div>
              </div>
              <div className="kpi-card yellow">
                <div className="kpi-label">COUVERTURE NATIONALE</div>
                <div className="kpi-value">{Math.round((stats.valide / 10000) * 100)}%</div>
                <div className="kpi-progress-bar"><div className="kpi-progress-fill" style={{ width: `${Math.round((stats.valide / 10000) * 100)}%` }}></div></div>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <div className="table-section">
                <div className="table-header">
                  <h2 className="table-title">Enregistrements Récents</h2>
                  <button className="voir-tout" onClick={() => setActiveTab("enregistrements")}>Voir tout →</button>
                </div>
                <div className="table-wrapper">
                  <table className="records-table">
                    <thead>
                      <tr><th>NIU</th><th>NOM COMPLET</th><th>DATE</th><th>STATUT</th><th>ACTIONS</th></tr>
                    </thead>
                    <tbody>
                      {recentRecords.map((r) => (
                        <tr key={r.niu} onClick={() => setQuickResult(r)} style={{ cursor: 'pointer' }} className={quickResult?.niu === r.niu ? "row-selected" : ""}>
                          <td className="niu-cell">{r.niu}</td>
                          <td className="nom-cell">{r.nom}</td>
                          <td>{r.date}</td>
                          <td><span className={`statut-badge ${r.statut === "VALIDÉ" ? "valide" : "attente"}`}>{r.statut}</span></td>
                          <td><button className="voir-acte" onClick={() => { setQuickResult(r); }}>Détails</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QUICK VERIFICATION CARD */}
              <div className="quick-verif-card">
                <h3 className="table-title">Vérification Rapide</h3>
                <div className="quick-verif-content">
                  <div className={`dashboard-scanner-box ${scanState === "scanning" ? "active" : ""}`}>
                    {scanState === "scanning" ? (
                      <div id="dashboard-qr-target" style={{ width: '100%', height: '100%' }}></div>
                    ) : quickResult ? (
                      <div className="quick-res-view">
                        <div className="quick-res-name">{quickResult.prenom} {quickResult.nom}</div>
                        <div className="quick-res-niu">{quickResult.niu}</div>
                        <div className="quick-res-statut">{quickResult.statut}</div>
                        
                        {quickResult.statut === 'EN ATTENTE' && (
                          <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
                            <button onClick={() => handleQuickAction('VALIDÉ')} style={{ flex: 1, padding: '8px', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✓ Approuver</button>
                            <button onClick={() => handleQuickAction('REJETÉ')} style={{ flex: 1, padding: '8px', background: '#C62828', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✗ Rejeter</button>
                          </div>
                        )}
                        
                        <button className="btn-reset-quick" onClick={() => setQuickResult(null)} style={{ marginTop: '12px' }}>Nouveau Scan</button>
                      </div>
                    ) : (
                      <div className="quick-scan-placeholder">
                        <div className="scan-icon-lg">📷</div>
                        <button className="btn-dash-scan" onClick={startQuickScan}>Scanner QR Code</button>
                      </div>
                    )}
                  </div>
                  <div className="quick-search-box">
                    <input type="text" placeholder="Entrer NIU..." value={quickSearch} onChange={e => setQuickSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleQuickSearch()} />
                    <button onClick={handleQuickSearch}>Rechercher</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "enregistrements" && <PageEnregistrements />}
        {activeTab === "verification" && <PageVerification />}
        {activeTab === "prefectures" && <PagePrefectures />}
        {activeTab === "agents" && <PageAgents />}
        {activeTab === "settings" && <PageParametres />}
      </main>
    </div>
  );
}
