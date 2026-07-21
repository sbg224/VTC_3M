WORKFLOW.md

AI Engineering System (AES)

Structure : issue d’AES v1.2.0

Statut : 🟡 Référence

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* SYSTEM.md
* RULES_OF_ENGAGEMENT.md
* AGENT.md
* STANDARDS.md
* CHECKLIST.md
* LEARNING.md

⸻

1. Objectif

Ce document définit le processus de travail standard de l’AI Engineering System (AES).

Il décrit les étapes qu’un développeur et un agent IA doivent suivre pour réaliser une tâche de manière cohérente, traçable et conforme aux principes du framework.

⸻

2. Principes

Chaque tâche suit le même processus.

L’objectif est de garantir :

* une compréhension commune du besoin ;
* une exécution maîtrisée ;
* une qualité constante ;
* une documentation maintenue à jour.

Le niveau de détail appliqué à chaque étape doit rester proportionné à la complexité et à l’impact de la tâche. « Proportionné » signifie que la profondeur de chaque étape varie, jamais qu’elle est supprimée. Les neuf étapes (§4) s’appliquent toujours. Le niveau de détail s’évalue selon trois critères : nombre de fichiers concernés, caractère structurant de la modification (architecture, sécurité, données) et réversibilité de l’action.

⸻

3. Consultation du référentiel

AES est conçu comme un référentiel documentaire.

Les agents ne doivent consulter que les documents nécessaires à la compréhension et à l’exécution de la tâche en cours.

Les documents du framework ne constituent pas un contexte à charger systématiquement avant chaque intervention. Ils sont consultés de manière sélective, en fonction du contexte, de la nature de la tâche et des informations recherchées, à l’exception du socle défini dans SYSTEM.md §4.

Cette approche permet de conserver un processus efficace tout en garantissant que chaque décision s’appuie sur la documentation pertinente.

⸻

4. Processus

Étape 1 — Analyse

Comprendre la demande.

Identifier :

* les objectifs ;
* le contexte ;
* les contraintes ;
* les impacts potentiels.

Déterminer quels documents du framework sont nécessaires à la réalisation de la tâche.

Selon le contexte, cela peut inclure notamment :

* CONTEXT.md ;
* STACK.md ;
* ARCHITECTURE.md ;
* DECISIONS.md ;
* AUDIT.md.

Seuls les documents pertinents doivent être consultés.

Aucune implémentation ne doit commencer tant que la demande et son contexte ne sont pas suffisamment compris.

⸻

Étape 2 — Planification

Définir une stratégie de réalisation.

Préciser notamment :

* les actions à effectuer ;
* les composants concernés ;
* les risques éventuels ;
* les impacts sur le projet.

⸻

Étape 3 — Validation

Lorsque la tâche implique une décision importante, une ambiguïté ou un impact significatif, présenter le plan proposé au développeur avant de poursuivre.

Le développeur reste le décideur final.

⸻

Étape 4 — Implémentation

Réaliser les modifications conformément :

* aux règles définies dans RULES_OF_ENGAGEMENT.md ;
* aux standards définis dans STANDARDS.md ;
* à l’architecture du projet.

⸻

Étape 5 — Vérification

Contrôler les résultats obtenus.

Vérifier notamment :

* la conformité fonctionnelle ;
* la cohérence technique ;
* les éventuelles régressions ;
* les impacts sur les autres composants.

Ces contrôles sont réalisés en exécutant les vérifications concernées, jamais en les présumant (voir CHECKLIST.md §5).

⸻

Étape 6 — Explication

Présenter un résumé clair des travaux réalisés.

Expliquer :

* les modifications effectuées ;
* les choix réalisés ;
* les conséquences éventuelles.

⸻

Étape 7 — Revue

Identifier les améliorations possibles.

Signaler :

* les points d’attention ;
* les limites connues ;
* les optimisations envisageables.

⸻

Étape 8 — Documentation

Identifier les documents impactés par les modifications réalisées, y compris LEARNING.md lorsque la tâche a produit un enseignement réutilisable au sens d’AES-R005 (RULES_OF_ENGAGEMENT.md).

Lorsque cela est nécessaire, proposer leur mise à jour au développeur.

Les agents ne modifient jamais la documentation de leur propre initiative.

⸻

Étape 9 — Finalisation

Avant de clôturer la tâche :

* appliquer la CHECKLIST.md ;
* confirmer que les objectifs sont atteints ;
* exécuter `git status` et `git diff` pour identifier les fichiers modifiés (cette séquence applique AES-R003 et AES-R013, RULES_OF_ENGAGEMENT.md) ;
* appliquer AES-R013 (RULES_OF_ENGAGEMENT.md). Si une donnée sensible est détectée, arrêter immédiatement, alerter le développeur et attendre ses instructions ;
* si les fichiers modifiés mélangent plusieurs tâches ou contiennent des éléments sans lien apparent avec la tâche en cours, ne pas proposer de commit et appliquer AES-R009 ;
* si aucune donnée sensible n’est détectée et que la modification correspond à une seule tâche, rédiger un message de commit qui décrit strictement cette tâche ;
* poser explicitement la question « Dois-je committer ces modifications ? » et attendre une réponse explicite avant d’exécuter `git commit` ; une absence de réponse ou une réponse ambiguë ne vaut pas validation ;
* une fois le commit réalisé, poser explicitement une seconde question, distincte de la première, « Dois-je pousser ce commit ? » et attendre une réponse explicite avant d’exécuter `git push` ;
* signaler les éventuels travaux restants.

⸻

5. Application

Ce workflow s’applique à toutes les tâches réalisées dans le cadre de l’AI Engineering System.

Le workflow constitue le processus de référence pour la collaboration entre le développeur et les agents IA.

⸻

6. Références

Ce document complète notamment :

* SYSTEM.md ;
* RULES_OF_ENGAGEMENT.md ;
* AGENT.md ;
* STANDARDS.md ;
* CHECKLIST.md ;
* LEARNING.md.

Il décrit le déroulement des tâches, tandis que les autres documents définissent les règles, les standards et les responsabilités.

⸻

7. Résultat attendu

L’application de ce workflow garantit que chaque tâche est :

* comprise avant d’être réalisée ;
* exécutée de manière cohérente ;
* vérifiée avant d’être terminée ;
* documentée lorsque cela est nécessaire.

Le workflow constitue le processus de référence de l’AI Engineering System.