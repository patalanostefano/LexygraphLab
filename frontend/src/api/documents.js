// Fixed api/documents.js with improved auth consistency and error handling
import apiClient from './apiClient';

// Get user projects (NEW FUNCTION)
export const getUserProjects = async (contextUserId) => {
  try {
    if (!contextUserId) {
      throw new Error('User ID is required');
    }

    const userId = contextUserId;
    console.log(`📋 Fetching projects for user: ${userId}`);

    const response = await apiClient.get(`/api/v1/projects/${userId}`, {
      timeout: 10000,
    });

    console.log('✅ User projects API response:', response.data);
    return response.data.projects || [];
  } catch (error) {
    console.error('❌ Get user projects error:', error);

    if (error.message === 'User not authenticated') {
      throw error;
    } else if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to user projects');
    } else if (error.response?.status === 404) {
      console.log('ℹ️ No projects found for user, returning empty array');
      return [];
    }

    throw error;
  }
};

// Upload document (requires user)
export const uploadDocument = async (
  file,
  projectId,
  title,
  docId = null,
  contextUserId,
) => {
  try {
    if (!contextUserId) {
      throw new Error('User ID is required');
    }

    const userId = contextUserId; // FIX: Use consistent variable name

    // Validate inputs
    if (!projectId?.trim()) throw new Error('Missing or invalid project ID');
    if (!file) throw new Error('Missing file');
    if (!title?.trim()) throw new Error('Missing document title');

    console.log(
      `📤 Uploading document: "${title}" to project: ${projectId} for user: ${userId}`,
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId); // FastAPI expects snake_case
    formData.append('project_id', projectId.trim());
    formData.append('title', title.trim());
    if (docId?.trim()) formData.append('doc_id', docId.trim());

    const response = await apiClient.post(
      '/api/v1/documents/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000, // 30 second timeout for uploads
        // Add progress tracking if needed
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log(`📊 Upload progress: ${percentCompleted}%`);
        },
      },
    );

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
      throw new Error(
        'File too large. Please select a smaller PDF (max 10MB).',
      );
    } else if (error.response?.status === 415) {
      throw new Error('Invalid file type. Please select a PDF file.');
    } else if (error.response?.status === 422) {
      throw new Error(
        'Invalid file content. Please ensure the PDF is not corrupted.',
      );
    } else if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout')
    ) {
      throw new Error('Upload timeout. Please try again with a smaller file.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to server. Please check your connection.',
      );
    }

    throw new Error(
      error.response?.data?.message || error.message || 'Upload failed',
    );
  }
};

// Get document PDF binary
export const getDocument = async (projectId, docId, contextUserId) => {
  try {
    if (!contextUserId) {
      throw new Error('User ID is required');
    }

    const userId = contextUserId; // FIX: Use consistent variable name

    // Validate inputs
    if (!projectId?.trim() || !docId?.trim()) {
      throw new Error('Missing document identifiers');
    }

    console.log(
      `📄 Fetching document: ${docId} from project: ${projectId} for user: ${userId}`,
    );

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${encodeURIComponent(projectId.trim())}/${encodeURIComponent(docId.trim())}`,
      {
        responseType: 'blob',
        timeout: 15000, // 15 second timeout for document downloads
      },
    );

    // Verify we got a PDF
    if (response.data.type && !response.data.type.includes('pdf')) {
      console.warn('⚠️ Expected PDF but got:', response.data.type);
    }

    console.log(
      '✅ Document fetch successful, size:',
      response.data.size,
      'bytes',
    );
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
    } else if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout')
    ) {
      throw new Error('Download timeout. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to server. Please check your connection.',
      );
    }

    throw error;
  }
};

// Get document text content
export const getDocumentText = async (projectId, docId, contextUserId) => {
  try {
    if (!contextUserId) {
      throw new Error('User ID is required');
    }

    const userId = contextUserId; // FIX: Use consistent variable name

    if (!projectId?.trim() || !docId?.trim()) {
      throw new Error('Missing document identifiers');
    }

    console.log(
      `📝 Fetching text for document: ${docId} from project: ${projectId} for user: ${userId}`,
    );

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${encodeURIComponent(projectId.trim())}/${encodeURIComponent(docId.trim())}/text`,
      { timeout: 10000 },
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
    } else if (
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout')
    ) {
      throw new Error('Text loading timeout. Please try again.');
    }

    throw error;
  }
};

