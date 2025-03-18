import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function AgentsSection() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestione Agenti</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>I tuoi Agenti</Typography>
        <Typography variant="body1">
          In questa sezione puoi configurare e monitorare i singoli agenti del sistema.
        </Typography>
      </Paper>
    </Box>
  );
}

export default AgentsSection;
