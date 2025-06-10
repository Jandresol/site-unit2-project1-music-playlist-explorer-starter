const modal = document.getElementById("playlistModal");
const span = document.getElementsByClassName("close")[0];
const container = document.getElementById("playlist-card-container");
let currentPlaylist = null;

function openModal(playlist) {
    currentPlaylist = playlist;
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

fetch("data/data.json")
    .then(res => res.json())
    .then(playlists => {
        playlists.forEach(playlist => {
            const card = document.createElement("div");
            card.classList.add("playlist-cards");

            card.innerHTML = `
                <div class="playlist-image" style="background-image: url('${playlist.imageUrl}');"></div>
                <div class="playlist-text">
                    <h3 class="playlist-title">${playlist.name}</h3>
                    <h5 class="creator-name">Created by ${playlist.creator}</h5>
                </div>
                <div class="like-container">
                    <i class="fa-regular fa-heart"></i>
                    <p class="like-count">${playlist.likes}</p>
                </div>
            `;

            // Set up modal open on card click
            card.style.cursor = "pointer";
            card.addEventListener("click", () => openModal(playlist));

            // Set up like button
            const likeContainer = card.querySelector(".like-container");
            const heartIcon = likeContainer.querySelector("i");
            const likeCount = likeContainer.querySelector(".like-count");
            let liked = false;

            likeContainer.addEventListener("click", (event) => {
                event.stopPropagation(); // prevent modal from opening

                liked = !liked;

                if (liked) {
                    heartIcon.classList.remove("fa-regular");
                    heartIcon.classList.add("fa-solid");
                    playlist.likes += 1;
                } else {
                    heartIcon.classList.remove("fa-solid");
                    heartIcon.classList.add("fa-regular");
                    playlist.likes -= 1;
                }

                likeCount.textContent = playlist.likes;
            });

            container.appendChild(card);
        });
    })
    .catch(err => console.error("Failed to fetch JSON:", err));

function shuffleSongs(playlist) {
    const songsContainer = document.getElementById('songs');
    const songList = playlist.songs;
    for (var i = songList.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = songList[i];
        songList[i] = songList[j];
        songList[j] = temp;
    }

    // Clear current songs
    songsContainer.innerHTML = '';

    // Render shuffled songs
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
}

document.getElementById("shuffle-button").addEventListener("click", () => {
    if (currentPlaylist) shuffleSongs(currentPlaylist);
});
