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
 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';

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

