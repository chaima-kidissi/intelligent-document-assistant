import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import keycloak from '../keycloak';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = (keycloak.authServerUrl || (keycloak as any).url || 'http://localhost:8080').replace(/\/$/, '');
      const realm = keycloak.realm || 'rag-realm';
      const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', keycloak.clientId || 'react-client');
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = response.data;

      if (access_token && refresh_token) {
        localStorage.setItem('kc_token', access_token);
        localStorage.setItem('kc_refreshToken', refresh_token);
        window.location.reload();
      } else {
        throw new Error("Jetons d'accès manquants.");
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response && err.response.status === 401) {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Impossible de contacter le serveur d'authentification. Vérifiez votre connexion.");
      } else {
        setError(err.response?.data?.error_description || "Une erreur s'est produite lors de la connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Decorative premium background gradient elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg rounded-2xl border shadow-xl p-8 relative z-10 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: '32px' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ marginBottom: '16px' }}
          >
            <img
              src="/addinn-logo.png"
              alt="Addinn"
              className="h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </motion.div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}
          >
            Bienvenue
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Connectez-vous pour accéder à l'assistant RAG
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-start gap-3 border text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--color-text-primary)',
              marginBottom: '20px',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Username Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="username"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)', display: 'block' }}
            >
              Nom d'utilisateur
            </label>
            <div className="relative group" style={{ width: '100%' }}>
              <span
                className="absolute inset-y-0 left-0 flex items-center pointer-events-none"
                style={{
                  color: 'var(--color-text-muted)',
                  width: '44px',
                  justifyContent: 'center',
                  paddingLeft: '14px',
                }}
              >
                <User className="w-5 h-5 transition-colors duration-200 group-focus-within:text-[var(--color-primary)]" />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                placeholder="Ex. admin"
                className="w-full rounded-xl border text-sm transition-all duration-200 focus:outline-none disabled:opacity-50"
                style={{
                  height: '48px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  backgroundColor: 'var(--color-input-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(21, 101, 192, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                  e.target.style.boxShadow = 'var(--shadow-sm)';
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)', display: 'block' }}
            >
              Mot de passe
            </label>
            <div className="relative group" style={{ width: '100%' }}>
              <span
                className="absolute inset-y-0 left-0 flex items-center pointer-events-none"
                style={{
                  color: 'var(--color-text-muted)',
                  width: '44px',
                  justifyContent: 'center',
                  paddingLeft: '14px',
                }}
              >
                <Lock className="w-5 h-5 transition-colors duration-200 group-focus-within:text-[var(--color-primary)]" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full rounded-xl border text-sm transition-all duration-200 focus:outline-none disabled:opacity-50"
                style={{
                  height: '48px',
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  backgroundColor: 'var(--color-input-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(21, 101, 192, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                  e.target.style.boxShadow = 'var(--shadow-sm)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer disabled:opacity-50"
                style={{ width: '44px', justifyContent: 'center', paddingRight: '14px' }}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              height: '48px',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)';
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <span>Se connecter</span>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
