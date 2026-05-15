/**
 * blockchainService.ts — Intégration MetaMask / Ethers.js (Frontend)
 * ====================================================================
 * Ce service gère la connexion MetaMask et la vérification publique
 * des actes de naissance directement depuis le navigateur.
 *
 * USAGE :
 * ───────
 *  - Connexion MetaMask          → connectWallet()
 *  - Vérification d'un acte     → verifyBirth(niu, docHash)
 *  - Enregistrement (Admin)     → registerBirth(niu, docHash)
 *  - Vérification via le backend → verifyViaBackend(niu)
 */

import { ethers, BrowserProvider, Contract, type Signer } from "ethers";
import BirthRegistryArtifact from "./BirthRegistry.json";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WalletState {
  address   : string;
  chainId   : number;
  chainName : string;
  isRegistrar : boolean;
  isAdmin   : boolean;
}

export interface VerificationResult {
  niu         : string;
  isAuthentic : boolean;
  isValid     : boolean;
  timestamp   : string | null;
  registrar   : string | null;
  txHash      : string | null;
  message     : string;
  source      : "blockchain" | "backend" | "error";
}

// ── Configuration réseau ──────────────────────────────────────────────────

const SUPPORTED_CHAINS: Record<number, string> = {
  31337  : "Hardhat Local",
  80002  : "Polygon Amoy Testnet",
  137    : "Polygon Mainnet",
};

// ── Classe principale ─────────────────────────────────────────────────────

class BlockchainFrontendService {
  private provider : BrowserProvider | null = null;
  private signer   : Signer | null = null;
  private contract : Contract | null = null;

  // ── Connexion MetaMask ───────────────────────────────────────────────────

