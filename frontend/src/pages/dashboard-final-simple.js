import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Plus,
  Folder
} from 'lucide-react';

// Simple PDF Preview Modal
const PDFPreviewModal = ({ 
  isOpen, 
  onClose, 
  document, 
  documents = [], 
  currentIndex = 0, 
  onNavigate 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentDocIndex, setCurrentDocIndex] = useState(currentIndex);

  const currentDoc = documents.length > 0 ? documents[currentDocIndex] : document;

  useEffect(() => {
    if (isOpen && currentDoc) {
      setLoading(true);
      setError(null);
      
      const timer = setTimeout(() => {
        try {
          if (currentDoc.file && currentDoc.file instanceof File) {
            const url = URL.createObjectURL(currentDoc.file);
            setPdfUrl(url);
          } else {
            // Use a sample PDF for demo
            setPdfUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
          }
          setLoading(false);
        } catch (err) {
          setError('Failed to load PDF');
          setLoading(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, currentDoc]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = currentDoc?.name || 'document.pdf';
      link.click();
    }
  };

  const handlePrevDocument = () => {
    if (documents.length > 1 && currentDocIndex > 0) {
      setCurrentDocIndex(prev => prev - 1);
      if (onNavigate) onNavigate(currentDocIndex - 1);
    }
  };

  const handleNextDocument = () => {
    if (documents.length > 1 && currentDocIndex < documents.length - 1) {
      setCurrentDocIndex(prev => prev + 1);
      if (onNavigate) onNavigate(currentDocIndex + 1);
    }
  };

  if (!isOpen || !currentDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] h-[700px] mx-4 overflow-hidden border border-gray-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">
                {currentDoc.name || 'Document Preview'}
              </h3>
              {documents.length > 1 && (
                <span className="text-sm text-gray-500">
                  {currentDocIndex + 1} of {documents.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation */}
            {documents.length > 1 && (
              <>
                <button
                  onClick={handlePrevDocument}
                  disabled={currentDocIndex === 0}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextDocument}
                  disabled={currentDocIndex === documents.length - 1}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            
            {/* Zoom */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 bg-white border border-gray-300 rounded text-sm">
              {zoom}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            {/* Actions */}
            <button
              onClick={handleDownload}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="h-[calc(100%-70px)] bg-gray-100 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="bg-white border border-gray-300 rounded p-4 max-w-md">
                <p className="text-gray-700 mb-2">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div 
              className="w-full h-full overflow-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                width="100%"
                height="100%"
                className="border-none"
                title={`PDF Preview - ${currentDoc.name}`}
              />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600">No PDF to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Project Manager
const ProjectManager = () => {
  const [projects, setProjects] = useState([
    { 
      id: 1, 
      name: 'Legal Documents', 
      documents: [
        { name: 'Contract.pdf', type: 'pdf' },
        { name: 'Legal Brief.pdf', type: 'pdf' }
      ] 
    },
    { 
      id: 2, 
      name: 'Contracts', 
      documents: [
        { name: 'Agreement.pdf', type: 'pdf' }
      ] 
    }
  ]);
  
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  
  // PDF Preview States
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewDocuments, setPreviewDocuments] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const createProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: projects.length + 1,
        name: newProjectName,
        documents: []
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
      setShowCreateProject(false);
    }
  };

  const addDocument = () => {
    if (selectedProject && selectedFile) {
      const newDoc = {
        name: selectedFile.name,
        type: 'pdf',
        file: selectedFile
      };
      
      const updatedProjects = projects.map(project =>
        project.id === selectedProject.id
          ? { ...project, documents: [...project.documents, newDoc] }
          : project
      );
      setProjects(updatedProjects);
      setSelectedProject({
        ...selectedProject,
        documents: [...selectedProject.documents, newDoc]
      });
      
      setSelectedFile(null);
      setShowAddFile(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file only');
    }
  };

  const handleOpenPdfPreview = (doc, index = 0) => {
    setPreviewDocument(doc);
    setPreviewDocuments(selectedProject?.documents || []);
    setPreviewIndex(index);
    setPdfPreviewOpen(true);
  };

  const handleNavigateDocument = (newIndex) => {
    setPreviewIndex(newIndex);
    setPreviewDocument(previewDocuments[newIndex]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Projects List */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Projects
            </h2>
            <button 
              onClick={() => setShowCreateProject(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
          
          <div className="space-y-3">
            {projects.map((project) => (
              <div 
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedProject?.id === project.id
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600">
                      {project.documents.length} documents
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedProject?.name || 'Select a project'}
            </h2>
            {selectedProject && (
              <button 
                onClick={() => setShowAddFile(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          {selectedProject ? (
            <div className="space-y-3">
              {selectedProject.documents.length > 0 ? (
                selectedProject.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{doc.name}</span>
                    </div>
                    <button 
                      onClick={() => handleOpenPdfPreview(doc, index)}
                      className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-900"
                    >
                      Preview
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No documents yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a project to view documents</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        document={previewDocument}
        documents={previewDocuments}
        currentIndex={previewIndex}
        onNavigate={handleNavigateDocument}
      />

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCreateProject(false)}
          />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4 border border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">New Project</h3>
              <button 
                onClick={() => setShowCreateProject(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded"
                  placeholder="Enter project name..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCreateProject(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add File Modal */}
      {showAddFile && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowAddFile(false)}
          />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4 border border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add File</h3>
              <button 
                onClick={() => setShowAddFile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="block w-full p-4 border-2 border-dashed border-gray-300 text-gray-600 rounded cursor-pointer hover:bg-gray-50"
              >
                <div className="text-center">
                  <p className="font-medium">
                    {selectedFile ? selectedFile.name : 'Choose PDF File'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedFile ? 'File selected' : 'Click to browse'}
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddFile(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={addDocument}
                disabled={!selectedFile}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
              >
                Add File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;