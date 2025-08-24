// EditProjectDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';

const EditProjectDialog = ({ open, onClose, project, onUpdate }) => {
  const [projectToEdit, setProjectToEdit] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    if (open && project) {
      setProjectToEdit({ ...project });
    }
  }, [open, project]);

  const handleUpdateProject = () => {
    if (projectToEdit) {
      onUpdate({ ...projectToEdit });
    }
  };

  if (!projectToEdit) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
              onChange={(e) =>
                setProjectToEdit({ ...projectToEdit, name: e.target.value })
              }
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
              onChange={(e) =>
                setProjectToEdit({ ...projectToEdit, client: e.target.value })
              }
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
              onChange={(e) =>
                setProjectToEdit({ ...projectToEdit, notes: e.target.value })
              }
              margin="dense"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Annulla
        </Button>
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

export default EditProjectDialog;
