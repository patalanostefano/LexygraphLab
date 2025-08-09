import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';

export const extractHtmlContent = (content) => {
  if (!content) return '';
  
  if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>') || 
      content.includes('<ul>') || content.includes('<ol>') || content.includes('<table>')) {
    
    return content
      .replace(/<div[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<div>')
      .replace(/<div[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<div>')
      .replace(/<br[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<br>')
      .replace(/<br[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<br>')
      .replace(/style="[^"]*page-break[^"]*"/gi, '') // Rimuovi solo stili di interruzione pagina
      .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi, '<div>');
  }
  
  return content.split('\n\n')
    .map(paragraph => {
      // Preserva le interruzioni di riga all'interno dei paragrafi
      const formattedParagraph = paragraph.replace(/\n/g, '<br>');
      return `<p>${formattedParagraph}</p>`;
    })
    .join('');
};

// Componente per la visualizzazione a schermo intero del documento
export const ArtifactFullScreenDialog = ({ open, onClose, artifact, onEdit }) => {
  const theme = useTheme();
  const [fontSize, setFontSize] = useState(12);
  const [content, setContent] = useState('');
  const [pages, setPages] = useState([]);
  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // NUOVO: Stato per gestire lo zoom temporaneo
  const [tempZoomActive, setTempZoomActive] = useState(false);
  const [originalFontSize, setOriginalFontSize] = useState(12);
  
  // Inizializza il contenuto quando l'artifact cambia
  useEffect(() => {
    if (!artifact || !artifact.content) {
      setContent('');
      return;
    }
    
    // Se l'artifact ha un rawContent (completo con HTML), usiamo solo la parte del corpo
    // Altrimenti, usiamo il contenuto normale
    if (artifact.rawContent) {
      try {
        const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(artifact.rawContent);
        if (bodyMatch && bodyMatch[1]) {
          setContent(bodyMatch[1]);
        } else {
          setContent(artifact.content); // Fallback al contenuto normale
        }
      } catch (error) {
        console.error("Errore nell'estrazione del contenuto HTML:", error);
        setContent(artifact.content); // Fallback al contenuto normale
      }
    } else {
      // Estrai il contenuto HTML con la funzione migliorata
      let extractedContent = extractHtmlContent(artifact.content);
      
      // Se il contenuto è un documento HTML completo, estrai solo il body
      if (extractedContent.includes('<!DOCTYPE html>') || extractedContent.includes('<html')) {
        try {
          const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(extractedContent);
          if (bodyMatch && bodyMatch[1]) {
            extractedContent = bodyMatch[1];
          }
        } catch (error) {
          console.error("Errore nell'estrazione del contenuto HTML:", error);
        }
      }
      
      setContent(extractedContent);
    }
  }, [artifact]);
  
  // Dividi il contenuto in blocchi logici
  useEffect(() => {
    if (!content || !open) return;
    
    // Crea un elemento temporaneo per analizzare il contenuto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Estrai tutti i paragrafi, titoli e altri blocchi
    const blocks = [];
    const blockElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, table, blockquote, pre, div');
    
    blockElements.forEach(element => {
      blocks.push(element.outerHTML);
    });
    
    // Se non ci sono blocchi, usa il contenuto originale
    if (blocks.length === 0) {
      blocks.push(content);
    }
    
    setPages([blocks.join('')]);
  }, [content, open]);
  
  // NUOVO: Gestione dello zoom temporaneo
  const toggleTempZoom = () => {
    if (!tempZoomActive) {
      // Attiva lo zoom temporaneo
      setOriginalFontSize(fontSize);
      setFontSize(fontSize * 1.5); // Aumenta la dimensione del 50%
      setTempZoomActive(true);
    } else {
      // Disattiva lo zoom temporaneo
      setFontSize(originalFontSize);
      setTempZoomActive(false);
    }
  };
  
  // Funzione per stampa
  const handlePrint = () => {
    if (!artifact) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stampa: ${artifact.name || 'Documento'}</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { 
            font-family: 'Calibri', sans-serif;
            font-size: ${fontSize}pt;
            line-height: 1.5;
            margin: 0;
            padding: 2cm;
          }
          p { 
            margin-bottom: 10pt; 
            word-wrap: break-word;
            max-width: 100%;
          }
          h1 { font-size: ${fontSize + 6}pt; }
          h2 { font-size: ${fontSize + 4}pt; }
          h3 { font-size: ${fontSize + 2}pt; }
          img, table { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };
  
  // Funzione per export in Word
  const handleExport = () => {
    if (!artifact) return;
    
    try {
      const downloadLink = document.createElement('a');
      
      // Utilizzo rawContent se disponibile, altrimenti crea un nuovo HTML Word-compatibile
      const wordHtml = artifact.rawContent || `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <title>${artifact.name || 'Documento'}</title>
  <style>
    /* Stili generali */
    body {
      font-family: 'Calibri', sans-serif;
      font-size: ${fontSize}pt;
      line-height: 1.5;
      margin: 2cm;
      padding: 0; /* Rimuovi padding */
    }
    /* Stili specifici per Word */
    @page { size: 21cm 29.7cm; margin: 2cm; mso-page-orientation: portrait; }
    div.WordSection1 { page: WordSection1; mso-first-header: id1; }
    p { margin-bottom: 10pt; }
    h1 { font-size: ${fontSize + 6}pt; font-weight: bold; }
    h2 { font-size: ${fontSize + 4}pt; font-weight: bold; }
    h3 { font-size: ${fontSize + 2}pt; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <!-- Imposta esplicitamente per evitare interruzioni di pagina iniziali -->
  <div class="WordSection1" style="page-break-before: avoid;">
    <!-- Paragrafo vuoto per assicurarsi che il contenuto inizi alla prima pagina -->
    <p style="margin:0; padding:0; font-size:1pt; line-height:1pt;">&nbsp;</p>
    ${content}
  </div>
</body>
</html>`;

      // Crea un Blob con il contenuto HTML
      const blob = new Blob([wordHtml], { type: 'application/msword' });
      
      // Prepara il nome del file
      const fileName = artifact.name || 'Documento';
      const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
      const fileNameWithExtension = `${fileNameWithoutExtension}.doc`;
      
      // Crea un link per scaricare il file
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileNameWithExtension;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.error("Errore durante l'esportazione:", error);
      alert("Si è verificato un errore durante l'esportazione del documento.");
    }
  };

  // Scelta dell'icona in base al tipo di file
  const getFileIcon = () => {
    if (!artifact?.type) return <FileIcon fontSize="medium" />;
    if (artifact.type.includes('pdf')) return <PictureAsPdfIcon fontSize="medium" color="error" />;
    if (artifact.type.includes('word') || artifact.type.includes('document'))
      return <ArticleIcon fontSize="medium" color="primary" />;
    if (artifact.type.includes('image')) return <ImageIcon fontSize="medium" color="success" />;
    return <FileIcon fontSize="medium" />;
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f0f0f0' }
      }}
    >
      {/* MODIFICATO: AppBar con bordi rettangolari */}
      <AppBar 
        position="static" 
        color="primary" 
        elevation={2}
        sx={{ 
          borderRadius: 0, // Rimuove angoli arrotondati
          '& .MuiToolbar-root': { borderRadius: 0 } 
        }}
      >
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={onClose}
            sx={{ mr: 1 }}
            aria-label="Chiudi"
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {getFileIcon()}
            <Typography variant="h6" noWrap sx={{ ml: 1.5, fontWeight: 600 }}>
              {artifact?.name || 'Documento'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* MODIFICATO: Pulsante zoom temporaneo */}
            <Tooltip title={tempZoomActive ? "Ripristina dimensione" : "Ingrandisci temporaneamente"}>
              <IconButton 
                onClick={toggleTempZoom} 
                color="inherit"
                sx={{ 
                  bgcolor: tempZoomActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { bgcolor: tempZoomActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Stampa documento">
              <IconButton onClick={handlePrint} color="inherit">
                <PrintIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<OpenInNewIcon />}
              onClick={handleExport}
              sx={{ mx: 1 }}
            >
              Esporta in Word
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<EditIcon />}
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              Modifica
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box 
        ref={scrollContainerRef}
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
        {/* Contenuto principale */}
        {content && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              gap: 4,
            }}
          >
            <Paper
              elevation={4}
              className="document-page"
              sx={{
                width: '21cm',
                minHeight: '29.7cm',
                bgcolor: 'white',
                color: 'black',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                position: 'relative',
                breakInside: 'avoid',
                pageBreakAfter: 'always',
                overflow: 'hidden',
                borderRadius: '4px'
              }}
            >
              <Box 
                ref={contentRef}
                sx={{ 
                  p: 4, 
                  minHeight: '29.7cm',
                  fontFamily: '"Calibri", sans-serif',
                  fontSize: `${fontSize}pt`,
                  lineHeight: 1.5,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  '& p': { 
                    marginBottom: '10pt',
                    maxWidth: '100%',
                  },
                  '& h1': { 
                    fontSize: `${fontSize + 6}pt`, 
                    fontWeight: 'bold',
                    maxWidth: '100%',
                    color: theme.palette.primary.main
                  },
                  '& h2': { 
                    fontSize: `${fontSize + 4}pt`, 
                    fontWeight: 'bold',
                    maxWidth: '100%',
                    color: theme.palette.primary.dark
                  },
                  '& h3': { 
                    fontSize: `${fontSize + 2}pt`, 
                    fontWeight: 'bold',
                    maxWidth: '100%',
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto'
                  },
                  '& table': {
                    width: '100%',
                    tableLayout: 'fixed',
                    borderCollapse: 'collapse',
                    maxWidth: '100%',
                    marginBottom: '10pt',
                    border: '1px solid #ddd'
                  },
                  '& td, & th': {
                    padding: '8px',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    border: '1px solid #ddd'
                  },
                  '& th': {
                    backgroundColor: '#f2f2f2',
                    fontWeight: 'bold'
                  },
                  '& ul, & ol': {
                    paddingLeft: '20pt',
                    maxWidth: '100%',
                    marginBottom: '10pt'
                  },
                  '& li': {
                    marginBottom: '5pt',
                    maxWidth: '100%',
                  },
                  '& a': {
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    color: theme.palette.primary.main,
                    textDecoration: 'underline'
                  },
                  '& pre, & code': {
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    display: 'block',
                    padding: '10px',
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: `${fontSize - 1}pt`,
                    marginBottom: '10pt'
                  },
                  '& blockquote': {
                    borderLeft: `4px solid ${theme.palette.mode === 'dark' ? '#666' : '#ddd'}`,
                    paddingLeft: '15px',
                    margin: '10px 0 15px 0',
                    color: theme.palette.mode === 'dark' ? '#ccc' : '#666',
                    maxWidth: 'calc(100% - 19px)',
                    fontStyle: 'italic'
                  },
                  // Aggiunge una transizione fluida per il cambio di dimensione del testo
                  transition: 'font-size 0.3s ease-in-out',
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </Paper>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default ArtifactFullScreenDialog;