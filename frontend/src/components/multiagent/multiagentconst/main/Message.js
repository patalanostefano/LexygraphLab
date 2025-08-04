import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, alpha } from '@mui/material';
import { keyframes } from '@mui/system';
import PersonIcon from '@mui/icons-material/Person';

// Definizione delle animazioni keyframes
const pulseAnimation = keyframes`
  0% { opacity: 0.7; transform: scale(0.97); }
  50% { opacity: 1; transform: scale(1.03); }
  100% { opacity: 0.7; transform: scale(0.97); }
`;

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Animazione cursore lampeggiante per l'effetto digitazione
const blinkCursor = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

/**
 * Message component con V di Valis che ruota al passaggio del mouse
 * e supporto per effetto digitazione progressiva
 */
export default function Message({ type, content, timestamp, agent, typing = false, forwardRef }) {
  const isUser = type === 'user';
  const [isHovered, setIsHovered] = useState(false);
  
  // Funzione per determinare il colore dell'agente
  const getAgentColor = () => {
    if (!agent) return '#7C4DFF'; // Colore default
    
    if (typeof agent === 'object' && agent.color) {
      return agent.color;
    }
    
    // Mappatura colori basata sul nome dell'agente
    const agentName = (typeof agent === 'string' ? agent : agent.name || '').toLowerCase();
    
    if (agentName.includes('valis')) return '#7C4DFF';
    if (agentName.includes('generazione')) return '#2196F3';
    if (agentName.includes('estrazione')) return '#F44336';
    if (agentName.includes('ricerca')) return '#00A86B';
    
    return '#7C4DFF'; // Default
  };
  
  // Ottieni il nome dell'agente
  const getAgentName = () => {
    if (!agent) return 'Valis'; // Default a Valis
    return typeof agent === 'string' ? agent : (agent.name || 'Valis');
  };

  // Componente SVG per la "V" di Valis in stile serif
  const ValisIcon = () => (
    <svg 
      width="22" 
      height="22" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: `${isHovered ? `${spinAnimation}` : `${pulseAnimation}`} 2s infinite ease-in-out`,
      }}
    >
      {/* V elegante in stile serif - senza puntino */}
      <path 
        d="M5 4L12 20L19 4" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {/* Elementi serif per rendere la V più elegante */}
      <path
        d="M3 4H7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 4H21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <Box
      ref={forwardRef}
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        mx: 0.5
      }}
    >
      {/* Avatar con la V di Valis */}
      {!isUser && (
        <Avatar
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #7C4DFF, #00BFA5)',
            mr: 1,
            mt: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
            boxShadow: isHovered 
              ? `0 4px 20px ${alpha('#7C4DFF', 0.5)}, 0 0 0 2px ${alpha('#7C4DFF', 0.2)}`
              : '0 2px 8px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            '&:hover': {
              background: 'linear-gradient(135deg, #9C6AFF, #00D4BE)'
            }
          }}
        >
          <ValisIcon />
        </Avatar>
      )}

      <Paper
        sx={{
          p: 1.8,
          maxWidth: '85%',
          bgcolor: isUser 
            ? theme => theme.palette.primary.main
            : theme => theme.palette.background.default,
          color: isUser ? 'white' : 'text.primary',
          borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
          fontSize: '1.05rem',
          boxShadow: isUser 
            ? '0 2px 8px rgba(0,0,0,0.1)'
            : '0 2px 5px rgba(0,0,0,0.06)',
          borderLeft: !isUser ? `3px solid #7C4DFF` : undefined
        }}
        elevation={1}
      >
        {/* Badge con nome Valis */}
        {!isUser && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 0.5,
              pb: 0.5,
              borderBottom: `1px solid ${alpha('#7C4DFF', 0.1)}`
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                color: '#7C4DFF',
                mr: 1
              }}
            >
              @Valis
            </Typography>
            {timestamp && (
              <Typography variant="caption" color="text.secondary">
                {typeof timestamp === 'object' ? timestamp.toLocaleTimeString() : timestamp}
              </Typography>
            )}
          </Box>
        )}
        
        <Box sx={{ position: 'relative' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontSize: '1.05rem'
            }}
          >
            {content}
            {/* Cursore lampeggiante durante la digitazione */}
            {typing && (
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block',
                  width: '2px',
                  height: '1.2em',
                  backgroundColor: 'text.primary',
                  ml: 0.5,
                  verticalAlign: 'text-bottom',
                  animation: `${blinkCursor} 0.7s infinite`
                }}
              />
            )}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}