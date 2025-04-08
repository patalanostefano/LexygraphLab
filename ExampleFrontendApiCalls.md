// api.js - API Integration Module

import axios from 'axios';
import { getSupabaseClient } from './supabaseClient'; // Your Supabase client

// Configure base API URL
const apiBaseUrl = 'https://ej9aw0b6h0.execute-api.eu-central-1.amazonaws.com/prod';

// Create an axios instance with base URL and default configuration
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include auth token from Supabase
apiClient.interceptors.request.use(async (config) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase auth error:', error);
      // Redirect to login if needed
      // window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (data?.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    
    return config;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return Promise.reject(error);
  }
}, error => {
  return Promise.reject(error);
});

// Handle API response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle common errors
    if (error.response?.status === 401) {
      console.error('Authentication error - redirecting to login');
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Permission denied');
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Collection API functions
export const collectionsApi = {
  // Get all collections
  getCollections: async (page = 1, limit = 20) => {
    try {
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
      const response = await apiClient.post('/collections', {
        name,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create collection:', error);
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
      const response = await apiClient.delete(`/collections/${collectionId}`);
      return response.status === 204; // Success with no content
    } catch (error) {
      console.error(`Failed to delete collection ${collectionId}:`, error);
      throw error;
    }
  },
  
  // Get documents in a collection
  getCollectionDocuments: async (collectionId, options = {}) => {
    const { page = 1, limit = 20, sort = 'created_at', direction = 'desc' } = options;
    try {
      const response = await apiClient.get(`/collections/${collectionId}/documents`, {
        params: { page, limit, sort, direction }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for collection ${collectionId}:`, error);
      throw error;
    }
  }
};

// Document API functions
export const documentsApi = {
  // Upload a document
  uploadDocument: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add optional form parameters
    if (options.name) formData.append('name', options.name);
    if (options.description) formData.append('description', options.description);
    if (options.collectionId) formData.append('collectionId', options.collectionId);
    if (options.processingType) formData.append('processingType', options.processingType);
    if (options.processingOptions) formData.append('processingOptions', JSON.stringify(options.processingOptions));
    if (options.priority) formData.append('priority', options.priority);
    if (options.language) formData.append('language', options.language);
    
    try {
      const response = await apiClient.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload document:', error);
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
  
  // Update document metadata
  updateDocument: async (documentId, updateData) => {
    try {
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
      const response = await apiClient.delete(`/documents/${documentId}`);
      return response.status === 204; // Success with no content
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
  


// Extraction API functions
export const extractionApi = {
  // Get document extracted text
  getExtractedText: async (documentId, options = {}) => {
    try {
      const response = await apiClient.get(`/documents/${documentId}/extracted-text`, {
        params: {
          page: options.page,
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
  },
  
  // Generate document summary on-demand
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
  }
};
Example React Component for Document Processing

// DocumentUploader.jsx
import React, { useState } from 'react';
import { documentsApi } from './api';

const DocumentUploader = ({ collectionId }) => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    // Auto-set name if not already set
    if (!name && selectedFile) {
      setName(selectedFile.name.split('.')[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const response = await documentsApi.uploadDocument(file, {
        name: name || file.name,
        description,
        collectionId,
        processingType: 'TEXT',
      });
      
      setUploadedDoc(response);
      // Clear form
      setFile(null);
      setName('');
      setDescription('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-uploader">
      <h2>Upload Document</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {uploadedDoc && (
        <div className="success-message">
          <p>Document uploaded successfully!</p>
          <p>Status: {uploadedDoc.status}</p>
          <p>Check status: <a href={uploadedDoc.statusCheckUrl} target="_blank" rel="noopener noreferrer">View Status</a></p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file">Document File</label>
          <input 
            type="file" 
            id="file" 
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Document Name</label>
          <input 
            type="text" 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
        </div>
        
        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUploader;
Example React Component for Document Viewing

// DocumentViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { documentsApi, extractionApi } from './api';

const DocumentViewer = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [viewUrl, setViewUrl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [entities, setEntities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setLoading(true);
        // Get document metadata
        const docData = await documentsApi.getDocument(documentId);
        setDocument(docData);
        
        // Generate view URL
        if (docData.status === 'COMPLETED') {
          const urlData = await documentsApi.getDocumentViewUrl(documentId);
          setViewUrl(urlData.url);
          
          // Get summary if available
          if (docData.hasSummary) {
            const summaryData = await extractionApi.getDocumentSummary(documentId);
            setSummary(summaryData);
          }
          
          // Get entities if available
          if (docData.hasEntities) {
            const entityData = await extractionApi.getDocumentEntities(documentId);
            setEntities(entityData);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentId]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      const result = await extractionApi.generateDocumentSummary(documentId);
      setSummary(result);
    } catch (err) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const extractEntities = async () => {
    try {
      setLoading(true);
      const result = await extractionApi.extractDocumentEntities(documentId);
      setEntities(result);
    } catch (err) {
      setError(err.message || 'Failed to extract entities');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !document) {
    return <div>Loading document...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!document) {
    return <div>Document not found</div>;
  }

  return (
    <div className="document-viewer">
      <h1>{document.name}</h1>
      <p>{document.description}</p>
      
      <div className="document-metadata">
        <p>Status: <span className={`status-${document.status.toLowerCase()}`}>{document.status}</span></p>
        <p>Pages: {document.pageCount || 'Unknown'}</p>
        <p>File Type: {document.mimeType}</p>
        <p>Size: {Math.round(document.size / 1024)} KB</p>
        <p>Uploaded: {new Date(document.createdAt).toLocaleString()}</p>
        {document.tags && document.tags.length > 0 && (
          <div className="tags">
            {document.tags.map(tag => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      
      <div className="document-tabs">
        <button 
          className={activeTab === 'preview' ? 'active' : ''} 
          onClick={() => setActiveTab('preview')}
        >
          Document Preview
        </button>
        <button 
          className={activeTab === 'summary' ? 'active' : ''} 
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button 
          className={activeTab === 'entities' ? 'active' : ''} 
          onClick={() => setActiveTab('entities')}
        >
          Entities
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'preview' && (
          <div className="document-preview">
            {document.status !== 'COMPLETED' ? (
              <div className="processing-notice">
                Document is still processing. Current status: {document.status}
              </div>
            ) : viewUrl ? (
              <iframe 
                src={viewUrl} 
                title={document.name} 
                width="100%" 
                height="600px"
                className="document-frame"
              />
            ) : (
              <div className="no-preview">
                No preview available for this document type.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'summary' && (
          <div className="document-summary">
            {document.status !== 'COMPLETED' ? (
              <div className="processing-notice">
                Document is still processing. Summary will be available when processing completes.
              </div>
            ) : summary ? (
              <div className="summary-content">
                <h3>Document Summary</h3>
                <p>{summary.summary}</p>
                
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div className="key-points">
                    <h4>Key Points</h4>
                    <ul>
                      {summary.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-summary">
                <p>No summary available yet.</p>
                <button onClick={generateSummary} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Summary'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'entities' && (
          <div className="document-entities">
            {document.status !== 'COMPLETED' ? (
              <div className="processing-notice">
                Document is still processing. Entities will be available when processing completes.
              </div>
            ) : entities && entities.entities?.length > 0 ? (
              <div className="entities-content">
                <h3>Extracted Entities</h3>
                
                <div className="entity-list">
                  {entities.entities.map((entity, index) => (
                    <div className="entity-item" key={index}>
                      <span className={`entity-type ${entity.type.toLowerCase()}`}>{entity.type}</span>
                      <span className="entity-text">{entity.text}</span>
                      {entity.confidence && (
                        <span className="entity-confidence">
                          {Math.round(entity.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-entities">
                <p>No entities extracted yet.</p>
                <button onClick={extractEntities} disabled={loading}>
                  {loading ? 'Extracting...' : 'Extract Entities'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
