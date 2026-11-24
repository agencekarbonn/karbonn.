/*
 * Configuration publique d'Appwrite côté navigateur.
 * Ces valeurs ne sont pas secrètes : la clé Mailgun et les clés API restent
 * uniquement dans les variables d'environnement de la fonction login-guard.
 */
export const APPWRITE = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "6afaf8c0001c35ce1dc4",
  loginFunctionId: "login-guard",
  // Fonction d'analyse de brief (IA gratuite). Vide = parseur local uniquement.
  briefFunctionId: "",
  // Fonction d'envoi des demandes de devis (Mailgun + résumé IA).
  quoteFunctionId: "quote-request",
};
