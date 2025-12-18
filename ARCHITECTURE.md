# Architecture de l'Application Seller Gest

Ce document décrit le fonctionnement technique et fonctionnel de l'application via des schémas Mermaid.

## 1. Architecture Système

L'application suit une architecture Client-Serveur classique.

```mermaid
graph TD
    subgraph Frontend [Client - Frontend]
        UI[Interface Utilisateur - Vite/TS/CSS]
        Router[Router.ts - Navigation]
        Store[State.ts - Gestion d'état]
        API_Client[API.ts - Fetch Client]
    end

    subgraph Backend [Serveur - Backend]
        Server[Express Server]
        Auth[Middleware Auth - JWT]
        Routes[Routes Express]
        Models[Sequelize Models]
    end

    subgraph Database [Données]
        DB[(SQLite/PostgreSQL)]
    end

    UI <--> Router
    UI <--> Store
    Store <--> API_Client
    API_Client <--> Server
    Server <--> Auth
    Auth <--> Routes
    Routes <--> Models
    Models <--> DB
```

---

## 2. Hiérarchie des Rôles

La gestion des utilisateurs est basée sur trois niveaux de privilèges.

```mermaid
graph TD
    SA[SUPER_ADMIN] --> M[MANAGER]
    M --> S[SELLER]

    subgraph "Pouvoirs Super Admin"
        SA1[Créer/Modifier Managers]
        SA2[Vue globale des stats]
    end

    subgraph "Pouvoirs Manager"
        M1[Créer/Gérer Vendeurs]
        M2[Ajouter/Assigner Produits]
        M3[Fixer les commissions]
    end

    subgraph "Actions Vendeur"
        S1[Voir produits assignés]
        S2[Marquer comme vendu]
        S3[Voir sa balance/commission]
    end

    SA -.-> SA1 & SA2
    M -.-> M1 & M2 & M3
    S -.-> S1 & S2 & S3
```

---

## 3. Flux Logique d'une Vente

Cheminement d'un produit depuis son ajout jusqu'à la rémunération.

```mermaid
stateDiagram-v2
    [*] --> Stock : Produit créé par Manager
    Stock --> Assigne : Assignation à un Vendeur
    Assigne --> EnVente : Activation par le Vendeur
    EnVente --> Vendu : Mark as Sold
    Vendu --> PaiementEnAttente : Transaction calculée
    PaiementEnAttente --> Paye : Manager valide le paiement
    Paye --> [*]

    note right of Vendu
        Calcul automatique :
        - Commission Vendeur
        - Marge Manager
    end note
```

---

## 4. Modèle de Données (ER Simplified)

Relations entre les principales entités de la base de données.

```mermaid
erDiagram
    USER ||--|| MANAGER : "est un (si role=MANAGER)"
    USER ||--|| SELLER : "est un (si role=SELLER)"
    MANAGER ||--o{ SELLER : "gère"
    MANAGER ||--o{ PRODUCT : "crée/possède"
    SELLER ||--o{ PRODUCT_ASSIGNMENT : "reçoit"
    PRODUCT ||--o{ PRODUCT_ASSIGNMENT : "est assigné"
    PRODUCT_ASSIGNMENT ||--o| SALE : "génère une"
    MANAGER ||--o{ SALE : "reçoit part"
    SELLER ||--o{ SALE : "reçoit commission"

    USER {
        int id
        string email
        string role
    }

    PRODUCT {
        int id
        string title
        decimal base_price
        int stock
    }

    SALE {
        int id
        decimal product_price
        decimal seller_commission
        string status
    }
```
