import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Chip,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import AttachFileIcon from '@mui/icons-material/AttachFile';

// Componente popup per la creazione di un nuovo progetto
export const NewProjectDialog = ({ open, onClose, onCreate }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const theme = useTheme();
  
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName,
        client: clientName,
        notes,
        date: new Date().toLocaleDateString(),
        agents: []
      };
      
      onCreate(newProject);
      
      // Reset dei campi
      setNewProjectName('');
      setClientName('');
      setNotes('');
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
          
          <Grid item xs={12}>
            <TextField
              label="Note aggiuntive"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="dense"
            />
          </Grid>
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
    </Dialog>
  );
};

// Componente per creare una nuova collezione - semplificato
export const NewCollectionDialog = ({ open, onClose, onCreate, onUploadDocuments }) => {
  const [collectionName, setCollectionName] = useState('');
  const [tag, setTag] = useState('');
  const [files, setFiles] = useState([]);
  const theme = useTheme();

  // Reset dei campi quando il dialogo viene aperto
  useEffect(() => {
    if (open) {
      setCollectionName('');
      setTag('');
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
        tag: tag,
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
      setTag('');
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
                    <CreateNewFolderIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              margin="dense"
              label="Tag (opzionale)"
              fullWidth
              variant="outlined"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalOfferIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              placeholder="es. contratti, documenti cliente, sentenze..."
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
                    <ListItem key={index} sx={{ py: 0.5 }}>
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

// Componente per il dialogo di modifica progetto
export const EditProjectDialog = ({ open, onClose, project, onUpdate }) => {
  const [projectToEdit, setProjectToEdit] = useState(null);
  const theme = useTheme();

  // Inizializza i dati del progetto quando il dialogo viene aperto
  useEffect(() => {
    if (open && project) {
      setProjectToEdit({...project});
    }
  }, [open, project]);

  const handleUpdateProject = () => {
    if (projectToEdit) {
      const updatedProject = {...projectToEdit};
      onUpdate(updatedProject);
    }
  };

  if (!projectToEdit) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
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
          
          <Grid item xs={12}>
            <TextField
              label="Note aggiuntive"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={projectToEdit.notes || ''}
              onChange={(e) => setProjectToEdit({...projectToEdit, notes: e.target.value})}
              margin="dense"
            />
          </Grid>
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
    </Dialog>
  );
};

// Componente per il dialogo di modifica collezione
export const EditCollectionDialog = ({ open, onClose, collection, onUpdate }) => {
  const [collectionToEdit, setCollectionToEdit] = useState(null);
  const theme = useTheme();

  // Inizializza i dati della collezione quando il dialogo viene aperto
  useEffect(() => {
    if (open && collection) {
      setCollectionToEdit({...collection});
    }
  }, [open, collection]);

  const handleUpdateCollection = () => {
    if (collectionToEdit) {
      const updatedCollection = {...collectionToEdit};
      onUpdate(updatedCollection);
    }
  };

  if (!collectionToEdit) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
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
                    <CreateNewFolderIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              margin="dense"
              label="Tag (opzionale)"
              fullWidth
              variant="outlined"
              value={collectionToEdit.tag || ''}
              onChange={(e) => setCollectionToEdit({...collectionToEdit, tag: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalOfferIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
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

// Componente dialogo di conferma eliminazione progetto
export const DeleteConfirmDialog = ({ open, onClose, onConfirm, projectName }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Conferma eliminazione</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Sei sicuro di voler eliminare il progetto "{projectName}"?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Questa azione non può essere annullata e tutti i dati associati al progetto verranno rimossi.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Annulla</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          startIcon={<DeleteIcon />}
        >
          Elimina progetto
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente dialogo di conferma eliminazione collezione
export const DeleteCollectionConfirmDialog = ({ open, onClose, onConfirm, collectionName }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Conferma eliminazione collezione</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Sei sicuro di voler eliminare la collezione "{collectionName}"?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Questa azione non può essere annullata. I documenti contenuti in questa collezione non verranno eliminati, ma non saranno più associati a questa collezione.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Annulla</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          startIcon={<DeleteIcon />}
        >
          Elimina collezione
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Esportazione componenti
export {
  // Altri componenti se necessario
};