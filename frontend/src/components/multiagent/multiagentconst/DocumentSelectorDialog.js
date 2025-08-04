import React, { useState, useEffect } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';

const DocumentSelectorDialog = ({
  open,
  onClose,
  onSelect,
  collections = [],
  documentService,
  multiSelect = false
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // Carica i documenti dalla collezione selezionata
  const loadDocuments = async (collectionId) => {
    if (!collectionId) return;
    setLoading(true);
    try {
      // In produzione useresti questo:
      // const response = await documentService.getCollectionDocuments(collectionId);
      // setDocuments(response.documents || []);
      
      // Per ora simuliamo una risposta da API
      setTimeout(() => {
        const mockDocuments = [
          {
            id: `doc-${Date.now()}-1`,
            name: 'Documento di prova 1.docx',
            size: 245 * 1024,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            updatedAt: new Date().toISOString()
          },
          {
            id: `doc-${Date.now()}-2`,
            name: 'Report annuale.pdf',
            size: 412 * 1024,
            mimeType: 'application/pdf',
            updatedAt: new Date().toISOString()
          },
          {
            id: `doc-${Date.now()}-3`,
            name: 'Foto ufficio.jpg',
            size: 1254 * 1024,
            mimeType: 'image/jpeg',
            updatedAt: new Date().toISOString()
          }
        ];
        setDocuments(mockDocuments);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Errore durante il caricamento dei documenti:', error);
      setNotification({
        open: true,
        message: 'Errore durante il caricamento dei documenti. Riprova più tardi.',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Effetti
  useEffect(() => {
    if (open && collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0]);
    }
  }, [open, collections, selectedCollection]);

  useEffect(() => {
    if (selectedCollection) {
      loadDocuments(selectedCollection.id);
    }
  }, [selectedCollection]);

  useEffect(() => {
    if (open) {
      setSelectedDocuments([]);
      setSearch('');
    }
  }, [open, selectedCollection]);

  // Filtra i documenti
  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  // Selezione documento
  const handleSelectDocument = (doc) => {
    if (!multiSelect) {
      onSelect?.(doc);
      onClose();
    } else {
      setSelectedDocuments((prev) => {
        const exists = prev.some((d) => d.id === doc.id);
        return exists ? prev.filter((d) => d.id !== doc.id) : [...prev, doc];
      });
    }
  };

  const handleConfirmSelection = () => {
    if (selectedDocuments.length) {
      onSelect?.(selectedDocuments);
      onClose();
    }
  };

  const isDocumentSelected = (id) => selectedDocuments.some((d) => d.id === id);

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      aria-labelledby="document-selector-title" 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: { sm: 'auto', md: '80vh' } }
      }}
    >
      <DialogTitle id="document-selector-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Seleziona documento{multiSelect ? 'i' : ''}</Typography>
          <IconButton edge="end" onClick={onClose} aria-label="close">
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
              const sel = collections.find((c) => c.id === e.target.value);
              setSelectedCollection(sel || null);
            }}
            fullWidth
          >
            <MenuItem value="">Seleziona una collezione</MenuItem>
            {collections.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FolderIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                  {c.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Cerca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
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
            <Typography color="text.secondary">Seleziona una collezione per visualizzare i documenti</Typography>
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 6 }}>
            <InsertDriveFileIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              {search
                ? `Nessun documento trovato per \"${search}\"`
                : 'Nessun documento in questa collezione'}
            </Typography>
          </Box>
        ) : (
          <>
            {multiSelect && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDocuments.length === filteredDocuments.length && !!filteredDocuments.length}
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
            <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {filteredDocuments.map((doc) => (
                <ListItem
                  key={doc.id}
                  button
                  onClick={() => handleSelectDocument(doc)}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    bgcolor:
                      multiSelect && isDocumentSelected(doc.id)
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'inherit',
                    '&:hover': {
                      bgcolor: multiSelect && isDocumentSelected(doc.id)
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.action.hover, 0.1)
                    }
                  }}
                >
                  {multiSelect && (
                    <Checkbox
                      edge="start"
                      checked={isDocumentSelected(doc.id)}
                      tabIndex={-1}
                      disableRipple
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectDocument(doc)}
                    />
                  )}
                  <ListItemIcon>
                    {doc.mimeType?.includes('pdf') ? (
                      <PictureAsPdfIcon color="error" />
                    ) : doc.mimeType?.includes('word') ? (
                      <ArticleIcon color="primary" />
                    ) : doc.mimeType?.includes('image') ? (
                      <ImageIcon color="success" />
                    ) : (
                      <InsertDriveFileIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.name}
                    secondary={`${(doc.size / 1024).toFixed(1)} KB • ${new Date(
                      doc.updatedAt || doc.date
                    ).toLocaleDateString()}`}
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
            disabled={!selectedDocuments.length}
          >
            Conferma selezione ({selectedDocuments.length})
          </Button>
        )}
      </DialogActions>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default DocumentSelectorDialog;