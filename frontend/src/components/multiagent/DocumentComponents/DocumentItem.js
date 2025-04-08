import React from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';

// Componente documento caricato nella lista
export const DocumentItem = ({ document, onDelete }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{
        mb: 1,
        borderRadius: 1,
        bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
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
    </Box>
  );
};