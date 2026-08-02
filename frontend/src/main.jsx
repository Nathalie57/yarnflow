import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// [AI:Claude] Import avant App : i18next doit être initialisé (et la langue
// résolue depuis localStorage) avant le premier rendu, sinon flash en français.
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

