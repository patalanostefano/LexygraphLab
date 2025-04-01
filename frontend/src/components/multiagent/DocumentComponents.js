import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Grid,
  useMediaQuery,
  alpha,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  CircularProgress,
  TextField,
  Popper,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Drawer
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BusinessIcon from '@mui/icons-material/Business';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BalanceIcon from '@mui/icons-material/Balance';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ImageIcon from '@mui/icons-material/Image';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EventIcon from '@mui/icons-material/Event';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PrintIcon from '@mui/icons-material/Print';
import styled from '@mui/material/styles/styled';

// Funzione per estrarre e sanitizzare il contenuto HTML
const extractHtmlContent = (content) => {
  if (!content) return '<p><br></p>';
  
  let extractedContent = content;
  
  // Se il contenuto include un documento HTML completo, estrai il corpo
  if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
    try {
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(content);
      extractedContent = bodyMatch && bodyMatch[1] ? bodyMatch[1] : content;
    } catch (e) {
      console.error('Errore nell\'estrazione del contenuto HTML:', e);
    }
  } else {
    // Mantieni la logica originale per formattare testo semplice come HTML
    extractedContent = content.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
  }
  
  // Sanitizza il contenuto per rimuovere interruzioni di pagina
  const sanitizedContent = extractedContent
    // Rimuovi div con stili di interruzione di pagina
    .replace(/<div[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<div>')
    .replace(/<div[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<div>')
    // Rimuovi br con stili di interruzione di pagina
    .replace(/<br[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<br>')
    .replace(/<br[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<br>')
    // Rimuovi attributi di stile contenenti interruzioni di pagina
    .replace(/style="[^"]*page-break[^"]*"/gi, '')
    // Rimuovi classi che potrebbero causare interruzioni di pagina
    .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi, '<div>')
    // Rimuovi commenti HTML che potrebbero nascondere interruzioni
    .replace(/<!--[\s\S]*?-->/g, '')
    // Rimuovi mso-special-character che potrebbe causare problemi
    .replace(/<!--\[if !mso\]>[\s\S]*?<!\[endif\]-->/g, '')
    .replace(/<!--\[if gte mso[\s\S]*?<!\[endif\]-->/g, '');
  
  return sanitizedContent;
};

// Funzione per convertire HTML in testo semplice
const htmlToPlainText = (html) => {
  if (!html) return '';
  
  // Crea un elemento temporaneo
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Rimuovi script e stili
  const scripts = temp.querySelectorAll('script, style');
  scripts.forEach(item => item.remove());
  
  // Ottieni il testo
  return temp.textContent || temp.innerText || '';
};

// Funzione per verificare se un documento è vuoto
const isDocumentEmpty = (content) => {
  if (!content) return true;
  
  // Converti HTML in testo semplice
  const plainText = htmlToPlainText(content);
  
  // Verifica se è vuoto o contiene solo spazi
  return plainText.trim().length === 0;
};

// Definisci il DocumentDrawer usando styled
const DocumentDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 380,
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  }
}));

// Componente per visualizzare a schermo intero un documento
const ArtifactFullScreenDialog = ({ open, onClose, artifact, onEdit }) => {
  const theme = useTheme();
  const [fontSize, setFontSize] = useState(12);
  const [content, setContent] = useState('');
  const [pages, setPages] = useState([]);
  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // Inizializza il contenuto quando l'artifact cambia
  useEffect(() => {
    if (!artifact || !artifact.content) {
      setContent('');
      return;
    }
    
    // Estrai il contenuto HTML
    const extractedContent = extractHtmlContent(artifact.content);
    setContent(extractedContent);
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
  
  // Funzioni di zoom
  const increaseFont = () => setFontSize(prev => Math.min(prev + 1, 24));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 1, 8));
  
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
            text-align: justify; 
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
  
  // Funzione per export diretto in DOCX (compatibile con browser)
  const handleExport = async () => {
    // Logica di esportazione...
    console.log("Avvio esportazione");
  };
  
  // Funzione per generare numeri di pagina in modo dinamico
  const PageNumbers = () => {
    const [pageNumbers, setPageNumbers] = useState([]);
    const observer = useRef(null);
    
    useEffect(() => {
      if (!scrollContainerRef.current) return;
      
      // Funzione per calcolare i numeri di pagina basati sulle altezze
      const calculatePageNumbers = () => {
        const pages = document.querySelectorAll('.document-page');
        if (!pages.length) return;
        
        const pageHeight = pages[0].offsetHeight;
        const containerScrollTop = scrollContainerRef.current.scrollTop;
        
        // Calcola la pagina corrente e il totale delle pagine
        const currentPage = Math.floor(containerScrollTop / pageHeight) + 1;
        const totalPages = pages.length;
        
        setPageNumbers([currentPage, totalPages]);
      };
      
      // Configura l'observer per rilevare il ridimensionamento
      observer.current = new ResizeObserver(calculatePageNumbers);
      observer.current.observe(scrollContainerRef.current);
      
      // Aggiungi event listener per lo scroll
      scrollContainerRef.current.addEventListener('scroll', calculatePageNumbers);
      
      // Calcolo iniziale
      calculatePageNumbers();
      
      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
        
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener('scroll', calculatePageNumbers);
        }
      };
    }, [open, content]);
    
    if (pageNumbers.length !== 2) return null;
    
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          color: 'text.secondary',
          p: 1,
          borderRadius: 1,
          boxShadow: 1,
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
      >
        <Typography variant="body2">
          Pagina {pageNumbers[0]} di {pageNumbers[1]}
        </Typography>
      </Box>
    );
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
      <DialogTitle id="document-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FileIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" noWrap>{artifact?.name || 'Documento'}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1, px: 1, py: 0.5 }}>
              <IconButton size="small" onClick={decreaseFont}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              
              <Typography variant="body2" sx={{ mx: 1 }}>{fontSize}pt</Typography>
              
              <IconButton size="small" onClick={increaseFont}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
            
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              onClick={handleExport}
              sx={{ mx: 1 }}
            >
              Esporta in Word
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              Modifica
            </Button>
            
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <Box 
        ref={scrollContainerRef}
        sx={{ 
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 3,
          bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#e5e5e5',
        }}
      >
        {/* Contenuto principale con pagine automatiche */}
        {content && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              gap: 4
            }}
          >
            <Paper
              elevation={3}
              className="document-page"
              sx={{
                width: '21cm',
                minHeight: '29.7cm',
                bgcolor: 'white',
                color: 'black',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                position: 'relative',
                breakInside: 'avoid',
                pageBreakAfter: 'always',
                overflow: 'hidden',
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
                    textAlign: 'justify',
                    maxWidth: '100%',
                  },
                  '& h1': { 
                    fontSize: `${fontSize + 6}pt`, 
                    fontWeight: 'bold',
                    maxWidth: '100%',
                  },
                  '& h2': { 
                    fontSize: `${fontSize + 4}pt`, 
                    fontWeight: 'bold',
                    maxWidth: '100%',
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
                  },
                  '& td, & th': {
                    padding: '5px',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                  },
                  '& ul, & ol': {
                    paddingLeft: '20pt',
                    textAlign: 'left',
                    maxWidth: '100%',
                  },
                  '& li': {
                    marginBottom: '5pt',
                    maxWidth: '100%',
                  },
                  '& a': {
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                  },
                  '& pre, & code': {
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    display: 'block',
                    padding: '10px',
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                    borderRadius: '4px'
                  },
                  '& blockquote': {
                    borderLeft: `4px solid ${theme.palette.mode === 'dark' ? '#666' : '#ddd'}`,
                    paddingLeft: '15px',
                    margin: '10px 0',
                    color: theme.palette.mode === 'dark' ? '#ccc' : '#777',
                    maxWidth: 'calc(100% - 19px)',
                  }
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </Paper>
          </Box>
        )}
        
        {/* Indicatore di pagina */}
        <PageNumbers />
      </Box>
    </Dialog>
  );
};

