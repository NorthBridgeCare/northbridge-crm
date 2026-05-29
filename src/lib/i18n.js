const T = {
  // Nav
  pipeline:       { FR:"Pipeline",           EN:"Pipeline" },
  clientList:     { FR:"Liste clients",      EN:"Client List" },
  newClient:      { FR:"+ Nouveau client",   EN:"+ New Client" },
  search:         { FR:"Rechercher...",      EN:"Search..." },
  // Stats
  activeClients:  { FR:"Clients actifs",     EN:"Active clients" },
  totalPipeline:  { FR:"Total pipeline",     EN:"Total pipeline" },
  convRate:       { FR:"Taux conversion",    EN:"Conv. rate" },
  confirmedRev:   { FR:"Revenus confirmés",  EN:"Confirmed revenue" },
  lprpdeMissing:  { FR:"LPRPDE manquant",    EN:"LPRPDE missing" },
  // Filters
  allStages:      { FR:"Toutes les étapes",  EN:"All stages" },
  allProcs:       { FR:"Toutes procédures",  EN:"All procedures" },
  allSources:     { FR:"Toutes les sources", EN:"All sources" },
  lprpdeOnly:     { FR:"LPRPDE manquant seulement", EN:"Missing LPRPDE only" },
  // Dossier tabs
  info:           { FR:"Informations",       EN:"Information" },
  payments:       { FR:"Paiements",          EN:"Payments" },
  whatsapp:       { FR:"WhatsApp",           EN:"WhatsApp" },
  documents:      { FR:"Documents",          EN:"Documents" },
  photos:         { FR:"Photos",             EN:"Photos" },
  journal:        { FR:"Journal",            EN:"Journal" },
  // Form fields
  firstName:      { FR:"Prénom *",           EN:"First name *" },
  lastName:       { FR:"Nom *",             EN:"Last name *" },
  email:          { FR:"Email",              EN:"Email" },
  phone:          { FR:"Téléphone",          EN:"Phone" },
  procedure:      { FR:"Procédure",          EN:"Procedure" },
  source:         { FR:"Source",             EN:"Source" },
  clientLang:     { FR:"Langue client",      EN:"Client language" },
  province:       { FR:"Province",           EN:"Province" },
  region:         { FR:"Région",             EN:"Region" },
  notes:          { FR:"Notes",              EN:"Notes" },
  // Actions
  createDossier:  { FR:"Créer le dossier",   EN:"Create file" },
  cancel:         { FR:"Annuler",            EN:"Cancel" },
  nextStage:      { FR:"→ Étape suivante",   EN:"→ Next stage" },
  prevStage:      { FR:"← Étape précédente",EN:"← Previous stage" },
  copyMsg:        { FR:"Copier le message",  EN:"Copy message" },
  copied:         { FR:"✓ Copié !",          EN:"✓ Copied!" },
  loading:        { FR:"Chargement...",      EN:"Loading..." },
  noClients:      { FR:"Aucun client trouvé.", EN:"No clients found." },
  save:           { FR:"Enregistrer",        EN:"Save" },
  delete:         { FR:"Supprimer",          EN:"Delete" },
  sending:        { FR:"Envoi...",           EN:"Sending..." },
  // Login
  selectUser:     { FR:"Qui êtes-vous ?",    EN:"Who are you?" },
  password:       { FR:"Mot de passe",       EN:"Password" },
  createPwd:      { FR:"Créer votre mot de passe", EN:"Create your password" },
  confirmPwd:     { FR:"Confirmer le mot de passe", EN:"Confirm password" },
  connect:        { FR:"Se connecter",       EN:"Sign in" },
  wrongPwd:       { FR:"Mot de passe incorrect.", EN:"Incorrect password." },
  pwdMismatch:    { FR:"Les mots de passe ne correspondent pas.", EN:"Passwords do not match." },
  pwdTooShort:    { FR:"Minimum 6 caractères.", EN:"Minimum 6 characters." },
  logout:         { FR:"Déconnexion",        EN:"Sign out" },
  // Payment
  paymentUSD:     { FR:"Montant (USD)",      EN:"Amount (USD)" },
  paymentCAD:     { FR:"Équivalent CAD",     EN:"CAD equivalent" },
  exchangeRate:   { FR:"Taux de change",     EN:"Exchange rate" },
  eTransferDir:   { FR:"Direction e-transfer", EN:"E-transfer direction" },
  clientSends:    { FR:"Client envoie",      EN:"Client sends" },
  nbRequests:     { FR:"NB demande (Interac Request)", EN:"NB requests (Interac Request)" },
  dossierRef:     { FR:"Réf. dossier (auto)", EN:"Dossier ref (auto)" },
  // Lock
  lockedBy:       { FR:"Dossier en cours d'édition par", EN:"File being edited by" },
  readOnly:       { FR:"Lecture seule",      EN:"Read only" },
  // Stage
  pipelineStage:  { FR:"Étape du pipeline",  EN:"Pipeline stage" },
};

export const t = (lang, key) => {
  if (!T[key]) return key;
  return T[key][lang] || T[key]['FR'] || key;
};

export const stageLabel = (stage, lang) =>
  lang === 'EN' ? stage.en : stage.fr;
