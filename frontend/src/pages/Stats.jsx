/**
 * @file Stats.jsx
 * @brief Page de statistiques YarnFlow
 * @author Nathalie + Claude Code
 * @version 2.0.0 - Refonte UI : palette sage, SVG, FREE-friendly
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const BADGE_DEFINITIONS = [
  // — Projets créés —
  { id: 'proj-1',  title: 'Premiers pas',           desc: 'Votre premier projet lancé !',          tier: 'free', color: 'primary', condition: (s) => s.total_projects >= 1 },
  { id: 'proj-3',  title: 'En route',               desc: '3 projets, le rythme est là.',          tier: 'free', color: 'primary', condition: (s) => s.total_projects >= 3 },
  { id: 'proj-5',  title: 'Bien lancée',            desc: '5 projets, vous êtes accro !',          tier: 'pro',  color: 'primary', condition: (s) => s.total_projects >= 5 },
  { id: 'proj-10', title: 'Collection',             desc: 'Une belle collection de 10 projets.',   tier: 'pro',  color: 'primary', condition: (s) => s.total_projects >= 10 },
  { id: 'proj-25', title: 'Projeteuse passionnée',  desc: '25 projets — inarrêtable !',            tier: 'pro',  color: 'primary', condition: (s) => s.total_projects >= 25 },
  { id: 'proj-50', title: 'Inépuisable',            desc: '50 projets. Chapeau.',                  tier: 'pro',  color: 'primary', condition: (s) => s.total_projects >= 50 },
  // — Projets terminés —
  { id: 'done-1',  title: 'Premier achevé',         desc: "Bravo, jusqu'au bout !",                tier: 'free', color: 'green',   condition: (s) => s.completed_projects >= 1 },
  { id: 'done-3',  title: 'Persévérante',           desc: '3 projets bouclés.',                    tier: 'free', color: 'green',   condition: (s) => s.completed_projects >= 3 },
  { id: 'done-5',  title: 'Finisseuse',             desc: 'Vous ne laissez rien en plan.',         tier: 'pro',  color: 'green',   condition: (s) => s.completed_projects >= 5 },
  { id: 'done-10', title: 'Maîtresse des finitions',desc: '10 projets terminés, impeccable.',      tier: 'pro',  color: 'green',   condition: (s) => s.completed_projects >= 10 },
  { id: 'done-20', title: 'Productrice en série',   desc: '20 projets terminés !',                 tier: 'pro',  color: 'green',   condition: (s) => s.completed_projects >= 20 },
  // — Taux de finition —
  { id: 'rate-75', title: 'Finisseuse sérieuse',    desc: '75 % de projets achevés.',              tier: 'pro',  color: 'green',   condition: (s) => s.completion_rate >= 75 && s.total_projects >= 4 },
  { id: 'rate-100',title: 'Sans laisser-aller',     desc: 'Tous vos projets sont terminés !',      tier: 'pro',  color: 'green',   condition: (s) => s.completion_rate >= 100 && s.total_projects >= 3 },
  // — Rangs comptés —
  { id: 'row-100', title: "Les aiguilles s'échauffent", desc: '100 rangs au compteur.',            tier: 'free', color: 'warm',    condition: (s) => s.total_rows >= 100 },
  { id: 'row-500', title: '500 rangs',              desc: 'La régularité paye.',                   tier: 'free', color: 'warm',    condition: (s) => s.total_rows >= 500 },
  { id: 'row-1k',  title: 'Millième rang',          desc: 'Un cap symbolique franchi.',            tier: 'pro',  color: 'warm',    condition: (s) => s.total_rows >= 1000 },
  { id: 'row-5k',  title: '5 000 rangs',            desc: 'Vos doigts connaissent le chemin.',     tier: 'pro',  color: 'warm',    condition: (s) => s.total_rows >= 5000 },
  { id: 'row-10k', title: '10 000 rangs',           desc: 'Monumentale !',                         tier: 'pro',  color: 'warm',    condition: (s) => s.total_rows >= 10000 },
  { id: 'row-50k', title: 'Sans fin',               desc: '50 000 rangs — la légende.',            tier: 'pro',  color: 'warm',    condition: (s) => s.total_rows >= 50000 },
  // — Mailles —
  { id: 'stitch-1k',  title: '1 000 mailles',       desc: 'Maille après maille.',                  tier: 'pro',  color: 'warm',    condition: (s) => (s.total_stitches || 0) >= 1000 },
  { id: 'stitch-10k', title: '10 000 mailles',      desc: 'Un vrai tissu de patience.',            tier: 'pro',  color: 'warm',    condition: (s) => (s.total_stitches || 0) >= 10000 },
  { id: 'stitch-100k',title: '100 000 mailles',     desc: 'Virtuose confirmée.',                   tier: 'pro',  color: 'warm',    condition: (s) => (s.total_stitches || 0) >= 100000 },
  // — Temps de tricot —
  { id: 'time-1h',  title: 'Première heure',        desc: 'Le chrono est lancé.',                  tier: 'free', color: 'primary', condition: (s) => s.total_crochet_time >= 3600 },
  { id: 'time-5h',  title: '5 heures',              desc: 'Bien investi.',                         tier: 'free', color: 'primary', condition: (s) => s.total_crochet_time >= 18000 },
  { id: 'time-10h', title: '10 heures',             desc: 'Une vraie pratique régulière.',         tier: 'pro',  color: 'primary', condition: (s) => s.total_crochet_time >= 36000 },
  { id: 'time-24h', title: 'Une journée entière',   desc: '24h de tricot au total.',               tier: 'pro',  color: 'primary', condition: (s) => s.total_crochet_time >= 86400 },
  { id: 'time-50h', title: '50 heures',             desc: 'Dévouement impressionnant.',            tier: 'pro',  color: 'primary', condition: (s) => s.total_crochet_time >= 180000 },
  { id: 'time-100h',title: 'Centenaire',            desc: "100h — vous êtes une pro.",             tier: 'pro',  color: 'primary', condition: (s) => s.total_crochet_time >= 360000 },
  { id: 'time-500h',title: 'Sans compter ses heures',desc: '500h de pure passion.',                tier: 'pro',  color: 'primary', condition: (s) => s.total_crochet_time >= 1800000 },
  // — Série en cours —
  { id: 'streak-3',  title: '3 jours de suite',     desc: "La routine s'installe.",                tier: 'free', color: 'orange',  condition: (s) => s.current_streak >= 3 },
  { id: 'streak-7',  title: 'Semaine complète',     desc: '7 jours sans pause !',                  tier: 'pro',  color: 'orange',  condition: (s) => s.current_streak >= 7 },
  { id: 'streak-14', title: 'Deux semaines',        desc: "L'habitude est bien ancrée.",           tier: 'pro',  color: 'orange',  condition: (s) => s.current_streak >= 14 },
  { id: 'streak-30', title: 'Un mois de fil',       desc: '30 jours consécutifs, bravo !',         tier: 'pro',  color: 'orange',  condition: (s) => s.current_streak >= 30 },
  { id: 'streak-100',title: 'Discipline de fer',    desc: '100 jours — engagement total.',         tier: 'pro',  color: 'orange',  condition: (s) => s.current_streak >= 100 },
  // — Record de série —
  { id: 'longest-30',title: 'Record : 30 jours',   desc: 'Votre meilleure série mérite un badge.', tier: 'pro',  color: 'orange',  condition: (s) => (s.longest_streak || 0) >= 30 },
  { id: 'longest-60',title: 'Record : 2 mois',     desc: 'Une série historique.',                  tier: 'pro',  color: 'orange',  condition: (s) => (s.longest_streak || 0) >= 60 },
  // — Vitesse (nécessite timer) —
  { id: 'speed-5',  title: 'Bonne cadence',         desc: '5 rangs/h en moyenne.',                 tier: 'pro',  color: 'primary', condition: (s) => (s.avg_rows_per_hour || 0) >= 5 },
  { id: 'speed-10', title: 'Aiguilles rapides',     desc: '10 rangs/h — vous maîtrisez.',          tier: 'pro',  color: 'primary', condition: (s) => (s.avg_rows_per_hour || 0) >= 10 },
  { id: 'speed-20', title: 'Vitesse de croisière',  desc: '20 rangs/h, impressionnant !',          tier: 'pro',  color: 'primary', condition: (s) => (s.avg_rows_per_hour || 0) >= 20 },
  { id: 'speed-30', title: 'Supersonique',          desc: '30 rangs/h — mains en or.',             tier: 'pro',  color: 'primary', condition: (s) => (s.avg_rows_per_hour || 0) >= 30 },
  // — Photos IA —
  { id: 'photo-1',  title: 'Première vision',       desc: 'Première photo générée par IA.',        tier: 'free', color: 'primary', condition: (s, p) => (p.total_ai_photos || 0) >= 1 },
  { id: 'photo-5',  title: 'Artiste numérique',     desc: '5 photos IA créées.',                   tier: 'pro',  color: 'primary', condition: (s, p) => (p.total_ai_photos || 0) >= 5 },
  { id: 'photo-10', title: 'Studio photo',          desc: '10 créations — vraie photographe !',    tier: 'pro',  color: 'primary', condition: (s, p) => (p.total_ai_photos || 0) >= 10 },
  { id: 'photo-25', title: 'Galerie complète',      desc: '25 photos IA, une collection.',         tier: 'pro',  color: 'primary', condition: (s, p) => (p.total_ai_photos || 0) >= 25 },
]

const LOCKED_PREVIEW = 6

const Stats = () => {
  const { hasActiveSubscription } = useAuth()
  const isPro = hasActiveSubscription()

  const [stats, setStats] = useState(null)
  const [photoStats, setPhotoStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    // Stats projets — bloquant
    try {
      const response = await api.get('/projects/stats', { params: { period } })
      setStats(response.data.stats || {})
    } catch (err) {
      console.error('Erreur stats projets:', err)
      setError('Impossible de charger les statistiques.')
    } finally {
      setLoading(false)
    }

    // Stats photos — non bloquant, ne fait pas planter le reste
    try {
      const response = await api.get('/photos/stats', { params: { period } })
      setPhotoStats(response.data.stats || {})
    } catch (err) {
      console.error('Erreur stats photos:', err)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}min`
    if (mins > 0) return `${mins}min`
    return `${seconds}s`
  }

  const calculateBadges = () => {
    if (!stats) return { earned: [], lockedPro: [] }
    const p = photoStats || {}
    const earned = []
    const lockedPro = []

    BADGE_DEFINITIONS.forEach(badge => {
      const conditionMet = badge.condition(stats, p)
      if (conditionMet && (isPro || badge.tier === 'free')) {
        earned.push(badge)
      } else if (!isPro && badge.tier === 'pro') {
        lockedPro.push({ ...badge, earnedButLocked: conditionMet })
      }
    })

    return { earned, lockedPro }
  }

  const badgeColorClasses = {
    primary: 'bg-primary-50 text-primary-800 border-primary-200',
    green:   'bg-green-50 text-green-800 border-green-200',
    warm:    'bg-warm-50 text-warm-800 border-warm-200',
    orange:  'bg-orange-50 text-orange-800 border-orange-200',
  }

  const streakCalendar = () => {
    const today = new Date()
    return (
      <div className="flex gap-2 justify-center">
        {[...Array(7)].map((_, i) => {
          const date = new Date(today)
          date.setDate(today.getDate() - (6 - i))
          const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
          const isActive = (6 - i) < (stats?.current_streak || 0)
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isActive ? 'bg-warm-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
              }`}>
                {dayName[0].toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const { earned: earnedBadges, lockedPro: lockedBadges } = calculateBadges()
  const earnedButLockedCount = lockedBadges.filter(b => b.earnedButLocked).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Mes statistiques</h1>
        {isPro && (
          <div className="flex gap-1">
            {[
              { key: 'week', label: 'Semaine' },
              { key: 'month', label: 'Mois' },
              { key: 'year', label: 'Année' },
              { key: 'all', label: 'Tout' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  period === p.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!stats || stats.total_projects === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pas encore de statistiques</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Créez votre premier projet et commencez à compter vos rangs.
          </p>
          <Link
            to="/my-projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition text-sm"
          >
            Créer un projet
          </Link>
        </div>
      ) : (
        <>
          {/* 4 stat cards — visibles FREE et PRO */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Projets */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total_projects || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Projets</div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-xs">
                <span className="text-green-600 font-medium">{stats.completed_projects || 0} terminés</span>
                <span className="text-orange-500 font-medium">{stats.active_projects || 0} en cours</span>
              </div>
            </div>

            {/* Temps */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {Math.floor((stats.total_crochet_time || 0) / 3600)}h
              </div>
              <div className="text-xs text-gray-500 mt-0.5">de tricot</div>
              {isPro && stats.average_session_time > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  ~{stats.average_session_time} min / session
                </div>
              )}
            </div>

            {/* Rangs */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {(stats.total_rows || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Rangs comptés</div>
              {isPro && stats.avg_rows_per_hour > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  ~{stats.avg_rows_per_hour} rangs/h en moy.
                </div>
              )}
            </div>

            {/* Taux de finition */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.completion_rate || 0}%</div>
              <div className="text-xs text-gray-500 mt-0.5">Taux de finition</div>
              {isPro && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${stats.completion_rate || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-warm-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Série en cours</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-warm-600 tabular-nums">{stats.current_streak || 0}</span>
                <span className="text-sm text-gray-500 ml-1">jour{stats.current_streak > 1 ? 's' : ''}</span>
              </div>
            </div>

            {isPro ? (
              <>
                {streakCalendar()}
                <div className="mt-3 text-center text-xs text-gray-400">
                  Record personnel : <strong className="text-gray-600">{stats.longest_streak || 0} jour{stats.longest_streak > 1 ? 's' : ''}</strong>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Record : <strong className="text-gray-700">{stats.longest_streak || 0} jour{stats.longest_streak > 1 ? 's' : ''}</strong>
                </span>
                <Link to="/subscription" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Calendrier PRO →
                </Link>
              </div>
            )}
          </div>

          {/* Graphiques — visibles pour tous, floutés pour FREE */}
          <div className="relative">

            {/* Contenu — flouté si FREE */}
            <div className={!isPro ? 'blur-sm pointer-events-none select-none' : ''}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Progression 30 jours */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Progression — 30 derniers jours</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={
                      stats.progression && stats.progression.length > 0
                        ? stats.progression.map(d => ({ day: d.day.slice(5), rangs: parseInt(d.rows) || 0 }))
                        : [3,7,5,12,8,15,10,18,14,20,16,22,17,25,19,14,21,18,24,16,22,19,27,21,18,25,20,28,23,26].map((v, i) => ({ day: `J${i + 1}`, rangs: v }))
                    }>
                      <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#557055" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#557055" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload, label }) => active && payload?.length ? (
                          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-md text-xs">
                            <p className="font-semibold text-gray-700">{label}</p>
                            <p className="text-primary-600">{payload[0].value} rangs</p>
                          </div>
                        ) : null}
                      />
                      <Area type="monotone" dataKey="rangs" stroke="#557055" fill="url(#progressGradient)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Répartition des projets */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Répartition des projets</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Terminés', value: stats.completed_projects || 0 },
                          { name: 'En cours', value: stats.active_projects || 0 },
                          { name: 'Autres', value: Math.max(0, (stats.total_projects || 0) - (stats.completed_projects || 0) - (stats.active_projects || 0)) }
                        ].filter(i => i.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {['#557055', '#b8917a', '#d1dcd1'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-5 text-xs mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                      <span className="text-gray-600">Terminés ({stats.completed_projects || 0})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-warm-500" />
                      <span className="text-gray-600">En cours ({stats.active_projects || 0})</span>
                    </div>
                  </div>
                </div>

                {/* Meilleure heure — PRO avec données */}
                {isPro && stats.best_hour !== null && stats.best_hour !== undefined && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Votre meilleure heure</p>
                      <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.best_hour}h – {stats.best_hour + 1}h</p>
                      <p className="text-xs text-gray-400 mt-0.5">Créneau où vous tricotez le plus vite</p>
                    </div>
                  </div>
                )}

                {/* Stats photos IA — PRO avec données */}
                {isPro && photoStats && photoStats.total_ai_photos > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">AI Photo Studio</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <div className="text-xl font-bold text-primary-700 tabular-nums">{photoStats.total_ai_photos || 0}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Photos générées</div>
                      </div>
                      <div className="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <div className="text-xl font-bold text-primary-700 tabular-nums">{photoStats.credits_remaining || 0}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Crédits restants</div>
                      </div>
                      {photoStats.top_style && (
                        <div className="col-span-2 text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                          <div className="text-sm font-semibold text-primary-700">{photoStats.top_style}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Style préféré</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Overlay CTA — FREE uniquement */}
            {!isPro && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-primary-200 shadow-xl p-6 text-center mx-4 max-w-sm">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Vos analytics complets</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Progression jour par jour, répartition de vos projets, votre meilleure heure de tricot...
                  </p>
                  <Link
                    to="/subscription"
                    className="inline-block w-full px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
                  >
                    Débloquer avec PRO — 3,99€/mois
                  </Link>
                  <p className="text-xs text-gray-400 mt-2">Résiliable à tout moment</p>
                </div>
              </div>
            )}
          </div>

          {/* Badges */}
          {(earnedBadges.length > 0 || (!isPro && lockedBadges.length > 0)) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">
                Badges
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {earnedBadges.length} obtenus{!isPro && lockedBadges.length > 0 ? ` · ${lockedBadges.length} à débloquer` : ''}
                </span>
              </h3>

              {/* Badges débloqués */}
              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`rounded-xl border p-3 ${badgeColorClasses[badge.color] || badgeColorClasses.primary}`}
                    >
                      <div className="font-semibold text-sm mb-0.5">{badge.title}</div>
                      <div className="text-xs opacity-70">{badge.desc}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-4">Continuez à tricoter pour débloquer vos premiers badges !</p>
              )}

              {/* Badges PRO verrouillés — visibles en grisé pour les FREE */}
              {!isPro && lockedBadges.length > 0 && (
                <>
                  <div className="mt-5 mb-3 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-xs font-medium text-gray-400 px-2 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      {lockedBadges.length} badges avec PRO
                    </span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>

                  {/* Bannière si des objectifs sont déjà atteints */}
                  {earnedButLockedCount > 0 && (
                    <div className="mb-3 bg-primary-50 border border-primary-200 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-800">
                          {earnedButLockedCount} objectif{earnedButLockedCount > 1 ? 's' : ''} déjà atteint{earnedButLockedCount > 1 ? 's' : ''} !
                        </p>
                        <p className="text-xs text-primary-600 mt-0.5">
                          Passez à PRO pour débloquer ces badges immédiatement.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {lockedBadges.slice(0, LOCKED_PREVIEW).map((badge) => (
                      <div
                        key={badge.id}
                        className={`relative rounded-xl border p-3 ${
                          badge.earnedButLocked
                            ? 'bg-primary-50/60 border-primary-200 ring-1 ring-primary-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`absolute top-2 right-2 ${badge.earnedButLocked ? 'text-primary-400' : 'text-gray-300'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <div className={`font-semibold text-sm mb-0.5 pr-5 ${badge.earnedButLocked ? 'text-primary-700' : 'text-gray-400'}`}>
                          {badge.title}
                        </div>
                        <div className={`text-xs ${badge.earnedButLocked ? 'text-primary-500 font-medium' : 'text-gray-300'}`}>
                          {badge.earnedButLocked ? 'Objectif atteint !' : badge.desc}
                        </div>
                      </div>
                    ))}
                    {lockedBadges.length > LOCKED_PREVIEW && (
                      <div className="rounded-xl border border-dashed border-gray-200 p-3 flex items-center justify-center">
                        <span className="text-xs text-gray-400 text-center leading-relaxed">
                          +{lockedBadges.length - LOCKED_PREVIEW} autres<br />badges à découvrir
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/subscription"
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
                  >
                    Débloquer tous les badges PRO — 3,99€/mois
                  </Link>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Stats
