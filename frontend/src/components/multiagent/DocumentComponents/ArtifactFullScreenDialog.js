import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

// Funzione di utilità migliorata per estrarre e sanitizzare il contenuto HTML
export const extractHtmlContent = (content) => {
  if (!content) return '';
  
  // Se il contenuto è già HTML, restituiscilo con solo pulizia minima
  if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>') || 
      content.includes('<ul>') || content.includes('<ol>') || content.includes('<table>')) {
    
    // Rimuovi solo interruzioni di pagina problematiche ma mantieni il resto della formattazione
    return content
      .replace(/<div[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<div>')
      .replace(/<div[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<div>')
      .replace(/<br[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<br>')
      .replace(/<br[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<br>')
      .replace(/style="[^"]*page-break[^"]*"/gi, '') // Rimuovi solo stili di interruzione pagina
      .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi, '<div>');
  }
  
  // Se il contenuto è testo semplice, convertilo in HTML mantenendo i paragrafi e le interruzioni di riga
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
  
  // Inizializza il contenuto quando l'artifact cambia
  useEffect(() => {
    if (!artifact || !artifact.content) {
      setContent('');
      return;
    }
    
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
    if (!artifact) return;
    
    try {
      // Crea un elemento temporaneo per analizzare il contenuto HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Funzione per estrarre testo pulito dagli elementi
      const extractTextFromElement = (element) => {
        return element.textContent.trim();
      };
      
      // Inizializza un documento Word con configurazione migliorata
      const doc = new Document({
        sections: [],
        // Imposta eventuali proprietà globali del documento
        styles: {
          default: {
            document: {
              run: {
                font: "Calibri",
                size: fontSize * 2 // docx usa half-points
              },
              paragraph: {
                spacing: { after: 200 } // spazio dopo ogni paragrafo
              }
            }
          }
        }
      });
      
      const docChildren = [];
      
      // Funzione per convertire elementi HTML in componenti docx
      const processElements = () => {
        // Aggiungi un paragrafo vuoto all'inizio per assicurarsi che il contenuto inizi alla prima pagina
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "",
                size: fontSize * 2,
              })
            ],
            spacing: { after: 0, before: 0 },
            pageBreakBefore: false,
          })
        );
        
        // Seleziona tutti gli elementi di primo livello
        const elements = tempDiv.querySelectorAll('body > *');
        
        if (elements.length === 0) {
          // Se non ci sono elementi, aggiungi un paragrafo con il testo completo
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: tempDiv.textContent.trim() || 'Documento vuoto',
                  size: fontSize * 2,
                })
              ],
              spacing: { after: 200 },
              pageBreakBefore: false,
            })
          );
          return;
        }
        
        // Processa ogni elemento di primo livello
        elements.forEach(element => {
          switch (element.tagName.toLowerCase()) {
            case 'h1':
              docChildren.push(
                new Paragraph({
                  text: extractTextFromElement(element),
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 240, after: 120 },
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'h2':
              docChildren.push(
                new Paragraph({
                  text: extractTextFromElement(element),
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 240, after: 120 },
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'h3':
              docChildren.push(
                new Paragraph({
                  text: extractTextFromElement(element),
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 240, after: 120 },
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'p':
              // Salta paragrafi vuoti
              const paragraphText = extractTextFromElement(element);
              if (!paragraphText) break;
              
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: paragraphText,
                      size: fontSize * 2,
                    })
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  pageBreakBefore: false,
                })
              );
              break;
              
            case 'ul':
            case 'ol':
              const listItems = element.querySelectorAll('li');
              listItems.forEach(li => {
                const itemText = extractTextFromElement(li);
                if (itemText) {
                  docChildren.push(
                    new Paragraph({
                      text: itemText,
                      bullet: { level: 0 },
                      spacing: { after: 100 },
                      pageBreakBefore: false,
                    })
                  );
                }
              });
              break;
              
            default:
              // Per altri tipi di elementi, estrai il testo e creane un paragrafo
              const text = extractTextFromElement(element);
              if (text) {
                docChildren.push(
                  new Paragraph({
                    text,
                    spacing: { after: 200 },
                    pageBreakBefore: false,
                  })
                );
              }
              break;
          }
        });
      };
      
      // Esegui la conversione
      processElements();
      
      // Se non ci sono elementi, aggiungi un paragrafo vuoto
      if (docChildren.length === 0) {
        docChildren.push(
          new Paragraph({
            text: "Documento vuoto",
            pageBreakBefore: false
          })
        );
      }
      
      // Sostituisci la prima sezione con tutti gli elementi
      doc.addSection({
        children: docChildren,
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            },
            size: {
              width: 11906, // A4 width
              height: 16838, // A4 height
            }
          },
          // Assicurati di non avere interruzioni di pagina all'inizio
          pageBreakBefore: false
        }
      });
      
      // Genera il file DOCX usando Blob per compatibilità browser
      const docxBlob = await Packer.toBlob(doc);
      
      // Prepara il nome del file
      const fileName = artifact.name || 'Documento';
      const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
      const fileNameWithExtension = `${fileNameWithoutExtension}.docx`;
      
      // Crea un oggetto URL e avvia il download
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameWithExtension;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Errore durante l'esportazione in DOCX:", error);
      
      // In caso di errore, tenta il fallback all'esportazione HTML
      try {
        console.log("Tentativo di fallback all'esportazione HTML...");
        
        // Crea un contenuto HTML ben formattato compatibile con Word
        const wordHtml = `
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

        // Prepara il nome del file
        const fileName = artifact.name || 'Documento';
        const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
        const fileNameWithExtension = `${fileNameWithoutExtension}.html`;
        
        // Crea un Blob con il contenuto HTML
        const htmlBlob = new Blob([wordHtml], { 
          type: 'text/html;charset=utf-8' 
        });
        
        // Crea un link per scaricare il file
        const fallbackUrl = URL.createObjectURL(htmlBlob);
        const fallbackLink = document.createElement('a');
        fallbackLink.href = fallbackUrl;
        fallbackLink.download = fileNameWithExtension;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
        URL.revokeObjectURL(fallbackUrl);
        
        // Mostra un messaggio informativo all'utente
        alert("Non è stato possibile generare un file DOCX. È stato scaricato un file HTML che puoi aprire con Microsoft Word e salvare come documento Word (.docx).");
        
      } catch (fallbackError) {
        console.error("Anche il fallback è fallito:", fallbackError);
        alert("Si è verificato un errore durante l'esportazione del documento. Riprova più tardi. Dettaglio errore: " + error.message);
      }
    }
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
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <FileIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" noWrap>{artifact?.name || 'Documento'}</Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
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
                  },
                  // Importante: conserva gli stili inline
                  '& [style]': {
                    all: 'revert', // Questo permette di mantenere gli stili inline
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