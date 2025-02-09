// Function to fetch albums from MusicBrainz API
let isLoading = false;
let currentOffset = 0;
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between requests

// Add headers and delay utility
const headers = {
    'User-Agent': 'AlbumCollection/1.0.0 ( https://github.com/yourusername/album-collection )'
};

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function fetchWithRetry(url, retries = 3) {
    let attempt = 0;
    function makeRequest() {
        return delay(DELAY_BETWEEN_REQUESTS)
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

// First, get the artist MusicBrainz Identifier
function getArtistMBID(artistName) {
    const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(artistName)}&fmt=json&limit=1`;
    return fetchWithRetry(url)
        .then(response => response.json())
        .then(data => {
            if (data.artists && data.artists.length > 0) {
                return data.artists[0].id;
            }
            return Promise.reject(new Error('Artist not found'));
        });
}

// Function to fetch cover art URL
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
                return data.images[0].thumbnails.small || data.images[0].image;
            }
            return null; // Return null if no cover art is found
        })
        .catch(error => {
            console.error('Error fetching cover art:', error);
            return null;
        });
}

function fetchAlbums(query, searchType, callback) {
    if (isLoading) return;
    isLoading = true;
    showLoadingState();

    if (searchType === 'artist') {
        // Get MusicBrainz Identifier first, then fetch releases
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
        // Handle album search as before
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

function showLoadingState() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="loading">Loading...</div>';
}

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

// Function to display search results
function displaySearchResults(albums, query, searchType) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results
    
    if (!albums || albums.length === 0) {
        resultsContainer.innerHTML = '<p>No albums found.</p>';
        return;
    }

    console.log(`Total results before filtering: ${albums.length}`);

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
                        <h3>${title}</h3>
                        <p>Artist: ${artistName}</p>
                        <p>Release Date: ${releaseDate}</p>
                        ${coverArtURL ? `<img src="${coverArtURL}" alt="${title} cover art" style="width: 300px; height: 300px;" />` : '<p>NO ALBUM ART FOUND</p>'}
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
