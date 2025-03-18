// src/components/profile/ProfileSection.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Grid, 
  TextField, 
  Button, 
  Divider, 
  Stack, 
  Avatar, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  ListItemIcon,
  ListItemButton, // Aggiungi questa importazione
  Switch,
  Chip,
  Tab,
  Tabs,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BackupIcon from '@mui/icons-material/Backup';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DescriptionIcon from '@mui/icons-material/Description';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Styled Components
const ProfileCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.8) : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 8px 32px rgba(0, 0, 0, 0.2)' 
    : '0 8px 32px rgba(124, 77, 255, 0.1)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
  border: `4px solid ${theme.palette.background.paper}`,
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    minHeight: 48,
    transition: 'all 0.2s',
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
}));

const StyledBadge = styled(Box)(({ theme, color }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 12px',
  borderRadius: 12,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: theme.palette.getContrastText(color),
  backgroundColor: color,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const WorkspaceCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.6) : alpha('#FFFFFF', 0.8),
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
    : '0 4px 16px rgba(124, 77, 255, 0.1)',
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 24px rgba(0, 0, 0, 0.25)' 
      : '0 8px 24px rgba(124, 77, 255, 0.15)',
  }
}));

// Form Field Row Component
const FormRow = ({ label, children }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4} md={3}>
        <Typography variant="subtitle2" sx={{ pt: 1 }}>{label}</Typography>
      </Grid>
      <Grid item xs={12} sm={8} md={9}>
        {children}
      </Grid>
    </Grid>
  );
};

