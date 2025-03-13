import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function AliSection() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>ALI</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Interfaccia ALI</Typography>
        <Typography variant="body1">
          Gestisci e configura ALI, l'intelligenza artificiale legale integrata in Valis.
        </Typography>
      </Paper>
    </Box>
  );
}

export default AliSection;
