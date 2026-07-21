CHECKLIST.md

AI Engineering System (AES)

Structure : issue d’AES v1.2.0

Statut : 🟡 Référence

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* WORKFLOW.md
* STANDARDS.md
* AUDIT.md
* RULES_OF_ENGAGEMENT.md

⸻

1. Objectif

Ce document définit les points de contrôle à vérifier avant de considérer une tâche comme terminée.

Il garantit une qualité constante et limite les oublis lors du développement.

⸻

2. Portée

La checklist est utilisée pour valider la qualité d’une tâche avant sa clôture.

Elle constitue un contrôle opérationnel réalisé à la fin d’une implémentation ou d’une modification.

Elle ne remplace pas un audit global du projet.

⸻

3. Checklist générale

Avant de clôturer une tâche, vérifier que :

* les objectifs sont atteints ;
* les exigences fonctionnelles sont respectées ;
* les standards de développement sont appliqués ;
* les règles du framework sont respectées ;
* aucune régression connue n’a été introduite ;
* le code est lisible et cohérent ;
* les erreurs sont correctement gérées ;
* les impacts éventuels ont été identifiés.

⸻

4. Documentation

Vérifier si une mise à jour est nécessaire pour :

* CONTEXT.md ;
* ARCHITECTURE.md ;
* STACK.md ;
* DECISIONS.md ;
* AUDIT.md ;
* CHANGELOG.md.

Toute modification reste soumise à la validation du développeur.

⸻

5. Vérifications techniques

Lorsque cela est applicable :

* le projet compile correctement ;
* les tests sont exécutés ;
* les outils d’analyse ne signalent pas d’erreur bloquante ;
* les performances restent conformes aux attentes ;
* les exigences de sécurité sont respectées.

Chaque item de cette liste est vérifié en exécutant réellement la commande, le script ou l’outil correspondant, jamais en affirmant un résultat sans l’avoir observé. Le résultat obtenu, qu’il s’agisse d’un succès, d’un échec ou d’un avertissement, est rapporté tel quel au développeur, y compris lorsqu’il diffère du résultat attendu.

Si aucun moyen de vérification automatisé n’existe pour un item donné, celui-ci est marqué non applicable au sens du §7, jamais coché par défaut.

⸻

6. Vérifications fonctionnelles

Confirmer que :

* le comportement attendu est obtenu ;
* les cas principaux fonctionnent correctement ;
* les cas d’erreur connus sont pris en compte.

⸻

7. Revue finale

Avant de terminer une tâche, l’agent doit être capable d’expliquer :

* ce qui a été réalisé ;
* les choix effectués ;
* les impacts éventuels ;
* les limites connues ;
* les éventuelles actions restant à effectuer.

La checklist valide qu’une tâche est terminée conformément aux exigences du framework.

Un item de la checklist n’est considéré comme vérifié que s’il a été concrètement contrôlé, jamais supposé ou coché par convenance.

Un item non applicable à la tâche en cours est marqué explicitement comme non applicable, plutôt que silencieusement ignoré.

La checklist n’est considérée complète que lorsque chaque item concerné par la tâche a reçu un statut explicite : vérifié, non applicable, ou en écart. Un écart, c’est-à-dire un point qui ne peut pas être respecté, est signalé au développeur avant la clôture de la tâche, jamais dissimulé.

L’évaluation globale de la qualité, de la cohérence et de la maintenabilité du projet relève d’un audit documenté dans AUDIT.md.

⸻

8. Références

Cette checklist complète le processus décrit dans WORKFLOW.md.

Elle s’appuie également sur :

* STANDARDS.md ;
* RULES_OF_ENGAGEMENT.md ;
* AUDIT.md.