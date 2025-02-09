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

function addAlbumToFavorites(album) {
    fetch('http://localhost:3000/favoriteAlbums', {
        method: postMessage,
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
        console.log('Album added to favorites:', data)
    })
    .catch(error => {
        console.error('Error adding album to favorites:', error)
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
                callback(data['release-groups'], query, searchType);
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
                
                callback(data['release-groups'], query, searchType);
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
    resultsContainer.innerHTML = '<div class="loading">Loading...</div>';
}

// Function to remove the loading message after API calls complete
function hideLoadingState() {
    const loadingDiv = document.querySelector('.loading');
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

// Function to display search results in the UI
function displaySearchResults(albums, query, searchType) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results
    
    if (!albums || albums.length === 0) {
        resultsContainer.innerHTML = '<p>No albums found.</p>';
        return;
    }
    // Update filtering logic for the new response format
    const filteredAlbums = albums.filter(album => {
        if (searchType === 'artist') {            
            // Only include albums (not singles, EPs, etc.)
            const primaryType = album['primary-type'] || '';
            const secondaryTypes = album['secondary-types'] || [];
            return primaryType.toLowerCase() === 'album' && secondaryTypes.length === 0;
        } else {
            return album.title.trim().toLowerCase().includes(query.trim().toLowerCase());
        }
    });

    // Sort by relevance score
    filteredAlbums.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Filtered results: ${filteredAlbums.length}`);

    if (filteredAlbums.length === 0) {
        resultsContainer.innerHTML = '<p>No albums found.</p>';
        return;
    }

    resultsContainer.innerHTML = `<p>Found ${filteredAlbums.length} results:</p>`;
    
    filteredAlbums.reduce((promise, album) => {
        return promise.then(() => {
            if (!album) return Promise.resolve();
            
            const albumDiv = document.createElement('div');
            albumDiv.className = 'album';
            
            const title = album.title || album.name || 'Unknown Title';
            
            return getArtistName(album).then(artistName => {
                const releaseDate = album['first-release-date'] || 'Unknown Release Date';
                return getCoverArtURL(album.id).then(coverArtURL => {
                    albumDiv.innerHTML = `
                        ${coverArtURL ? `<img src="${coverArtURL}" alt="${title} cover art" style="width: 200px; height: 200px;" />` : '<p>NO ALBUM ART FOUND</p>'}
                        <h3>${title}</h3>
                        <p><strong>Artist:</strong> ${artistName}</p>
                        <p><strong>Release Date:</strong> ${releaseDate}</p>
                    `;
                    resultsContainer.appendChild(albumDiv);
                });
            });
        });
    }, Promise.resolve());
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

    // Check saved preference in localStorage
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️ Light Mode";
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
            darkModeToggle.textContent = "☀️ Light Mode";
        } else {
            localStorage.setItem("darkMode", "disabled");
            darkModeToggle.textContent = "🌙 Dark Mode";
        }
    });
});

// Add a Loading Spinner
function showLoadingState() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="loading-spinner"></div>';
}