// Aggiornamento completo di ArtifactViewer.js per mostrare SOLO documenti generati

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SmartToyIcon from '@mui/icons-material/SmartToy';

/**
 * ArtifactViewer aggiornato per mostrare SOLO documenti generati dagli agenti
 * I documenti caricati dall'utente vengono gestiti dal DocumentPreviewDialog
 */
export default function ArtifactViewer({ artifact, onFullScreenView }) {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verifica se l'artifact è un documento generato (non caricato)
  const isGeneratedDocument = (artifact) => {
    if (!artifact) return false;
    
    // Controlla vari indicatori che il documento è stato generato
    return (
      artifact.isGenerated === true ||           // Flag esplicito
      artifact.generatedBy ||                    // Generato da un agente specifico
      artifact.version ||                        // Ha versioni (tipico dei documenti generati)
      artifact.source === 'agent' ||            // Sorgente è un agente
      artifact.type === 'generated' ||          // Tipo esplicito
      (artifact.content && !artifact.uploadedAt) // Ha contenuto ma non è stato caricato
    );
  };

  // Carica il contenuto del documento quando cambia l'artifact
  useEffect(() => {
    const loadDocumentContent = async () => {
      if (!artifact || !artifact.id) {
        setContent('');
        return;
      }
      
      // NUOVO: Verifica se è un documento generato
      if (!isGeneratedDocument(artifact)) {
        console.log('Artifact non è un documento generato, non verrà mostrato nell\'ArtifactViewer');
        setContent('');
        return;
      }
      
      // Se l'artifact ha già il contenuto, usalo direttamente
      if (artifact.content) {
        setContent(artifact.content);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Per documenti generati, il contenuto dovrebbe essere già disponibile
        // Ma se non c'è, prova a caricarlo (fallback)
        if (artifact.rawContent) {
          // Se esiste rawContent, estrai il body
          const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(artifact.rawContent);
          if (bodyMatch && bodyMatch[1]) {
            setContent(bodyMatch[1]);
          } else {
            setContent(artifact.rawContent);
          }
        } else {
          setContent('Contenuto del documento generato non disponibile');
        }
      } catch (error) {
        console.error(`Errore durante il caricamento del documento generato ${artifact.id}:`, error);
        setError('Impossibile caricare il contenuto del documento generato');
      } finally {
        setLoading(false);
      }
    };

    loadDocumentContent();
  }, [artifact]);

  // Se non c'è artifact o non è un documento generato
  if (!artifact || !isGeneratedDocument(artifact)) {
    return (
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.default',
          height: '100%',
          opacity: 0.7,
          mt: 0,
          mx: 0,
          borderRadius: 1
        }}
      >
        <AutoFixHighIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '1.05rem', mb: 1 }}>
          Nessun documento generato
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          I documenti generati dagli agenti appariranno qui
        </Typography>
      </Box>
    );
  }

  // Scelta dell'icona in base al tipo di file per documenti generati
  const getFileIcon = () => {
    if (!artifact?.type) return <ArticleIcon fontSize="small" color="primary" />;
    if (artifact.type.includes('pdf')) return <PictureAsPdfIcon fontSize="small" color="error" />;
    if (artifact.type.includes('word') || artifact.type.includes('document'))
      return <ArticleIcon fontSize="small" color="primary" />;
    if (artifact.type.includes('image')) return <ImageIcon fontSize="small" color="success" />;
    return <ArticleIcon fontSize="small" color="primary" />;
  };

  // Badge per indicare che è un documento generato
  const getGenerationBadge = () => {
    if (artifact.generatedBy) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <SmartToyIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Generato da {artifact.generatedBy}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <AutoFixHighIcon fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }} />
        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600 }}>
          Documento generato
        </Typography>
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        py: 1.2, 
        px: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {getFileIcon()}
          <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600, fontSize: '1.05rem' }}>
            {artifact.name}
          </Typography>
          {getGenerationBadge()}
        </Box>
        
        <Tooltip title="Visualizza a schermo intero">
          <IconButton 
            onClick={onFullScreenView} 
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': { 
                bgcolor: 'background.default',
                transform: 'scale(1.1)'
              },
              width: 40,
              height: 40,
              transition: 'all 0.2s ease'
            }}
          >
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Meta informazioni */}
      <Box sx={{ 
        px: 2, 
        py: 0.75, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        bgcolor: 'background.default'
      }}>
        <Typography variant="caption" color="text.secondary">
          {artifact.version ? `Versione: ${artifact.version}` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Generato: {new Date(artifact.date || Date.now()).toLocaleString()}
        </Typography>
      </Box>

      {/* Contenuto */}
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        overflowY: 'auto', 
        backgroundColor: 'background.default'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              minHeight: '100px',
              bgcolor: 'background.paper',
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            {content ? (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: artifact.type?.includes('document') ? "'Calibri', sans-serif" : 'inherit',
                  fontSize: '1.05rem',
                  lineHeight: 1.5
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <AutoFixHighIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Documento generato vuoto
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Il contenuto del documento generato non è disponibile
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}