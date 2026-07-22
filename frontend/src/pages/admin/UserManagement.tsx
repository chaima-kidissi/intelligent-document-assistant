import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Edit, Trash2, Shield, X, Loader2 } from 'lucide-react';
import { fetchUsers, createUser, updateUserRoles, deleteUser } from '../../services/api';
import type { KeycloakUser } from '../../types/auth';

export default function UserManagement() {
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<KeycloakUser | null>(null);
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erreur de chargement des utilisateurs', err);
      setError('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await createUser({
        username: formData.username,
        password: formData.password,
        roles: [formData.role]
      });
      setShowCreateModal(false);
      setFormData({ username: '', password: '', role: 'user' });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await updateUserRoles(selectedUser.id, [formData.role]);
      setShowEditModal(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour des rôles');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
      try {
        await deleteUser(userId);
        await loadUsers();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const openEditModal = (user: KeycloakUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.realmRoles?.includes('admin') ? 'admin' : 'user'
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Gestion des Utilisateurs</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <UserPlus size={18} />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        {/* Toolbar */}
        <div className="p-4 border-b flex gap-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none transition-all"
              style={{ 
                paddingLeft: '2.5rem',
                backgroundColor: 'var(--color-bg-primary)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : (
            <table className="admin-table w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Utilisateur</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Rôles</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Statut</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={user.id} 
                      className="group transition-colors"
                    >
                      <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)' }}>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: 'var(--color-bg-sidebar)', color: 'var(--color-text-secondary)' }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          {user.username}
                        </div>
                      </td>
                      <td className="p-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <div className="flex gap-2">
                          {user.realmRoles?.includes('admin') && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                              <Shield size={10} /> Admin
                            </span>
                          )}
                          {(user.realmRoles?.includes('user') || !user.realmRoles?.includes('admin')) && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--color-secondary)', color: 'white' }}>
                              User
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {user.enabled ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="p-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--color-text-secondary)' }}
                            title="Modifier les rôles"
                          >
                            <Edit size={16} />
                          </button>
                          {user.username !== 'admin' && (
                            <button 
                              onClick={() => handleDelete(user.id, user.username)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              style={{ color: 'var(--color-text-secondary)' }}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modals */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl shadow-xl w-full max-w-md overflow-hidden border"
              style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {showCreateModal ? 'Nouvel utilisateur' : 'Modifier les rôles'}
                </h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="p-1 transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    required
                    disabled={showEditModal}
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border outline-none disabled:opacity-50"
                    style={{ 
                      backgroundColor: 'var(--color-input-bg)', 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                {showCreateModal && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border outline-none"
                      style={{ 
                        backgroundColor: 'var(--color-input-bg)', 
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Rôle
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border outline-none"
                    style={{ 
                      backgroundColor: 'var(--color-input-bg)', 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <option value="user">Utilisateur (Standard)</option>
                    <option value="admin">Administrateur (Complet)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {showCreateModal ? 'Créer' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
