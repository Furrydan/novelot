# Novelot Requirements

## Project Goal

This project is meant to be a website that allows viewers to browse, search and read novels that are available for free without copyright. The distinguishing feature of this project is that thumbnails are created using AI-generated images, giving fans of anime and manga an alternative way to enjoy the classics.

## Features Expected

1. Novel Search
2. Novel Reviews
3. Novel Rating
4. Novel Reader
5. Account Creation
6. Account Stats
7. Fuzzy Finding for Novel Search
8. Ability to search for tags, ratings, reviews etc
9. Ability to sort by ratings, review count, likes etc

## Requirements for MVP

### Database

1. The database must be able to store user account data
    - Email
    - Hashed Password
    - Favorite Novels
    - Token Information
2. The email must be unique. Password must be at least 8 characters long and use one capital letter, one letter, one number and one special character

3. The database must store novel information
    - Title
    - Author
    - Views
    - Likes
    - Description
    - Tags
4. The title must be unique.
    
5. The database must store information that is encrypted in order to avoid user information leakage.
6. The database must follow other security practices.

### Back-end

1. The back-end is responsible for ensuring that data is encrypted and decrypted between the database and front-end.

## Deferred Work

### Authentication (from persistent login)

#### Back-end

2. Give the refresh token cookie a `maxAge` matching the token's expiry. It is currently a session cookie that is dropped when the browser closes.
3. Enforce an absolute session lifetime: a rotated refresh token keeps the expiry of the token it replaces instead of getting a fresh 7 days.
4. Detect refresh token reuse: presenting an already-rotated token should log the user out.
5. Allow a short grace period after rotation so that tabs refreshing at the same time are not treated as token reuse. Required before reuse detection.
6. Add a logout route that clears the refresh token cookie and the stored token. The cookie is scoped to `/api/users/refresh`, so logout needs access to it.

#### Front-end

1. Add an unknown auth state while the refresh on load is in flight, so the login button does not flash on reload.
2. Add an axios interceptor that refreshes the access token on a 401. It must be registered inside `AuthProvider` to share the in-flight refresh.

