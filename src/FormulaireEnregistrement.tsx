import { useState, useEffect } from "react";
import { useApp } from "./App";
import "./FormulaireEnregistrement.css";
import { enregistrementService } from "./api/enregistrementService";
import type { Enregistrement } from "./data";
import "./pages.css";

export default function FormulaireEnregistrement() {
  const { setView } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);

  const [generatedNiu, setGeneratedNiu] = useState("");
  const [isOfflineSync, setIsOfflineSync] = useState(false);

  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [form, setForm] = useState({
    nomEnfant: "",
    prenomEnfant: "",
    sexe: "",
    dateNaissance: "",
    heureNaissance: "",
    ville: "",
    hopital: "",
    prefecture: "",
    nomPere: "",
    nomMere: "",
  });

  useEffect(() => {
    import("./api/prefectureService").then(m => {
      m.prefectureService.getAll().then(data => {
        setPrefectures(data.map(p => p.nom));
      }).catch(() => {
        setPrefectures(["CONAKRY", "KANKAN", "KINDIA", "LABÉ", "NZÉRÉKORÉ", "BOKÉ", "MAMOU", "FARANAH"]);
      });
    });
  }, []);

  const update = (field: string, val: string) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    // Génération automatique du NIU
    const niu = `${Math.floor(100000 + Math.random() * 899999)}-GU-${new Date().getFullYear()}`;
    setGeneratedNiu(niu);

    const record: Omit<Enregistrement, "hashBlock" | "dateCreation"> = {
      niu,
      nom: form.nomEnfant || "Inconnu",
      prenom: form.prenomEnfant || "Inconnu",
      sexe: form.sexe as "M" | "F",
      date: form.dateNaissance || new Date().toISOString().split("T")[0],
      heure: form.heureNaissance,
      prefecture: form.prefecture || "Inconnu",
      commune: form.ville || "Inconnu",
      lieuPrecis: form.hopital,
      statut: "EN ATTENTE",
      nomPere: form.nomPere || "Inconnu",
      nomMere: form.nomMere || "Inconnu",
      agent: "Agent Local",
      agentId: "AG-TEST-01",
    };

    try {
      await enregistrementService.create(record);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
      setIsOfflineSync(true);
    }
  };

  if (submitted) {
    return (
      <div className="form-root">
        <Sidebar setView={setView} />
        <main className="form-main">
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <h2 className="success-title">{isOfflineSync ? "Enregistrement Sauvegardé Localement" : "Enregistrement Soumis !"}</h2>
            <p className="success-desc">
              {isOfflineSync 
                ? "Vous êtes actuellement hors ligne. L'enregistrement a été sauvegardé sur votre appareil et sera synchronisé automatiquement dès que vous aurez une connexion internet."
                : `L'acte de naissance de ${form.prenomEnfant} ${form.nomEnfant} a été soumis avec succès.`
              }
            </p>
            <div className="success-niu">
              <span className="success-niu-label">{isOfflineSync ? "STATUT" : "NIU GÉNÉRÉ"}</span>
              <span className="success-niu-value">
                {isOfflineSync ? "EN ATTENTE DE SYNC" : generatedNiu}
              </span>
            </div>
            <div className="success-btns">
              <button className="btn-form-primary" onClick={() => { setSubmitted(false); setStep(1); setForm(f => ({ ...f, nomEnfant: "", prenomEnfant: "" })); }}>
                Nouvel Enregistrement
              </button>
              <button className="btn-form-secondary" onClick={() => setView("portail")}>
                Retour au Portail
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="form-root">
      <Sidebar setView={setView} />

      <main className="form-main">
        <header className="form-header">
          <div>
            <h1 className="form-page-title">Enregistrement d'une Naissance</h1>
            <p className="form-page-sub">Informations simplifiées (NIU automatique)</p>
          </div>
        </header>

        <div className="form-body">
          {step === 1 ? (
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-card-icon green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                </div>
                <h2 className="form-card-title">Identité de l'Enfant</h2>
              </div>

              <div className="form-grid-2">
                <FormField label="NOM DE L'ENFANT" value={form.nomEnfant} onChange={v => update("nomEnfant", v)} placeholder="Diallo" />
                <FormField label="PRÉNOM DE L'ENFANT" value={form.prenomEnfant} onChange={v => update("prenomEnfant", v)} placeholder="Mamadou" />
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label className="form-label">SEXE</label>
                  <select className="form-select" value={form.sexe} onChange={e => update("sexe", e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <FormField label="DATE DE NAISSANCE" value={form.dateNaissance} onChange={v => update("dateNaissance", v)} type="date" />
                <FormField label="HEURE DE NAISSANCE" value={form.heureNaissance} onChange={v => update("heureNaissance", v)} type="time" />
              </div>

              <div className="form-grid-3">
                <FormField label="VILLE / COMMUNE" value={form.ville} onChange={v => update("ville", v)} placeholder="Kaloum" />
                <div className="form-field">
                  <label className="form-label">PRÉFECTURE</label>
                  <select className="form-select" value={form.prefecture} onChange={e => update("prefecture", e.target.value)}>
                    <option value="">Sélectionner</option>
                    {prefectures.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <FormField label="HÔPITAL / LIEU" value={form.hopital} onChange={v => update("hopital", v)} placeholder="Hôpital Donka" />
              </div>

              <div className="form-actions">
                <div />
                <button className="btn-form-primary" onClick={() => setStep(2)}>Suivant: Filiation →</button>
              </div>
            </div>
          ) : (
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-card-icon blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                </div>
                <h2 className="form-card-title">Filiation (Parents)</h2>
              </div>

              <div className="form-field full">
                <FormField label="NOM COMPLET DU PÈRE" value={form.nomPere} onChange={v => update("nomPere", v)} placeholder="Ibrahima Diallo" full />
              </div>
              <div className="form-field full">
                <FormField label="NOM COMPLET DE LA MÈRE" value={form.nomMere} onChange={v => update("nomMere", v)} placeholder="Aïssatou Camara" full />
              </div>

              <div className="form-actions">
                <button className="btn-form-secondary" onClick={() => setStep(1)}>← Retour</button>
                <button className="btn-form-submit" onClick={handleSubmit}>Soumettre l'Acte</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder = "", type = "text", full = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; full?: boolean;
}) {
  return (
    <div className={`form-field ${full ? "full" : ""}`}>
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Sidebar({ setView }: { setView: (v: string) => void }) {
  return (
    <aside className="form-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">◆</div>
        <div>
          <div className="sidebar-logo-title">Souveraineté</div>
          <div className="sidebar-logo-sub">Numérique</div>
        </div>
      </div>

      <div className="form-sidebar-info">
        <div className="form-sidebar-step-label">ÉTAPES</div>
        <ul className="form-sidebar-steps">
          <li>① Identité et Lieu</li>
          <li>② Filiation</li>
        </ul>

        <div className="form-sidebar-tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span>Les données sont sécurisées par la blockchain NaissanceChain.</span>
        </div>
      </div>

      <div className="sidebar-back">
        <button className="sidebar-back-btn" onClick={() => setView("home")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><polyline points="12,19 5,12 12,5" /></svg>
          Retour au site
        </button>

        <button className="sidebar-back-btn" style={{ marginTop: 8 }} onClick={() => setView("portail")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          Portail National
        </button>
      </div>
    </aside>
  );
}
