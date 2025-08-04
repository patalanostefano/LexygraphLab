import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings'; // AGGIUNTO: Icona per Impostazioni
import DocumentSelectorDialog from '../multiagentconst/DocumentSelectorDialog';

const NewProjectDialog = ({ 
  open, 
  onClose, 
  onCreate
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [files, setFiles] = useState([]);
  const theme = useTheme();

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const fileDocs = files.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      date: new Date().toISOString()
    }));

    const newProject = {
      id: Date.now().toString(),
      name: newProjectName,
      client: clientName,
      date: new Date().toLocaleDateString(),
      documents: fileDocs
    };

    onCreate(newProject);
    setNewProjectName('');
    setClientName('');
    setFiles([]);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
              Crea Nuovo Progetto
            </Typography>
            
            <IconButton onClick={onClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Nome del progetto"
                fullWidth
                margin="dense"
                variant="outlined"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FolderIcon color="primary" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nome del cliente"
                fullWidth
                margin="dense"
                variant="outlined"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="primary" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Documenti
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFileIcon />}
                sx={{ py: 1.5 }}
              >
                {files.length
                  ? `${files.length} documenti selezionati`
                  : 'Carica documenti'}
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
                <Typography variant="subtitle2" gutterBottom>
                  File caricati:
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: 150, overflow: 'auto' }}>
                  <List dense>
                    {files.map((file, i) => (
                      <ListItem
                        key={i}
                        sx={{ py: 0.5 }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
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
          <Button onClick={onClose} variant="outlined">
            Annulla
          </Button>
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
    </>
  );
};

export default NewProjectDialog;