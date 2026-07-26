'use client';

import { useState, useEffect, useCallback } from 'react';
import { sharesApi, filesApi } from '@/lib/api';
import FilePreview from '@/components/FilePreview';

interface SharedItem {
  id: number;
  name: string;
  size: number;
  extension: string | null;
  shared_by: string;
  permission: string;
  created_at: string | null;
}

interface OwnedShare {
  file_id: number;
  file_name: string;
  extension: string | null;
  shared_with: { name: string; email: string; permission: string; share_id: number }[];
}

export default function CompartidoPage() {
  const [sharedWithMe, setSharedWithMe] = useState<SharedItem[]>([]);
  const [myShared, setMyShared] = useState<OwnedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'given'>('received');
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string; extension: string | null } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const received = await sharesApi.sharedWithMe();
      setSharedWithMe(received);

      const myFiles = await filesApi.list();
      const sharedFiles: OwnedShare[] = [];
      for (const file of myFiles) {
        if (file.shared_with.length > 0) {
          const shares = await sharesApi.list(file.id);
          sharedFiles.push({
            file_id: file.id,
            file_name: file.name,
            extension: file.extension,
            shared_with: shares.map((s: any) => ({
              name: s.shared_with_name,
              email: s.shared_with_email,
              permission: s.permission,
              share_id: s.id,
            })),
          });
        }
      }
      setMyShared(sharedFiles);
    } catch (e) {
      console.error('Error loading shares:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRevoke = async (shareId: number) => {
    if (confirm('¿Revocar acceso?')) {
      try {
        await sharesApi.revoke(shareId);
        loadData();
      } catch (e: any) {
        alert(e.message || 'Error al revocar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Compartido</h2>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'received'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Compartidos conmigo ({sharedWithMe.length})
        </button>
        <button
          onClick={() => setTab('given')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'given'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Que yo compartí ({myShared.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {tab === 'received' && (
            <div className="space-y-4">
              {sharedWithMe.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                  No hay archivos compartidos contigo
                </div>
              ) : (
                sharedWithMe.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <FileThumbnail file={item} onClick={() => setPreviewFile(item)} />
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-medium text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => setPreviewFile(item)}
                          >
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Compartido por <span className="font-medium text-gray-700 dark:text-gray-200">{item.shared_by}</span> · {item.permission === 'editor' ? 'Editor' : 'Visualizador'}
                          </p>
                          {item.size > 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatSize(item.size)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setPreviewFile(item)}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver
                          </button>
                          <a
                            href={filesApi.getDownloadUrl(item.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'given' && (
            <div className="space-y-4">
              {myShared.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                  No has compartido archivos aún
                </div>
              ) : (
                myShared.map((item) => (
                  <div key={item.file_id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <FileThumbnail file={{ id: item.file_id, name: item.file_name, extension: item.extension }} onClick={() => setPreviewFile({ id: item.file_id, name: item.file_name, extension: item.extension })} />
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-medium text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => setPreviewFile({ id: item.file_id, name: item.file_name, extension: item.extension })}
                          >
                            {item.file_name}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.shared_with.map((person) => (
                              <div key={person.share_id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                                  {person.name[0]}
                                </span>
                                <span className="text-sm text-gray-700 dark:text-gray-200">{person.name}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">({person.permission})</span>
                                <button
                                  onClick={() => handleRevoke(person.share_id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-medium ml-1"
                                >
                                  Revocar
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={filesApi.getDownloadUrl(item.file_id)}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {previewFile && (
        <FilePreview
          fileId={previewFile.id}
          fileName={previewFile.name}
          extension={previewFile.extension}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'pdf', 'docx', 'xlsx', 'xls'];

const thumbnailIconColors: Record<string, string> = {
  xlsx: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  xls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  pptx: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
  ppt: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
  txt: 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800',
  doc: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  docx: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  zip: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
  rar: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
  mp3: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  mp4: 'text-pink-500 bg-pink-50 dark:bg-pink-900/30',
};

function FileThumbnail({ file, onClick }: { file: { id: number; name: string; extension: string | null }; onClick: () => void }) {
  const ext = file.extension?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);

  if (isImage) {
    return (
      <div
        onClick={onClick}
        className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
      >
        <img
          src={filesApi.getPreviewUrl(file.id)}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (previewableExtensions.includes(ext)) {
    const colorClass = thumbnailIconColors[ext] || 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800';
    return (
      <div
        onClick={onClick}
        className={`w-16 h-16 flex-shrink-0 rounded-lg flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all ${colorClass}`}
      >
        <span className="text-xs font-bold uppercase">{ext}</span>
      </div>
    );
  }

  const colorClass = thumbnailIconColors[ext] || 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800';

  return (
    <div className={`w-16 h-16 flex-shrink-0 rounded-lg flex items-center justify-center ${colorClass}`}>
      <span className="text-xs font-bold uppercase">{ext || '?'}</span>
    </div>
  );
}
