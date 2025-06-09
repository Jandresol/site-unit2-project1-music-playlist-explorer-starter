const modal = document.getElementById("playlistModal");
const span = document.getElementsByClassName("close")[0];

function openModal(playlist) {
    // Set playlist header info
        document.getElementById('playlist-image').src = playlist.imageUrl;
        document.getElementById('playlist-name').innerText = playlist.name;
        document.getElementById('creator-name').innerText = playlist.creator;

    // Clear any existing songs
        const songsContainer = document.getElementById('songs');
        songsContainer.innerHTML = '';

    // Add each song to the modal
    playlist.songs.forEach(song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';

        songCard.innerHTML = `
        <div class="song-info">
            <div class="song-thumbnail"></div>
            <div class="song-details">
            <p class="song-title">${song.title}</p>
            <p class="song-artist">${song.artist}</p>
            <p class="song-album">${song.album}</p>
            </div>
        </div>
        <div class="song-duration">${song.duration || '0:00'}</div>
        `;

        songsContainer.appendChild(songCard);
    });

    // Show the modal
    modal.style.display = "block";
    }

    // Close modal on (x)
    span.onclick = function () {
        modal.style.display = "none";
    }

// Close modal on outside click
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
