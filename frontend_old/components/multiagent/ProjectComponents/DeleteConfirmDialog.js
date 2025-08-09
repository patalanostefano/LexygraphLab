import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  projectName
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ pb: 1 }}>
      Conferma eliminazione
    </DialogTitle>
    <DialogContent>
      <Typography variant="body1">
        Sei sicuro di voler eliminare il progetto "{projectName}"?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Questa azione non può essere annullata e tutti i dati associati al progetto verranno rimossi.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} variant="outlined">
        Annulla
      </Button>
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

export default DeleteConfirmDialog;