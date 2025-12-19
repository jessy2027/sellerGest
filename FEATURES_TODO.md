# 📋 Fonctionnalités à Implémenter - Seller Gest

Ce document liste les fonctionnalités restant à développer pour l'application Seller Gest.

---

## 🔴 Priorité Haute

### 📸 Upload d'images
- **État actuel** : Le champ `photos_original` existe dans le modèle Product mais aucun système d'upload n'est implémenté
- **À faire** :
  - Backend : API d'upload avec Multer
  - Stockage : Local ou Cloud (S3, Cloudinary)
  - Frontend : Composant d'upload avec preview

### 💬 Système de Chat
- **Description** : Communication en temps réel entre Manager et Vendeurs
- **À faire** :
  - Backend : WebSocket avec Socket.io
  - Modèles : Message, Conversation
  - Frontend : Interface de chat intégrée
  - Fonctionnalités : Messages texte, indicateur de lecture, historique

### 🔔 Système de Notifications
- **Description** : Alertes pour les événements importants
- **Événements à notifier** :
  - Nouvelle assignation de produit
  - Produit vendu
  - Paiement reçu/effectué
  - Nouveau message chat
- **À faire** :
  - Backend : Modèle Notification, routes API
  - Frontend : Centre de notifications, badges

### 📱 Notifications Push
- **Description** : Notifications browser/mobile
- **À faire** :
  - Service Worker pour Web Push
  - Intégration Firebase Cloud Messaging (optionnel)

---

## 🟡 Priorité Moyenne

### 🖼️ Galerie Produits
- **Description** : Affichage des photos produits
- **À faire** :
  - Carousel/Slider d'images
  - Lightbox pour vue agrandie
  - Zoom au survol

### 📊 Rapports et Export
- **Description** : Export des données et statistiques
- **À faire** :
  - Export CSV des ventes
  - Export PDF des rapports
  - Statistiques par période (jour/semaine/mois)
  - Graphiques comparatifs

### 🔍 Recherche et Filtres Avancés
- **Description** : Recherche performante sur toutes les entités
- **À faire** :
  - Recherche full-text sur produits
  - Filtres par : date, statut, catégorie, vendeur
  - Tri multi-colonnes
  - Pagination côté serveur

### 📧 Système d'Emails
- **Description** : Emails transactionnels
- **À faire** :
  - Intégration Nodemailer/SendGrid
  - Templates emails (HTML)
  - Emails : confirmation inscription, notification vente, récapitulatif hebdo

### 🔒 Récupération de Mot de Passe
- **Description** : Reset password sécurisé
- **À faire** :
  - Route "mot de passe oublié"
  - Génération token temporaire
  - Email avec lien de reset
  - Page de réinitialisation

### 👤 Gestion du Profil Utilisateur
- **Description** : Modification des informations personnelles
- **À faire** :
  - Page profil éditable
  - Upload d'avatar
  - Changement de mot de passe
  - Préférences utilisateur

---

## 🟢 Priorité Basse / Nice-to-have

### 📈 Dashboard Amélioré
- Graphiques interactifs (Chart.js / ApexCharts)
- Tendances de ventes sur période
- Comparaison mois/mois
- KPIs visuels

### 📅 Historique et Audit Trail
- Journal d'activité complet
- Qui a fait quoi et quand
- Export de l'historique

### 🏷️ Gestion des Catégories
- CRUD complet pour catégories
- Catégories hiérarchiques
- Icônes/couleurs par catégorie

### 💳 Intégration Paiement
- Stripe ou PayPal
- Paiements automatiques Manager → Vendeur
- Historique des transactions

### 🌍 Multi-langue (i18n)
- Support FR/EN minimum
- Fichiers de traduction JSON
- Sélecteur de langue

### 📱 PWA / Application Mobile
- Progressive Web App installable
- Ou : Application React Native
- Mode hors-ligne

### 🔗 Intégration Vinted
- Import profil Vinted
- Synchronisation d'annonces
- Scraping ou API (si disponible)

### 📦 Gestion des Retours
- Statut "retourné" pour produits
- Workflow de retour
- Remboursement commission

### ⭐ Système d'Évaluation
- Notes sur les vendeurs
- Commentaires/avis
- Score de fiabilité

---

## 📝 Notes Techniques

### Stack Actuelle
- **Backend** : Node.js + Express + Sequelize + SQLite
- **Frontend** : Vite + TypeScript + CSS
- **Auth** : JWT

### Prérequis pour les nouvelles fonctionnalités
| Fonctionnalité | Dépendances à ajouter |
|----------------|----------------------|
| Upload images | `multer`, `sharp` (resize) |
| Chat temps réel | `socket.io`, `socket.io-client` |
| Emails | `nodemailer`, `@sendgrid/mail` |
| Push notifications | `web-push` |
| Export PDF | `pdfkit` ou `puppeteer` |
| Graphiques | `chart.js` ou `apexcharts` |

---

*Dernière mise à jour : 19 décembre 2024*
