// ===== Music Player JavaScript =====

// Sample playlist data (You can replace these with your own audio files)
const songs = [
    {
        title: "Summer Vibes",
        artist: "The Melody Band",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: "4:47"
    },
    {
        title: "Midnight Dreams",
        artist: "DJ Sunset",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: "4:26"
    },
    {
        title: "Electric Hearts",
        artist: "Neon Lights",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        duration: "4:21"
    },
    {
        title: "Ocean Waves",
        artist: "Relaxing Sounds",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        duration: "4:32"
    },
    {
        title: "Urban Groove",
        artist: "City Beats",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        duration: "4:18"
    }
];

// Get DOM elements
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const progressDot = document.getElementById('progressDot');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeBar = document.getElementById('volumeBar');
const volumeProgress = document.getElementById('volumeProgress');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');
const volumePercentage = document.getElementById('volumePercentage');
const volumeContainer = document.getElementById('volumeContainer');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const albumArt = document.getElementById('albumArt');
const playlistEl = document.getElementById('playlist');
const autoplayBtn = document.getElementById('autoplayBtn');
const playlistContainer = document.querySelector('.playlist-container');

// Player state
let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isAutoplay = true;

// Scroll drag state
let isPlaylistDragging = false;
let playlistDragStartY = 0;
let playlistScrollStartTop = 0;
let playlistDragVelocity = 0;
let playlistDragLastY = 0;
let playlistDragTime = 0;
let playlistScrollMomentum = null;

// Volume drag state
let isVolumeDragging = false;

// Create scroll indicator
function createScrollIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    playlistContainer.appendChild(indicator);
}

// Initialize player
function init() {
    loadPlaylist();
    loadSong(currentSongIndex);
    
    // Set initial volume to 70%
    audio.volume = 0.7;
    audio.muted = false;
    volumeProgress.style.width = '70%';
    volumePercentage.textContent = '70%';
    updateVolumeIcon(0.7);
    
    // Create scroll indicator
    createScrollIndicator();
    
    // Initialize playlist scroll drag
    initPlaylistScrollDrag();
    
    // Initialize volume drag
    initVolumeDrag();
    
    // Update button titles
    volumeBtn.title = 'Mute';
    shuffleBtn.title = 'Shuffle: OFF';
    repeatBtn.title = 'Repeat: OFF';
    autoplayBtn.title = 'Autoplay: ON';
}

// Initialize playlist scroll drag functionality
function initPlaylistScrollDrag() {
    playlistContainer.addEventListener('mousedown', startPlaylistDrag);
    playlistContainer.addEventListener('touchstart', startPlaylistDragTouch);
    
    document.addEventListener('mousemove', handlePlaylistDrag);
    document.addEventListener('touchmove', handlePlaylistDragTouch, { passive: false });
    
    document.addEventListener('mouseup', endPlaylistDrag);
    document.addEventListener('touchend', endPlaylistDrag);
    
    // Prevent default drag behavior
    playlistContainer.addEventListener('dragstart', (e) => e.preventDefault());
}

// Start playlist drag (mouse)
function startPlaylistDrag(e) {
    if (e.target.closest('.playlist-item')) return; // Don't start drag if clicking on playlist item
    
    isPlaylistDragging = true;
    playlistDragStartY = e.clientY;
    playlistScrollStartTop = playlistContainer.scrollTop;
    playlistDragLastY = e.clientY;
    playlistDragTime = Date.now();
    playlistContainer.classList.add('dragging');
    
    // Cancel any existing momentum
    if (playlistScrollMomentum) {
        cancelAnimationFrame(playlistScrollMomentum);
        playlistScrollMomentum = null;
    }
    
    e.preventDefault();
}

// Start playlist drag (touch)
function startPlaylistDragTouch(e) {
    if (e.target.closest('.playlist-item')) return;
    
    isPlaylistDragging = true;
    playlistDragStartY = e.touches[0].clientY;
    playlistScrollStartTop = playlistContainer.scrollTop;
    playlistDragLastY = e.touches[0].clientY;
    playlistDragTime = Date.now();
    playlistContainer.classList.add('dragging');
    
    if (playlistScrollMomentum) {
        cancelAnimationFrame(playlistScrollMomentum);
        playlistScrollMomentum = null;
    }
}

