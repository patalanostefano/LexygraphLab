import { alpha, styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Paper,
  Drawer,
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';

// Quadrante stilizzato
export const Quadrant = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha('#1C1C3C', 0.8)
      : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.2)'
      : '0 8px 24px rgba(124, 77, 255, 0.08)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
}));

// Stile per il titolo del quadrante
export const QuadrantTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

// Card del progetto
export const ProjectCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 16,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha('#1C1C3C', 0.8)
      : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.2)'
      : '0 8px 24px rgba(124, 77, 255, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 28px rgba(0, 0, 0, 0.3)'
        : '0 12px 28px rgba(124, 77, 255, 0.12)',
  },
  cursor: 'pointer',
}));

// Input Box per il prompt
export const PromptInputBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderRadius: 12,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha('#1C1C3C', 0.9)
      : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(0, 0, 0, 0.2)'
      : '0 4px 12px rgba(124, 77, 255, 0.08)',
  width: '100%',
}));

// Chip Agente - VERSIONE PIÙ COMPATTA
export const AgentChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25), // Ridotto margin
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.main, 0.3)
      : alpha(theme.palette.primary.main, 0.2)
  }`,
  padding: '2px 0', // Ridotto padding verticale
  height: '28px', // Ridotta altezza
  '& .MuiChip-label': {
    fontSize: '0.85rem', // Ridotto font size
    padding: '0 8px', // Ridotto padding orizzontale
  },
  '& .MuiChip-deleteIcon': {
    width: '16px', // Icona di eliminazione più piccola
    height: '16px',
    margin: '0 4px 0 -4px', // Margini ridotti
    color:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.primary.light, 0.7)
        : theme.palette.primary.main,
    '&:hover': {
      color:
        theme.palette.mode === 'dark'
          ? theme.palette.primary.light
          : theme.palette.primary.dark,
    },
  },
}));

// Badge di attività
export const ActivityBadge = styled(Box)(({ theme, status }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  borderRadius: 12,
  fontSize: '0.75rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  width: 'fit-content',
  backgroundColor:
    status === 'thinking'
      ? alpha(theme.palette.warning.main, 0.15)
      : status === 'viewing'
        ? alpha(theme.palette.info.main, 0.15)
        : status === 'editing'
          ? alpha(theme.palette.success.main, 0.15)
          : status === 'browsing'
            ? alpha(theme.palette.info.main, 0.15)
            : alpha(theme.palette.primary.main, 0.15),
  color:
    status === 'thinking'
      ? theme.palette.warning.main
      : status === 'viewing'
        ? theme.palette.info.main
        : status === 'editing'
          ? theme.palette.success.main
          : status === 'browsing'
            ? theme.palette.info.main
            : theme.palette.primary.main,
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
}));

// Stile per il drawer di upload documenti
export const DocumentDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320,
    padding: theme.spacing(2),
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha('#1C1C3C', 0.95)
        : alpha('#FFFFFF', 0.95),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 8px 24px rgba(0, 0, 0, 0.3)'
        : '0 8px 24px rgba(124, 77, 255, 0.1)',
  },
}));

// Logo Multiagente Professionale
export const MultiagentLogo = ({ theme }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}
  >
    <Box sx={{ position: 'relative', mr: 2 }}>
      <HubIcon
        sx={{
          fontSize: 36,
          color: theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF',
          filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.3)})`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -3,
          right: -3,
          width: 12,
          height: 12,
          bgcolor: '#00BFA5',
          borderRadius: '50%',
          border: `2px solid ${theme.palette.background.paper}`,
        }}
      />
    </Box>

    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(to right, #9A7CFF, #00BFA5)'
              : 'linear-gradient(to right, #7C4DFF, #00BFA5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: -0.5,
        }}
      >
        Multiagente
      </Typography>
      <Typography
        variant="caption"
        sx={{
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: theme.palette.text.secondary,
        }}
      >
        Sistema Multiagente Legale
      </Typography>
    </Box>
  </Box>
);
