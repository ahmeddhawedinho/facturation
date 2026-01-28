# Script de migration - Module Expert Comptable
Write-Host "================================" -ForegroundColor Cyan
Write-Host "MIGRATION BASE DE DONNEES" -ForegroundColor Cyan
Write-Host "Module: Expert Comptable (Code d'acces)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Naviguer vers le dossier API
Write-Host "[1/4] Navigation vers apps/api..." -ForegroundColor Yellow
Set-Location -Path "apps\api"

# Étape 2: Créer et appliquer la migration
Write-Host ""
Write-Host "[2/4] Creation de la migration..." -ForegroundColor Yellow
Write-Host "Nom: add_accountant_access_code" -ForegroundColor Gray
npx prisma migrate dev --name add_accountant_access_code

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR: La migration a echoue!" -ForegroundColor Red
    Write-Host "Assurez-vous que:" -ForegroundColor Yellow
    Write-Host "  1. Les serveurs sont ARRETES (Ctrl+C)" -ForegroundColor Yellow
    Write-Host "  2. La base de donnees PostgreSQL est accessible" -ForegroundColor Yellow
    Write-Host "  3. Le fichier .env contient DATABASE_URL" -ForegroundColor Yellow
    Set-Location -Path "..\.."
    exit 1
}

# Étape 3: Générer le Prisma Client
Write-Host ""
Write-Host "[3/4] Generation du Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR: La generation du client a echoue!" -ForegroundColor Red
    Set-Location -Path "..\.."
    exit 1
}

# Étape 4: Retour au dossier racine
Write-Host ""
Write-Host "[4/4] Retour au dossier racine..." -ForegroundColor Yellow
Set-Location -Path "..\.."

# Succès !
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "MIGRATION TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "  1. Demarrer le backend:  cd apps\api && npm run start:dev" -ForegroundColor White
Write-Host "  2. Demarrer le frontend: cd apps\web && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Ou utilisez le script: .\start-servers.ps1" -ForegroundColor Yellow
Write-Host ""
