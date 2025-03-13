// src/components/multiagent/Multiagent.js
import React, { useState, useEffect, useContext, useRef } from 'react';
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
  TextField,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  MenuItem,
  Menu,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Stack,
  InputAdornment,
  Drawer,
  Collapse,
  Popper,
  Paper as MuiPaper,
  ClickAwayListener
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PsychologyIcon from '@mui/icons-material/Psychology';
import HubIcon from '@mui/icons-material/Hub';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GavelIcon from '@mui/icons-material/Gavel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TerminalIcon from '@mui/icons-material/Terminal';
import ThinkingIcon from '@mui/icons-material/Psychology';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BalanceIcon from '@mui/icons-material/Balance';
import GroupsIcon from '@mui/icons-material/Groups';
import { ThemeContext } from '../../context/ThemeContext';

// Quadrante stilizzato
const Quadrant = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.8) : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 8px 24px rgba(0, 0, 0, 0.2)' 
    : '0 8px 24px rgba(124, 77, 255, 0.08)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
}));

// Stile per il titolo del quadrante
const QuadrantTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  }
}));

// Card del progetto
const ProjectCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 16,
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.8) : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 8px 24px rgba(0, 0, 0, 0.2)' 
    : '0 8px 24px rgba(124, 77, 255, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 12px 28px rgba(0, 0, 0, 0.3)' 
      : '0 12px 28px rgba(124, 77, 255, 0.12)',
  },
  cursor: 'pointer',
}));

// Input Box per il prompt
const PromptInputBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.9) : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 12px rgba(0, 0, 0, 0.2)' 
    : '0 4px 12px rgba(124, 77, 255, 0.08)',
  width: '100%',
}));

// Chip Agente
const AgentChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.primary.main, 0.2) 
    : alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? alpha(theme.palette.primary.main, 0.3) 
    : alpha(theme.palette.primary.main, 0.2)}`,
  '& .MuiChip-deleteIcon': {
    color: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.primary.light, 0.7) 
      : theme.palette.primary.main,
    '&:hover': {
      color: theme.palette.mode === 'dark' 
        ? theme.palette.primary.light 
        : theme.palette.primary.dark,
    }
  }
}));

// Badge di attività
const ActivityBadge = styled(Box)(({ theme, status }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  borderRadius: 12,
  fontSize: '0.75rem',
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  width: 'fit-content',
  backgroundColor: 
    status === 'thinking' ? alpha(theme.palette.warning.main, 0.15) :
    status === 'viewing' ? alpha(theme.palette.info.main, 0.15) :
    status === 'editing' ? alpha(theme.palette.success.main, 0.15) :
    status === 'browsing' ? alpha(theme.palette.info.main, 0.15) :
    alpha(theme.palette.primary.main, 0.15),
  color: 
    status === 'thinking' ? theme.palette.warning.main :
    status === 'viewing' ? theme.palette.info.main :
    status === 'editing' ? theme.palette.success.main :
    status === 'browsing' ? theme.palette.info.main :
    theme.palette.primary.main,
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5)
  }
}));

// Logo Multiagente Professionale
const MultiagentLogo = ({ theme }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    position: 'relative',
  }}>
    <Box sx={{ position: 'relative', mr: 2 }}>
      <HubIcon 
        sx={{ 
          fontSize: 36, 
          color: theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF',
          filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.3)})`
        }} 
      />
      <Box sx={{ 
        position: 'absolute', 
        top: -3, 
        right: -3, 
        width: 12, 
        height: 12, 
        bgcolor: '#00BFA5', 
        borderRadius: '50%',
        border: `2px solid ${theme.palette.background.paper}`,
      }} />
    </Box>
    
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 700, 
          letterSpacing: '-0.02em',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to right, #9A7CFF, #00BFA5)'
            : 'linear-gradient(to right, #7C4DFF, #00BFA5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: -0.5
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
          color: theme.palette.text.secondary
        }}
      >
        Sistema Multiagente Legale
      </Typography>
    </Box>
  </Box>
);

// Stile per il drawer di upload documenti
const DocumentDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.95) : alpha('#FFFFFF', 0.95),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 24px rgba(0, 0, 0, 0.3)' 
      : '0 8px 24px rgba(124, 77, 255, 0.1)',
  }
}));

