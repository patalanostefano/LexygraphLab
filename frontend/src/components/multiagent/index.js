// Esporta il componente principale Multiagent come default
import Multiagent from './Multiagent';
export default Multiagent;

// Esporta altri componenti per un utilizzo più flessibile se necessario
export * from './MultiagentStyles';
export * from '../../../../../../valis/src/components/multiagent/DocumentComponents'; // Ora questo punta alla cartella e non al file
export * from './ProjectComponents';
export * from './UIComponents';
export * from './utils';