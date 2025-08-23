import React from 'react';
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';

// Drawer personalizzato per i documenti
const DocumentDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 380,
    padding: theme.spacing(0),
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

export default DocumentDrawer;
