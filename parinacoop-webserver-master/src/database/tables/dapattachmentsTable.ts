
export interface DapAttachmentsTable {
  id: number;
  dap_id: number;
  // Tipo del adjunto: 'receipt' | 'signed_document' (pero dejamos string por compatibilidad)
  type: 'receipt' | 'signed_document' | string;
  filename: string;
  storage_path: string;
  // RUN que subió el archivo; puede ser null en algunos casos
  uploaded_by_run: number | null;
  // Timestamps: Kysely puede mapear a string o Date según configuración; aceptar ambos es más flexible.
  created_at: string | Date;
  updated_at?: string | Date | null;

  // Metadata opcional (puede ser NULL en la BD)
  mime_type?: string | null;
  size?: number | null;
}

export interface Database {
  dap_attachments: DapAttachmentsTable;
  [table: string]: any;
}