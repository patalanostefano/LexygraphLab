// Aggiornamento di ProjectSection.js per supportare l'anteprima dei documenti

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  alpha,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';

// AGGIUNTO: Import del DocumentPreviewDialog
import DocumentPreviewDialog from '../../DocumentComponents/DocumentPreviewDialog';

/**
 * Sezione che mostra la lista dei progetti con ricerca e operazioni CRUD.
 * AGGIORNATO: Supporto per l'anteprima dei documenti caricati
 */
export default function ProjectSection({
  projects = [],
  searchTerm = '',
  onSearchTermChange = () => {},
  onNewProjectClick = () => {},
  onSelectProject = () => {},
  onEditProject = () => {},
  onDeleteProject = () => {},
  onNavigateToProfile = () => {},
  isLoading = false
}) {
  const theme = useTheme();
  
  // AGGIUNTO: Stati per la gestione dell'anteprima documenti
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [documentToPreview, setDocumentToPreview] = useState(null);
  const [selectedProjectForDocuments, setSelectedProjectForDocuments] = useState(null);
  const [isDocumentListOpen, setIsDocumentListOpen] = useState(false);

  // AGGIUNTO: Handler per aprire la lista documenti di un progetto
  const handleShowDocuments = (project, event) => {
    event.stopPropagation();
    setSelectedProjectForDocuments(project);
    setIsDocumentListOpen(true);
  };

  // AGGIUNTO: Handler per l'anteprima di un documento
  const handleDocumentPreview = (document) => {
    setDocumentToPreview(document);
    setIsDocumentPreviewOpen(true);
    setIsDocumentListOpen(false); // Chiudi la lista quando apri l'anteprima
  };

  // AGGIUNTO: Handler per chiudere l'anteprima
  const handleCloseDocumentPreview = () => {
    setIsDocumentPreviewOpen(false);
    setDocumentToPreview(null);
  };

  // AGGIUNTO: Funzione per ottenere l'icona del file
  const getFileIcon = (fileType) => {
    if (!fileType) return <DescriptionIcon />;
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('word') || fileType.includes('document')) return <ArticleIcon color="primary" />;
    if (fileType.includes('image')) return <ImageIcon color="success" />;
    return <DescriptionIcon />;
  };

  // AGGIUNTO: Filtra solo i documenti caricati (non generati)
  const getUploadedDocuments = (project) => {
    if (!project.documents) return [];
    
    return project.documents.filter(doc => {
      // Un documento è considerato "caricato" se:
      // - NON ha il flag isGenerated
      // - NON ha generatedBy
      // - NON ha version (tipico dei documenti generati)
      // - HA uploadedAt o è stato creato tramite upload
      return !doc.isGenerated && 
             !doc.generatedBy && 
             !doc.version && 
             (doc.uploadedAt || doc.source !== 'agent');
    });
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        {/* Header con titolo, ricerca e bottone nuovo progetto */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            borderBottom: '2px solid',
            borderColor: 'primary.main',
            pb: 2
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              mb: 0.5, 
              color: 'primary.main',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              I tuoi progetti
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestisci e crea nuovi progetti di lavoro per il tuo studio legale
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              placeholder="Cerca progetti..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ width: { xs: '100%', sm: '300px' } }}
            />
            
            <Button 
              variant="outlined" 
              startIcon={<SettingsIcon />}
              onClick={onNavigateToProfile}
              sx={{ 
                py: 1, 
                px: 2,
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              Impostazioni
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewProjectClick}
              sx={{ 
                py: 1, 
                px: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              Nuovo Progetto
            </Button>
          </Box>
        </Box>

        {/* Stato di caricamento */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={40} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Caricamento progetti...
            </Typography>
          </Box>
        ) : (
          /* Griglia dei progetti */
          <Grid container spacing={3}>
            {projects.length > 0 ? (
              projects.map((project) => {
                const uploadedDocs = getUploadedDocuments(project);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Paper
                      elevation={2}
                      onClick={() => onSelectProject(project)}
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': { 
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          transform: 'translateY(-4px)',
                          borderColor: 'primary.main',
                          '& .project-title::after': {
                            width: '100%',
                            transition: 'width 0.3s ease'
                          }
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Sfondo decorativo */}
                      <Box 
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100px',
                          height: '100px',
                          background: 'radial-gradient(circle at top right, rgba(124, 77, 255, 0.1), transparent 70%)',
                          zIndex: 0
                        }}
                      />
                      
                      {/* Titolo del progetto con effetto */}
                      <Typography 
                        variant="h5" 
                        fontWeight={700} 
                        className="project-title"
                        sx={{ 
                          mb: 2,
                          position: 'relative',
                          display: 'inline-block',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -2,
                            left: 0,
                            width: '30%',
                            height: '2px',
                            bgcolor: 'primary.main',
                            transition: 'width 0.3s ease'
                          }
                        }}
                      >
                        {project.name}
                      </Typography>

                      {project.client && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <BusinessIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.light' }} />
                          <strong>Cliente:</strong>&nbsp;{project.client}
                        </Typography>
                      )}

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Creato il {project.date}
                      </Typography>
                      
                      {/* MODIFICATO: Mostra solo documenti caricati */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <DescriptionIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.light' }} />
                        <Typography variant="body2" color="text.secondary">
                          {uploadedDocs.length} documenti caricati
                        </Typography>
                        
                        {/* AGGIUNTO: Pulsante per visualizzare documenti se ce ne sono */}
                        {uploadedDocs.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleShowDocuments(project, e)}
                            sx={{ 
                              ml: 1,
                              p: 0.5,
                              color: 'primary.main',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>                  
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(project, e);
                          }}
                        >
                          Modifica
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project, e);
                          }}
                          sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: '8px' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    textAlign: 'center', 
                    py: 6, 
                    border: '2px dashed', 
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2 }}>Nessun progetto disponibile</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Clicca su "Nuovo Progetto" per crearne uno.
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={onNewProjectClick}
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                  >
                    Crea Progetto
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* AGGIUNTO: Dialog per visualizzare la lista documenti di un progetto */}
      <Dialog
        open={isDocumentListOpen}
        onClose={() => setIsDocumentListOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Documenti - {selectedProjectForDocuments?.name}
            </Typography>
            <IconButton 
              onClick={() => setIsDocumentListOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1 }}>
          {selectedProjectForDocuments && getUploadedDocuments(selectedProjectForDocuments).length > 0 ? (
            <List dense>
              {getUploadedDocuments(selectedProjectForDocuments).map((doc, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemButton
                    onClick={() => handleDocumentPreview(doc)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08)
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getFileIcon(doc.type || doc.mimeType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={`${doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : ''} • ${
                        doc.date || doc.createdAt || doc.updatedAt ? 
                        new Date(doc.date || doc.createdAt || doc.updatedAt).toLocaleDateString() : 
                        'Data sconosciuta'
                      }`}
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 500,
                        noWrap: true 
                      }}
                      secondaryTypographyProps={{ 
                        variant: 'caption',
                        color: 'text.secondary'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{ ml: 1, color: 'primary.main' }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ 
              py: 4, 
              textAlign: 'center',
              color: 'text.secondary'
            }}>
              <DescriptionIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1">
                Nessun documento caricato in questo progetto
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                I documenti generati dagli agenti non vengono mostrati qui
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setIsDocumentListOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* AGGIUNTO: Dialog per l'anteprima dei documenti */}
      <DocumentPreviewDialog
        open={isDocumentPreviewOpen}
        onClose={handleCloseDocumentPreview}
        document={documentToPreview}
      />
    </>
  );
}