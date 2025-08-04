// src/components/multiagent/multiagentconst/main/Multiagent.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Snackbar, 
  Alert, 
 
} from '@mui/material';
import { ThemeContext } from '../../../../context/ThemeContext';
import { getSupabaseClient } from '../../../../config/supabaseClient';
import { collectionsApi, documentsApi } from '../../../../api/api';
import { useNavigate } from 'react-router-dom'; // AGGIUNTO: Per navigazione

// Import dai componenti main
import ProjectSection from './ProjectSection';
import WorkspaceLayout from './WorkspaceLayout';

// Import dai componenti parent
import {
  EditProjectDialog,
  DeleteConfirmDialog,
} from '../';

// Import diretto di NewProjectDialog dal suo file originale
import NewProjectDialog from '../../ProjectComponents/NewProjectDialog';

// Import delle funzioni per documento con path corretti
import { downloadWordDocument, generateWordDocument, convertToWordCompatibleHTML, DocumentTitleGenerator } from '../../utils';
import { DocumentEditorDialog } from '../../DocumentComponents/DocumentEditorDialog';
import { ArtifactFullScreenDialog } from '../../DocumentComponents/ArtifactFullScreenDialog';

// AGGIUNTO: Import del nuovo DocumentPreviewDialog
import DocumentPreviewDialog from '../../DocumentComponents/DocumentPreviewDialog';

// Helper per gestire la persistenza locale
const PROJECTS_STORAGE_KEY = 'multiagent_projects';

// Funzione helper per ottenere la chiave di storage per l'utente corrente
const getUserProjectsKey = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ? `${PROJECTS_STORAGE_KEY}_${user.id}` : PROJECTS_STORAGE_KEY;
  } catch (error) {
    console.error('Error getting user for storage key:', error);
    return PROJECTS_STORAGE_KEY;
  }
};

// Helper per mappare collezioni backend a progetti frontend
const collectionToProject = (collection) => ({
  id: collection.id,
  name: collection.name,
  client: collection.description || '', // Usa description come client name
  date: new Date(collection.createdAt).toLocaleDateString(),
  documents: collection.documents || [],
  collectionId: collection.id // Mantieni riferimento alla collezione
});

// Helper per mappare progetti frontend a collezioni backend
const projectToCollection = (project) => ({
  name: project.name,
  description: project.client || '' // Usa client come description
});

// AGGIUNTO: Helper per marcare i documenti come caricati o generati
const markDocumentAsUploaded = (document) => ({
  ...document,
  isGenerated: false,
  uploadedAt: document.uploadedAt || new Date().toISOString(),
  source: 'upload'
});

const markDocumentAsGenerated = (document, generatedBy = 'Valis') => ({
  ...document,
  isGenerated: true,
  generatedBy: generatedBy,
  source: 'agent',
  version: document.version || 'v1'
});