// Main Profile Component
const ProfileSection = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for tab selection
  const [tabValue, setTabValue] = useState(0);

  // State for user data
  const [userData, setUserData] = useState({
    name: 'Andrea Di Meglio',
    email: 'andrea.dimeglio@example.com',
    password: '••••••••••••',
    company: 'Studio Legale Di Meglio & Associati',
    role: 'Amministratore',
    photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
  });
  
  // State for editing user data
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...userData });
  const [showPassword, setShowPassword] = useState(false);
  
  // State for billing data
  const [billingPlan, setBillingPlan] = useState('professional');
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'credit_card',
    last4: '4242',
    expiry: '12/25',
    name: 'Andrea Di Meglio'
  });
  const [billingHistory, setBillingHistory] = useState([
    { id: 'INV-2025-003', date: '01/03/2025', amount: '€129.00', status: 'Pagato' },
    { id: 'INV-2025-002', date: '01/02/2025', amount: '€129.00', status: 'Pagato' },
    { id: 'INV-2025-001', date: '01/01/2025', amount: '€129.00', status: 'Pagato' },
  ]);
  
  // State for available projects
  const [availableProjects, setAvailableProjects] = useState([
    { id: 'proj-1', name: 'Analisi contratto di locazione', shared: false },
    { id: 'proj-2', name: 'Pianificazione strategia legale', shared: true },
    { id: 'proj-3', name: 'Due diligence acquisizione', shared: false },
    { id: 'proj-4', name: 'Causa RG 12345/2024', shared: true },
  ]);
  
  // State for workspace data
  const [workspaces, setWorkspaces] = useState([
    { id: 'ws-1', name: 'Team Contenzioso', members: ['studio@dimeglio.it', 'mario.rossi@dimeglio.it', 'giulia.verdi@dimeglio.it'], role: 'Proprietario' },
    { id: 'ws-2', name: 'Team Contrattualistica', members: ['studio@dimeglio.it', 'luigi.bianchi@dimeglio.it'], role: 'Proprietario' },
  ]);
  const [newWorkspaceDialog, setNewWorkspaceDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaceDetailDialog, setWorkspaceDetailDialog] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  // State for settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    twoFactorAuth: false,
    darkMode: theme.palette.mode === 'dark',
  });
  
  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handler for editing profile
  const handleStartEditing = () => {
    setEditData({ ...userData });
    setIsEditing(true);
  };
  
  const handleSaveProfile = () => {
    setUserData({ ...editData });
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for settings change
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    if (setting === 'darkMode') {
      toggleColorMode();
    }
  };
  
  // Handlers for workspace management
  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      const newWorkspace = {
        id: `ws-${workspaces.length + 1}`,
        name: newWorkspaceName,
        members: [userData.email],
        role: 'Proprietario'
      };
      
      setWorkspaces([...workspaces, newWorkspace]);
      setNewWorkspaceDialog(false);
      setNewWorkspaceName('');
    }
  };
  
  const handleOpenWorkspaceDetail = (workspace) => {
    setSelectedWorkspace(workspace);
    setWorkspaceDetailDialog(true);
  };
  
  const handleAddMember = () => {
    if (newMemberEmail.trim() && selectedWorkspace) {
      const updatedWorkspaces = workspaces.map(ws => {
        if (ws.id === selectedWorkspace.id) {
          return {
            ...ws,
            members: [...ws.members, newMemberEmail]
          };
        }
        return ws;
      });
      
      setWorkspaces(updatedWorkspaces);
      setSelectedWorkspace(prev => ({ ...prev, members: [...prev.members, newMemberEmail] }));
      setNewMemberEmail('');
    }
  };
  
  const handleRemoveMember = (email) => {
    if (selectedWorkspace) {
      const updatedWorkspaces = workspaces.map(ws => {
        if (ws.id === selectedWorkspace.id) {
          return {
            ...ws,
            members: ws.members.filter(m => m !== email)
          };
        }
        return ws;
      });
      
      setWorkspaces(updatedWorkspaces);
      setSelectedWorkspace(prev => ({ ...prev, members: prev.members.filter(m => m !== email) }));
    }
  };
  
  // Handler for project sharing
  const handleToggleProjectSharing = (projectId, workspaceId) => {
    // Aggiorna la lista dei progetti
    setAvailableProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { ...project, shared: !project.shared } 
          : project
      )
    );
  };
  
  // Helper per ottenere i progetti condivisi per un workspace
  const getSharedProjects = (workspaceId) => {
    return availableProjects.filter(project => project.shared);
  };
  
  // Handler for avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditData(prev => ({ ...prev, photoURL: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? `radial-gradient(circle at 0% 20%, ${alpha('#2D2B55', 0.6)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#28284D', 0.6)} 0%, transparent 30%),
           ${theme.palette.background.default}`
        : `radial-gradient(circle at 0% 20%, ${alpha('#F0E7FF', 0.4)} 0%, transparent 30%),
           radial-gradient(circle at 100% 80%, ${alpha('#EDF5FF', 0.4)} 0%, transparent 30%),
           ${theme.palette.background.default}`,
      backgroundAttachment: 'fixed',
      position: 'relative',
      py: 4,
    }}>
      <Container maxWidth="lg">
        {/* Header with navigation back to dashboard */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Profilo</Typography>
          <Button 
            variant="outlined" 
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Dashboard
          </Button>
        </Box>
        
        {/* Profile Overview Card */}
        <ProfileCard sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: { xs: 'center', md: 'flex-start' }, 
            gap: 3, 
            mb: 3,
            pb: 3,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <ProfileAvatar src={userData.photoURL} />
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>{userData.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>{userData.company}</Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={userData.role} 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 500 }}
                />
                <Chip 
                  label="Piano Professionale" 
                  color="secondary" 
                  size="small" 
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Box>

              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                {userData.email}
              </Typography>
            </Box>
          </Box>
          
          {/* Tabs for different sections */}
          <Box sx={{ width: '100%' }}>
            <StyledTabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
            >
              <Tab icon={<PersonIcon />} iconPosition="start" label="Account" />
              <Tab icon={<PaymentIcon />} iconPosition="start" label="Fatturazione" />
              <Tab icon={<WorkspacesIcon />} iconPosition="start" label="Gruppi di lavoro" />
              <Tab icon={<SettingsIcon />} iconPosition="start" label="Impostazioni" />
              <Tab icon={<SecurityIcon />} iconPosition="start" label="Privacy e Sicurezza" />
            </StyledTabs>
          </Box>
        </ProfileCard>
        
        {/* Tab Panels */}
        <Box sx={{ minHeight: 500 }}>
          {/* Account Tab */}
          <TabPanel value={tabValue} index={0}>
            <ProfileCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Informazioni personali</Typography>
                {isEditing ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={handleCancelEdit}
                    >
                      Annulla
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Salva
                    </Button>
                  </Box>
                ) : (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={handleStartEditing}
                  >
                    Modifica
                  </Button>
                )}
              </Box>
              
              {isEditing ? (
                <Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <ProfileAvatar src={editData.photoURL} sx={{ mb: 2 }} />
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      size="small"
                    >
                      Cambia immagine
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </Button>
                  </Box>
                  
                  <FormRow label="Nome completo">
                    <TextField
                      fullWidth
                      name="name"
                      value={editData.name}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </FormRow>
                  
                  <FormRow label="Email">
                    <TextField
                      fullWidth
                      name="email"
                      value={editData.email}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      type="email"
                    />
                  </FormRow>
                  
                  <FormRow label="Password">
                    <TextField
                      fullWidth
                      name="password"
                      value={editData.password === '••••••••••••' ? '' : editData.password}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      type={showPassword ? "text" : "password"}
                      placeholder="Lascia vuoto per non modificare"
                      InputProps={{
                        endAdornment: (
                          <IconButton 
                            onClick={() => setShowPassword(!showPassword)} 
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        ),
                      }}
                    />
                  </FormRow>
                  
                  <FormRow label="Studio legale">
                    <TextField
                      fullWidth
                      name="company"
                      value={editData.company}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </FormRow>
                </Box>
              ) : (
                <Box>
                  <FormRow label="Nome completo">
                    <Typography>{userData.name}</Typography>
                  </FormRow>
                  
                  <FormRow label="Email">
                    <Typography>{userData.email}</Typography>
                  </FormRow>
                  
                  <FormRow label="Password">
                    <Typography>{userData.password}</Typography>
                  </FormRow>
                  
                  <FormRow label="Studio legale">
                    <Typography>{userData.company}</Typography>
                  </FormRow>
                  
                  <FormRow label="Ruolo">
                    <Typography>{userData.role}</Typography>
                  </FormRow>
                </Box>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Sessioni attive</Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main',
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`
                      }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="MacBook Pro - Chrome" 
                      secondary="Roma, Italia · IP: 82.54.XX.XX · Attuale"
                    />
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                      Attiva ora
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: 'text.disabled',
                      }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="iPhone 14 Pro - Safari" 
                      secondary="Roma, Italia · IP: 37.162.XX.XX · 5 giorni fa"
                    />
                    <Button variant="outlined" size="small" color="error">
                      Disconnetti
                    </Button>
                  </ListItem>
                </List>
              </Box>
            </ProfileCard>
          </TabPanel>
          
          {/* Billing Tab - versione semplificata */}
          <TabPanel value={tabValue} index={1}>
            <ProfileCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Piano attuale</Typography>
                <StyledBadge color={theme.palette.success.main}>
                  Attivo
                </StyledBadge>
              </Box>
              
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : alpha('#7C4DFF', 0.08)}`,
                  borderRadius: 2,
                  mb: 4
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">Piano Professionale</Typography>
                    <Typography variant="subtitle1" color="text.secondary">€129/mese</Typography>
                  </Box>
                  <Chip 
                    label="Rinnovo automatico" 
                    color="success" 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Prossimo rinnovo:</Typography>
                  <Typography variant="body2" fontWeight="medium">01 aprile 2025</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tipo di fatturazione:</Typography>
                  <Typography variant="body2" fontWeight="medium">Mensile</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Utenti inclusi:</Typography>
                  <Typography variant="body2" fontWeight="medium">20 utenti</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Spazio di archiviazione:</Typography>
                  <Typography variant="body2" fontWeight="medium">50GB</Typography>
                </Box>
              </Paper>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Metodo di pagamento</Typography>
                
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <CreditCardIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle2">Visa che termina con {paymentMethod.last4}</Typography>
                    <Typography variant="body2" color="text.secondary">Scade {paymentMethod.expiry}</Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button size="small" startIcon={<EditIcon />}>Modifica</Button>
                </Paper>
              </Box>
              
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Fatture recenti</Typography>
                
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numero</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingHistory.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell align="right">{invoice.amount}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={invoice.status} 
                            color="success" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            startIcon={<ReceiptIcon />} 
                            size="small"
                          >
                            Scarica
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    startIcon={<HistoryIcon />}
                    variant="outlined"
                  >
                    Visualizza tutte le fatture
                  </Button>
                </Box>
              </Box>
            </ProfileCard>
          </TabPanel>
          
          {/* Workspace Tab - Aggiunta gestione progetti */}
          <TabPanel value={tabValue} index={2}>
            <ProfileCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
  <Typography variant="h6" fontWeight="bold">Gruppi di lavoro</Typography>
  <Button 
    variant="contained" 
    startIcon={<AddIcon />}
    onClick={() => setNewWorkspaceDialog(true)}
  >
    Nuovo gruppo
  </Button>
</Box>
    
<Grid container spacing={3}>
  {workspaces.map((workspace) => (
    <Grid item xs={12} sm={6} md={4} key={workspace.id}>
      <WorkspaceCard onClick={() => handleOpenWorkspaceDetail(workspace)}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '12px', 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <GroupsIcon fontSize="large" color="primary" />
          </Box>
          <Chip 
            size="small" 
            label={workspace.role} 
            color="primary" 
            variant={workspace.role === 'Proprietario' ? 'filled' : 'outlined'}
          />
        </Box>
        
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>{workspace.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {workspace.members.length} {workspace.members.length === 1 ? 'membro' : 'membri'}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {getSharedProjects(workspace.id).length} progetti condivisi
        </Typography>
        
        <Box sx={{ display: 'flex', mt: 'auto', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex' }}>
            {workspace.members.slice(0, 3).map((member, i) => (
              <Avatar 
                key={i} 
                sx={{ 
                  width: 28, 
                  height: 28, 
                  fontSize: '0.75rem',
                  bgcolor: theme.palette.primary.main,
                  border: `2px solid ${theme.palette.background.paper}`,
                  marginLeft: i > 0 ? -1 : 0
                }}
              >
                {member.charAt(0).toUpperCase()}
              </Avatar>
            ))}
            {workspace.members.length > 3 && (
              <Avatar 
                sx={{ 
                  width: 28, 
                  height: 28, 
                  fontSize: '0.75rem',
                  bgcolor: alpha(theme.palette.text.secondary, 0.1),
                  color: theme.palette.text.secondary,
                  border: `2px solid ${theme.palette.background.paper}`,
                  marginLeft: -1
                }}
              >
                +{workspace.members.length - 3}
              </Avatar>
            )}
          </Box>
          
          <IconButton size="small">
            <KeyboardArrowRightIcon />
          </IconButton>
        </Box>
      </WorkspaceCard>
    </Grid>
  ))}
  
  <Grid item xs={12} sm={6} md={4}>
    <WorkspaceCard 
      onClick={() => setNewWorkspaceDialog(true)} 
      sx={{ 
        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        color: theme.palette.primary.main
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Box 
          sx={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2
          }}
        >
          <AddIcon fontSize="large" />
        </Box>
        <Typography variant="subtitle1" fontWeight="medium">Crea nuovo gruppo</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Collabora con il tuo team
        </Typography>
      </Box>
    </WorkspaceCard>
  </Grid>
</Grid>
            </ProfileCard>
          </TabPanel>
          
          {/* Settings Tab */}
          <TabPanel value={tabValue} index={3}>
            <ProfileCard>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 4 }}>Impostazioni applicazione</Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notifiche email" 
                    secondary="Ricevi aggiornamenti e notifiche via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      edge="end"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <DarkModeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Modalità scura" 
                    secondary="Cambia il tema dell'interfaccia"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      edge="end"
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Autenticazione a due fattori" 
                    secondary="Aumenta la sicurezza del tuo account"
                  />
                  <ListItemSecondaryAction>
                    <Switch 
                      edge="end"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Sessione e sicurezza</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<SecurityIcon />}
                >
                  Cambia password
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<LogoutIcon />}
                >
                  Disconnetti da tutti i dispositivi
                </Button>
              </Box>
            </ProfileCard>
          </TabPanel>
          
          {/* Privacy Tab */}
          <TabPanel value={tabValue} index={4}>
            <ProfileCard>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 4 }}>Privacy e documenti legali</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ArticleIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Termini di servizio</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Gli ultimi termini di servizio, aggiornati il 01/01/2025.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        sx={{ mt: 'auto' }}
                      >
                        Visualizza termini
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SecurityIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Privacy Policy</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        La nostra politica sulla privacy, aggiornata il 01/01/2025.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        sx={{ mt: 'auto' }}
                      >
                        Visualizza policy
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DeleteIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Eliminazione account</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Elimina definitivamente il tuo account e tutti i dati associati.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="error"
                        fullWidth
                        sx={{ mt: 'auto' }}
                      >
                        Richiedi eliminazione
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BackupIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Esportazione dati</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Scarica una copia di tutti i tuoi dati nel formato GDPR.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        sx={{ mt: 'auto' }}
                      >
                        Richiedi dati
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4 }}>
                <Alert 
                  severity="info" 
                  icon={<InfoIcon />}
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      alignItems: 'center'
                    }
                  }}
                >
                  <AlertTitle>Informativa sull'utilizzo dei dati</AlertTitle>
                  I tuoi dati sono protetti e utilizzati in conformità con le leggi vigenti sulla privacy, incluso il GDPR.
                  Per qualsiasi domanda relativa ai tuoi dati, contatta il nostro DPO all'indirizzo privacy@valis.it.
                </Alert>
              </Box>
            </ProfileCard>
          </TabPanel>
        </Box>
      </Container>
      
      {/* New Workspace Dialog */}
      <Dialog 
        open={newWorkspaceDialog} 
        onClose={() => setNewWorkspaceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crea nuovo gruppo di lavoro</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Crea un nuovo gruppo per collaborare con il tuo team sui progetti legali.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nome del gruppo"
            fullWidth
            variant="outlined"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewWorkspaceDialog(false)}>Annulla</Button>
          <Button 
            onClick={handleCreateWorkspace} 
            variant="contained"
            disabled={!newWorkspaceName.trim()}
          >
            Crea gruppo
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Workspace Detail Dialog */}
      <Dialog 
        open={workspaceDetailDialog} 
        onClose={() => setWorkspaceDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedWorkspace && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupsIcon color="primary" sx={{ mr: 1 }} />
                {selectedWorkspace.name}
                <Box sx={{ flexGrow: 1 }} />
                <Chip 
                  size="small" 
                  label={selectedWorkspace.role} 
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Membri</Typography>
                  <List>
                    {selectedWorkspace.members.map((member, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: theme.palette.primary.main,
                              width: 36,
                              height: 36
                            }}
                          >
                            {member.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={member} 
                          secondary={member === userData.email ? 'Tu' : 'Membro'}
                        />
                        {selectedWorkspace.role === 'Proprietario' && member !== userData.email && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              size="small"
                              onClick={() => handleRemoveMember(member)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                  
                  {selectedWorkspace.role === 'Proprietario' && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
                      <TextField
                        label="Aggiungi membro via email"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        sx={{ mr: 1 }}
                      />
                      <Button 
                        variant="contained"
                        onClick={handleAddMember}
                        disabled={!newMemberEmail.trim()}
                      >
                        Aggiungi
                      </Button>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Progetti condivisi</Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <List dense>
                      {availableProjects.map((project) => (
                        <ListItem key={project.id} disablePadding>
                          <ListItemButton dense onClick={() => handleToggleProjectSharing(project.id, selectedWorkspace.id)}>
                            <ListItemIcon>
                              <DescriptionIcon 
                                fontSize="small"
                                color={project.shared ? "primary" : "action"}
                              />
                            </ListItemIcon>
                            <ListItemText 
                              primary={project.name} 
                            />
                            <ListItemSecondaryAction>
                              <Switch 
                                edge="end"
                                checked={project.shared}
                                onChange={() => handleToggleProjectSharing(project.id, selectedWorkspace.id)}
                              />
                            </ListItemSecondaryAction>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                  
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    sx={{ 
                      borderRadius: 2
                    }}
                  >
                    I progetti condivisi saranno visibili e accessibili a tutti i membri del gruppo.
                  </Alert>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedWorkspace.role === 'Proprietario' && (
                <Button 
                  color="error" 
                  sx={{ mr: 'auto' }}
                  startIcon={<DeleteIcon />}
                >
                  Elimina gruppo
                </Button>
              )}
              <Button onClick={() => setWorkspaceDetailDialog(false)}>Chiudi</Button>
              {selectedWorkspace.role === 'Proprietario' && (
                <Button variant="contained">Salva modifiche</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProfileSection;