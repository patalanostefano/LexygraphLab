// valis/src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Grid,
  useMediaQuery,
  alpha,
  IconButton,
  Tooltip,
  Container,
  Paper,
  Fade,
  Grow
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HubIcon from '@mui/icons-material/Hub';
import SearchIcon from '@mui/icons-material/Search';
import HelpIcon from '@mui/icons-material/Help';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Logo VALIS esattamente come nell'immagine con effetti hover animati
const ValisLogo = ({ theme }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    position: 'relative',
    cursor: 'pointer',
    '&:hover .valis-dot': {
      transform: 'scale(1.5)',
      boxShadow: `0 0 12px ${theme.palette.primary.main}`,
    },
    '&:hover .valis-line': {
      width: '100%',
      boxShadow: `0 0 8px ${theme.palette.primary.main}`,
    }
  }}>
    {/* Punto viola in alto a destra del logo */}
    <Box 
      className="valis-dot"
      sx={{ 
        position: 'absolute', 
        width: 6, 
        height: 6, 
        borderRadius: '50%', 
        bgcolor: '#9A7CFF', 
        right: -6, 
        top: 0,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      }} 
    />
    
    {/* Punto viola in basso a sinistra del logo */}
    <Box 
      className="valis-dot"
      sx={{ 
        position: 'absolute', 
        width: 6, 
        height: 6, 
        borderRadius: '50%', 
        bgcolor: '#9A7CFF', 
        left: -6, 
        bottom: 8,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      }} 
    />
    
    {/* Logo text */}
    <Typography
      variant="h3"
      fontFamily="'Times New Roman', Times, serif"
      fontWeight={600}
      letterSpacing="0.02em"
      sx={{
        color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
        fontSize: '2.5rem',
        position: 'relative',
      }}
    >
      VALIS
    </Typography>
    
    {/* Linea decorativa sotto il logo - si allunga al passaggio del mouse */}
    <Box 
      className="valis-line"
      sx={{ 
        position: 'absolute', 
        height: 2.5, 
        width: '20%', 
        bgcolor: '#9A7CFF', 
        left: 0, 
        bottom: -4,
        borderRadius: 3,
        transition: 'all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      }} 
    />
  </Box>
);

// Header Action Button - Dimensione aumentata
const HeaderActionButton = styled(IconButton)(({ theme }) => ({
  width: 46, // Aumentato da 40
  height: 46, // Aumentato da 40
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#FFFFFF', 0.8),
  backdropFilter: 'blur(8px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.1) : alpha('#7C4DFF', 0.1)}`,
  borderRadius: 12,
  transition: 'all 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.9) : alpha('#FFFFFF', 1),
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(154, 124, 255, 0.2)' 
      : '0 6px 12px rgba(124, 77, 255, 0.12), 0 0 0 1px rgba(124, 77, 255, 0.1)',
  },
  '&:active': {
    transform: 'translateY(-1px) scale(0.97)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 3px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(154, 124, 255, 0.15)' 
      : '0 3px 8px rgba(124, 77, 255, 0.08), 0 0 0 1px rgba(124, 77, 255, 0.05)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 22, // Aumentato da 20
    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
    transition: 'transform 0.2s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
  }
}));

// Enhanced typing effect with longer durations and smoother transitions
const TypingEffect = ({ messages, typingSpeed = 40, deleteSpeed = 20, delayAfterType = 7000 }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const currentMessage = messages[currentIndex];
    
    if (isWaiting) {
      const waitTimer = setTimeout(() => {
        setIsWaiting(false);
        setIsDeleting(true);
      }, delayAfterType);
      return () => clearTimeout(waitTimer);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentIndex((currentIndex + 1) % messages.length);
      return;
    }

    if (!isDeleting && displayText === currentMessage) {
      setIsWaiting(true);
      return;
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(prev => prev.substring(0, prev.length - 1));
      } else {
        setDisplayText(currentMessage.substring(0, displayText.length + 1));
      }
    }, isDeleting ? deleteSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex, messages, typingSpeed, deleteSpeed, delayAfterType, isWaiting]);

  return <span>{displayText}</span>;
};

