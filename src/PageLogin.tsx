import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import './pages.css';

export default function PageLogin({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      onNavigate('portail'); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

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
              La plateforme souveraine de gestion de l'état civil en République de Guinée. 
              Sécurisé par la blockchain, accessible à tous.
            </p>
            <div className="auth-branding-footer">
              <span>© 2026 État Civil Guinéen</span>
              <span>Propulsé par Sovereign Ledger</span>
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
              <h2 className="auth-form-title">Bon retour</h2>
              <p className="auth-form-subtitle">Connectez-vous à votre espace structure</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error-message">{error}</div>}
              
              <div className="auth-input-group">
                <label>Adresse Email Professionnelle</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">✉</span>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@etatcivil.gn"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="auth-form-options">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <a href="#" className="auth-forgot-link">Mot de passe oublié ?</a>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-loader"></span>
                ) : (
                  <>Se connecter <span className="btn-arrow">→</span></>
                )}
              </button>
            </form>

            <div className="auth-footer-link">
              Pas encore de compte ? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('register'); }}>Créer un espace structure</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
