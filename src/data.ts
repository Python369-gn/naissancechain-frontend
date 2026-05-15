/**
 * Core Data Models for NaissanceChain
 */

export interface Enregistrement {
  _id?: string;
  niu: string;
  nom: string;
  prenom: string;
  sexe: string;
  date: string;
  heure: string;
  prefecture: string;
  commune: string;
  lieuPrecis: string;
  statut: "VALIDÉ" | "EN ATTENTE" | "REJETÉ";
  agent: string;
  agentId: string;
  hashBlock: string;
  dateCreation: string;

  // Père
  nomPere: string;

  // Mère
  nomMere: string;
}

export interface Agent {
  _id?: string;
  id?: string;
  nom: string;
  prenom: string;
  matricule?: string;
  prefecture: string;
  commune?: string;
  role?: "OFFICIER" | "ADMIN";
  statut: "ACTIF" | "INACTIF";
  totalActes?: number;
  derniereActivite?: string;
  avatar?: string;
  grade?: string;
  enregistrements?: number;
  tel?: string;
  email?: string;
  dateEntree?: string;
}

export interface Prefecture {
  id?: string;
  nom: string;
  region?: string;
  population?: number;
  totalActes?: number;
  couverture?: number;
  enregistrements?: number;
  agents?: number;
  tendance?: number;
  couleur?: string;
}
