import axios from 'axios';
import { getSupabaseClient } from '../config/supabaseClient.js';

// URL base del server (API backend)
const apiBaseUrl = 'https://ej9aw0b6h0.execute-api.eu-central-1.amazonaws.com/prod';

// Crea un'istanza di Axios con le impostazioni di base
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Funzione per ottenere l'utente corrente
export const getCurrentUser = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Errore nel recupero dei dati utente:', error);
    return null;
  }
};

// Interceptor per le richieste - SOLO aggiunge il token JWT, NON userId
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Authentication error from Supabase:', error);
        return Promise.reject(error);
      }
      
      // Se abbiamo un token, lo aggiungiamo SOLO all'header Authorization
      if (data?.session?.access_token) {
        console.log('Adding auth token to request');
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
        
        // NON aggiungere userId al body o al FormData
        // Il backend estrae l'userId dal token JWT
        
        // Log del body finale per debug (senza modifiche)
        console.log('Final request config:', {
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            Authorization: 'Bearer [token]' // Mostra che c'è il token senza esporre il valore completo
          },
          data: config.data instanceof FormData ? 'FormData' : config.data
        });
      } else {
        console.warn('No active session found when making API request');
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  error => Promise.reject(error)
);

// Interceptor per le risposte - con logging dettagliato per debug
apiClient.interceptors.response.use(
  response => {
    // Log delle risposte di successo per debug
    console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    // Log dettagliato degli errori
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Se è un errore 400, mostra i dettagli specifici
      if (error.response.status === 400) {
        console.error('Bad Request - Details:', error.response.data);
        
        // Se ci sono errori di validazione specifici, mostrali
        if (error.response.data?.error) {
          console.error('Validation error:', error.response.data.error);
        }
        if (error.response.data?.message) {
          console.error('Error message:', error.response.data.message);
        }
        if (error.response.data?.details) {
          console.error('Error details:', error.response.data.details);
        }
      }
    }
    
    if (error.response?.status === 401) {
      console.error('Errore di autenticazione - token non valido o scaduto');
    } else if (error.response?.status === 403) {
      console.error('Permesso negato - l\'utente non ha accesso a questa risorsa');
    } else if (error.response?.status >= 500) {
      console.error('Errore del server:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

//
// --- Document API functions ---
//
export const documentsApi = {
  // Upload a document
  uploadDocument: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Log del file per debug
      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Aggiungi parametri opzionali solo se definiti
      if (options.name) formData.append('name', options.name);
      if (options.description) formData.append('description', options.description);
      if (options.collectionId) formData.append('collectionId', options.collectionId);
      if (options.projectId) formData.append('projectId', options.projectId);
      if (options.processingType) formData.append('processingType', options.processingType);
      
      // NON aggiungere userId - il backend lo estrae dal token
      
      const response = await apiClient.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to upload document:', error);
      if (error.response) {
        console.error('Upload error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },
  
  // Create a document programmatically (without file upload)
  createDocument: async (documentData) => {
    try {
      // NON aggiungere userId - il backend lo estrae dal token
      const response = await apiClient.post('/documents/create', documentData);
      
      // Se viene specificato un projectId, collega il documento al progetto
      if (documentData.projectId) {
        try {
          await apiClient.post(`/projects/${documentData.projectId}/documents`, {
            documentId: response.data.id
          });
        } catch (linkError) {
          console.error('Errore nel collegamento del documento al progetto:', linkError);
        }
      }
      
      // Se viene specificato un collectionId, collega il documento alla collezione
      if (documentData.collectionId) {
        try {
          await apiClient.post(`/collections/${documentData.collectionId}/documents`, {
            documentId: response.data.id
          });
        } catch (linkError) {
          console.error('Errore nel collegamento del documento alla collezione:', linkError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  },
  
  // Get list of user's documents
  getUserDocuments: async (page = 1, limit = 20) => {
    try {
      // NON includere userId - il backend lo estrae dal token
      const response = await apiClient.get('/documents', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  },
  
  // Get document details
  getDocument: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get document content
  getDocumentContent: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/content`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get content for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Update document metadata
  updateDocument: async (documentId, updateData) => {
    try {
      // NON aggiungere userId - il backend lo estrae dal token
      const response = await apiClient.put(`/documents/${documentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Delete document
  deleteDocument: async (documentId) => {
    try {
      await apiClient.delete(`/documents/${documentId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get document processing status
  getDocumentStatus: async (documentId) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get status for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get document view URL
  getDocumentViewUrl: async (documentId, expiresIn = 3600) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/view-url`, {
        params: { expiresIn }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get view URL for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get document download URL
  getDocumentDownloadUrl: async (documentId, expiresIn = 3600) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/download-url`, {
        params: { expiresIn }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get download URL for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get document extracted text
  getExtractedText: async (documentId, options = {}) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/extracted-text`, {
        params: {
          page: options.page || 1,
          format: options.format || 'plain'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get extracted text for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get document summary
  getDocumentSummary: async (documentId, maxLength = 500) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/summary`, {
        params: { maxLength }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get summary for document ${documentId}:`, error);
      throw error;
    }
  }
};

//
// --- Collection API functions ---
//
export const collectionsApi = {
  // Get all collections for the current user
  getCollections: async (page = 1, limit = 20) => {
    try {
      // NON includere userId - il backend lo estrae dal token
      const response = await apiClient.get('/collections', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      throw error;
    }
  },
  
  // Create a new collection
  createCollection: async (name, description = '') => {
    try {
      // NON includere userId nel body - il backend lo estrae dal token
      const response = await apiClient.post('/collections', {
        name,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create collection:', error);
      // Log dettagliato per debug
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  },
  
  // Get collection details
  getCollection: async (collectionId) => {
    try {
      const response = await apiClient.get(`/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  // Update collection
  updateCollection: async (collectionId, updateData) => {
    try {
      // NON aggiungere userId - il backend lo estrae dal token
      const response = await apiClient.put(`/collections/${collectionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  // Delete collection
  deleteCollection: async (collectionId) => {
    try {
      await apiClient.delete(`/collections/${collectionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  // Get documents in a collection
  getCollectionDocuments: async (collectionId, options = {}) => {
    const { page = 1, limit = 20, sort = 'createdAt', direction = 'desc' } = options;
    try {
      const response = await apiClient.get(`/collections/${collectionId}/documents`, {
        params: { page, limit, sort, direction }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  // Add existing document to a collection
  addDocumentToCollection: async (collectionId, documentId) => {
    try {
      const response = await apiClient.post(`/collections/${collectionId}/documents`, {
        documentId
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to add document to collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  // Remove document from collection
  removeDocumentFromCollection: async (collectionId, documentId) => {
    try {
      await apiClient.delete(`/collections/${collectionId}/documents/${documentId}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove document from collection ${collectionId}:`, error);
      throw error;
    }
  }
};

//
// --- Project API functions ---
//
export const projectsApi = {
  // Get all projects for the current user
  getProjects: async (page = 1, limit = 20) => {
    try {
      // NON includere userId - il backend lo estrae dal token
      const response = await apiClient.get('/projects', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  },
  
  // Create a new project
  createProject: async (projectData) => {
    try {
      // NON aggiungere userId - il backend lo estrae dal token
      const response = await apiClient.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },
  
  // Get project details
  getProject: async (projectId) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Update project
  updateProject: async (projectId, updateData) => {
    try {
      // NON aggiungere userId - il backend lo estrae dal token
      const response = await apiClient.put(`/projects/${projectId}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Delete project
  deleteProject: async (projectId) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Get documents in a project
  getProjectDocuments: async (projectId, options = {}) => {
    const { page = 1, limit = 20, sort = 'createdAt', direction = 'desc' } = options;
    try {
      const response = await apiClient.get(`/projects/${projectId}/documents`, {
        params: { page, limit, sort, direction }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Add existing document to a project
  addDocumentToProject: async (projectId, documentId) => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/documents`, {
        documentId
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to add document to project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Remove document from project
  removeDocumentFromProject: async (projectId, documentId) => {
    try {
      await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove document from project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Link a collection to a project
  linkCollectionToProject: async (projectId, collectionId) => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/collections`, {
        collectionId
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to link collection to project ${projectId}:`, error);
      throw error;
    }
  },
  
  // Unlink a collection from a project
  unlinkCollectionFromProject: async (projectId, collectionId) => {
    try {
      await apiClient.delete(`/projects/${projectId}/collections/${collectionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to unlink collection from project ${projectId}:`, error);
      throw error;
    }
  }
};

//
// --- Agent API functions ---
//
export const agentsApi = {
  // List all available agents
  listAgents: async (type = null) => {
    try {
      const params = type ? { type } : {};
      const response = await apiClient.get('/agents', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      throw error;
    }
  },
  
  // Get agent details
  getAgent: async (agentId) => {
    try {
      const response = await apiClient.get(`/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch agent ${agentId}:`, error);
      throw error;
    }
  },
  
  // Create a custom agent
  createCustomAgent: async (agentData) => {
    try {
      const response = await apiClient.post('/agents/custom', agentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create custom agent:', error);
      throw error;
    }
  },
  
  // Invoke an agent with a prompt and optional documents
  invokeAgent: async (agentId, prompt, documentIds = []) => {
    try {
      const response = await apiClient.post('/agents/invoke', {
        agentId,
        prompt,
        documentIds
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to invoke agent ${agentId}:`, error);
      throw error;
    }
  }
};

//
// --- Extraction API functions ---
//
export const extractionApi = {
  // Extract entities from document
  extractDocumentEntities: async (documentId, options = {}) => {
    try {
      const response = await apiClient.post(`/documents/${documentId}/extract-entities`, {
        types: options.types || [],
        forceRegenerate: options.forceRegenerate || false
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to extract entities for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Get extracted entities
  getDocumentEntities: async (documentId, types = []) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/entities`, {
        params: { types: types.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get entities for document ${documentId}:`, error);
      throw error;
    }
  },
  
  // Generate document summary
  generateDocumentSummary: async (documentId, options = {}) => {
    try {
      const response = await apiClient.post(`/documents/${documentId}/generate-summary`, {
        maxLength: options.maxLength || 500,
        forceRegenerate: options.forceRegenerate || false
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to generate summary for document ${documentId}:`, error);
      throw error;
    }
  }
};

export default apiClient;