import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  useMediaQuery,
  alpha,
  IconButton,
  Tooltip,
  Container,
  Fade,
  styled,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
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
  width: 46, 
  height: 46, 
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
    fontSize: 22,
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

// Componente pulsante futuristico con bordi luminosi - versione aggiornata
const FuturisticButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  padding: '16px 48px',
  fontSize: '1.4rem',
  fontWeight: 700,
  letterSpacing: '0.8px',
  textTransform: 'none',
  color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#7C4DFF',
  background: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.7) : alpha('#FFFFFF', 0.9),
  border: 'none',
  borderRadius: '18px',
  overflow: 'hidden',
  minWidth: '220px',
  minHeight: '64px',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '18px',
    padding: '2px',
    background: 'linear-gradient(45deg, #7C4DFF, #956AFF, #B79CFF, #956AFF, #7C4DFF)',
    backgroundSize: '300% 300%',
    animation: 'borderAnimation 8s linear infinite',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: 0.6,
    transition: 'all 0.4s ease',
  },
  
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: '3px',
    borderRadius: '16px',
    zIndex: -1,
    transition: 'all 0.4s ease',
  },
  
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 10px 25px -5px rgba(124, 77, 255, 0.4)' 
      : '0 10px 25px -5px rgba(124, 77, 255, 0.25)',
    
    '& .button-glow': {
      opacity: 0.9,
      transform: 'scale(1.2)',
    },
    
    '& .button-scanner': {
      opacity: 0.8,
      transform: 'translateX(120%)',
    },
    
    '&::before': {
      opacity: 1,
      boxShadow: '0 0 15px rgba(124, 77, 255, 0.5)',
      animation: 'borderAnimation 3s linear infinite',
    },
  },
  
  '&:active': {
    transform: 'translateY(-1px) scale(0.98)',
    '& .button-glow': {
      opacity: 1,
      transform: 'scale(0.9)',
    },
  },
  
  '@keyframes borderAnimation': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

// Styled Card for project panels
const ProjectCard = styled(Card)(({ theme }) => ({
  height: '500px',
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#1C1C3C', 0.8) : alpha('#FFFFFF', 0.95),
  backdropFilter: 'blur(10px)',
  border: `2px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.2)}`,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 32px rgba(154, 124, 255, 0.2)' 
      : '0 8px 32px rgba(124, 77, 255, 0.15)',
    transform: 'translateY(-2px)',
  }
}));

// Action Button for projects
const ActionButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: '8px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.5) : alpha('#7C4DFF', 0.5)}`,
  borderRadius: '8px',
  color: theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF',
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.1) : alpha('#7C4DFF', 0.1),
    borderColor: theme.palette.mode === 'dark' ? '#9A7CFF' : '#7C4DFF',
    transform: 'translateY(-1px)',
  }
}));

