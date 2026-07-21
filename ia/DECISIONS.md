DECISIONS.md

AI Engineering System (AES)

Structure : issue d’AES v1.1.0

Statut : 🟢 Vivant

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* ARCHITECTURE.md
* CONTEXT.md
* AUDIT.md
* CHANGELOG.md
* STACK.md

⸻

1. Objectif

Ce document conserve l’historique des décisions importantes prises au cours du projet.

Il permet de comprendre les choix réalisés, leur contexte et leur justification.

⸻

2. Organisation

Chaque décision reçoit un identifiant unique.

Exemple :

* ADR-001
* ADR-002
* ADR-003

Les identifiants ne sont jamais réutilisés.

⸻

3. Structure d’une décision

Chaque décision doit contenir au minimum :

Identifiant

Exemple :

ADR-001

Date

Date et heure de validation, au format AAAA-MM-JJ HH:MM, pour identifier chaque décision de façon unique et chronologique.

Auteur

Développeur ou équipe ayant validé la décision.

Contexte

Pourquoi cette décision était-elle nécessaire ?

Décision

Description du choix retenu.

Justification

Pourquoi cette solution a-t-elle été préférée aux autres ?

Alternatives étudiées

Présenter les principales options envisagées.

Conséquences

Décrire les impacts positifs, les limites et les compromis associés à cette décision.

Statut

Par exemple :

* Proposée
* Validée
* Remplacée
* Abandonnée

⸻

4. Bonnes pratiques

Une décision doit :

* être claire ;
* être justifiée ;
* être traçable ;
* pouvoir être comprise plusieurs mois ou années plus tard.

Les décisions mineures ne sont pas documentées.

Seuls les choix ayant un impact significatif sur le projet sont enregistrés.

Sur un projet déjà en cours au moment de l’adoption d’AES, ce document reste vide à l’installation, comme pour un projet neuf ; seules les décisions prises à partir de cette adoption y sont consignées. Une reconstitution rétroactive d’un choix passé encore visible dans le code peut être proposée par l’agent, mais uniquement à la demande du développeur, jamais d’office. Le champ Justification n’est alors jamais deviné. Soit le développeur la fournit, soit il reste marqué « non documentée à l’origine ». Chaque entrée reconstituée porte la mention « décision reconstituée a posteriori, à la date d’adoption d’AES » dans son Contexte.

⸻

5. Évolution

Une décision validée n’est jamais supprimée.

Si elle devient obsolète, son statut est mis à jour et une nouvelle décision est créée pour la remplacer.

⸻

6. Références

Ce document s’appuie notamment sur AUDIT.md, lorsqu’un audit conduit à une décision.

Les décisions peuvent entraîner des mises à jour de :

* ARCHITECTURE.md ;
* STACK.md ;
* CONTEXT.md ;
* CHANGELOG.md.

Elles peuvent également être citées dans les audits (AUDIT.md) lorsqu’un choix d’architecture ou d’organisation est évalué.