import { useState } from 'react';
import { authService } from './api/authService';
import './pages.css';

export default function PageRegister({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'LOCAL_STRUCTURE',
    structureName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(formData);
      setSuccess(true);
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-split-container">
          <div className="auth-branding-side">
            <div className="auth-branding-overlay"></div>
            <div className="auth-branding-content">
              <div className="auth-logo-large">◆</div>
              <h1 className="auth-branding-title">NaissanceChain</h1>
            </div>
          </div>
          <div className="auth-form-side">
            <div className="auth-form-container" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
              <h2 className="auth-form-title">Compte créé !</h2>
              <p className="auth-form-subtitle">Bienvenue dans le réseau national. Vous allez être redirigé...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-container">
        {/* Left Side: Branding/Visual */}
        <div className="auth-branding-side">
          <div className="auth-branding-overlay"></div>
          <div className="auth-branding-content">
            <div className="auth-logo-large">◆</div>
            <h1 className="auth-branding-title">NaissanceChain</h1>
            <p className="auth-branding-text">
              Rejoignez le réseau national de l'état civil. 
              Une plateforme moderne pour une administration transparente et efficace.
            </p>
            <div className="auth-branding-footer">
              <span>© 2026 État Civil Guinéen</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <button className="auth-back-home" onClick={() => onNavigate('home')}>
              ← Retour à l'accueil
            </button>
            
            <div className="auth-form-header">
              <h2 className="auth-form-title">Nouvelle Structure</h2>
              <p className="auth-form-subtitle">Enregistrez votre institution sur la plateforme</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error-message">{error}</div>}
              
              <div className="auth-input-group">
                <label>Type de structure</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🏢</span>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="LOCAL_STRUCTURE">Structure Locale (École, Hôpital...)</option>
                    <option value="NATIONAL_PORTAL">Portail National (Admin État Civil)</option>
                  </select>
                </div>
              </div>

              <div className="auth-input-group">
                <label>Nom de la structure</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🏷️</span>
                  <input 
                    type="text" 
                    required
                    value={formData.structureName}
                    onChange={(e) => setFormData({...formData, structureName: e.target.value})}
                    placeholder="Ex: Hôpital Ignace Deen"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Adresse Email Professionnelle</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">✉</span>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@structure.gn"
                  />
                </div>
              </div>
              
              <div className="auth-input-group">
                <label>Mot de passe</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔒</span>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '1rem' }}>
                {loading ? (
                  <span className="auth-loader"></span>
                ) : (
                  <>Créer mon compte <span className="btn-arrow">→</span></>
                )}
              </button>
            </form>

            <div className="auth-footer-link">
              Déjà inscrit ? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Se connecter</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
