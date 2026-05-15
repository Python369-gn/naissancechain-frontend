import { useState, createContext, useContext, useEffect } from "react";
import NaissanceChain from "./NaissanceChain";
import PortailNational from "./PortailNational";
import FormulaireEnregistrement from "./FormulaireEnregistrement";
import PageLogin from "./PageLogin";
import PageRegister from "./PageRegister";
import PortailVerification from "./PortailVerification";
import { syncService } from "./api/syncService";
import { useAuth } from "./context/AuthContext";

export type AppView = "home" | "portail" | "enregistrement" | "verification-portail" | "login" | "register";

interface AppContextType {
  view: AppView;
  setView: (v: AppView) => void;
}

export const AppContext = createContext<AppContextType>({
  view: "home",
  setView: () => { },
});

export const useApp = () => useContext(AppContext);

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const getInitialView = (): AppView => {
    const hash = window.location.hash.replace('#', '');
    const validViews = ["home", "portail", "enregistrement", "verification-portail", "login", "register"];
    return validViews.includes(hash) ? (hash as AppView) : "home";
  };

  const [view, setViewRaw] = useState<AppView>(getInitialView());

  const setView = (v: AppView) => {
    if (view !== v) {
      window.history.pushState(null, '', `#${v}`);
      setViewRaw(v);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setViewRaw(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize sync service on mount
  useEffect(() => {
    syncService.init();
  }, []);

  // Protected route logic
  useEffect(() => {
    if (view === "portail" || view === "verification-portail") {
      if (!isAuthenticated) {
        setView("login");
      }
    }
  }, [view, isAuthenticated]);

  return (
    <AppContext.Provider value={{ view, setView }}>
      {view === "home" && <NaissanceChain />}
      {view === "login" && <PageLogin onNavigate={setView} />}
      {view === "register" && <PageRegister onNavigate={setView} />}
      {view === "portail" && isAuthenticated && user?.role === "NATIONAL_PORTAL" && <PortailNational />}
      {view === "portail" && isAuthenticated && user?.role !== "NATIONAL_PORTAL" && <PortailVerification />}
      {view === "enregistrement" && <FormulaireEnregistrement />}
      {view === "verification-portail" && isAuthenticated && <PortailVerification />}
    </AppContext.Provider>
  );
}