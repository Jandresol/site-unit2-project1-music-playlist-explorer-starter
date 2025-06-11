import { SPOTIFY_TOKEN } from './config.js';

const modal = document.getElementById("playlistModal");
const span = document.getElementsByClassName("close")[0];
const container = document.getElementById("playlist-card-container");
const nowPlayingDiv = document.getElementById('now-playing');
const nowPlayingText = document.getElementById('now-playing-text');
let currentPlaylist = null;
let playlists = [];
let filteredPlaylists = [];
let nextPlaylistId = 1;

// Fetch data and render playlists
fetch("data/data.json")
    .then(res => res.json())
    .then(data => {
        playlists = data;
        filteredPlaylists = [...playlists];
        renderPlaylists();
    });

// Modal close logic
span.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// Modal open logic
function openModal(playlist) {
    currentPlaylist = playlist;
    document.getElementById('playlist-image').style.backgroundImage = `url('${playlist.imageUrl}')`;
    document.getElementById('playlist-name').innerText = playlist.name;
    document.getElementById('creator-name').innerText = playlist.creator;

    const songsContainer = document.getElementById('songs');
    songsContainer.innerHTML = '';

    playlist.songs.forEach(async song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        const spotifyData = await searchSongAndGetImage(song.title, song.artist);

        songCard.innerHTML = `
            <div class="song-info">
                <div class="song-thumbnail">
                    <img src="${spotifyData?.imageUrl || ''}" alt="Album Cover" style="width:60px;height:60px;object-fit:cover;">
                </div>
                <div class="song-details">
                    <p class="song-title">${song.title}</p>
                    <p class="song-artist">${song.artist}</p>
                    <p class="song-album">${spotifyData?.album || song.album}</p>
                </div>
            </div>
            <button class="play-button" onclick="event.stopPropagation(); togglePlay('${song.title}', '${song.artist}', this)">
                <i class="fa-solid fa-play"></i>
            </button>
            <div class="song-duration">${spotifyData?.duration || song.duration || '0:00'}</div>
        `;

        songCard.dataset.uri = spotifyData?.uri || '';
        songsContainer.appendChild(songCard);
    });

    modal.style.display = "block";
}

// Render all playlist cards
function renderPlaylists() {
    container.innerHTML = '';
    filteredPlaylists.forEach(playlist => {
        const card = document.createElement("div");
        card.classList.add("playlist-cards");
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${playlist.imageUrl}');"></div>
            <div class="playlist-text">
                <h3 class="playlist-title">${playlist.name}</h3>
                <h5 class="creator-name">Created by ${playlist.creator}</h5>
            </div>
            <div class="playlist-bottom">
                <div class="like-container">
                    <i class="fa-regular fa-heart"></i>
                    <p class="like-count">${playlist.likes}</p>
                </div>
                <div class="playlist-controls">
                    <button class="edit-button"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="delete-button"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;

        card.style.cursor = "pointer";
        card.addEventListener("click", () => openModal(playlist));

        const likeContainer = card.querySelector(".like-container");
        const heartIcon = likeContainer.querySelector("i");
        const likeCount = likeContainer.querySelector(".like-count");
        let liked = false;

        likeContainer.addEventListener("click", (event) => {
            event.stopPropagation();
            liked = !liked;
            heartIcon.classList.toggle("fa-regular", !liked);
            heartIcon.classList.toggle("fa-solid", liked);
            playlist.likes += liked ? 1 : -1;
            likeCount.textContent = playlist.likes;
        });

        const editButton = card.querySelector(".edit-button");
        const deleteButton = card.querySelector(".delete-button");

        editButton.addEventListener("click", (e) => {
            e.stopPropagation();
            openEditPlaylistModal(playlist.id);
        });

        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this playlist?")) {
                playlists = playlists.filter(p => p !== playlist);
                filteredPlaylists = [...playlists];
                renderPlaylists();
            }
        });

        container.appendChild(card);
    });
}

// Search
function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredPlaylists = [...playlists];
    } else {
        // Filter playlists based on search term
        filteredPlaylists = playlists.filter(playlist =>
            playlist.name.toLowerCase().includes(searchTerm) ||
            playlist.creator.toLowerCase().includes(searchTerm) ||
            playlist.songs.some(song =>
                song.title.toLowerCase().includes(searchTerm) ||
                song.artist.toLowerCase().includes(searchTerm)
            )
        );
    }
    renderPlaylists();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    filteredPlaylists = [...playlists];
    renderPlaylists();
}

// Event Listeners
document.getElementById('search-submit-btn').addEventListener('click', performSearch);
document.getElementById('search-clear-btn').addEventListener('click', clearSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
});

// Sort
document.getElementById('sort-dropdown').addEventListener('change', (e) => {
    const sortBy = e.target.value;
    const sortMethods = {
        name: (a, b) => a.name.localeCompare(b.name),
        creator: (a, b) => a.creator.localeCompare(b.creator),
        likes: (a, b) => b.likes - a.likes,
        recent: (a, b) => b.id - a.id,
    };
    filteredPlaylists.sort(sortMethods[sortBy]);
    renderPlaylists();
});

