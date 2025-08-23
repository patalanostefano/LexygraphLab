// Fixed Documents.js
import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  CardContent,
  Tooltip,
  Fade,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import {
  getProjectDocuments,
  uploadDocument,
  downloadDocument,
  getDocumentText,
  createPDFBlobUrl,
  getDocument,
} from '../api/documents';
import { useAuth } from '../context/AuthContext';

// Import shared components
import ValisLogo from '../components/ValisLogo';
import {
  HeaderActionButton,
  ActionButton,
  CreateButton,
} from '../components/Buttons';
import { DocumentCard } from '../components/Cards';
import { StyledTextField, VisuallyHiddenInput } from '../components/TextFields';
import { PageBackground, PageHeader, PageContent } from '../components/Layout';
import { StyledModal } from '../components/Modals';

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
    document_count: 0,
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
  const [userAuthenticated, setUserAuthenticated] = useState(true); // Assume authenticated initially

  const { userId } = useAuth();

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [decodedProjectId]);

  // Filter documents based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.doc_id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');

      const documentsData = await getProjectDocuments(decodedProjectId, userId);

      if (Array.isArray(documentsData)) {
        setDocuments(documentsData);
        setUserAuthenticated(true);
        // Update project document count
        setProject((prev) => ({
          ...prev,
          document_count: documentsData.length,
        }));
      } else {
        // Handle case where user is not authenticated
        setUserAuthenticated(false);
        setDocuments([]);
      }
    } catch (err) {
      console.error('Error loading documents:', err);

      // Check if it's an authentication issue
      if (
        err.message?.includes('not authenticated') ||
        err.response?.status === 401
      ) {
        setError('Please log in to view project documents.');
        setUserAuthenticated(false);
        setDocuments([]);
      } else {
        // For new projects or other errors, this is expected
        setError(''); // Don't show error for empty projects
        setDocuments([]);
      }
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
      const titleWithoutExt =
        filename.substring(0, filename.lastIndexOf('.')) || filename;
      setDocumentTitle(titleWithoutExt);
      setError(''); // Clear any previous errors
    } else {
      setError('Please select a valid PDF file.');
      setSelectedFile(null);
      setDocumentTitle('');
    }
  };

  const uploadDoc = async () => {
    if (!selectedFile || !documentTitle.trim()) {
      setError('Please select a file and enter a title.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError('');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);

      const result = await uploadDocument(
        selectedFile,
        decodedProjectId,
        documentTitle.trim(),
        null,
        userId,
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload successful:', result);

      // Small delay to show 100% progress
      setTimeout(async () => {
        // Reload documents list
        await loadDocuments();

        // Reset form
        setUploadModalOpen(false);
        setSelectedFile(null);
        setDocumentTitle('');
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('Error uploading document:', err);

      if (err.message?.includes('not authenticated')) {
        setError('Please log in to upload documents.');
        setUserAuthenticated(false);
      } else {
        setError(
          `Failed to upload document: ${err.message || 'Please try again.'}`,
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      setError('');
      await downloadDocument(
        decodedProjectId,
        doc.doc_id,
        `${doc.title}.pdf`,
        userId,
      );
    } catch (err) {
      console.error('Error downloading document:', err);
      setError(`Failed to download ${doc.title}. Please try again.`);
    }
  };

  const handleViewText = async (doc) => {
    try {
      setError('');
      const textData = await getDocumentText(
        decodedProjectId,
        doc.doc_id,
        userId,
      );

      // Open text in a new window
      const newWindow = window.open('', '_blank');
      if (!newWindow) {
        setError('Please allow popups to view document text.');
        return;
      }

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
            <div class="content">${textData.content || textData.text_content || 'No text content available.'}</div>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error viewing document text:', err);
      setError(`Failed to load text for ${doc.title}. Please try again.`);
    }
  };

  const handleViewPDF = async (doc) => {
    try {
      setError('');
      const pdfBlob = await getDocument(decodedProjectId, doc.doc_id, userId);
      const url = createPDFBlobUrl(pdfBlob);

      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        setError('Please allow popups to view PDF documents.');
        URL.revokeObjectURL(url);
        return;
      }

      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('Error viewing PDF:', err);
      setError(`Failed to load PDF for ${doc.title}. Please try again.`);
    }
  };

  const goBack = () => {
    navigate('/projects');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCloseUploadModal = () => {
    if (uploading) return; // Prevent closing during upload

    setUploadModalOpen(false);
    setSelectedFile(null);
    setDocumentTitle('');
    setUploadProgress(0);
    setError('');
  };

  const handleRetryLoad = () => {
    setError('');
    loadDocuments();
  };

  return (
    <PageBackground>
      {/* Header */}
      <PageHeader>
        <ValisLogo />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Back to Projects" arrow>
            <HeaderActionButton onClick={goBack}>
              <ArrowBackIcon />
            </HeaderActionButton>
          </Tooltip>
        </Box>
      </PageHeader>

      {/* Main Content */}
      <PageContent>
        <Fade in timeout={1000}>
          <Box>
            {/* Page Title with Project Info */}
            <Box
              sx={{
                mb: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <FolderIcon
                sx={{
                  fontSize: '2rem',
                  color: theme.palette.primary.main,
                }}
              />
              <Box>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                    color:
                      theme.palette.mode === 'dark'
                        ? theme.palette.primary.light
                        : theme.palette.primary.main,
                    letterSpacing: '-0.02em',
                    mb: 1,
                  }}
                >
                  {project.project_id}
                </Typography>
                <Chip
                  icon={<DescriptionIcon />}
                  label={`${documents.length} document${documents.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? alpha('#9A7CFF', 0.2)
                        : alpha('#7C4DFF', 0.1),
                    color:
                      theme.palette.mode === 'dark' ? '#B79CFF' : '#7C4DFF',
                    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.3)}`,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>

            {/* Search and Upload Section - Only show if user is authenticated */}
            {userAuthenticated && (
              <Box sx={{ mb: 5 }}>
                <DocumentCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      }}
                    >
                      <SearchIcon
                        sx={{
                          color:
                            theme.palette.mode === 'dark'
                              ? alpha('#FFFFFF', 0.7)
                              : alpha('#14142B', 0.7),
                          fontSize: '1.25rem',
                        }}
                      />
                      <StyledTextField
                        fullWidth
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search documents..."
                        size="small"
                        sx={{ maxWidth: '350px' }}
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
            )}

            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                onClose={() => setError('')}
                action={
                  error.includes('Please log in') ? null : (
                    <ActionButton size="small" onClick={handleRetryLoad}>
                      Retry
                    </ActionButton>
                  )
                }
              >
                {error}
              </Alert>
            )}

            {/* Loading State */}
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 6,
                }}
              >
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading documents...</Typography>
              </Box>
            ) : (
              <>
                {/* Documents List */}
                {userAuthenticated && documents.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {filteredDocuments.map((doc) => (
                      <DocumentCard key={doc.doc_id}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 2,
                              flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <DescriptionIcon
                                sx={{
                                  fontSize: '1.25rem',
                                  color: theme.palette.primary.main,
                                  flexShrink: 0,
                                }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    color:
                                      theme.palette.mode === 'dark'
                                        ? '#FFFFFF'
                                        : '#14142B',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {doc.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color:
                                      theme.palette.mode === 'dark'
                                        ? alpha('#FFFFFF', 0.6)
                                        : alpha('#14142B', 0.6),
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  ID: {doc.doc_id}
                                </Typography>
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                flexShrink: 0,
                                flexWrap: 'wrap',
                              }}
                            >
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
                )}

                {/* Empty State - New Project */}
                {userAuthenticated && documents.length === 0 && !loading && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      color:
                        theme.palette.mode === 'dark'
                          ? alpha('#FFFFFF', 0.6)
                          : alpha('#14142B', 0.6),
                    }}
                  >
                    <DescriptionIcon
                      sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }}
                    />
                    <Typography
                      variant="h5"
                      sx={{ mb: 2, fontWeight: 600, fontSize: '1.25rem' }}
                    >
                      {searchQuery
                        ? 'No documents found'
                        : 'Welcome to your new project!'}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontSize: '0.9rem', mb: 3 }}
                    >
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Upload your first document to get started with this project.'}
                    </Typography>
                    {!searchQuery && (
                      <CreateButton
                        onClick={() => setUploadModalOpen(true)}
                        startIcon={<UploadIcon />}
                        size="large"
                      >
                        Upload Your First Document
                      </CreateButton>
                    )}
                  </Box>
                )}

                {/* No Results from Search */}
                {userAuthenticated &&
                  documents.length > 0 &&
                  filteredDocuments.length === 0 &&
                  searchQuery && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        color:
                          theme.palette.mode === 'dark'
                            ? alpha('#FFFFFF', 0.6)
                            : alpha('#14142B', 0.6),
                      }}
                    >
                      <SearchIcon
                        sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }}
                      />
                      <Typography
                        variant="h5"
                        sx={{ mb: 2, fontWeight: 600, fontSize: '1.25rem' }}
                      >
                        No documents found
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                        No documents match your search for "{searchQuery}"
                      </Typography>
                    </Box>
                  )}

                {/* Not Authenticated Message */}
                {!userAuthenticated && !loading && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      color:
                        theme.palette.mode === 'dark'
                          ? alpha('#FFFFFF', 0.6)
                          : alpha('#14142B', 0.6),
                    }}
                  >
                    <FolderIcon
                      sx={{ fontSize: '3rem', mb: 2, opacity: 0.3 }}
                    />
                    <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
                      Authentication Required
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.85rem', mb: 3 }}
                    >
                      Please log in to view and manage documents in this project
                    </Typography>
                    <ActionButton onClick={handleRetryLoad}>
                      Try Again
                    </ActionButton>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Fade>
      </PageContent>

      {/* Upload Document Modal */}
      <StyledModal
        open={uploadModalOpen}
        onClose={handleCloseUploadModal}
        title={uploading ? 'Uploading Document...' : 'Upload Document'}
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Upload Instructions */}
          <Typography
            variant="body2"
            sx={{
              color:
                theme.palette.mode === 'dark'
                  ? alpha('#FFFFFF', 0.7)
                  : alpha('#14142B', 0.7),
              fontSize: '0.85rem',
            }}
          >
            Upload a PDF document to the <strong>{decodedProjectId}</strong>{' '}
            project.
          </Typography>

          {/* File Selection */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Select PDF File
            </Typography>
            <CreateButton
              component="label"
              startIcon={<UploadIcon />}
              variant="outlined"
              fullWidth
              sx={{ mb: 1 }}
              disabled={uploading}
            >
              {selectedFile ? 'Change PDF File' : 'Choose PDF File'}
              <VisuallyHiddenInput
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
              />
            </CreateButton>
            {selectedFile && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <DescriptionIcon sx={{ fontSize: '1rem' }} />
                {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
            size="small"
            helperText="This title will be used to identify your document"
          />

          {/* Upload Progress */}
          {uploading && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  Uploading and processing document...
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {Math.round(uploadProgress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 6,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          )}

          {/* Modal Buttons */}
          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
          >
            <ActionButton onClick={handleCloseUploadModal} disabled={uploading}>
              Cancel
            </ActionButton>
            <CreateButton
              onClick={uploadDoc}
              disabled={uploading || !selectedFile || !documentTitle.trim()}
              startIcon={
                uploading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <UploadIcon />
                )
              }
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </CreateButton>
          </Box>
        </Box>
      </StyledModal>
    </PageBackground>
  );
}
