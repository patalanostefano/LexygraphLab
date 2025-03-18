// src/components/common/Header.js - Versione avanzata
import React, { useContext, useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  useTheme, 
  Menu, 
  MenuItem, 
  Avatar, 
  Badge, 
  Tooltip,
  ListItemIcon,
  Divider,
  Fade
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';
import { ThemeContext } from '../../context/ThemeContext';
import styled from 'styled-components';

const LogoText = styled(Typography)`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  letter-spacing: 1.2px;
  background: ${props => props.theme.palette.mode === 'dark' 
    ? 'linear-gradient(45deg, #e3f2fd 30%, #90caf9 90%)'
    : 'linear-gradient(45deg, #1a237e 30%, #3949ab 90%)'};
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: ${props => props.theme.palette.mode === 'dark' 
    ? '0px 2px 4px rgba(0, 0, 0, 0.5)'
    : '0px 2px 4px rgba(0, 0, 0, 0.2)'};
`;

function Header() {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ThemeContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationEl, setNotificationEl] = useState(null);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationEl(event.currentTarget);
  };
  
  const handleNotificationMenuClose = () => {
    setNotificationEl(null);
  };

  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <img src="/logo.svg" alt="Valis Logo" height="40" />
          <LogoText variant="h5" sx={{ ml: 1 }} theme={theme}>
            VALIS
          </LogoText>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              ml: 1, 
              opacity: 0.8,
              display: { xs: 'none', sm: 'block' } 
            }}
          >
            by Lexygraph AI
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center">
          <Tooltip title="Notifiche">
            <IconButton 
              color="inherit"
              onClick={handleNotificationMenuOpen}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title={theme.palette.mode === 'dark' ? 'Modalità chiara' : 'Modalità scura'}>
            <IconButton onClick={toggleColorMode} color="inherit" sx={{ ml: 1 }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton 
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.primary.main
                }}
              >
                <AccountCircleIcon fontSize="small" />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Menu del profilo */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">Nome Utente</Typography>
          <Typography variant="body2" color="text.secondary">studio.legale@esempio.it</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profilo
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Impostazioni
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          Aiuto
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Esci
        </MenuItem>
      </Menu>
      
      {/* Menu notifiche */}
      <Menu
        anchorEl={notificationEl}
        open={Boolean(notificationEl)}
        onClose={handleNotificationMenuClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            width: 320,
            borderRadius: 2,
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifiche</Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            Segna tutte come lette
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationMenuClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" fontWeight="bold">Nuovo documento condiviso</Typography>
            <Typography variant="body2" color="text.secondary">
              L'avv. Rossi ha condiviso un nuovo documento
            </Typography>
            <Typography variant="caption" color="text.secondary">2 minuti fa</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" fontWeight="bold">Analisi documentale completata</Typography>
            <Typography variant="body2" color="text.secondary">
              L'analisi del documento "Contratto.pdf" è completata
            </Typography>
            <Typography variant="caption" color="text.secondary">45 minuti fa</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" fontWeight="bold">Aggiornamento sistema</Typography>
            <Typography variant="body2" color="text.secondary">
              Nuove funzionalità disponibili nella piattaforma
            </Typography>
            <Typography variant="caption" color="text.secondary">2 ore fa</Typography>
          </Box>
        </MenuItem>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            Visualizza tutte le notifiche
          </Typography>
        </Box>
      </Menu>
    </AppBar>
  );
}

export default Header;
