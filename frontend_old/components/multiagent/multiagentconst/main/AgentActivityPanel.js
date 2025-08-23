import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Componente per un singolo messaggio
import Message from './Message';

/**
 * Pannello attività degli agenti con sostituzione completa di Assistente con Valis
 * e configurato per mostrare solo risposte da Valis
 */
export default function AgentActivityPanel({
  messages = [],
  isProcessing = false,
  projectName = '',
  onReturn,
  selectedAgents = [],
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [typingMessage, setTypingMessage] = useState(null);
  const [displayMessages, setDisplayMessages] = useState([]);

  // Effetto per aggiornare i messaggi da visualizzare
  useEffect(() => {
    if (typingMessage) {
      // Se c'è un messaggio in digitazione, mostra tutti i messaggi precedenti più quello in digitazione
      const lastIndex = messages.length - 1;
      const messagesToShow =
        lastIndex >= 0
          ? [...messages.slice(0, lastIndex), typingMessage]
          : [typingMessage];
      setDisplayMessages(messagesToShow);
    } else {
      // Altrimenti mostra tutti i messaggi
      setDisplayMessages(messages);
    }
  }, [messages, typingMessage]);

  // Funzione per fare lo scroll all'ultimo messaggio
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Effetto per gestire lo scroll automatico quando arrivano nuovi messaggi
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  // Effetto per simulare la digitazione quando isProcessing diventa false (nuova risposta)
  useEffect(() => {
    // Quando isProcessing passa da true a false, significa che una nuova risposta è arrivata
    if (!isProcessing && messages.length > 0) {
      // Prendi l'ultimo messaggio se è di un agente
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'agent') {
        // Crea una versione "in digitazione" del messaggio con contenuto parziale
        setTypingMessage({
          ...lastMessage,
          content: '',
          typing: true,
        });

        // Simula la digitazione graduale del contenuto
        let currentText = '';
        const fullText = lastMessage.content;
        let charIndex = 0;

        const typingInterval = setInterval(() => {
          if (charIndex < fullText.length) {
            // Aggiungi da 1 a 3 caratteri per volta per una velocità di digitazione più naturale
            const charsToAdd = Math.min(
              Math.floor(Math.random() * 3) + 1,
              fullText.length - charIndex,
            );
            currentText += fullText.slice(charIndex, charIndex + charsToAdd);
            charIndex += charsToAdd;

            setTypingMessage((prev) => ({
              ...prev,
              content: currentText,
              typing: true,
            }));
          } else {
            // Completata la digitazione
            clearInterval(typingInterval);
            setTypingMessage(null);
          }
        }, 30); // Regola la velocità di digitazione

        return () => clearInterval(typingInterval);
      }
    }
  }, [isProcessing, messages]);

  // Valida i messaggi
  if (!Array.isArray(messages)) {
    console.error("Prop 'messages' is not an array:", messages);
    return null;
  }

  // CORREZIONE: Sistemiamo in profondità i riferimenti ad assistente
  // e assicuriamoci che tutti i messaggi degli agenti provengano da Valis
  const modifyMessages = (msgs) => {
    return msgs.map((msg) => {
      // Se è un messaggio dell'utente, lascialo invariato
      if (msg.type === 'user') return msg;

      // Tutti i messaggi degli agenti hanno Valis come mittente
      return { ...msg, agent: 'Valis' };
    });
  };

  // Converti tutti i messaggi sostituendo "Assistente" con "Valis"
  // e assicurando che tutti i messaggi degli agenti provengano da Valis
  const correctedMessages = modifyMessages(displayMessages);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onReturn}
        >
          Progetti
        </Button>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            textAlign: 'right',
            flex: 1,
            pr: 2,
            fontSize: '1.1rem',
          }}
        >
          {projectName ? projectName : 'Conversazione'}
        </Typography>
      </Box>

      {/* Lista messaggi */}
      <Box
        ref={messagesContainerRef}
        className="messages-container"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 2,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
        }}
      >
        {correctedMessages.length > 0 ? (
          <>
            {correctedMessages.map((msg, idx) => (
              <Message
                key={idx}
                type={msg.type}
                content={msg.content}
                timestamp={msg.timestamp}
                agent={msg.type === 'agent' ? 'Valis' : null}
                typing={msg.typing || false}
                forwardRef={
                  idx === correctedMessages.length - 1 ? messagesEndRef : null
                }
              />
            ))}
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              p: 2,
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.05rem', mb: 2 }}
            >
              Inizia una nuova conversazione digitando un messaggio.
            </Typography>
            {selectedAgents.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Valis coordinerà gli agenti per aiutarti.
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Indicatore di elaborazione */}
      {isProcessing && !typingMessage && (
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 -2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <CircularProgress size={18} sx={{ mr: 1.5 }} />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Elaborazione in corso...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
