import React, { useState } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { documentsApi } from '../api/api'; // Importa l'API

// Componente documento caricato nella lista
export const DocumentItem = ({ document, onDelete }) => {
  const theme = useTheme();
  const [documentContent, setDocumentContent] = useState(null); // Stato per contenere il contenuto del documento

  const handleDocumentClick = async () => {
    try {
      // Recupera il documento raw dal backend
      const rawDocument = await documentsApi.getDocument(document.id);
      setDocumentContent(rawDocument); // Salva il contenuto del documento nello stato
    } catch (error) {
      console.error('Errore nel recupero del documento:', error);
    }
  };

  return (
    <Box 
      sx={{
        mb: 1,
        borderRadius: 1,
        bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer' // Indica che è cliccabile
      }}
      onClick={handleDocumentClick} // Gestisci il clic sul documento
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FileIcon sx={{ mr: 1 }} />
        <Box>
          <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {document.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {document.date}
          </Typography>
        </Box>
      </Box>
      <IconButton size="small" onClick={() => onDelete(document.id)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
      
      {/* Se il documento è stato cliccato, mostra il contenuto */}
      {documentContent && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {documentContent.text || "Contenuto del documento non disponibile"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
