import React, { useState, useContext, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  alpha,
  IconButton,
  Tooltip,
  Container,
  Fade,
  styled,
  TextField,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { 
  getProjectDocuments, 
  uploadDocument, 
  downloadDocument, 
  getDocumentText,
  createPDFBlobUrl,
  getDocument
} from '../api/documents';

// Logo VALIS component
const ValisLogo = ({ theme }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    position: 'relative',
    cursor: 'pointer',
    '&:hover .valis-dot': {
      transform: 'scale(1.5)',
      boxShadow: `0 0 12px ${theme.palette.primary.main}`,
    },
    '&:hover .valis-line': {
      width: '100%',
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    }
  }}>
    {/* Punto viola in alto a destra del logo */}
    <Box 
      className="valis-dot"
      sx={{ 
        position: 'absolute', 
        width: 6, 
        height: 6, 
        borderRadius: '50%', 
        bgcolor: '#9A7CFF', 
        right: -6, 
        top: 0,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      }} 
    />
    
    {/* Punto viola in basso a sinistra del logo */}
    <Box 
      className="valis-dot"
      sx={{ 
        position: 'absolute', 
        width: 6, 
        height: 6, 
        borderRadius: '50%', 
        bgcolor: '#9A7CFF', 
        left: -6, 
        bottom: 8,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      }} 
    />
    
    {/* Logo text */}
    <Typography
      variant="h3"
      fontFamily="'Times New Roman', Times, serif"
      fontWeight={600}
      letterSpacing="0.02em"
      sx={{
        color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
        fontSize: '2.5rem',
        position: 'relative',
      }}
    >
      VALIS
    </Typography>
    
    {/* Linea decorativa sotto il logo */}
    <Box 
      className="valis-line"
      sx={{ 
        position: 'absolute', 
        height: 2.5, 
        width: '20%', 
        bgcolor: '#9A7CFF', 
        left: 0, 
        bottom: -4,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      }} 
    />
  </Box>
);

// Header Action Button
const HeaderActionButton = styled(IconButton)(({ theme }) => ({
  width: 46, 
  height: 46, 
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#FFFFFF', 0.8),
  backdropFilter: 'blur(8px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.1) : alpha('#7C4DFF', 0.1)}`,
  borderRadius: 12,
  transition: 'all 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.9) : alpha('#FFFFFF', 1),
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(154, 124, 255, 0.2)' 
      : '0 6px 12px rgba(124, 77, 255, 0.12), 0 0 0 1px rgba(124, 77, 255, 0.1)',
  },
  '&:active': {
    transform: 'translateY(-1px) scale(0.97)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 22,
    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
    transition: 'transform 0.2s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
  }
}));

// Styled Card for documents
const DocumentCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.8) : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `2px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.2)}`,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  marginBottom: '16px',
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 32px rgba(154, 124, 255, 0.2)' 
      : '0 8px 32px rgba(124, 77, 255, 0.15)',
    transform: 'translateY(-2px)',
    borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.5) : alpha('#7C4DFF', 0.4),
  }
}));

// Action Button
const ActionButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: '8px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.5) : alpha('#7C4DFF', 0.5)}`,
  borderRadius: '8px',
  color: theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF',
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.1) : alpha('#7C4DFF', 0.1),
    borderColor: theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF',
    transform: 'translateY(-1px)',
  }
}));

// Delete Button
const DeleteButton = styled(IconButton)(({ theme }) => ({
  minWidth: 'auto',
  padding: '6px',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FF6B6B', 0.5) : alpha('#F44336', 0.5)}`,
  borderRadius: '8px',
  color: theme.palette.mode === 'dark' ? '#FF6B6B' : '#F44336',
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#FF6B6B', 0.1) : alpha('#F44336', 0.1),
    borderColor: theme.palette.mode === 'dark' ? '#FF6B6B' : '#F44336',
    transform: 'translateY(-1px)',
  }
}));

// Create Button - more prominent
const CreateButton = styled(Button)(({ theme }) => ({
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  border: `2px solid ${theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF'}`,
  borderRadius: '12px',
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#7C4DFF',
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.1) : alpha('#7C4DFF', 0.05),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.2) : alpha('#7C4DFF', 0.1),
    borderColor: theme.palette.mode === 'dark' ? '#B79CFF' : '#9A7CFF',
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 6px 20px rgba(154, 124, 255, 0.3)' 
      : '0 6px 20px rgba(124, 77, 255, 0.2)',
  }
}));