// Feature Card - Advanced 3D Design
const FeatureCard = styled(Paper)(({ theme, bgColor, focusColor }) => ({
  height: '100%',
  width: '100%',
  maxWidth: 380,
  minHeight: 480,
  padding: 0,
  overflow: 'hidden',
  borderRadius: 20,
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.8) : alpha('#FFFFFF', 0.95),
  position: 'relative',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(154, 124, 255, 0.1)' 
    : '0 20px 40px rgba(124, 77, 255, 0.15), 0 0 0 1px rgba(124, 77, 255, 0.1)',
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
  transition: 'all 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
  transformStyle: 'preserve-3d',
  willChange: 'transform, box-shadow',
  '&:hover': {
    transform: 'perspective(1000px) rotateX(2deg) translateY(-10px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? `0 30px 60px rgba(0, 0, 0, 0.4), 0 0 30px ${alpha(focusColor || theme.palette.primary.main, 0.4)}` 
      : `0 30px 60px rgba(124, 77, 255, 0.2), 0 0 30px ${alpha(focusColor || theme.palette.primary.main, 0.3)}`,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: theme.palette.mode === 'dark' 
      ? `linear-gradient(135deg, ${alpha(bgColor || '#7C4DFF', 0.3)} 0%, transparent 100%)` 
      : `linear-gradient(135deg, ${alpha(bgColor || '#7C4DFF', 0.2)} 0%, transparent 100%)`,
    zIndex: 0,
  },
}));

// Card Content Wrapper
const CardContent = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
}));

// Card Icon Wrapper
const CardIconWrapper = styled(Box)(({ theme, color }) => ({
  width: 70,
  height: 70,
  borderRadius: '50%',
  backgroundColor: alpha(color || theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    border: `2px solid ${alpha(color || theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
    borderRadius: '50%',
    opacity: 0.7,
  },
  '& svg': {
    fontSize: 32,
    color: color || theme.palette.primary.main,
    filter: `drop-shadow(0 4px 6px ${alpha(color || theme.palette.primary.main, 0.4)})`,
  }
}));

// Card Background Decoration
const CardDecoration = styled(Box)(({ theme, color }) => ({
  position: 'absolute',
  right: -80,
  bottom: -80,
  width: 300,
  height: 300,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${alpha(color || theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
  zIndex: 0,
}));

// Card Shiny Element
const CardShine = styled(Box)(({ theme, color }) => ({
  position: 'absolute',
  top: 20,
  right: 20,
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color || theme.palette.primary.main} 0%, transparent 70%)`,
  opacity: 0.6,
  filter: `blur(5px)`,
  zIndex: 1,
}));

// LexyAgent Card Component
const LexyAgentCard = ({ theme, onNavigate }) => {
  return (
    <FeatureCard bgColor="#7C4DFF" focusColor="#7C4DFF">
      <CardDecoration color="#7C4DFF" />
      <CardShine color="#7C4DFF" />
      <CardContent>
        <CardIconWrapper color="#7C4DFF">
          <HubIcon />
        </CardIconWrapper>
        <Typography 
          variant="h3" 
          component="h2" 
          sx={{ 
            fontWeight: 700,
            marginBottom: 2,
            background: 'linear-gradient(135deg, #9A7CFF 0%, #7356E5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(154, 124, 255, 0.4)' : 'none'
          }}
        >
          LexyAgent
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500,
            marginBottom: 1,
            color: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.light, 0.9) : theme.palette.primary.dark
          }}
        >
          Sistema Multiagente Legale
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4,
            color: theme.palette.text.secondary,
            lineHeight: 1.6
          }}
        >
          Analizza documenti legali complessi con un sistema avanzato di assistenti AI specializzati nella giurisprudenza italiana ed europea.
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="contained"
          size="large"
          onClick={onNavigate}
          sx={{ 
            py: 1.5,
            background: 'linear-gradient(90deg, #9A7CFF 0%, #7356E5 100%)',
            boxShadow: '0 8px 16px rgba(124, 77, 255, 0.25)',
            '&:hover': {
              boxShadow: '0 12px 20px rgba(124, 77, 255, 0.35)',
            }
          }}
        >
          Accedi a LexyAgent
        </Button>
      </CardContent>
    </FeatureCard>
  );
};

