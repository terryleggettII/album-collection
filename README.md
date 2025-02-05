# Album Collection

## Introduction
Welcome to the Album Collection project! This is a Single Page Application (SPA) built with HTML, CSS, and JavaScript that allows users to search for albums, view detailed information about them, and save them to their personal collection. The project utilizes the MusicBrainz API to fetch data about albums and artists.

## Project Requirements
- **Frontend**: HTML, CSS, and JavaScript
- **Backend**: MusicBrainz API (No API key required)
- **Data**: Minimum of 5 objects with at least 3 attributes each
- **Asynchronous Interactions**: Handled using `fetch` and JSON
- **Single Page Application**: No redirects or reloads
- **Event Listeners**: At least 3 distinct event listeners
- **Array Iteration**: Implement at least one instance using array methods

## Features
1. **Search for Albums**
   - Users can search for albums by artist name or album title.
   - The search results display a list of albums matching the query.

2. **View Album Details**
   - Users can click on an album to view detailed information, including track listings and release date.

3. **Save to Personal Collection**
   - Users can save albums to their personal collection.
   - The collection is managed locally using `localStorage`.

4. **Filter and Sort**
   - Users can filter albums by genre, release date, or artist.
   - Users can sort albums by title or release date.

5. **Favorites List**
   - Users can create a list of favorite albums.
   - Favorites are saved and managed locally using `localStorage`.

## Stretch Goals
- **Persist App Interactivity**: Use `json-server` to persist user interactions, such as saving favorite albums.

## Technologies Used
- HTML
- CSS
- JavaScript
- MusicBrainz API
- `localStorage` for managing user collections and favorites

## Setup and Installation

### 1. Clone the Repository
First, clone the repository to your local machine using Git:
```bash
git clone https://github.com/your-username/album-collection.git
cd album-collection
