// import { SPOTIFY_TOKEN } from './config.js';

const modal = document.getElementById("playlistModal");
const span = document.getElementsByClassName("close")[0];
const container = document.getElementById("playlist-card-container");
const nowPlayingDiv = document.getElementById('now-playing');
const nowPlayingText = document.getElementById('now-playing-text');
let currentPlaylist = null;
let playlists = [];
let filteredPlaylists = [];

const SPOTIFY_TOKEN = 'BQDXJ2cxgudsaX16QV2fhFYfro9J1EXg-69llAPenk8NMJk98x493uhdW20ouLABqKHsxNRfOQQ2Qs0cNmQwqcmfDPvkdIHtl9Pg0xR4ewr0701btusV66-d3f4Hx28_OM6aNmjGgWI'; 

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
                    <p class="song-album">${song.album}</p>
                </div>
            </div>
            <button class="play-button" onclick="event.stopPropagation(); togglePlay('${song.title}', '${song.artist}', this)">
                <i class="fa-solid fa-play"></i>
            </button>
            <div class="song-duration">${song.duration || '0:00'}</div>
        `;

        songCard.dataset.uri = spotifyData?.uri || '';
        songsContainer.appendChild(songCard);
        
    });

    modal.style.display = "block";
}


span.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

fetch("data/data.json")
    .then(res => res.json())
    .then(data => {
        playlists = data;
        filteredPlaylists = [...playlists];
        renderPlaylists();
    });

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

            container.appendChild(card);

            const editButton = card.querySelector(".edit-button");
            const deleteButton = card.querySelector(".delete-button");

            // Edit logic
            editButton.addEventListener("click", (e) => {
                e.stopPropagation();
                const newName = prompt("Enter new playlist name:", playlist.name);
                if (newName && newName.trim() !== "") {
                    playlist.name = newName;
                    card.querySelector(".playlist-title").textContent = newName;

                    // Optional: update modal if it's open
                    if (currentPlaylist === playlist) {
                        document.getElementById('playlist-name').innerText = newName;
                    }

                    // Save to localStorage or backend if needed
                }
            });

            // Delete logic
            deleteButton.addEventListener("click", (e) => {
                e.stopPropagation();
                const confirmDelete = confirm("Are you sure you want to delete this playlist?");
                if (confirmDelete) {
                    container.removeChild(card);

                    // Optional: remove from playlist array if needed
                    // playlists = playlists.filter(p => p !== playlist);

                    // Save changes to localStorage or backend if needed
                }
            });

        });

}

function shuffleSongs(playlist) {
    const songsContainer = document.getElementById('songs');
    for (let i = playlist.songs.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [playlist.songs[i], playlist.songs[j]] = [playlist.songs[j], playlist.songs[i]];
    }

    openModal(playlist);
}

document.getElementById("shuffle-button").addEventListener("click", () => {
    if (currentPlaylist) shuffleSongs(currentPlaylist);
});

let currentlyPlaying = null;
let currentButton = null;

async function togglePlay(title, artist, button) {
    const songKey = `${title} - ${artist}`;
    const trackData = await searchSongAndGetImage(title, artist);

    if (!trackData || !trackData.uri) {
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
    // Reset previous button and card
    if (currentButton) {
        currentButton.innerHTML = '<i class="fa-solid fa-play"></i>';
        currentButton.parentElement.classList.remove('now-playing'); // <-- this line fixes your issue
    }

    // Update current card
    button.innerHTML = '<i class="fa-solid fa-pause"></i>';
    button.parentElement.classList.add('now-playing');
    nowPlayingText.textContent = `Now Playing: ${songKey}`;
    nowPlayingDiv.style.display = 'block';
    currentlyPlaying = songKey;
    currentButton = button;

    await playSpotifyTrack(trackData.uri);
    }
}

async function searchSongAndGetImage(title, artist) {
    const query = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: { Authorization: `Bearer ${SPOTIFY_TOKEN}` }
    });

    const data = await response.json();
    if (data.tracks.items.length > 0) {
        const track = data.tracks.items[0];
        return {
            imageUrl: track.album.images[0]?.url,
            uri: track.uri
        };
    }
    return null;
}

async function playSpotifyTrack(uri) {
    await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${SPOTIFY_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [uri] })
    });
}

async function pauseSpotify() {
    await fetch(`https://api.spotify.com/v1/me/player/pause`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${SPOTIFY_TOKEN}` }
    });
}

// Search functionality
document.getElementById('search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filteredPlaylists = playlists.filter(playlist => 
        playlist.name.toLowerCase().includes(searchTerm) ||
        playlist.creator.toLowerCase().includes(searchTerm) ||
        playlist.songs.some(song => 
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm)
        )
    );
    renderPlaylists();
});

// Sort functionality
document.getElementById('sort-dropdown').addEventListener('change', (e) => {
    const sortBy = e.target.value;
    if (sortBy === 'name') {
        filteredPlaylists.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'creator') {
        filteredPlaylists.sort((a, b) => a.creator.localeCompare(b.creator));
    } else if (sortBy === 'likes') {
        filteredPlaylists.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'recent') {
        filteredPlaylists.sort((a, b) => b.id - a.id);
    }
    renderPlaylists();
});

// Add playlist button
document.getElementById('add-playlist-btn').addEventListener('click', () => {
    alert('Add Playlist functionality would be implemented here!');
});

// Shuffle button in modal
document.getElementById('shuffle-button').addEventListener('click', () => {
    alert('Shuffle functionality would be implemented here!');
});

