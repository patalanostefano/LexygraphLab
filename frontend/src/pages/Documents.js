import React, { useState, useContext } from 'react';
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
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FolderIcon from '@mui/icons-material/Folder';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

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

export default function Documents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { theme } = useContext(ThemeContext);
  
  // Get project from navigation state or create a fallback if the page is reloaded
  const initialProject = location.state?.project || {
    id: parseInt(projectId),
    name: `Project ${projectId}`,
    documents: []
  };

  const [project, setProject] = useState(initialProject);
  const [newDocName, setNewDocName] = useState('');

  const addDocument = () => {
    if (newDocName.trim()) {
      setProject({
        ...project,
        documents: [...project.documents, newDocName.trim()]
      });
      setNewDocName('');
    }
  };

  const deleteDocument = (docIndex) => {
    setProject({
      ...project,
      documents: project.documents.filter((_, index) => index !== docIndex)
    });
  };

  const openDocument = (docName) => {
    // You can replace this with your actual document opening logic
    alert(`Opening document: ${docName}`);
  };

  const goBack = () => {
    navigate('/projects');
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
                  {project.name}
                </Typography>
                <Chip
                  icon={<DescriptionIcon />}
                  label={`${project.documents.length} document${project.documents.length !== 1 ? 's' : ''}`}
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.2) : alpha('#7C4DFF', 0.1),
                    color: theme.palette.mode === 'dark' ? '#B79CFF' : '#7C4DFF',
                    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.3)}`,
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>

            {/* Add Document Section */}
            <Box sx={{ mb: 6 }}>
              <DocumentCard>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 3,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
                        minWidth: 'fit-content'
                      }}
                    >
                      Add New Document
                    </Typography>
                    <StyledTextField
                      fullWidth
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Enter document name..."
                      onKeyPress={(e) => e.key === 'Enter' && addDocument()}
                      sx={{ maxWidth: '400px' }}
                    />
                    <CreateButton 
                      onClick={addDocument}
                      startIcon={<AddIcon />}
                      sx={{ minWidth: 'fit-content' }}
                    >
                      Add Document
                    </CreateButton>
                  </Box>
                </CardContent>
              </DocumentCard>
            </Box>

            {/* Documents List */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2
            }}>
              {project.documents.map((doc, index) => (
                <DocumentCard key={index}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 2,
                        flex: 1
                      }}>
                        <DescriptionIcon sx={{ 
                          fontSize: '1.5rem',
                          color: theme.palette.primary.main 
                        }} />
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
                          }}
                        >
                          {doc}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <ActionButton 
                          onClick={() => openDocument(doc)}
                          startIcon={<OpenInNewIcon />}
                        >
                          Open
                        </ActionButton>
                        <Tooltip title="Delete Document" arrow>
                          <DeleteButton onClick={() => deleteDocument(index)}>
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                          </DeleteButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </DocumentCard>
              ))}
            </Box>

            {/* Empty State */}
            {project.documents.length === 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.6) : alpha('#14142B', 0.6)
              }}>
                <DescriptionIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  No documents yet
                </Typography>
                <Typography variant="body1">
                  Add your first document above to get started!
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}