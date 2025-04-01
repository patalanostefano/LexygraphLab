import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Grid,
  useMediaQuery,
  alpha,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  CircularProgress,
  TextField,
  Popper,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  styled,
  Paper,
  Drawer,
  InputAdornment,
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BusinessIcon from '@mui/icons-material/Business';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BalanceIcon from '@mui/icons-material/Balance';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ImageIcon from '@mui/icons-material/Image';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EventIcon from '@mui/icons-material/Event';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
// Importazione per docx (necessaria per la funzione di esportazione DOCX)
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

// Importa componenti e stili personalizzati
import { 
  Quadrant, 
  QuadrantTitle, 
  ProjectCard, 
  PromptInputBox, 
  AgentChip
} from './MultiagentStyles';

import { 
  DeleteConfirmDialog,
  DeleteCollectionConfirmDialog,
} from './ProjectComponents';

import { 
  Message, 
  getStatusIcon, 
  AgentMentionSelector 
} from './UIComponents';

import { 
  convertToWordCompatibleHTML, 
  DocumentTitleGenerator 
} from './utils';

// Importa i componenti modulari esistenti - dal percorso corretto
import { 
  DocumentItem, 
  ArtifactFullScreenDialog, 
  DocumentEditorDialog,
  DocumentProcessingStatus,
  extractHtmlContent
} from '../../../../../../valis/src/components/multiagent/DocumentComponents/index';

// Importa il servizio DocumentService
import DocumentService from '../../../../../../valis/src/services/DocumentService';

    alignItems: 'center', 
import { ThemeContext } from '../../../../../../valis/src/context/ThemeContext';

// Definisci il DocumentDrawer usando styled
const DocumentDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 380,
    padding: theme.spacing(0),
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  }
}));

// Funzioni di utilità per l'estensione di DocumentItem con menu contestuale
const EnhancedDocumentItem = ({ document, onDelete, onView, onEdit, showActions = true }) => {
  const { theme } = useContext(ThemeContext);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleItemClick = () => {
    if (onView) onView(document);
  };
  
  const getFileIcon = () => {
    if (!document?.type) return <FileIcon />;
    
    if (document.type.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (document.type.includes('word') || document.type.includes('document')) return <ArticleIcon color="primary" />;
    if (document.type.includes('image')) return <ImageIcon color="success" />;
    return <FileIcon />;
  };
  
  return (
    <Box 
      sx={{
        mb: 1.5,
        borderRadius: 1,
        bgcolor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.4) 
          : alpha(theme.palette.background.paper, 0.6),
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onView ? 'pointer' : 'default',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.6) 
            : alpha(theme.palette.background.paper, 0.8),
        },
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 3px rgba(0,0,0,0.2)' 
          : '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'background-color 0.2s ease'
      }}
      onClick={handleItemClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {getFileIcon()}
        <Box sx={{ ml: 1.5 }}>
          <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {document.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {typeof document?.size === 'number' 
              ? `${(document.size / 1024).toFixed(1)} KB` 
              : document?.size || ''} 
            {" — "}{document?.date || new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
      
      {showActions && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onView && (
            <Tooltip title="Visualizza documento">
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(document);
                }}
                sx={{ mr: 0.5 }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            id="document-menu"
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && !document.isReadOnly && (
              <MenuItem onClick={() => {
                handleMenuClose();
                onEdit(document);
              }}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Modifica</Typography>
              </MenuItem>
            )}
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">Scarica</Typography>
            </MenuItem>
            {onDelete && (
              <MenuItem onClick={() => {
                handleMenuClose();
                onDelete(document.id);
              }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" color="error">Elimina</Typography>
              </MenuItem>
            )}
          </Menu>
        </Box>
      )}
    </Box>
  );
};

