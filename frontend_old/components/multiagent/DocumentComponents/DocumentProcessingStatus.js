import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import FileIcon from '@mui/icons-material/InsertDriveFile';

// Componente per visualizzare lo stato di elaborazione di un documento
export const DocumentProcessingStatus = ({ document, onCancel }) => {
  const theme = useTheme();

  // Determinazione dello stato di elaborazione
  const status = document.status || 'PROCESSING'; // Default: elaborazione in corso
  const progress = document.progress || 0; // Percentuale di progresso

  // Funzione per ottenere l'icona appropriata in base al tipo di file
  const getFileIcon = () => {
    if (!document?.type) return <FileIcon fontSize="small" />;

    if (document.type.includes('pdf'))
      return <PictureAsPdfIcon fontSize="small" color="error" />;
    if (document.type.includes('word') || document.type.includes('document'))
      return <ArticleIcon fontSize="small" color="primary" />;
    if (document.type.includes('image'))
      return <ImageIcon fontSize="small" color="success" />;
    return <FileIcon fontSize="small" />;
  };

  // Funzione per ottenere il colore in base allo stato
  const getStatusColor = () => {
    switch (status) {
      case 'COMPLETED':
        return theme.palette.success.main;
      case 'FAILED':
        return theme.palette.error.main;
      case 'PROCESSING':
      default:
        return theme.palette.primary.main;
    }
  };

  // Funzione per ottenere l'icona in base allo stato
  const getStatusIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'FAILED':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  // Funzione per ottenere il testo dello stato
  const getStatusText = () => {
    switch (status) {
      case 'COMPLETED':
        return 'Completato';
      case 'FAILED':
        return 'Errore';
      case 'PROCESSING':
      default:
        return `Elaborazione (${progress}%)`;
    }
  };

  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: 1,
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.background.paper, 0.6),
        p: 1.5,
        border: '1px solid',
        borderColor: alpha(getStatusColor(), 0.3),
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 1px 3px rgba(0,0,0,0.2)'
            : '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getFileIcon()}
          <Typography
            variant="body2"
            sx={{ ml: 1, fontWeight: 500, maxWidth: '190px' }}
            noWrap
          >
            {document.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getStatusIcon()}

          {onCancel && status === 'PROCESSING' && (
            <Tooltip title="Annulla elaborazione" arrow>
              <IconButton
                size="small"
                onClick={() => onCancel(document.id)}
                sx={{ ml: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {status === 'PROCESSING' && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 5,
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
            },
          }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {typeof document?.size === 'number'
            ? `${(document.size / 1024).toFixed(1)} KB`
            : document?.size || ''}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: getStatusColor(),
            fontWeight: 500,
          }}
        >
          {getStatusText()}
        </Typography>
      </Box>
    </Box>
  );
};
