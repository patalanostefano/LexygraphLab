
import React, { useState } from 'react';

export default function ProjectManager() {
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
    <div className="flex h-screen bg-gray-50 p-8 gap-8">
      {/* Left Panel - Projects */}
      <div className="w-1/2 bg-white border-2 border-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Projects</h2>
          <button 
            onClick={createProject}
            className="px-4 py-2 border border-gray-800 hover:bg-gray-100 transition-colors"
          >
            Create project
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name"
            className="w-full p-2 border border-gray-300 mb-2"
            onKeyPress={(e) => e.key === 'Enter' && createProject()}
          />
        </div>

        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center border border-gray-800 p-3">
              <span className="flex-1">{project.name}</span>
              <button 
                onClick={() => openProject(project)}
                className="px-4 py-1 border border-gray-800 hover:bg-gray-100 transition-colors ml-2"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Project Details */}
      <div className="w-1/2 bg-white border-2 border-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{selectedProject?.name || 'Select a project'}</h2>
          <button 
            onClick={addDocument}
            className="px-4 py-2 border border-gray-800 hover:bg-gray-100 transition-colors"
          >
            Add doc
          </button>
        </div>

        {selectedProject && (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="New document name"
                className="w-full p-2 border border-gray-300 mb-2"
                onKeyPress={(e) => e.key === 'Enter' && addDocument()}
              />
            </div>

            <div className="space-y-2">
              {selectedProject.documents.map((doc, index) => (
                <div key={index} className="flex items-center border border-gray-800 p-3">
                  <span className="flex-1">{doc}</span>
                  {index === 0 && (
                    <button className="px-4 py-1 border border-gray-800 hover:bg-gray-100 transition-colors ml-2">
                      Open
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}