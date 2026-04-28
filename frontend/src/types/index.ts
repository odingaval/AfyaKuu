// frontend/src/types/index.ts
export interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    pages?: number;
    format: string;
    size: number;
    extractedTextLength: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}