# Novelot

## TLDR
Novelot is a webapp that is meant to allow readers to find and view their favorite classic and copyright free novels with an anime twist. With new anime thumbnails, some AI-generated illustrations Novelot is meant to provide anime fans a new way to enjoy the classics.

PS: The project is still in development.

## Stack

| Utility  | Tool  | Dependencies  |
|---       |---    |---            |
| Frontend| React  | Axios, React Router  |
| Backend | Nodejs | Express  |
| Databse | MongoDB|

## How to start Novelot

Currently, you need docker in order to start host novelot locally. While future plans involve deployment to the cloud, a developer can start the project by running the following command:
```bash
docker compose up
```
If this is the first time running the project or the developer has made changes, then run the following command instead:
```bash
docker compose up --build
```

In order to shut down the docker containers, run:
```bash
docker compose down
```

If you want to purge the mongodb volumes, run:
```bash
docker compose down -v
```

In order to be able to run the project, you need certain environment variables.
### Backend
1. MONGODB_URI - You can match this with the port in the docker compose file.
2. ACCESS_TOKEN_SECRET - A custom key to generate your access tokens. 
3. REFRESH_TOKEN_SECRET - A custom key to generate your refresh token.

### Frontend
No environment variables at the moment.