  /**
   * Demande la connexion MetaMask et retourne l'état du wallet.
   */
  async connectWallet(): Promise<WalletState> {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask non détecté. Installez l'extension MetaMask pour continuer."
      );
    }

    this.provider = new BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);

    this.signer = await this.provider.getSigner();
    const address = await this.signer.getAddress();
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    // Vérifier que le réseau est supporté
    if (!SUPPORTED_CHAINS[chainId]) {
      throw new Error(
        `Réseau non supporté (Chain ID: ${chainId}). ` +
        `Connectez-vous à Polygon Amoy ou Polygon Mainnet.`
      );
    }

    // Initialiser le contrat en lecture/écriture
    this._initContract(this.signer);

    // Vérifier les rôles de l'utilisateur
    const [isRegistrar, isAdmin] = await Promise.all([
      this._checkRole("REGISTRAR_ROLE", address),
      this._checkRole("DEFAULT_ADMIN_ROLE", address),
    ]);

    return {
      address,
      chainId,
      chainName : SUPPORTED_CHAINS[chainId],
      isRegistrar,
      isAdmin,
    };
  }

  /**
   * Connexion en lecture seule (sans MetaMask) pour la vérification publique.
   */
  async connectReadOnly(): Promise<void> {
    const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
    if (window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum as any);
    }

    const readOnlyProvider = new ethers.JsonRpcProvider(rpcUrl);
    this._initContract(readOnlyProvider);
  }

  // ── Initialisation du contrat ────────────────────────────────────────────

  private _initContract(signerOrProvider: Signer | ethers.JsonRpcProvider | ethers.AbstractProvider) {
    const address = import.meta.env.VITE_CONTRACT_ADDRESS || BirthRegistryArtifact.address;
    if (!address) {
      console.warn("⚠️  VITE_CONTRACT_ADDRESS non défini. Définissez-le dans .env");
      return;
    }
    this.contract = new Contract(address, BirthRegistryArtifact.abi, signerOrProvider);
  }

  private async _checkRole(roleKey: string, address: string): Promise<boolean> {
    if (!this.contract) return false;
    try {
      const roleHash = ethers.keccak256(ethers.toUtf8Bytes(roleKey));
      return await this.contract.hasRole(roleHash, address);
    } catch {
      return false;
    }
  }

  // ── Vérification publique (lecture, sans signature) ───────────────────────

  /**
   * Vérifie l'authenticité d'un acte directement sur la blockchain.
   * Utilisation : citoyens, ambassades, vérificateurs externes.
   *
   * @param niu      - NIU de l'acte (ex: "123456-GU-2026")
   * @param docHash  - Hash SHA-256 du document (calculé par le backend ou fourni)
   */
  async verifyBirth(niu: string, docHash: string): Promise<VerificationResult> {
    if (!this.contract) {
      await this.connectReadOnly().catch(() => {});
    }

    if (!this.contract) {
      return this._errorResult(niu, "Contrat blockchain non initialisé.");
    }

    try {
      const [isAuthentic, isValid, timestamp, registrar] =
        await this.contract.verifyBirth(niu, docHash);

      return {
        niu,
        isAuthentic,
        isValid,
        timestamp   : timestamp > 0n
          ? new Date(Number(timestamp) * 1000).toLocaleString("fr-GN")
          : null,
        registrar   : registrar !== ethers.ZeroAddress ? registrar : null,
        txHash      : null,
        source      : "blockchain",
        message     : isAuthentic
          ? "✅ Acte authentique — intégrité vérifiée sur la blockchain."
          : isValid === false && timestamp === 0n
            ? "❌ Acte introuvable sur la blockchain."
            : "❌ Acte révoqué ou document modifié.",
      };
    } catch (err: unknown) {
      const error = err as Error;
      return this._errorResult(niu, error.message);
    }
  }

  // ── Enregistrement via MetaMask (agents officiels) ──────────────────────

  /**
   * Enregistre un acte sur la blockchain via MetaMask.
   * Réservé aux agents avec REGISTRAR_ROLE.
   *
   * NOTE : En production, cette action est effectuée par le backend.
   * Ce service permet aux agents de signer manuellement via MetaMask
   * (ex : mode offline ou confirmation administrative double).
   *
   * @param niu      - NIU de l'acte
   * @param docHash  - Hash SHA-256 du document
   */
  async registerBirth(niu: string, docHash: string): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.signer || !this.contract) {
      throw new Error("MetaMask non connecté. Appelez connectWallet() d'abord.");
    }

    // Vérifier que l'utilisateur est un registrar
    const address = await this.signer.getAddress();
    const isRegistrar = await this._checkRole("REGISTRAR_ROLE", address);
    if (!isRegistrar) {
      throw new Error("Accès refusé : vous n'êtes pas un agent officiel habilité.");
    }

    // Vérifier que l'acte n'existe pas déjà
    const exists = await this.contract.birthExists(niu);
    if (exists) {
      throw new Error(`L'acte ${niu} est déjà enregistré sur la blockchain.`);
    }

    // Envoyer la transaction via MetaMask
    const tx = await this.contract.registerBirth(niu, docHash);
    console.log(`📤 Transaction envoyée : ${tx.hash}`);

    const receipt = await tx.wait(1);
    console.log(`✅ Confirmé au bloc #${receipt.blockNumber}`);

    return {
      txHash      : receipt.hash,
      blockNumber : receipt.blockNumber,
    };
  }

  // ── Vérification via API backend (recommandé pour le frontend) ───────────

  /**
   * Vérifie un acte via l'API backend (plus simple, sans calcul de hash côté client).
   * Le backend recalcule le hash et interroge la blockchain.
   *
   * @param niu - NIU de l'acte à vérifier
   */
  async verifyViaBackend(niu: string): Promise<VerificationResult> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${apiUrl}/verify/${niu}`);
      const data = await response.json();

      if (response.status === 404) {
        return this._errorResult(niu, "Acte non trouvé dans la base de données.");
      }

      return {
        niu,
        isAuthentic : data.isAuthentic,
        isValid     : data.isValid,
        timestamp   : data.chainTimestamp
          ? new Date(data.chainTimestamp).toLocaleString("fr-GN")
          : data.registeredAt
            ? new Date(data.registeredAt).toLocaleString("fr-GN")
            : null,
        registrar   : data.registrar || null,
        txHash      : data.blockchainTxHash || null,
        source      : "backend",
        message     : data.message || (data.isAuthentic ? "✅ Acte authentique." : "❌ Acte invalide."),
      };
    } catch (err: unknown) {
      const error = err as Error;
      return this._errorResult(niu, `Erreur API : ${error.message}`);
    }
  }

  // ── Utilitaires ──────────────────────────────────────────────────────────

  /**
   * Écoute les changements de compte MetaMask.
   */
  onAccountChange(callback: (accounts: string[]) => void): void {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", callback as any);
    }
  }

  /**
   * Écoute les changements de réseau MetaMask.
   */
  onChainChange(callback: () => void): void {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload(); // Recommandé par MetaMask
        callback();
      });
    }
  }

  /**
   * Formate une adresse Ethereum pour l'affichage.
   */
  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Retourne un lien Polygonscan pour une transaction.
   */
  getExplorerLink(txHash: string, chainId = 80002): string {
    const explorers: Record<number, string> = {
      80002 : `https://amoy.polygonscan.com/tx/${txHash}`,
      137   : `https://polygonscan.com/tx/${txHash}`,
      31337 : `#local-${txHash}`,
    };
    return explorers[chainId] || `https://polygonscan.com/tx/${txHash}`;
  }

  private _errorResult(niu: string, message: string): VerificationResult {
    return {
      niu,
      isAuthentic : false,
      isValid     : false,
      timestamp   : null,
      registrar   : null,
      txHash      : null,
      source      : "error",
      message     : `❌ ${message}`,
    };
  }
}

// Singleton exporté
export const blockchainFrontend = new BlockchainFrontendService();

// Déclaration TypeScript pour window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
