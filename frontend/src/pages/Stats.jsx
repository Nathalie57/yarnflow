/**
 * @file Stats.jsx
 * @brief Page de statistiques YarnFlow
 * @author Nathalie + Claude Code
 * @version 2.0.0 - Refonte UI : palette sage, SVG, FREE-friendly
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { PLAN_PRICES, upgradeTarget, planLabel } from '../data/upgradePlans'

// [AI:Claude] `metric`/`threshold` alimentent à la fois `condition` (dérivée
// automatiquement) et la barre de progression des badges pas encore obtenus —
// une seule source de vérité par badge au lieu de dupliquer le seuil.
const withProgress = (def) => ({ ...def, condition: (s, p) => def.metric(s, p) >= def.threshold })

const BADGE_DEFINITIONS = [
  // — Projets créés —
  { id: 'proj-1',          tier: 'free', color: 'primary', metric: (s) => s.total_projects, threshold: 1 },
  { id: 'proj-3',          tier: 'free', color: 'primary', metric: (s) => s.total_projects, threshold: 3 },
  { id: 'proj-5',          tier: 'pro',  color: 'primary', metric: (s) => s.total_projects, threshold: 5 },
  { id: 'proj-10',   tier: 'pro',  color: 'primary', metric: (s) => s.total_projects, threshold: 10 },
  { id: 'proj-25',            tier: 'pro',  color: 'primary', metric: (s) => s.total_projects, threshold: 25 },
  { id: 'proj-50',                  tier: 'pro',  color: 'primary', metric: (s) => s.total_projects, threshold: 50 },
  // — Projets terminés —
  { id: 'done-1',                tier: 'free', color: 'green',   metric: (s) => s.completed_projects, threshold: 1 },
  { id: 'done-3',                    tier: 'free', color: 'green',   metric: (s) => s.completed_projects, threshold: 3 },
  { id: 'done-5',         tier: 'pro',  color: 'green',   metric: (s) => s.completed_projects, threshold: 5 },
  { id: 'done-10',      tier: 'pro',  color: 'green',   metric: (s) => s.completed_projects, threshold: 10 },
  { id: 'done-20',                 tier: 'pro',  color: 'green',   metric: (s) => s.completed_projects, threshold: 20 },
  // — Taux de finition —
  { id: 'rate-75',              tier: 'pro',  color: 'green',   metric: (s) => s.total_projects >= 4 ? s.completion_rate : 0, threshold: 75 },
  { id: 'rate-100',      tier: 'pro',  color: 'green',   metric: (s) => s.total_projects >= 3 ? s.completion_rate : 0, threshold: 100 },
  // — Rangs comptés —
  { id: 'row-100',            tier: 'free', color: 'warm',    metric: (s) => s.total_rows, threshold: 100 },
  { id: 'row-500',                   tier: 'free', color: 'warm',    metric: (s) => s.total_rows, threshold: 500 },
  { id: 'row-1k',            tier: 'pro',  color: 'warm',    metric: (s) => s.total_rows, threshold: 1000 },
  { id: 'row-5k',     tier: 'pro',  color: 'warm',    metric: (s) => s.total_rows, threshold: 5000 },
  { id: 'row-10k',                         tier: 'pro',  color: 'warm',    metric: (s) => s.total_rows, threshold: 10000 },
  { id: 'row-50k',            tier: 'pro',  color: 'warm',    metric: (s) => s.total_rows, threshold: 50000 },
  // — Mailles —
  { id: 'stitch-1k',                  tier: 'pro',  color: 'warm',    metric: (s) => s.total_stitches || 0, threshold: 1000 },
  { id: 'stitch-10k',            tier: 'pro',  color: 'warm',    metric: (s) => s.total_stitches || 0, threshold: 10000 },
  { id: 'stitch-100k',                   tier: 'pro',  color: 'warm',    metric: (s) => s.total_stitches || 0, threshold: 100000 },
  // — Temps de tricot —
  { id: 'time-1h',                  tier: 'free', color: 'primary', metric: (s) => s.total_crochet_time, threshold: 3600 },
  { id: 'time-5h',                         tier: 'free', color: 'primary', metric: (s) => s.total_crochet_time, threshold: 18000 },
  { id: 'time-10h',         tier: 'pro',  color: 'primary', metric: (s) => s.total_crochet_time, threshold: 36000 },
  { id: 'time-24h',               tier: 'pro',  color: 'primary', metric: (s) => s.total_crochet_time, threshold: 86400 },
  { id: 'time-50h',            tier: 'pro',  color: 'primary', metric: (s) => s.total_crochet_time, threshold: 180000 },
  { id: 'time-100h',             tier: 'pro',  color: 'primary', metric: (s) => s.total_crochet_time, threshold: 360000 },
  { id: 'time-500h',                tier: 'pro',  color: 'primary', metric: (s) => s.total_crochet_time, threshold: 1800000 },
  // — Série en cours —
  { id: 'streak-3',                tier: 'free', color: 'orange',  metric: (s) => s.current_streak, threshold: 3 },
  { id: 'streak-7',                  tier: 'pro',  color: 'orange',  metric: (s) => s.current_streak, threshold: 7 },
  { id: 'streak-14',           tier: 'pro',  color: 'orange',  metric: (s) => s.current_streak, threshold: 14 },
  { id: 'streak-30',         tier: 'pro',  color: 'orange',  metric: (s) => s.current_streak, threshold: 30 },
  { id: 'streak-100',         tier: 'pro',  color: 'orange',  metric: (s) => s.current_streak, threshold: 100 },
  // — Record de série —
  { id: 'longest-30', tier: 'pro',  color: 'orange',  metric: (s) => s.longest_streak || 0, threshold: 30 },
  { id: 'longest-60',                  tier: 'pro',  color: 'orange',  metric: (s) => s.longest_streak || 0, threshold: 60 },
  // — Vitesse (nécessite timer) —
  { id: 'speed-5',                 tier: 'pro',  color: 'primary', metric: (s) => s.avg_rows_per_hour || 0, threshold: 5 },
  { id: 'speed-10',          tier: 'pro',  color: 'primary', metric: (s) => s.avg_rows_per_hour || 0, threshold: 10 },
  { id: 'speed-20',          tier: 'pro',  color: 'primary', metric: (s) => s.avg_rows_per_hour || 0, threshold: 20 },
  { id: 'speed-30',             tier: 'pro',  color: 'primary', metric: (s) => s.avg_rows_per_hour || 0, threshold: 30 },
  // — Photos IA —
  { id: 'photo-1',        tier: 'free', color: 'primary', metric: (s, p) => p.total_ai_photos || 0, threshold: 1 },
  { id: 'photo-5',                   tier: 'pro',  color: 'primary', metric: (s, p) => p.total_ai_photos || 0, threshold: 5 },
  { id: 'photo-10',    tier: 'pro',  color: 'primary', metric: (s, p) => p.total_ai_photos || 0, threshold: 10 },
  { id: 'photo-25',         tier: 'pro',  color: 'primary', metric: (s, p) => p.total_ai_photos || 0, threshold: 25 },
].map(withProgress)

const LOCKED_PREVIEW = 6

const Stats = () => {
  const { t } = useTranslation('library')
  const { hasActiveSubscription , getSubscriptionPlan } = useAuth()
  const isPro = hasActiveSubscription()

  // [AI:Claude] isPro vaut hasActiveSubscription() : vrai pour PLUS aussi.

  // Le plan reel decide quel palier proposer, ou aucun.

  const currentPlan = getSubscriptionPlan ? getSubscriptionPlan() : (isPro ? 'pro' : 'free')

  const [stats, setStats] = useState(null)
  const [photoStats, setPhotoStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('all')
  const [celebration, setCelebration] = useState(null)
  // [AI:Claude] La surcouche PRO se ferme et reste fermee : sans ca, une
  // utilisatrice FREE retombe sur la meme publicite a chaque visite.
  const UPSELL_KEY = 'yf_stats_upsell_dismissed'
  const [upsellDismissed, setUpsellDismissed] = useState(() => {
    try { return localStorage.getItem(UPSELL_KEY) === '1' } catch { return false }
  })
  const dismissUpsell = () => {
    try { localStorage.setItem(UPSELL_KEY, '1') } catch { /* stockage indisponible */ }
    setUpsellDismissed(true)
  }

  useEffect(() => {
    fetchStats()
  }, [period])

  // [AI:Claude] Célébration en usage réel — badge nouvellement débloqué ou
  // record de série battu, détecté en comparant à ce qu'on avait déjà vu
  // (localStorage), pas seulement sur le projet démo/tutoriel.
  useEffect(() => {
    if (!stats) return
    const { earned } = calculateBadges()

    const badgeKey = 'yf_seen_badges'
    const streakKey = 'yf_best_streak_seen'
    const rawSeenBadges = localStorage.getItem(badgeKey)
    const rawBestStreak = localStorage.getItem(streakKey)
    const isFirstRun = rawSeenBadges === null && rawBestStreak === null

    let seenIds = []
    try { seenIds = JSON.parse(rawSeenBadges || '[]') } catch { /* ignore */ }
    const bestSeen = parseInt(rawBestStreak || '0', 10) || 0
    const currentStreak = stats.current_streak || 0

    try {
      localStorage.setItem(badgeKey, JSON.stringify(earned.map(b => b.id)))
      localStorage.setItem(streakKey, String(Math.max(bestSeen, currentStreak)))
    } catch { /* ignore */ }

    // Au tout premier chargement on établit juste la référence, sans célébrer
    // (sinon on célèbrerait d'un coup tous les badges déjà acquis avant cette fonctionnalité)
    if (isFirstRun) return

    const newlyEarned = earned.filter(b => !seenIds.includes(b.id))
    const isNewStreakRecord = currentStreak >= 3 && currentStreak > bestSeen

    if (isNewStreakRecord) {
      setCelebration({ type: 'streak', value: currentStreak })
    } else if (newlyEarned.length > 0) {
      setCelebration({ type: 'badge', badge: newlyEarned[0] })
    }
  }, [stats, photoStats])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    // Stats projets — bloquant
    try {
      const response = await api.get('/projects/stats', { params: { period } })
      setStats(response.data.stats || {})
    } catch (err) {
      console.error('Erreur stats projets:', err)
      setError(t('ui.statsLoadFailed'))
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
    if (!stats) return { earned: [], lockedPro: [], notEarned: [] }
    const p = photoStats || {}
    const earned = []
    const lockedPro = []
    const notEarned = []

    BADGE_DEFINITIONS.forEach(badge => {
      const conditionMet = badge.condition(stats, p)
      const availableAtCurrentTier = isPro || badge.tier === 'free'

      if (conditionMet && availableAtCurrentTier) {
        earned.push(badge)
      } else if (!isPro && badge.tier === 'pro') {
        lockedPro.push({ ...badge, earnedButLocked: conditionMet })
      } else if (availableAtCurrentTier) {
        // [AI:Claude] Badge accessible au plan actuel mais pas encore obtenu —
        // section "à débloquer" avec progression, pour motiver (pas un outil
        // d'upsell comme lockedPro, qui lui reste réservé aux badges PRO en FREE)
        const value = badge.metric(stats, p)
        const percent = Math.min(100, Math.round((value / badge.threshold) * 100))
        notEarned.push({ ...badge, value, percent })
      }
    })

    notEarned.sort((a, b) => b.percent - a.percent)

    return { earned, lockedPro, notEarned }
  }

  const badgeColorClasses = {
    primary: 'bg-primary-50 text-primary-800 border-primary-200',
    green:   'bg-green-50 text-green-800 border-green-200',
    warm:    'bg-primary-50 text-primary-800 border-primary-200',
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
                isActive ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
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
            {t('ui.retry')}
          </button>
        </div>
      </div>
    )
  }

  const { earned: earnedBadges, lockedPro: lockedBadges, notEarned: notEarnedBadges } = calculateBadges()
  const earnedButLockedCount = lockedBadges.filter(b => b.earnedButLocked).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

      {/* Célébration — badge débloqué ou record de série, en usage réel */}
      {celebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4" onClick={() => setCelebration(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-4">{celebration.type === 'streak' ? '🔥' : '🏆'}</div>
            {celebration.type === 'streak' ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('ui.newStreakRecord')}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('ui.streakRecordDesc', { count: celebration.value })}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('ui.badgeUnlocked')} {t(`badges.${celebration.badge.id}.title`)}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{t(`badges.${celebration.badge.id}.desc`)}</p>
              </>
            )}
            <button
              onClick={() => setCelebration(null)}
              className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
            >
              {t('ui.continue')}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('ui.statsTitle')}</h1>
        {isPro && (
          <div className="flex gap-1">
            {[
              { key: 'week', labelKey: 'periodWeek' },
              { key: 'month', labelKey: 'periodMonth' },
              { key: 'year', labelKey: 'periodYear' },
              { key: 'all', labelKey: 'periodAll' },
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
                {t(`ui.${p.labelKey}`)}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('ui.noStatsTitle')}</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            {t('ui.noStatsDesc')}
          </p>
          <Link
            to="/my-projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition text-sm"
          >
            {t('ui.createProject')}
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
              <div className="text-xs text-gray-500 mt-0.5">{t('ui.projects')}</div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-xs">
                <span className="text-green-600 font-medium">{t('ui.completedCount', { count: stats.completed_projects || 0 })}</span>
                <span className="text-orange-500 font-medium">{t('ui.activeCount', { count: stats.active_projects || 0 })}</span>
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
              <div className="text-xs text-gray-500 mt-0.5">{t('ui.ofKnitting')}</div>
              {isPro && stats.average_session_time > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  {t('ui.avgSession', { n: stats.average_session_time })}
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
              <div className="text-xs text-gray-500 mt-0.5">{t('ui.rowsCounted')}</div>
              {isPro && stats.avg_rows_per_hour > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  {t('ui.avgRowsPerHour', { n: stats.avg_rows_per_hour })}
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
              <div className="text-xs text-gray-500 mt-0.5">{t('ui.completionRate')}</div>
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
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">{t('ui.currentStreak')}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary-600 tabular-nums">{stats.current_streak || 0}</span>
                <span className="text-sm text-gray-500 ml-1">{t('ui.dayUnit', { count: stats.current_streak })}</span>
              </div>
            </div>

            {isPro ? (
              <>
                {streakCalendar()}
                <div className="mt-3 text-center text-xs text-gray-400">
                  <Trans t={t} i18nKey="ui.personalRecord" count={stats.longest_streak || 0} values={{ count: stats.longest_streak || 0 }}><strong className="text-gray-600" /></Trans>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  <Trans t={t} i18nKey="ui.recordShort" count={stats.longest_streak || 0} values={{ count: stats.longest_streak || 0 }}><strong className="text-gray-700" /></Trans>
                </span>
                <Link to="/subscription" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  {t('ui.proCalendar')}
                </Link>
              </div>
            )}
          </div>

          {/* Graphiques — visibles pour tous, floutés pour FREE.
              Une fois la surcouche fermee, on remplace tout le bloc par une
              barre compacte : montrer des graphiques floutes sans pouvoir les
              lire ni fermer la publicite ne sert personne. */}
          {!isPro && upsellDismissed ? (
            <Link
              to="/subscription"
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm hover:border-primary-300 transition"
            >
              <span className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-800">{t('ui.fullAnalytics')}</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full flex-shrink-0">PRO</span>
            </Link>
          ) : (
          <div className="relative">

            {/* Contenu — flouté si FREE */}
            <div className={!isPro ? 'blur-sm pointer-events-none select-none' : ''}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Progression 30 jours */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">{t('ui.progress30Days')}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={
                      stats.progression && stats.progression.length > 0
                        ? stats.progression.map(d => ({ day: d.day.slice(5), rangs: parseInt(d.row_count) || 0 }))
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
                            <p className="text-primary-600">{t('ui.rowsTooltip', { count: payload[0].value })}</p>
                          </div>
                        ) : null}
                      />
                      <Area type="monotone" dataKey="rangs" stroke="#557055" fill="url(#progressGradient)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Répartition des projets */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">{t('ui.projectBreakdown')}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('ui.chartCompleted'), value: stats.completed_projects || 0 },
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
                      <span className="text-gray-600">{t('ui.completedParen', { count: stats.completed_projects || 0 })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      <span className="text-gray-600">{t('ui.inProgressParen', { count: stats.active_projects || 0 })}</span>
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
                      <p className="text-xs text-gray-500 mb-0.5">{t('ui.bestHour')}</p>
                      <p className="text-2xl font-bold text-gray-900 tabular-nums">{t('ui.hourRange', { from: stats.best_hour, to: stats.best_hour + 1 })}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t('ui.fastestSlot')}</p>
                    </div>
                  </div>
                )}

                {/* Stats photos IA — PRO avec données */}
                {isPro && photoStats && photoStats.total_ai_photos > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">{t('ui.aiPhotoStudio')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <div className="text-xl font-bold text-primary-700 tabular-nums">{photoStats.total_ai_photos || 0}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t('ui.photosGenerated')}</div>
                      </div>
                      <div className="text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                        <div className="text-xl font-bold text-primary-700 tabular-nums">{photoStats.credits_remaining || 0}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t('ui.creditsLeft')}</div>
                      </div>
                      {photoStats.top_style && (
                        <div className="col-span-2 text-center p-3 bg-primary-50 rounded-xl border border-primary-100">
                          <div className="text-sm font-semibold text-primary-700">{photoStats.top_style}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t('ui.favoriteStyle')}</div>
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
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border border-primary-200 shadow-xl p-6 text-center mx-4 max-w-sm">
                  <button
                    type="button"
                    onClick={dismissUpsell}
                    aria-label={t('ui.close')}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    ×
                  </button>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{t('ui.fullAnalytics')}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    {t('ui.fullAnalyticsDesc')}
                  </p>
                  <Link
                    to="/subscription"
                    className="inline-block w-full px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
                  >
                    {(() => { const p = upgradeTarget('advanced_stats', currentPlan); return p && t('ui.goToPlan', { plan: planLabel(p), price: PLAN_PRICES[p].monthlyEquiv }) })()}
                  </Link>
                  <p className="text-xs text-gray-500 mt-2">{t('ui.cancelAnytime')}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Badges */}
          {(earnedBadges.length > 0 || notEarnedBadges.length > 0 || (!isPro && lockedBadges.length > 0)) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">
                {t('ui.badges')}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {t('ui.badgesEarned', { count: earnedBadges.length })}{!isPro && lockedBadges.length > 0 ? t('ui.badgesToUnlockSuffix', { count: lockedBadges.length }) : ''}
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
                      <div className="font-semibold text-sm mb-0.5">{t(`badges.${badge.id}.title`)}</div>
                      <div className="text-xs opacity-70">{t(`badges.${badge.id}.desc`)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">{t('ui.keepKnittingForBadges')}</p>
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
                      {t('ui.badgesWithProCount', { count: lockedBadges.length })}
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
                          {t('ui.goalsAlreadyReached', { count: earnedButLockedCount })}
                        </p>
                        <p className="text-xs text-primary-600 mt-0.5">
                          {t('ui.upgradeForBadges')}
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
                          {t(`badges.${badge.id}.title`)}
                        </div>
                        <div className={`text-xs ${badge.earnedButLocked ? 'text-primary-500 font-medium' : 'text-gray-300'}`}>
                          {badge.earnedButLocked ? t('ui.objectiveReached') : t(`badges.${badge.id}.desc`)}
                        </div>
                      </div>
                    ))}
                    {lockedBadges.length > LOCKED_PREVIEW && (
                      <div className="rounded-xl border border-dashed border-gray-200 p-3 flex items-center justify-center">
                        <span className="text-xs text-gray-400 text-center leading-relaxed">
                          <Trans t={t} i18nKey="ui.moreBadgesToDiscover" values={{ count: lockedBadges.length - LOCKED_PREVIEW }}><br /></Trans>
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/subscription"
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm"
                  >
                    {t('ui.unlockAllProBadges')}
                  </Link>
                </>
              )}

              {/* Badges pas encore obtenus, avec progression — accessibles au plan actuel */}
              {notEarnedBadges.length > 0 && (
                <>
                  <div className="mt-5 mb-3 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-xs font-medium text-gray-400 px-2">
                      {t('ui.toUnlockCount', { count: notEarnedBadges.length })}
                    </span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {notEarnedBadges.map((badge) => (
                      <div key={badge.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <div className="font-semibold text-sm mb-0.5 text-gray-600">{t(`badges.${badge.id}.title`)}</div>
                        <div className="text-xs text-gray-500 mb-2">{t(`badges.${badge.id}.desc`)}</div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-400 rounded-full transition-all"
                            style={{ width: `${badge.percent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 text-right">{badge.percent}%</div>
                      </div>
                    ))}
                  </div>
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
