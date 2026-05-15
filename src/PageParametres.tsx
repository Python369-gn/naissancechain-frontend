import React from 'react';
import "./pages.css";
import "./pages-content.css";

const PageParametres: React.FC = () => {
  return (
    <div className="page-container full-width">
      <div className="page-header-premium">
        <div className="page-header-inner">
          <div className="page-title-group">
            <div className="page-icon-circle-premium">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 5 5l-1.5 1.5"/><path d="M2 12h3m14 0h3M12 2v3m0 14v3"/></svg>
            </div>
            <div>
              <h1 className="page-title-xl">Paramètres Système</h1>
              <p className="page-sub-lg">Gérez vos préférences et la sécurité de votre compte.</p>
            </div>
          </div>
          <div className="page-actions-premium">
            <button className="btn-save-settings">Enregistrer les modifications</button>
          </div>
        </div>
      </div>

      <div className="settings-layout">
        {/* SIDE TABS (Optional, for now just sections) */}
        <div className="settings-grid">
          {/* SECTION 1: PROFIL */}
          <div className="settings-card reveal revealed">
            <div className="settings-card-header">
              <h3 className="settings-section-title">Profil Utilisateur</h3>
              <p className="settings-section-sub">Informations visibles par l'administration.</p>
            </div>
            <div className="settings-card-body">
              <div className="profile-upload">
                <div className="profile-avatar-lg">AD</div>
                <div className="profile-upload-info">
                  <button className="btn-upload">Changer la photo</button>
                  <p className="upload-limit">JPG, GIF ou PNG. Max 2MB.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom complet</label>
                  <input type="text" defaultValue="Admin NaissanceChain" className="settings-input" />
                </div>
                <div className="form-group">
                  <label>Adresse Email</label>
                  <input type="email" defaultValue="admin@naissancechain.gn" className="settings-input" />
                </div>
                <div className="form-group">
                  <label>Rôle</label>
                  <input type="text" value="Administrateur National" disabled className="settings-input disabled" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SECURITE */}
          <div className="settings-card reveal revealed">
            <div className="settings-card-header">
              <h3 className="settings-section-title">Sécurité & Accès</h3>
              <p className="settings-section-sub">Protégez l'accès au registre souverain.</p>
            </div>
            <div className="settings-card-body">
              <div className="security-item">
                <div className="security-info">
                  <div className="security-title">Authentification à deux facteurs (2FA)</div>
                  <div className="security-desc">Ajoutez une couche de sécurité supplémentaire à votre compte.</div>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
              <hr className="settings-divider" />
              <div className="security-item">
                <div className="security-info">
                  <div className="security-title">Changer le mot de passe</div>
                  <div className="security-desc">Dernière modification il y a 3 mois.</div>
                </div>
                <button className="btn-settings-outline">Mettre à jour</button>
              </div>
            </div>
          </div>

          {/* SECTION 3: BLOCKCHAIN */}
          <div className="settings-card reveal revealed">
            <div className="settings-card-header">
              <h3 className="settings-section-title">Configuration Blockchain</h3>
              <p className="settings-section-sub">État du Sovereign Ledger en temps réel.</p>
            </div>
            <div className="settings-card-body">
              <div className="blockchain-status-row">
                <div className="status-indicator online"></div>
                <div className="status-text">Synchronisé avec le Mainnet National</div>
              </div>
              <div className="blockchain-stats-mini">
                <div className="mini-stat">
                  <span className="mini-stat-lbl">Dernier Bloc</span>
                  <span className="mini-stat-val">#8,294,021</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-stat-lbl">Temps de réponse</span>
                  <span className="mini-stat-val">12ms</span>
                </div>
              </div>
              <button className="btn-settings-full">Accéder au Node Explorer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageParametres;
