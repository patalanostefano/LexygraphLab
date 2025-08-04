import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Dialog,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import { extractHtmlContent } from './documentUtils';

// Editor di documenti semplificato
export const DocumentEditorDialog = ({ open, onClose, document: docData, onSave }) => {
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
  
  // Salva il documento - MODIFICATO PER RISOLVERE IL PROBLEMA 2
  const handleSave = () => {
    if (!docData || !editorRef.current) return;
    
    // Ottieni il contenuto corrente dell'editor
    const content = editorRef.current.innerHTML;
    
    // Prepara il contenuto HTML per Word, ma conserva solo il corpo per la visualizzazione nell'artifact
    const cleanContent = content; // Questo è il contenuto che verrà visualizzato nell'artifact
    
    // Prepara l'HTML completo per DOCX
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
      content: cleanContent, // Utilizza il contenuto pulito per la visualizzazione
      rawContent: wordHtml, // Mantieni l'HTML completo in una proprietà separata per il download
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
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
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
          
          <Box sx={{ flexGrow: 1 }} />
          
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
        </Toolbar>
      </AppBar>
      
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