document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');
    const albumDetails = document.getElementById('album-details');
    const personalCollection = document.getElementById('personal-collection');
    const favoritesList = document.getElementById('favorites-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');

    // Fetch albums from MusicBrainz API
    async function fetchAlbums(query) {
        try {
            loadingIndicator.classList.remove('hidden');
            errorMessage.classList.add('hidden');
            const response = await fetch(`https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json`);
            const data = await response.json();
            displaySearchResults(data.releases);
        } catch (error) {
            errorMessage.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }

    // Display search results
    function displaySearchResults(albums) {
        searchResults.innerHTML = '';
        if (albums.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }
        albums.forEach(album => {
            const albumElement = document.createElement('div');
            albumElement.textContent = album.title;
            albumElement.addEventListener('click', () => fetchAlbumDetails(album.id));
            searchResults.appendChild(albumElement);
        });
    }

    // Fetch and display album details
    async function fetchAlbumDetails(albumId) {
        const response = await fetch(`https://musicbrainz.org/ws/2/release/${albumId}?fmt=json`);
        const data = await response.json();
        displayAlbumDetails(data);
    }

    function displayAlbumDetails(album) {
        albumDetails.innerHTML = `
            <h2>${album.title}</h2>
            <p>Release Date: ${album.date}</p>
            <button id="save-to-collection">Save to Collection</button>
            <button id="add-to-favorites">Add to Favorites</button>
        `;

        document.getElementById('save-to-collection').addEventListener('click', () => saveToCollection(album.id));
        document.getElementById('add-to-favorites').addEventListener('click', () => addToFavorites(album.id));
    }

    // Save album to personal collection
    function saveToCollection(albumId) {
        let collection = JSON.parse(localStorage.getItem('collection')) || [];
        collection.push(albumId);
        localStorage.setItem('collection', JSON.stringify(collection));
        displayPersonalCollection();
    }

    // Display personal collection
    function displayPersonalCollection() {
        let collection = JSON.parse(localStorage.getItem('collection')) || [];
        personalCollection.innerHTML = '';
        collection.forEach(albumId => {
            const albumElement = document.createElement('div');
            albumElement.textContent = albumId; // Fetch and display album details based on albumId
            personalCollection.appendChild(albumElement);
        });
    }

    // Add album to favorites
    function addToFavorites(albumId) {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites.push(albumId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        displayFavoritesList();
    }

    // Display favorites list
    function displayFavoritesList() {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favoritesList.innerHTML = '';
        favorites.forEach(albumId => {
            const albumElement = document.createElement('div');
            albumElement.textContent = albumId; // Fetch and display album details based on albumId
            favoritesList.appendChild(albumElement);
        });
    }

    // Event listener for search bar
    searchBar.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query) {
            fetchAlbums(query);
        } else {
            searchResults.innerHTML = '';
        }
    });

    // Initial display of personal collection and favorites list
    displayPersonalCollection();
    displayFavoritesList();
});