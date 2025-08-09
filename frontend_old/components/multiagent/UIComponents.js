import React from 'react';
import { 
  Box, 
  Typography,
  Popper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ThinkingIcon from '@mui/icons-material/Psychology';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import TerminalIcon from '@mui/icons-material/Terminal';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Componente messaggi nell'output
export const Message = ({ type, content, timestamp, agent }) => {
  const theme = useTheme();
  
  // Determina lo stile del messaggio in base al tipo
  const getMessageStyle = () => {
    switch (type) {
      case 'system':
        return {
          bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.8),
          borderLeft: `3px solid ${theme.palette.info.main}`,
        };
      case 'agent':
        return {
          bgcolor: theme.palette.mode === 'dark' ? alpha('#2D2B55', 0.6) : alpha('#EDF7FF', 0.8),
          borderLeft: `3px solid ${theme.palette.primary.main}`,
        };
      case 'artifact':
        return {
          bgcolor: theme.palette.mode === 'dark' ? alpha('#253D35', 0.6) : alpha('#E8F5E9', 0.8),
          borderLeft: `3px solid ${theme.palette.success.main}`,
        };
      default:
        return {
          bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#FFFFFF', 0.8),
        };
    }
  };
  
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        mb: 2,
        ...getMessageStyle(),
      }}
    >
      {agent && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={agent.name} 
            size="small" 
            color="primary" 
            avatar={<PsychologyIcon />} 
            sx={{ mr: 1 }} 
          />
          {timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              {timestamp}
            </Typography>
          )}
        </Box>
      )}
      
      <Typography
        sx={{
          fontFamily: '"Inter", sans-serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
      </Typography>
    </Box>
  );
};

// Funzione per ottenere l'icona di stato
export const getStatusIcon = (status) => {
  switch(status) {
    case 'thinking':
      return <ThinkingIcon />;
    case 'viewing':
      return <VisibilityIcon />;
    case 'editing':
      return <EditIcon />;
    case 'browsing':
      return <TerminalIcon />;
    default:
      return <AccessTimeIcon />;
  }
};

// Componente per la selezione degli agenti con @mentions
export const AgentMentionSelector = ({ availableAgents, onSelect }) => {
  const theme = useTheme();
  
  return (
    <Box 
      component={List} 
      dense 
      disablePadding
      sx={{ 
        maxHeight: 200, 
        overflowY: 'auto',
        mb: 1,
        width: 250,
        zIndex: 1500,
        bgcolor: theme.palette.background.paper,
        borderRadius: 1,
        boxShadow: theme.shadows[3]
      }}
    >
      {availableAgents.map((agent) => (
        <ListItem 
          key={agent.id} 
          disablePadding
          button
          onClick={() => onSelect(agent)}
          sx={{
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? alpha('#2D2B55', 0.3) : alpha('#F0E7FF', 0.3),
            }
          }}
        >
          <ListItemButton dense>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PsychologyIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={agent.name} 
              secondary={agent.nickName}
              primaryTypographyProps={{ fontSize: '0.95rem' }}
              secondaryTypographyProps={{ fontSize: '0.8rem' }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </Box>
  );
};

// Componente per il Popper degli @mentions
export const MentionPopper = ({ open, anchorEl, availableAgents, onSelect }) => {
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top-start"
      sx={{ zIndex: 1500 }}
    >
      <AgentMentionSelector 
        availableAgents={availableAgents} 
        onSelect={onSelect} 
      />
    </Popper>
  );
};