// Function to fetch albums from MusicBrainz API
let isLoading = false;
let currentOffset = 0;
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between requests

// Headers for API requests to comply with MusicBrainz API requirements
const headers = {
    'User-Agent': 'AlbumCollection/1.0.0 ( https://github.com/yourusername/album-collection )'
};

// Utility function to create a delay before making API requests
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

// Function to retry API requests in case of failures
function fetchWithRetry(url, retries = 3) {
    let attempt = 0;
    function makeRequest() {
        return delay(DELAY_BETWEEN_REQUESTS) // Introduce delay between requests
            .then(() => fetch(url, { headers }))
            .catch(error => {
                if (attempt < retries - 1) {
                    attempt++;
                    return makeRequest();
                } else {
                    return Promise.reject(error);
                }
            });
    }
    return makeRequest();
}

// Function to retrieve an artist's MusicBrainz Identifier (MBID)
function getArtistMBID(artistName) {
    const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(artistName)}&fmt=json&limit=1`;
    return fetchWithRetry(url)
        .then(response => response.json())
        .then(data => {
            if (data.artists && data.artists.length > 0) {
                return data.artists[0].id; // Return the first matching artist's MBID
            }
            return Promise.reject(new Error('Artist not found'));
        });
}

// Function to fetch cover art for a release group
function getCoverArtURL(releaseGroupId) {
    const url = `https://coverartarchive.org/release-group/${releaseGroupId}`;
    return fetchWithRetry(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return Promise.reject(new Error('Error fetching cover art'));
        })
        .then(data => {
            if (data.images && data.images.length > 0) {
                return data.images[0].thumbnails.small || data.images[0].image; // Return cover art URL
            }
            return null; // Return null if no cover art is found
        })
        .catch(error => {
            console.error('Error fetching cover art:', error);
            return null;
        });
}

// Function to add an album to the favorites list
function addAlbumToFavorites(album) {
    fetch('http://localhost:3000/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(album)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Album added to favorites:', data);
        // Update the favorites list in the DOM
        const favoritesContainer = document.getElementById('favorites');
        displayAlbums([data], favoritesContainer, true);
    })
    .catch(error => {
        console.error('Error adding album to favorites:', error);
    });
}

// Function to remove an album from the favorites list
function removeAlbumFromFavorites(albumId) {
    fetch(`http://localhost:3000/favorites/${albumId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Album removed from favorites:', data);
        // Remove the album from the favorites list in the DOM
        const albumDiv = document.querySelector(`.album[data-id="${albumId}"]`);
        if (albumDiv) {
            albumDiv.remove();
        }
    })
    .catch(error => {
        console.error('Error removing album from favorites:', error);
    });
}

// Function to fetch albums based on user query and search type
function fetchAlbums(query, searchType, callback) {
    if (isLoading) return; // Prevent duplicate searches
    isLoading = true;
    showLoadingState();

    if (searchType === 'artist') {
        // Fetch artist MBID first, then fetch albums
        getArtistMBID(query.trim())
            .then(mbid => {
                const url = `https://musicbrainz.org/ws/2/release-group/?artist=${mbid}&type=album&limit=100&offset=${currentOffset}&fmt=json`;
                return fetchWithRetry(url);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Raw API response:', data);
                if (!data || !data['release-groups']) {
                    throw new Error('Invalid API response structure');
                }

                // Filter out non-official album releases
                const filteredAlbums = data['release-groups'].filter(album => {
                    const primaryType = album['primary-type'] || '';
                    const secondaryTypes = album['secondary-types'] || [];
                    return primaryType.toLowerCase() === 'album' && secondaryTypes.length === 0;
                });

                callback(filteredAlbums, query, searchType);
                isLoading = false;
                hideLoadingState();
            })
            .catch(error => {
                console.error('Error:', error);
                displaySearchResults(null, query, searchType);
                isLoading = false;
                hideLoadingState();
            });
    } else {
        // Fetch albums directly if searching by album name
        const url = `https://musicbrainz.org/ws/2/release-group/?query=release:${encodeURIComponent(query.trim())}&type=album&fmt=json&limit=100`;
        fetchWithRetry(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Raw API response:', data);
                if (!data || !data['release-groups']) {
                    throw new Error('Invalid API response structure');
                }

                // Filter out non-official album releases and allow partial matches for album titles
                const filteredAlbums = data['release-groups'].filter(album => {
                    const primaryType = album['primary-type'] || '';
                    const secondaryTypes = album['secondary-types'] || [];
                    const title = album.title || album.name || '';
                    return primaryType.toLowerCase() === 'album' && secondaryTypes.length === 0 && title.toLowerCase().includes(query.trim().toLowerCase());
                });

                callback(filteredAlbums, query, searchType);
                isLoading = false;
                hideLoadingState();
            })
            .catch(error => {
                console.error('Error fetching albums:', error);
                displaySearchResults(null, query, searchType);
                isLoading = false;
                hideLoadingState();
            });
    }
}

