import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

import AgentActivityPanel from './AgentActivityPanel';
import ArtifactViewer from './ArtifactViewer';
import LexychainPanel from './LexychainPanel';
import PromptInputArea from './PromptInputArea';
import ArtifactFullScreenDialog from '../../DocumentComponents/ArtifactFullScreenDialog';

/**
 * Layout principale per la modalità "work" con supporto per messaggi multi-agente
 * AGGIORNATO: Aggiunto supporto per l'anteprima dei documenti caricati
 */
export default function WorkspaceLayout({
  project,
  documents = [],
  messages = [],
  isProcessing = false,
  artifact = null,
  activities = [],
  selectedAgents = [],
  onReturnToProjects,
  onPromptChange = () => {},
  onSendPrompt = () => {},
  onAgentMention = () => {},
  onUploadDocument = () => {},
  onDownloadArtifact = () => {},
  onEditArtifact = () => {},
  onRestoreActivity = () => {},
  onDeleteDocument = () => {},
  onDocumentPreview = () => {} // AGGIUNTO: Handler per l'anteprima documenti
}) {
  const [isFullScreenViewerOpen, setIsFullScreenViewerOpen] = useState(false);
  const [error, setError] = useState(null);

  // Verificare solo se c'è un errore critico che impedisce il funzionamento
  useEffect(() => {
    setError(null);

    // Verifica che il progetto esista
    if (!project) {
      setError("Errore: Nessun progetto selezionato");
    }
  }, [project]);

  // Renderizza lo stato di errore solo in caso di problemi critici
  if (error) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%'
      }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Si è verificato un errore durante il caricamento del progetto.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={onReturnToProjects}>
            Torna ai Progetti
          </Button>
        </Box>
      </Box>
    );
  }

  // Gestione invio messaggi con supporto per messaggi strutturati per agenti
  const handleSendPrompt = (text, agentMessages = []) => {
    // Passa sia il testo completo che i messaggi specifici per agente alla funzione genitore
    onSendPrompt(text, agentMessages);
  };

  // AGGIUNTO: Filtra i documenti per mostrare solo quelli caricati nel drawer
  // e quelli generati nell'ArtifactViewer
  const uploadedDocuments = documents.filter(doc => {
    // Un documento è considerato "caricato" se:
    // - NON ha il flag isGenerated
    // - NON ha generatedBy
    // - NON ha version (tipico dei documenti generati)
    // - HA uploadedAt o è stato creato tramite upload
    return !doc.isGenerated && 
           !doc.generatedBy && 
           !doc.version && 
           (doc.uploadedAt || doc.source !== 'agent');
  });

  // AGGIUNTO: Filtra l'artifact per mostrare solo documenti generati
  const isGeneratedArtifact = artifact && (
    artifact.isGenerated === true ||
    artifact.generatedBy ||
    artifact.version ||
    artifact.source === 'agent' ||
    artifact.type === 'generated' ||
    (artifact.content && !artifact.uploadedAt)
  );

  // Renderizza il layout normale
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      p: 1 // Padding ridotto per più spazio ai contenuti
    }}>
      {/* Area principale: attività agenti + artifact/Lexychain */}
      <Box sx={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        gap: 1.5 // Spazio uniforme tra i pannelli, leggermente ridotto
      }}>
        {/* Sinistra: agent activity */}
        <Box sx={{
          width: { xs: '100%', md: '45%' },
          overflow: 'hidden',
          display: 'flex'
        }}>
          <AgentActivityPanel
            messages={messages}
            isProcessing={isProcessing}
            selectedAgents={selectedAgents}
            onReturn={onReturnToProjects}
            projectName={project?.name}
          />
        </Box>

        {/* Destra: artifact + Lexychain */}
        <Box
          sx={{
            width: { xs: '0', md: '55%' },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            overflow: 'hidden',
            gap: 1 // Spazio ridotto per dare più spazio ai contenuti
          }}
        >
          {/* MODIFICATO: Passa solo documenti generati all'ArtifactViewer */}
          <ArtifactViewer
            artifact={isGeneratedArtifact ? artifact : null}
            onFullScreenView={() => setIsFullScreenViewerOpen(true)}
          />
          <LexychainPanel
            activities={activities}
            onRestore={onRestoreActivity}
          />
        </Box>
      </Box>

      {/* Area input in basso - AGGIORNATO: Aggiunto onDocumentPreview */}
      <Box sx={{ mt: 1.5 }}>
        <PromptInputArea
          selectedAgents={selectedAgents}
          onPromptChange={onPromptChange}
          onSendPrompt={handleSendPrompt}
          onAgentMention={onAgentMention}
          onUploadDocument={onUploadDocument}
          documents={uploadedDocuments} // MODIFICATO: Passa solo documenti caricati
          onDeleteDocument={onDeleteDocument}
          onDocumentPreview={onDocumentPreview} // AGGIUNTO: Handler per anteprima
        />
      </Box>

      {/* Visualizzatore a schermo intero - MODIFICATO: Solo per documenti generati */}
      {isGeneratedArtifact && (
        <ArtifactFullScreenDialog
          open={isFullScreenViewerOpen}
          onClose={() => setIsFullScreenViewerOpen(false)}
          artifact={artifact}
          onEdit={onEditArtifact}
        />
      )}
    </Box>
  );
}