# Netflux

Netflux est un projet [client](https://github.com/La229028/client_project_web_2024-2025) React communiquant avec un [back-end](https://github.com/La229028/server_projet_web_2024-2025) en express affichant des films provenant de l'api de [TMDB](https://www.themoviedb.org/). Il permet aux utilisateurs de trier comme un bookmark les films qu'ils ont déjà vu ou non ainsi que ceux qu'ils ont aimés ou non, et tout cela seul ou en groupe, vous permettant de choisir des films qui correspondront à toute la famille.

## Installation

Une fois le projet importé par `git clone` vous devrez installez les packages contenu en faisant dans le dossier racine de l'application;

```npm
npm install
```
Pour l'instant, contentez-vous du dev car le build bien que fonctionnel, encore rien ne sert la page client en build.

Pour une question de simplicité, créez un fichier `test.deb` dans le fichier racine du serveur, communication en sqlite. Il y a tout ce qu'il faut pour communiquer en MySql si vous le souhaitez mais cela inclus de modifier `src/utils/AppDataSource.ts` et ainsi permettre la connexion avec votre db.

N'oubliez pas de créer un .env à la racine du serveur en vous basant sur le `.env.sample`

Ainsi, vous n'avez qu'à faire au client et au serveur;
```npm
npm run dev
```

Et voilà, le client est servi au `localhost:5173` !