// Shuffle
document.getElementById("shuffle-button").addEventListener("click", () => {
    if (currentPlaylist) {
        for (let i = currentPlaylist.songs.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [currentPlaylist.songs[i], currentPlaylist.songs[j]] = [currentPlaylist.songs[j], currentPlaylist.songs[i]];
        }
        openModal(currentPlaylist);
    }
});

// Toggle Play
let currentlyPlaying = null;
let currentButton = null;

async function togglePlay(title, artist, button) {
    const songKey = `${title} - ${artist}`;
    const trackData = await searchSongAndGetImage(title, artist);
    if (!trackData?.uri) {
        alert("Spotify track not found.");
        return;
    }

    if (currentlyPlaying === songKey) {
        button.innerHTML = '<i class="fa-solid fa-play"></i>';
        button.parentElement.classList.remove('now-playing');
        nowPlayingDiv.style.display = 'none';
        currentlyPlaying = null;
        currentButton = null;
        pauseSpotify();
    } else {
        if (currentButton) {
            currentButton.innerHTML = '<i class="fa-solid fa-play"></i>';
            currentButton.parentElement.classList.remove('now-playing');
        }
        button.innerHTML = '<i class="fa-solid fa-pause"></i>';
        button.parentElement.classList.add('now-playing');
        nowPlayingText.textContent = `Now Playing: ${songKey}`;
        nowPlayingDiv.style.display = 'block';
        currentlyPlaying = songKey;
        currentButton = button;
        await playSpotifyTrack(trackData.uri);
    }
}

// Spotify helpers
async function searchSongAndGetImage(title, artist) {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: { Authorization: `Bearer ${SPOTIFY_TOKEN}` }
    });
    const data = await res.json();
    const track = data.tracks.items[0];
    return track ? {
        imageUrl: track.album.images[0]?.url,
        uri: track.uri,
        duration: msToMinSec(track.duration_ms),
        album: track.album.name
    } : null;
}

async function playSpotifyTrack(uri) {
    await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${SPOTIFY_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [uri] })
    });
}

async function pauseSpotify() {
    await fetch(`https://api.spotify.com/v1/me/player/pause`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${SPOTIFY_TOKEN}` }
    });
}

function msToMinSec(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Add Playlist form modal
let currentEditingPlaylistId = null;
document.getElementById('add-playlist-btn').addEventListener('click', openAddPlaylistModal);
document.getElementById('close-add-playlist').addEventListener('click', closeAddPlaylistModal);
document.getElementById('cancel-playlist').addEventListener('click', closeAddPlaylistModal);
document.getElementById('add-song-btn').addEventListener('click', addSongInput);
document.querySelector('.create-btn').addEventListener('click', () => {
    document.getElementById('add-playlist-form').requestSubmit();
});

function openAddPlaylistModal() {
    document.getElementById('addPlaylistModal').style.display = 'block';
    addSongInput();
}

function closeAddPlaylistModal() {
    document.getElementById('addPlaylistModal').style.display = 'none';
    resetAddPlaylistForm();
}

function resetAddPlaylistForm() {
    document.getElementById('add-playlist-form').reset();
    document.getElementById('songs-container').innerHTML = '';
}

function addSongInput() {
    const songsContainer = document.getElementById('songs-container');
    const songInputGroup = document.createElement('div');
    songInputGroup.className = 'song-input-group';
    songInputGroup.innerHTML = `
        <button type="button" class="remove-song-btn">
            <i class="fa-solid fa-times"></i>
        </button>
        <div class="song-input-row">
            <input type="text" placeholder="Song Title *" class="song-title-input" required>
            <input type="text" placeholder="Artist *" class="song-artist-input" required>
        </div>
    `;
    songsContainer.appendChild(songInputGroup);
    const removeBtn = songInputGroup.querySelector('.remove-song-btn');
    removeBtn.addEventListener('click', () => {
        songInputGroup.remove();
    });

}


// Submit new playlist
document.getElementById('add-playlist-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const playlistName = document.getElementById('playlist-name-input').value.trim();
    const playlistAuthor = document.getElementById('playlist-author-input').value.trim();
    const playlistImage = document.getElementById('playlist-image-input').value.trim();

    const songs = Array.from(document.querySelectorAll('.song-input-group')).map(songGroup => {
        const title = songGroup.querySelector('.song-title-input').value.trim();
        const artist = songGroup.querySelector('.song-artist-input').value.trim();
        return title && artist ? { title, artist, album: 'Album', duration: '3:30' } : null;
    }).filter(Boolean);

    if (!playlistName || !playlistAuthor) {
        alert('Please fill in all required fields (Name and Author).');
        return;
    }

    if (songs.length === 0) {
        alert('Please add at least one song to the playlist.');
        return;
    }

    const newPlaylist = {
        id: nextPlaylistId++,
        name: playlistName,
        creator: playlistAuthor,
        likes: 0,
        imageUrl: playlistImage || `https://picsum.photos/900/900?random=${nextPlaylistId}`,
        songs
    };

    playlists.unshift(newPlaylist);
    filteredPlaylists = [...playlists];
    renderPlaylists();
    closeAddPlaylistModal();
    showPopupMessage(`🎉 New playlist "${playlistName}" created with ${songs.length} song(s)!`);
});

