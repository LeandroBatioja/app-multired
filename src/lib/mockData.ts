export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: string;
  modified: string;
  synced: boolean;
  sharedWith?: string[];
  backupLocations?: number;
  extension?: string;
}

export const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "Documentos",
    type: "folder",
    modified: "2026-07-20",
    synced: true,
    backupLocations: 2,
  },
  {
    id: "2",
    name: "Fotos",
    type: "folder",
    modified: "2026-07-19",
    synced: true,
    backupLocations: 2,
  },
  {
    id: "3",
    name: "Proyectos",
    type: "folder",
    modified: "2026-07-18",
    synced: false,
    backupLocations: 1,
  },
  {
    id: "4",
    name: "Informe_Final.pdf",
    type: "file",
    size: "2.4 MB",
    modified: "2026-07-21",
    synced: true,
    sharedWith: ["Ana", "Carlos"],
    backupLocations: 2,
    extension: "pdf",
  },
  {
    id: "5",
    name: "Presupuesto_2026.xlsx",
    type: "file",
    size: "156 KB",
    modified: "2026-07-22",
    synced: true,
    backupLocations: 2,
    extension: "xlsx",
  },
  {
    id: "6",
    name: "Presentacion.pptx",
    type: "file",
    size: "5.1 MB",
    modified: "2026-07-23",
    synced: false,
    sharedWith: ["Maria"],
    backupLocations: 1,
    extension: "pptx",
  },
  {
    id: "7",
    name: "Foto_Vacaciones.jpg",
    type: "file",
    size: "3.2 MB",
    modified: "2026-07-15",
    synced: true,
    backupLocations: 2,
    extension: "jpg",
  },
  {
    id: "8",
    name: "Notas_Reunion.txt",
    type: "file",
    size: "12 KB",
    modified: "2026-07-24",
    synced: true,
    backupLocations: 2,
    extension: "txt",
  },
];

export const mockNotifications = [
  {
    id: "1",
    message: "Informe_Final.pdf fue compartido contigo",
    time: "Hace 2 horas",
    read: false,
  },
  {
    id: "2",
    message: "Backup completado exitosamente",
    time: "Hace 5 horas",
    read: true,
  },
  {
    id: "3",
    message: "Carlos descargó Presupuesto_2026.xlsx",
    time: "Ayer",
    read: true,
  },
];

export const mockSharedFiles = [
  {
    id: "4",
    name: "Informe_Final.pdf",
    sharedBy: "Tu",
    sharedWith: [
      { name: "Ana", permission: "editor" },
      { name: "Carlos", permission: "viewer" },
    ],
    date: "2026-07-21",
  },
  {
    id: "6",
    name: "Presentacion.pptx",
    sharedBy: "Tu",
    sharedWith: [{ name: "Maria", permission: "editor" }],
    date: "2026-07-23",
  },
];

export const storageUsed = 15.2;
export const storageTotal = 50;
