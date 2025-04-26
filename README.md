# Album Collection 🎵
A sleek single-page app for finding and saving your favorite albums.


## Table of Contents
1. [Getting Started](#getting-started)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Installation](#installation)
5. [Usage](#usage)

## Getting Started
Welcome to my Album Collection project! This is a Single Page Application (SPA) built with HTML, CSS, and JavaScript that allows users to search for albums, and save them to their Favorite Albums Collection. The project utilizes the MusicBrainz API to fetch data about albums and artists.

## Features

 1. **Search for Albums**
   - Users can search for albums by artist name or album title.
   - The search results display a list of albums matching the query.
   - The search also displays the release date of the albums on the album card.

2. **Save to Album Favorites Collection**
   - Users can save albums to their personal collection.
   - The collection is managed locally using `localStorage`.

## Technologies Used
- HTML
- CSS
- JavaScript
- MusicBrainz API
- `localStorage` for managing user's favorites

## Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/terryleggettII/album-collection.git
    ```
2. Navigate to the project directory:
    ```sh
    cd album-collection
    ```
3. Open `index.html` directly in your browser, or open the project with a live server extension.

4. (Optional) To start a local JSON server with `db.json`:
    ```sh
    json-server --watch db.json
    ```


## Usage
1. Open the application in your browser.
2. Use the search bar to find albums by artist name or album title.
4. Save albums to your favorites collection.