// Project Manager Component integrated with Material-UI
const ProjectManager = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([
    { id: 1, name: 'Project 1', documents: ['Document name', 'Document name 2', 'Document name3'] },
    { id: 2, name: 'Project 2', documents: [] }
  ]);
  
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newDocName, setNewDocName] = useState('');

  const createProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: projects.length + 1,
        name: newProjectName,
        documents: []
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
    }
  };

  const addDocument = () => {
    if (newDocName.trim() && selectedProject) {
      const updatedProjects = projects.map(project =>
        project.id === selectedProject.id
          ? { ...project, documents: [...project.documents, newDocName] }
          : project
      );
      setProjects(updatedProjects);
      setSelectedProject({
        ...selectedProject,
        documents: [...selectedProject.documents, newDocName]
      });
      setNewDocName('');
    }
  };

  const openProject = (project) => {
    setSelectedProject(project);
  };

  return (
    <Box sx={{ display: 'flex', gap: 4, width: '100%', maxWidth: '1200px' }}>
      {/* Left Panel - Projects */}
      <ProjectCard sx={{ flex: 1 }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <FolderOpenIcon sx={{ color: theme.palette.primary.main }} />
              Projects
            </Typography>
            <ActionButton onClick={createProject} startIcon={<AddIcon />}>
              Create project
            </ActionButton>
          </Box>
          
          <TextField
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name"
            onKeyPress={(e) => e.key === 'Enter' && createProject()}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.05) : alpha('#000000', 0.02),
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.3),
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.5) : alpha('#7C4DFF', 0.5),
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List sx={{ padding: 0 }}>
              {projects.map((project, index) => (
                <React.Fragment key={project.id}>
                  <ListItem 
                    sx={{ 
                      borderRadius: '12px',
                      mb: 1,
                      backgroundColor: selectedProject?.id === project.id 
                        ? alpha(theme.palette.primary.main, 0.1) 
                        : 'transparent',
                      border: `1px solid ${
                        selectedProject?.id === project.id 
                          ? alpha(theme.palette.primary.main, 0.3)
                          : alpha(theme.palette.divider, 0.5)
                      }`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    <ListItemText 
                      primary={project.name}
                      primaryTypographyProps={{
                        fontWeight: selectedProject?.id === project.id ? 600 : 400,
                        color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B'
                      }}
                    />
                    <ListItemSecondaryAction>
                      <ActionButton 
                        onClick={() => openProject(project)}
                        size="small"
                      >
                        Open
                      </ActionButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < projects.length - 1 && <Divider sx={{ my: 1, opacity: 0.3 }} />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </CardContent>
      </ProjectCard>

      {/* Right Panel - Project Details */}
      <ProjectCard sx={{ flex: 1 }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <DescriptionIcon sx={{ color: theme.palette.primary.main }} />
              {selectedProject?.name || 'Select a project'}
            </Typography>
            <ActionButton onClick={addDocument} startIcon={<AddIcon />}>
              Add doc
            </ActionButton>
          </Box>

          {selectedProject && (
            <>
              <TextField
                fullWidth
                variant="outlined"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="New document name"
                onKeyPress={(e) => e.key === 'Enter' && addDocument()}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.05) : alpha('#000000', 0.02),
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.3) : alpha('#7C4DFF', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? alpha('#9A7CFF', 0.5) : alpha('#7C4DFF', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List sx={{ padding: 0 }}>
                  {selectedProject.documents.map((doc, index) => (
                    <React.Fragment key={index}>
                      <ListItem 
                        sx={{ 
                          borderRadius: '12px',
                          mb: 1,
                          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                          }
                        }}
                      >
                        <ListItemText 
                          primary={doc}
                          primaryTypographyProps={{
                            color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#14142B'
                          }}
                        />
                        {index === 0 && (
                          <ListItemSecondaryAction>
                            <ActionButton size="small">
                              Open
                            </ActionButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {index < selectedProject.documents.length - 1 && <Divider sx={{ my: 1, opacity: 0.3 }} />}
                    </React.Fragment>
                  ))}
                  {selectedProject.documents.length === 0 && (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: alpha(theme.palette.text.primary, 0.6)
                    }}>
                      <Typography variant="body2">
                        No documents yet. Add your first document above.
                      </Typography>
                    </Box>
                  )}
                </List>
              </Box>
            </>
          )}
        </CardContent>
      </ProjectCard>
    </Box>
  );
};

// Componente per il pulsante Inizia con effetti avanzati
const DynamicStartButton = ({ onClick, isTransitioning }) => {
  const theme = useTheme();
  const [animation, setAnimation] = useState(false);
  const buttonRef = useRef(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimation(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (animation && buttonRef.current) {
      buttonRef.current.animate([
        { transform: 'scale(0.9)', opacity: 0.7 },
        { transform: 'scale(1.05)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1 }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fill: 'forwards'
      });
    }
  }, [animation]);
  
  const handleClick = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - radius;
    const y = e.clientY - rect.top - radius;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'ripple 0.6s linear';
    circle.style.pointerEvents = 'none';
    
    button.appendChild(circle);
    
    if (onClick) onClick(e);
  };
  
  return (
    <Box sx={{ 
      position: 'relative',
      ...(isTransitioning && {
        animation: 'buttonExit 0.6s forwards cubic-bezier(0.65, 0, 0.35, 1)',
        '@keyframes buttonExit': {
          '0%': { 
            transform: 'scale(1) translateY(0)', 
            opacity: 1 
          },
          '60%': { 
            transform: 'scale(1.1) translateY(-10px)', 
            opacity: 0.7
          },
          '100%': { 
            transform: 'scale(0.9) translateY(-20px)', 
            opacity: 0 
          },
        }
      })
    }}>
      <Box
        className="button-glow"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '180px',
          height: '180px',
          transform: 'translate(-50%, -50%) scale(0.9)',
          borderRadius: '50%',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle, rgba(124, 77, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)'
            : 'radial-gradient(circle, rgba(124, 77, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
          opacity: 0.5,
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          filter: 'blur(8px)',
          zIndex: 0,
        }}
      />
      
      <FuturisticButton
        ref={buttonRef}
        onClick={handleClick}
        disableRipple
      >
        <Box
          className="button-scanner"
          sx={{
            position: 'absolute',
            top: 0,
            left: '-50%',
            width: '30%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
            transform: 'translateX(-100%)',
            opacity: 0.5,
            transition: 'transform 0.8s ease, opacity 0.3s ease',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
        
        <Typography 
          sx={{ 
            position: 'relative',
            zIndex: 2,
            fontWeight: 700,
            textShadow: theme.palette.mode === 'dark' 
              ? '0 0 10px rgba(124, 77, 255, 0.6)' 
              : 'none',
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          Inizia
        </Typography>
        
        {animation && [...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.6)' 
                : 'rgba(124, 77, 255, 0.6)',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(1px)',
              opacity: Math.random() * 0.5 + 0.3,
              animation: `float${i} ${Math.random() * 3 + 2}s infinite ease-in-out`,
              zIndex: 1,
              '@keyframes float0': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(5px, -5px)' },
              },
              '@keyframes float1': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(-7px, -3px)' },
              },
              '@keyframes float2': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(5px, 5px)' },
              },
              '@keyframes float3': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(-5px, 5px)' },
              },
              '@keyframes float4': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(8px, -2px)' },
              },
              '@keyframes float5': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(-6px, -2px)' },
              },
            }}
          />
        ))}
        
        <Box sx={{
          '@keyframes ripple': {
            to: {
              opacity: 0,
              transform: 'scale(3)',
            },
          },
        }} />
      </FuturisticButton>
    </Box>
  );
};

