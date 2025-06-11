import { SPOTIFY_TOKEN } from './config.js';

// DOM Elements
const modal = document.getElementById("playlistModal");
const span = document.getElementsByClassName("close")[0];
const container = document.getElementById("playlist-card-container");
const nowPlayingDiv = document.getElementById('now-playing');
const nowPlayingText = document.getElementById('now-playing-text');

// State
let currentlyPlaying = null;
let currentButton = null;
let currentPlaylist = null;
let lastFeaturedIndex = -1;

// Fetch track image and URI from Spotify API
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

// Display a random featured playlist
async function showRandomFeatured() {
    const res = await fetch("data/data.json");
    const playlists = await res.json();
    if (!playlists.length) return;

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * playlists.length);
    } while (randomIndex === lastFeaturedIndex && playlists.length > 1);

    lastFeaturedIndex = randomIndex;
    const featured = playlists[randomIndex];
    currentPlaylist = featured;

    document.getElementById("playlist-hero-bg").style.backgroundImage = `url('${featured.imageUrl}')`;
    document.getElementById("featured-title").textContent = featured.name;
    document.getElementById("featured-creator").textContent = `Created by ${featured.creator}`;

    renderSongs(featured.songs);
}

// Render songs for the featured playlist
async function renderSongs(songs) {
    const container = document.getElementById("featured-songs-container");
    container.innerHTML = '';

    for (const song of songs) {
        const songCard = document.createElement("div");
        songCard.className = "song-card";

        const spotifyData = await searchSongAndGetImage(song.title, song.artist);

        songCard.innerHTML = `
            <div class="song-info">
                <div class="song-thumbnail">
                    <img src="${spotifyData?.imageUrl || ''}" alt="Album Cover" style="width:60px;height:60px;object-fit:cover;">
                </div>
                <div class="song-details">
                    <p class="song-title">${song.title}</p>
                    <p class="song-artist">${song.artist}</p>
                    <p class="song-album">${song.album || ''}</p>
                </div>
            </div>
            <button class="play-button" onclick="event.stopPropagation(); togglePlay('${song.title}', '${song.artist}', this)">
                <i class="fa-solid fa-play"></i>
            </button>
            <div class="song-duration">${song.duration || '0:00'}</div>
        `;

        container.appendChild(songCard);
    }
}

// Play/Pause toggle
function togglePlay(title, artist, button) {
    const songKey = `${title} - ${artist}`;

    if (currentlyPlaying === songKey) {
        stopCurrentSong();
    } else {
        if (currentButton) stopCurrentSong();

        button.innerHTML = '<i class="fa-solid fa-pause"></i>';
        button.parentElement.classList.add('now-playing');
        nowPlayingText.textContent = `Now Playing: ${songKey}`;
        nowPlayingDiv.style.display = 'block';
        currentlyPlaying = songKey;
        currentButton = button;
    }
}

// Helper to stop any currently playing song
function stopCurrentSong() {
    if (currentButton) {
        currentButton.innerHTML = '<i class="fa-solid fa-play"></i>';
        currentButton.parentElement.classList.remove('now-playing');
    }
    nowPlayingDiv.style.display = 'none';
    currentlyPlaying = null;
    currentButton = null;
}

// Shuffle songs in the current playlist
function shuffleSongs(playlist) {
    for (let i = playlist.songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist.songs[i], playlist.songs[j]] = [playlist.songs[j], playlist.songs[i]];
    }
    renderSongs(playlist.songs);
}

// Initiatization
document.addEventListener("DOMContentLoaded", () => {
    showRandomFeatured();

    document.getElementById("new-feature-btn")?.addEventListener("click", showRandomFeatured);
    document.getElementById("shuffle-button")?.addEventListener("click", () => {
        if (currentPlaylist) shuffleSongs(currentPlaylist);
    });
});

window.togglePlay = togglePlay;
