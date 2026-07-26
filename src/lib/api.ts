const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    throw new Error('No autorizado');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error del servidor' }));
    const err = new Error(error.detail || 'Error del servidor');
    (err as any).status = res.status;
    throw err;
  }

  return res.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, name: string, password: string) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),

  me: () => request<any>('/auth/me'),
};

// Files
export interface FileData {
  id: number;
  name: string;
  original_name: string | null;
  size: number;
  extension: string | null;
  folder_id: number | null;
  synced: boolean;
  backup_locations: number;
  deleted: boolean;
  created_at: string | null;
  updated_at: string | null;
  shared_with: string[];
}

export const filesApi = {
  list: (folderId?: number | null, showDeleted = false) => {
    const params = new URLSearchParams();
    if (folderId !== undefined && folderId !== null) params.set('folder_id', String(folderId));
    if (showDeleted) params.set('show_deleted', 'true');
    const qs = params.toString();
    return request<FileData[]>(`/files${qs ? `?${qs}` : ''}`);
  },

  upload: async (file: File, folderId?: number | null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== undefined && folderId !== null) {
      formData.append('folder_id', String(folderId));
    }
    const token = getToken();
    const res = await fetch(`${API_BASE}/files/upload${folderId ? `?folder_id=${folderId}` : ''}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error al subir' }));
      const err = new Error(error.detail || 'Error al subir');
      (err as any).status = res.status;
      throw err;
    }
    return res.json();
  },

  get: (id: number) => request<FileData>(`/files/${id}`),

  rename: (id: number, name: string) =>
    request<FileData>(`/files/${id}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  move: (id: number, folderId: number | null) =>
    request<FileData>(`/files/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ folder_id: folderId }),
    }),

  delete: (id: number, permanent = false) =>
    request<any>(`/files/${id}?permanent=${permanent}`, { method: 'DELETE' }),

  restore: (id: number) =>
    request<any>(`/files/${id}/restore`, { method: 'POST' }),

  versions: (id: number) =>
    request<any[]>(`/files/${id}/versions`),

  verify: (id: number) =>
    request<any>(`/files/${id}/verify`, { method: 'POST' }),

  storageStats: () => request<any>('/files/stats/storage'),

  getPreviewUrl: (id: number) => {
    const token = getToken();
    return `${API_BASE}/files/${id}/preview?token=${token}`;
  },

  getDownloadUrl: (id: number) => {
    const token = getToken();
    return `${API_BASE}/files/${id}/download?token=${token}`;
  },
};

// Folders
export interface FolderData {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string | null;
}

export const foldersApi = {
  list: (parentId?: number | null) => {
    const params = new URLSearchParams();
    if (parentId !== undefined && parentId !== null) params.set('parent_id', String(parentId));
    const qs = params.toString();
    return request<FolderData[]>(`/folders${qs ? `?${qs}` : ''}`);
  },

  create: (name: string, parentId?: number | null) =>
    request<FolderData>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId }),
    }),

  rename: (id: number, name: string) =>
    request<FolderData>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  delete: (id: number) =>
    request<any>(`/folders/${id}`, { method: 'DELETE' }),
};

// Shares
export const sharesApi = {
  create: (fileId: number, email: string, permission = 'viewer') =>
    request<any>(`/shares/${fileId}`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),

  list: (fileId: number) =>
    request<any[]>(`/shares/${fileId}`),

  sharedWithMe: () =>
    request<any[]>('/shares/shared-with-me'),

  revoke: (shareId: number) =>
    request<any>(`/shares/${shareId}`, { method: 'DELETE' }),
};

// Notifications
export interface NotificationData {
  id: number;
  message: string;
  read: boolean;
  created_at: string | null;
}

export const notificationsApi = {
  list: () => request<NotificationData[]>('/notifications'),
  unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
};
