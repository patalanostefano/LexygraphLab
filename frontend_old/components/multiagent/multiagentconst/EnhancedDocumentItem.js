// src/components/multiagent/multiagentconst/EnhancedDocumentItem.js

import React, { useContext, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../../../context/ThemeContext';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import UploadIcon from '@mui/icons-material/Upload';

/**
 * Componente migliorato per visualizzare documenti con supporto per anteprima
 * Distingue tra documenti caricati e generati
 */
const EnhancedDocumentItem = ({
  document,
  onDelete,
  onView,
  onEdit,
  onPreview, // AGGIUNTO: Handler specifico per l'anteprima (documenti caricati)
  showActions = true,
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const { theme: themeContext } = useContext(ThemeContext);
  const theme = useTheme();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };
  
  const handleMenuClose = () => setMenuAnchorEl(null);

  // AGGIUNTO: Determina se il documento è generato o caricato
  const isGeneratedDocument = () => {
    return document.isGenerated || 
           document.generatedBy || 
           document.version || 
           document.source === 'agent' ||
           document.type === 'generated';
  };

  // Handler per il click principale
  const handleItemClick = () => {
    if (isGeneratedDocument()) {
      // Per documenti generati, usa onView (ArtifactFullScreenDialog)
      onView?.(document);
    } else {
      // Per documenti caricati, usa onPreview (DocumentPreviewDialog)
      onPreview?.(document);
    }
  };

  const getFileIcon = () => {
    if (!document?.type && !document?.mimeType) return <FileIcon />;
    
    const fileType = (document.type || document.mimeType || '').toLowerCase();
    
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('word') || fileType.includes('document')) return <ArticleIcon color="primary" />;
    if (fileType.includes('image')) return <ImageIcon color="success" />;
    return <FileIcon />;
  };

  // AGGIUNTO: Badge per indicare il tipo di documento
  const getDocumentTypeBadge = () => {
    if (isGeneratedDocument()) {
      return (
        <Chip
          icon={<AutoFixHighIcon />}
          label={document.generatedBy || 'Generato'}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            ml: 1,
            bgcolor: alpha(theme.palette.secondary.main, 0.1),
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main,
            '& .MuiChip-icon': {
              fontSize: '0.8rem'
            }
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={<UploadIcon />}
          label="Caricato"
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            ml: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '& .MuiChip-icon': {
              fontSize: '0.8rem'
            }
          }}
        />
      );
    }
  };

  // AGGIUNTO: Tooltip informativo
  const getTooltipText = () => {
    if (isGeneratedDocument()) {
      return `Documento generato da ${document.generatedBy || 'Agente'}. Clicca per visualizzare nell'editor.`;
    } else {
      return 'Documento caricato. Clicca per visualizzare l\'anteprima.';
    }
  };

  // Formato compatto per liste dense
  if (variant === 'compact') {
    return (
      <Tooltip title={getTooltipText()} arrow>
        <Box
          sx={{
            mb: 1,
            borderRadius: 1,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.4) 
              : alpha(theme.palette.background.paper, 0.6),
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: (onView || onPreview) ? 'pointer' : 'default',
            border: '1px solid',
            borderColor: isGeneratedDocument() 
              ? alpha(theme.palette.secondary.main, 0.3)
              : alpha(theme.palette.primary.main, 0.3),
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6) 
                : alpha(theme.palette.background.paper, 0.8),
              borderColor: isGeneratedDocument() 
                ? theme.palette.secondary.main
                : theme.palette.primary.main,
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            },
            transition: 'all 0.2s ease'
          }}
          onClick={handleItemClick}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {getFileIcon()}
            <Box sx={{ ml: 1, minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 500,
                  noWrap: true,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {document.name}
              </Typography>
            </Box>
            {getDocumentTypeBadge()}
          </Box>

          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Formato standard
  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box
        sx={{
          mb: 1.5,
          borderRadius: 1,
          bgcolor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.background.paper, 0.6),
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: (onView || onPreview) ? 'pointer' : 'default',
          border: '1px solid',
          borderColor: isGeneratedDocument() 
            ? alpha(theme.palette.secondary.main, 0.3)
            : alpha(theme.palette.primary.main, 0.3),
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.8),
            borderColor: isGeneratedDocument() 
              ? theme.palette.secondary.main
              : theme.palette.primary.main,
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          },
          boxShadow: theme.palette.mode === 'dark'
            ? '0 1px 3px rgba(0,0,0,0.2)'
            : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onClick={handleItemClick}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {getFileIcon()}
          <Box sx={{ ml: 1.5, minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 500,
                  noWrap: true,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}
              >
                {document.name}
              </Typography>
              {getDocumentTypeBadge()}
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {typeof document.size === 'number'
                ? `${(document.size / 1024).toFixed(1)} KB`
                : document.size || ''}{' '}
              {document.size && ' • '}
              {document.date || document.createdAt || document.updatedAt ? 
                new Date(document.date || document.createdAt || document.updatedAt).toLocaleDateString() :
                new Date().toLocaleDateString()
              }
              {isGeneratedDocument() && document.version && ` • ${document.version}`}
            </Typography>
          </Box>
        </Box>

        {showActions && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* AGGIUNTO: Pulsante anteprima rapida */}
            <Tooltip title={isGeneratedDocument() ? 'Visualizza nel viewer' : 'Anteprima documento'}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick();
                }}
                sx={{ 
                  mr: 0.5,
                  color: isGeneratedDocument() ? 'secondary.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: isGeneratedDocument() 
                      ? alpha(theme.palette.secondary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <IconButton
              size="small"
              onClick={handleMenuOpen}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Azione di visualizzazione */}
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleItemClick();
                }}
              >
                <ListItemIcon>
                  <VisibilityIcon fontSize="small" color={isGeneratedDocument() ? 'secondary' : 'primary'} />
                </ListItemIcon>
                <Typography variant="body2">
                  {isGeneratedDocument() ? 'Visualizza' : 'Anteprima'}
                </Typography>
              </MenuItem>

              {/* Modifica solo per documenti generati */}
              {onEdit && isGeneratedDocument() && !document.isReadOnly && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    onEdit(document);
                  }}
                >
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Modifica</Typography>
                </MenuItem>
              )}

              {/* Download */}
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Scarica</Typography>
              </MenuItem>

              {/* Elimina */}
              {onDelete && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    onDelete(document.id);
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography variant="body2" color="error">
                    Elimina
                  </Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

export default EnhancedDocumentItem;