// List documents for a project
export const getProjectDocuments = async (projectId, contextUserId) => {
  try {
    if (!contextUserId) {
      throw new Error('User ID is required');
    }

    const userId = contextUserId; // FIX: Use consistent variable name
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(
      `📋 Fetching documents for project: ${projectId} for user: ${userId}`,
    );

    const response = await apiClient.get(
      `/api/v1/documents/${userId}/${encodeURIComponent(projectId.trim())}`,
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

// PDF helpers (with better error handling)
export const createPDFBlobUrl = (pdfBlob) => {
  try {
    return URL.createObjectURL(
      new Blob([pdfBlob], { type: 'application/pdf' }),
    );
  } catch (error) {
    console.error('❌ Error creating PDF blob URL:', error);
    throw new Error('Failed to create PDF preview');
  }
};

// FIX: downloadDocument also needs userId parameter
export const downloadDocument = async (
  projectId,
  docId,
  filename,
  contextUserId,
) => {
  try {
    console.log(`💾 Downloading document: ${docId} as: ${filename}`);

    const pdfBlob = await getDocument(projectId, docId, contextUserId);
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

// Orchestrator service integration
export const sendChatMessage = async (message, documentIds, userId, projectId) => {
  try {
    console.log(`💬 Sending chat message to orchestrator for user: ${userId}`);
    
    if (!message?.trim()) {
      throw new Error('Message is required');
    }
    
    if (!documentIds || documentIds.length === 0) {
      throw new Error('At least one document must be selected');
    }

    if (!userId || !projectId) {
      throw new Error('User ID and Project ID are required');
    }

    // Format document IDs as expected by the generation agent
    // The generation agent expects format: userId_projectId_docId
    const formattedDocIds = documentIds.map(docId => {
      // Handle different possible input formats
      if (typeof docId === 'string') {
        // If already formatted, use as-is
        if (docId.includes('_') && docId.split('_').length === 3) {
          return docId;
        }
        // Otherwise, format it
        return `${userId}_${projectId}_${docId}`;
      }
      return `${userId}_${projectId}_${docId}`;
    });

    const payload = {
      targetAgent: 'generation-agent',
      agentPayload: {
        agentId: 'generation-agent',
        prompt: message,
        documentIds: formattedDocIds,
        fullDoc: false // Can be made configurable later
      }
    };

    console.log('📤 Orchestrator payload:', payload);
    console.log('📄 Formatted document IDs:', formattedDocIds);

    const response = await apiClient.post('/api/v1/agents/route', payload, {
      timeout: 120000, // 2 minute timeout for AI generation
    });

    console.log('✅ Orchestrator response:', response.data);
    
    // Extract the generated content from the nested response structure
    const agentResponse = response.data?.agentResponse;
    const generatedContent = agentResponse?.response || agentResponse?.generated_content;
    
    if (!generatedContent) {
      throw new Error('No content generated by the agent');
    }

    return {
      success: true,
      content: generatedContent,
      agentId: agentResponse?.agentId || 'generation-agent',
      documentIds: formattedDocIds,
      fullResponse: response.data
    };

  } catch (error) {
    console.error('❌ Chat message error:', error);
    console.error('❌ Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      throw new Error('User not authenticated');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied');
    } else if (error.response?.status === 404) {
      throw new Error('Document not found. Please ensure the document exists and try again.');
    } else if (error.response?.status === 422) {
      throw new Error('Invalid request format');
    } else if (error.response?.status === 502) {
      throw new Error('AI service temporarily unavailable');
    } else if (error.response?.status === 504) {
      throw new Error('AI response timeout - please try again');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timeout - please try again');
    }

    // Include more specific error information
    const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message;
    throw new Error(errorMessage || 'Failed to get AI response');
  }
};
