import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
  Paper,
  Collapse,
  Divider,
  ListItemIcon,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fade,
  Chip,
  Avatar,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TerminalIcon from '@mui/icons-material/Terminal';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestoreIcon from '@mui/icons-material/Restore';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import PersonIcon from '@mui/icons-material/Person';
import { alpha } from '@mui/material/styles';

/**
 * Pannello Lexychain espandibile: cronologia completa delle attività
 * Versione aggiornata con supporto per attività di agenti
 */
export default function LexychainPanel({
  activities = [],
  onRestore = () => {},
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Mappa status => icona
  const getStatusIcon = (status) => {
    switch (status) {
      case 'thinking':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'viewing':
        return <InfoIcon color="info" fontSize="small" />;
      case 'editing':
        return <EditIcon color="primary" fontSize="small" />;
      case 'browsing':
        return <CheckCircleIcon color="success" fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  // Verifica se un'attività è ripristinabile (solo editing)
  const isRestorableActivity = (activity) => {
    return (
      activity.status === 'editing' && activity.documentId && activity.version
    );
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleRestoreClick = (activity) => {
    if (!isRestorableActivity(activity)) return;

    setSelectedActivity(activity);
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmRestore = () => {
    if (selectedActivity) {
      onRestore(selectedActivity);
    }
    setIsRestoreDialogOpen(false);
  };

  // Ottiene il colore dell'agente per le attività
  const getAgentColor = (agent) => {
    if (!agent) return '#7C4DFF'; // Default color

    // Se l'agente ha un colore definito, usalo
    if (agent.color) return agent.color;

    // Altrimenti, mappa in base al nome o al ruolo
    const name = (agent.name || '').toLowerCase();
    if (name.includes('assistente')) return '#7C4DFF';
    if (name.includes('ricercatore')) return '#2196F3';
    if (name.includes('redattore')) return '#F44336';
    if (name.includes('estrattore')) return '#00A86B';

    return '#7C4DFF'; // Colore di default
  };

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          mt: 1,
          backgroundColor: 'background.paper',
          minHeight: expanded ? '200px' : 'auto',
          maxHeight: expanded ? '40vh' : 'auto',
          transition: 'all 0.3s ease-in-out',
          boxShadow: expanded
            ? '0 4px 12px rgba(0,0,0,0.1)'
            : '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Box
          sx={{
            p: 1.2,
            borderBottom: expanded ? '1px solid' : 'none',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: expanded
              ? (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.1)'
                    : 'rgba(0,0,0,0.02)'
              : 'transparent',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(0,0,0,0.15)'
                  : 'rgba(0,0,0,0.04)',
            },
            transition: 'background-color 0.2s ease',
          }}
          onClick={handleToggleExpanded}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Lexychain - Cronologia
            </Typography>
            {!expanded && activities.length > 0 && (
              <Chip
                label={activities.length}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
              />
            )}
          </Box>

          <Fade in={true}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpanded();
              }}
              aria-expanded={expanded}
              aria-label="Espandi Lexychain"
              sx={{
                transition: 'transform 0.3s ease',
                transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            >
              {expanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Fade>
        </Box>

        <Collapse in={expanded} collapsedSize={0}>
          <Box
            sx={{
              maxHeight: '40vh',
              overflowY: 'auto',
              p: 0,
              display: 'block',
            }}
          >
            {activities.length > 0 ? (
              <List dense disablePadding>
                {activities.map((act, idx) => (
                  <React.Fragment key={idx}>
                    <ListItemButton
                      sx={{
                        px: 2,
                        py: 1,
                        '&:hover': {
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.03)',
                        },
                        cursor: isRestorableActivity(act)
                          ? 'pointer'
                          : 'default',
                        borderLeft: act.agent
                          ? `3px solid ${getAgentColor(act.agent)}`
                          : 'none',
                      }}
                      onClick={() => handleRestoreClick(act)}
                      disabled={!isRestorableActivity(act)}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {act.agent ? (
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: alpha(getAgentColor(act.agent), 0.2),
                              color: getAgentColor(act.agent),
                              fontSize: '0.75rem',
                              border: `1px solid ${alpha(getAgentColor(act.agent), 0.5)}`,
                            }}
                          >
                            {act.agent.name ? (
                              act.agent.name.charAt(0).toUpperCase()
                            ) : (
                              <PersonIcon fontSize="small" />
                            )}
                          </Avatar>
                        ) : (
                          getStatusIcon(act.status)
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={act.description}
                        secondary={act.timestamp}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                          sx: act.agent
                            ? {
                                color: alpha(getAgentColor(act.agent), 0.9),
                              }
                            : {},
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary',
                        }}
                      />
                      {isRestorableActivity(act) && (
                        <Tooltip title="Ripristina versione">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                              variant="caption"
                              color="primary.main"
                              sx={{ mr: 0.5, fontWeight: 500 }}
                            >
                              Ripristina
                            </Typography>
                            <RestoreIcon
                              fontSize="small"
                              color="primary"
                              sx={{ opacity: 0.8 }}
                            />
                          </Box>
                        </Tooltip>
                      )}
                    </ListItemButton>
                    {idx < activities.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nessuna attività registrata
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>

        {!expanded && activities.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              borderLeft: activities[0].agent
                ? `3px solid ${getAgentColor(activities[0].agent)}`
                : 'none',
            }}
            onClick={handleToggleExpanded}
          >
            {activities[0].agent ? (
              <Avatar
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: alpha(getAgentColor(activities[0].agent), 0.2),
                  color: getAgentColor(activities[0].agent),
                  fontSize: '0.6rem',
                  marginRight: 1,
                  border: `1px solid ${alpha(getAgentColor(activities[0].agent), 0.5)}`,
                }}
              >
                {activities[0].agent.name ? (
                  activities[0].agent.name.charAt(0).toUpperCase()
                ) : (
                  <PersonIcon fontSize="small" />
                )}
              </Avatar>
            ) : (
              getStatusIcon(activities[0].status)
            )}
            <Typography
              variant="body2"
              sx={{
                ml: activities[0].agent ? 0 : 1,
                color: activities[0].agent
                  ? alpha(getAgentColor(activities[0].agent), 0.9)
                  : 'text.primary',
                fontWeight: 500,
                flex: 1,
              }}
            >
              {activities[0].description}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {activities[0].timestamp}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dialog per conferma ripristino */}
      <Dialog
        open={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Ripristina versione</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <FileIcon color="primary" sx={{ mr: 1.5, mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle1">
                {selectedActivity?.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedActivity?.timestamp}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2">
            Vuoi ripristinare questa versione del documento? Qualsiasi modifica
            non salvata andrà persa.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRestoreDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={handleConfirmRestore}
            color="primary"
            variant="contained"
            startIcon={<RestoreIcon />}
          >
            Ripristina
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
