// api/documents.js
import apiClient, { getCurrentUserId } from './apiClient';

// Get user projects
export const getUserProjects = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('getUserProjects: no authenticated user yet -> returning empty list');
      return [];
    }
    const response = await apiClient.get(`/api/v1/projects/${userId}`);
    return response.data.projects; // { projects: [...] }
  } catch (error) {
    console.error('Get user projects error:', error);
    throw error;
  }
};

// Upload document (requires user)
export const uploadDocument = async (file, projectId, title, docId = null) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    if (!projectId) throw new Error('Missing projectId');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);     // FastAPI expects snake_case form fields
    formData.append('project_id', projectId);
    formData.append('title', title);
    if (docId) formData.append('doc_id', docId);

    const response = await apiClient.post('/api/v1/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

// Get document PDF binary
export const getDocument = async (projectId, docId) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    if (!projectId || !docId) throw new Error('Missing identifiers');

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${projectId}/${docId}`,
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error('Get document error:', error);
    throw error;
  }
};

// Get document text content
export const getDocumentText = async (projectId, docId) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    if (!projectId || !docId) throw new Error('Missing identifiers');

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${projectId}/${docId}/text`
    );
    return response.data;
  } catch (error) {
    console.error('Get document text error:', error);
    throw error;
  }
};

// List documents for a project
export const getProjectDocuments = async (projectId) => {
  try {
    if (!projectId) {
      console.warn('getProjectDocuments: no projectId -> returning empty list');
      return [];
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('getProjectDocuments: no authenticated user yet -> returning empty list');
      return [];
    }

    const response = await apiClient.get(`/api/v1/documents/${userId}/${projectId}`);
    return response.data.documents; // { documents: [...] }
  } catch (error) {
    console.error('Get project documents error:', error);
    throw error;
  }
};

// PDF helpers
export const createPDFBlobUrl = (pdfBlob) =>
  URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));

export const downloadDocument = async (projectId, docId, filename) => {
  try {
    const pdfBlob = await getDocument(projectId, docId);
    const url = createPDFBlobUrl(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `document_${docId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download document error:', error);
    throw error;
  }
};
