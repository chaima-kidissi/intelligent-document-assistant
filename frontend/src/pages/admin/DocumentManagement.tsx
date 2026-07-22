import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2, File as FileIcon, Search, Loader2 } from 'lucide-react';
import { fetchDocuments, uploadFile, deleteDocument } from '../../services/api';

interface Document {
  id: string;
  name: string;
  type: string;
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Erreur de chargement des documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert("Seuls les fichiers .docx sont supportés.");
      return;
    }
    
    setUploading(true);
    try {
      await uploadFile(file);
      await loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le document "${docName}" ?`)) {
      try {
        await deleteDocument(docName);
        await loadDocuments();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Gestion des Documents</h1>

      {/* Upload Zone */}
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: dragActive ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".docx" 
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} 
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: 'var(--color-primary)' }} />
              <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>Upload en cours...</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Indexation dans la base vectorielle</p>
            </>
          ) : (
            <>
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--color-hover)', color: 'var(--color-primary)' }}
              >
                <Upload size={28} />
              </div>
              <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>Cliquez ou glissez-déposez un fichier</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Seuls les fichiers Microsoft Word (.docx) sont supportés</p>
            </>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="rounded-2xl overflow-hidden shadow-sm mt-8 border" style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-sidebar)' }}>
          <div className="relative w-full sm:flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un document..."
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
          <div className="flex items-center text-sm font-medium sm:px-4" style={{ color: 'var(--color-text-muted)' }}>
            {filteredDocs.length} document(s)
          </div>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
              <FileIcon size={48} className="mx-auto mb-3 opacity-20" />
              <p>Aucun document trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredDocs.map((doc, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={doc.id || doc.name}
                  className="border rounded-xl p-4 flex items-start gap-4 group transition-colors shadow-sm hover:shadow-md"
                  style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
                >
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-hover)', color: 'var(--color-primary)' }}
                  >
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={doc.name}>
                      {doc.name}
                    </h4>
                    <div className="flex items-center mt-1">
                      <span 
                        className="text-xs font-bold uppercase px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--color-bg-sidebar)', color: 'var(--color-text-secondary)' }}
                      >
                        {doc.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.name)}
                    className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="Supprimer le document"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
