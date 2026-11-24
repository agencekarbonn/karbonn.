/*
 * Copie le moteur de devis et les traductions du site dans la fonction :
 * Appwrite ne déploie que ce dossier, et le serveur doit recalculer
 * l'estimation avec exactement la même grille que le navigateur.
 */
import { copyFileSync, mkdirSync } from "node:fs";

const root = new URL("../../../", import.meta.url);
const target = new URL("../src/shared/", import.meta.url);
mkdirSync(target, { recursive: true });
for (const file of ["services-engine.js", "services-i18n.js"]) copyFileSync(new URL(file, root), new URL(file, target));
