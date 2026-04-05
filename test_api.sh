#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  3M Drive — Script de test API complet
#  Usage : bash test_api.sh
#  Prérequis : backend en cours d'exécution sur port 5001
# ═══════════════════════════════════════════════════════════

BASE="http://localhost:5001/api"
PASS=0
FAIL=0

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC} — $label"
    PASS=$((PASS+1))
  else
    echo -e "${RED}❌ FAIL${NC} — $label"
    echo -e "   Attendu : ${YELLOW}$expected${NC}"
    echo -e "   Reçu    : ${YELLOW}$(echo "$actual" | head -c 200)${NC}"
    FAIL=$((FAIL+1))
  fi
}

section() {
  echo ""
  echo -e "${BLUE}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ── Lire les credentials depuis .env ────────────────────────
ENV_FILE="$(dirname "$0")/backend/.env"
ADMIN_EMAIL=$(grep "^ADMIN_LOGIN_EMAIL" "$ENV_FILE" | cut -d= -f2)
ADMIN_PASS=$(grep "^ADMIN_PASSWORD" "$ENV_FILE" | cut -d= -f2)

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   3M Drive — Tests API automatisés   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""
echo "  Backend    : $BASE"
echo "  Admin      : $ADMIN_EMAIL"
echo ""

# ── 1. SANTÉ ────────────────────────────────────────────────
section "1. Santé du serveur"
R=$(curl -s "$BASE/health")
check "GET /health → status OK" '"status":"OK"' "$R"

# ── 2. LOGIN ADMIN ──────────────────────────────────────────
section "2. Connexion admin"
R=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
check "POST /auth/login → token présent" '"token"' "$R"
check "POST /auth/login → role admin" '"role":"admin"' "$R"
check "POST /auth/login → status active" '"status":"active"' "$R"

ADMIN_TOKEN=$(echo "$R" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}⚠️  Token admin absent — les tests suivants vont échouer${NC}"
fi

# ── 3. AUTH ME ──────────────────────────────────────────────
section "3. Profil admin (/me)"
R=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /auth/me → driver présent" '"driver"' "$R"
check "GET /auth/me → role admin" '"role":"admin"' "$R"

# ── 4. MAUVAIS MOT DE PASSE ────────────────────────────────
section "4. Sécurité — mauvais mot de passe"
R=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"mauvais\"}")
check "POST /auth/login mauvais mdp → 401" 'Identifiants' "$R"

# ── 5. INSCRIPTION CHAUFFEUR ────────────────────────────────
section "5. Inscription nouveau chauffeur"
TS=$(date +%s)
DRIVER_EMAIL="testchauffeur${TS}@test.fr"
R=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Jean Test\",\"email\":\"$DRIVER_EMAIL\",\"password\":\"Test1234!\",\"phone\":\"0612345678\"}")
check "POST /auth/register → token présent" '"token"' "$R"
check "POST /auth/register → status trial" '"status":"trial"' "$R"
check "POST /auth/register → role driver" '"role":"driver"' "$R"
check "POST /auth/register → slug généré" '"slug"' "$R"
check "POST /auth/register → trialEndDate présent" '"trialEndDate"' "$R"

DRIVER_TOKEN=$(echo "$R" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
DRIVER_SLUG=$(echo "$R" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)

# ── 6. EMAIL DÉJÀ UTILISÉ ──────────────────────────────────
section "6. Sécurité — email déjà utilisé"
R=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Doublon\",\"email\":\"$DRIVER_EMAIL\",\"password\":\"Test1234!\",\"phone\":\"0612345678\"}")
check "POST /auth/register email dupliqué → 409" 'existe' "$R"

# ── 7. RÉSERVATION PUBLIQUE ─────────────────────────────────
section "7. Réservation publique (sans auth)"
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d tomorrow +%Y-%m-%d)
R=$(curl -s -X POST "$BASE/reservations" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\":\"Marie\",
    \"lastName\":\"Dupont\",
    \"email\":\"marie.dupont@test.fr\",
    \"phone\":\"0612345678\",
    \"departureAddress\":\"14 rue de la Paix, Toulouse\",
    \"arrivalAddress\":\"Aeroport Toulouse Blagnac\",
    \"date\":\"$TOMORROW\",
    \"time\":\"09:30\",
    \"passengers\":2,
    \"luggage\":1,
    \"distance\":25.5,
    \"estimatedPrice\":48.50,
    \"gdprConsent\":true,
    \"driverSlug\":\"$DRIVER_SLUG\"
  }")
check "POST /reservations → reservationNumber présent" '"reservationNumber"' "$R"
check "POST /reservations → status pending" '"pending"' "$R"

RESA_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# ── 8. STATS CHAUFFEUR ──────────────────────────────────────
section "8. Stats chauffeur"
R=$(curl -s "$BASE/stats" -H "Authorization: Bearer $DRIVER_TOKEN")
check "GET /stats → total présent" '"total"' "$R"

# ── 9. LISTE RÉSERVATIONS CHAUFFEUR ────────────────────────
section "9. Réservations du chauffeur"
R=$(curl -s "$BASE/reservations" -H "Authorization: Bearer $DRIVER_TOKEN")
check "GET /reservations → reservations présent" '"reservations"' "$R"

# ── 10. ADMIN — STATS GLOBALES ──────────────────────────────
section "10. Admin — statistiques globales"
R=$(curl -s "$BASE/admin/stats" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /admin/stats → totalDrivers présent" '"totalDrivers"' "$R"
check "GET /admin/stats → totalReservations présent" '"totalReservations"' "$R"

# ── 11. ADMIN — LISTE CHAUFFEURS ────────────────────────────
section "11. Admin — liste des chauffeurs"
R=$(curl -s "$BASE/admin/drivers" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /admin/drivers → drivers présent" '"drivers"' "$R"

# ── 12. REFUS ACCÈS ADMIN PAR DRIVER ───────────────────────
section "12. Sécurité — chauffeur ne peut pas accéder à l'admin"
R=$(curl -s "$BASE/admin/stats" -H "Authorization: Bearer $DRIVER_TOKEN")
check "GET /admin/stats avec token driver → 403" 'administrateurs' "$R"

# ── 13. PROFIL PUBLIC /book/:slug ───────────────────────────
section "13. Page publique chauffeur (/book/:slug)"
R=$(curl -s "$BASE/drivers/public/$DRIVER_SLUG")
check "GET /drivers/public/:slug → driver présent" '"driver"' "$R"
check "GET /drivers/public/:slug → slug correct" "\"slug\":\"$DRIVER_SLUG\"" "$R"

# ── 14. CRM CHAUFFEUR ───────────────────────────────────────
section "14. CRM — liste des clients"
R=$(curl -s "$BASE/crm/clients" -H "Authorization: Bearer $DRIVER_TOKEN")
check "GET /crm/clients → clients présent" '"clients"' "$R"

# ── 15. SANS TOKEN → 401 ────────────────────────────────────
section "15. Sécurité — accès sans token"
R=$(curl -s "$BASE/reservations")
check "GET /reservations sans token → 401" 'Token' "$R"

# ── RÉSUMÉ ──────────────────────────────────────────────────
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "  Résultats : ${GREEN}$PASS PASS${NC}  /  ${RED}$FAIL FAIL${NC}  /  $((PASS+FAIL)) total"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les tests passent — l'API est opérationnelle !${NC}"
else
  echo -e "${RED}⚠️  $FAIL test(s) en échec — voir les détails ci-dessus.${NC}"
fi
echo ""