// Componente DocumentSelectorDialog per selezionare documenti da collezioni
const DocumentSelectorDialog = ({ open, onClose, onSelect, collections = [], documentService, multiSelect = false }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  
  // Carica i documenti dalla collezione selezionata
  const loadDocuments = async (collectionId) => {
    if (!collectionId || !documentService) return;
    
    setLoading(true);
    
    try {
      const response = await documentService.getCollectionDocuments(collectionId);
      setDocuments(response.documents || []);
    } catch (error) {
      console.error("Errore durante il caricamento dei documenti:", error);
      setNotification({
        open: true,
        message: "Errore durante il caricamento dei documenti. Riprova più tardi.",
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Effetto per caricare i documenti quando si seleziona una collezione
  useEffect(() => {
    if (selectedCollection) {
      loadDocuments(selectedCollection.id);
    }
  }, [selectedCollection]);
  
  // Reset selezione quando cambia collezione
  useEffect(() => {
    setSelectedDocuments([]);
  }, [selectedCollection]);
  
  // Filtra i documenti in base alla ricerca
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );
  
  // Gestione della selezione di un documento
  const handleSelectDocument = (document) => {
    if (!multiSelect) {
      if (onSelect) {
        onSelect(document);
        onClose();
      }
    } else {
      const isAlreadySelected = selectedDocuments.some(doc => doc.id === document.id);
      if (isAlreadySelected) {
        setSelectedDocuments(selectedDocuments.filter(doc => doc.id !== document.id));
      } else {
        setSelectedDocuments([...selectedDocuments, document]);
      }
    }
  };
  
  const handleConfirmSelection = () => {
    if (onSelect && selectedDocuments.length > 0) {
      onSelect(selectedDocuments);
      onClose();
    }
  };
  
  const isDocumentSelected = (docId) => {
    return selectedDocuments.some(doc => doc.id === docId);
  };
  
  // Funzione per selezionare tutti i documenti
  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments([...filteredDocuments]);
    }
  };
  
  // Funzione per chiudere le notifiche
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="document-selector-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="document-selector-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Seleziona documento{multiSelect ? "i" : ""}</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Collezione"
            value={selectedCollection?.id || ''}
            onChange={(e) => {
              const selected = collections.find(c => c.id === e.target.value);
              setSelectedCollection(selected || null);
            }}
            fullWidth
          >
            <MenuItem value="">Seleziona una collezione</MenuItem>
            {collections.map((collection) => (
              <MenuItem key={collection.id} value={collection.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FolderIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  {collection.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Cerca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography>Caricamento documenti...</Typography>
          </Box>
        ) : !selectedCollection ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 6 }}>
            <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Seleziona una collezione per visualizzare i documenti
            </Typography>
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 6 }}>
            <InsertDriveFileIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            {search ? (
              <Typography variant="body1" color="text.secondary">
                Nessun documento trovato per "{search}"
              </Typography>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Nessun documento in questa collezione
              </Typography>
            )}
          </Box>
        ) : (
          <>
            {multiSelect && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0} 
                      indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < filteredDocuments.length}
                      onChange={handleSelectAll}
                    />
                  }
                  label="Seleziona tutti"
                />
                <Typography variant="body2">
                  {selectedDocuments.length} di {filteredDocuments.length} selezionati
                </Typography>
              </Box>
            )}
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredDocuments.map((document) => (
                <ListItem 
                  key={document.id} 
                  button 
                  onClick={() => handleSelectDocument(document)}
                  sx={{ 
                    mb: 1, 
                    borderRadius: 1,
                    bgcolor: multiSelect && isDocumentSelected(document.id) 
                      ? alpha(theme.palette.primary.main, 0.1) 
                      : 'inherit'
                  }}
                >
                  {multiSelect && (
                    <Checkbox 
                      edge="start" 
                      checked={isDocumentSelected(document.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  )}
                  <ListItemIcon>
                    {document.mimeType?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
                     document.mimeType?.includes('word') ? <ArticleIcon color="primary" /> :
                     document.mimeType?.includes('image') ? <ImageIcon color="success" /> :
                     <FileIcon />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={document.name} 
                    secondary={`${(document.size / 1024).toFixed(1)} KB • ${new Date(document.updatedAt || document.date).toLocaleDateString()}`} 
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        {multiSelect && (
          <Button 
            onClick={handleConfirmSelection} 
            variant="contained" 
            disabled={selectedDocuments.length === 0}
          >
            Conferma selezione
          </Button>
        )}
      </DialogActions>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// Componente popup per la creazione di un nuovo progetto - Modificato con Cliente e Collezione
const NewProjectDialog = ({ open, onClose, onCreate, collections = [] }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [files, setFiles] = useState([]);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [collectionDocuments, setCollectionDocuments] = useState([]);
  const theme = useTheme();
  
  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleAddFromCollection = (selectedDocs) => {
    setCollectionDocuments(selectedDocs);
    setShowCollectionSelector(false);
  };
  
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      // Prepara i documenti dai file caricati
      const fileDocuments = files.map(file => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        date: new Date().toISOString()
      }));
      
      // Combina con documenti selezionati dalle collezioni
      const allDocuments = [
        ...fileDocuments,
        ...collectionDocuments
      ];
      
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName,
        client: clientName,
        date: new Date().toLocaleDateString(),
        documents: allDocuments
      };
      
      onCreate(newProject);
      
      // Reset dei campi
      setNewProjectName('');
      setClientName('');
      setFiles([]);
      setCollectionDocuments([]);
    }
  };
  
  // Rimuove documento dalla selezione di collezione
  const handleRemoveCollectionDocument = (docId) => {
    setCollectionDocuments(collectionDocuments.filter(doc => doc.id !== docId));
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 3,
        py: 2
      }}>
        <Typography variant="h5" fontWeight={600}>Crea Nuovo Progetto</Typography>
      </Box>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              label="Nome del progetto"
              fullWidth
              variant="outlined"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FolderIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              margin="dense"
              label="Nome del cliente"
              fullWidth
              variant="outlined"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Documenti</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<AttachFileIcon />}
                  sx={{ py: 1.5 }}
                >
                  {files.length > 0 ? `${files.length} documenti selezionati` : 'Carica documenti'}
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FolderIcon />}
                  sx={{ py: 1.5 }}
                  onClick={() => setShowCollectionSelector(true)}
                >
                  {collectionDocuments.length > 0 ? `${collectionDocuments.length} da collezioni` : 'Aggiungi da collezione'}
                </Button>
              </Grid>
            </Grid>
          </Grid>
          
          {files.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>File caricati:</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                <List dense>
                  {files.map((file, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
          
          {collectionDocuments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Documenti da collezioni:</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                <List dense>
                  {collectionDocuments.map((doc) => (
                    <ListItem 
                      key={doc.id} 
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => handleRemoveCollectionDocument(doc.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        {doc.mimeType?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
                         doc.mimeType?.includes('word') ? <ArticleIcon color="primary" /> :
                         doc.mimeType?.includes('image') ? <ImageIcon color="success" /> :
                         <FileIcon />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={doc.name} 
                        secondary={doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">Annulla</Button>
        <Button 
          onClick={handleCreateProject} 
          variant="contained"
          disabled={!newProjectName.trim()}
          startIcon={<AddIcon />}
        >
          Crea Progetto
        </Button>
      </DialogActions>
      
      {/* Dialog per selezionare documenti da collezioni */}
      <DocumentSelectorDialog
        open={showCollectionSelector}
        onClose={() => setShowCollectionSelector(false)}
        onSelect={handleAddFromCollection}
        collections={collections}
        multiSelect={true}
      />
    </Dialog>
  );
};

// Componente per creare una nuova collezione - con gestione documenti
const NewCollectionDialog = ({ open, onClose, onCreate, onUploadDocuments }) => {
  const [collectionName, setCollectionName] = useState('');
  const [files, setFiles] = useState([]);
  const theme = useTheme();

  // Reset dei campi quando il dialogo viene aperto
  useEffect(() => {
    if (open) {
      setCollectionName('');
      setFiles([]);
    }
  }, [open]);
  
  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleCreateCollection = () => {
    if (collectionName.trim()) {
      const newCollection = {
        id: 'col-' + Date.now().toString(),
        name: collectionName,
        documentCount: files.length,
        createdAt: new Date().toISOString()
      };
      
      onCreate(newCollection);
      
      // Se ci sono file, chiamiamo la funzione di upload
      if (files.length > 0 && onUploadDocuments) {
        onUploadDocuments(newCollection.id, files);
      }
      
      // Reset dei campi
      setCollectionName('');
      setFiles([]);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
       borderBottom: `1px solid ${theme.palette.divider}`,
        px: 3,
        py: 2
      }}>
        <Typography variant="h5" fontWeight={600}>Crea Nuova Collezione</Typography>
      </Box>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              label="Nome della collezione"
              fullWidth
              variant="outlined"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreateNewFolderIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<AttachFileIcon />}
              sx={{ py: 1.5 }}
            >
              {files.length > 0 ? `${files.length} documenti selezionati` : 'Carica documenti'}
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>
          </Grid>
          
          {files.length > 0 && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                <List dense>
                  {files.map((file, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">Annulla</Button>
        <Button 
          onClick={handleCreateCollection} 
          variant="contained"
          disabled={!collectionName.trim()}
          startIcon={<CreateNewFolderIcon />}
          color="secondary"
        >
          Crea Collezione
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente per il dialogo di modifica progetto - Aggiornato con cliente e collezioni
const EditProjectDialog = ({ open, onClose, project, onUpdate, collections = [] }) => {
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [files, setFiles] = useState([]);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [addedDocuments, setAddedDocuments] = useState([]);
  const theme = useTheme();

  // Inizializza i dati del progetto quando il dialogo viene aperto
  useEffect(() => {
    if (open && project) {
      setProjectToEdit({...project});
      setFiles([]);
      setAddedDocuments([]);
    }
  }, [open, project]);

  const handleUpdateProject = () => {
    if (projectToEdit) {
      // Aggiungi i nuovi file ai documenti esistenti
      const newFileDocuments = files.map(file => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        date: new Date().toISOString()
      }));
      
      const updatedProject = {
        ...projectToEdit,
        documents: [
          ...(projectToEdit.documents || []),
          ...newFileDocuments,
          ...addedDocuments
        ]
      };
      
      onUpdate(updatedProject);
      setFiles([]);
      setAddedDocuments([]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleDeleteDocument = (docId) => {
    setProjectToEdit({
      ...projectToEdit,
      documents: projectToEdit.documents.filter(doc => doc.id !== docId)
    });
  };
  
  const handleAddFromCollection = (selectedDocs) => {
    setAddedDocuments(selectedDocs);
    setShowCollectionSelector(false);
  };
  
  const handleRemoveAddedDocument = (docId) => {
    setAddedDocuments(addedDocuments.filter(doc => doc.id !== docId));
  };

  if (!projectToEdit) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Modifica Progetto</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              label="Nome del progetto"
              fullWidth
              variant="outlined"
              value={projectToEdit.name || ''}
              onChange={(e) => setProjectToEdit({...projectToEdit, name: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FolderIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              margin="dense"
              label="Nome del cliente"
              fullWidth
              variant="outlined"
              value={projectToEdit.client || ''}
              onChange={(e) => setProjectToEdit({...projectToEdit, client: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Documenti ({projectToEdit.documents?.length || 0})</Typography>
            
            {projectToEdit.documents && projectToEdit.documents.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 1.5, maxHeight: '200px', overflow: 'auto' }}>
                <List dense>
                  {projectToEdit.documents.map((doc) => (
                    <ListItem 
                      key={doc.id} 
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDocument(doc.id)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        {doc.type?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
                         doc.type?.includes('word') ? <ArticleIcon color="primary" /> :
                         doc.type?.includes('image') ? <ImageIcon color="success" /> :
                         <FileIcon />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={doc.name} 
                        secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Box sx={{ 
                p: 2, 
                textAlign: 'center', 
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun documento caricato
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Aggiungi documenti</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<AttachFileIcon />}
                  sx={{ py: 1.5 }}
                >
                  {files.length > 0 ? `${files.length} nuovi documenti` : 'Carica documenti'}
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FolderIcon />}
                  sx={{ py: 1.5 }}
                  onClick={() => setShowCollectionSelector(true)}
                >
                  Aggiungi da collezione
                </Button>
              </Grid>
            </Grid>
          </Grid>
          
          {files.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>File caricati:</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                <List dense>
                  {files.map((file, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
          
          {addedDocuments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Documenti da collezioni:</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                <List dense>
                  {addedDocuments.map((doc) => (
                    <ListItem 
                      key={doc.id} 
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => handleRemoveAddedDocument(doc.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        {doc.mimeType?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
                         doc.mimeType?.includes('word') ? <ArticleIcon color="primary" /> :
                         doc.mimeType?.includes('image') ? <ImageIcon color="success" /> :
                         <FileIcon />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={doc.name} 
                        secondary={doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          onClick={handleUpdateProject} 
          variant="contained"
          disabled={!projectToEdit.name}
        >
          Aggiorna
        </Button>
      </DialogActions>
      
      {/* Dialog per selezionare documenti da collezioni */}
      <DocumentSelectorDialog
        open={showCollectionSelector}
        onClose={() => setShowCollectionSelector(false)}
        onSelect={handleAddFromCollection}
        collections={collections}
        multiSelect={true}
      />
    </Dialog>
  );
};

// Componente per il dialogo di modifica collezione - Aggiornato per gestire documenti
const EditCollectionDialog = ({ open, onClose, collection, onUpdate, documentService }) => {
  const [collectionToEdit, setCollectionToEdit] = useState(null);
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  // Inizializza i dati della collezione quando il dialogo viene aperto
  useEffect(() => {
    if (open && collection) {
      setCollectionToEdit({...collection});
      setFiles([]);
      loadCollectionDocuments(collection.id);
    }
  }, [open, collection]);

  // Carica i documenti della collezione
  const loadCollectionDocuments = async (collectionId) => {
    if (!collectionId) return;
    
    setLoading(true);
    try {
      // In produzione si userebbe documentService.getCollectionDocuments
      // Qui simuliamo una risposta con documenti fittizi
      const mockDocuments = [
        {
          id: `doc-${Date.now()}-1`,
          name: `Doc_${collection.name}_1.docx`,
          size: 245 * 1024,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          date: new Date().toISOString(),
          collectionId: collectionId
        },
        {
          id: `doc-${Date.now()}-2`,
          name: `Doc_${collection.name}_2.pdf`,
          size: 412 * 1024,
          type: 'application/pdf',
          date: new Date().toISOString(),
          collectionId: collectionId
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error("Errore durante il caricamento dei documenti:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCollection = () => {
    if (collectionToEdit) {
      // Calcola il nuovo conteggio documenti
      const documentCount = documents.length + files.length;
      
      const updatedCollection = {
        ...collectionToEdit,
        documentCount
      };
      
      onUpdate(updatedCollection, files);
      setFiles([]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleDeleteDocument = (docId) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  if (!collectionToEdit) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Modifica Collezione</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              label="Nome della collezione"
              fullWidth
              variant="outlined"
              value={collectionToEdit.name || ''}
              onChange={(e) => setCollectionToEdit({...collectionToEdit, name: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreateNewFolderIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Documenti nella collezione ({documents.length})
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : documents.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 1.5, maxHeight: '200px', overflow: 'auto' }}>
                <List dense>
                  {documents.map((doc) => (
                    <ListItem 
                      key={doc.id} 
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDocument(doc.id)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        {doc.type?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
                         doc.type?.includes('word') ? <ArticleIcon color="primary" /> :
                         doc.type?.includes('image') ? <ImageIcon color="success" /> :
                         <FileIcon />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={doc.name} 
                        secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(doc.date).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Box sx={{ 
                p: 2, 
                textAlign: 'center', 
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun documento in questa collezione
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<AttachFileIcon />}
              sx={{ py: 1.5 }}
            >
              {files.length > 0 ? `${files.length} nuovi documenti selezionati` : 'Aggiungi documenti'}
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>
          </Grid>
          
          {files.length > 0 && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: '150px', overflow: 'auto' }}>
                <List dense>
                  {files.map((file, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          onClick={handleUpdateCollection} 
          variant="contained"
          disabled={!collectionToEdit.name}
          color="secondary"
        >
          Aggiorna
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principale Multiagent
function Multiagent() {
  const { theme } = useContext(ThemeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [promptInputRef, setPromptInputRef] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Stato per la ricerca unificata
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stato per la modalità della pagina (seleziona progetto o lavora su progetto)
  const [pageMode, setPageMode] = useState('select'); // 'select' o 'work'
  
  // Stato per i progetti
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Stato per il dialogo di creazione nuovo progetto
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  
  // Stato per il dialogo di modifica progetto
  const [editProjectDialog, setEditProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  
  // Stato per il dialogo di conferma eliminazione
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // Stato per le collezioni
  const [collections, setCollections] = useState([]);
  const [newCollectionDialog, setNewCollectionDialog] = useState(false);
  const [editCollectionDialog, setEditCollectionDialog] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState(null);
  const [deleteCollectionDialog, setDeleteCollectionDialog] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  
  // Stato per il toggle delle collezioni (espanse/compresse)
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);
  
  // Stato per i gruppi di lavoro disponibili
  const [workspaces, setWorkspaces] = useState([
    { id: 'ws-1', name: 'Team Contenzioso' },
    { id: 'ws-2', name: 'Team Contrattualistica' }
  ]);
  
  // Stato per il prompt ed agenti
  const [prompt, setPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  
  // Stato per l'output
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stato per l'artifact (Lexychain)
  const [artifact, setArtifact] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Stato per drawer documenti
  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  
  // Stato per @mentions
  const [showMentions, setShowMentions] = useState(false);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  
  // Stato per la Lexychain espandibile
  const [lexychainExpanded, setLexychainExpanded] = useState(false);
  
  // Stato per l'editor di testo
  const [editorOpen, setEditorOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  
  // Stato per la visualizzazione a schermo intero dell'artifact
  const [fullScreenArtifactOpen, setFullScreenArtifactOpen] = useState(false);
  
  // Nuovo stato per DocumentService e funzionalità correlate
  const [documentService, setDocumentService] = useState(null);
  const [documentCollections, setDocumentCollections] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });

  // Lista agenti disponibili
  const availableAgents = [
    { id: 'researcher', name: 'Ricercatore', description: 'Ricerca giurisprudenza e normative', nickName: '@ricercatore' },
    { id: 'writer', name: 'Redattore', description: 'Genera documenti legali di qualità', nickName: '@redattore' },
    { id: 'lawyer', name: 'Avvocato', description: 'Analisi legale e strategia processuale', nickName: '@avvocato' },
    { id: 'coder', name: 'Analista Dati', description: 'Analisi quantitativa di documenti e pratiche', nickName: '@analista' },
    { id: 'notary', name: 'Notaio', description: 'Verifica formale di documenti', nickName: '@notaio' },
    { id: 'mediator', name: 'Mediatore', description: 'Supporto per conciliazioni e mediazioni', nickName: '@mediatore' },
    { id: 'executor', name: 'Esecutore', description: 'Automazione di pratiche standardizzate', nickName: '@esecutore' },
  ];

  // Progetti e collezioni filtrati in base alla ricerca
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.notes && project.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [projects, searchTerm]);
  
  const filteredCollections = useMemo(() => {
    if (!searchTerm.trim()) return collections;
    
    return collections.filter(collection => 
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.tag && collection.tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [collections, searchTerm]);

  // Inizializzazione del servizio DocumentService
  useEffect(() => {
    // Simulazione di API key - in produzione verrebbe ottenuta dall'autenticazione
    const apiKey = 'example_api_key_' + Date.now();
    const service = new DocumentService(apiKey);
    setDocumentService(service);
    
    // Simula il recupero delle collezioni di documenti
    const mockCollections = [
      { id: 'col-1', name: 'Contenziosi', documentCount: 24 },
      { id: 'col-2', name: 'Contratti', documentCount: 16 },
      { id: 'col-3', name: 'Documenti Personali', documentCount: 8 }
    ];
    setDocumentCollections(mockCollections);
    setCollections(mockCollections);
  }, []);

  // Funzione per gestire l'upload di documenti in una collezione
  const handleUploadDocumentsToCollection = (collectionId, files) => {
    if (!files.length) return;
    
    // Aggiungi i documenti alla collezione
    const uploadedDocuments = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      date: new Date().toISOString(),
      collectionId,
      isReadOnly: true, // I documenti delle collezioni sono solo visualizzabili, non modificabili
      content: `Contenuto del documento "${file.name}" caricato nella collezione`
    }));
    
    // Aggiorna il conteggio dei documenti nella collezione
    setCollections(prev => 
      prev.map(col => 
        col.id === collectionId 
          ? { ...col, documentCount: (col.documentCount || 0) + files.length } 
          : col
      )
    );
    
    // Aggiungi i documenti all'array globale
    setDocuments(prev => [...uploadedDocuments, ...prev]);
    
    // Mostra notifica
    setNotification({
      show: true,
      message: `${files.length} documenti caricati nella collezione`,
      severity: 'success'
    });
  };

  // Funzione per aprire il dialogo di modifica
  const handleEditProject = (project, event) => {
    event.stopPropagation(); // Previene l'apertura del progetto
    setProjectToEdit({...project});
    setEditProjectDialog(true);
  };

  // Funzione per aggiornare il progetto
  const handleUpdateProject = (updatedProject) => {
    if (updatedProject) {
      const updatedProjects = projects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      
      setProjects(updatedProjects);
      setEditProjectDialog(false);
      setProjectToEdit(null);
      
      // Se il progetto aggiornato è quello attualmente selezionato, aggiorna anche quello
      if (selectedProject && selectedProject.id === updatedProject.id) {
        setSelectedProject(updatedProject);
        // Aggiorna anche i documenti disponibili nel multiagente
        if (updatedProject.documents) {
          setDocuments(updatedProject.documents);
        }
      }
    }
  };

  // Funzione per eliminare un progetto
  const handleDeleteProject = (project, event) => {
    event.stopPropagation(); // Previene l'apertura del progetto
    setProjectToDelete(project);
    setDeleteConfirmDialog(true);
  };
  
  // Funzione per confermare l'eliminazione
  const confirmDeleteProject = () => {
    if (projectToDelete) {
      const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
      setProjects(updatedProjects);
      setDeleteConfirmDialog(false);
      setProjectToDelete(null);
    }
  };

  // Funzioni per gestire le collezioni
  const handleCreateCollection = (newCollection) => {
    setCollections([newCollection, ...collections]);
    setNewCollectionDialog(false);
  };

  const handleUpdateCollection = (updatedCollection, newFiles = []) => {
    if (updatedCollection) {
      const updatedCollections = collections.map(c => 
        c.id === updatedCollection.id ? updatedCollection : c
      );
      
      setCollections(updatedCollections);
      setEditCollectionDialog(false);
      setCollectionToEdit(null);
      
      // Se sono stati aggiunti nuovi file, aggiornali nella collezione
      if (newFiles.length > 0) {
        handleUploadDocumentsToCollection(updatedCollection.id, newFiles);
      }
    }
  };

  const handleDeleteCollection = (collectionId) => {
    if (collectionId) {
      // Se stai visualizzando la collezione da eliminare, torna alla vista principale
      if (selectedCollection && selectedCollection.id === collectionId) {
        setSelectedCollection(null);
      }
      
      const updatedCollections = collections.filter(c => c.id !== collectionId);
      setCollections(updatedCollections);
      setDeleteCollectionDialog(false);
      setCollectionToDelete(null);
      
      // Rimuovi anche eventuali documenti associati a questa collezione
      setDocuments(prev => prev.filter(doc => doc.collectionId !== collectionId));
    }
  };

  // Funzione per ripristinare un documento dalla Lexychain
  const handleRestoreDocument = (activity) => {
    if (!activity.documentContent || activity.status !== 'editing') return;
    
    // Crea un nuovo artifact basato sull'attività selezionata
    const restoredArtifact = {
      name: activity.documentName || 'Documento_Ripristinato.docx',
      size: activity.documentSize || '256 KB',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content: activity.documentContent,
      isEditable: true
    };
    
    // Imposta il nuovo artifact
    setArtifact(restoredArtifact);
    
    // Aggiungi una nuova attività per registrare il ripristino
    setActivities([
      {
        status: 'viewing',
        description: `Documento ripristinato: ${restoredArtifact.name}`,
        timestamp: new Date().toLocaleTimeString(),
        documentId: activity.documentId,
        documentContent: activity.documentContent,
        documentName: activity.documentName,
        documentSize: activity.documentSize
      },
      ...activities
    ]);
  };
  
  // Gestione input prompt e @mentions
  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    
    // Controllo per @mentions
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    
    // Verifica se l'ultimo carattere digitato è '@'
    if (newValue.charAt(cursorPos - 1) === '@' && (cursorPos === 1 || newValue.charAt(cursorPos - 2) === ' ')) {
      setShowMentions(true);
      setMentionAnchorEl(e.target);
    } else {
      // Verifica se siamo ancora in una sequenza di menzione
      const lastAtPos = newValue.substring(0, cursorPos).lastIndexOf('@');
      if (lastAtPos !== -1) {
        const textAfterAt = newValue.substring(lastAtPos + 1, cursorPos);
        // Se c'è testo dopo @ e non contiene spazi, siamo ancora in una menzione
        if (textAfterAt && !textAfterAt.includes(' ')) {
          setShowMentions(true);
          setMentionAnchorEl(e.target);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    }
  };
  
  // Inserisci menzione dell'agente
  const handleAgentMention = (agent) => {
    if (!prompt) return;
    // Trova la posizione dell'ultimo @
    const lastAtPos = prompt.substring(0, cursorPosition).lastIndexOf('@');
    if (lastAtPos === -1) return;

    // Sostituisci @... con @nickName
    const beforeAt = prompt.substring(0, lastAtPos);
    const afterCursor = prompt.substring(cursorPosition);

    // Estrai il nickName senza @ (il sistema già ha aggiunto @)
    const nickNameWithoutAt = agent.nickName.substring(1);

    const newPrompt = beforeAt + '@' + nickNameWithoutAt + ' ' + afterCursor;
    setPrompt(newPrompt);

    // Aggiungi l'agente ai selezionati se non c'è già
    if (!selectedAgents.some(a => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }

    setShowMentions(false);
  };
  
  const handleCreateProject = (newProject) => {
    setProjects([newProject, ...projects]);
    setNewProjectDialog(false);
    setSelectedProject(newProject);
    setPageMode('work');
    
    // Se il nuovo progetto contiene documenti, aggiornali nella vista multiagente
    if (newProject.documents && newProject.documents.length > 0) {
      setDocuments(newProject.documents);
    }
  };
  
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setPageMode('work');
    
    // Carica i documenti del progetto
    if (project.documents && project.documents.length > 0) {
      setDocuments(project.documents);
    } else {
      setDocuments([]);
    }
  };
  
  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    
    // Qui puoi implementare la logica per caricare i documenti della collezione
    // utilizzando documentService.getCollectionDocuments(collection.id)
    
    // Esempio:
    setIsLoadingDocuments(true);
    
    setTimeout(() => {
      // Simulazione del caricamento dei documenti di una collezione
      const mockDocuments = [
        {
          id: `doc-${Date.now()}-1`,
          name: `Doc_${collection.name}_1.docx`,
          size: 245 * 1024,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          date: new Date().toISOString(),
          isReadOnly: true,
          content: `Contenuto del documento 1 nella collezione "${collection.name}"`
        },
        {
          id: `doc-${Date.now()}-2`,
          name: `Doc_${collection.name}_2.pdf`,
          size: 412 * 1024,
          type: 'application/pdf',
          date: new Date().toISOString(),
          isReadOnly: true,
          content: `Contenuto del documento 2 nella collezione "${collection.name}"`
        }
      ];
      
      setDocuments(mockDocuments);
      setIsLoadingDocuments(false);
    }, 1000);
  };
  
  const handleSendPrompt = () => {
    if (prompt.trim() && selectedAgents.length > 0) {
      setIsProcessing(true);
      // Salva temporaneamente gli agenti selezionati per la risposta
      const currentSelectedAgents = [...selectedAgents];
      
      // Aggiungi il messaggio dell'utente
      setMessages(prev => [...prev, {
        type: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Aggiungi attività
      setActivities(prev => [
        {
          status: 'thinking',
          description: 'Analisi del prompt in corso',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      
      // Resetta gli agenti selezionati e il prompt
      setSelectedAgents([]);
      
      // Simulazione di elaborazione
      setTimeout(() => {
        // Generazione risposta degli agenti
        const agentMessages = currentSelectedAgents.map(agent => ({
          type: 'agent',
          content: `Risposta dell'agente ${agent.name} al prompt: "${prompt}"`,
          timestamp: new Date().toLocaleTimeString(),
          agent
        }));
        
        setMessages(prev => [...prev, ...agentMessages]);
        
        // Generazione intelligente del nome documento
        const generatedTitle = DocumentTitleGenerator.generateTitle(prompt);
        
        // Simulazione artifact
        const newArtifact = {
          name: generatedTitle,
          size: `${Math.floor(Math.random() * 500) + 100} KB`,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          content: `Contenuto del documento generato in risposta al prompt: "${prompt}"`
        };
        
        setArtifact(newArtifact);
        
        // Aggiorna attività
        setActivities(prev => [
          {
            status: 'editing',
            description: `Documento generato: ${generatedTitle}`,
            timestamp: new Date().toLocaleTimeString(),
            documentId: Date.now().toString(),
            documentContent: newArtifact.content,
            documentName: newArtifact.name,
            documentSize: newArtifact.size
          },
          ...prev
        ]);
        
        // Resetta il prompt dopo la risposta
        setPrompt('');
        setIsProcessing(false);
      }, 2000);
    }
  };
  
  // Funzione modificata per caricare un documento
  const handleUploadDocument = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsLoadingDocuments(true);
      try {
        const newDocuments = [];
        const newProcessingDocs = [];
        
        // Processa ogni file selezionato
        for (const file of Array.from(e.target.files)) {
          // Crea struttura documento per l'interfaccia
          const newDocument = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            date: new Date().toISOString(),
            content: `Contenuto simulato del documento "${file.name}". Questo è un esempio di contenuto generato automaticamente per mostrare come apparirebbe il documento quando viene ripristinato nell'area Artifact.`
          };
          
          newDocuments.push(newDocument);
          
          // Simula documento in elaborazione
          newProcessingDocs.push({
            ...newDocument,
            status: 'PROCESSING',
            progress: 0
          });
          
          // Se utilizziamo un servizio API reale, potremmo fare l'upload qui
          if (documentService && selectedProject?.id) {
            try {
              /* 
              // Codice per upload reale - commentato per sviluppo
              const options = {
                name: file.name,
                description: `Caricato nel progetto: ${selectedProject.name}`,
                collectionId: selectedProject.collectionId || null,
                processingType: 'TEXT',
                priority: 'NORMAL'
              };
              
              const response = await documentService.uploadDocument(file, options);
              console.log('Documento inviato con successo:', response);
              */
            } catch (uploadError) {
              console.error('Errore durante il caricamento:', uploadError);
            }
          }
        }
        
        // Aggiungi i nuovi documenti all'array esistente
        setDocuments(prev => [...newDocuments, ...prev]);
        
        // Aggiungi documenti in elaborazione
        setProcessingDocuments(prev => [...newProcessingDocs, ...prev]);
        
        // Aggiungi attività per ogni documento caricato
        const newActivities = newDocuments.map(doc => ({
          status: 'browsing',
          description: `Documento caricato: ${doc.name}`,
          timestamp: new Date().toLocaleTimeString(),
          documentId: doc.id,
          documentContent: doc.content,
          documentName: doc.name,
          documentSize: doc.size
        }));
        
        setActivities(prev => [...newActivities, ...prev]);
        
        // Mostra messaggio di successo
        setNotification({
          show: true,
          message: `${newDocuments.length} documenti caricati con successo`,
          severity: 'success'
        });
        
        // Aggiorna il progetto selezionato con i nuovi documenti se siamo in modalità progetto
        if (selectedProject) {
          const updatedProject = {
            ...selectedProject,
            documents: [...(selectedProject.documents || []), ...newDocuments]
          };
          
          // Aggiorna il progetto nella lista progetti
          setProjects(prev => prev.map(p => 
            p.id === selectedProject.id ? updatedProject : p
          ));
          
          setSelectedProject(updatedProject);
        }
      } catch (error) {
        console.error('Errore durante il processamento dei file:', error);
        setNotification({
          show: true,
          message: 'Si è verificato un errore durante il caricamento dei documenti',
          severity: 'error'
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    }
  };

  // Funzione modificata per eliminare un documento
  const handleDeleteDocument = async (documentId) => {
    try {
      // Prima rimuovi dall'interfaccia
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      // Rimuovi dai documenti in elaborazione
      setProcessingDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      
      // Se siamo in modalità progetto, aggiorna anche il progetto
      if (selectedProject && selectedProject.documents) {
        const updatedProject = {
          ...selectedProject,
          documents: selectedProject.documents.filter(doc => doc.id !== documentId)
        };
        
        // Aggiorna il progetto nella lista progetti
        setProjects(prev => prev.map(p => 
          p.id === selectedProject.id ? updatedProject : p
        ));
        
        setSelectedProject(updatedProject);
      }
      
      // Poi elimina dall'API se disponibile
      if (documentService) {
        try {
          // await documentService.deleteDocument(documentId);
          console.log('Documento eliminato:', documentId);
        } catch (error) {
          console.error('Errore durante l\'eliminazione del documento:', error);
        }
      }
      
      // Mostra messaggio di successo
      setNotification({
        show: true,
        message: 'Documento eliminato con successo',
        severity: 'success'
      });
    } catch (error) {
      console.error('Errore durante l\'eliminazione del documento:', error);
      setNotification({
        show: true,
        message: 'Errore durante l\'eliminazione del documento',
        severity: 'error'
      });
    }
  };
  
  // Funzione per visualizzare un documento
  const handleViewDocument = (document) => {
    // Imposta il documento come artefatto attuale
    setArtifact(document);
    // Aggiungi attività per registrare la visualizzazione
    setActivities(prev => [
      {
        status: 'viewing',
        description: `Documento visualizzato: ${document.name}`,
        timestamp: new Date().toLocaleTimeString(),
        documentId: document.id,
        documentContent: document.content,
        documentName: document.name,
        documentSize: document.size
      },
      ...prev
    ]);
    
    // Apri la visualizzazione a schermo intero
    setFullScreenArtifactOpen(true);
  };
  
  // Funzione per selezionare un documento dalla collezione
  const handleSelectDocument = (document) => {
    console.log('Documento selezionato:', document);
    // Chiudi il selettore
    setDocumentSelectorOpen(false);
    
    // Aggiungi un po' di ritardo per simulare il caricamento
    setIsLoadingDocuments(true);
    
    setTimeout(() => {
      // Crea un documento locale per l'interfaccia
      const localDocument = {
        ...document,
        isReadOnly: true,
        content: `Contenuto del documento ${document.name} caricato dalla collezione.
          
    Questo è un esempio di contenuto che verrebbe normalmente caricato dall'API del servizio documenti. Il documento reale avrebbe tutte le informazioni specifiche relative al caso in questione, formattate secondo gli standard legali e pronte per essere analizzate dagli agenti o modificate dall'utente.
    
    Il sistema supporta anche l'estrazione di testo, il riassunto del contenuto e l'identificazione di entità chiave all'interno del documento.`
      };
      
      // Imposta il documento come artefatto attuale
      setArtifact(localDocument);
      
      // Aggiungi il documento alla lista locale se non è già presente
      setDocuments(prevDocs => {
        if (!prevDocs.some(doc => doc.id === document.id)) {
          return [localDocument, ...prevDocs];
        }
        return prevDocs;
      });
      
      setActivities(prev => [
        {
          status: 'browsing',
          description: `Documento selezionato: ${document.name}`,
          timestamp: new Date().toLocaleTimeString(),
          documentId: document.id,
          documentContent: localDocument.content,
          documentName: document.name,
          documentSize: document.size || '0 KB'
        },
        ...prev
      ]);
      
      setIsLoadingDocuments(false);
    }, 1000);
  };
  
  const handleReturnToProjects = () => {
    setPageMode('select');
    setSelectedProject(null);
    setPrompt('');
    setSelectedAgents([]);
    setMessages([]);
    setArtifact(null);
    setActivities([]);
  };
  
  // Funzione per gestire il download del documento con logica avanzata
  const handleDownloadArtifact = async () => {
    if (!artifact) return;
    try {
      // Estrai il contenuto HTML
      const content = artifact.content;
      const fontSize = 12; // Valore predefinito per la dimensione del font
      
      // Crea un elemento temporaneo per analizzare il contenuto HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Funzione per estrarre testo pulito dagli elementi
      const extractTextFromElement = (element) => {
        return element.textContent.trim();
      };
      
      // Inizializza un documento Word con configurazione migliorata
      const doc = new Document({
        sections: [],
        // Imposta eventuali proprietà globali del documento
        styles: {
          default: {
            document: {
              run: {
                font: "Calibri",
                size: fontSize * 2 // docx usa half-points
              },
              paragraph: {
                spacing: { after: 200 } // spazio dopo ogni paragrafo
              }
            }
          }
        }
      });
      
      const docChildren = [];
      
      // Funzione per convertire elementi HTML in componenti docx
      const processElements = () => {
        // Aggiungi un paragrafo vuoto all'inizio per assicurarsi che il contenuto inizi alla prima pagina
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "",
                size: fontSize * 2,
              })
            ],
            spacing: { after: 0, before: 0 },
            pageBreakBefore: false,
          })
        );
        
        // Seleziona tutti gli elementi di primo livello
        const elements = tempDiv.querySelectorAll('body > *');
        
        if (elements.length === 0) {
          // Se non ci sono elementi, aggiungi un paragrafo con il testo completo
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: tempDiv.textContent.trim() || 'Documento vuoto',
                  size: fontSize * 2,
                })
              ],
              spacing: { after: 200 },
              pageBreakBefore: false,
            })
          );
          return;
        }
        
        // Processa ogni elemento di primo livello
        elements.forEach(element => {
          switch (element.tagName.toLowerCase()) {
            case 'h1':
              docChildren.push(
                new Paragraph({
                  text: extractTextFromElement(element),
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 240, after: 120 },
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'h2':
              docChildren.push(
                new Paragraph({
                  text: extractTextFromElement(element),
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 240, after: 120 },
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'h3':
              docChildren.push(
                new Paragraph({
                  text: extractTextFromElement(element),
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 240, after: 120 },
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'p':
              // Salta paragrafi vuoti
              const paragraphText = extractTextFromElement(element);
              if (!paragraphText) break;
              
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: paragraphText,
                      size: fontSize * 2,
                    })
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'ul':
            case 'ol':
              const listItems = element.querySelectorAll('li');
              listItems.forEach(li => {
                const itemText = extractTextFromElement(li);
                if (itemText) {
                  docChildren.push(
                    new Paragraph({
                      text: itemText,
                      bullet: { level: 0 },
                      spacing: { after: 100 },
                      pageBreakBefore: false,
                    })
                  );
                }
              });
              break;
              
            default:
              // Per altri tipi di elementi, estrai il testo e creane un paragrafo
              const text = extractTextFromElement(element);
              if (text) {
                docChildren.push(
                  new Paragraph({
                    text,
                    spacing: { after: 200 },
                    pageBreakBefore: false,
                  })
                );
              }
              break;
          }
        });
      };
      
      // Esegui la conversione
      processElements();
      
      // Se non ci sono elementi, aggiungi un paragrafo vuoto
      if (docChildren.length === 0) {
        docChildren.push(
          new Paragraph({
            text: "Documento vuoto",
            pageBreakBefore: false
          })
        );
      }
      
      // Aggiungi la sezione con tutti gli elementi
      doc.addSection({
        children: docChildren,
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            },
            size: {
              width: 11906, // A4 width
              height: 16838, // A4 height
            }
          },
          // Assicurati di non avere interruzioni di pagina all'inizio
          pageBreakBefore: false
        }
      });
      
      // Genera il file DOCX usando Blob per compatibilità browser
      const docxBlob = await Packer.toBlob(doc);
      
      // Prepara il nome del file
      const fileName = artifact.name || 'Documento';
      const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
      const fileNameWithExtension = `${fileNameWithoutExtension}.docx`;
      
      // Crea un oggetto URL e avvia il download
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameWithExtension;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Aggiorna le attività
      setActivities([
        {
          status: 'browsing',
          description: `Documento scaricato: ${artifact.name}`,
          timestamp: new Date().toLocaleTimeString(),
          documentId: Date.now().toString(),
          documentName: artifact.name,
          documentSize: artifact.size
        },
        ...activities
      ]);
      
      // Notifica successo
      setNotification({
        show: true,
        message: 'Documento scaricato con successo',
        severity: 'success'
      });
      
    } catch (error) {
      console.error("Errore durante l'esportazione in DOCX:", error);
      
      // In caso di errore, tenta il fallback all'esportazione HTML
      try {
        console.log("Tentativo di fallback all'esportazione HTML...");
        
        // Crea un contenuto HTML ben formattato compatibile con Word
        const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <title>${artifact.name || 'Documento'}</title>
  <style>
    /* Stili generali */
    body {
      font-family: 'Calibri', sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      margin: 2cm;
      padding: 0;
    }
    /* Stili specifici per Word */
    @page { size: 21cm 29.7cm; margin: 2cm; mso-page-orientation: portrait; }
    div.WordSection1 { page: WordSection1; mso-first-header: id1; }
    p { margin-bottom: 10pt; }
    h1 { font-size: 18pt; font-weight: bold; }
    h2 { font-size: 16pt; font-weight: bold; }
    h3 { font-size: 14pt; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <!-- Imposta esplicitamente per evitare interruzioni di pagina iniziali -->
  <div class="WordSection1" style="page-break-before: avoid;">
    <!-- Paragrafo vuoto per assicurarsi che il contenuto inizi alla prima pagina -->
    <p style="margin:0; padding:0; font-size:1pt; line-height:1pt;">&nbsp;</p>
    ${extractHtmlContent(artifact.content)}
  </div>
</body>
</html>`;

        // Prepara il nome del file
        const fileName = artifact.name || 'Documento';
        const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
        const fileNameWithExtension = `${fileNameWithoutExtension}.html`;
        
        // Crea un Blob con il contenuto HTML
        const htmlBlob = new Blob([wordHtml], { 
          type: 'text/html;charset=utf-8' 
        });
        
        // Crea un link per scaricare il file
        const fallbackUrl = URL.createObjectURL(htmlBlob);
        const fallbackLink = document.createElement('a');
        fallbackLink.href = fallbackUrl;
        fallbackLink.download = fileNameWithExtension;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
        URL.revokeObjectURL(fallbackUrl);
        
        // Mostra un messaggio informativo all'utente
        setNotification({
          show: true,
          message: "Non è stato possibile generare un file DOCX. È stato scaricato un file HTML che puoi aprire con Microsoft Word e salvare come documento Word (.docx).",
          severity: 'warning'
        });
        
        // Aggiorna comunque le attività
        setActivities([
          {
            status: 'browsing',
            description: `Documento scaricato: ${artifact.name} (HTML)`,
            timestamp: new Date().toLocaleTimeString(),
            documentId: Date.now().toString(),
            documentName: artifact.name,
            documentSize: artifact.size
          },
          ...activities
        ]);
        
     } catch (fallbackError) {
        console.error("Anche il fallback è fallito:", fallbackError);
        setNotification({
          show: true,
          message: "Si è verificato un errore durante l'esportazione del documento. Riprova più tardi.",
          severity: 'error'
        });
      }
    }
  };
  
  // Funzione per gestire l'editing del documento
  const handleEditArtifact = () => {
    if (!artifact || artifact.isReadOnly) return;
    // Chiudi la vista a schermo intero se aperta
    setFullScreenArtifactOpen(false);
    
    // Apri l'editor interno
    setEditorOpen(true);
    setDocumentToEdit(artifact);
  };
  
  // Funzione per salvare il documento modificato
  const handleSaveDocument = (updatedDocument) => {
    // Aggiorna l'artifact corrente
    setArtifact(updatedDocument);
    // Aggiungi una nuova attività per la modifica
    setActivities([
      {
        status: 'editing',
        description: `Documento modificato: ${updatedDocument.name}`,
        timestamp: new Date().toLocaleTimeString(),
        documentId: Date.now().toString(),
        documentContent: updatedDocument.content,
        documentName: updatedDocument.name,
        documentSize: updatedDocument.size
      },
      ...activities
    ]);
    
    // Aggiorna anche il documento nella lista se presente
    setDocuments(prevDocs => {
      return prevDocs.map(doc => {
        if (doc.id === updatedDocument.id) {
          return updatedDocument;
        }
        return doc;
      });
    });
    
    // Se siamo in modalità progetto, aggiorna anche il progetto
    if (selectedProject && selectedProject.documents) {
      const updatedProjectDocuments = selectedProject.documents.map(doc => {
        if (doc.id === updatedDocument.id) {
          return updatedDocument;
        }
        return doc;
      });
      
      const updatedProject = {
        ...selectedProject,
        documents: updatedProjectDocuments
      };
      
      // Aggiorna il progetto nella lista
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id ? updatedProject : p
      ));
      
      setSelectedProject(updatedProject);
    }
    
    // Mostra notifica di successo
    setNotification({
      show: true,
      message: 'Documento salvato con successo',
      severity: 'success'
    });
  };
  
  // Funzione per aprire la vista a schermo intero dell'artifact
  const handleFullscreenArtifact = () => {
    if (artifact) {
      setFullScreenArtifactOpen(true);
    }
  };
  
  // Gestione della chiusura delle notifiche
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };
  
  // Render del componente
   return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: 'auto',
      minHeight: '100vh',
      overflow: 'auto',
      background: theme.palette.mode === 'dark' 
        ? `radial-gradient(circle at 0% 20%, ${alpha('#2D2B55', 0.6)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#28284D', 0.6)} 0%, transparent 30%),
           ${theme.palette.background.default}`
        : `radial-gradient(circle at 0% 20%, ${alpha('#F0E7FF', 0.4)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#EDF5FF', 0.4)} 0%, transparent 30%),
           ${theme.palette.background.default}`,
      backgroundAttachment: 'fixed',
      p: 2,
      pb: 6,
    }}>
      {pageMode === 'select' ? (
        /* Griglia progetti - versione responsive */
        <Box sx={{ 
          pb: collectionsExpanded ? 4 : 8,
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          <Box sx={{
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            width: '100%'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>I tuoi progetti</Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, md: 2 },
              width: { xs: '100%', md: 'auto' },
              flexDirection: { xs: 'column', md: 'row' },
              flexWrap: { xs: 'nowrap', md: 'wrap' }
            }}>
              <TextField
                placeholder="Cerca progetti e collezioni..."
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  width: { xs: '100%', sm: '300px' },
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.2) 
                    : alpha(theme.palette.background.paper, 0.8),
                  borderRadius: 1
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
                <Button 
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/')}
                  sx={{ flex: { xs: 1, md: 'none' } }}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => setNewProjectDialog(true)}
                  sx={{ flex: { xs: 1, md: 'none' } }}
                >
                  Nuovo Progetto
                </Button>
              </Box>
            </Box>
          </Box>
          
          {/* Prima i progetti con maggiore risalto */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Progetti</Typography>
          <Grid container spacing={3} sx={{ 
            mb: 5,
            width: '100%',
            mx: 'auto',
            maxWidth: { xs: '100%', lg: '1200px' }
          }}>
            {filteredProjects.length > 0 ? filteredProjects.map(project => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <ProjectCard 
                  onClick={() => handleSelectProject(project)}
                  sx={{ 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.dark, 0.2) 
                      : alpha(theme.palette.primary.light, 0.15),
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderIcon sx={{ color: 'primary.main', fontSize: 32, mr: 1 }} />
                      <Typography variant="h6" noWrap sx={{ maxWidth: '90%' }}>
                        {project.name}
                      </Typography>
                    </Box>
                    {project.client && (
                      <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        {project.client}
                      </Typography>
                    )}
                  </Box>
                  <CardContent sx={{ py: 1.5, flex: 1 }}>
                    <Typography color="text.secondary" variant="body2">
                      Creato il {project.date}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                      {project.documents?.length || 0} documenti
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ 
                    borderTop: `1px solid ${theme.palette.divider}`,
                    mt: 'auto',
                    pb: 1
                  }}>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />} 
                      onClick={(e) => handleEditProject(project, e)}
                    >
                      Modifica
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={(e) => handleDeleteProject(project, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </ProjectCard>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 5,
                  textAlign: 'center'
                }}>
                  <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6">Nessun progetto disponibile</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                    {searchTerm ? "Nessun progetto corrisponde alla tua ricerca" : "Crea un nuovo progetto per iniziare a lavorare con gli agenti"}
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setNewProjectDialog(true)}
                  >
                    Crea Nuovo Progetto
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Sezione Collezioni di documenti */}
          <Box sx={{ 
            mb: 6, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.2)' 
              : '0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'visible',
            width: '100%',
            mx: 'auto', 
            maxWidth: { xs: '100%', lg: '1200px' }
          }}>
            <Box 
              sx={{ 
                p: 2,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: collectionsExpanded ? `1px solid ${theme.palette.divider}` : 'none',
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.6) 
                    : alpha(theme.palette.background.paper, 0.8),
                },
                borderTopLeftRadius: theme.shape.borderRadius,
                borderTopRightRadius: theme.shape.borderRadius
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer'
              }} onClick={() => setCollectionsExpanded(!collectionsExpanded)}>
                <CreateNewFolderIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>Collezioni di documenti</Typography>
                <IconButton size="small" sx={{ ml: 1 }}>
                  {collectionsExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Box>
              
              {/* Pulsante Nuova Collezione */}
              <Button 
                variant="outlined" 
                color="secondary"
                size="small"
                startIcon={<CreateNewFolderIcon />}
                onClick={() => setNewCollectionDialog(true)}
              >
                Nuova Collezione
              </Button>
            </Box>
            
            {/* Contenuto collezioni - visibile solo quando espanso */}
            <Box sx={{ 
              height: collectionsExpanded ? 'auto' : 0,
              opacity: collectionsExpanded ? 1 : 0,
              visibility: collectionsExpanded ? 'visible' : 'hidden',
              transition: 'height 0.3s ease, opacity 0.2s ease',
              p: collectionsExpanded ? 2 : 0,
              pt: collectionsExpanded ? 2 : 0,
              overflow: 'visible',
              position: 'relative',
              zIndex: 0
            }}>
              {filteredCollections.length > 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                  maxWidth: '900px',
                  mx: 'auto',
                  mb: 2,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {filteredCollections.map((collection, index) => (
                    <Box 
                      key={collection.id}
                      sx={{
                        border: `1px solid ${theme.palette.secondary.main}`,
                        borderRadius: 1,
                        position: 'relative',
                        overflow: 'visible',
                        transform: `translateY(${index * 1}px)`,
                        marginTop: index > 0 ? '-6px' : 0,
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 1px 4px rgba(0,0,0,0.25)' 
                          : '0 1px 4px rgba(0,0,0,0.08)',
                        zIndex: filteredCollections.length - index,
                        width: '100%',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: `translateY(${index * 1 - 2}px)`,
                          boxShadow: '0 3px 8px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box sx={{ 
                        py: 1,
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: theme.palette.background.paper,
                        minHeight: '48px',
                        maxHeight: '48px',
                        borderRadius: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <CreateNewFolderIcon color="secondary" sx={{ mr: 1.5, fontSize: '1.1rem' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {collection.name}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            fontSize: '0.8rem'
                          }}>
                            <DescriptionIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7, fontSize: '1rem' }} />
                            {collection.documentCount || 0} documenti
                          </Typography>
                          
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectionToEdit(collection);
                              setEditCollectionDialog(true);
                            }}
                            sx={{ padding: '4px' }}
                          >
                            <EditIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectionToDelete(collection);
                              setDeleteCollectionDialog(true);
                            }}
                            sx={{ padding: '4px' }}
                          >
                            <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1
                }}>
                  <CreateNewFolderIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1">Nessuna collezione disponibile</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                    {searchTerm ? "Nessuna collezione corrisponde alla tua ricerca" : "Crea una nuova collezione per organizzare i tuoi documenti"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        /* Layout lavoro chat style - schermata fissa */
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          p: 0.5, 
          pb: 0
        }}>
          {/* Area output (attività) */}
          <Box sx={{ 
            display: 'flex', 
            flex: 1,
            gap: 1,
            height: 'calc(100% - 90px)',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* Area di sinistra (attività degli agenti) */}
            <Box sx={{ 
              width: isMobile ? '100%' : '45%',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden'
            }}>              
              <Quadrant sx={{ 
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                p: 1.5
              }}>
                {/* Header spostato all'interno del quadrante */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2,
                  flexShrink: 0
                }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleReturnToProjects}
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: 1
                    }}
                  >
                    Progetti
                  </Button>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600, 
                    flex: 1, 
                    textAlign: 'right',
                    pr: 2
                  }}>
                    Attività degli agenti
                  </Typography>
                </Box>
                
                {/* Messaggi con scorrimento interno */}
                <Box 
                  sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0
                  }}
                >
                  {messages.length > 0 ? messages.map((message, index) => (
                    <Message 
                      key={index}
                      type={message.type}
                      content={message.content}
                      timestamp={message.timestamp}
                      agent={message.agent}
                    />
                  )) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      textAlign: 'center',
                      p: 2
                    }}>
                      <BalanceIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 1.5 }} />
                      <Typography variant="h6">Inizia una nuova conversazione</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: '80%', mx: 'auto' }}>
                        Esempio: "Mi fornisci le clausole del contratto con l'agente @ricercatore e con l'agente @redattore mi redigi un file con tutte le clausole"
                      </Typography>
                    </Box>
                  )}
                  
                  {isProcessing && (
                    <Box sx={{ 
                      p: 1.5, 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: theme.palette.mode === 'dark' ? 
                        alpha(theme.palette.primary.main, 0.1) : 
                        alpha(theme.palette.primary.light, 0.1),
                      borderRadius: 2,
                      mt: 1
                    }}>
                      <CircularProgress size={18} sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                      <Typography variant="body2">Gli agenti stanno elaborando la risposta...</Typography>
                    </Box>
                  )}
                </Box>
              </Quadrant>
            </Box>
            
            {/* Area artifact e LexiChain */}
            <Box sx={{ 
              width: isMobile ? '100%' : '55%', 
              height: '100%', 
              display: isMobile ? 'none' : 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {/* Sezione Artifact */}
              <Box sx={{ 
                height: lexychainExpanded ? '50%' : '92%', 
                mb: 1, 
                overflow: 'hidden',
                transition: 'height 0.3s ease'
              }}>
                <Quadrant sx={{ 
                  height: '100%', 
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <QuadrantTitle variant="h6" sx={{ mb: 1, flexShrink: 0 }}>
                    <DescriptionIcon /> Artifact
                  </QuadrantTitle>
                  
                  {/* Contenitore Artifact */}
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.7) : theme.palette.divider,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    minHeight: 0
                  }}>
                    <Box sx={{ 
                      p: 1,
                      bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
                      borderBottom: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.7) : theme.palette.divider,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexShrink: 0
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FileIcon fontSize="small" sx={{ mr: 0.75, color: 'primary.main' }} />
                        <Typography variant="subtitle2">
                          {artifact ? artifact.name : 'Nessun documento'}
                        </Typography>
                      </Box>
                      
                      {artifact && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FullscreenIcon />}
                            onClick={handleFullscreenArtifact}
                            color="primary"
                            sx={{
                              borderRadius: 1,
                              py: 0.25,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText
                              }
                            }}
                          >
                            Visualizza
                          </Button>
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ 
                      p: 1.5, 
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 0
                    }}>
                      {artifact ? (
                        <div
                          dangerouslySetInnerHTML={{ 
                            __html: extractHtmlContent(artifact.content)
                          }}
                          style={{
                            fontFamily: '"Inter", sans-serif',
                            fontSize: '0.85rem',
                            lineHeight: '1.6',
                            wordBreak: 'break-word'
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '100%',
                          textAlign: 'center'
                        }}>
                          <DescriptionIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            I documenti elaborati appariranno qui in formato scaricabile ed editabile
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {artifact && (
                      <Box sx={{ 
                        p: 1, 
                        borderTop: '1px solid', 
                        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.7) : theme.palette.divider,
                        flexShrink: 0
                      }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleDownloadArtifact}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.8) : theme.palette.primary.main,
                              '&:hover': {
                                bgcolor: theme.palette.primary.dark
                              }
                            }}
                          >
                            Scarica
                          </Button>
                          {!artifact.isReadOnly && (
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={handleEditArtifact}
                            >
                              Modifica
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Quadrant>
              </Box>
              
              {/* Sezione LexiChain - comprimibile/espandibile con header corretto */}
              <Box sx={{ 
                height: lexychainExpanded ? 'calc(50% - 4px)' : '40px', // Altezza fissa quando compresso
                overflow: 'hidden',
                transition: 'height 0.3s ease'
              }}>
                <Quadrant sx={{ 
                  height: '100%', 
                  p: lexychainExpanded ? 1.5 : '0', // Rimuovi padding quando compresso
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Header della Lexychain migliorato */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: lexychainExpanded ? 0 : 1.5, // Aggiungi padding solo quando è compresso
                    height: '40px', // Altezza fissa per l'header
                    flexShrink: 0
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachFileIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Lexychain
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title="La Lexychain ti permette di accedere a documenti generati in precedenza" arrow>
                        <IconButton size="small" color="action" sx={{ mr: 1 }}>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
<Tooltip title={lexychainExpanded ? "Comprimi" : "Espandi"} arrow>
                        <IconButton 
                          size="small" 
                          onClick={() => setLexychainExpanded(!lexychainExpanded)}
                        >
                          {lexychainExpanded ? 
                            <KeyboardArrowDownIcon fontSize="small" /> : 
                            <KeyboardArrowUpIcon fontSize="small" />
                          }
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {/* Contenitore LexiChain con scroll interno - visibile solo quando espanso */}
                  <Box sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
                    mt: lexychainExpanded ? 1 : 0, // Margine solo quando espanso
                    display: lexychainExpanded ? 'block' : 'none'
                  }}>
                    <List dense disablePadding>
                      {activities.map((activity, index) => (
                        <ListItem 
                          key={index} 
                          disablePadding 
                          sx={{ 
                            mb: 1,
                            bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <Button 
                            fullWidth
                            sx={{ py: 0.75, justifyContent: 'flex-start', textAlign: 'left' }} 
                            onClick={() => activity.status === 'editing' && handleRestoreDocument(activity)}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              width: '100%',
                              pr: 1
                            }}>
                              <Box sx={{ 
                                display: 'flex',
                                mr: 1.5,
                                color: 
                                  activity.status === 'thinking' ? theme.palette.warning.main :
                                  activity.status === 'viewing' ? theme.palette.info.main :
                                  activity.status === 'editing' ? theme.palette.primary.main :
                                  activity.status === 'browsing' ? theme.palette.success.main :
                                  theme.palette.text.secondary
                              }}>
                                {getStatusIcon(activity.status)}
                              </Box>
                              
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                  {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {activity.timestamp}
                                </Typography>
                              </Box>
                              
                              {activity.status === 'editing' && (
                                <Tooltip title="Ripristina questo documento" arrow>
                                  <IconButton 
                                    edge="end" 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreDocument(activity);
                                    }}
                                  >
                                    <HistoryIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Quadrant>
              </Box>
            </Box>
          </Box>
          
          {/* Input area - resa più compatta */}
          <Box sx={{ 
            height: 'auto',
            minHeight: '80px', // Ridotto da 90px a 80px
            maxHeight: '180px',
            flexShrink: 0,
            mt: 1.5,
            width: '100%'
          }}>
            <PromptInputBox sx={{ 
              width: '100%',
              height: '100%',
              p: 0,
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                : '0 4px 20px rgba(124, 77, 255, 0.15)',
              transition: 'all 0.2s ease',
              position: 'relative',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 6px 25px rgba(0, 0, 0, 0.35)' 
                  : '0 6px 25px rgba(124, 77, 255, 0.25)',
              },
              '&:focus-within': {
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 6px 25px rgba(0, 0, 0, 0.4)' 
                  : '0 8px 30px rgba(124, 77, 255, 0.3)',
                borderColor: theme.palette.primary.main,
              }
            }}>
              {/* Area chip degli agenti - resa più compatta */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                px: 1.5, // Ridotto da 2 a 1.5
                py: 0.5, // Ridotto da 0.75 a 0.5
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha('#1a1a3a', 0.7) 
                  : alpha('#f4f0ff', 0.7),
                borderBottom: `1px solid ${theme.palette.mode === 'dark' 
                  ? alpha('#ffffff', 0.1) 
                  : alpha('#7C4DFF', 0.1)}`,
                minHeight: '34px', // Ridotto da 40px a 34px
                maxHeight: '34px', // Ridotto da 40px a 34px
                overflow: 'visible'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 0.5,
                  flex: 1,
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  overflow: 'visible'
                }}>
                  {selectedAgents.length > 0 ? (
                    selectedAgents.map(agent => (
                      <AgentChip
                        key={agent.id}
                        label={agent.name}
                        onDelete={() => setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id))}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.8rem', height: '24px', '& .MuiChip-label': { px: 1 } }}
                      />
                    ))
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontStyle: 'italic', 
                        opacity: 0.8, 
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'visible'
                      }}
                    >
                      Menziona gli agenti usando @
                    </Typography>
                  )}
                </Box>
                
                {isProcessing && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: 8,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.dark, 0.15) 
                        : alpha(theme.palette.primary.light, 0.15),
                      animation: 'pulse 2s infinite ease-in-out'
                    }}
                  >
                    <CircularProgress size={12} sx={{ color: theme.palette.primary.main }} />
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ fontWeight: 500, whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                    >
                      Elaborazione...
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Area input principale - resa più compatta */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 1.5,
                pt: 1.5, // Ridotto da 2 a 1.5
                pb: 1.5, // Ridotto da 2 a 1.5
                position: 'relative',
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha('#1C1C3C', 0.5) 
                  : alpha('#FFFFFF', 0.9),
                flexGrow: 1,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                width: '100%',
                minHeight: '70px', // Ridotto da 80px a 70px
              }}>
                <TextField
                  placeholder={selectedAgents.length === 0 
                    ? "Inizia digitando @ per selezionare un agente..."
                    : "Scrivi il tuo prompt..."}
                  fullWidth
                  multiline
                  maxRows={5} // Ridotto da 6 a 5 per essere più compatto
                  variant="standard"
                  InputProps={{ 
                    disableUnderline: true,
                    sx: { 
                      fontSize: '0.95rem',
                      fontFamily: '"Inter", sans-serif',
                      lineHeight: 1.5,
                      maxHeight: '120px',
                      overflowY: 'auto',
                      '&::placeholder': {
                        opacity: 0.7,
                      }
                    }
                  }}
                  value={prompt}
                  onChange={handlePromptChange}
                  inputRef={(input) => setPromptInputRef(input)}
                  disabled={isProcessing}
                  sx={{ 
                    flex: 1,
                    mr: 1,
                    width: 'calc(100% - 120px)',
                    minHeight: '60px'
                  }}
                />
                {/* Pulsanti azioni - resi più compatti */}
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                  <Tooltip title="Carica documento" arrow>
                    <IconButton 
                      color="primary" 
                      onClick={() => setDocsDrawerOpen(true)}
                      size="small"
                      sx={{ 
                        border: `1px solid ${theme.palette.mode === 'dark' 
                          ? alpha('#ffffff', 0.2) 
                          : alpha(theme.palette.primary.main, 0.5)}`,
                        p: 1
                      }}
                    >
                      <AttachFileIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    disabled={!prompt.trim() || selectedAgents.length === 0 || isProcessing}
                    onClick={handleSendPrompt}
                    sx={{
                      borderRadius: '24px',
                      px: 2,
                      py: 0.8,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      minHeight: '36px',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 12px rgba(124, 77, 255, 0.3)' 
                        : '0 4px 12px rgba(124, 77, 255, 0.25)',
                      '&:hover': {
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 6px 16px rgba(124, 77, 255, 0.35)' 
                          : '0 6px 16px rgba(124, 77, 255, 0.3)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(0)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Invia
                  </Button>
                </Box>
                
                {/* Hover effect animazione */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    '.MuiTextField-root:focus-within + &': {
                      opacity: 1
                    }
                  }}
                />
              </Box>
            </PromptInputBox>
            
            {/* Keyframes per animazione pulse */}
            <Box sx={{
              '@keyframes pulse': {
                '0%': {
                  opacity: 0.8,
                },
                '50%': {
                  opacity: 1,
                },
                '100%': {
                  opacity: 0.8,
                }
              }
            }} />
          </Box>
        </Box>
      )}
      
      {/* Dialog per nuovo progetto */}
      <NewProjectDialog
        open={newProjectDialog}
        onClose={() => setNewProjectDialog(false)}
        onCreate={handleCreateProject}
        collections={collections}
      />
      
      {/* Dialog per modifica progetto */}
      <EditProjectDialog 
        open={editProjectDialog} 
        onClose={() => setEditProjectDialog(false)}
        project={projectToEdit}
        onUpdate={handleUpdateProject}
        collections={collections}
      />
      
      {/* Dialog per conferma eliminazione progetto */}
      <DeleteConfirmDialog 
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
        onConfirm={confirmDeleteProject}
        projectName={projectToDelete?.name || ''}
      />
      
      {/* Dialog per creazione collezione */}
      <NewCollectionDialog
        open={newCollectionDialog}
        onClose={() => setNewCollectionDialog(false)}
        onCreate={handleCreateCollection}
        onUploadDocuments={handleUploadDocumentsToCollection}
      />
      
      {/* Dialog per modifica collezione */}
      <EditCollectionDialog
        open={editCollectionDialog}
        onClose={() => setEditCollectionDialog(false)}
        collection={collectionToEdit}
        onUpdate={handleUpdateCollection}
        documentService={documentService}
      />
      
      {/* Dialog per conferma eliminazione collezione */}
      <DeleteCollectionConfirmDialog 
        open={deleteCollectionDialog}
        onClose={() => setDeleteCollectionDialog(false)}
        onConfirm={() => handleDeleteCollection(collectionToDelete?.id)}
        collectionName={collectionToDelete?.name || ''}
      />
      
      {/* Dialog dell'editor di documenti - utilizza il componente esistente */}
      <DocumentEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        document={documentToEdit}
        onSave={handleSaveDocument}
      />
      
      {/* Dialog per visualizzazione artifact a schermo intero - utilizza il componente esistente*/}
      <ArtifactFullScreenDialog
        open={fullScreenArtifactOpen}
        onClose={() => setFullScreenArtifactOpen(false)}
        artifact={artifact}
        onEdit={artifact && !artifact.isReadOnly ? handleEditArtifact : null}
      />
      
      {/* Dialog per selezione documento da collezione */}
      <DocumentSelectorDialog
        open={documentSelectorOpen}
        onClose={() => setDocumentSelectorOpen(false)}
        onSelect={handleSelectDocument}
        collections={collections}
        documentService={documentService}
      />
      
      {/* Drawer per documenti - migliorato */}
      <DocumentDrawer
        anchor="left"
        open={docsDrawerOpen}
        onClose={() => setDocsDrawerOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Documenti</Typography>
            <IconButton onClick={() => setDocsDrawerOpen(false)}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AttachFileIcon />}
              fullWidth
              component="label"
              size="large"
              sx={{
                py: 1.2,
                fontSize: '1rem',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 12px rgba(124, 77, 255, 0.2)',
              }}
            >
              Carica documenti
              <input
                type="file"
                hidden
                multiple
                onChange={handleUploadDocument}
              />
            </Button>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            fullWidth
            onClick={() => setDocumentSelectorOpen(true)}
            sx={{ mb: 3 }}
          >
            Seleziona da collezione
          </Button>
          
          {/* Documenti in elaborazione */}
          {processingDocuments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={16} sx={{ mr: 1 }} /> 
                Documenti in elaborazione
              </Typography>
              <Box sx={{ mt: 1 }}>
                {processingDocuments.map(doc => (
                  <DocumentProcessingStatus 
                    key={doc.id} 
                    document={doc} 
                  />
                ))}
              </Box>
            </Box>
          )}
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Documenti caricati
          </Typography>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List>
              {documents.length > 0 ? (
                documents.map(doc => (
                  <EnhancedDocumentItem 
                    key={doc.id} 
                    document={doc} 
                    onDelete={() => handleDeleteDocument(doc.id)}
                    onView={() => handleViewDocument(doc)}
                    onEdit={!doc.isReadOnly ? () => {
                      setDocumentToEdit(doc);
                      setEditorOpen(true);
                    } : null}
                  />
                ))
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center'
                }}>
                  <AttachFileIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nessun documento caricato
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        </Box>
      </DocumentDrawer>
      
      {/* Popper per @mentions */}
      <Popper
        open={showMentions}
        anchorEl={mentionAnchorEl}
        placement="top-start"
        sx={{ zIndex: 1500 }}
      >
        <AgentMentionSelector 
          availableAgents={availableAgents} 
          onSelect={handleAgentMention} 
        />
      </Popper>
      
      {/* Snackbar per notifiche */}
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
     </Box>
  );
}

export default Multiagent;