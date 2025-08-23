import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Container,
  Fade,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Import shared components
import ValisLogo from '../components/ValisLogo';
import { HeaderActionButton, DynamicStartButton } from '../components/Buttons';
import { DashboardBackground, PageHeader } from '../components/Layout';
import { PageTransition, CircleExpand } from '../components/Transitions';
import { TypingEffect } from '../components/Animations';

function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState({
    x: '50%',
    y: '50%',
  });

  // Usa valori di default sicuri nel caso in cui auth non sia ancora disponibile
  const auth = useAuth() || { user: null, signOut: () => {} };
  const user = auth.user;
  const signOut = auth.signOut;

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Funzione per gestire il logout con Supabase
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Errore durante il logout:', error);
      navigate('/login');
    }
  };

  // Get greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return 'Ciao, nottambulo';
    if (hour >= 5 && hour < 7) return 'Ciao, mattiniero';
    if (hour >= 7 && hour < 12) return 'Buongiorno';
    if (hour >= 12 && hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  // Generate welcome messages based on time, including user name from Supabase if available
  const welcomeMessages = [
    `${getTimeBasedGreeting()}${user?.user_metadata?.name ? ', ' + user.user_metadata.name : ''}, benvenuto su VALIS`,
    'Il tuo assistente legale intelligente',
    'Sistema esperto per il tuo studio legale',
    'Potenzia la tua pratica legale con VALIS',
  ];

  // Handler for navigation to projects con transizione
  const handleNavigateToProjects = (e) => {
    if (e && e.clientX && e.clientY) {
      setTransitionOrigin({
        x: `${e.clientX}px`,
        y: `${e.clientY}px`,
      });
    }

    setTransitioning(true);

    setTimeout(() => {
      navigate('/projects');
    }, 800);
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToGuide = () => {
    navigate('/guida');
  };

  return (
    <DashboardBackground transitioning={transitioning}>
      {/* Componente di transizione pagina */}
      <PageTransition active={transitioning}>
        <CircleExpand
          active={transitioning}
          originX={transitionOrigin.x}
          originY={transitionOrigin.y}
        />
      </PageTransition>

      {/* Header con Logo e Controlli */}
      <PageHeader>
        <ValisLogo />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Gestisci Progetti" arrow>
            <HeaderActionButton onClick={handleNavigateToProjects}>
              <FolderOpenIcon />
            </HeaderActionButton>
          </Tooltip>
          <Tooltip title="Guida" arrow>
            <HeaderActionButton onClick={handleNavigateToGuide}>
              <HelpIcon />
            </HeaderActionButton>
          </Tooltip>
          <Tooltip title="Profilo" arrow>
            <HeaderActionButton onClick={handleNavigateToProfile}>
              <PersonIcon />
            </HeaderActionButton>
          </Tooltip>
          <Tooltip title="Logout" arrow>
            <HeaderActionButton onClick={handleLogout}>
              <LogoutIcon />
            </HeaderActionButton>
          </Tooltip>
        </Box>
      </PageHeader>

      {/* Main content */}
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 2,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          ...(transitioning && {
            animation:
              'contentExit 0.8s forwards cubic-bezier(0.19, 1, 0.22, 1)',
            '@keyframes contentExit': {
              '0%': {
                opacity: 1,
                transform: 'scale(1)',
              },
              '100%': {
                opacity: 0,
                transform: 'scale(0.95)',
              },
            },
          }),
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Fade in={!transitioning} timeout={1000}>
            <Box
              sx={{
                mb: 6, // Reduced from 8
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '800px', // Reduced from 900px
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' }, // Reduced from larger sizes
                  color:
                    theme.palette.mode === 'dark'
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  padding: '0 20px',
                  background:
                    theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                      : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow:
                    theme.palette.mode === 'dark'
                      ? '0 5px 30px rgba(179, 136, 255, 0.5)'
                      : '0 5px 30px rgba(124, 77, 255, 0.3)',
                }}
              >
                <TypingEffect messages={welcomeMessages} />
              </Typography>
            </Box>
          </Fade>

          <Fade in={!transitioning} timeout={1500}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                my: 3, // Reduced from 4
                position: 'relative',
              }}
            >
              <DynamicStartButton
                onClick={handleNavigateToProjects}
                isTransitioning={transitioning}
              />
            </Box>
          </Fade>
        </Box>
      </Container>
    </DashboardBackground>
  );
}

export default Dashboard;
