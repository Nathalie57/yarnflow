/**
 * @file useAnalytics.js
 * @brief Hook personnalisé pour Google Analytics 4
 * @author YarnFlow Team
 * @created 2025-11-27
 */

import { useEffect } from 'react'

/**
 * Hook pour tracker les événements Google Analytics
 */
export const useAnalytics = () => {
  /**
   * Tracker un événement personnalisé
   * @param {string} eventName - Nom de l'événement
   * @param {object} params - Paramètres de l'événement
   */
  const trackEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params)
      console.log('[Analytics] Event tracked:', eventName, params)
    } else {
      console.log('[Analytics] GA not loaded, event not tracked:', eventName)
    }
  }

  /**
   * Tracker une vue de page
   * @param {string} pageTitle - Titre de la page
   * @param {string} pagePath - Chemin de la page
   */
  const trackPageView = (pageTitle, pagePath) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath
      })
    }
  }

  /**
   * Tracker une inscription waitlist
   * @param {string} email - Email de l'inscrit
   */
  const trackWaitlistSignup = (email) => {
    trackEvent('waitlist_signup', {
      event_category: 'engagement',
      event_label: 'Waitlist Subscription',
      value: 1,
      email_domain: email ? email.split('@')[1] : 'unknown'
    })

    // Aussi envoyer une conversion pour Google Ads si configuré
    trackEvent('conversion', {
      send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL' // À remplacer si Google Ads
    })
  }

  /**
   * Tracker un scroll depth
   * @param {number} percentage - Pourcentage de scroll (25, 50, 75, 100)
   */
  const trackScrollDepth = (percentage) => {
    trackEvent('scroll', {
      event_category: 'engagement',
      event_label: `Scroll ${percentage}%`,
      value: percentage
    })
  }

  /**
   * Tracker un clic sur un lien externe
   * @param {string} url - URL du lien
   * @param {string} label - Label du lien
   */
  const trackOutboundLink = (url, label) => {
    trackEvent('click', {
      event_category: 'outbound',
      event_label: label || url,
      value: url
    })
  }

  return {
    trackEvent,
    trackPageView,
    trackWaitlistSignup,
    trackScrollDepth,
    trackOutboundLink
  }
}

/**
 * Hook pour tracker automatiquement le scroll depth
 */
export const useScrollTracking = () => {
  const { trackScrollDepth } = useAnalytics()

  useEffect(() => {
    const scrollMilestones = { 25: false, 50: false, 75: false, 100: false }

    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollPercentage = Math.round(((scrollTop + windowHeight) / documentHeight) * 100)

      // Tracker les jalons de scroll
      Object.keys(scrollMilestones).forEach(milestone => {
        if (scrollPercentage >= parseInt(milestone) && !scrollMilestones[milestone]) {
          scrollMilestones[milestone] = true
          trackScrollDepth(parseInt(milestone))
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [trackScrollDepth])
}

export default useAnalytics
