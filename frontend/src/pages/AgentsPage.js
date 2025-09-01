// AgentsPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Document, Page } from "react-pdf";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  Button, 
  TextField, 
  Box, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { pdfjs } from 'react-pdf';
import { getDocument } from '../api/documents';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { getProjectDocuments } from '../api/documents';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function AgentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { userId } = useAuth();
  const theme = useTheme();

  // Get project and documents from navigation state
  const project = location.state?.project || {};
  const [documents, setDocuments] = useState(location.state?.documents || []);
  const [currentDocument, setCurrentDocument] = useState(location.state?.selectedDocument || null);
  const [pdfContent, setPdfContent] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [pdfError, setPdfError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [responseId, setResponseId] = useState(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    // If documents are provided from navigation, use them
    if (location.state?.documents && location.state.documents.length > 0) {
      setDocuments(location.state.documents);
      
      // If a specific document was selected, load it
      if (location.state?.selectedDocument) {
        loadSelectedDocument(location.state.selectedDocument);
      }
    } else {
      // Otherwise, load all documents for the project
      loadProjectDocuments();
    }
  }, [location.state, projectId]);

  const loadProjectDocuments = async () => {
    try {
      setLoading(true);
      const documentsData = await getProjectDocuments(projectId, userId);
      if (Array.isArray(documentsData)) {
        setDocuments(documentsData);
      }
    } catch (error) {
      console.error('Error loading project documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDocument = async (doc) => {
    setCurrentDocument(doc);
    setPdfLoading(true);
    setPdfError(null);
    
    try {
      console.log('Loading PDF for document:', doc.doc_id);
      const pdfBlob = await getDocument(projectId, doc.doc_id, userId);
      console.log('PDF blob received:', pdfBlob.size, 'bytes');
      
      // Create a proper blob URL
      const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      console.log('Blob URL created:', blobUrl);
      
      setPdfContent(blobUrl);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setPdfError(error.message || 'Failed to load PDF file');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDocumentSelect = async (event) => {
    const selectedDoc = documents.find(doc => doc.doc_id === event.target.value);
    if (selectedDoc) {
      // Clean up previous PDF URL to prevent memory leaks
      if (pdfContent) {
        URL.revokeObjectURL(pdfContent);
      }
      await loadSelectedDocument(selectedDoc);
    }
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfContent) {
        URL.revokeObjectURL(pdfContent);
      }
    };
  }, [pdfContent]);

  const handleBack = () => {
    navigate('/projects');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <Tooltip title="Back to Projects" arrow>
          <IconButton onClick={handleBack} size="large">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ ml: 2 }}>
          {project.project_id || 'Document Chat'}
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 64px)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Left panel */}
        <Box sx={{ 
          width: '40%', 
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Document selector */}
          <FormControl sx={{ m: 2 }}>
            <InputLabel>Select Document</InputLabel>
            <Select
              value={currentDocument?.doc_id || ''}
              onChange={handleDocumentSelect}
              label="Select Document"
              disabled={loading || documents.length === 0}
            >
              {documents.map((doc) => (
                <MenuItem key={doc.doc_id} value={doc.doc_id}>
                  {doc.title}
                </MenuItem>
              ))}
            </Select>
            {documents.length === 0 && !loading && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}
              >
                No documents available for this project
              </Typography>
            )}
          </FormControl>

          {/* PDF viewer */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2
          }}>
            {loading ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Loading documents...</Typography>
              </Paper>
            ) : pdfError ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {pdfError}
                </Alert>
                <Button 
                  variant="outlined" 
                  onClick={() => currentDocument && loadSelectedDocument(currentDocument)}
                  disabled={pdfLoading}
                >
                  Retry Loading PDF
                </Button>
              </Paper>
            ) : pdfLoading ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Loading PDF...</Typography>
              </Paper>
            ) : pdfContent ? (
              <Document
                file={pdfContent}
                onLoadSuccess={({ numPages }) => {
                  console.log('PDF loaded successfully, pages:', numPages);
                  setNumPages(numPages);
                  setPdfError(null);
                }}
                onLoadError={(error) => {
                  console.error('PDF load error:', error);
                  setPdfError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
                }}
                loading={
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>Loading PDF...</Typography>
                  </Paper>
                }
                error={
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Alert severity="error">
                      Failed to load PDF file. Please try again.
                    </Alert>
                  </Paper>
                }
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={Math.min(400, window.innerWidth * 0.35)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            ) : documents.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No documents available for this project.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Go back to the project page and upload some documents first.
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Select a document to view and start chatting
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

        {/* Right panel - Chat */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          {/* Chat messages area */}
          <Box sx={{ 
            flexGrow: 1, 
            p: 2, 
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.type === 'user' 
                      ? theme.palette.primary.main 
                      : '#fff',
                    color: message.type === 'user' ? '#fff' : 'inherit',
                    borderRadius: message.type === 'user' 
                      ? '20px 20px 5px 20px'
                      : '20px 20px 20px 5px'
                  }}
                >
                  <Typography variant="body1">
                    {message.content}
                  </Typography>
                  
                  {/* Show confirmation controls for agent responses */}
                  {message.type === 'agent' && message.id === responseId && isWaitingForConfirmation && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setIsWaitingForConfirmation(false);
                          setResponseId(null);
                          // Add your confirmation handling here
                        }}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          setPrompt(message.content);
                          setIsWaitingForConfirmation(false);
                          setResponseId(null);
                        }}
                      >
                        Modify
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input area */}
          <Paper sx={{ 
            p: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: '#fff'
          }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Ask a question about the document..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              disabled={!currentDocument || isWaitingForConfirmation}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              mt: 1 
            }}>
              <Button 
                variant="contained"
                disabled={!currentDocument || !prompt.trim() || isWaitingForConfirmation}
                onClick={async () => {
                  // Add user message
                  const userMessage = { type: 'user', content: prompt };
                  setMessages(prev => [...prev, userMessage]);
                  
                  try {
                    // Simulate agent response (replace with actual API call)
                    const response = await new Promise(resolve => 
                      setTimeout(() => resolve({
                        id: Date.now(),
                        content: `Response to: ${prompt}`
                      }), 1000)
                    );
                    
                    // Add agent message
                    const agentMessage = { 
                      type: 'agent', 
                      id: response.id,
                      content: response.content 
                    };
                    setMessages(prev => [...prev, agentMessage]);
                    setResponseId(response.id);
                    setIsWaitingForConfirmation(true);
                    
                    // Clear prompt
                    setPrompt("");
                  } catch (error) {
                    console.error('Error getting response:', error);
                    // Handle error appropriately
                  }
                }}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}