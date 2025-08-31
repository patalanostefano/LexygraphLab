// PdfChatPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Document, Page } from "react-pdf";
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
  Tooltip 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { pdfjs } from 'react-pdf';
import { getDocument } from '../api/documents';
import { useAuth } from '../context/AuthContext';

// Update worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function PdfChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { userId } = useAuth();

  // Get project and documents from navigation state
  const project = location.state?.project || {};
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [pdfContent, setPdfContent] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    if (location.state?.documents) {
      setDocuments(location.state.documents);
    }
  }, [location.state]);

  const handleDocumentSelect = async (event) => {
    const selectedDoc = documents.find(doc => doc.doc_id === event.target.value);
    setCurrentDocument(selectedDoc);
    
    try {
      const pdfBlob = await getDocument(projectId, selectedDoc.doc_id, userId);
      setPdfContent(URL.createObjectURL(pdfBlob));
    } catch (error) {
      console.error('Error loading PDF:', error);
      setPdfError(error);
    }
  };

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
            >
              {documents.map((doc) => (
                <MenuItem key={doc.doc_id} value={doc.doc_id}>
                  {doc.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* PDF viewer */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2
          }}>
            {pdfContent ? (
              <Document
                file={pdfContent}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(error) => setPdfError(error)}
                loading={<div>Loading PDF...</div>}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={400}
                  />
                ))}
              </Document>
            ) : (
              <Paper sx={{ p: 2 }}>
                <p>Select a document to view</p>
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
            backgroundColor: '#f5f5f5'
          }}>
            {/* Chat messages will be added here */}
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
              disabled={!currentDocument}
            />
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              mt: 1 
            }}>
              <Button 
                variant="contained"
                disabled={!currentDocument || !prompt.trim()}
                onClick={() => {
                  console.log("Send:", prompt);
                  setPrompt("");
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

// In your App.js or routing configuration file
<Route path="/agents/:projectId" element={<AgentsPage />} />