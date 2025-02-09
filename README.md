# Album Collection

## Table of Contents
1. [Getting Started](#getting-started)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Contributing](#contributing)
7. [License](#license)

## Getting Started
Welcome to my Album Collection project! This is a Single Page Application (SPA) built with HTML, CSS, and JavaScript that allows users to search for albums, and save them to their personal collection. The project utilizes the MusicBrainz API to fetch data about albums and artists.

## Features
1. **Search for Albums**
   - Users can search for albums by artist name or album title.
   - The search results display a list of albums matching the query
   - The search also displays the release date of the albums on the album card.

2. **Save to Personal Collection**
   - Users can save albums to their personal collection.
   - The collection is managed locally using `localStorage`.

## Technologies Used
- HTML
- CSS
- JavaScript
- MusicBrainz API
- `localStorage` for managing user collections and favorites

## Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/terryleggettII/album-collection.git
    ```
2. Navigate to the project directory:
    ```sh
    cd album-collection
    ```
3. Open `index.html` in your browser to view the application.

## Usage
1. Open the application in your browser.
2. Use the search bar to find albums by artist name or album title.
3. Click on an album to view its details.
4. Save albums to your personal collection or add them to your favorites list.

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.