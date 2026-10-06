# État structuré futur de Flow — analyse, sans implémentation

Le lot conversation/interface conserve uniquement les messages et l’état des
requêtes. Aucun résumé automatique, extraction de faits ou nouvelle mémoire
n’est implémenté.

Pour conserver quelques faits au-delà de la fenêtre des 20 messages envoyée au
modèle, il faudrait un état isolé par utilisateur, projet et conversation :

| Fait | Données minimales | Précaution |
| --- | --- | --- |
| Progression confirmée | section/pièce, valeur, unité, rang terminé ou en cours, message source, date | Ne pas remplacer par une déduction du patron ou le compteur de l’application. |
| Mailles constatées | nombre, section/pièce, message source, date | Ne pas en déduire automatiquement un rang ou l’historique des augmentations. |
| Incohérence connue | constat utilisateur, état enregistré, attendu du patron et version de référence, statut ouvert/résolu | Garder les trois sources distinctes ; une correction explicite peut invalider le diagnostic précédent. |
| Langue de conversation | langue explicitement demandée, message source, date | Distinguer interface, conversation et langue d’une traduction ponctuelle. |

Une déclaration incertaine doit rester incertaine. Une correction plus récente
doit remplacer le fait concerné avec sa provenance, sans effacer les autres
observations. Un changement de section/pièce ou de patron doit rendre les faits
hors contexte inactifs plutôt que les appliquer au nouvel ouvrage.

Il faudra décider séparément de la conservation locale ou serveur, du partage
entre appareils, de la durée de conservation et de l’effacement avec la
conversation. L’extraction automatique éventuelle devra être vérifiée et
testée avant usage : une ancienne réponse de Flow ne constitue pas une
observation utilisateur. Le système d’évaluation Gemini reste hors de ce lot.
