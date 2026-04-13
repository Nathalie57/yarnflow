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
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data.user;
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.first_name || userData.name || '',
          email: userData.email || ''
        }));
      } catch (error) {}
    };
    fetchUser();
    return () => { if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current); };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!user) {
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!formData.email.trim()) newErrors.email = "L'email est requis";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "L'email est invalide";
    }
    if (!formData.subject.trim()) newErrors.subject = 'Le sujet est requis';
    else if (formData.subject.length > 200) newErrors.subject = 'Le sujet ne peut pas dépasser 200 caractères';
    if (!formData.message.trim()) newErrors.message = 'Le message est requis';
    else if (formData.message.length > 5000) newErrors.message = 'Le message ne peut pas dépasser 5000 caractères';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData({ name: user?.first_name || user?.name || '', email: user?.email || '', category: 'question', subject: '', message: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(user ? '/my-projects' : '/');
      }, 7000);
    } catch (error) {
      if (error.response?.status === 429) {
        setErrors({ general: 'Trop de messages envoyés. Veuillez réessayer dans 1 heure.' });
      } else {
        setErrors({ general: error.response?.data?.error || "Erreur lors de l'envoi du message. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      value: 'bug', label: 'Signaler un bug', description: 'Un problème technique ou une erreur',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6l4-4 4 4"/><path d="M2 11h20"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
    },
    {
      value: 'question', label: 'Poser une question', description: "Besoin d'aide ou d'informations",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    },
    {
      value: 'suggestion', label: 'Suggérer une amélioration', description: 'Une idée pour améliorer YarnFlow',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    },
    {
      value: 'other', label: 'Autre', description: 'Toute autre demande',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    }
  ];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Message envoyé</h1>
          <p className="text-gray-600 mb-1">
            Merci ! Nous vous répondrons à <strong>{formData.email || user?.email}</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {user ? "Redirection vers vos projets dans quelques secondes..." : "Redirection vers l'accueil dans quelques secondes..."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
                setSuccess(false);
                setFormData({ name: user?.first_name || user?.name || '', email: user?.email || '', category: 'question', subject: '', message: '' });
              }}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Envoyer un autre message
            </button>
            <button
              onClick={() => { if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current); navigate(user ? '/my-projects' : '/'); }}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
            >
              {user ? 'Retour à mes projets' : "Retour à l'accueil"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Contactez-nous</h1>
          <p className="text-gray-500 text-sm">Une question, un bug, une suggestion ? Nous lisons tous les messages.</p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom + Email (si non connecté) */}
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Votre nom"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="votre@email.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>
          )}

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.category === cat.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="category" value={cat.value} checked={formData.category === cat.value} onChange={handleChange} className="sr-only" />
                  <span className={`flex-shrink-0 mt-0.5 ${formData.category === cat.value ? 'text-primary-600' : 'text-gray-400'}`}>
                    {cat.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{cat.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cat.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sujet <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 font-normal ml-2">{formData.subject.length}/200</span>
            </label>
            <input
              type="text" name="subject" value={formData.subject} onChange={handleChange} maxLength={200}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.subject ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Résumé en quelques mots"
            />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 font-normal ml-2">{formData.message.length}/5000</span>
            </label>
            <textarea
              name="message" value={formData.message} onChange={handleChange} rows={6} maxLength={5000}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm ${errors.message ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Décrivez votre demande en détail..."
            />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={() => navigate(-1)} disabled={loading}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Ou directement à{' '}
            <a href="mailto:contact@yarnflow.fr" className="text-primary-600 hover:underline font-medium">
              contact@yarnflow.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