// Styled TextField
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.05) : alpha('#000000', 0.02),
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.3),
      borderWidth: '2px',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.5) : alpha('#7C4DFF', 0.5),
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
    },
  },
  '& .MuiInputBase-input': {
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
    '&::placeholder': {
      color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.5) : alpha('#14142B', 0.5),
    }
  }
}));

// Hidden file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Documents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { theme } = useContext(ThemeContext);
  
  // Decode project ID from URL
  const decodedProjectId = decodeURIComponent(projectId);
  
  // Get project from navigation state or create a fallback
  const initialProject = location.state?.project || {
    project_id: decodedProjectId,
    document_count: 0
  };

  const [project, setProject] = useState(initialProject);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [decodedProjectId]);

  // Filter documents based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.doc_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const documentsData = await getProjectDocuments(decodedProjectId);
      setDocuments(documentsData);
      // Update project document count
      setProject(prev => ({
        ...prev,
        document_count: documentsData.length
      }));
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Auto-fill document title with filename (without extension)
      const filename = file.name;
      const titleWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
      setDocumentTitle(titleWithoutExt);
    } else {
      setError('Please select a valid PDF file.');
      setSelectedFile(null);
    }
  };

  const uploadDoc = async () => {
    if (!selectedFile || !documentTitle.trim()) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError('');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);

      const result = await uploadDocument(
        selectedFile,
        decodedProjectId,
        documentTitle.trim()
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reload documents list
      await loadDocuments();
      
      // Reset form
      setUploadModalOpen(false);
      setSelectedFile(null);
      setDocumentTitle('');
      setUploadProgress(0);
      
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await downloadDocument(decodedProjectId, doc.doc_id, `${doc.title}.pdf`);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again.');
    }
  };

  const handleViewText = async (doc) => {
    try {
      const textData = await getDocumentText(decodedProjectId, doc.doc_id);
      // Open text in a new window or modal
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${doc.title} - Text Content</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #333;
              }
              .header {
                border-bottom: 2px solid #7C4DFF;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .content {
                white-space: pre-wrap;
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #7C4DFF;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${doc.title}</h1>
              <p><strong>Document ID:</strong> ${doc.doc_id}</p>
              <p><strong>Project:</strong> ${decodedProjectId}</p>
            </div>
            <div class="content">${textData.content || 'No text content available.'}</div>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error viewing document text:', err);
      setError('Failed to load document text. Please try again.');
    }
  };

  const handleViewPDF = async (doc) => {
    try {
      const pdfBlob = await getDocument(decodedProjectId, doc.doc_id);
      const url = createPDFBlobUrl(pdfBlob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing PDF:', err);
      setError('Failed to load PDF. Please try again.');
    }
  };

  const goBack = () => {
    navigate('/projects');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? `radial-gradient(circle at 0% 20%, ${alpha('#2D2B55', 0.7)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#28284D', 0.7)} 0%, transparent 30%),
           ${theme.palette.background.default}`
        : `radial-gradient(circle at 0% 20%, ${alpha('#F0E7FF', 0.5)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#EDF5FF', 0.5)} 0%, transparent 30%),
           ${theme.palette.background.default}`,
      backgroundAttachment: 'fixed',
      position: 'relative',
      transition: 'background 0.5s ease-in-out',
    }}>
      {/* Background particle pattern */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        pointerEvents: 'none', 
        zIndex: 0, 
        opacity: 0.4, 
        backgroundImage: theme.palette.mode === 'dark' 
          ? 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
          : 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23B39DDB\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
        animation: 'backgroundAnimation 120s linear infinite',
        '@keyframes backgroundAnimation': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
      }} />

      {/* Header */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <ValisLogo theme={theme} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Back to Projects" arrow>
            <HeaderActionButton onClick={goBack}>
              <ArrowBackIcon />
            </HeaderActionButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ 
        position: 'relative', 
        zIndex: 2, 
        flexGrow: 1,
        py: 4
      }}>
        <Fade in timeout={1000}>
          <Box>
            {/* Page Title with Project Info */}
            <Box sx={{ 
              mb: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <FolderIcon sx={{ 
                fontSize: '2.5rem',
                color: theme.palette.primary.main 
              }} />
              <Box>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                    letterSpacing: '-0.02em',
                    mb: 1
                  }}
                >
                  {project.project_id}
                </Typography>
                <Chip
                  icon={<DescriptionIcon />}
                  label={`${documents.length} document${documents.length !== 1 ? 's' : ''}`}
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.2) : alpha('#7C4DFF', 0.1),
                    color: theme.palette.mode === 'dark' ? '#B79CFF' : '#7C4DFF',
                    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.3)}`,
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>

            {/* Search and Upload Section */}
            <Box sx={{ mb: 6 }}>
              <DocumentCard>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 3,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}>
                    <SearchIcon sx={{ 
                      color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.7) : alpha('#14142B', 0.7),
                      fontSize: '1.5rem'
                    }} />
                    <StyledTextField
                      fullWidth
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search documents..."
                      sx={{ maxWidth: '400px' }}
                    />
                    <CreateButton 
                      onClick={() => setUploadModalOpen(true)}
                      startIcon={<UploadIcon />}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Upload Document
                    </CreateButton>
                  </Box>
                </CardContent>
              </DocumentCard>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Documents List */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 2
                }}>
                  {filteredDocuments.map((doc) => (
                    <DocumentCard key={doc.doc_id}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: 2,
                          flexWrap: { xs: 'wrap', sm: 'nowrap' }
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 2,
                            flex: 1,
                            minWidth: 0
                          }}>
                            <DescriptionIcon sx={{ 
                              fontSize: '1.5rem',
                              color: theme.palette.primary.main,
                              flexShrink: 0
                            }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {doc.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.6) : alpha('#14142B', 0.6),
                                  fontSize: '0.75rem'
                                }}
                              >
                                ID: {doc.doc_id}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            flexShrink: 0,
                            flexWrap: 'wrap'
                          }}>
                            <Tooltip title="View PDF" arrow>
                              <ActionButton 
                                onClick={() => handleViewPDF(doc)}
                                startIcon={<OpenInNewIcon />}
                                size="small"
                              >
                                PDF
                              </ActionButton>
                            </Tooltip>
                            <Tooltip title="View Text" arrow>
                              <ActionButton 
                                onClick={() => handleViewText(doc)}
                                startIcon={<TextSnippetIcon />}
                                size="small"
                              >
                                Text
                              </ActionButton>
                            </Tooltip>
                            <Tooltip title="Download" arrow>
                              <ActionButton 
                                onClick={() => handleDownload(doc)}
                                startIcon={<DownloadIcon />}
                                size="small"
                              >
                                Download
                              </ActionButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </DocumentCard>
                  ))}
                </Box>

                {/* Empty State */}
                {filteredDocuments.length === 0 && !loading && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.6) : alpha('#14142B', 0.6)
                  }}>
                    <DescriptionIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      {searchQuery ? 'No documents found' : 'No documents yet'}
                    </Typography>
                    <Typography variant="body1">
                      {searchQuery 
                        ? 'Try adjusting your search query'
                        : 'Upload your first document to get started!'}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Fade>
      </Container>

      {/* Upload Document Modal */}
      <Dialog 
        open={uploadModalOpen} 
        onClose={() => !uploading && setUploadModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#1C1C3C' : '#FFFFFF',
          color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.1) : alpha('#000000', 0.1)}`
        }}>
          Upload Document
        </DialogTitle>
        <DialogContent sx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#1C1C3C' : '#FFFFFF',
          pt: 3
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* File Selection */}
            <Box>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                Select PDF File
              </Typography>
              <CreateButton
                component="label"
                startIcon={<UploadIcon />}
                variant="outlined"
                fullWidth
                sx={{ mb: 1 }}
              >
                Choose PDF File
                <VisuallyHiddenInput
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                />
              </CreateButton>
              {selectedFile && (
                <Typography variant="body2" sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>

            {/* Document Title */}
            <StyledTextField
              fullWidth
              label="Document Title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title..."
              disabled={uploading}
            />

            {/* Upload Progress */}
            {uploading && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Uploading... {Math.round(uploadProgress)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#1C1C3C' : '#FFFFFF',
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.1) : alpha('#000000', 0.1)}`,
          p: 3
        }}>
          <Button 
            onClick={() => setUploadModalOpen(false)}
            disabled={uploading}
            sx={{ color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.7) : alpha('#14142B', 0.7) }}
          >
            Cancel
          </Button>
          <CreateButton 
            onClick={uploadDoc}
            disabled={uploading || !selectedFile || !documentTitle.trim()}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </CreateButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}