// Editor di documenti semplificato
const DocumentEditorDialog = ({ open, onClose, document: docData, onSave }) => {
  const theme = useTheme();
  const [documentTitle, setDocumentTitle] = useState('');
  const editorRef = useRef(null);
  const [initialContent, setInitialContent] = useState('<p><br></p>');
  
  // Inizializza l'editor con i dati del documento
  useEffect(() => {
    if (docData && open) {
      setDocumentTitle(docData.name || 'Nuovo Documento');
      
      try {
        // Estrai il contenuto HTML
        const htmlContent = extractHtmlContent(docData.content || '');
        setInitialContent(htmlContent);
      } catch (e) {
        console.error("Errore nell'inizializzazione del documento:", e);
        setInitialContent('<p><br></p>');
      }
    }
  }, [docData, open]);
  
  // Salva il documento
  const handleSave = () => {
    if (!docData || !editorRef.current) return;
    
    // Ottieni il contenuto corrente dell'editor
    const content = editorRef.current.innerHTML;
    
    // Prepara il contenuto HTML per Word
    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word 15">
    <meta name="Originator" content="Microsoft Word 15">
    <title>${documentTitle}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page { size: 21cm 29.7cm; margin: 2cm; }
      body { font-family: 'Calibri', sans-serif; font-size: 12pt; line-height: 1.5; }
      p { margin-bottom: 10pt; text-align: inherit; }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>`;
    
    // Prepara l'oggetto documento aggiornato
    const updatedDocument = {
      ...docData,
      name: documentTitle.endsWith('.docx') ? documentTitle : documentTitle + '.docx',
      content: wordHtml,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: new Date().toISOString()
    };
    
    // Salva e chiudi
    onSave(updatedDocument);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen
      PaperProps={{
        sx: { bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f0f0f0' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon color="primary" sx={{ mr: 1 }} />
            <TextField
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              variant="standard"
              placeholder="Nome documento"
              InputProps={{
                sx: { 
                  fontSize: '1.25rem', 
                  fontWeight: 500
                }
              }}
              sx={{ minWidth: 300 }}
            />
          </Box>
          
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              startIcon={<SaveIcon />}
              sx={{ mr: 1 }}
            >
              Salva
            </Button>
            <Button 
              variant="outlined" 
              onClick={onClose}
            >
              Annulla
            </Button>
            <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <Box sx={{ 
        p: 3, 
        bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f0f0f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: 'calc(100vh - 64px)',
        overflow: 'auto'
      }}>
        <Paper
          elevation={3}
          sx={{
            width: '21cm',
            minHeight: '29.7cm',
            bgcolor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            position: 'relative'
          }}
        >
          <Box
            ref={editorRef}
            contentEditable
            dangerouslySetInnerHTML={{ __html: initialContent }}
            suppressContentEditableWarning
            sx={{
              p: 4,
              minHeight: '29.7cm',
              outline: 'none',
              fontFamily: '"Calibri", sans-serif',
              fontSize: '12pt',
              lineHeight: 1.5,
              color: 'black',
              direction: 'ltr',
              '& p': { marginBottom: '10pt' }
            }}
          />
          
          <Box sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            fontSize: '9pt',
            color: '#888'
          }}>
            1
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
};

// Componente documento caricato nella lista
const DocumentItem = ({ document, onDelete }) => {
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

// Componente per mostrare il progresso dell'elaborazione di un documento
const DocumentProcessingStatus = ({ document, onViewDetails }) => {
  const theme = useTheme();
  
  // Stato simulato di elaborazione del documento
  const [progress, setProgress] = useState(document?.progress || 0);
  const [status, setStatus] = useState(document?.status || 'QUEUED');

  useEffect(() => {
    if (document && (document.status === 'PROCESSING' || document.status === 'QUEUED')) {
      const interval = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress + Math.floor(Math.random() * 10);
          if (newProgress >= 100) {
            clearInterval(interval);
            setStatus('COMPLETED');
            return 100;
          }
          return newProgress;
        });
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [document]);

  const getStatusText = () => {
    switch(status) {
      case 'QUEUED': return 'In coda';
      case 'PARSING': return 'Analisi in corso';
      case 'PROCESSING': return 'Elaborazione in corso';
      case 'OCR_PROCESSING': return 'OCR in corso';
      case 'TEXT_EXTRACTION': return 'Estrazione testo';
      case 'SUMMARIZING': return 'Generazione riassunto';
      case 'COMPLETED': return 'Completato';
      case 'FAILED': return 'Fallito';
      default: return 'Sconosciuto';
    }
  };
  
  const getStatusIcon = () => {
    switch(status) {
      case 'COMPLETED': 
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'FAILED': 
        return <ErrorIcon fontSize="small" color="error" />;
      case 'QUEUED': 
        return <WarningIcon fontSize="small" color="warning" />;
      default: 
        return <CircularProgress size={16} />;
    }
  };

  if (!document) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {document.type?.includes('pdf') ? <PictureAsPdfIcon color="error" /> :
           document.type?.includes('word') ? <ArticleIcon color="primary" /> :
           document.type?.includes('image') ? <ImageIcon color="success" /> :
           <FileIcon />}
          <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>
            {document.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStatusIcon()}
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {getStatusText()}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {progress}%
          </Typography>
        </Box>
        
       <LinearProgress
variant="determinate"
value={progress}
sx={{
height: 8,
borderRadius: 4,
backgroundColor: theme.palette.mode === 'dark'
? alpha(theme.palette.primary.main, 0.15)
: alpha(theme.palette.primary.main, 0.1)
}}
/>
{onViewDetails && (
      <Box sx={{ mt: 1, textAlign: 'right' }}>
        <Button 
          size="small" 
          onClick={() => onViewDetails(document)}
          endIcon={<ArrowRightIcon />}
        >
          Dettagli
        </Button>
      </Box>
    )}
  </CardContent>
</Card>
);
};
// Esporta i componenti
export {
DocumentItem,
ArtifactFullScreenDialog,
DocumentEditorDialog,
DocumentDrawer,
DocumentProcessingStatus,
extractHtmlContent,
htmlToPlainText,
isDocumentEmpty
};