'use client';

import { useFiles } from '@/context/FilesContext';
import { FolderData } from '@/lib/api';

export default function FolderCard({ folder }: { folder: FolderData }) {
  const { enterFolder, deleteFolder } = useFiles();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta carpeta y todo su contenido?')) {
      await deleteFolder(folder.id);
    }
  };

  return (
    <div
      onClick={() => enterFolder(folder.id)}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {folder.name}
          </h3>
          {folder.created_at && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date(folder.created_at).toLocaleDateString('es')}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
