// index.js
import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);

  const handleCreateProjectClick = () => {
    setIsProjectDialogOpen(true);
  };

  return (
    <div>
      <button onClick={handleCreateProjectClick}>Crea nuovo progetto</button>
      {isProjectDialogOpen && (
        <NewProjectDialog onClose={() => setIsProjectDialogOpen(false)} />
      )}
      {/* Altri componenti e logica dell'applicazione */}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
