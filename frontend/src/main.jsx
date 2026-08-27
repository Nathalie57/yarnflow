import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// [AI:Claude] Import avant App : i18next doit être initialisé (et la langue
// résolue depuis localStorage) avant le premier rendu, sinon flash en français.
import './i18n'

// [AI:Claude] 2026-08-27 — Un chunk (page chargée via React.lazy) qui échoue à se
// télécharger (réseau faible, coupure) rejette la promesse d'import AVANT que React
// n'ait quoi que ce soit à afficher : Suspense/ErrorBoundary ne voient rien passer,
// la navigation reste bloquée sans le moindre message. Vite émet 'vite:preloadError'
// dans ce cas précis — on recharge une fois (le SW/cache aura peut-être le fichier
// entretemps), avec un garde-fou pour ne jamais boucler si le rechargement échoue aussi.
window.addEventListener('vite:preloadError', () => {
  const key = 'yf_preload_error_reloaded'
  if (sessionStorage.getItem(key)) return // déjà tenté cette session, on n'insiste pas
  sessionStorage.setItem(key, '1')
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

