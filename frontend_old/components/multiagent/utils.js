// Sistema migliorato per il download dei documenti
export const convertToWordCompatibleHTML = (content, documentName) => {
  // Converti la formattazione markdown in formattazione compatibile con DOCX
  // Versione migliorata per massimizzare la compatibilità con Word

  let docxContent = content;

  // Verifica se il contenuto è già in formato HTML
  if (!docxContent.includes('<!DOCTYPE html>')) {
    // Converti la formattazione markdown
    docxContent = docxContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    docxContent = docxContent.replace(/_(.*?)_/g, '<em>$1</em>');
    docxContent = docxContent.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    docxContent = docxContent.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    docxContent = docxContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Gestisci gli a capo e i paragrafi
    docxContent = docxContent.replace(/\n\n/g, '</p><p>');
    docxContent = docxContent.replace(/\n/g, '<br>');

    // Assicurati che il testo sia avvolto in un paragrafo
    if (!docxContent.includes('<p>')) {
      docxContent = `<p>${docxContent}</p>`;
    }
  } else {
    // Se è già HTML, estrai solo il testo e ricrea un documento formattato correttamente
    try {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(docxContent, 'text/html');

      // Estrai solo il testo
      const textContent = htmlDoc.body.textContent;

      // Crea paragrafi dal testo
      docxContent = `<p>${textContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    } catch (e) {
      // Se fallisce, usa una regex semplice per rimuovere tag HTML
      docxContent = docxContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      docxContent = `<p>${docxContent}</p>`;
    }
  }

  // Aggiungi intestazione e piè di pagina
  const currentDate = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Crea documento HTML completo con metadati e stili per Word
  const wordCompatibleHTML = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="Microsoft Word 15">
      <meta name="Originator" content="Microsoft Word 15">
      <title>${documentName.replace(/\.[^/.]+$/, '')}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        /* Stili generali */
        @page { size: 21cm 29.7cm; margin: 2cm; }
        body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
        h1 { font-size: 16pt; font-weight: bold; margin-top: 24pt; margin-bottom: 6pt; }
        h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; }
        p { margin-top: 4pt; margin-bottom: 8pt; text-align: justify; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1pt solid #ccc; padding: 5pt; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        
        /* Stili per l'intestazione e piè di pagina */
        .header { font-size: 9pt; color: #666; text-align: right; margin-bottom: 20pt; }
        .footer { font-size: 9pt; color: #666; text-align: center; margin-top: 20pt; border-top: 1pt solid #eee; padding-top: 5pt; }
        
        /* Stili per elenchi */
        ul, ol { margin-left: 20pt; }
        li { margin-bottom: 4pt; }
        
        /* Classe per nuova pagina */
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="header">
        ${documentName.replace(/\.[^/.]+$/, '')} - ${currentDate}
      </div>
      
      ${docxContent}
      
      <div class="footer">
        Documento generato il ${currentDate}
      </div>
    </body>
    </html>
  `;

  return wordCompatibleHTML;
};

// Sistema intelligente per l'assegnazione dei titoli ai documenti
export const DocumentTitleGenerator = {
  // Mappa di tipi di documenti con relativi prefissi e formati
  documentTypes: {
    contratto: {
      keywords: ['contratto', 'accordo', 'convenzione', 'patto'],
      format: 'Contratto_{parti}_{oggetto}_{data}',
      extractInfo: (content) => {
        const parties = DocumentTitleGenerator.extractParties(content);
        const subject = DocumentTitleGenerator.extractSubject(content);
        return { parti: parties, oggetto: subject };
      },
    },
    parere: {
      keywords: ['parere', 'memorandum', 'nota', 'consulenza'],
      format: 'Parere_{materia}_{cliente}_{data}',
      extractInfo: (content) => {
        const subject = DocumentTitleGenerator.extractSubject(content);
        const client = DocumentTitleGenerator.extractClient(content);
        return { materia: subject, cliente: client };
      },
    },
    atto: {
      keywords: ['citazione', 'ricorso', 'comparsa', 'memoria', 'costituzione'],
      format: 'Atto_{tipo}_{tribunale}_{data}',
      extractInfo: (content) => {
        const type = DocumentTitleGenerator.extractActType(content);
        const court = DocumentTitleGenerator.extractCourt(content);
        return { tipo: type, tribunale: court };
      },
    },
    verbale: {
      keywords: ['verbale', 'assemblea', 'riunione', 'consiglio'],
      format: 'Verbale_{organo}_{data}',
      extractInfo: (content) => {
        const body = DocumentTitleGenerator.extractGoverningBody(content);
        return { organo: body };
      },
    },
  },

  // Metodi di estrazione delle informazioni
  extractParties: (content) => {
    const partyMatch = content.match(
      /tra\s+([\w\s'"\.]+)\s+e\s+([\w\s'"\.]+)/i,
    );
    if (partyMatch && partyMatch.length > 2) {
      const party1 = partyMatch[1]
        .trim()
        .split(/\s+/)[0]
        .replace(/[^a-z0-9]/gi, '');
      const party2 = partyMatch[2]
        .trim()
        .split(/\s+/)[0]
        .replace(/[^a-z0-9]/gi, '');
      return `${party1}_${party2}`;
    }
    return 'Parti';
  },

  extractSubject: (content) => {
    const subjectMatch = content.match(/oggetto:?\s+([\w\s'"\.]+?)[\.\n]/i);
    if (subjectMatch && subjectMatch.length > 1) {
      const subject = subjectMatch[1]
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .slice(0, 2)
        .join('_')
        .replace(/[^a-z0-9_]/gi, '');
      return subject || 'Oggetto';
    }
    return 'Oggetto';
  },

  extractClient: (content) => {
    const clientMatch =
      content.match(/cliente:?\s+([\w\s'"\.]+?)[\.\n]/i) ||
      content.match(/per:?\s+([\w\s'"\.]+?)[\.\n]/i);
    if (clientMatch && clientMatch.length > 1) {
      return clientMatch[1]
        .trim()
        .split(/\s+/)[0]
        .replace(/[^a-z0-9]/gi, '');
    }
    return 'Cliente';
  },

  extractCourt: (content) => {
    const courtMatch =
      content.match(/tribunale\s+di\s+([\w\s]+?)[\.\n]/i) ||
      content.match(/corte\s+(?:di|d')\s+([\w\s]+?)[\.\n]/i);
    if (courtMatch && courtMatch.length > 1) {
      return courtMatch[1].trim().replace(/\s+/g, '');
    }
    return 'Tribunale';
  },

  extractActType: (content) => {
    const types = [
      'citazione',
      'ricorso',
      'comparsa',
      'memoria',
      'opposizione',
    ];
    for (const type of types) {
      if (content.toLowerCase().includes(type)) {
        return type;
      }
    }
    return 'Processuale';
  },

  extractGoverningBody: (content) => {
    const bodies = [
      'assemblea',
      'consiglio',
      'amministrazione',
      'soci',
      'sindaci',
    ];
    for (const body of bodies) {
      if (content.toLowerCase().includes(body)) {
        return body;
      }
    }
    return 'Organo';
  },

  // Funzione principale per generare un titolo
  generateTitle: (content) => {
    if (!content) return 'Documento_' + new Date().toISOString().slice(0, 10);

    // Normalizza il contenuto per le analisi
    const normalizedContent = content.toLowerCase();

    // Identifica il tipo di documento
    let documentType = null;
    for (const [type, info] of Object.entries(
      DocumentTitleGenerator.documentTypes,
    )) {
      for (const keyword of info.keywords) {
        if (normalizedContent.includes(keyword)) {
          documentType = type;
          break;
        }
      }
      if (documentType) break;
    }

    // Se non è stato identificato un tipo specifico, usa un formato generico
    if (!documentType) {
      const words = content.split(/\s+/).slice(0, 20);
      const significantWords = words
        .filter(
          (word) =>
            word.length > 4 &&
            !/^(dell[aeo]|nell[aeo]|all[aeo]|dall[aeo]|con|per|tra|fra)$/i.test(
              word,
            ),
        )
        .slice(0, 3)
        .join('_')
        .replace(/[^a-z0-9_]/gi, '');

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return `Doc_${significantWords || 'Generico'}_${timestamp}.docx`;
    }

    // Estrai informazioni specifiche dal documento in base al tipo
    const typeInfo = DocumentTitleGenerator.documentTypes[documentType];
    const extractedInfo = typeInfo.extractInfo(content);

    // Formatta il titolo
    let title = typeInfo.format;
    for (const [key, value] of Object.entries(extractedInfo)) {
      title = title.replace(`{${key}}`, value);
    }

    // Aggiungi la data
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    title = title.replace('{data}', date);

    return title + '.docx';
  },
};

// Funzione migliorata per generare un file Word compatibile
export const generateWordDocument = (content, filename = 'documento.docx') => {
  // Estrai il testo pulito, ma mantieni la formattazione HTML esistente
  let textContent = content;

  // Se content contiene proprietà rawContent preesistente, usala
  if (content && typeof content === 'object' && content.rawContent) {
    return content.rawContent;
  }

  // Se è HTML, assicurati che sia ben formattato
  if (
    typeof content === 'string' &&
    (content.includes('<!DOCTYPE html>') ||
      content.includes('<html') ||
      content.includes('<p>') ||
      content.includes('<div>'))
  ) {
    // È già in formato HTML, lo usiamo direttamente
    textContent = content;
  } else if (typeof content === 'string') {
    // È testo semplice, convertilo in HTML
    textContent = content
      .split('\n\n')
      .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');
  } else if (content && typeof content === 'object') {
    // È un oggetto, prendi la proprietà content
    textContent = content.content || '';
  }

  // Crea un documento Word-compatibile
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <title>${typeof filename === 'string' ? filename.replace(/\.[^/.]+$/, '') : 'Documento'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: 21cm 29.7cm; margin: 2cm; }
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; margin: 2cm; }
    p { margin-bottom: 10pt; text-align: justify; }
    .header { font-size: 9pt; color: #666; text-align: right; margin-bottom: 20pt; }
    .footer { font-size: 9pt; color: #666; text-align: center; margin-top: 20pt; border-top: 1pt solid #eee; padding-top: 5pt; }
  </style>
</head>
<body>
  <div class="header">
    ${typeof filename === 'string' ? filename.replace(/\.[^/.]+$/, '') : 'Documento'} - ${new Date().toLocaleDateString('it-IT')}
  </div>
  
  ${typeof textContent === 'string' ? textContent : ''}
  
  <div class="footer">
    Documento generato il ${new Date().toLocaleDateString('it-IT')}
  </div>
</body>
</html>`;
};

// Funzione per scaricare documento come .docx
export const downloadWordDocument = (content, filename = 'documento.docx') => {
  // Se non ha estensione .docx, aggiungerla
  if (
    typeof filename === 'string' &&
    !filename.toLowerCase().endsWith('.docx')
  ) {
    filename += '.docx';
  }

  // Genera il contenuto Word
  const wordContent = generateWordDocument(content, filename);

  // Crea un Blob con il MIME type corretto
  const blob = new Blob([wordContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  // Crea un URL per il blob
  const url = URL.createObjectURL(blob);

  // Crea un link per il download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);

  // Simula il click e poi rimuovi il link
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  return true;
};
