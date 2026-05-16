 # 🇬🇳 NaissanceChain — Système National d'État Civil sur Blockchain
 
https://naissancechain-frontend-1be1.vercel.app/

lien du téléchargement de l’application mobile 
   https://drive.google.com/file/d/1dtA6AEbIA4s9Exs-6wL43T15ggCN_QLf/view?usp=drivesdk



> **Garantir l'authenticité de chaque vie, de la naissance à l'identité numérique.**

NaissanceChain est une solution **GovTech** de pointe conçue pour moderniser l'enregistrement des naissances en République de Guinée. Le système combine la mobilité des applications modernes, la puissance du cloud et l'immuabilité de la blockchain pour éradiquer la falsification des actes de naissance.

---

## 🏗️ Architecture du Système

NaissanceChain repose sur un écosystème à trois piliers :

1.  **📱 NaissanceChain Mobile (APK)** : Pour les agents sur le terrain (hôpitaux, zones rurales). Fonctionne **hors-ligne** avec synchronisation intelligente.
2.  **💻 Portail National (Web)** : Pour l'administration centrale. Gestion des agents, validation des actes et tableaux de bord analytiques.
3.  **⛓️ Registre Immuable (Blockchain)** : La couche de confiance. Stocke les empreintes numériques (hashes) pour une vérification infalsifiable.

---

## 🛠️ Stack Technique

### Backend & Core
- **Runtime** : Node.js (Express)
- **Base de données** : MongoDB Atlas (NoSQL)
- **Sécurité** : JWT (JSON Web Tokens), Helmet, Bcrypt
- **Blockchain Interface** : Ethers.js v6

### Web Portal (Admin)
- **Framework** : React 19 + Vite
- **Langage** : TypeScript
- **Style** : Vanilla CSS / Modern Premium UI
- **Wallet Integration** : MetaMask

### Mobile App (Field Agent)
- **Framework** : React Native / Expo
- **Offline Storage** : SQLite / AsyncStorage
- **Scan** : QR Code integration pour vérification rapide

### Blockchain Layer
- **Langage** : Solidity ^0.8.20
- **Framework** : Hardhat
- **Réseau** : Polygon (Amoy Testnet / Mainnet)
- **Standards** : OpenZeppelin AccessControl & ReentrancyGuard

---

## 🚀 Comment ça fonctionne ? (Le Flux)

### 1. Enregistrement (Terrain)
L'agent de santé saisit les données de naissance sur l'**APK Mobile**. Si le réseau est absent, les données sont stockées localement. Dès que la connexion revient, elles sont synchronisées vers le serveur central.

### 2. Ancrage Blockchain (Backend)
Une fois l'acte reçu :
1.  Le backend calcule un **Hash SHA-256** unique (l'empreinte digitale) à partir des données sensibles (NIU, Nom, Prénom, Date, Parents).
2.  Le serveur signe une transaction et envoie ce Hash sur le **Smart Contract BirthRegistry** sur Polygon.
3.  L'immuabilité de la blockchain garantit que personne, pas même un administrateur système, ne peut modifier les détails de l'acte sans briser la correspondance du hash.

### 3. Vérification (Publique)
N'importe quelle entité (ambassade, école, banque) peut vérifier un acte :
1.  Scannez le QR Code de l'acte.
2.  Le système recalcule le hash en temps réel et le compare à celui stocké sur la blockchain.
3.  **Verdict** : 
    - ✅ **Authentique** : Les données correspondent parfaitement.
    - ❌ **Falsifié** : Une seule lettre a été modifiée.
    - 🚫 **Révoqué** : L'acte a été annulé par les autorités.

---

## 📂 Structure du Projet

```bash
.
├── 📂 backend         # API REST Node.js & Logique métier
│   ├── 📂 blockchain  # Service d'intégration Ethers.js & ABI
│   └── 📂 models      # Schémas Mongoose (MongoDB)
├── 📂 blockchaine     # Environnement de développement Smart Contracts
│   ├── 📂 contracts   # BirthRegistry.sol
│   ├── 📂 scripts     # Scripts de déploiement
│   └── 📂 test        # Tests unitaires complets
├── 📂 src             # Portail Web React (Frontend)
│   ├── 📂 blockchain  # Service MetaMask & Intégration contrat
│   └── 📂 components  # UI Components
└── 📂 mobile          # Application React Native (Expo)
```

---

## ⚙️ Installation & Déploiement

### 1. Blockchain (Hardhat)
```bash
cd blockchaine
npm install
npx hardhat node                       # Lancer un nœud local
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Backend (Serveur)
```bash
cd backend
npm install
# Configurez le .env avec votre MONGODB_URI et CONTRACT_ADDRESS
npm run dev
```

### 3. Frontend (Portail Web)
```bash
npm install
npm run dev
```

---

## 🛡️ Sécurité & Gouvernance

- **Zéro Donnée Personnelle On-Chain** : Seuls les hashes et les NIU sont stockés sur la blockchain pour respecter la confidentialité (RGPD / Protection des données).
- **Contrôle d'Accès (RBAC)** : Seuls les agents habilités (`REGISTRAR_ROLE`) peuvent enregistrer des actes. Seul le Ministère (`DEFAULT_ADMIN_ROLE`) peut révoquer des actes.
- **Auditabilité** : Chaque action est horodatée par la blockchain et liée à l'adresse Ethereum de l'officier responsable.

---

## 👥 Équipe & Vision

NaissanceChain est plus qu'un projet technique, c'est une infrastructure de confiance pour la nation. Notre vision est d'assurer que chaque enfant né en Guinée possède une preuve d'existence infalsifiable, ouvrant la porte à tous ses droits civiques.

---
*Développé avec passion pour le futur de la Guinée.* 🇬🇳✨
