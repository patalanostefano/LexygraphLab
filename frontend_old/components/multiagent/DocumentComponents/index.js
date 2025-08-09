// DocumentComponents/index.js - Export di tutti i componenti per documenti

export { default as DocumentEditorDialog } from './DocumentEditorDialog';
export { default as ArtifactFullScreenDialog } from './ArtifactFullScreenDialog';
export { default as DocumentPreviewDialog } from './DocumentPreviewDialog'; // AGGIUNTO
export { default as DocumentUploader } from './DocumentUploader';
export { default as DocumentItem } from './DocumentItem';
export { DocumentProcessingStatus } from './DocumentProcessingStatus';

// Export delle utility per documenti
export * from './documentUtils';