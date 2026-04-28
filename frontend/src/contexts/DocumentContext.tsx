// frontend/src/contexts/DocumentContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Document } from '../types';

interface DocumentContextType {
  currentDocument: Document | null;
  setCurrentDocument: (doc: Document | null) => void;
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <DocumentContext.Provider
      value={{
        currentDocument,
        setCurrentDocument,
        documents,
        setDocuments,
        loading,
        setLoading,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};