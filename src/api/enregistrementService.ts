import apiClient from "./axios";
import type { Enregistrement } from "../data";
import { syncService } from "./syncService";

export const enregistrementService = {
  /**
   * Fetch all birth records from the blockchain/database
   */
  getAll: async (): Promise<Enregistrement[]> => {
    try {
      const response = await apiClient.get<Enregistrement[]>("/enregistrements");
      // Cache data for offline use
      syncService.cacheRecords(response.data);
      return response.data;
    } catch {
      console.warn("Backend unreachable, returning cached data.");
      return syncService.getCachedRecords();
    }
  },

  /**
   * Fetch a single record by its NIU (Numéro d'Identifiant Unique)
   */
  getByNiu: async (niu: string): Promise<Enregistrement> => {
    try {
      const response = await apiClient.get<Enregistrement>(`/enregistrements/${niu}`);
      return response.data;
    } catch (err) {
      // Look in cache if offline
      const cached = syncService.getCachedRecords();
      const record = cached.find((r: Enregistrement) => r.niu === niu);
      if (record) return record;
      throw err;
    }
  },

  /**
   * Create a new birth record
   */
  create: async (data: Omit<Enregistrement, "hashBlock" | "dateCreation">): Promise<Enregistrement> => {
    try {
      const response = await apiClient.post<Enregistrement>("/enregistrements", data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: unknown, code?: string };
      if (!error.response || error.code === "ERR_NETWORK" || !navigator.onLine) {
        console.log("Offline detected, saving to sync queue...");
        syncService.addToQueue(data);
        
        // Return a mock object to satisfy the UI
        return {
          ...data,
          niu: "SYNC-PENDING",
          dateCreation: new Date().toISOString(),
          hashBlock: "local-only"
        } as Enregistrement;
      }
      throw err;
    }
  },

  /**
   * Search for records by query string
   */
  search: async (query: string): Promise<Enregistrement[]> => {
    try {
      const response = await apiClient.get<Enregistrement[]>("/enregistrements/search", {
        params: { q: query },
      });
      return response.data;
    } catch {
      const cached = syncService.getCachedRecords();
      return cached.filter((r: Enregistrement) => 
        r.nom.toLowerCase().includes(query.toLowerCase()) || 
        r.prenom.toLowerCase().includes(query.toLowerCase()) ||
        r.niu?.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  /**
   * Get statistics for the dashboard
   */
  getStats: async () => {
    try {
      const response = await apiClient.get("/enregistrements/stats");
      return response.data;
    } catch {
      const cached = syncService.getCachedRecords();
      return {
        total: cached.length,
        valide: cached.filter((r: Enregistrement) => r.statut === "VALIDÉ").length,
        attente: cached.filter((r: Enregistrement) => r.statut === "EN ATTENTE").length,
        rejete: cached.filter((r: Enregistrement) => r.statut === "REJETÉ").length,
      };
    }
  },

  /**
   * Update record status (Requires NATIONAL_PORTAL role)
   */
  updateStatus: async (niu: string, statut: 'VALIDÉ' | 'REJETÉ'): Promise<Enregistrement> => {
    const response = await apiClient.patch<Enregistrement>(`/enregistrements/${niu}/status`, { statut });
    return response.data;
  }
};