// Edit Playlist form modal
document.getElementById('close-edit-playlist').addEventListener('click', closeEditPlaylistModal);
document.getElementById('cancel-edit').addEventListener('click', closeEditPlaylistModal);
document.getElementById('edit-song-btn').addEventListener('click', () => editSongInput());
document.getElementById('save-btn').addEventListener('click', () => {
    document.getElementById('edit-playlist-form').requestSubmit();
});

function openEditPlaylistModal(playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
        alert('Playlist not found.');
        return;
    }

    currentEditingPlaylistId = playlistId;
    document.getElementById('editPlaylistModal').style.display = 'block';
    
    // Populate form with existing data
    populateEditForm(playlist);
}

function closeEditPlaylistModal() {
    document.getElementById('editPlaylistModal').style.display = 'none';
    resetEditPlaylistForm();
    currentEditingPlaylistId = null;
}

function resetEditPlaylistForm() {
    document.getElementById('edit-playlist-form').reset();
    document.getElementById('edit-songs-container').innerHTML = '';
}

function populateEditForm(playlist) {
    // Fill basic info
    document.getElementById('edit-playlist-name-input').value = playlist.name;
    document.getElementById('edit-playlist-author-input').value = playlist.creator;

    // Clear existing song inputs
    document.getElementById('edit-songs-container').innerHTML = '';

    // Add song inputs for existing songs
    playlist.songs.forEach(song => {
        editSongInput(song.title, song.artist);
    });

    // Add one empty input if no songs exist
    if (playlist.songs.length === 0) {
        editSongInput();
    }
}
function editSongInput(title = '', artist = '') {
    const songsContainer = document.getElementById('edit-songs-container'); // <-- FIXED
    const songInputGroup = document.createElement('div');
    songInputGroup.className = 'song-input-group';
    songInputGroup.innerHTML = `
        <button type="button" class="remove-song-btn">
            <i class="fa-solid fa-times"></i>
        </button>
        <div class="song-input-row">
            <input type="text" placeholder="Song Title *" class="song-title-input" value="${title}" required>
            <input type="text" placeholder="Artist *" class="song-artist-input" value="${artist}" required>
        </div>
    `;
    songsContainer.appendChild(songInputGroup);
    
    const removeBtn = songInputGroup.querySelector('.remove-song-btn');
        removeBtn.addEventListener('click', () => {
            songInputGroup.remove();
    });

}


document.getElementById('edit-playlist-form').addEventListener('submit', function(e) {
    e.preventDefault();

    if (currentEditingPlaylistId === null) {
        alert('No playlist selected for editing.');
        return;
    }

    const playlistName = document.getElementById('edit-playlist-name-input').value.trim();
    const playlistAuthor = document.getElementById('edit-playlist-author-input').value.trim();

    // Collect songs
    const songInputs = document.querySelectorAll('#edit-songs-container .song-input-group');
    const songs = [];

    songInputs.forEach(songGroup => {
        const title = songGroup.querySelector('.song-title-input').value.trim();
        const artist = songGroup.querySelector('.song-artist-input').value.trim();
        
        if (title && artist) {
            songs.push({
                title: title,
                artist: artist,
                album: 'Album',
                duration: '3:30',
            });
        }
    });

    // Validation
    if (!playlistName || !playlistAuthor) {
        alert('Please fill in all required fields (Name and Author).');
        return;
    }

    if (songs.length === 0) {
        alert('Please add at least one song to the playlist.');
        return;
    }

    // Find and update the playlist
    const playlistIndex = playlists.findIndex(p => p.id === currentEditingPlaylistId);
    if (playlistIndex === -1) {
        alert('Playlist not found.');
        return;
    }

    // Update playlist data (preserve id and likes)
    playlists[playlistIndex] = {
        ...playlists[playlistIndex],
        name: playlistName,
        creator: playlistAuthor,
        imageUrl: playlists[playlistIndex].imageUrl,
        songs: songs
    };

    // Update filtered playlists
    filteredPlaylists = [...playlists];

    // Re-render playlists
    renderPlaylists();

    // Close modal and reset form
    closeEditPlaylistModal();

    // Show success message
    showPopupMessage(`Playlist "${playlistName}" updated successfully with ${songs.length} song(s)!`);
});

window.togglePlay = togglePlay;

function showPopupMessage(message) {
    const popup = document.getElementById('popup-message');
    popup.textContent = message;
    popup.classList.remove('hidden');
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.classList.add('hidden'), 400); // Wait for fade-out transition
    }, 3000); // Show for 3 seconds
}