// Function to show a loading message during API calls
function showLoadingState() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
}

// Function to remove the loading message after API calls complete
function hideLoadingState() {
    const loadingDiv = document.querySelector('.loading-spinner');
    if (loadingDiv) loadingDiv.remove();
}

// Helper function to safely get artist name
function getArtistName(album) {
    console.log('Album object:', album);
    if (album['artist-credit'] && album['artist-credit'][0]) {
        return Promise.resolve(album['artist-credit'][0].name || album['artist-credit'][0].artist.name || 'Unknown Artist');
    }
    // Fallback to fetching artist name separately if not present in album object
    return fetchArtistName(album.id);
}

function fetchArtistName(releaseGroupId) {
    const url = `https://musicbrainz.org/ws/2/release-group/${releaseGroupId}?inc=artist-credits&fmt=json`;
    return fetchWithRetry(url)
        .then(response => response.json())
        .then(data => {
            if (data['artist-credit'] && data['artist-credit'][0]) {
                return data['artist-credit'][0].name || data['artist-credit'][0].artist.name || 'Unknown Artist';
            }
            return 'Unknown Artist';
        })
        .catch(error => {
            console.error('Error fetching artist name:', error);
            return 'Unknown Artist';
        });
}

// Function to fetch and display the favorites list
function fetchFavorites() {
    fetch('http://localhost:3000/favorites')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Favorites:', data);
            displayFavorites(data);
        })
        .catch(error => {
            console.error('Error fetching favorites:', error);
        });
}

// Function to display the favorites list in the UI
function displayFavorites(favorites) {
    const favoritesContainer = document.getElementById('favorites');
    favoritesContainer.innerHTML = ''; // Clear previous content
    displayAlbums(favorites, favoritesContainer, true); // Use same album display logic
}

// Call fetchFavorites to display the favorites list when the page loads
document.addEventListener('DOMContentLoaded', fetchFavorites);

// Function to display albums in the UI
function displayAlbums(albums, container, isFavoriteSection = false, resultType = 'album') {
    if (!albums || albums.length === 0) {
        container.innerHTML = `<p>No ${resultType === 'artist' ? 'artists' : 'albums'} found.</p>`;
        hideLoadingState(); // Hide loading state if no albums found
        return;
    }

    const albumPromises = albums.map(album => {
        const albumDiv = document.createElement('div');
        albumDiv.className = 'album';
        albumDiv.setAttribute('data-id', album.id);

        const title = album.title || album.name || 'Unknown Title';

        return getArtistName(album).then(artistName => {
            const releaseDate = album['first-release-date'] || 'Unknown Release Date';
            return getCoverArtURL(album.id).then(coverArtURL => {
                albumDiv.innerHTML = `
                    ${coverArtURL ? `<img src="${coverArtURL}" alt="${title} cover art" style="width: 200px; height: 200px;" />` : '<p>NO ALBUM ART FOUND</p>'}
                    <h3>${title}</h3>
                    <p><strong>Artist:</strong> ${artistName}</p>
                    <p><strong>Release Date:</strong> ${releaseDate}</p>
                    <button class="${isFavoriteSection ? 'remove-from-favorites' : 'add-to-favorites'}">
                        ${isFavoriteSection ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                `;
                container.appendChild(albumDiv);

                // Add event listener to the button
                if (isFavoriteSection) {
                    albumDiv.querySelector('.remove-from-favorites').addEventListener('click', () => {
                        removeAlbumFromFavorites(album.id);
                    });
                } else {
                    albumDiv.querySelector('.add-to-favorites').addEventListener('click', () => {
                        addAlbumToFavorites(album);
                    });
                }
            });
        });
    });

    // Wait for all album promises to resolve before hiding the loading state
    Promise.all(albumPromises).then(() => {
        hideLoadingState();
    });
}

// Function to display search results in the UI
function displaySearchResults(albums, query, searchType) {
    const resultsContainer = document.getElementById('results');
    displayAlbums(albums, resultsContainer, false, searchType);
}

// Event listener for search form submission
document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    currentOffset = 0; // Reset offset for new searches
    const query = document.getElementById('search-input').value;
    const searchType = document.getElementById('search-type').value;
    fetchAlbums(query, searchType, displaySearchResults);
});

// Dark mode toggle functionality
document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const body = document.body;
    const title = document.querySelector(".title");

    // Check saved preference in localStorage
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
        title.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️ Light Mode";
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");
        title.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
            darkModeToggle.textContent = "☀️ Light Mode";
        } else {
            localStorage.setItem("darkMode", "disabled");
            darkModeToggle.textContent = "🌙 Dark Mode";
        }
    });
});