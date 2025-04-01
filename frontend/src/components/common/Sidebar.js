// valis/src/components/common/Sidebar.js
import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  IconButton, 
  Box, 
  Divider, 
  Avatar,
  useTheme,
  alpha,
  Chip,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HubIcon from '@mui/icons-material/Hub';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AssistantIcon from '@mui/icons-material/Assistant';
import UpdateIcon from '@mui/icons-material/Update';

// Drawer width
const drawerWidth = 280;

function Sidebar({ open, onClose, activeSection = 'dashboard', onSectionChange }) {
  const theme = useTheme();
  
  // Simplified sections as requested
  const sections = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: <DashboardIcon /> 
    },
    { 
      id: 'multiagente', 
      name: 'Multiagente', 
      icon: <HubIcon />,
      isNew: true
    },
    { 
      id: 'ali', 
      name: 'ALI', 
      icon: <RocketLaunchIcon /> 
    },
    { 
      id: 'agenti', 
      name: 'Agenti', 
      icon: <PsychologyAltIcon /> 
    },
    { 
      id: 'clienti', 
      name: 'Clienti', 
      icon: <PeopleIcon /> 
    },
    { 
      id: 'impostazioni', 
      name: 'Impostazioni', 
      icon: <SettingsIcon /> 
    }
  ];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(180deg, ${alpha('#1A1A2E', 0.98)} 0%, ${alpha('#121212', 0.98)} 100%)`
            : `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          boxShadow: theme.palette.mode === 'dark'
            ? '1px 0 15px rgba(157, 92, 255, 0.2)'
            : '1px 0 15px rgba(103, 58, 183, 0.1)',
        },
      }}
    >
      {/* Header with logo and close button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 2,
        mb: 1
      }}>
        <Typography
          variant="h5"
          fontFamily="Montserrat, sans-serif"
          fontWeight={700}
          letterSpacing="1.2px"
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #C4A1FF 30%, #9D5CFF 90%)'
              : 'linear-gradient(45deg, #5D3FD3 30%, #6200EE 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: theme.palette.mode === 'dark'
              ? '0px 2px 4px rgba(0, 0, 0, 0.5)'
              : '0px 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          VALIS
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1)
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* User profile section */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        p: 2,
        pt: 0,
        mb: 1
      }}>
        <Avatar 
          sx={{
            width: 60,
            height: 60,
            border: `2px solid ${theme.palette.primary.main}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 0 10px rgba(156, 100, 255, 0.4)'
              : '0 0 10px rgba(103, 58, 183, 0.2)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #9D5CFF 0%, #4A2B8C 100%)'
              : 'linear-gradient(135deg, #9575cd 0%, #673ab7 100%)',
          }}
        >
          AL
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
          Avv. Antonio Legale
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Studio Legale Associato
        </Typography>
        <Chip
          size="small"
          label="Piano Premium"
          icon={<AssistantIcon fontSize="small" sx={{ fontSize: '0.75rem !important' }} />}
          sx={{ 
            mt: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            color: theme.palette.primary.main,
            fontWeight: 500,
            '& .MuiChip-icon': {
              color: theme.palette.primary.main
            }
          }}
        />
      </Box>
      
      <Divider sx={{ mx: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
      
      {/* Navigation list */}
      <List sx={{ px: 2, py: 1 }}>
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <ListItem key={section.id} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  if (onSectionChange) onSectionChange(section.id);
                }}
                sx={{
                  borderRadius: 2,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.15) 
                      : alpha(theme.palette.primary.main, 0.1),
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      backgroundColor: theme.palette.primary.main,
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                    }
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.1) 
                      : alpha(theme.palette.primary.main, 0.06),
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive 
                      ? theme.palette.primary.main 
                      : theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.primary.light, 0.7)
                        : theme.palette.text.secondary,
                    minWidth: 40,
                    transition: 'color 0.2s ease'
                  }}
                >
                  {section.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {section.name}
                      {section.isNew && (
                        <Tooltip title="Nuova funzionalità">
                          <Chip
                            size="small"
                            label="Nuovo"
                            icon={<UpdateIcon sx={{ fontSize: '0.625rem !important' }} />}
                            sx={{
                              ml: 1,
                              height: 20,
                              fontSize: '0.625rem',
                              backgroundColor: theme.palette.secondary.main,
                              color: theme.palette.secondary.contrastText,
                              '& .MuiChip-icon': {
                                color: 'inherit'
                              }
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive 
                      ? theme.palette.primary.main
                      : 'inherit',
                    transition: 'font-weight 0.2s ease',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* System status */}
      <Box 
        sx={{
          mx: 2,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.primary.main, 0.05)
            : alpha(theme.palette.primary.main, 0.03),
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.08)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box 
            sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%',
              backgroundColor: theme.palette.success.main,
              boxShadow: `0 0 8px ${theme.palette.success.main}`,
              mr: 1 
            }} 
          />
          <Typography variant="caption" color="textSecondary" fontWeight="medium">
            Sistema attivo e operativo
          </Typography>
        </Box>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
          Ultimo aggiornamento: 14 Giugno 2023
        </Typography>
      </Box>
      
      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Valis by Lexygraph AI
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} - Tutti i diritti riservati
        </Typography>
      </Box>
    </Drawer>
  );
}

export default Sidebar;


TOPO merda