// ALI Card Component
const ALICard = ({ theme, onNavigate }) => {
  return (
    <FeatureCard bgColor="#00BFA5" focusColor="#00BFA5">
      <CardDecoration color="#00BFA5" />
      <CardShine color="#00BFA5" />
      <CardContent>
        <CardIconWrapper color="#00BFA5">
          <SearchIcon />
        </CardIconWrapper>
        <Typography 
          variant="h3" 
          component="h2" 
          sx={{ 
            fontWeight: 700,
            marginBottom: 2,
            background: 'linear-gradient(135deg, #5EFFEE 0%, #00BFA5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 191, 165, 0.4)' : 'none'
          }}
        >
          ALI
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500,
            marginBottom: 1,
            color: theme.palette.mode === 'dark' ? alpha(theme.palette.secondary.light, 0.9) : theme.palette.secondary.dark
          }}
        >
          Assistente Legale Intelligente
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4,
            color: theme.palette.text.secondary,
            lineHeight: 1.6
          }}
        >
          Ricerca avanzata su database giuridici, identificazione di precedenti e generazione di riassunti caso-specifici per la tua attività legale.
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="contained"
          size="large"
          onClick={onNavigate}
          sx={{ 
            py: 1.5,
            background: 'linear-gradient(90deg, #03DAC5 0%, #00BFA5 100%)',
            color: '#000000',
            boxShadow: '0 8px 16px rgba(0, 191, 165, 0.25)',
            '&:hover': {
              boxShadow: '0 12px 20px rgba(0, 191, 165, 0.35)',
            }
          }}
        >
          Accedi ad ALI
        </Button>
      </CardContent>
    </FeatureCard>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  
  // Usa valori di default sicuri nel caso in cui auth non sia ancora disponibile
  const auth = useAuth() || { user: null, signOut: () => {} };
  const user = auth.user;
  const signOut = auth.signOut;
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Funzione per gestire il logout con Supabase
  const handleLogout = async () => {
    try {
      // Usa il metodo legacy per retrocompatibilità
      if (typeof window !== 'undefined') {
        localStorage.removeItem('testUser');
      }
      
      // Usa il nuovo metodo Supabase
      if (signOut) {
        await signOut();
      }
      
      // Fallback se tutto fallisce
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
      // Fallback di sicurezza
      navigate('/login');
    }
  };
  
  // Get greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buongiorno";
    if (hour >= 12 && hour < 18) return "Buon pomeriggio";
    return "Buonasera";
  };

  // Generate welcome messages based on time, including user name from Supabase if available
  const welcomeMessages = [
    `${getTimeBasedGreeting()}${user?.user_metadata?.name ? ', ' + user.user_metadata.name : ''}, benvenuto su VALIS`,
    "Il tuo assistente legale intelligente",
    "Sistema esperto per il tuo studio legale",
    "Potenzia la tua pratica legale con VALIS"
  ];

  // Handler for navigation
  const handleNavigateToMultiagent = () => {
    navigate('/multiagente');
  };

  const handleNavigateToAli = () => {
    navigate('/ali');
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToGuide = () => {
    navigate('/guida');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      background: theme.palette.mode === 'dark' 
        ? `radial-gradient(circle at 0% 20%, ${alpha('#2D2B55', 0.7)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#28284D', 0.7)} 0%, transparent 30%),
           ${theme.palette.background.default}`
        : `radial-gradient(circle at 0% 20%, ${alpha('#F0E7FF', 0.5)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#EDF5FF', 0.5)} 0%, transparent 30%),
           ${theme.palette.background.default}`,
      backgroundAttachment: 'fixed',
      position: 'relative',
      transition: 'background 0.5s ease-in-out',
    }}>
      {/* Background particle pattern */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        pointerEvents: 'none', 
        zIndex: 0, 
        opacity: 0.4, 
        backgroundImage: theme.palette.mode === 'dark' 
          ? 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
          : 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23B39DDB\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
      }} />
      
      {/* Header con Logo e Controlli */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <ValisLogo theme={theme} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
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
      </Box>
      
      {/* Main content */}
      <Container maxWidth="lg" sx={{ 
        position: 'relative', 
        zIndex: 2, 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box component="main" sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}>
          {/* Welcome message - Enhanced typing effect */}
          <Fade in={true} timeout={1000}>
            <Box sx={{ 
              mb: 8, 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '900px'
            }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  padding: '0 20px',
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 5px 30px rgba(179, 136, 255, 0.5)'
                    : '0 5px 30px rgba(124, 77, 255, 0.3)',
                }}
              >
                <TypingEffect messages={welcomeMessages} />
              </Typography>
            </Box>
          </Fade>

          {/* Feature Cards in Hexagonal Layout */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 4, md: 10 },
            maxWidth: '1200px',
            position: 'relative'
          }}>
            {/* LexyAgent Card */}
            <Grow in={true} timeout={800} style={{ transformOrigin: '0 0 0' }} {...{ timeout: 1000 }}>
              <Box>
                <LexyAgentCard theme={theme} onNavigate={handleNavigateToMultiagent} />
              </Box>
            </Grow>
            
            {/* ALI Card */}
            <Grow in={true} timeout={800} style={{ transformOrigin: '0 0 0' }} {...{ timeout: 1300 }}>
              <Box>
                <ALICard theme={theme} onNavigate={handleNavigateToAli} />
              </Box>
            </Grow>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;