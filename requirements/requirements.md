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

