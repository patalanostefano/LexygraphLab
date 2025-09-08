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
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ResizablePanels from '../components/ResizablePanels';
import { pdfjs } from 'react-pdf';
import { getDocument } from '../api/documents';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { getProjectDocuments, sendChatMessage } from '../api/documents';
import useRefreshRedirect from '../hooks/useRefreshRedirect';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function AgentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { userId, loading: authLoading } = useAuth();
  const theme = useTheme();

  // Enable refresh redirect to home page
  useRefreshRedirect();

  // Get project and documents from navigation state
  const project = location.state?.project || {};
  const [documents, setDocuments] = useState(location.state?.documents || []);
  const [currentDocument, setCurrentDocument] = useState(location.state?.selectedDocument || null);
  const [pdfContent, setPdfContent] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [pdfError, setPdfError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Zoom functionality state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [baseWidth, setBaseWidth] = useState(400);

  useEffect(() => {
    console.log('AgentsPage useEffect triggered:', { 
      projectId, 
      userId, 
      authLoading,
      locationState: location.state,
      documentsFromState: location.state?.documents?.length || 0
    });

    // Don't load documents if auth is still loading
    if (authLoading) {
      console.log('⏳ Auth is still loading, waiting...');
      return;
    }

    // Always load all documents for the project to ensure dropdown is populated
    // This ensures the page works even after refresh when location.state is lost
    if (projectId && userId) {
      loadProjectDocuments();

      // If a specific document was provided from navigation state, handle it
      if (location.state?.selectedDocument) {
        // Set current document immediately and update URL
        setCurrentDocument(location.state.selectedDocument);
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('document', location.state.selectedDocument.doc_id);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
        
        // Load the document content
        loadSelectedDocument(location.state.selectedDocument, false);
      }
    } else if (!userId && !authLoading) {
      console.log('❌ No userId available after auth loading completed');
    }
  }, [projectId, userId, authLoading]); // Removed location.state dependency to avoid unnecessary re-renders

  // Separate useEffect to handle document selection from URL or navigation state
  useEffect(() => {
    // If we have documents loaded and no current document selected,
    // try to select the first document or one from URL params
    if (documents.length > 0 && !currentDocument) {
      // Check if there's a document ID in URL search params (for refresh handling)
      const urlParams = new URLSearchParams(location.search);
      const docIdFromUrl = urlParams.get('document');
      
      if (docIdFromUrl) {
        const docFromUrl = documents.find(doc => doc.doc_id === docIdFromUrl);
        if (docFromUrl) {
          loadSelectedDocument(docFromUrl, false); // Don't update URL since it's already there
          return;
        }
      }
      
      // If no document from URL, select the first one and update URL
      loadSelectedDocument(documents[0], true);
    }
  }, [documents, location.search]);

  const loadProjectDocuments = async () => {
    if (!projectId || !userId) {
      console.error('Missing projectId or userId:', { projectId, userId });
      return;
    }

    try {
      setLoading(true);
      console.log('Loading documents for project:', projectId, 'user:', userId);
      
      const documentsData = await getProjectDocuments(projectId, userId);
      console.log('Loaded documents:', documentsData);
      
      if (Array.isArray(documentsData)) {
        setDocuments(documentsData);
        console.log('Set documents in state:', documentsData.length, 'documents');
      } else {
        console.warn('Documents data is not an array:', documentsData);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading project documents:', error);
      setDocuments([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDocument = async (doc, updateUrl = false) => {
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
      
      // Update URL if requested (for programmatic selections)
      if (updateUrl) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('document', doc.doc_id);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }
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
      
      // Update URL to include selected document for refresh persistence
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('document', selectedDoc.doc_id);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
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

  const handleSendMessage = async () => {
    if (!currentDocument || !prompt.trim() || sendingMessage) {
      return;
    }

    // Add user message to chat
    const userMessage = { 
      type: 'user', 
      content: prompt,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentPrompt = prompt;
    setPrompt(""); // Clear input immediately
    setSendingMessage(true);

    try {
      console.log('Sending message to orchestrator:', {
        message: currentPrompt,
        documentId: currentDocument.doc_id,
        userId,
        projectId
      });

      // Call orchestrator service
      const response = await sendChatMessage(
        currentPrompt,
        [currentDocument.doc_id],
        userId,
        projectId
      );

      console.log('Received response from orchestrator:', response);

      // Add agent message to chat
      const agentMessage = {
        type: 'agent',
        content: response.content,
        timestamp: new Date().toISOString(),
        agentId: response.agentId || 'generation-agent'
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'agent',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleModifyResponse = (messageIndex) => {
    const message = messages[messageIndex];
    if (message && message.type === 'agent') {
      // Set the agent's response as the current prompt for modification
      setPrompt(`Please modify this response: "${message.content}"`);
      
      // Optionally, mark the message as being modified
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex 
          ? { ...msg, beingModified: true }
          : msg
      ));
    }
  };

  const handleConfirmResponse = (messageIndex) => {
    const message = messages[messageIndex];
    if (message && message.type === 'agent') {
      // Mark the response as confirmed
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex 
          ? { ...msg, confirmed: true, beingModified: false }
          : msg
      ));
      
      // You could also trigger additional actions here like:
      // - Save to database
      // - Export to document
      // - Share with team
      console.log('Response confirmed:', message.content);
    }
  };

  // Zoom functionality handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3)); // Max zoom 3x
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
  };

  const handleZoomReset = () => {
    setZoomLevel(1); // Reset to 100%
  };

  // Calculate actual width based on zoom level
  const getDocumentWidth = () => {
    const maxWidth = Math.min(400, window.innerWidth * 0.35);
    return maxWidth * zoomLevel;
  };

  // Show loading state while authentication is loading
  if (authLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <IconButton onClick={() => navigate('/projects')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Loading...</Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading authentication...
          </Typography>
        </Box>
      </Box>
    );
  }

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
        height: 'calc(100vh - 64px)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <ResizablePanels
          defaultLeftWidth={40}
          minLeftWidth={25}
          maxLeftWidth={75}
          storageKey="agents-page-panel-width"
          leftPanel={
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
          {/* Document selector */}
          <Box sx={{ m: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FormControl sx={{ flexGrow: 1 }}>
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
              </FormControl>
              <Tooltip title="Refresh documents list" arrow>
                <IconButton 
                  onClick={loadProjectDocuments}
                  disabled={loading}
                  size="small"
                >
                  {loading ? <CircularProgress size={20} /> : '🔄'}
                </IconButton>
              </Tooltip>
            </Box>
            {documents.length === 0 && !loading && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}
              >
                No documents available for this project. 
                <Button 
                  size="small" 
                  onClick={loadProjectDocuments}
                  sx={{ ml: 1, minWidth: 'auto', p: 0.5 }}
                >
                  Retry
                </Button>
              </Typography>
            )}
            {loading && (
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CircularProgress size={12} />
                Loading documents...
              </Typography>
            )}
          </Box>

          {/* PDF viewer */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2
          }}>
            {/* Zoom Controls */}
            {pdfContent && !loading && !pdfError && !pdfLoading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                mb: 2,
                gap: 1,
                flexWrap: 'wrap'
              }}>
                <Tooltip title="Zoom Out">
                  <IconButton 
                    onClick={handleZoomOut} 
                    disabled={zoomLevel <= 0.5}
                    size="small"
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                
                <Typography variant="body2" sx={{ 
                  minWidth: '60px', 
                  textAlign: 'center',
                  fontWeight: 'medium'
                }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                
                <Tooltip title="Zoom In">
                  <IconButton 
                    onClick={handleZoomIn} 
                    disabled={zoomLevel >= 3}
                    size="small"
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Reset Zoom (100%)">
                  <IconButton 
                    onClick={handleZoomReset}
                    size="small"
                  >
                    <ZoomOutMapIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
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
                    width={getDocumentWidth()}
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
          }
          rightPanel={
            <Box sx={{ 
              height: '100%',
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
            {messages.length === 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary'
              }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {currentDocument 
                    ? `Ready to chat about "${currentDocument.title}"`
                    : 'Select a document to start chatting'
                  }
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  Ask questions, request summaries, or get insights from your document
                </Typography>
              </Box>
            )}
            
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <Box sx={{ maxWidth: '85%', width: '100%' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: message.type === 'user' 
                        ? theme.palette.primary.main 
                        : message.isError
                          ? '#ffebee'
                          : message.confirmed
                            ? '#e8f5e8'
                            : message.beingModified
                              ? '#fff3e0'
                              : '#fff',
                      color: message.type === 'user' 
                        ? '#fff' 
                        : message.isError
                          ? '#c62828'
                          : message.confirmed
                            ? '#2e7d32'
                            : 'inherit',
                      borderRadius: message.type === 'user' 
                        ? '20px 20px 5px 20px'
                        : '20px 20px 20px 5px',
                      border: message.isError 
                        ? '1px solid #e57373' 
                        : message.confirmed
                          ? '1px solid #81c784'
                          : message.beingModified
                            ? '1px solid #ffb74d'
                            : 'none'
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}
                    >
                      {message.content}
                    </Typography>
                    
                    {/* Status indicators */}
                    {message.confirmed && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 1,
                          color: '#2e7d32',
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      >
                        ✓ Confirmed
                      </Typography>
                    )}
                    
                    {message.beingModified && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 1,
                          color: '#f57c00',
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      >
                        ✏️ Being modified...
                      </Typography>
                    )}
                    
                    {message.timestamp && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    )}
                  </Paper>

                  {/* Action buttons for agent responses */}
                  {message.type === 'agent' && !message.isError && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        mt: 1,
                        justifyContent: 'flex-start'
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={message.confirmed || message.beingModified}
                        onClick={() => handleModifyResponse(index)}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          borderColor: message.confirmed 
                            ? theme.palette.success.light 
                            : theme.palette.primary.light,
                          color: message.confirmed 
                            ? theme.palette.success.main 
                            : theme.palette.primary.main,
                          '&:hover': {
                            borderColor: message.confirmed 
                              ? theme.palette.success.main 
                              : theme.palette.primary.main,
                            backgroundColor: message.confirmed 
                              ? theme.palette.success.light + '10'
                              : theme.palette.primary.light + '10'
                          },
                          '&:disabled': {
                            borderColor: theme.palette.grey[300],
                            color: theme.palette.grey[400]
                          }
                        }}
                      >
                        {message.beingModified ? 'Modifying...' : 'Modify'}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={message.confirmed}
                        onClick={() => handleConfirmResponse(index)}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          backgroundColor: message.confirmed 
                            ? theme.palette.success.light 
                            : theme.palette.success.main,
                          '&:hover': {
                            backgroundColor: message.confirmed 
                              ? theme.palette.success.light 
                              : theme.palette.success.dark
                          },
                          '&:disabled': {
                            backgroundColor: theme.palette.grey[300],
                            color: theme.palette.grey[500]
                          }
                        }}
                      >
                        {message.confirmed ? 'Confirmed ✓' : 'Confirm'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}

            {sendingMessage && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  width: '100%'
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: '#fff',
                    borderRadius: '20px 20px 20px 5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    AI is thinking...
                  </Typography>
                </Paper>
              </Box>
            )}
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
              placeholder={currentDocument 
                ? `Ask a question about "${currentDocument.title}"...`
                : "Select a document to start chatting..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              disabled={!currentDocument || sendingMessage}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1 
            }}>
              <Typography variant="caption" color="text.secondary">
                {currentDocument ? 'Press Enter to send, Shift+Enter for new line' : ''}
              </Typography>
              <Button 
                variant="contained"
                disabled={!currentDocument || !prompt.trim() || sendingMessage}
                onClick={handleSendMessage}
                startIcon={sendingMessage ? <CircularProgress size={16} /> : null}
                sx={{ minWidth: '80px' }}
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </Button>
            </Box>
          </Paper>
            </Box>
          }
        />
      </Box>
    </Box>
  );
}