// Handle playlist drag (mouse)
function handlePlaylistDrag(e) {
    if (!isPlaylistDragging) return;
    
    const deltaY = e.clientY - playlistDragStartY;
    playlistContainer.scrollTop = playlistScrollStartTop - deltaY * 2;
    
    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - playlistDragTime;
    if (dt > 0) {
        playlistDragVelocity = (playlistDragLastY - e.clientY) / dt;
        playlistDragLastY = e.clientY;
        playlistDragTime = now;
    }
    
    e.preventDefault();
}

// Handle playlist drag (touch)
function handlePlaylistDragTouch(e) {
    if (!isPlaylistDragging) return;
    
    const deltaY = e.touches[0].clientY - playlistDragStartY;
    playlistContainer.scrollTop = playlistScrollStartTop - deltaY * 2;
    
    const now = Date.now();
    const dt = now - playlistDragTime;
    if (dt > 0) {
        playlistDragVelocity = (playlistDragLastY - e.touches[0].clientY) / dt;
        playlistDragLastY = e.touches[0].clientY;
        playlistDragTime = now;
    }
    
    e.preventDefault();
}

// End playlist drag
function endPlaylistDrag() {
    if (!isPlaylistDragging) return;
    
    isPlaylistDragging = false;
    playlistContainer.classList.remove('dragging');
    
    // Apply momentum scrolling
    if (Math.abs(playlistDragVelocity) > 0.1) {
        applyMomentumScroll(playlistDragVelocity * 1000);
    }
}

// Apply momentum scrolling
function applyMomentumScroll(velocity) {
    const friction = 0.95;
    const minVelocity = 0.5;
    
    function momentumStep() {
        if (Math.abs(velocity) < minVelocity) {
            playlistScrollMomentum = null;
            return;
        }
        
        playlistContainer.scrollTop -= velocity;
        velocity *= friction;
        
        playlistScrollMomentum = requestAnimationFrame(momentumStep);
    }
    
    playlistScrollMomentum = requestAnimationFrame(momentumStep);
}

