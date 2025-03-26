// src/pages/SupabaseTest.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

function SupabaseTest() {
  const [testResult, setTestResult] = useState('Inizializzazione test...');

  useEffect(() => {
    const testSupabase = async () => {
      try {
        // Test semplice: verifica che possiamo ottenere la sessione corrente
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setTestResult(`Errore: ${error.message}`);
        } else {
          setTestResult(`Supabase funziona! Sessione: ${data.session ? 'Attiva' : 'Non attiva'}`);
        }
      } catch (e) {
        setTestResult(`Errore durante il test: ${e.message}`);
      }
    };

    testSupabase();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Supabase</h1>
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        marginTop: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        {testResult}
      </div>
    </div>
  );
}

export default SupabaseTest;