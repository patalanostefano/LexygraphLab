import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import { documentsApi } from '../../../api/api';

/**
 * Componente per l'anteprima a schermo intero dei documenti CARICATI
 * (non per i documenti generati dagli agenti)
 */
export const DocumentPreviewDialog = ({ open, onClose, document }) => {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica il contenuto del documento quando si apre il dialog
  useEffect(() => {
    const loadDocumentContent = async () => {
      if (!open || !document || !document.id) {
        setContent('');
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Prima prova a ottenere il contenuto del documento
        let docContent = null;
        try {
          docContent = await documentsApi.getDocumentContent(document.id);
        } catch (contentError) {
          console.log(
            'Content not available, trying extracted text:',
            contentError,
          );
        }

        if (docContent && (docContent.content || docContent.text)) {
          setContent(formatContent(docContent.content || docContent.text));
        } else {
          // Se non c'è contenuto, prova con il testo estratto
          try {
            const extractedText = await documentsApi.getExtractedText(
              document.id,
            );
            if (extractedText && extractedText.text) {
              setContent(formatPlainText(extractedText.text));
            } else {
              setError(
                "Contenuto del documento non disponibile per l'anteprima",
              );
            }
          } catch (extractError) {
            console.error("Errore nell'estrazione del testo:", extractError);
            setError(
              "Impossibile caricare il contenuto del documento. Il documento potrebbe non essere ancora elaborato o il formato non è supportato per l'anteprima.",
            );
          }
        }
      } catch (error) {
        console.error(
          `Errore durante il caricamento del documento ${document.id}:`,
          error,
        );
        setError('Errore durante il caricamento del documento');
      } finally {
        setLoading(false);
      }
    };

    loadDocumentContent();
  }, [open, document]);

  // Formatta il contenuto HTML
  const formatContent = (content) => {
    if (!content) return '';

    // Se il contenuto è già HTML formattato, restituiscilo così com'è
    if (
      content.includes('<p>') ||
      content.includes('<div>') ||
      content.includes('<h1>')
    ) {
      return content;
    }

    // Altrimenti, formatta il testo semplice come HTML
    return formatPlainText(content);
  };

  // Formatta il testo semplice come HTML
  const formatPlainText = (text) => {
    if (!text) return '';

    return text
      .split('\n\n')
      .map((paragraph) => {
        const formattedParagraph = paragraph.replace(/\n/g, '<br>');
        return `<p>${formattedParagraph}</p>`;
      })
      .join('');
  };

  // Funzione per scaricare il documento originale
  const handleDownload = async () => {
    if (!document) return;

    try {
      const downloadUrlData = await documentsApi.getDocumentDownloadUrl(
        document.id,
      );
      if (downloadUrlData && downloadUrlData.downloadUrl) {
        // Apri l'URL in una nuova finestra per scaricare
        window.open(downloadUrlData.downloadUrl, '_blank');
      } else {
        console.error('URL di download non disponibile');
        alert('Download non disponibile per questo documento');
      }
    } catch (error) {
      console.error('Errore durante il download:', error);
      alert('Errore durante il download del documento');
    }
  };

  // Funzione per stampare l'anteprima
  const handlePrint = () => {
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stampa: ${document?.name || 'Documento'}</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { 
            font-family: 'Calibri', sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 0;
            padding: 2cm;
            color: black;
          }
          p { 
            margin-bottom: 10pt; 
            word-wrap: break-word;
            max-width: 100%;
          }
          h1, h2, h3, h4, h5, h6 { 
            color: #333; 
            margin-top: 15pt;
            margin-bottom: 10pt;
          }
          img, table { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <h1>${document?.name || 'Documento'}</h1>
        <hr style="margin-bottom: 20pt;">
        ${content}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // Scelta dell'icona in base al tipo di file
  const getFileIcon = () => {
    if (!document?.type && !document?.mimeType)
      return <FileIcon fontSize="medium" />;

    const fileType = document.type || document.mimeType || '';

    if (fileType.includes('pdf'))
      return <PictureAsPdfIcon fontSize="medium" color="error" />;
    if (fileType.includes('word') || fileType.includes('document'))
      return <ArticleIcon fontSize="medium" color="primary" />;
    if (fileType.includes('image'))
      return <ImageIcon fontSize="medium" color="success" />;
    return <FileIcon fontSize="medium" />;
  };

  // Ottieni informazioni del documento
  const getDocumentInfo = () => {
    if (!document) return {};

    return {
      name: document.name || 'Documento senza nome',
      size: document.size
        ? `${(document.size / 1024).toFixed(1)} KB`
        : 'Dimensione sconosciuta',
      date:
        document.date || document.createdAt || document.updatedAt
          ? new Date(
              document.date || document.createdAt || document.updatedAt,
            ).toLocaleString()
          : 'Data sconosciuta',
      type: document.type || document.mimeType || 'Tipo sconosciuto',
    };
  };

  const docInfo = getDocumentInfo();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f0f0f0' },
      }}
    >
      <AppBar
        position="static"
        color="primary"
        elevation={2}
        sx={{ borderRadius: 0 }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            sx={{ mr: 1 }}
            aria-label="Chiudi anteprima"
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {getFileIcon()}
            <Box sx={{ ml: 1.5 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {docInfo.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {docInfo.size} • {docInfo.date}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Stampa anteprima">
              <IconButton
                onClick={handlePrint}
                color="inherit"
                disabled={!content || loading}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              sx={{ mx: 1 }}
            >
              Scarica originale
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 4,
          px: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Caricamento documento...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elaborazione del contenuto in corso
            </Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            <Alert severity="warning" sx={{ mb: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Anteprima non disponibile
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>

            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              size="large"
            >
              Scarica documento originale
            </Button>
          </Box>
        ) : content ? (
          <Paper
            elevation={4}
            sx={{
              width: '21cm',
              minHeight: '29.7cm',
              bgcolor: 'white',
              color: 'black',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 4,
                minHeight: '29.7cm',
                fontFamily: '"Calibri", sans-serif',
                fontSize: '12pt',
                lineHeight: 1.5,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                '& p': {
                  marginBottom: '10pt',
                  maxWidth: '100%',
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  fontWeight: 'bold',
                  maxWidth: '100%',
                  color: '#333',
                  marginTop: '15pt',
                  marginBottom: '10pt',
                },
                '& h1': { fontSize: '18pt', color: theme.palette.primary.main },
                '& h2': { fontSize: '16pt', color: theme.palette.primary.dark },
                '& h3': { fontSize: '14pt' },
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                },
                '& table': {
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  maxWidth: '100%',
                  marginBottom: '10pt',
                  border: '1px solid #ddd',
                },
                '& td, & th': {
                  padding: '8px',
                  wordWrap: 'break-word',
                  maxWidth: '100%',
                  border: '1px solid #ddd',
                },
                '& th': {
                  backgroundColor: '#f2f2f2',
                  fontWeight: 'bold',
                },
                '& ul, & ol': {
                  paddingLeft: '20pt',
                  maxWidth: '100%',
                  marginBottom: '10pt',
                },
                '& li': {
                  marginBottom: '5pt',
                  maxWidth: '100%',
                },
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nessun contenuto disponibile
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
            >
              Scarica documento
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
