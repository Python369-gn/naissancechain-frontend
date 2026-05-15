import { useState, useEffect, useRef } from "react";
import { useApp } from "./App";
import { enregistrementService } from "./api/enregistrementService";
import { parseQRData } from "./utils/qrUtils";
import type { Enregistrement } from "./data";

import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "./context/AuthContext";
import "./PortailVerification.css";

type Mode = "home" | "scan" | "search" | "result";

export default function PortailVerification() {
  const { setView } = useApp();
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<Mode>("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Enregistrement[]>([]);
  const [record, setRecord] = useState<Enregistrement | null>(null);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [manualNIU, setManualNIU] = useState("");
  const [verifHistory, setVerifHistory] = useState<{ niu: string; nom: string; time: string; org: string }[]>(() => {
    const hist = localStorage.getItem("verif_history");
    return hist ? JSON.parse(hist) : [];
  });

  const [actionLoading, setActionLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const addHistory = (r: Enregistrement) => {
    const entry = {
      niu: r.niu,
      nom: `${r.prenom} ${r.nom}`,
      time: new Date().toLocaleTimeString("fr-FR"),
      org: user?.structureName || "Structure",
    };
    const newHist = [entry, ...verifHistory].slice(0, 10);
    setVerifHistory(newHist);
    localStorage.setItem("verif_history", JSON.stringify(newHist));
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    try {
      const found = await enregistrementService.search(query);
      setResults(found);
      if (found.length === 1) { 
        setRecord(found[0]); 
        addHistory(found[0]); 
        setMode("result"); 
      }
      else setMode("search");
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const selectRecord = (r: Enregistrement) => {
    setRecord(r); addHistory(r); setMode("result");
  };

  const processQRCodeData = async (dataStr: string) => {
    try {
      const parsed = parseQRData(dataStr);
      
      if (typeof parsed === "object" && parsed !== null) {
        setScanState("done");
        setTimeout(() => { selectRecord(parsed as Enregistrement); setScanState("idle"); }, 600);
        return;
      }

      if (parsed) {
        const found = await enregistrementService.getByNiu(parsed);
        if (found) {
          setScanState("done");
          setTimeout(() => { selectRecord(found); setScanState("idle"); }, 600);
          return;
        }
      }
      setScanState("error");
    } catch {
      // Agent variable unused
    }
  };

  const startCameraScan = async () => {
    setScanState("scanning");
    setScanProgress(0);

    // Give React time to render the 'qr-reader-target' div
    setTimeout(async () => {
      try {
        if (!window.Html5Qrcode) throw new Error("Scanner non chargé");
        if (scannerRef.current) await scannerRef.current.stop().catch(() => {});

        const scanner = new window.Html5Qrcode("qr-reader-target");
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        const successCallback = (decodedText: string) => {
          scanner.stop().then(() => {
            setScanProgress(100);
            processQRCodeData(decodedText);
          }).catch(console.error);
        };

        await scanner.start({ facingMode: "environment" }, config, successCallback, () => {});

        let p = 0;
        const iv = setInterval(() => {
          if (scanState !== "scanning") { clearInterval(iv); return; }
          p = (p + 2) % 100;
          setScanProgress(p);
        }, 50);

      } catch (err) {
        console.error("Scanner error:", err);
        setScanState("idle");
      }
    }, 300);
  };

  const handleManualNIU = async () => {
    const parsed = parseQRData(manualNIU);
    if (!parsed) return;
    try {
      const found = await enregistrementService.getByNiu(parsed);
      if (found) { setRecord(found); addHistory(found); setMode("result"); }
      else { setResults([]); setMode("search"); }
    } catch {
      setResults([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedFile(dataUrl);
      setScanState("scanning");
      setScanProgress(50);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx && window.jsQR) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          try {
            if (code && code.data) {
              setScanProgress(100);
              processQRCodeData(code.data);
            } else {
              throw new Error("No QR");
            }
          } catch {
            setScanState("error");
            setTimeout(() => setScanState("idle"), 2000);
          }
        } else {
          console.error("jsQR or Canvas not available");
          setScanState("error");
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setMode("home");
    setRecord(null); setResults([]); setQuery(""); setUploadedFile(null);
    setScanState("idle"); setScanProgress(0); setManualNIU("");
  };

  const handleAction = async (statusUpdate: 'VALIDÉ' | 'REJETÉ') => {
    if (!record) return;
    setActionLoading(true);
    try {
      const updated = await enregistrementService.updateStatus(record.niu, statusUpdate);
      setRecord(updated);
      alert(`Acte ${statusUpdate === 'VALIDÉ' ? 'approuvé' : 'rejeté'} avec succès.`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      alert("Erreur lors de la mise à jour: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const orgLabel = user?.structureName || "Portail de Vérification";

  return (
    <div className="vp-root">
      <VPNav setView={setView} org={orgLabel} onLogout={logout} />
      <div className="vp-body">
        <aside className="vp-sidebar">
          <div className="vp-sidebar-title">Actions</div>
          <button className={`vp-side-btn ${mode === "scan" ? "active" : ""}`} onClick={() => { reset(); setMode("scan"); }}>
            <span>📷</span> Scanner QR Code
          </button>
          <button className={`vp-side-btn ${mode === "search" ? "active" : ""}`} onClick={() => { reset(); setMode("search"); }}>
            <span>🔍</span> Recherche NIU / Nom
          </button>

          <div className="vp-sidebar-title" style={{ marginTop: 24 }}>Historique récent</div>
          {verifHistory.length === 0 && <p className="vp-hist-empty">Aucune vérification</p>}
          {verifHistory.map((h, i) => (
            <div key={i} className="vp-hist-item" onClick={async () => { 
              const r = await enregistrementService.getByNiu(h.niu);
              if (r) { setRecord(r); setMode("result"); }
            }}>
              <div className="vp-hist-name">{h.nom}</div>
              <div className="vp-hist-meta">{h.niu} · {h.time}</div>
            </div>
          ))}
          <button className="vp-back-btn" onClick={() => setView("home")}>← Retour au site</button>
        </aside>

        <main className="vp-main">
          {mode === "home" && (
            <div className="vp-welcome">
              <div className="vp-welcome-icon">🏢</div>
              <h2 className="vp-welcome-title">Bienvenue, {user?.structureName}</h2>
              <p className="vp-welcome-sub">Vérifiez l'authenticité d'un acte de naissance.</p>
              <div className="vp-home-btns">
                <button className="vp-home-btn green" onClick={() => setMode("scan")}>
                  <span>📷</span>
                  <div><strong>Scanner QR Code</strong><p>Pointez vers le QR ou importez une image</p></div>
                </button>
                <button className="vp-home-btn dark" onClick={() => setMode("search")}>
                  <span>🔍</span>
                  <div><strong>Recherche Manuelle</strong><p>NIU, nom ou prénom de l'enfant</p></div>
                </button>
              </div>
            </div>
          )}

          {mode === "scan" && (
            <div className="vp-scan-panel">
              <h2 className="vp-panel-title">Scanner un QR Code</h2>
              <div className="vp-scan-methods">
                <div className="vp-method-card">
                  <div className="vp-method-header"><span className="vp-method-num">01</span><span className="vp-method-label">Caméra</span></div>
                  <div className={`vp-qr-box ${scanState === "scanning" ? "active" : ""}`}>
                    {scanState === "scanning" && <div id="qr-reader-target" className="vp-video-feed"></div>}
                    <VPQRFrame />
                    {scanState === "idle" && <p className="vp-qr-hint">Cliquez pour activer la caméra</p>}
                    {scanState === "scanning" && <div className="vp-scan-bar" style={{ top: `${scanProgress}%` }} />}
                    {scanState === "done" && <div className="vp-scan-ok">✓ QR Détecté !</div>}
                    {scanState === "error" && <div className="vp-scan-err">✗ QR non reconnu</div>}
                  </div>
                  <button className="vp-btn-yellow" onClick={startCameraScan} disabled={scanState === "scanning"}>
                    {scanState === "scanning" ? "Lecture..." : "📷 Activer Caméra"}
                  </button>
                </div>

                <div className="vp-method-card">
                  <div className="vp-method-header"><span className="vp-method-num">02</span><span className="vp-method-label">Importer Image</span></div>
                  <div className="vp-upload-zone" onClick={() => fileRef.current?.click()}>
                    {!uploadedFile && <p className="vp-upload-text">Cliquez pour importer</p>}
                    {uploadedFile && <div className="vp-upload-overlay">✓ Image chargée</div>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                  <button className="vp-btn-green" onClick={() => fileRef.current?.click()}>📁 Choisir un fichier</button>
                </div>

                <div className="vp-method-card">
                  <div className="vp-method-header"><span className="vp-method-num">03</span><span className="vp-method-label">NIU</span></div>
                  <div className="vp-niu-input-group">
                    <input className="vp-niu-input" placeholder="Ex: 59153-GU-2026" value={manualNIU} onChange={(e) => setManualNIU(e.target.value)} />
                    <button className="vp-btn-green" onClick={handleManualNIU}>Vérifier</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "search" && (
            <div className="vp-search-panel">
              <h2 className="vp-panel-title">Recherche</h2>
              <div className="vp-search-bar">
                <input className="vp-search-input" placeholder="NIU, nom..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
                <button className="vp-btn-green" onClick={doSearch}>Rechercher</button>
              </div>
              {results.length > 0 && (
                <div className="vp-results">
                  {results.map((r) => (
                    <div key={r.niu} className="vp-result-row" onClick={() => selectRecord(r)}>
                      <div className="vp-result-avatar">{r.prenom[0]}{r.nom[0]}</div>
                      <div className="vp-result-info">
                        <div className="vp-result-name">{r.prenom} {r.nom}</div>
                        <div className="vp-result-meta">{r.niu} · {r.date}</div>
                      </div>
                      <span className="vp-result-arrow">→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "result" && record && (
            <div className="vp-result-panel">
              <div className="vp-result-topbar">
                <button className="vp-back-link" onClick={reset}>← Retour</button>
                <button className="vp-print-btn" onClick={() => window.print()}>🖨️ Imprimer</button>
              </div>

              <div className={`vp-status-banner ${record.statut === "VALIDÉ" ? "green" : record.statut === "REJETÉ" ? "red" : "orange"}`}>
                <div className="vp-status-big-icon">{record.statut === "VALIDÉ" ? "✓" : "⏳"}</div>
                <div className="vp-status-text">
                  <div className="vp-status-label">STATUT</div>
                  <div className="vp-status-value">{record.statut}</div>
                </div>
              </div>

              {/* ACTION BUTTONS BASED ON ROLE */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                {user?.role === 'NATIONAL_PORTAL' && record.statut === 'EN ATTENTE' && (
                  <>
                    <button 
                      onClick={() => handleAction('VALIDÉ')}
                      style={{ flex: 1, padding: '12px', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      disabled={actionLoading}
                    >
                      ✓ Approuver
                    </button>
                    <button 
                      onClick={() => handleAction('REJETÉ')}
                      style={{ flex: 1, padding: '12px', background: '#C62828', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      disabled={actionLoading}
                    >
                      ✗ Rejeter
                    </button>
                  </>
                )}
                {user?.role === 'LOCAL_STRUCTURE' && record.statut === 'VALIDÉ' && (
                  <button 
                    onClick={() => alert("Acte certifié conforme par votre structure pour cette session.")}
                    style={{ flex: 1, padding: '12px', background: '#0B3D2E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ✓ Confirmer l'authenticité
                  </button>
                )}
              </div>

              <div className="vp-id-card">
                <div className="vp-id-avatar">{record.prenom[0]}{record.nom[0]}</div>
                <div className="vp-id-info">
                  <div className="vp-id-name">{record.prenom} {record.nom}</div>
                  <div className="vp-id-niu">{record.niu}</div>
                </div>
              </div>

              <div className="vp-info-grid">
                <div className="vp-info-section">
                  <div className="vp-info-section-title">👶 Enfant</div>
                  <VPRow label="Nom" value={record.nom} />
                  <VPRow label="Prénom" value={record.prenom} />
                  <VPRow label="Date" value={record.date} />
                  <VPRow label="Lieu" value={record.lieuPrecis || record.commune} />
                </div>
                <div className="vp-info-section">
                  <div className="vp-info-section-title">👨‍👩‍👦 Parents</div>
                  <VPRow label="Père" value={record.nomPere} />
                  <VPRow label="Mère" value={record.nomMere} />
                </div>
                <div className="vp-info-section blockchain">
                  <div className="vp-info-section-title" style={{ color: "#E8C547" }}>🔗 Blockchain</div>
                  <VPRow label="Hash" value={record.hashBlock?.slice(0, 16) + "..."} mono />
                </div>
              </div>

              {Object.keys(record).some(k => !["_id","niu","nom","prenom","sexe","date","heure","prefecture","commune","lieuPrecis","statut","agent","agentId","hashBlock","dateCreation","nomPere","nomMere"].includes(k)) && (
                <div className="vp-info-section" style={{ marginTop: 20 }}>
                  <div className="vp-info-section-title">➕ Autres Données</div>
                  {Object.entries(record).map(([k, v]) => {
                    if (["_id","niu","nom","prenom","sexe","date","heure","prefecture","commune","lieuPrecis","statut","agent","agentId","hashBlock","dateCreation","nomPere","nomMere"].includes(k)) return null;
                    if (typeof v === "object") return null;
                    return <VPRow key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={String(v)} />;
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function VPNav({ setView, org, onLogout }: { setView: (v: string) => void; org?: string; onLogout?: () => void }) {
  return (
    <header className="vp-nav">
      <div className="vp-nav-left">
        <div className="vp-nav-logo">◆</div>
        <div><div className="vp-nav-title">NaissanceChain</div><div className="vp-nav-sub">Vérification</div></div>
      </div>
      <div className="vp-nav-right">
        {org && <div className="vp-nav-org">{org}</div>}
        {onLogout && <button className="vp-nav-change" onClick={() => { onLogout(); setView('login'); }}>Déconnexion</button>}
        <button className="vp-nav-back" onClick={() => setView("home")}>← Accueil</button>
      </div>
    </header>
  );
}

function VPQRFrame() {
  return (
    <svg className="vp-qr-frame" viewBox="0 0 200 200" fill="none">
      <rect x="10" y="10" width="50" height="50" rx="4" stroke="#1A5C42" strokeWidth="3" fill="none"/>
      <rect x="140" y="10" width="50" height="50" rx="4" stroke="#1A5C42" strokeWidth="3" fill="none"/>
      <rect x="10" y="140" width="50" height="50" rx="4" stroke="#1A5C42" strokeWidth="3" fill="none"/>
    </svg>
  );
}

function VPRow({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  return (
    <div className="vp-row">
      <span className="vp-row-label">{label}</span>
      <span className={`vp-row-value ${mono ? "mono" : ""}`}>{String(value || "N/A")}</span>
    </div>
  );
}
