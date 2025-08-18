// Fixed api/documents.js with improved auth consistency and error handling
import apiClient, { getCurrentUserId, getCachedUserId } from './apiClient';



// HELPER: Get user ID synchronously from context or fallback
const getUserIdReliably = (contextUserId = null) => {
  // Try context first (fastest and most reliable)
  if (contextUserId) {
    console.log('⚡ Using context user ID:', contextUserId);
    return contextUserId;
  }
  
  // Fallback to cached
  const cachedUserId = getCachedUserId();
  if (cachedUserId) {
    console.log('📦 Using cached user ID:', cachedUserId);
    return cachedUserId;
  }
  
  console.error('❌ No user ID available from context or cache');
  throw new Error('User not authenticated');
};
// Get user projects
export const getUserProjects = async (contextUserId = null) => {
  try {
    const userId = getUserIdReliably(contextUserId);
    
    console.log(`🗂️ Fetching projects for user: ${userId}`);
    const response = await apiClient.get(`/api/v1/projects/${userId}`);
    
    console.log('✅ Projects API response:', response.data);
    return response.data.projects || [];
  } catch (error) {
    console.error('❌ Get user projects error:', error);
    
    // Enhanced error handling
    if (error.message === 'User not authenticated') {
      throw error;
    } else if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to projects');
    } else if (error.response?.status === 404) {
      console.log('ℹ️ No projects found for user, returning empty array');
      return [];
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timeout. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    
    // Re-throw with context
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }
};

// Upload document (requires user)
export const uploadDocument = async (file, projectId, title, docId = null, contextUserId = null) => {
  try {
    const userId = await getUserIdReliably(contextUserId);
    
    // Validate inputs
    if (!projectId?.trim()) throw new Error('Missing or invalid project ID');
    if (!file) throw new Error('Missing file');
    if (!title?.trim()) throw new Error('Missing document title');

    console.log(`📤 Uploading document: "${title}" to project: ${projectId} for user: ${userId}`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);     // FastAPI expects snake_case
    formData.append('project_id', projectId.trim());
    formData.append('title', title.trim());
    if (docId?.trim()) formData.append('doc_id', docId.trim());

    const response = await apiClient.post('/api/v1/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30 second timeout for uploads
      // Add progress tracking if needed
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📊 Upload progress: ${percentCompleted}%`);
      }
    });
    
    console.log('✅ Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Document upload error:', error);
    
    // Enhanced upload error handling
    if (error.message === 'User not authenticated') {
      throw error;
    } else if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to upload documents');
    } else if (error.response?.status === 413) {
      throw new Error('File too large. Please select a smaller PDF (max 10MB).');
    } else if (error.response?.status === 415) {
      throw new Error('Invalid file type. Please select a PDF file.');
    } else if (error.response?.status === 422) {
      throw new Error('Invalid file content. Please ensure the PDF is not corrupted.');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Upload timeout. Please try again with a smaller file.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Upload failed');
  }
};

// Get document PDF binary
export const getDocument = async (projectId, docId, contextUserId = null) => {
  try {
    const userId = await getUserIdReliably(contextUserId);
    
    // Validate inputs
    if (!projectId?.trim() || !docId?.trim()) {
      throw new Error('Missing document identifiers');
    }

    console.log(`📄 Fetching document: ${docId} from project: ${projectId} for user: ${userId}`);

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${encodeURIComponent(projectId.trim())}/${encodeURIComponent(docId.trim())}`,
      { 
        responseType: 'blob',
        timeout: 15000 // 15 second timeout for document downloads
      }
    );
    
    // Verify we got a PDF
    if (response.data.type && !response.data.type.includes('pdf')) {
      console.warn('⚠️ Expected PDF but got:', response.data.type);
    }
    
    console.log('✅ Document fetch successful, size:', response.data.size, 'bytes');
    return response.data;
  } catch (error) {
    console.error('❌ Get document error:', error);
    
    if (error.message === 'User not authenticated') {
      throw error;
    } else if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to this document');
    } else if (error.response?.status === 404) {
      throw new Error('Document not found');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Download timeout. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please check your connection.');
    }
    
    throw error;
  }
};

// Get document text content
export const getDocumentText = async (projectId, docId, contextUserId = null) => {
  try {
    const userId = await getUserIdReliably(contextUserId);
    
    if (!projectId?.trim() || !docId?.trim()) {
      throw new Error('Missing document identifiers');
    }

    console.log(`📝 Fetching text for document: ${docId} from project: ${projectId} for user: ${userId}`);

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${encodeURIComponent(projectId.trim())}/${encodeURIComponent(docId.trim())}/text`,
      { timeout: 10000 }
    );
    
    console.log('✅ Document text fetch successful');
    return response.data;
  } catch (error) {
    console.error('❌ Get document text error:', error);
    
    if (error.message === 'User not authenticated') {
      throw error;
    } else if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to this document');
    } else if (error.response?.status === 404) {
      throw new Error('Document not found or text not available');
    } else if (error.response?.status === 422) {
      throw new Error('Document text could not be extracted');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Text loading timeout. Please try again.');
    }
    
    throw error;
  }
};

// List documents for a project
export const getProjectDocuments = async (projectId, contextUserId = null) => {
  try {
    if (!projectId?.trim()) {
      console.warn('⚠️ getProjectDocuments: no projectId provided');
      return [];
    }
    
    const userId = await getUserIdReliably(contextUserId);

    console.log(`📋 Fetching documents for project: ${projectId} for user: ${userId}`);

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${encodeURIComponent(projectId.trim())}`
    );
    
    console.log('✅ Project documents API response:', response.data);
    return response.data.documents || [];
  } catch (error) {
    console.error('❌ Get project documents error:', error);
    
    if (error.message === 'User not authenticated') {
      throw error;
    } else if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to project documents');
    } else if (error.response?.status === 404) {
      console.log('ℹ️ No documents found for project, returning empty array');
      return [];
    }
    
    throw error;
  }
};

// PDF helpers (unchanged but with better error handling)
export const createPDFBlobUrl = (pdfBlob) => {
  try {
    return URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
  } catch (error) {
    console.error('❌ Error creating PDF blob URL:', error);
    throw new Error('Failed to create PDF preview');
  }
};

export const downloadDocument = async (projectId, docId, filename) => {
  try {
    console.log(`💾 Downloading document: ${docId} as: ${filename}`);
    
    const pdfBlob = await getDocument(projectId, docId);
    const url = createPDFBlobUrl(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `document_${docId}.pdf`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    console.log('✅ Download initiated successfully');
  } catch (error) {
    console.error('❌ Download document error:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
};