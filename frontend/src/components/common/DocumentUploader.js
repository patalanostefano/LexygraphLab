import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function DocumentUploader() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleFileDelete = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) {
      setAlert({
        show: true,
        message: 'Nessun file selezionato da caricare',
        severity: 'warning'
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulazione del caricamento
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setUploading(false);
          setFiles([]);
          setAlert({
            show: true,
            message: 'File caricati con successo!',
            severity: 'success'
          });
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Carica Documenti</Typography>
      
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Clicca per selezionare i documenti
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Supporta PDF, DOCX, TXT e altri formati di testo
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            File selezionati ({files.length})
          </Typography>
          <Paper variant="outlined" sx={{ mt: 1, mb: 2 }}>
            <List dense>
              {files.map((file, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InsertDriveFileIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={file.name} 
                    secondary={`${(file.size / 1024).toFixed(1)} KB`} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleFileDelete(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>

          {uploading ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                Caricamento in corso... {progress}%
              </Typography>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<FileUploadIcon />}
              onClick={handleUpload}
              sx={{ mt: 1 }}
            >
              Carica documenti
            </Button>
          )}
        </Box>
      )}

      <Snackbar 
        open={alert.show} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} variant="filled">
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DocumentUploader;
