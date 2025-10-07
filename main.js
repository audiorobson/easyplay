import * as ui from './modules/ui.js';
import * as playlist from './modules/playlist.js';
import * as player from './modules/player.js';

let editorVisible = false;

function toggleEditor() {
    editorVisible = !editorVisible;
    ui.toggleEditorPanel(editorVisible);
}

function handleKeyDown(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        toggleEditor();
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        ui.showPlaylistManagementModal();
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        if (player.isPlaying()) {
            player.stop();
        }
        if (!editorVisible) {
            toggleEditor();
        }
    }
    if (event.ctrlKey && event.key === ' ') {
        event.preventDefault();
        if (player.isPlaying()) {
            player.stop();
        } else {
            const currentPlaylist = playlist.getPlaylist();
            if (currentPlaylist.length > 0) {
                player.play();
            } else {
                ui.showNotification('Lista Vazia', 'A playlist está vazia. Adicione alguma mídia primeiro.', 'warning');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // This function will be called whenever the playlist is updated
    const onPlaylistUpdate = () => {
        ui.renderPlaylist();
        // The editor panel might not always exist, so check for it.
        if (document.getElementById('editor-panel')) {
             ui.updateRelinkButtonState();
        }
    };

    // Initialize modules
    ui.init(
        playlist.addItem,
        playlist.getPlaylist,
        playlist.updateItem,
        playlist.removeItem,
        playlist.moveItemUp,
        playlist.moveItemDown,
        playlist.importPlaylist,
        playlist.exportPlaylist,
        player.play,
        player.stop,
        playlist.clearPlaylist
    );
    playlist.init(onPlaylistUpdate);
    player.init(ui.toggleEditorPanel);

    // Set up keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    // --- Startup Logic ---
    const startPlayback = () => {
        const currentPlaylist = playlist.getPlaylist();
        // Check if there's at least one item that is not missing
        if (currentPlaylist.length > 0 && currentPlaylist.some(item => !item.isMissing)) {
            player.play();
        } else {
            // No playable items, show editor.
            if (!editorVisible) {
                toggleEditor();
            }
        }
    };
    
    const missingFiles = playlist.getMissingFiles();
    if (missingFiles.length > 0) {
        // We have a playlist from localStorage, but some files are missing.
        // Prompt user to find them before starting playback.
        ui.showMissingFilesModal(startPlayback);
    } else {
        const currentPlaylist = playlist.getPlaylist();
        if (currentPlaylist.length > 0) {
            // No missing files and playlist is not empty, start playing.
            startPlayback();
        } else {
             // Show instructions modal on first load if playlist is empty.
            setTimeout(() => {
                ui.showInstructionsModal();
            }, 500);
        }
    }
});