import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const redirectTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'question',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Récupérer les infos de l'utilisateur si connecté
    const fetchUser = async () => {
      // Vérifier d'abord si un token existe
      const token = localStorage.getItem('token');
      if (!token) {
        // Pas de token, utilisateur non connecté
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data.user;
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.first_name || userData.name || '',
          email: userData.email || ''
        }));
      } catch (error) {
        // Erreur lors de la récupération (token invalide ou expiré)
        // L'intercepteur va gérer la déconnexion
      }
    };

    fetchUser();

    // Nettoyer le timeout quand le composant est démonté
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Nettoyer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!user) {
      if (!formData.name.trim()) {
        newErrors.name = 'Le nom est requis';
      }

      if (!formData.email.trim()) {
        newErrors.email = "L'email est requis";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "L'email est invalide";
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    } else if (formData.subject.length > 200) {
      newErrors.subject = 'Le sujet ne peut pas dépasser 200 caractères';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.length > 5000) {
      newErrors.message = 'Le message ne peut pas dépasser 5000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/contact', formData);

      setSuccess(true);
      setFormData({
        name: user?.first_name || user?.name || '',
        email: user?.email || '',
        category: 'question',
        subject: '',
        message: ''
      });

      // Scroll en haut pour voir le message de succès
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Rediriger après 7 secondes (vers dashboard si connecté, sinon landing)
      redirectTimeoutRef.current = setTimeout(() => {
        if (user) {
          navigate('/my-projects');
        } else {
          navigate('/');
        }
      }, 7000);

    } catch (error) {
      if (error.response?.status === 429) {
        setErrors({ general: 'Trop de messages envoyés. Veuillez réessayer dans 1 heure.' });
      } else if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: "Erreur lors de l'envoi du message. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'bug', label: 'Signaler un bug', emoji: '🐛', description: 'Un problème technique ou une erreur' },
    { value: 'question', label: 'Poser une question', emoji: '❓', description: 'Besoin d\'aide ou d\'informations' },
    { value: 'suggestion', label: 'Suggérer une amélioration', emoji: '💡', description: 'Une idée pour améliorer YarnFlow' },
    { value: 'other', label: 'Autre', emoji: '📧', description: 'Toute autre demande' }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-sage-50 pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Message envoyé avec succès !
            </h1>
            <p className="text-gray-600 mb-6">
              Merci pour votre message. Nous vous répondrons dans les plus brefs délais à l'adresse : <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {user
                ? "Vous allez être redirigé vers vos projets dans quelques secondes..."
                : "Vous allez être redirigé vers l'accueil dans quelques secondes..."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  // Annuler la redirection automatique
                  if (redirectTimeoutRef.current) {
                    clearTimeout(redirectTimeoutRef.current);
                  }
                  // Réinitialiser le formulaire
                  setSuccess(false);
                  setFormData({
                    name: user?.first_name || user?.name || '',
                    email: user?.email || '',
                    category: 'question',
                    subject: '',
                    message: ''
                  });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Envoyer un autre message
              </button>
              <button
                onClick={() => {
                  // Annuler la redirection automatique avant de rediriger manuellement
                  if (redirectTimeoutRef.current) {
                    clearTimeout(redirectTimeoutRef.current);
                  }
                  navigate(user ? '/my-projects' : '/');
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                {user ? 'Retour à mes projets' : "Retour à l'accueil"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sage-50 pt-20 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Contactez-nous
            </h1>
            <p className="text-gray-600">
              Une question, un bug, une suggestion ? Nous sommes là pour vous aider !
            </p>
          </div>

          {/* Erreur générale */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom (si non connecté) */}
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre nom"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email (si non connecté) */}
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="votre.email@exemple.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Catégorie *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.category === cat.value
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={formData.category === cat.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{cat.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{cat.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sujet * <span className="text-xs text-gray-500">({formData.subject.length}/200)</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                maxLength={200}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Résumé de votre message en quelques mots"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message * <span className="text-xs text-gray-500">({formData.message.length}/5000)</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={8}
                maxLength={5000}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Décrivez votre demande en détail..."
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </div>
          </form>

          {/* Info contact direct */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Vous pouvez aussi nous contacter directement à{' '}
              <a
                href="mailto:contact@yarnflow.fr"
                className="text-primary hover:underline font-medium"
              >
                contact@yarnflow.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