// Load playlist
function loadPlaylist() {
    playlistEl.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.classList.add('playlist-item');
        if (index === currentSongIndex) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <div class="playlist-number">${index + 1}</div>
            <div class="playlist-info">
                <div class="playlist-song-title">${song.title}</div>
                <div class="playlist-artist">${song.artist}</div>
            </div>
            <div class="playlist-duration">${song.duration}</div>
        `;
        
        li.addEventListener('click', (e) => {
            if (isPlaylistDragging) {
                e.preventDefault();
                return;
            }
            playSong(index);
        });
        
        playlistEl.appendChild(li);
    });
}

// Load song
function loadSong(index) {
    const song = songs[index];
    audio.src = song.src;
    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    
    // Update playlist active state
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Scroll to active song in playlist
    const activeItem = playlistItems[index];
    if (activeItem) {
        const containerHeight = playlistContainer.clientHeight;
        const itemTop = activeItem.offsetTop;
        const itemHeight = activeItem.offsetHeight;
        
        // Center the active item in the viewport
        playlistContainer.scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
    }
}

// Play song
function playSong(index) {
    if (index !== undefined) {
        currentSongIndex = index;
        loadSong(currentSongIndex);
    }
    audio.play();
    isPlaying = true;
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    albumArt.classList.add('playing');
    playBtn.title = 'Pause';
}

// Pause song
function pauseSong() {
    audio.pause();
    isPlaying = false;
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    albumArt.classList.remove('playing');
    playBtn.title = 'Play';
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

// Previous song
function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = songs.length - 1;
    }
    loadSong(currentSongIndex);
    if (isPlaying) {
        playSong();
    }
}

// Next song
function nextSong() {
    if (isShuffle) {
        // Random song
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * songs.length);
        } while (randomIndex === currentSongIndex && songs.length > 1);
        currentSongIndex = randomIndex;
    } else {
        currentSongIndex++;
        if (currentSongIndex >= songs.length) {
            currentSongIndex = 0;
        }
    }
    loadSong(currentSongIndex);
    if (isPlaying) {
        playSong();
    }
}

// Update progress bar
function updateProgress() {
    const { duration, currentTime } = audio;
    
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        
        // Update time displays
        currentTimeEl.textContent = formatTime(currentTime);
        totalTimeEl.textContent = formatTime(duration);
    }
}

// Set progress
function setProgress(e) {
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    
    audio.currentTime = (clickX / width) * duration;
}

// Format time (seconds to mm:ss)
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Initialize volume drag
function initVolumeDrag() {
    volumeBar.addEventListener('mousedown', (e) => {
        isVolumeDragging = true;
        volumeContainer.classList.add('dragging');
        setVolume(e); // Update volume immediately on click
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isVolumeDragging) {
            const rect = volumeBar.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            const volume = Math.max(0, Math.min(1, x / width));
            
            // Round to nearest 5%
            const roundedVolume = Math.round(volume * 20) / 20;
            
            audio.volume = roundedVolume;
            audio.muted = (roundedVolume === 0);
            volumeProgress.style.width = `${roundedVolume * 100}%`;
            volumePercentage.textContent = `${Math.round(roundedVolume * 100)}%`;
            updateVolumeIcon(roundedVolume);
            
            // Update mute button title
            volumeBtn.title = roundedVolume === 0 ? 'Unmute' : 'Mute';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isVolumeDragging) {
            isVolumeDragging = false;
            volumeContainer.classList.remove('dragging');
        }
    });
}

// Set volume
function setVolume(e) {
    const width = volumeBar.clientWidth;
    const clickX = e.offsetX;
    let volume = clickX / width;
    
    // Round to nearest 5% for better snapping
    volume = Math.round(volume * 20) / 20;
    
    // Ensure volume is between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    
    audio.volume = volume;
    audio.muted = (volume === 0);
    volumeProgress.style.width = `${volume * 100}%`;
    volumePercentage.textContent = `${Math.round(volume * 100)}%`;
    
    // Update volume icon
    updateVolumeIcon(volume);
    
    // Update mute button title
    volumeBtn.title = volume === 0 ? 'Unmute' : 'Mute';
}

// Update volume icon
function updateVolumeIcon(volume) {
    volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-mute');
    
    if (volume === 0 || audio.muted) {
        volumeIcon.classList.add('fa-volume-mute');
        volumeContainer.classList.add('muted');
    } else {
        volumeContainer.classList.remove('muted');
        if (volume < 0.5) {
            volumeIcon.classList.add('fa-volume-down');
        } else {
            volumeIcon.classList.add('fa-volume-up');
        }
    }
}

// Toggle mute
function toggleMute() {
    if (audio.volume > 0 || !audio.muted) {
        // Store current volume and mute
        audio.dataset.previousVolume = audio.volume;
        audio.volume = 0;
        audio.muted = true;
        volumeProgress.style.width = '0%';
        volumePercentage.textContent = '0%';
        updateVolumeIcon(0);
        volumeBtn.title = 'Unmute';
    } else {
        // Restore previous volume or default to 70%
        const previousVolume = parseFloat(audio.dataset.previousVolume) || 0.7;
        audio.volume = previousVolume;
        audio.muted = false;
        volumeProgress.style.width = `${previousVolume * 100}%`;
        volumePercentage.textContent = `${Math.round(previousVolume * 100)}%`;
        updateVolumeIcon(previousVolume);
        volumeBtn.title = 'Mute';
    }
}

// Toggle shuffle
function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active');
    
    if (isShuffle) {
        shuffleBtn.title = 'Shuffle: ON';
    } else {
        shuffleBtn.title = 'Shuffle: OFF';
    }
}

// Toggle repeat
function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active');
    
    if (isRepeat) {
        repeatBtn.title = 'Repeat: ON';
    } else {
        repeatBtn.title = 'Repeat: OFF';
    }
}

// Toggle autoplay
function toggleAutoplay() {
    isAutoplay = !isAutoplay;
    autoplayBtn.classList.toggle('active');
    
    if (isAutoplay) {
        autoplayBtn.title = 'Autoplay: ON';
    } else {
        autoplayBtn.title = 'Autoplay: OFF';
    }
}

// Song ended
function songEnded() {
    if (isRepeat) {
        // Repeat current song
        playSong();
    } else if (isAutoplay) {
        // Play next song
        nextSong();
    } else {
        // Stop playing
        pauseSong();
        audio.currentTime = 0;
    }
}

// Event Listeners
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);
autoplayBtn.addEventListener('click', toggleAutoplay);
progressBar.addEventListener('click', setProgress);
volumeBar.addEventListener('click', setVolume);
volumeBtn.addEventListener('click', toggleMute);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', songEnded);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            audio.currentTime -= 5;
            break;
        case 'ArrowRight':
            e.preventDefault();
            audio.currentTime += 5;
            break;
        case 'ArrowUp':
            e.preventDefault();
            let newVolumeUp = Math.min(1, audio.volume + 0.05); // 5% increments
            audio.volume = newVolumeUp;
            audio.muted = false;
            volumeProgress.style.width = `${newVolumeUp * 100}%`;
            volumePercentage.textContent = `${Math.round(newVolumeUp * 100)}%`;
            updateVolumeIcon(newVolumeUp);
            volumeBtn.title = 'Mute';
            volumeContainer.classList.remove('muted');
            break;
        case 'ArrowDown':
            e.preventDefault();
            let newVolumeDown = Math.max(0, audio.volume - 0.05); // 5% increments
            audio.volume = newVolumeDown;
            if (newVolumeDown === 0) {
                audio.muted = true;
                volumeContainer.classList.add('muted');
            } else {
                audio.muted = false;
                volumeContainer.classList.remove('muted');
            }
            volumeProgress.style.width = `${newVolumeDown * 100}%`;
            volumePercentage.textContent = `${Math.round(newVolumeDown * 100)}%`;
            updateVolumeIcon(newVolumeDown);
            if (newVolumeDown === 0) {
                volumeBtn.title = 'Unmute';
            } else {
                volumeBtn.title = 'Mute';
            }
            break;
        case 'n':
            nextSong();
            break;
        case 'p':
            prevSong();
            break;
        case 'm':
            toggleMute();
            break;
    }
});

// Progress bar drag functionality
let isDragging = false;

progressDot.addEventListener('mousedown', () => {
    isDragging = true;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        
        audio.currentTime = percentage * audio.duration;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Touch support for mobile
progressBar.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = progressBar.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    audio.currentTime = percentage * audio.duration;
});

volumeBar.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = volumeBar.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const volume = Math.max(0, Math.min(1, x / width));
    
    // Round to nearest 5%
    const roundedVolume = Math.round(volume * 20) / 20;
    
    audio.volume = roundedVolume;
    audio.muted = (roundedVolume === 0);
    volumeProgress.style.width = `${roundedVolume * 100}%`;
    volumePercentage.textContent = `${Math.round(roundedVolume * 100)}%`;
    updateVolumeIcon(roundedVolume);
    
    // Update mute button title
    volumeBtn.title = roundedVolume === 0 ? 'Unmute' : 'Mute';
});

// Initialize player on page load
window.addEventListener('DOMContentLoaded', init);

// Console message
console.log('%c🎵 Music Player Ready!', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%cKeyboard Shortcuts:', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
console.log('Space: Play/Pause');
console.log('Arrow Left/Right: Seek ±5s');
console.log('Arrow Up/Down: Volume ±5%');
console.log('N: Next Song | P: Previous Song | M: Mute');
console.log('%cCreated by Memoona Kolachi', 'color: #ec4899; font-size: 12px;');