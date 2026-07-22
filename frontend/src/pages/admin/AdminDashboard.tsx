import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Shield, TrendingUp, Loader2 } from 'lucide-react';
import { fetchAdminStats } from '../../services/api';
import type { AdminStats } from '../../types/auth';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAdminStats();
        setStats({
          totalUsers: data.user_count,
          totalDocuments: data.document_count,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques", error);
        setStats({ totalUsers: 0, totalDocuments: 0 });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats?.totalUsers ?? 0,
      icon: <Users size={24} />,
      delay: 0.1
    },
    {
      title: 'Total Documents',
      value: stats?.totalDocuments ?? 0,
      icon: <FileText size={24} />,
      delay: 0.2
    },
    {
      title: 'Performances',
      value: 'Optimal',
      icon: <TrendingUp size={24} />,
      delay: 0.3
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Tableau de bord
        </h1>
        <p className="mt-2 capitalize font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {today}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: card.delay }}
            className="rounded-2xl p-6 relative overflow-hidden group shadow-lg border"
            style={{ 
              backgroundColor: 'var(--color-bg-card)', 
              borderColor: 'var(--color-border)' 
            }}
          >
            <div 
              className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-2xl" 
              style={{ backgroundColor: 'var(--color-primary)' }} 
            />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {card.title}
                </p>
                <h3 className="text-4xl font-bold stat-value" style={{ color: 'var(--color-text-primary)' }}>
                  {card.value}
                </h3>
              </div>
              <div 
                className="p-4 rounded-2xl shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-primary)', 
                  color: 'white' 
                }}
              >
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-2xl p-8 relative overflow-hidden shadow-md border"
        style={{ 
          backgroundColor: 'var(--color-bg-card)', 
          borderColor: 'var(--color-primary)',
          boxShadow: '0 4px 20px rgba(21, 101, 192, 0.1)' 
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
          <div 
            className="p-4 rounded-2xl flex-shrink-0"
            style={{ 
              backgroundColor: 'rgba(21, 101, 192, 0.1)', 
              color: 'var(--color-primary)' 
            }}
          >
            <Shield size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Bienvenue sur le portail d'administration
            </h2>
            <p className="max-w-2xl leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Vous avez un accès complet pour gérer les utilisateurs, surveiller les statistiques et contrôler les documents de la base de connaissances. Utilisez la barre de navigation latérale pour accéder aux différentes sections.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
