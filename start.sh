#!/bin/bash

# Script de démarrage VTC 3M
echo "🚗 Démarrage de l'application VTC 3M..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js n'est pas installé. Installez Node.js v18+."
  exit 1
fi

echo "✅ Node.js $(node -v) détecté."

# Backend
echo ""
echo "📦 Installation des dépendances backend..."
cd backend
npm install --silent

if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Fichier .env créé depuis .env.example. Configurez vos paramètres avant la production."
fi

echo "🚀 Démarrage du backend (port 5001)..."
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt
sleep 3

# Frontend
echo ""
echo "📦 Installation des dépendances frontend..."
cd ../frontend
npm install --silent

echo "🌐 Démarrage du frontend (port 3000)..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "═══════════════════════════════════════════"
echo "🚗 VTC 3M démarré avec succès !"
echo "═══════════════════════════════════════════"
echo ""
echo "  Frontend  →  http://localhost:3000"
echo "  Backend   →  http://localhost:5001"
echo "  API Santé →  http://localhost:5001/api/health"
echo ""
echo "  Connexion admin :"
echo "  Email    : 3m.services31@gmail.com"
echo "  Mot de passe : voir backend/.env -> ADMIN_PASSWORD"
echo ""
echo "  Appuyez sur Ctrl+C pour arrêter."
echo "═══════════════════════════════════════════"

# Attendre
wait $BACKEND_PID $FRONTEND_PID
