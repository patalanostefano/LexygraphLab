import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Paper,
  alpha,
  useTheme,
  Tooltip,
  ListItemButton,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility'; // AGGIUNTO: Per l'anteprima

export default function PromptInputArea({
  selectedAgents = [],
  onPromptChange = () => {},
  onSendPrompt = () => {},
  onAgentMention = () => {},
  onUploadDocument = () => {},
  documents = [],
  onDeleteDocument = () => {},
  onDocumentPreview = () => {}, // AGGIUNTO: Handler per l'anteprima documenti
}) {
  // Stati principali
  const [promptText, setPromptText] = useState('');
  const [isDocumentDrawerOpen, setIsDocumentDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Stati per la gestione delle menzioni
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const inputRef = useRef(null);

  // Stato per tenere traccia della posizione del cursore quando viene digitato @
  const [atPosition, setAtPosition] = useState(null);

  // Tema attuale per adattare i colori
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Agenti disponibili con colori definiti (con Valis al posto di Assistente)
  const availableAgents = [
    { id: 'agent1', name: 'Valis', color: '#7C4DFF' },
    { id: 'agent2', name: 'Generazione', color: '#2196F3' },
    { id: 'agent3', name: 'Estrazione', color: '#F44336' },
    { id: 'agent4', name: 'Ricerca', color: '#00A86B' },
  ];

  // Funzione per identificare nodi di testo all'interno di contenitori agente
  const isInsideAgentContainer = (node) => {
    let parent = node;

    while (parent && parent !== inputRef.current) {
      if (parent.classList && parent.classList.contains('agent-container')) {
        return parent;
      }
      parent = parent.parentNode;
    }

    return null;
  };

  // Gestione input migliorata
  const handleInputChange = (e) => {
    // Controlla posizione del cursore
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;

      // Se il nodo è di testo
      if (node.nodeType === Node.TEXT_NODE) {
        const textBeforeCursor = node.textContent.substring(
          0,
          range.startOffset,
        );
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        // Trova se siamo in un contenitore di agente
        const containerNode = isInsideAgentContainer(node);

        // Abbiamo digitato @ e non siamo già in un popup di menzione
        if (lastAtIndex === textBeforeCursor.length - 1 && !isMentioning) {
          setIsMentioning(true);
          setMentionAnchorEl(inputRef.current);
          setAtPosition({
            node: node,
            offset: lastAtIndex,
            container: containerNode,
          });
        }
      }
    }

    // Aggiorna il testo del prompt
    if (inputRef.current) {
      const text = inputRef.current.textContent || '';
      setPromptText(text);
      onPromptChange({ target: { value: text } });
    }
  };

  // Funzione per creare un contenitore per l'agente
  const createAgentContainer = (agent, insertAfterNode = null) => {
    // Crea contenitore principale
    const container = document.createElement('span');
    container.className = 'agent-container';
    container.setAttribute('data-agent', agent.id);
    container.style.display = 'inline-block';
    container.style.padding = '2px 6px';
    container.style.margin = '0 2px';
    container.style.borderRadius = '4px';
    container.style.backgroundColor = `${alpha(agent.color, isDarkMode ? 0.15 : 0.1)}`;
    container.style.border = `1px solid ${alpha(agent.color, isDarkMode ? 0.3 : 0.2)}`;

    // Badge con il nome dell'agente
    const badge = document.createElement('span');
    badge.className = 'agent-badge';
    badge.textContent = `@${agent.name}`;
    badge.style.fontWeight = '600';
    badge.style.color = isDarkMode ? alpha(agent.color, 0.9) : agent.color;
    badge.style.marginRight = '4px';
    badge.contentEditable = 'false'; // Badge non modificabile

    // Crea area per il contenuto
    const content = document.createElement('span');
    content.className = 'agent-content';
    content.style.display = 'inline'; // Permette flusso naturale del testo

    // Aggiungi i componenti al contenitore
    container.appendChild(badge);
    container.appendChild(content);

    // Inserisci il contenitore dopo il nodo specificato o alla fine
    if (insertAfterNode && insertAfterNode.parentNode) {
      insertAfterNode.parentNode.insertBefore(
        container,
        insertAfterNode.nextSibling,
      );
    } else if (inputRef.current) {
      inputRef.current.appendChild(container);
    }

    return { container, content };
  };

  // Gestione selezione agente - versione corretta
  const handleAgentSelect = (agent) => {
    // Chiudi il popover
    setIsMentioning(false);
    setMentionAnchorEl(null);

    if (!inputRef.current || !atPosition) return;

    try {
      // Ottieni la selezione corrente
      const selection = window.getSelection();
      const range = document.createRange();

      // Se siamo in un contenitore esistente
      if (atPosition.container) {
        // Tronca il testo al punto @
        if (atPosition.node.textContent.length > atPosition.offset) {
          atPosition.node.textContent = atPosition.node.textContent.substring(
            0,
            atPosition.offset,
          );
        }

        // Crea un nuovo contenitore dopo quello corrente
        const { container, content } = createAgentContainer(
          agent,
          atPosition.container,
        );

        // Posiziona il cursore dentro il nuovo contenitore
        range.setStart(content, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Rimuovi il carattere @
        if (atPosition.node.textContent.length > atPosition.offset) {
          atPosition.node.textContent =
            atPosition.node.textContent.substring(0, atPosition.offset) +
            atPosition.node.textContent.substring(atPosition.offset + 1);
        }

        // Crea un nuovo contenitore al punto corrente
        const { container, content } = createAgentContainer(
          agent,
          atPosition.node,
        );

        // Posiziona il cursore dentro il nuovo contenitore
        range.setStart(content, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Notifica che l'agente è stato menzionato
      onAgentMention(agent);

      // Reset della posizione @
      setAtPosition(null);
    } catch (e) {
      console.error("Errore nell'inserimento dell'agente:", e);
    }
  };

  // Gestione invio messaggio migliorata
  const handleSendMessage = () => {
    if (!promptText.trim()) return;

    // Estrai i messaggi strutturati per agente
    const agentMessages = [];

    if (inputRef.current) {
      const containers = inputRef.current.querySelectorAll('.agent-container');

      containers.forEach((container) => {
        const agentId = container.getAttribute('data-agent');
        const agent = availableAgents.find((a) => a.id === agentId);

        if (agent) {
          const badge = container.querySelector('.agent-badge');
          const content = container.textContent
            .replace(badge.textContent, '')
            .trim();

          if (content) {
            agentMessages.push({
              agentId: agentId,
              agentName: agent.name,
              content: content,
              color: agent.color,
            });
          }
        }
      });
    }

    // Invia il prompt (testo completo e messaggi strutturati)
    onSendPrompt(promptText, agentMessages);

    // Reset
    setPromptText('');
    if (inputRef.current) {
      inputRef.current.innerHTML = '';
    }
    setIsMentioning(false);
    setMentionAnchorEl(null);
    setAtPosition(null);
  };

  // Gestione tastiera
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape' && isMentioning) {
      e.preventDefault();
      setIsMentioning(false);
      setMentionAnchorEl(null);
      setAtPosition(null);
    }
  };

  // Gestione documenti
  const getFileIcon = (fileType) => {
    if (!fileType) return <DescriptionIcon />;
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('word') || fileType.includes('document'))
      return <ArticleIcon color="primary" />;
    if (fileType.includes('image')) return <ImageIcon color="success" />;
    return <DescriptionIcon />;
  };

  const handleMenuOpen = (event, item, type) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedItem({ ...item, type });
  };

  const handleMenuClose = () => setMenuAnchorEl(null);

  const handleDeleteClick = () => {
    setItemToDelete(selectedItem);
    setIsDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (itemToDelete && itemToDelete.type === 'document') {
      onDeleteDocument(itemToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // AGGIUNTO: Handler per visualizzare l'anteprima del documento
  const handleDocumentClick = (document) => {
    if (onDocumentPreview) {
      onDocumentPreview(document);
    }
  };

  // AGGIUNTO: Handler per l'anteprima dal menu
  const handlePreviewClick = () => {
    if (selectedItem) {
      handleDocumentClick(selectedItem);
    }
    handleMenuClose();
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 1.5,
          backgroundColor: 'background.paper',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Area input messaggi */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <IconButton
            onClick={() => setIsDocumentDrawerOpen(true)}
            sx={{ mr: 1, mt: 0.8 }}
          >
            <AttachFileIcon />
          </IconButton>

          <Box sx={{ flex: 1, position: 'relative' }}>
            {/* Campo contenteditable migliorato */}
            <div
              ref={inputRef}
              style={{
                width: '100%',
                minHeight: '40px',
                maxHeight: '150px',
                padding: '9px 14px',
                fontSize: '1.05rem',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'}`,
                borderRadius: '4px',
                overflowY: 'auto',
                outline: 'none',
                lineHeight: '1.5',
                fontFamily: 'inherit',
                backgroundColor: 'transparent',
                position: 'relative',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: isDarkMode
                  ? 'rgba(255, 255, 255, 0.87)'
                  : 'rgba(0, 0, 0, 0.87)',
              }}
              className="agent-input-field"
              contentEditable={true}
              onInput={handleInputChange}
              onKeyDown={handleKeyDown}
              onClick={() => {
                inputRef.current?.focus();
              }}
              suppressContentEditableWarning={true}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            disabled={!promptText.trim()}
            sx={{
              ml: 1,
              mt: 0.8,
              minWidth: 0,
              p: 0.5,
              borderRadius: '50%',
              width: 36,
              height: 36,
            }}
          >
            <SendIcon fontSize="small" />
          </Button>
        </Box>
      </Box>

      {/* Stili migliorati senza interferenze */}
      <style>{`
        .agent-input-field:focus {
          border-color: ${isDarkMode ? '#9575CD' : '#7C4DFF'} !important;
          box-shadow: 0 0 0 2px ${isDarkMode ? 'rgba(149, 117, 205, 0.25)' : 'rgba(124, 77, 255, 0.25)'};
        }
        
        .agent-input-field:hover:not(:focus) {
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.42)'};
        }

        .agent-container {
          display: inline;
          margin: 0 2px;
          white-space: normal;
        }
        
        .agent-badge {
          user-select: none;
          cursor: default;
        }
        
        .agent-content {
          display: inline;
          white-space: pre-wrap;
        }
      `}</style>

      {/* Popover per selezionare gli agenti */}
      <Popover
        open={isMentioning}
        anchorEl={mentionAnchorEl}
        onClose={() => {
          setIsMentioning(false);
          setMentionAnchorEl(null);
          setAtPosition(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ mt: -1 }}
        disableRestoreFocus
      >
        <Paper
          sx={{
            width: 250,
            maxHeight: 300,
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Typography variant="subtitle2" sx={{ p: 1.5, fontWeight: 600 }}>
            Seleziona un agente
          </Typography>
          <Divider />
          <List dense>
            {availableAgents.map((agent) => (
              <ListItem
                key={agent.id}
                button
                onClick={() => handleAgentSelect(agent)}
                sx={{
                  py: 1,
                  '&:hover': {
                    bgcolor: alpha(agent.color, isDarkMode ? 0.15 : 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(agent.color, isDarkMode ? 0.2 : 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${alpha(agent.color, isDarkMode ? 0.4 : 0.3)}`,
                    }}
                  >
                    <PersonIcon
                      fontSize="small"
                      sx={{
                        color: isDarkMode
                          ? alpha(agent.color, 0.9)
                          : agent.color,
                      }}
                    />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={agent.name}
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: 500,
                      color: isDarkMode ? alpha(agent.color, 0.9) : agent.color,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>

      {/* Drawer per documenti */}
      <Drawer
        anchor="right"
        open={isDocumentDrawerOpen}
        onClose={() => setIsDocumentDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            p: 0,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            Documenti
          </Typography>
          <IconButton onClick={() => setIsDocumentDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Sezione Documenti */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">Documenti del progetto</Typography>
            <Button size="small" startIcon={<AddIcon />} component="label">
              Carica
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) {
                    onUploadDocument(e.target.files);
                  }
                }}
              />
            </Button>
          </Box>

          {documents.length > 0 ? (
            <List dense sx={{ mb: 2 }}>
              {documents.map((doc, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    mb: 0.5,
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, doc, 'document')}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  {/* MODIFICATO: Reso cliccabile per l'anteprima */}
                  <ListItemButton
                    onClick={() => handleDocumentClick(doc)}
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getFileIcon(doc.type || doc.mimeType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={`${doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : ''}`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        noWrap: true,
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 1, textAlign: 'center' }}
            >
              Nessun documento disponibile
            </Typography>
          )}
        </Box>
      </Drawer>

      {/* Menu per le azioni su documenti - AGGIORNATO */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {/* AGGIUNTO: Opzione per visualizzare anteprima */}
        <MenuItem onClick={handlePreviewClick}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Visualizza anteprima" />
        </MenuItem>

        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Elimina" />
        </MenuItem>
      </Menu>

      {/* Dialog per conferma eliminazione */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare il documento "{itemToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