function Multiagent() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate(); // AGGIUNTO: Hook per navigazione

  // Stati principali
  const [pageMode, setPageMode] = useState('select'); // 'select' | 'work'
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Stato per i dialoghi
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isDocumentEditorOpen, setIsDocumentEditorOpen] = useState(false);
  const [isFullScreenViewerOpen, setIsFullScreenViewerOpen] = useState(false);
  
  // AGGIUNTO: Stato per il dialog di anteprima documenti
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [documentToPreview, setDocumentToPreview] = useState(null);
  
  // Stato per la selezione di progetto/collezione
  const [selectedProject, setSelectedProject] = useState(null);
 
  // Stato per la modifica/eliminazione di progetti e collezioni
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  
  // Stato per la ricerca
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  
  // Stato per la gestione degli agenti e dei documenti nella modalità work
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  const [activities, setActivities] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [artifactVersions, setArtifactVersions] = useState({});

  useEffect(() => {
    const loadUserProjects = async () => {
      try {
        // Carica collezioni dal backend
        const response = await collectionsApi.getCollections(1, 50);
        
        if (response.collections) {
          // Converti collezioni in progetti
          const projectsFromCollections = response.collections.map(collectionToProject);
          
          // Carica i documenti per ogni collezione
          const projectsWithDocuments = await Promise.all(
            projectsFromCollections.map(async (project) => {
              try {
                const docsResponse = await collectionsApi.getCollectionDocuments(project.collectionId);
                
                // MODIFICATO: Marca tutti i documenti caricati dal backend come "uploaded"
                const markedDocuments = (docsResponse.documents || []).map(doc => 
                  markDocumentAsUploaded(doc)
                );
                
                return {
                  ...project,
                  documents: markedDocuments
                };
              } catch (error) {
                console.error(`Error loading documents for collection ${project.collectionId}:`, error);
                return project;
              }
            })
          );
          
          setProjects(projectsWithDocuments);
          
          // Salva in localStorage per accesso offline
          const storageKey = await getUserProjectsKey();
          localStorage.setItem(storageKey, JSON.stringify(projectsWithDocuments));
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        
        // Fallback a localStorage se API fallisce
        const storageKey = await getUserProjectsKey();
        const cachedProjects = localStorage.getItem(storageKey);
        if (cachedProjects) {
          setProjects(JSON.parse(cachedProjects));
        }
      }
    };

    loadUserProjects();
    
    // Inizializzazione degli agenti e messaggi di esempio
    setMessages([
      { type: 'user', content: 'Puoi prepararmi un contratto di locazione?', timestamp: new Date(), agent: null },
      { type: 'agent', content: 'Certo, posso aiutarti a preparare un contratto di locazione. Per procedere, avrei bisogno di alcune informazioni essenziali:\n\n1. Dati del locatore (proprietario)\n2. Dati del conduttore (inquilino)\n3. Indirizzo dell\'immobile\n4. Durata del contratto\n5. Importo del canone mensile\n6. Modalità di pagamento\n7. Deposito cauzionale\n\nVuoi fornirmi queste informazioni o preferisci che ti mostri un modello standard che potrai personalizzare in seguito?', timestamp: new Date(), agent: 'assistente' }
    ]);
    
    const mockAgents = [
      { id: 'agent1', name: 'Assistente Legale', role: 'legal' },
      { id: 'agent2', name: 'Ricercatore', role: 'researcher' },
      { id: 'agent3', name: 'Redattore', role: 'editor' }
    ];
    setSelectedAgents([mockAgents[0]]);
    
    // Inizializza activities vuote
    setActivities([]);
    setArtifactVersions({});
  }, []);
  

  // Handler per i progetti
  const handleSelectProject = (project) => {
    try {
      // Verifica che il progetto abbia gli attributi necessari
      if (!project || !project.id) {
        throw new Error("Progetto non valido o mancante di attributi essenziali");
      }
      
      // Imposta il progetto selezionato
      setSelectedProject(project);
      
      // MODIFICATO: Imposta come artifact corrente solo documenti generati
      if (project.documents && project.documents.length > 0) {
        const generatedDocs = project.documents.filter(doc => doc.isGenerated || doc.generatedBy);
        
        if (generatedDocs.length > 0) {
          const latestDoc = generatedDocs[0];
          // Verifica se esiste una versione più recente nell'archivio
          const docVersions = artifactVersions[latestDoc.id];
          if (docVersions) {
            // Trova la versione più recente
            const versions = Object.keys(docVersions).sort();
            const latestVersion = versions[versions.length - 1];
            setCurrentArtifact(docVersions[latestVersion]);
          } else {
            setCurrentArtifact(latestDoc);
          }
        } else {
          setCurrentArtifact(null); // Nessun documento generato
        }
      } else {
        setCurrentArtifact(null);
      }
      
      // Cambia la modalità in 'work'
      setPageMode('work');
    } catch (error) {
      console.error("Errore nella selezione del progetto:", error);
      setNotification({
        open: true,
        message: `Errore nell'apertura del progetto: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCreateProjectClick = () => {
    setIsProjectDialogOpen(true);
  };

  const handleCloseProjectDialog = () => {
    setIsProjectDialogOpen(false);
  };

  const handleReturnToDashboard = () => {
    setPageMode('select');
    setIsProjectDialogOpen(false);
  };

  // AGGIUNTO: Handler per navigazione al profilo
  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  // AGGIUNTO: Handler per l'anteprima dei documenti caricati
  const handleDocumentPreview = (document) => {
    console.log('Opening document preview for:', document);
    setDocumentToPreview(document);
    setIsDocumentPreviewOpen(true);
  };

  // AGGIUNTO: Handler per chiudere l'anteprima
  const handleCloseDocumentPreview = () => {
    setIsDocumentPreviewOpen(false);
    setDocumentToPreview(null);
  };

  const handleCreateProject = async (newProject) => {
    try {
      // Valida i dati del progetto
      if (!newProject.name || newProject.name.trim() === '') {
        throw new Error('Il nome del progetto è obbligatorio');
      }
      
      console.log('Creating project with data:', {
        name: newProject.name.trim(),
        description: newProject.client?.trim() || ''
      });
      
      // Crea una collezione nel backend
      const collection = await collectionsApi.createCollection(
        newProject.name.trim(),
        newProject.client?.trim() || ''
      );
      
      console.log('Collection created:', collection);
      
      // Converti la collezione in progetto
      const createdProject = collectionToProject(collection);
      
      // Se ci sono documenti da caricare
      if (newProject.documents && newProject.documents.length > 0) {
        for (const doc of newProject.documents) {
          if (doc.file) {
            try {
              console.log('Uploading document to collection:', collection.id);
              const uploadedDoc = await documentsApi.uploadDocument(doc.file, {
                name: doc.name,
                collectionId: collection.id
              });
              
              if (uploadedDoc && uploadedDoc.id) {
                // MODIFICATO: Marca il documento come caricato
                const markedDoc = markDocumentAsUploaded(uploadedDoc);
                createdProject.documents.push(markedDoc);
              }
            } catch (uploadError) {
              console.error('Error uploading document:', uploadError);
              // Continua con gli altri documenti anche se uno fallisce
            }
          } else if (doc.id) {
            try {
              // È un documento esistente da collegare
              await collectionsApi.addDocumentToCollection(collection.id, doc.id);
              // MODIFICATO: Marca come caricato se non ha già i flag
              const markedDoc = doc.isGenerated ? doc : markDocumentAsUploaded(doc);
              createdProject.documents.push(markedDoc);
            } catch (linkError) {
              console.error('Error linking document:', linkError);
            }
          }
        }
      }
      
      // Aggiorna stato locale
      setProjects(prevProjects => [...prevProjects, createdProject]);
      
      // Salva in localStorage
      const storageKey = await getUserProjectsKey();
      const allProjects = [...projects, createdProject];
      localStorage.setItem(storageKey, JSON.stringify(allProjects));
      
      setIsProjectDialogOpen(false);
      setNotification({
        open: true,
        message: `Progetto "${newProject.name}" creato con successo`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setNotification({
        open: true,
        message: `Errore nella creazione del progetto: ${errorMessage}`,
        severity: 'error'
      });
    }
  };
  
  const handleEditProject = (project, event) => {
    if (event) {
      event.stopPropagation();
    }
    setProjectToEdit(project);
    setIsEditProjectDialogOpen(true);
  };
  
  const handleUpdateProject = async (updatedProject) => {
    try {
      // Aggiorna la collezione nel backend
      await collectionsApi.updateCollection(updatedProject.collectionId || updatedProject.id, {
        name: updatedProject.name,
        description: updatedProject.client
      });
      
      // Aggiorna stato locale
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      
      // Aggiorna localStorage
      const storageKey = await getUserProjectsKey();
      const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem(storageKey, JSON.stringify(updatedProjects));
      
      setIsEditProjectDialogOpen(false);
      setNotification({
        open: true,
        message: `Progetto "${updatedProject.name}" aggiornato`,
        severity: 'success'
      });
      
      if (selectedProject && selectedProject.id === updatedProject.id) {
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setNotification({
        open: true,
        message: `Errore nell'aggiornamento: ${errorMessage}`,
        severity: 'error'
      });
    }
  };
  
  const handleDeleteProject = (project, event) => {
    if (event) {
      event.stopPropagation();
    }
    setProjectToDelete(project);
    setIsDeleteConfirmDialogOpen(true);
  };
  
  const handleConfirmDeleteProject = async () => {
    if (projectToDelete) {
      try {
        // Elimina la collezione dal backend
        await collectionsApi.deleteCollection(projectToDelete.collectionId || projectToDelete.id);
        
        // Aggiorna stato locale
        setProjects(prevProjects => 
          prevProjects.filter(p => p.id !== projectToDelete.id)
        );
        
        // Aggiorna localStorage
        const storageKey = await getUserProjectsKey();
        const remainingProjects = projects.filter(p => p.id !== projectToDelete.id);
        localStorage.setItem(storageKey, JSON.stringify(remainingProjects));
        
        setNotification({
          open: true,
          message: `Progetto "${projectToDelete.name}" eliminato`,
          severity: 'info'
        });
        
        if (selectedProject && selectedProject.id === projectToDelete.id) {
          setPageMode('select');
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        setNotification({
          open: true,
          message: `Errore nell'eliminazione: ${errorMessage}`,
          severity: 'error'
        });
      }
    }
    setIsDeleteConfirmDialogOpen(false);
  };
  

  // Handler per il workspace
  const handleReturn = () => {
    setPageMode('select');
    setIsProcessing(false);
  };
  
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };
  
  const handleSendPrompt = () => {
    if (!promptText.trim()) return;
    
    // Aggiungi il messaggio dell'utente alla conversazione
    setMessages(prevMessages => [
      ...prevMessages,
      {
        type: 'user',
        content: promptText,
        timestamp: new Date(),
        agent: null
      }
    ]);
    
    // Simula l'elaborazione
    setIsProcessing(true);
    
    // Simula una risposta dell'agente dopo un breve ritardo
    setTimeout(() => {
      // Aggiungi la risposta dell'agente
      setMessages(prevMessages => [
        ...prevMessages,
        {
          type: 'agent',
          content: `Ecco la risposta alla tua richiesta: "${promptText}". Ho analizzato le informazioni e preparato una bozza iniziale. Posso modificarla ulteriormente in base alle tue esigenze specifiche.`,
          timestamp: new Date(),
          agent: selectedAgents[0]?.name || 'Assistente'
        }
      ]);
      
      setIsProcessing(false);
      
      // Genera un artifact di esempio se l'utente lo richiede
      if (promptText.toLowerCase().includes('genera') || promptText.toLowerCase().includes('crea documento')) {
        // Genera un nuovo ID unico per l'artifact
        const artifactId = `artifact-${Date.now()}`;
        const timestamp = new Date().toISOString();
        
        // MODIFICATO: Crea l'artifact come documento generato
        const newArtifact = markDocumentAsGenerated({
          id: artifactId,
          name: 'Documento generato.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 123456, // ~ 123 KB
          date: timestamp,
          content: 'Contenuto del documento generato dagli agenti in base alla richiesta dell\'utente.\n\nQuesto documento include tutte le clausole standard per il tipo di contratto richiesto, personalizzate in base alle informazioni fornite.',
          version: 'v1'
        }, selectedAgents[0]?.name || 'Valis');
        
        // Imposta come artifact corrente
        setCurrentArtifact(newArtifact);
        
        // Aggiungi al progetto
        if (selectedProject) {
          const updatedProject = {
            ...selectedProject,
            documents: [newArtifact, ...(selectedProject.documents || [])]
          };
          
          setSelectedProject(updatedProject);
          
          // Aggiorna anche nella lista generale dei progetti
          setProjects(prevProjects => 
            prevProjects.map(p => p.id === selectedProject.id ? updatedProject : p)
          );
        }
        
        // Aggiungi all'archivio delle versioni
        setArtifactVersions(prev => ({
          ...prev,
          [artifactId]: {
            'v1': newArtifact
          }
        }));
        
        // Aggiungi un'attività alla Lexychain
        setActivities(prevActivities => [
          {
            id: `act-${Date.now()}`,
            status: 'editing',
            description: 'Generazione di un nuovo documento',
            timestamp: new Date().toLocaleString(),
            documentId: artifactId,
            version: 'v1',
            agent: { name: selectedAgents[0]?.name || 'Valis' }
          },
          ...prevActivities
        ]);
      }
    }, 1500);
    
    // Pulisci l'input
    setPromptText('');
  };
  
  const handleAgentMention = (agent) => {
    // Aggiungi o rimuovi un agente dalla selezione
    setSelectedAgents(prevAgents => {
      const isAlreadySelected = prevAgents.some(a => a.id === agent.id);
      
      if (isAlreadySelected) {
        return prevAgents.filter(a => a.id !== agent.id);
      } else {
        return [...prevAgents, agent];
      }
    });
  };
  
  const handleUploadDocument = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const uploadedDocs = [];
      
      for (const file of Array.from(files)) {
        try {
          // Assicurati di avere il collectionId corretto
          const collectionId = selectedProject?.collectionId || selectedProject?.id;
          console.log('Uploading to collection:', collectionId);
          
          if (!collectionId) {
            throw new Error('No collection ID available for upload');
          }
          
          // Carica il documento nel backend
          const uploadedDoc = await documentsApi.uploadDocument(file, {
            name: file.name,
            collectionId: collectionId
          });
          
          // MODIFICATO: Marca il documento come caricato
          const markedDoc = markDocumentAsUploaded(uploadedDoc);
          uploadedDocs.push(markedDoc);
        } catch (uploadError) {
          console.error('Error uploading file:', file.name, uploadError);
          // Continua con gli altri file anche se uno fallisce
        }
      }
      
      // Aggiorna il progetto locale con i nuovi documenti
      if (pageMode === 'work' && selectedProject && uploadedDocs.length > 0) {
        const updatedProject = {
          ...selectedProject,
          documents: [...uploadedDocs, ...(selectedProject.documents || [])]
        };
        
        setSelectedProject(updatedProject);
        
        // Aggiorna anche nella lista generale e in localStorage
        setProjects(prevProjects => 
          prevProjects.map(p => p.id === selectedProject.id ? updatedProject : p)
        );
        
        const storageKey = await getUserProjectsKey();
        const allProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p);
        localStorage.setItem(storageKey, JSON.stringify(allProjects));
        
        // NON impostare documenti caricati come artifact corrente
        // L'artifact deve rimanere vuoto o contenere solo documenti generati
        
        // Aggiungi attività alla Lexychain
        for (const doc of uploadedDocs) {
          setActivities(prevActivities => [
            {
              id: `act-upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              status: 'viewing',
              description: `Caricamento documento "${doc.name}"`,
              timestamp: new Date().toLocaleString(),
              documentId: doc.id,
              version: 'v1'
            },
            ...prevActivities
          ]);
        }
      }
      
      if (uploadedDocs.length > 0) {
        setNotification({
          open: true,
          message: `${uploadedDocs.length} documenti caricati con successo`,
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Nessun documento caricato con successo',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setNotification({
        open: true,
        message: `Errore nel caricamento: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDownloadArtifact = () => {
    if (!currentArtifact) return;
    
    try {
      // Utilizza la funzione di download da utils.js
      const content = currentArtifact.content || 'Contenuto del documento';
      const filename = currentArtifact.name;
      
      // Per il contenuto, usa convertToWordCompatibleHTML per garantire la compatibilità con Word
      const formattedContent = convertToWordCompatibleHTML(content, filename);
      
      // Esegui il download
      downloadWordDocument(formattedContent, filename);
      
      // Aggiungi un'attività alla Lexychain per il download
      setActivities(prevActivities => [
        {
          id: `act-download-${Date.now()}`,
          status: 'viewing',
          description: `Download documento "${currentArtifact.name}"`,
          timestamp: new Date().toLocaleString(),
          documentId: currentArtifact.id,
          version: currentArtifact.version,
          agent: { name: currentArtifact.generatedBy || 'Valis' }
        },
        ...prevActivities
      ]);
      
      setNotification({
        open: true,
        message: `Download di "${currentArtifact.name}" completato`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Errore durante il download:', error);
      setNotification({
        open: true,
        message: `Errore durante il download: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  const handleViewFullScreen = () => {
    setIsFullScreenViewerOpen(true);
  };
  
  const handleEditArtifact = () => {
    if (!currentArtifact) return;
    
    // Imposta il documento da modificare e apri l'editor
    setDocumentToEdit(currentArtifact);
    setIsDocumentEditorOpen(true);
  };
  
  const handleSaveDocument = (updatedDocument) => {
    // Genera una nuova versione del documento
    const prevVersion = updatedDocument.version || 'v1';
    const versionNumber = parseInt(prevVersion.slice(1)) || 1;
    const newVersion = `v${versionNumber + 1}`;
    
    // MODIFICATO: Mantieni i flag di documento generato
    const updatedArtifact = markDocumentAsGenerated({
      ...updatedDocument,
      date: new Date().toISOString(),
      version: newVersion
    }, updatedDocument.generatedBy || 'Valis');
    
    // Aggiorna l'artifact corrente
    setCurrentArtifact(updatedArtifact);
    
    // Aggiorna l'archivio delle versioni
    setArtifactVersions(prev => {
      const docVersions = prev[updatedDocument.id] || {};
      return {
        ...prev,
        [updatedDocument.id]: {
          ...docVersions,
          [newVersion]: updatedArtifact
        }
      };
    });
    
    // Aggiorna il documento nel progetto
    if (selectedProject) {
      setSelectedProject(prevProject => {
        const updatedDocs = (prevProject.documents || []).map(doc => 
          doc.id === updatedDocument.id ? updatedArtifact : doc
        );
        
        const updatedProject = {
          ...prevProject,
          documents: updatedDocs
        };
        
        // Aggiorna anche nella lista generale dei progetti
        setProjects(prevProjects => 
          prevProjects.map(p => p.id === prevProject.id ? updatedProject : p)
        );
        
        return updatedProject;
      });
    }
    
    // Aggiungi un'attività alla Lexychain
    setActivities(prevActivities => [
      {
        id: `act-edit-${Date.now()}`,
        status: 'editing',
        description: `Modifica del documento "${updatedDocument.name}"`,
        timestamp: new Date().toLocaleString(),
        documentId: updatedDocument.id,
        version: newVersion,
        agent: { name: updatedDocument.generatedBy || 'Valis' }
      },
      ...prevActivities
    ]);
    
    setDocumentToEdit(null);
    setIsDocumentEditorOpen(false);
    setNotification({
      open: true,
      message: `Documento "${updatedDocument.name}" modificato (${newVersion})`,
      severity: 'success'
    });
  };
  
  const handleRestoreActivity = (activity) => {
    // Ripristina una versione precedente di un documento dalla Lexychain
    if (!activity || !activity.documentId || !activity.version) {
      setNotification({
        open: true,
        message: 'Impossibile ripristinare la versione: informazioni mancanti',
        severity: 'error'
      });
      return;
    }
    
    // Ottieni il documento dall'archivio delle versioni
    const docVersions = artifactVersions[activity.documentId] || {};
    const versionToRestore = docVersions[activity.version];
    
    if (!versionToRestore) {
      setNotification({
        open: true,
        message: `Versione ${activity.version} non trovata`,
        severity: 'error'
      });
      return;
    }
    
    // Imposta come artifact corrente solo se è un documento generato
    if (versionToRestore.isGenerated) {
      setCurrentArtifact(versionToRestore);
    }
    
    // Aggiorna anche nel progetto
    if (selectedProject) {
      setSelectedProject(prevProject => {
        const hasDoc = (prevProject.documents || []).some(d => d.id === activity.documentId);
        
        let updatedDocs;
        if (hasDoc) {
          // Sostituisci il documento esistente
          updatedDocs = (prevProject.documents || []).map(doc => 
            doc.id === activity.documentId ? versionToRestore : doc
          );
        } else {
          // Aggiungi il documento se non esiste
          updatedDocs = [versionToRestore, ...(prevProject.documents || [])];
        }
        
        const updatedProject = {
          ...prevProject,
          documents: updatedDocs
        };
        
        // Aggiorna anche nella lista generale dei progetti
        setProjects(prevProjects => 
          prevProjects.map(p => p.id === prevProject.id ? updatedProject : p)
        );
        
        return updatedProject;
      });
    }
    
    // Aggiungi un'attività per il ripristino
    setActivities(prevActivities => [
      {
        id: `act-restore-${Date.now()}`,
        status: 'browsing',
        description: `Ripristino alla versione ${activity.version} di "${versionToRestore.name}"`,
        timestamp: new Date().toLocaleString(),
        documentId: activity.documentId,
        version: activity.version,
        agent: activity.agent
      },
      ...prevActivities
    ]);
    
    setNotification({
      open: true,
      message: `Documento ripristinato alla versione ${activity.version}`,
      severity: 'success'
    });
  };
  
  const handleDeleteDocumentFromProject = async (documentId) => {
    if (!documentId || !selectedProject) return;
    
    try {
      // Rimuovi il documento dalla collezione nel backend
      if (selectedProject.collectionId) {
        await collectionsApi.removeDocumentFromCollection(selectedProject.collectionId, documentId);
      }
      
      // Rimuovi il documento dal progetto locale
      setSelectedProject(prevProject => {
        const updatedDocs = (prevProject.documents || []).filter(doc => doc.id !== documentId);
        
        const updatedProject = {
          ...prevProject,
          documents: updatedDocs
        };
        
        // Aggiorna anche nella lista generale dei progetti e localStorage
        setProjects(prevProjects => 
          prevProjects.map(p => p.id === prevProject.id ? updatedProject : p)
        );
        
        // Aggiorna localStorage
        getUserProjectsKey().then(storageKey => {
          const allProjects = projects.map(p => p.id === prevProject.id ? updatedProject : p);
          localStorage.setItem(storageKey, JSON.stringify(allProjects));
        });
        
        return updatedProject;
      });
      
      // Se il documento rimosso è quello attualmente visualizzato nell'artifact, ripulisci
      if (currentArtifact && currentArtifact.id === documentId) {
        // Trova il prossimo documento generato disponibile
        const remainingGeneratedDocs = selectedProject.documents.filter(doc => 
          doc.id !== documentId && doc.isGenerated
        );
        setCurrentArtifact(remainingGeneratedDocs.length > 0 ? remainingGeneratedDocs[0] : null);
      }
      
      // Aggiungi attività alla Lexychain
      setActivities(prevActivities => [
        {
          id: `act-delete-${Date.now()}`,
          status: 'browsing',
          description: `Rimozione documento dal progetto`,
          timestamp: new Date().toLocaleString(),
          documentId: documentId
        },
        ...prevActivities
      ]);
      
      setNotification({
        open: true,
        message: 'Documento rimosso dal progetto',
        severity: 'info'
      });
    } catch (error) {
      console.error('Error removing document:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setNotification({
        open: true,
        message: `Errore nella rimozione del documento: ${errorMessage}`,
        severity: 'error'
      });
    }
  };
  

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Filtraggio dei progetti e collezioni in base al termine di ricerca
  const filteredProjects = projects.filter(project => 
    !projectSearchTerm || 
    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    (project.client && project.client.toLowerCase().includes(projectSearchTerm.toLowerCase()))
  );
  
  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100%',
      overflow: 'hidden', 
      bgcolor: theme?.palette?.background?.default || '#f8f9fa',
      fontSize: '1rem'
    }}>
      {pageMode === 'select' ? (
        <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
          <ProjectSection
            projects={filteredProjects}
            searchTerm={projectSearchTerm}
            onSearchTermChange={setProjectSearchTerm}
            onSelectProject={handleSelectProject}
            onNewProjectClick={handleCreateProjectClick}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onNavigateToProfile={handleNavigateToProfile} // AGGIUNTO: Passaggio della prop per navigazione al profilo
          />
      
        </Box>
      ) : (
        <WorkspaceLayout
          project={selectedProject}
          documents={selectedProject?.documents || []}
          messages={messages}
          isProcessing={isProcessing}
          artifact={currentArtifact}
          activities={activities}
          selectedAgents={selectedAgents}
          onReturnToProjects={handleReturn}
          onPromptChange={handlePromptChange}
          onSendPrompt={handleSendPrompt}
          onAgentMention={handleAgentMention}
          onUploadDocument={handleUploadDocument}
          onDownloadArtifact={handleDownloadArtifact}
          onEditArtifact={handleEditArtifact}
          onRestoreActivity={handleRestoreActivity}
          onDeleteDocument={handleDeleteDocumentFromProject}
          onDocumentPreview={handleDocumentPreview} // AGGIUNTO: Handler per anteprima
        />
      )}

      {/* Dialog components */}
      <NewProjectDialog
        open={isProjectDialogOpen}
        onClose={handleCloseProjectDialog}
        onCreate={handleCreateProject}
      />
   
      
      <EditProjectDialog
        open={isEditProjectDialogOpen}
        onClose={() => setIsEditProjectDialogOpen(false)}
        project={projectToEdit}
        onUpdate={handleUpdateProject}

      />
      
      <DeleteConfirmDialog
        open={isDeleteConfirmDialogOpen}
        onClose={() => setIsDeleteConfirmDialogOpen(false)}
        projectName={projectToDelete?.name || ''}
        onConfirm={handleConfirmDeleteProject}
      />
      
      {/* Editor di documenti */}
      {documentToEdit && (
        <DocumentEditorDialog
          open={isDocumentEditorOpen}
          onClose={() => setIsDocumentEditorOpen(false)}
          document={documentToEdit}
          onSave={handleSaveDocument}
        />
      )}
      
      {/* Visualizzatore a schermo intero - Solo per documenti generati */}
      {currentArtifact && currentArtifact.isGenerated && (
        <ArtifactFullScreenDialog
          open={isFullScreenViewerOpen}
          onClose={() => setIsFullScreenViewerOpen(false)}
          artifact={currentArtifact}
          onEdit={handleEditArtifact}
        />
      )}
      
      {/* AGGIUNTO: Dialog per anteprima documenti caricati */}
      <DocumentPreviewDialog
        open={isDocumentPreviewOpen}
        onClose={handleCloseDocumentPreview}
        document={documentToPreview}
      />
      
      {/* Notifiche */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Multiagent;