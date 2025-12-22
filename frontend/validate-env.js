#!/usr/bin/env node
/**
 * Script de validation des variables d'environnement
 * Vérifie que toutes les variables requises sont présentes avant le build
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Variables requises pour TOUS les environnements
const REQUIRED_VARS = [
  'VITE_API_URL',
  'VITE_BACKEND_URL',
  'VITE_ENV'
]

// Variables optionnelles mais recommandées
const RECOMMENDED_VARS = [
  'VITE_FRONTEND_URL',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_APP_ENV',
  'VITE_APP_DEBUG'
]

function validateEnvFile(envPath, envName) {
  console.log(`\n🔍 Validation de ${envName}...`)

  if (!fs.existsSync(envPath)) {
    console.error(`❌ Fichier ${envName} introuvable !`)
    return false
  }

  const content = fs.readFileSync(envPath, 'utf-8')
  const lines = content.split('\n')
  const vars = {}

  // Parser le fichier .env
  lines.forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) {
      vars[match[1]] = match[2]
    }
  })

  let isValid = true
  const missing = []
  const recommended = []

  // Vérifier les variables requises
  REQUIRED_VARS.forEach(varName => {
    if (!vars[varName] || vars[varName].includes('VOTRE_') || vars[varName].includes('TODO')) {
      missing.push(varName)
      isValid = false
    }
  })

  // Vérifier les variables recommandées
  RECOMMENDED_VARS.forEach(varName => {
    if (!vars[varName] || vars[varName].includes('VOTRE_') || vars[varName].includes('TODO')) {
      recommended.push(varName)
    }
  })

  // Afficher les résultats
  if (missing.length > 0) {
    console.error(`❌ Variables REQUISES manquantes :`)
    missing.forEach(v => console.error(`   - ${v}`))
  }

  if (recommended.length > 0) {
    console.warn(`⚠️  Variables RECOMMANDÉES manquantes :`)
    recommended.forEach(v => console.warn(`   - ${v}`))
  }

  if (missing.length === 0 && recommended.length === 0) {
    console.log(`✅ Toutes les variables sont présentes`)
  }

  // Afficher les valeurs configurées
  console.log(`\n📋 Configuration ${envName} :`)
  REQUIRED_VARS.concat(RECOMMENDED_VARS).forEach(varName => {
    if (vars[varName]) {
      console.log(`   ${varName}=${vars[varName]}`)
    }
  })

  return isValid
}

// Valider tous les fichiers .env
const envFiles = [
  { path: path.join(__dirname, '.env'), name: '.env (local)' },
  { path: path.join(__dirname, '.env.development'), name: '.env.development' },
  { path: path.join(__dirname, '.env.staging'), name: '.env.staging' },
  { path: path.join(__dirname, '.env.production'), name: '.env.production' }
]

console.log('🔧 Validation des fichiers d\'environnement YarnFlow\n')
console.log('=' .repeat(60))

let allValid = true
envFiles.forEach(({ path: envPath, name }) => {
  const isValid = validateEnvFile(envPath, name)
  if (!isValid) allValid = false
  console.log('=' .repeat(60))
})

if (allValid) {
  console.log('\n✅ Tous les fichiers .env sont valides !\n')
  process.exit(0)
} else {
  console.log('\n❌ Certains fichiers .env ont des variables manquantes.\n')
  console.log('💡 Corrigez les erreurs avant de builder pour staging/prod.\n')
  process.exit(1)
}
