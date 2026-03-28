# 🚗 VTC 3M – Application de gestion de transport

Application web complète pour chauffeurs VTC : vitrine entreprise, formulaire de réservation en ligne, notifications automatiques, génération de PDF et tableau de bord chauffeur.

---

## 📋 Fonctionnalités

- **Accueil** : Vitrine entreprise, services, témoignages, contact
- **Réservation** : Formulaire client avec validation, notification email/SMS, génération PDF automatique
- **Tableau de bord chauffeur** : Liste des réservations, statistiques, validation de courses, facture PDF
- **Auth sécurisée** : JWT, bcrypt, rate limiting, helmet

---

## 🛠️ Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | React 18 + Vite + CSS custom |
| Backend | Node.js + Express |
| Base de données | SQLite (via Sequelize ORM) |
| PDF | PDFKit |
| Email | Nodemailer (SMTP) |
| SMS | Twilio |
| Auth | JWT + bcrypt |
| Logs | Winston |

---

## 🚀 Installation et démarrage

### Prérequis
- Node.js v18+
- npm v9+

### 1. Cloner / accéder au projet
```bash
cd VTC_3M
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Éditez .env avec vos paramètres (email, Twilio, etc.)
npm run dev
```
Le serveur démarre sur **http://localhost:5000**

**Compte admin créé automatiquement au premier démarrage :**
- Email : `admin@vtc3m.fr`
- Mot de passe : `Admin2024!`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
L'application est accessible sur **http://localhost:3000**

---

## ⚙️ Configuration (.env)

```env
# Obligatoire
JWT_SECRET=votre_secret_tres_long_et_securise

# Email (choisissez un fournisseur SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre@gmail.com
EMAIL_PASS=votre_app_password   # Mot de passe d'application Google
ADMIN_EMAIL=chauffeur@email.fr

# SMS Twilio (optionnel – désactivable)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+33xxxxxxxx
ADMIN_PHONE=+33xxxxxxxx

# Entreprise (apparaît dans les PDFs)
COMPANY_NAME=VTC 3M
COMPANY_ADDRESS=123 Rue exemple, 75001 Paris
COMPANY_PHONE=+33 6 XX XX XX XX
COMPANY_EMAIL=contact@vtc3m.fr
COMPANY_SIRET=XXX XXX XXX XXXXX
```

### Configuration Gmail
1. Activer la validation en 2 étapes sur votre compte Google
2. Générer un "Mot de passe d'application" (Google Account → Sécurité → Mots de passe d'application)
3. Utiliser ce mot de passe dans `EMAIL_PASS`

---

## 📁 Structure du projet

```
VTC_3M/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Logique métier
│   │   ├── middleware/      # Auth, logger
│   │   ├── models/          # Modèles Sequelize (SQLite)
│   │   ├── routes/          # Routes API Express
│   │   ├── services/        # Email, SMS, PDF
│   │   └── index.js         # Point d'entrée
│   ├── logs/                # Fichiers de logs
│   ├── pdfs/                # PDFs générés
│   ├── database.sqlite      # Base de données (auto-créée)
│   └── .env
└── frontend/
    └── src/
        ├── components/      # Navbar, Footer
        ├── pages/           # Home, Reservation, Login, Dashboard
        ├── services/        # API client, auth context
        └── styles/          # CSS global
```

---

## 🔐 Sécurité & RGPD

- Mots de passe hashés avec bcrypt (12 rounds)
- Tokens JWT avec expiration (8h)
- Rate limiting sur toutes les routes API
- Helmet pour les headers HTTP sécurisés
- Validation des données côté client ET serveur
- Consentement RGPD obligatoire dans le formulaire
- Logs de toutes les actions critiques (connexion, réservation, validation)
- CORS restreint au domaine frontend

---

## 📄 API Endpoints

### Public
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/reservations` | Créer une réservation |

### Protégées (Bearer token requis)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/auth/me` | Profil chauffeur |
| POST | `/api/auth/login` | Connexion |
| PUT | `/api/auth/change-password` | Changer mdp |
| GET | `/api/reservations` | Liste avec filtres |
| GET | `/api/reservations/:id` | Détail |
| PUT | `/api/reservations/:id/status` | Mettre à jour statut |
| PUT | `/api/reservations/:id/complete` | Valider course + prix |
| GET | `/api/reservations/:id/pdf-reservation` | Télécharger bon |
| GET | `/api/reservations/:id/pdf-invoice` | Télécharger facture |
| GET | `/api/stats` | Statistiques |

---

## 📦 Production

```bash
# Backend
cd backend && npm start

# Frontend (build statique)
cd frontend && npm run build
# Servir le dossier dist/ avec nginx ou un CDN
```

---

## 🐛 Dépannage

**Email non envoyé :** Vérifiez `EMAIL_USER` et `EMAIL_PASS` dans `.env`. Utilisez un mot de passe d'application Gmail.

**SMS non envoyé :** Les SMS se désactivent automatiquement si les clés Twilio ne sont pas renseignées. Ce n'est pas bloquant.

**Port déjà utilisé :** Changez `PORT=5001` dans `.env` et mettez à jour le proxy dans `frontend/vite.config.js`.

---

## 📞 Support

Pour toute question technique, consultez les logs dans `backend/logs/combined.log`.
