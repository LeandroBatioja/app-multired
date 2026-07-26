'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { filesApi, foldersApi, FileData, FolderData } from '@/lib/api';

interface FilesContextType {
  files: FileData[];
  folders: FolderData[];
  loading: boolean;
  currentFolderId: number | null;
  storageStats: { used: number; total: number; file_count: number } | null;
  loadFiles: (folderId?: number | null) => Promise<void>;
  loadFolders: (parentId?: number | null) => Promise<void>;
  loadStorageStats: () => Promise<void>;
  enterFolder: (folderId: number) => void;
  goBack: () => void;
  uploadFile: (file: File) => Promise<FileData>;
  createFolder: (name: string) => Promise<FolderData>;
  renameFile: (id: number, name: string) => Promise<void>;
  deleteFile: (id: number, permanent?: boolean) => Promise<void>;
  restoreFile: (id: number) => Promise<void>;
  renameFolder: (id: number, name: string) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
  trashFiles: FileData[];
  loadTrash: () => Promise<void>;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export function FilesProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [trashFiles, setTrashFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderHistory, setFolderHistory] = useState<(number | null)[]>([]);
  const [storageStats, setStorageStats] = useState<{ used: number; total: number; file_count: number } | null>(null);

  const loadFiles = useCallback(async (folderId?: number | null) => {
    setLoading(true);
    try {
      const data = await filesApi.list(folderId ?? currentFolderId);
      setFiles(data);
    } catch (e) {
      console.error('Error loading files:', e);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  const loadFolders = useCallback(async (parentId?: number | null) => {
    try {
      const data = await foldersApi.list(parentId ?? currentFolderId);
      setFolders(data);
    } catch (e) {
      console.error('Error loading folders:', e);
    }
  }, [currentFolderId]);

  const loadStorageStats = useCallback(async () => {
    try {
      const data = await filesApi.storageStats();
      setStorageStats(data);
    } catch (e) {
      console.error('Error loading storage stats:', e);
    }
  }, []);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const data = await filesApi.list(undefined, true);
      setTrashFiles(data.filter((f) => f.deleted));
    } catch (e) {
      console.error('Error loading trash:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const enterFolder = useCallback((folderId: number) => {
    setFolderHistory((prev) => [...prev, currentFolderId]);
    setCurrentFolderId(folderId);
  }, [currentFolderId]);

  const goBack = useCallback(() => {
    const newHistory = [...folderHistory];
    const prev = newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(prev ?? null);
  }, [folderHistory]);

  const uploadFile = useCallback(async (file: File) => {
    const result = await filesApi.upload(file, currentFolderId);
    setFiles((prev) => [result, ...prev]);
    loadStorageStats();
    return result;
  }, [currentFolderId, loadStorageStats]);

  const createFolder = useCallback(async (name: string) => {
    const result = await foldersApi.create(name, currentFolderId);
    setFolders((prev) => [...prev, result]);
    return result;
  }, [currentFolderId]);

  const renameFile = useCallback(async (id: number, name: string) => {
    const result = await filesApi.rename(id, name);
    setFiles((prev) => prev.map((f) => (f.id === id ? result : f)));
  }, []);

  const deleteFile = useCallback(async (id: number, permanent = false) => {
    await filesApi.delete(id, permanent);
    if (permanent) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setTrashFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
    loadStorageStats();
  }, [loadStorageStats]);

  const restoreFile = useCallback(async (id: number) => {
    await filesApi.restore(id);
    setTrashFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const renameFolder = useCallback(async (id: number, name: string) => {
    const result = await foldersApi.rename(id, name);
    setFolders((prev) => prev.map((f) => (f.id === id ? result : f)));
  }, []);

  const deleteFolder = useCallback(async (id: number) => {
    await foldersApi.delete(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <FilesContext.Provider
      value={{
        files, folders, loading, currentFolderId, storageStats, trashFiles,
        loadFiles, loadFolders, loadStorageStats, loadTrash,
        enterFolder, goBack,
        uploadFile, createFolder,
        renameFile, deleteFile, restoreFile,
        renameFolder, deleteFolder,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FilesContext);
  if (!context) throw new Error('useFiles must be used within FilesProvider');
  return context;
}