// Componente popup per la creazione di un nuovo progetto
const NewProjectDialog = ({ open, onClose, onCreate, workspaces }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [confidentiality, setConfidentiality] = useState('standard');
  const [notes, setNotes] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Lista delle aree di pratica comuni per studi legali
  const practiceAreas = [
    'Diritto Civile',
    'Diritto Commerciale',
    'Diritto Penale',
    'Diritto del Lavoro',
    'Diritto Tributario',
    'Diritto Amministrativo',
    'Diritto di Famiglia',
    'Diritto Immobiliare',
    'Proprietà Intellettuale',
    'Diritto Bancario',
    'Diritto delle Assicurazioni',
    'Contenzioso',
    'Diritto dell\'Immigrazione',
    'Diritto Ambientale',
    'Diritto Internazionale',
    'Altro'
  ];
  
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now().toString(),
        name: newProjectName,
        client: clientName,
        practiceArea,
        deadline,
        priority,
        confidentiality,
        notes,
        workspaces: selectedWorkspaces,
        date: new Date().toLocaleDateString(),
        agents: []
      };
      
      onCreate(newProject);
      
      // Reset dei campi
      setNewProjectName('');
      setClientName('');
      setPracticeArea('');
      setDeadline('');
      setPriority('medium');
      setConfidentiality('standard');
      setNotes('');
      setSelectedWorkspaces([]);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 3,
        py: 2
      }}>
        <Typography variant="h5" fontWeight={600}>Crea Nuovo Progetto</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Dashboard" arrow>
            <IconButton
              size="small"
              onClick={() => navigate('/')}
              sx={{ 
                bgcolor: theme.palette.background.paper,
                boxShadow: 1
              }}
            >
              <HomeIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              label="Nome del progetto"
              fullWidth
              variant="outlined"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FolderIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              margin="dense"
              label="Nome del cliente"
              fullWidth
              variant="outlined"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Area di pratica</InputLabel>
              <Select
                value={practiceArea}
                onChange={(e) => setPracticeArea(e.target.value)}
                label="Area di pratica"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: -0.5, mr: 0.5 }}>
                    <GavelIcon color="primary" />
                  </InputAdornment>
                }
              >
                {practiceAreas.map((area) => (
                  <MenuItem key={area} value={area}>{area}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              margin="dense"
              label="Scadenza"
              type="date"
              fullWidth
              variant="outlined"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Priorità</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                label="Priorità"
              >
                <MenuItem value="low">Bassa</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="urgent">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Riservatezza</InputLabel>
              <Select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value)}
                label="Riservatezza"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: -0.5, mr: 0.5 }}>
                    <LockIcon color="primary" />
                  </InputAdornment>
                }
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="sensitive">Sensibile</MenuItem>
                <MenuItem value="highly_confidential">Altamente confidenziale</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Condividi con gruppi</InputLabel>
              <Select
                multiple
                value={selectedWorkspaces}
                onChange={(e) => setSelectedWorkspaces(e.target.value)}
                label="Condividi con gruppi"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const workspace = workspaces.find(w => w.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={workspace ? workspace.name : value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: -0.5, mr: 0.5 }}>
                    <GroupsIcon color="primary" />
                  </InputAdornment>
                }
              >
                {workspaces.map((workspace) => (
                  <MenuItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Note aggiuntive"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="dense"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">Annulla</Button>
        <Button 
          onClick={handleCreateProject} 
          variant="contained"
          disabled={!newProjectName.trim()}
          startIcon={<AddIcon />}
        >
          Crea Progetto
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente per il dialogo di modifica progetto
const EditProjectDialog = ({ open, onClose, project, workspaces, onUpdate }) => {
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const theme = useTheme();

  // Inizializza i dati del progetto quando il dialogo viene aperto
  useEffect(() => {
    if (open && project) {
      setProjectToEdit({...project});
      setSelectedWorkspaces(project.workspaces || []);
    }
  }, [open, project]);

  const handleUpdateProject = () => {
    if (projectToEdit) {
      const updatedProject = {...projectToEdit, workspaces: selectedWorkspaces};
      onUpdate(updatedProject);
    }
  };

  if (!projectToEdit) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Modifica Progetto</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              label="Nome del progetto"
              fullWidth
              variant="outlined"
              value={projectToEdit.name || ''}
              onChange={(e) => setProjectToEdit({...projectToEdit, name: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FolderIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              margin="dense"
              label="Nome del cliente"
              fullWidth
              variant="outlined"
              value={projectToEdit.client || ''}
              onChange={(e) => setProjectToEdit({...projectToEdit, client: e.target.value})}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Area di pratica</InputLabel>
              <Select
                value={projectToEdit.practiceArea || ''}
                onChange={(e) => setProjectToEdit({...projectToEdit, practiceArea: e.target.value})}
                label="Area di pratica"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: -0.5, mr: 0.5 }}>
                    <GavelIcon color="primary" />
                  </InputAdornment>
                }
              >
                {['Diritto Civile', 'Diritto Commerciale', 'Diritto Penale', 'Diritto del Lavoro', 
                  'Diritto Tributario', 'Diritto Amministrativo', 'Diritto di Famiglia', 'Altro'].map((area) => (
                  <MenuItem key={area} value={area}>{area}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              margin="dense"
              label="Scadenza"
              type="date"
              fullWidth
              variant="outlined"
              value={projectToEdit.deadline || ''}
              onChange={(e) => setProjectToEdit({...projectToEdit, deadline: e.target.value})}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Priorità</InputLabel>
              <Select
                value={projectToEdit.priority || 'medium'}
                onChange={(e) => setProjectToEdit({...projectToEdit, priority: e.target.value})}
                label="Priorità"
              >
                <MenuItem value="low">Bassa</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="urgent">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel>Condividi con gruppi</InputLabel>
              <Select
                multiple
                value={selectedWorkspaces}
                onChange={(e) => setSelectedWorkspaces(e.target.value)}
                label="Condividi con gruppi"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const workspace = workspaces.find(w => w.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={workspace ? workspace.name : value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: -0.5, mr: 0.5 }}>
                    <GroupsIcon color="primary" />
                  </InputAdornment>
                }
              >
                {workspaces.map((workspace) => (
                  <MenuItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button 
          onClick={handleUpdateProject} 
          variant="contained"
          disabled={!projectToEdit.name}
        >
          Aggiorna
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente messaggi nell'output
const Message = ({ type, content, timestamp, agent }) => {
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

// Componente per log attività nel quadrante Lexychain
const ActivityLog = ({ activities }) => {
  const theme = useTheme();
  
  const getStatusIcon = (status) => {
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
  
  return (
    <Box sx={{ mb: 2 }}>
      <List dense>
        {activities.map((activity, index) => (
          <ListItem 
            key={index} 
            disablePadding 
            sx={{ 
              mb: 1,
              bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
              borderRadius: 1,
             overflow: 'hidden'
            }}
          >
            <ListItemButton dense sx={{ py: 0.75 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {getStatusIcon(activity.status)}
              </ListItemIcon>
              <ListItemText 
                primary={activity.description}
                secondary={activity.timestamp}
                primaryTypographyProps={{ fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

// Componente per la selezione degli agenti con @mentions
const AgentMentionSelector = ({ availableAgents, onSelect }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        maxHeight: 200, 
        overflowY: 'auto',
        mb: 1
      }}
    >
      <List dense disablePadding>
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
                primaryTypographyProps={{ fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

// Componente documento caricato
const DocumentItem = ({ document, onDelete }) => {
  const theme = useTheme();
  
  return (
    <ListItem 
      sx={{
        mb: 1,
        borderRadius: 1,
        bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
      }}
      secondaryAction={
        <IconButton edge="end" size="small" onClick={() => onDelete(document.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      }
    >
      <ListItemIcon>
        <FileIcon />
      </ListItemIcon>
      <ListItemText 
        primary={document.name} 
        secondary={`${document.size} - ${document.date}`}
        primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
        secondaryTypographyProps={{ fontSize: '0.75rem' }}
      />
    </ListItem>
  );
};

function Multiagent() {
  const { theme } = useContext(ThemeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [promptInputRef, setPromptInputRef] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Stato per la modalità della pagina (seleziona progetto o lavora su progetto)
  const [pageMode, setPageMode] = useState('select'); // 'select' o 'work'
  
  // Stato per i progetti
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Stato per il dialogo di creazione nuovo progetto
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  
  // Stato per il dialogo di modifica progetto
  const [editProjectDialog, setEditProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  
  // Stato per i gruppi di lavoro disponibili
  const [workspaces, setWorkspaces] = useState([
    { id: 'ws-1', name: 'Team Contenzioso' },
    { id: 'ws-2', name: 'Team Contrattualistica' }
  ]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  
  // Stato per il prompt ed agenti
  const [prompt, setPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  
  // Stato per l'output
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stato per l'artifact (Lexychain)
  const [artifact, setArtifact] = useState(null);
  const [activities, setActivities] = useState([]);
  
  // Stato per drawer documenti
  const [docsDrawerOpen, setDocsDrawerOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  
  // Stato per @mentions
  const [showMentions, setShowMentions] = useState(false);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  
  // Lista agenti disponibili
  const availableAgents = [
    { id: 'researcher', name: 'Ricercatore', description: 'Ricerca giurisprudenza e normative', nickName: '@ricercatore' },
    { id: 'writer', name: 'Redattore', description: 'Genera documenti legali di qualità', nickName: '@redattore' },
    { id: 'lawyer', name: 'Avvocato', description: 'Analisi legale e strategia processuale', nickName: '@avvocato' },
    { id: 'coder', name: 'Analista Dati', description: 'Analisi quantitativa di documenti e pratiche', nickName: '@analista' },
    { id: 'notary', name: 'Notaio', description: 'Verifica formale di documenti', nickName: '@notaio' },
    { id: 'mediator', name: 'Mediatore', description: 'Supporto per conciliazioni e mediazioni', nickName: '@mediatore' },
    { id: 'executor', name: 'Esecutore', description: 'Automazione di pratiche standardizzate', nickName: '@esecutore' },
  ];
  
  // Funzione per aprire il dialogo di modifica
  const handleEditProject = (project, event) => {
    event.stopPropagation(); // Previene l'apertura del progetto
    setProjectToEdit({...project});
    setSelectedWorkspaces(project.workspaces || []);
    setEditProjectDialog(true);
  };

  // Funzione per aggiornare il progetto
  const handleUpdateProject = () => {
    if (projectToEdit) {
      const updatedProjects = projects.map(p => 
        p.id === projectToEdit.id 
          ? {...projectToEdit, workspaces: selectedWorkspaces} 
          : p
      );
      
      setProjects(updatedProjects);
      setEditProjectDialog(false);
      setProjectToEdit(null);
      setSelectedWorkspaces([]);
    }
  };

  // Funzione per eliminare un progetto
  const handleDeleteProject = (projectId, event) => {
    event.stopPropagation(); // Previene l'apertura del progetto
    
    // Chiedi conferma prima di eliminare
    if (window.confirm('Sei sicuro di voler eliminare questo progetto?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
    }
  };
  
  // Gestione input prompt e @mentions
  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    
    // Controllo per @mentions
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    
    // Verifica se l'ultimo carattere digitato è '@'
    if (newValue.charAt(cursorPos - 1) === '@' && (cursorPos === 1 || newValue.charAt(cursorPos - 2) === ' ')) {
      setShowMentions(true);
      setMentionAnchorEl(e.target);
    } else {
      // Verifica se siamo ancora in una sequenza di menzione
      const lastAtPos = newValue.substring(0, cursorPos).lastIndexOf('@');
      if (lastAtPos !== -1) {
        const textAfterAt = newValue.substring(lastAtPos + 1, cursorPos);
        // Se c'è testo dopo @ e non contiene spazi, siamo ancora in una menzione
        if (textAfterAt && !textAfterAt.includes(' ')) {
          setShowMentions(true);
          setMentionAnchorEl(e.target);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    }
  };
  
  // Inserisci menzione dell'agente
  const handleAgentMention = (agent) => {
    if (!prompt) return;
    
    // Trova la posizione dell'ultimo @
    const lastAtPos = prompt.substring(0, cursorPosition).lastIndexOf('@');
    if (lastAtPos === -1) return;
    
    // Sostituisci @... con @nickName
    const beforeAt = prompt.substring(0, lastAtPos);
    const afterCursor = prompt.substring(cursorPosition);
    
    // Estrai il nickName senza @ (il sistema già ha aggiunto @)
    const nickNameWithoutAt = agent.nickName.substring(1);
    
    const newPrompt = beforeAt + '@' + nickNameWithoutAt + ' ' + afterCursor;
    setPrompt(newPrompt);
    
    // Aggiungi l'agente ai selezionati se non c'è già
    if (!selectedAgents.some(a => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }
    
    setShowMentions(false);
  };
  
  const handleCreateProject = (newProject) => {
    setProjects([newProject, ...projects]);
    setNewProjectDialog(false);
    setSelectedProject(newProject);
    setPageMode('work');
  };
  
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setPageMode('work');
    // Reset degli stati di lavoro
    setPrompt('');
    setSelectedAgents([]);
    setMessages([{
      type: 'system',
      content: `Progetto "${project.name}" caricato. Seleziona gli agenti e inserisci un prompt per iniziare.`,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setArtifact(null);
    setActivities([{
      status: 'viewing',
      description: 'Caricamento del progetto',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };
  
  const handleSendPrompt = () => {
    if (prompt.trim() && selectedAgents.length > 0) {
      setIsProcessing(true);
      
      // Aggiungi il messaggio dell'utente
      setMessages(prev => [...prev, {
        type: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Aggiungi attività
      setActivities(prev => [
        {
          status: 'thinking',
          description: 'Analisi del prompt in corso',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      
      // Simulazione di elaborazione
      setTimeout(() => {
        // Generazione risposta degli agenti
        const agentMessages = selectedAgents.map(agent => ({
          type: 'agent',
          content: `Risposta dell'agente ${agent.name} al prompt: "${prompt}"`,
          timestamp: new Date().toLocaleTimeString(),
          agent
        }));
        
        setMessages(prev => [...prev, ...agentMessages]);
        
        // Simulazione artifact
        setArtifact({
          name: 'Documento_Generato.docx',
          size: '256 KB',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          content: `Contenuto del documento generato in risposta al prompt: "${prompt}"`
        });
        
        // Aggiorna attività
        setActivities(prev => [
          {
            status: 'editing',
            description: 'Documento generato',
            timestamp: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
        
        setIsProcessing(false);
      }, 2000);
    }
  };
  
  const handleUploadDocument = (e) => {
    // Simulazione di caricamento documento
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newDocument = {
        id: Date.now().toString(),
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        date: new Date().toLocaleDateString()
      };
      
      setDocuments([newDocument, ...documents]);
      
      // Aggiungi attività
      setActivities(prev => [
        {
          status: 'browsing',
          description: `Documento caricato: ${file.name}`,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
    }
  };
  
  const handleDeleteDocument = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };
  
  const handleReturnToProjects = () => {
    setPageMode('select');
    setSelectedProject(null);
    setPrompt('');
    setSelectedAgents([]);
    setMessages([]);
    setArtifact(null);
    setActivities([]);
  };
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? `radial-gradient(circle at 0% 20%, ${alpha('#2D2B55', 0.6)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#28284D', 0.6)} 0%, transparent 30%),
           ${theme.palette.background.default}`
        : `radial-gradient(circle at 0% 20%, ${alpha('#F0E7FF', 0.4)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#EDF5FF', 0.4)} 0%, transparent 30%),
           ${theme.palette.background.default}`,
      backgroundAttachment: 'fixed',
      p: 2,
    }}>
      {/* Contenuto principale */}
      {pageMode === 'select' ? (
        /* Griglia progetti */
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">I tuoi progetti</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
              >
                Dashboard
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setNewProjectDialog(true)}
              >
                Nuovo Progetto
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {projects.length > 0 ? projects.map(project => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <ProjectCard onClick={() => handleSelectProject(project)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FolderIcon sx={{ color: 'primary.main', fontSize: 32, mr: 1 }} />
                      <Typography variant="h6" noWrap sx={{ maxWidth: '90%' }}>
                        {project.name}
                      </Typography>
                    </Box>
                    
                    {project.client && (
                      <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        {project.client}
                      </Typography>
                    )}
                    
                    {project.practiceArea && (
                      <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <GavelIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        {project.practiceArea}
                      </Typography>
                    )}
                    
                    {project.workspaces && project.workspaces.length > 0 && (
                      <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <GroupsIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                        Condiviso con {project.workspaces.length} {project.workspaces.length === 1 ? 'gruppo' : 'gruppi'}
                      </Typography>
                    )}
                    
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Creato il {project.date}
                    </Typography>
                    
                    {project.priority && (
                      <Chip 
                        size="small" 
                        label={
                          project.priority === 'high' ? 'Alta priorità' :
                          project.priority === 'urgent' ? 'Urgente' :
                          project.priority === 'medium' ? 'Media priorità' : 'Bassa priorità'
                        }
                        color={
                          project.priority === 'high' ? 'warning' :
                          project.priority === 'urgent' ? 'error' :
                          project.priority === 'medium' ? 'info' : 'default'
                        }
                        sx={{ mr: 1, mt: 1 }}
                      />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />} 
                      onClick={(e) => handleEditProject(project, e)}
                    >
                      Modifica
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </ProjectCard>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 5,
                  textAlign: 'center'
                }}>
                  <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6">Nessun progetto disponibile</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                    Crea un nuovo progetto per iniziare a lavorare con gli agenti
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setNewProjectDialog(true)}
                  >
                    Crea Nuovo Progetto
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      ) : (
        /* Layout lavoro chat style */
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 24px)' }}>
          {/* Contenuto principale */}
          <Box sx={{ 
            display: 'flex', 
            flexGrow: 1, 
            height: 'calc(100% - 80px)',
            gap: 2
          }}>
            {/* Area output (attività) */}
            <Box sx={{ 
              width: isMobile ? '100%' : '50%', // Esattamente 50% dello schermo
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
            }}>              
              <Quadrant sx={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
                {/* Pulsante per tornare ai progetti nell'angolo in alto a destra */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleReturnToProjects}
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    zIndex: 10,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: 1
                  }}
                >
                  Progetti
                </Button>
                
                <Box sx={{ 
                  p: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  pt: 5 // Aggiungi spazio per il pulsante
                }}>
                  {/* Messaggi */}
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {messages.length > 0 ? messages.map((message, index) => (
                      <Message 
                        key={index}
                        type={message.type}
                        content={message.content}
                        timestamp={message.timestamp}
                        agent={message.agent}
                      />
                    )) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        p: 3
                      }}>
                        <BalanceIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6">Inizia una nuova conversazione</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Digita @ nel prompt per menzionare e utilizzare gli agenti
                        </Typography>
                      </Box>
                    )}
                    
                    {isProcessing && (
                      <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        bgcolor: theme.palette.mode === 'dark' ? 
                          alpha(theme.palette.primary.main, 0.1) : 
                          alpha(theme.palette.primary.light, 0.1),
                        borderRadius: 2,
                        mt: 'auto'
                      }}>
                        <CircularProgress size={20} sx={{ mr: 2, color: theme.palette.primary.main }} />
                        <Typography>Gli agenti stanno elaborando la risposta...</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Quadrant>
            </Box>
            
            {/* Area artifact (Lexychain) - occupa esattamente il 50% della larghezza */}
            <Box sx={{ width: isMobile ? '100%' : '50%', height: '100%', display: isMobile && 'none' }}>
              <Quadrant>
                <QuadrantTitle variant="h6">
                  <AttachFileIcon /> Lexychain
                </QuadrantTitle>
                
                {/* Contenitore Lexychain esteso per occupare tutto lo spazio verticale disponibile */}
                <Box sx={{ height: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column' }}>
                  {/* Artifact preview - occupa praticamente tutto lo spazio */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: '90%' // Aumentato ulteriormente per occupare quasi tutto lo spazio verticale
                  }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#F5F5F5', 0.5),
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FileIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle2">
                          {artifact ? artifact.name : 'Nessun documento'}
                        </Typography>
                      </Box>
                      
                      {artifact && (
                        <Chip 
                          label={artifact.size} 
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                      {artifact ? (
                        <Typography
                          sx={{
                            fontFamily: '"Inter", sans-serif',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.85rem'
                          }}
                        >
                          {artifact.content}
                        </Typography>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '100%',
                          textAlign: 'center'
                        }}>
                          <DescriptionIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            I documenti elaborati appariranno qui
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {artifact && (
                      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<FileDownloadIcon />}
                          onClick={() => console.log("Download artifact")}
                        >
                          Scarica Documento
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Log attività - ridotto al minimo necessario */}
                  <Box sx={{ mt: 2, overflow: 'auto', maxHeight: '10%' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Attività
                    </Typography>
                    <ActivityLog activities={activities} />
                  </Box>
                </Box>
              </Quadrant>
            </Box>
          </Box>
          
          {/* Input area (fissata in basso) */}
          <PromptInputBox sx={{ mt: 2 }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap' }}>
                  {selectedAgents.map(agent => (
                    <AgentChip
                      key={agent.id}
                      label={agent.name}
                      onDelete={() => setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id))}
                      avatar={<PsychologyIcon style={{ width: 18, height: 18 }} />}
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFileIcon />}
                    onClick={() => setDocsDrawerOpen(true)}
                  >
                    Documenti
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', position: 'relative' }}>
                <TextField
                  placeholder="Inserisci il tuo prompt... (@ per menzionare agenti)"
                  fullWidth
                  multiline
                  maxRows={3}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  value={prompt}
                  onChange={handlePromptChange}
                  inputRef={(input) => setPromptInputRef(input)}
                  disabled={isProcessing}
                />
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<SendIcon />}
                  sx={{ ml: 2, alignSelf: 'flex-end' }}
                  disabled={!prompt.trim() || selectedAgents.length === 0 || isProcessing}
                  onClick={handleSendPrompt}
                >
                  Invia
                </Button>
                
                {/* Menu per @mentions */}
                <Popper
                  open={showMentions}
                  anchorEl={mentionAnchorEl}
                  placement="top-start"
                  style={{ zIndex: 1300, width: 250 }}
                >
                 <ClickAwayListener onClickAway={() => setShowMentions(false)}>
                    <Paper elevation={3}>
                      <AgentMentionSelector 
                        availableAgents={availableAgents.filter(agent => 
                          // Mostra solo gli agenti che non sono già stati menzionati nel testo
                          prompt.indexOf(agent.nickName) === -1
                        )} 
                        onSelect={handleAgentMention} 
                      />
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Box>
            </Box>
          </PromptInputBox>
        </Box>
      )}
      
      {/* Dialog per nuovo progetto */}
      <NewProjectDialog
        open={newProjectDialog}
        onClose={() => setNewProjectDialog(false)}
        onCreate={handleCreateProject}
        workspaces={workspaces}
      />
      
      {/* Dialog per modifica progetto */}
      <EditProjectDialog 
        open={editProjectDialog} 
        onClose={() => setEditProjectDialog(false)}
        project={projectToEdit}
        workspaces={workspaces}
        onUpdate={handleUpdateProject}
      />
      
      {/* Drawer per documenti */}
      <DocumentDrawer
        anchor="left"
        open={docsDrawerOpen}
        onClose={() => setDocsDrawerOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Documenti</Typography>
            <IconButton onClick={() => setDocsDrawerOpen(false)}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              fullWidth
              component="label"
            >
              Carica documento
              <input
                type="file"
                hidden
                onChange={handleUploadDocument}
              />
            </Button>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Documenti caricati
          </Typography>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List>
              {documents.length > 0 ? (
                documents.map(doc => (
                  <DocumentItem 
                    key={doc.id} 
                    document={doc} 
                    onDelete={handleDeleteDocument} 
                  />
                ))
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center'
                }}>
                  <AttachFileIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nessun documento caricato
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        </Box>
      </DocumentDrawer>
    </Box>
  );
}

export default Multiagent;