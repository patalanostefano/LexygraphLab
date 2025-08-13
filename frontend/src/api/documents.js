import apiClient, { getCurrentUserId } from './apiClient';

// Upload document - GOES TO: localhost:8080/api/v1/documents/upload
export const uploadDocument = async (file, projectId, docId) => {
  try {
    const userId = await getCurrentUserId(); // Supabase Auth call
    if (!userId) throw new Error('User not authenticated');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('projectId', projectId);
    formData.append('docId', docId);

    // This goes to YOUR API GATEWAY, not Supabase
    const response = await apiClient.post('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data;
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

// Get document by ID - GOES TO: localhost:8080/api/v1/documents/{userId}/{projectId}/{docId} //project name = project id in the database
export const getDocument = async (projectId, docId) => {
  try {
    const userId = await getCurrentUserId(); // Supabase Auth call
    if (!userId) throw new Error('User not authenticated');

    // This goes to YOUR API GATEWAY, not Supabase
    const response = await apiClient.get(`/api/v1/documents/${userId}/${projectId}/${docId}`);
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

    const response = await apiClient.get(`/api/v1/documents/${userId}/${projectId}/${docId}/text`);
    return response.data;
  } catch (error) {
    console.error('Get document text error:', error);
    throw error;
  }
};

// List documents for a project
export const getProjectDocuments = async (projectId) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await apiClient.get(`/api/v1/documents/${userId}/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Get project documents error:', error);
    throw error;
  }
};

// List all user documents (you might want to add this endpoint to your backend)
export const getAllUserDocuments = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await apiClient.get(`/api/v1/documents/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get all user documents error:', error);
    throw error;
  }
};
