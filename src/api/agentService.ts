import apiClient from "./axios";
import type { Agent } from "../data";

export const agentService = {
  /**
   * Fetch all agents from the system
   */
  getAll: async (): Promise<Agent[]> => {
    const response = await apiClient.get<Agent[]>("/agents");
    return response.data;
  },

  /**
   * Fetch a single agent by ID
   */
  getById: async (id: string): Promise<Agent> => {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  /**
   * Create a new agent profile
   */
  create: async (data: Omit<Agent, "id" | "dateEntree" | "enregistrements">): Promise<Agent> => {
    const response = await apiClient.post<Agent>("/agents", data);
    return response.data;
  },

  /**
   * Update agent status (Active/Inactive)
   */
  updateStatus: async (id: string, statut: "ACTIF" | "INACTIF"): Promise<Agent> => {
    const response = await apiClient.patch<Agent>(`/agents/${id}`, { statut });
    return response.data;
  }
};
