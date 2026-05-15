import apiClient from "./axios";
import type { Prefecture } from "../data";

export const prefectureService = {
  /**
   * Fetch all prefectures and their statistics
   */
  getAll: async (): Promise<Prefecture[]> => {
    const response = await apiClient.get<Prefecture[]>("/prefectures");
    return response.data;
  },

  /**
   * Get specific statistics for a prefecture
   */
  getStats: async (nom: string) => {
    const response = await apiClient.get(`/prefectures/${nom}/stats`);
    return response.data;
  }
};
