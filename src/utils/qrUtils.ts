/**
 * Utility functions for QR code data handling
 */
import type { Enregistrement } from "../data";

/**
 * Encode a NIU as a simple QR-compatible data string
 */
export function encodeQRData(niu: string): string {
  return `NAISSANCECHAIN:${niu}`;
}

/**
 * Normalizes keys from various formats (shortened, frontend-style, or backend-style)
 * into the standard Enregistrement interface keys.
 */
export function normalizeRecordData(raw: Record<string, unknown>): Partial<Enregistrement> {
  const mapping: Record<string, string> = {
    // Basic
    ln: "nom",
    nomEnfant: "nom",
    fn: "prenom",
    prenomEnfant: "prenom",
    sx: "sexe",
    bd: "date",
    dateNaissance: "date",
    bt: "heure",
    heureNaissance: "heure",
    bp: "lieuPrecis",
    lieuNaissance: "lieuPrecis",
    cm: "commune",
    communeEnfant: "commune",
    pf: "prefecture",
    
    // Père
    fan: "nomPere",
    fa_age: "agePere",
    fa_bp: "lieuNaissancePere",
    fa_job: "professionPere",
    fa_nat: "nationalitePere",
    fa_adr: "domicilePere",
    
    // Mère
    mon: "nomMere",
    mo_age: "ageMere",
    mo_bp: "lieuNaissanceMere",
    mo_job: "professionMere",
    mo_nat: "nationaliteMere",
    mo_adr: "domicileMere",
    
    // Déclarant
    dec_nom: "nomDeclarant",
    dec_lien: "lienDeclarant",
    dec_tel: "telDeclarant",
    dec_id: "pieceDeclarant",
    
    // Témoins
    t1_nom: "nomTemoin1",
    t1_id: "pieceTemoin1",
    t2_nom: "nomTemoin2",
    t2_id: "pieceTemoin2",
    
    // Metadata
    st: "statut",
    an: "agent",
    aid: "agentId",
    ca: "dateCreation",
    h: "hashBlock",
    adr: "lieuPrecis"
  };

  const normalized: Record<string, unknown> = {};
  
  // First, copy all original keys
  Object.keys(raw).forEach(key => {
    normalized[key] = raw[key];
  });

  // Translate status if necessary
  const st = raw.st || raw.statut;
  if (typeof st === 'string') {
    const s = st.toLowerCase();
    if (s.includes("pend") || s.includes("atten")) normalized.statut = "EN ATTENTE";
    if (s.includes("val") || s.includes("ok")) normalized.statut = "VALIDÉ";
    if (s.includes("rej") || s.includes("err")) normalized.statut = "REJETÉ";
  }

  // Then, apply mapping for recognized aliases
  Object.keys(raw).forEach(key => {
    const targetKey = mapping[key];
    if (targetKey) {
      normalized[targetKey] = raw[key];
    }
  });

  return normalized as Partial<Enregistrement>;
}

/**
 * Parse data from QR scan or text
 */
export function parseQRData(raw: string): string | Partial<Enregistrement> | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  
  // Case 1: JSON
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeRecordData(parsed);
    } catch {
      return trimmed;
    }
  }

  // Case 2: Prefix
  if (trimmed.startsWith("NAISSANCECHAIN:")) {
    return trimmed.replace("NAISSANCECHAIN:", "");
  }
  
  // Case 4: Multiline key-value format (fnValue, lnValue, etc.)
  if (trimmed.includes("\n") || trimmed.length > 20) {
    const lines = trimmed.split(/\r?\n/);
    const obj: Record<string, string> = {};
    const keys = ["fn", "ln", "sx", "bd", "bt", "bp", "mon", "fan", "adr", "an", "ca", "st", "id", "h", "v"];
    
    lines.forEach(line => {
      const l = line.trim();
      for (const k of keys) {
        if (l.startsWith(k)) {
          obj[k] = l.substring(k.length).trim();
          break;
        }
      }
    });

    if (Object.keys(obj).length > 2) {
      // If we found multiple fields, treat it as a record
      if (obj.id && !obj.niu) obj.niu = obj.id;
      if (obj.h && !obj.hashBlock) obj.hashBlock = obj.h;
      return normalizeRecordData(obj);
    }
  }
  
  return trimmed || null;
}
