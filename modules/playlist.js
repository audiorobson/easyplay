import { showNotification } from './ui.js';

let playlist = [];
let renderCallback = () => {};

// Load playlist from localStorage on startup
function loadFromStorage() {
    const savedPlaylist = localStorage.getItem('easyplay-playlist');
    if (savedPlaylist) {
        try {
            const parsed = JSON.parse(savedPlaylist);
            const localFileTypes = ['image', 'video', 'audio', 'pdf', 'html', 'markdown'];
            
            playlist = parsed.map(item => {
                // If it's a local file type and has no file object, mark it as missing.
                if (localFileTypes.includes(item.type) && !item.file) {
                    return { ...item, file: null, isMissing: true };
                }
                // Handle mosaic items
                if (item.type === 'mosaic' && item.panes) {
                    let isMosaicMissing = false;
                    item.panes = item.panes.map(pane => {
                        if (localFileTypes.includes(pane.type) && !pane.file) {
                            isMosaicMissing = true;
                            return { ...pane, file: null, isMissing: true };
                        }
                        return pane;
                    });
                    return { ...item, isMissing: isMosaicMissing };
                }
                return item;
            });

        } catch (e) {
            console.error("Failed to load playlist from localStorage", e);
            playlist = [];
        }
    }
}

function saveToStorage() {
    // Create a serializable version of the playlist (without File objects or isMissing flag)
    const serializablePlaylist = playlist.map(item => {
        const { file, isMissing, ...rest } = item;
         if (rest.type === 'mosaic' && rest.panes) {
            rest.panes = rest.panes.map(pane => {
                const { file: paneFile, isMissing: paneIsMissing, ...paneRest } = pane;
                return paneRest;
            });
        }
        return rest;
    });
    localStorage.setItem('easyplay-playlist', JSON.stringify(serializablePlaylist));
}

function triggerRender() {
    saveToStorage();
    renderCallback();
}

export function init(onUpdate) {
    renderCallback = onUpdate;
    loadFromStorage();
    triggerRender();
}

export function getPlaylist() {
    return playlist;
}

export function getItem(index) {
    return playlist[index];
}

export function getMissingFiles() {
    return playlist.filter(item => item.isMissing);
}

export function addItem(item) {
    playlist.push(item);
    triggerRender();
}

export function updateItem(index, newItem) {
    if (index >= 0 && index < playlist.length) {
        // Preserve the original file object if it exists, unless a new one is provided.
        newItem.file = newItem.file || playlist[index].file;
        playlist[index] = newItem;
        triggerRender();
    }
}

export function removeItem(index) {
    if (index >= 0 && index < playlist.length) {
        playlist.splice(index, 1);
        triggerRender();
    }
}

export function clearPlaylist() {
    playlist = [];
    triggerRender();
}

export function moveItemUp(index) {
    if (index > 0) {
        [playlist[index - 1], playlist[index]] = [playlist[index], playlist[index - 1]];
        triggerRender();
    }
}

export function moveItemDown(index) {
    if (index < playlist.length - 1) {
        [playlist[index], playlist[index + 1]] = [playlist[index + 1], playlist[index]];
        triggerRender();
    }
}

export function exportPlaylist() {
    const serializablePlaylist = playlist.map(item => {
        const { file, ...rest } = item;
        return rest;
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serializablePlaylist, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "easyplay_playlist.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export function importPlaylist(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                const localFileTypes = ['image', 'video', 'audio', 'pdf', 'html', 'markdown'];
                playlist = imported.map(item => {
                    const isLocal = localFileTypes.includes(item.type);
                    return { ...item, file: null, isMissing: isLocal };
                });
                showNotification('Playlist Importada', 'Playlist importada com sucesso. Localize os arquivos de mídia ausentes, se necessário.', 'success');
                triggerRender();
            } else {
                showNotification('Erro de Formato', 'Arquivo JSON inválido.', 'error');
            }
        } catch (e) {
            showNotification('Erro de Leitura', 'Erro ao ler o arquivo JSON.', 'error');
            console.error(e);
        }
    };
    reader.readAsText(file);
}