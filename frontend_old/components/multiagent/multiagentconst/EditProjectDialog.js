// multiagentconst/EditProjectDialog.js

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import BusinessIcon from '@mui/icons-material/Business';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const EditProjectDialog = ({ open, onClose, project, onUpdate }) => {
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [files, setFiles] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    if (open && project) {
      setProjectToEdit({ ...project });
      setFiles([]);
    }
  }, [open, project]);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDeleteDocument = (docId) => {
    setProjectToEdit((p) => ({
      ...p,
      documents: (p.documents || []).filter((d) => d.id !== docId),
    }));
  };

  const handleUpdateProject = () => {
    if (!projectToEdit) return;

    const newFileDocs = files.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      date: new Date().toISOString(),
    }));

    const updated = {
      ...projectToEdit,
      documents: [...(projectToEdit.documents || []), ...newFileDocs],
    };

    onUpdate(updated);
    setFiles([]);
  };

  if (!projectToEdit) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifica Progetto</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              variant="outlined"
              label="Nome del progetto"
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
              fullWidth
              margin="dense"
              variant="outlined"
              label="Nome del cliente"
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
            <Typography variant="subtitle1" gutterBottom>
              Documenti ({(projectToEdit.documents || []).length})
            </Typography>
            {(projectToEdit.documents || []).length > 0 ? (
              <Paper
                variant="outlined"
                sx={{ p: 1.5, maxHeight: 200, overflow: 'auto' }}
              >
                <List dense>
                  {projectToEdit.documents.map((doc) => (
                    <ListItem
                      key={doc.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      }
                    >
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
                        secondary={
                          doc.size
                            ? `${(doc.size / 1024).toFixed(1)} KB • ${new Date(
                                doc.date,
                              ).toLocaleDateString()}`
                            : new Date(doc.date).toLocaleDateString()
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ) : (
              <Box
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography color="text.secondary">
                  Nessun documento caricato
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Aggiungi documenti
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<AttachFileIcon />}
              sx={{ py: 1.5 }}
            >
              {files.length
                ? `${files.length} nuovi documenti`
                : 'Carica documenti'}
              <input type="file" hidden multiple onChange={handleFileChange} />
            </Button>
          </Grid>

          {files.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                File caricati:
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, maxHeight: 150, overflow: 'auto' }}
              >
                <List dense>
                  {files.map((file, i) => (
                    <ListItem
                      key={i}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() =>
                            setFiles((fs) => fs.filter((_, idx) => idx !== i))
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <DescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
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
    </Dialog>
  );
};

export default EditProjectDialog;
