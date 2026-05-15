import { useState, useRef, useEffect } from "react";
import "./pages.css";
import "./pages-content.css";
import { enregistrementService } from "./api/enregistrementService";
import { agentService } from "./api/agentService";
import { parseQRData } from "./utils/qrUtils";
import type { Enregistrement, Agent } from "./data";
import { useAuth } from "./context/AuthContext";

import { Html5Qrcode } from "html5-qrcode";

export default function PageVerification() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Enregistrement | null | "notfound">(null);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<"qr" | "niu" | "nom">("niu");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const found = await enregistrementService.search(query);
      if (found.length > 0) {
        processFoundRecord(found[0]);
      } else {
        setResult("notfound");
        setAgent(null);
      }
    } catch {
      setResult("notfound");
      setAgent(null);
    }
  };

  const processFoundRecord = async (r: Enregistrement) => {
    setResult(r);
    try {
      const ag = await agentService.getById(r.agentId);
      setAgent(ag);
    } catch {
      setAgent(null);
    }
  };

  const handleAction = async (statusUpdate: 'VALIDÉ' | 'REJETÉ') => {
    if (!result || result === "notfound") return;
    setActionLoading(true);
    try {
      const updated = await enregistrementService.updateStatus(result.niu, statusUpdate);
      setResult(updated);
      alert(`Acte ${statusUpdate === 'VALIDÉ' ? 'approuvé' : 'rejeté'} avec succès.`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      alert("Erreur lors de la mise à jour: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const processQRCodeData = async (dataStr: string) => {
    try {
      const parsed = parseQRData(dataStr);
      
      if (typeof parsed === "object" && parsed !== null) {
        setScanState("done");
        setTimeout(() => { 
          processFoundRecord(parsed as Enregistrement); 
          setScanState("idle"); 
        }, 600);
        return;
      }

      if (parsed) {
        const found = await enregistrementService.getByNiu(parsed);
        if (found) {
          setScanState("done");
          setTimeout(() => { 
            processFoundRecord(found); 
            setScanState("idle"); 
          }, 600);
          return;
        }
      }
      setScanState("error");
      setTimeout(() => setScanState("idle"), 2000);
    } catch {
      setScanState("error");
      setTimeout(() => setScanState("idle"), 2000);
    }
  };

  const startCameraScan = async () => {
    setResult(null);
    setUploadedImage(null);
    setScanState("scanning");
    setScanProgress(0);

    setTimeout(async () => {
      try {
        if (!window.Html5Qrcode) throw new Error("Scanner non chargé");
        if (scannerRef.current) await scannerRef.current.stop().catch(() => {});

        const scanner = new window.Html5Qrcode("qr-reader-target-page");
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedImage(dataUrl);
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
          
          if (code && code.data) {
            setScanProgress(100);
            processQRCodeData(code.data);
          } else {
            setScanState("error");
            setTimeout(() => setScanState("idle"), 2000);
          }
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="page-container full-width">
      <div className="page-header-premium">
        <div className="page-header-inner">
          <div className="page-title-group">
            <div className="page-icon-circle-premium green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h2 className="page-title-xl">Vérification d'Identité</h2>
              <p className="page-sub-lg">Outil de contrôle officiel NaissanceChain</p>
            </div>
          </div>
        </div>
      </div>

      <div className="method-tabs">
        <button className={`method-tab ${activeMethod === "qr" ? "active" : ""}`} onClick={() => { setActiveMethod("qr"); setResult(null); }}>
          📷 Scanner QR
        </button>
        <button className={`method-tab ${activeMethod === "niu" ? "active" : ""}`} onClick={() => { setActiveMethod("niu"); setResult(null); setQuery(""); }}>
          🔍 Recherche NIU
        </button>
        <button className={`method-tab ${activeMethod === "nom" ? "active" : ""}`} onClick={() => { setActiveMethod("nom"); setResult(null); setQuery(""); }}>
          👤 Recherche Nom
        </button>
      </div>

      <div className="verif-layout">
        <div className="verif-input-panel">
          {activeMethod === "qr" && (
            <div className="qr-panel">
              <div className={`qr-scanner-box ${scanState === "scanning" ? "scanning" : ""} ${scanState === "done" ? "done" : ""} ${scanState === "error" ? "error" : ""}`}>
                <div className="qr-corner tl"/><div className="qr-corner tr"/>
                <div className="qr-corner bl"/><div className="qr-corner br"/>
                
                {scanState === "scanning" && !uploadedImage && (
                  <div id="qr-reader-target-page" className="qr-video-feed"></div>
                )}
                
                {uploadedImage && (
                  <img src={uploadedImage} className="qr-uploaded-preview" alt="QR" />
                )}
                
                {scanState === "scanning" && <div className="qr-scan-line" style={{ top: `${scanProgress}%` }}/>}
                
                {scanState === "idle" && !uploadedImage && (
                  <div className="qr-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <p>Prêt pour le scan</p>
                  </div>
                )}
                
                {scanState === "done" && <div className="qr-success-overlay">✓ Détecté</div>}
                {scanState === "error" && <div className="qr-error-overlay">✗ Illisible</div>}
              </div>

              <div className="verif-actions-row">
                <button className="btn-scan" onClick={startCameraScan} disabled={scanState === "scanning"}>
                  {scanState === "scanning" ? "Lecture..." : "📷 Caméra"}
                </button>
                <div className="btn-upload-wrapper">
                  <input type="file" id="qr-upload-p" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <label htmlFor="qr-upload-p" className="btn-upload-label">📁 Image</label>
                </div>
              </div>
            </div>
          )}

          {(activeMethod === "niu" || activeMethod === "nom") && (
            <div className="search-panel">
              <div className="search-input-group">
                <input className="search-input" placeholder={activeMethod === "niu" ? "NIU (ex: 59153...)" : "Nom de l'enfant"} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                <button className="btn-search" onClick={handleSearch}>Vérifier</button>
              </div>
            </div>
          )}
        </div>

        <div className="verif-result-panel">
          {result === null && <div className="verif-empty">En attente de recherche...</div>}
          {result === "notfound" && <div className="verif-notfound">✗ Aucun résultat trouvé</div>}
          {result && result !== "notfound" && (
            <div className="verif-card-result" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div className="cert-container">
                <div className="cert-header" style={{ padding: '24px' }}>
                  <div className="cert-header-meta">
                    <div>
                      <div className="cert-label">NIU OFFICEL</div>
                      <div className="cert-niu" style={{ fontSize: '20px' }}>{result.niu}</div>
                    </div>
                    <div className={`cert-status-badge ${result.statut === "VALIDÉ" ? "valide" : result.statut === "REJETÉ" ? "rejete" : "attente"}`}>
                      {result.statut === "VALIDÉ" ? "✓ AUTHENTIQUE" : result.statut === "REJETÉ" ? "✗ REJETÉ" : "⏳ EN ATTENTE"}
                    </div>
                  </div>
                  <div className="cert-main-info" style={{ gap: '16px' }}>
                    <div className="cert-avatar" style={{ width: '60px', height: '60px', fontSize: '24px' }}>{result.prenom[0]}{result.nom[0]}</div>
                    <div>
                      <div className="cert-label" style={{ color: 'white' }}>Citoyen</div>
                      <div className="cert-name" style={{ fontSize: '24px' }}>{result.prenom} {result.nom}</div>
                    </div>
                  </div>
                </div>

                <div className="cert-body" style={{ padding: '24px' }}>
                  <div className="cert-grid" style={{ gap: '20px' }}>
                    <div className="cert-section">
                      <div className="cert-section-title">👶 Naissance</div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Date & Heure</div>
                        <div className="cert-data-value">{result.date} à {result.heure || '--:--'}</div>
                      </div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Lieu</div>
                        <div className="cert-data-value">{result.lieuPrecis || result.commune}</div>
                      </div>
                    </div>

                    <div className="cert-section">
                      <div className="cert-section-title">👪 Parents</div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Père</div>
                        <div className="cert-data-value">{result.nomPere}</div>
                      </div>
                      <div className="cert-data-row">
                        <div className="cert-data-label">Mère</div>
                        <div className="cert-data-value">{result.nomMere}</div>
                      </div>
                    </div>

                    {agent && (
                      <div className="cert-section">
                        <div className="cert-section-title">👮 Agent Enregistreur</div>
                        <div className="cert-data-row">
                          <div className="cert-data-label">Nom</div>
                          <div className="cert-data-value">{agent.prenom} {agent.nom}</div>
                        </div>
                        <div className="cert-data-row">
                          <div className="cert-data-label">Préfecture</div>
                          <div className="cert-data-value">{agent.prefecture}</div>
                        </div>
                      </div>
                    )}

                    <div className="cert-full-row" style={{ padding: '16px', marginTop: 0 }}>
                      <div className="cert-section-title">📦 Blockchain</div>
                      <div className="cert-blockchain-meta" style={{ padding: '8px 12px' }}>
                        <div className="cert-hash-label">Hash Block</div>
                        <div className="cert-hash-value" style={{ fontSize: '10px' }}>{result.hashBlock}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cert-footer" style={{ padding: '20px 24px' }}>
                  {user?.role === 'NATIONAL_PORTAL' && result.statut === 'EN ATTENTE' && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <button 
                        onClick={() => handleAction('VALIDÉ')}
                        className="btn-cert-primary"
                        style={{ background: '#22c55e', padding: '10px' }}
                        disabled={actionLoading}
                      >
                        ✓ Approuver
                      </button>
                      <button 
                        onClick={() => handleAction('REJETÉ')}
                        className="btn-cert-primary"
                        style={{ background: '#ef4444', padding: '10px' }}
                        disabled={actionLoading}
                      >
                        ✗ Rejeter
                      </button>
                    </div>
                  )}

                  {user?.role === 'LOCAL_STRUCTURE' && result.statut === 'VALIDÉ' && (
                    <button 
                      onClick={() => alert("Acte certifié conforme.")}
                      className="btn-cert-primary"
                      style={{ marginBottom: '10px', padding: '10px' }}
                    >
                      ✓ Confirmer l'authenticité
                    </button>
                  )}

                  <div className="cert-actions">
                    <button className="btn-cert-secondary" style={{ padding: '10px', fontSize: '13px' }}>Imprimer</button>
                    <button className="btn-cert-secondary" style={{ padding: '10px', fontSize: '13px' }}>Partager</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
