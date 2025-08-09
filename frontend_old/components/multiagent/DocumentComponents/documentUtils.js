// Funzione per estrarre e sanitizzare il contenuto HTML
export const extractHtmlContent = (content) => {
  if (!content) return '<p><br></p>';
  
  let extractedContent = content;
  
  // Se il contenuto include un documento HTML completo, estrai il corpo
  if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
    try {
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(content);
      extractedContent = bodyMatch && bodyMatch[1] ? bodyMatch[1] : content;
    } catch (e) {
      console.error('Errore nell\'estrazione del contenuto HTML:', e);
    }
  } else {
    // Mantieni la logica originale per formattare testo semplice come HTML
    extractedContent = content.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
  }
  
  // Sanitizza il contenuto per rimuovere interruzioni di pagina
  const sanitizedContent = extractedContent
    // Rimuovi div con stili di interruzione di pagina
    .replace(/<div[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<div>')
    .replace(/<div[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<div>')
    // Rimuovi br con stili di interruzione di pagina
    .replace(/<br[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi, '<br>')
    .replace(/<br[^>]*style="[^"]*page-break-after[^"]*"[^>]*>/gi, '<br>')
    // Rimuovi attributi di stile contenenti interruzioni di pagina
    .replace(/style="[^"]*page-break[^"]*"/gi, '')
    // Rimuovi classi che potrebbero causare interruzioni di pagina
    .replace(/<div[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi, '<div>')
    // Rimuovi commenti HTML che potrebbero nascondere interruzioni
    .replace(/<!--[\s\S]*?-->/g, '')
    // Rimuovi mso-special-character che potrebbe causare problemi
    .replace(/<!--\[if !mso\]>[\s\S]*?<!\[endif\]-->/g, '')
    .replace(/<!--\[if gte mso[\s\S]*?<!\[endif\]-->/g, '');
  
  return sanitizedContent;
};

// Funzione per convertire HTML in testo semplice
export const htmlToPlainText = (html) => {
  if (!html) return '';
  
  // Crea un elemento temporaneo
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Rimuovi script e stili
  const scripts = temp.querySelectorAll('script, style');
  scripts.forEach(item => item.remove());
  
  // Ottieni il testo
  return temp.textContent || temp.innerText || '';
};

// Funzione per verificare se un documento è vuoto
export const isDocumentEmpty = (content) => {
  if (!content) return true;
  
  // Converti HTML in testo semplice
  const plainText = htmlToPlainText(content);
  
  // Verifica se è vuoto o contiene solo spazi
  return plainText.trim().length === 0;
};