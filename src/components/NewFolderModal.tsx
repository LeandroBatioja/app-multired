'use client';

import { useState } from 'react';
import { useFiles } from '@/context/FilesContext';

export default function NewFolderModal({ onClose }: { onClose: () => void }) {
  const { createFolder } = useFiles();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createFolder(name.trim());
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al crear carpeta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la carpeta"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
          if (e.key === 'Escape') onClose();
        }}
      />
      <button
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creando...' : 'Crear'}
      </button>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}