// Componente per l'effetto di transizione pagina
const PageTransition = styled(Box)(({ theme, active }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: active ? 'all' : 'none',
  zIndex: 9999,
  opacity: active ? 1 : 0,
  transition: 'opacity 0.3s ease',
}));

// Effetto circolare che si espande
const CircleExpand = styled(Box)(({ theme, active, originX, originY }) => ({
  position: 'absolute',
  top: originY || '50%',
  left: originX || '50%',
  width: active ? '300vw' : '0',
  height: active ? '300vh' : '0',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #7C4DFF, #956AFF)',
  transform: 'translate(-50%, -50%)',
  transition: active 
    ? 'all 1.5s cubic-bezier(0.19, 1, 0.22, 1)' 
    : 'all 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  boxShadow: active 
    ? '0 0 100px 50px rgba(124, 77, 255, 0.3)' 
    : 'none',
}));

function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState({ x: '50%', y: '50%' });
  const [showProjectManager, setShowProjectManager] = useState(false);
  
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
    if (hour >= 0 && hour < 5) return "Ciao, nottambulo";
    if (hour >= 5 && hour < 7) return "Ciao, mattiniero";
    if (hour >= 7 && hour < 12) return "Buongiorno";
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

  // Handler for navigation to multiagent con transizione
  const handleNavigateToMultiagent = (e) => {
    if (e && e.clientX && e.clientY) {
      setTransitionOrigin({ 
        x: `${e.clientX}px`, 
        y: `${e.clientY}px` 
      });
    }
    
    setTransitioning(true);
    
    setTimeout(() => {
      navigate('/multiagente');
    }, 800);
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToGuide = () => {
    navigate('/guida');
  };

  // Handler per mostrare/nascondere il Project Manager
  const handleShowProjects = () => {
    setShowProjectManager(!showProjectManager);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
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
      {/* Componente di transizione pagina */}
      <PageTransition active={transitioning}>
        <CircleExpand 
          active={transitioning} 
          originX={transitionOrigin.x} 
          originY={transitionOrigin.y} 
        />
      </PageTransition>
      
      {/* Background particle pattern con effetto parallax */}
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
          : 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23B39DDB\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
        animation: 'backgroundAnimation 120s linear infinite',
        '@keyframes backgroundAnimation': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        ...(transitioning && {
          animation: 'fadeBackground 0.8s forwards',
          '@keyframes fadeBackground': {
            to: { opacity: 0 }
          }
        })
      }} />
      
      {/* Effetto glow animato */}
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        width: '80vw', 
        height: '80vh', 
        borderRadius: '50%', 
        transform: 'translate(-50%, -50%)', 
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(124, 77, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)' 
          : 'radial-gradient(circle, rgba(124, 77, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
        zIndex: 0,
        animation: 'glow 8s ease-in-out infinite alternate',
        '@keyframes glow': {
          '0%': { 
            opacity: 0.5,
            transform: 'translate(-50%, -50%) scale(0.9)',
          },
          '100%': { 
            opacity: 0.8,
            transform: 'translate(-50%, -50%) scale(1.1)',
          },
        },
        ...(transitioning && {
          animation: 'fadeGlow 0.8s forwards',
          '@keyframes fadeGlow': {
            to: { opacity: 0 }
          }
        })
      }} />
      
      {/* Header con Logo e Controlli */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        ...(transitioning && {
          animation: 'fadeOut 0.5s forwards',
          '@keyframes fadeOut': {
            to: { 
              opacity: 0,
              transform: 'translateY(-20px)'
            }
          }
        })
      }}>
        <ValisLogo theme={theme} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Gestisci Progetti" arrow>
            <HeaderActionButton onClick={handleShowProjects}>
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
      </Box>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ 
        position: 'relative', 
        zIndex: 2, 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        ...(transitioning && {
          animation: 'contentExit 0.8s forwards cubic-bezier(0.19, 1, 0.22, 1)',
          '@keyframes contentExit': {
            '0%': { 
              opacity: 1,
              transform: 'scale(1)'
            },
            '100%': { 
              opacity: 0,
              transform: 'scale(0.95)'
            }
          }
        })
      }}>
        <Box component="main" sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%'
        }}>
          {showProjectManager ? (
            // Project Manager View
            <Fade in={!transitioning} timeout={1000}>
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: '1200px'
                }}>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                      letterSpacing: '-0.02em',
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                        : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    Gestione Progetti
                  </Typography>
                  <ActionButton onClick={handleShowProjects}>
                    Torna al Dashboard
                  </ActionButton>
                </Box>
                <ProjectManager />
              </Box>
            </Fade>
          ) : (
            // Welcome View
            <>
              <Fade in={!transitioning} timeout={1000}>
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

              <Fade in={!transitioning} timeout={1500}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  my: 4,
                  position: 'relative'
                }}>
                  <DynamicStartButton onClick={handleNavigateToMultiagent} isTransitioning={transitioning} />
                </Box>
              </Fade>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Dashboard;