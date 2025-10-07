import * as icons from './icons.js';
import { Tooltip } from 'bootstrap';
import { showNotification, showConfirmation, openInputModal, showInstructionsModal, showPlaylistManagementModal as showPMM, hidePlaylistManagementModal, showGlobalSettingsModal, hideGlobalSettingsModal, showMissingFilesModal as showMFM, hideMissingFilesModal, init as initModals } from './modals.js';
import { createMediaItemConfigForm, getFormValues } from './forms.js';
import { renderPlaylist as renderTimeline, init as initTimeline } from './timeline.js';
import * as settings from './settings.js';

let addCallback, getPlaylistCallback, updateItemCallback, removeItemCallback, moveUpCallback, moveDownCallback, importCallback, exportCallback, playCallback, stopCallback, clearPlaylistCallback;
let tooltips = [];

// DOM Elements
const editorPanel = () => document.getElementById('editor-panel');

const fileInputs = {
    image: () => document.getElementById('image-file-input'),
    video: () => document.getElementById('video-file-input'),
    html: () => document.getElementById('html-file-input'),
    pdf: () => document.getElementById('pdf-file-input'),
    audio: () => document.getElementById('audio-file-input'),
    markdown: () => document.getElementById('markdown-file-input'),
    import: () => document.getElementById('import-file-input'),
    logo: () => document.getElementById('logo-file-input'),
};

const addButtons = {
    image: () => document.getElementById('add-image-btn'),
    video: () => document.getElementById('add-video-btn'),
    web: () => document.getElementById('add-web-btn'),
    youtube: () => document.getElementById('add-youtube-btn'),
    html: () => document.getElementById('add-html-btn'),
    pdf: () => document.getElementById('add-pdf-btn'),
    text: () => document.getElementById('add-text-btn'),
    audio: () => document.getElementById('add-audio-btn'),
    markdown: () => document.getElementById('add-markdown-btn'),
    clock: () => document.getElementById('add-clock-btn'),
    weather: () => document.getElementById('add-weather-forecast-btn'),
    mosaic: () => document.getElementById('add-mosaic-btn'),
};

const controlButtons = {
    play: () => document.getElementById('play-btn'),
    relinkFiles: () => document.getElementById('relink-files-btn'),
    playlistManagement: () => document.getElementById('playlist-management-btn'),
    globalSettings: () => document.getElementById('global-settings-btn'),
    logo: () => document.getElementById('logo-btn'),
    removeLogo: () => document.getElementById('remove-logo-btn'),
    import: () => document.getElementById('import-btn'),
    export: () => document.getElementById('export-btn'),
    clear: () => document.getElementById('clear-playlist-btn'),
};

function setupIcons() {
    addButtons.image().innerHTML = icons.imageIcon;
    addButtons.video().innerHTML = icons.videoIcon;
    addButtons.web().innerHTML = icons.webIcon;
    addButtons.youtube().innerHTML = icons.youtubeIcon;
    addButtons.html().innerHTML = icons.htmlIcon;
    addButtons.pdf().innerHTML = icons.pdfIcon;
    addButtons.text().innerHTML = icons.textIcon;
    addButtons.audio().innerHTML = icons.audioIcon;
    addButtons.markdown().innerHTML = icons.markdownIcon;
    addButtons.clock().innerHTML = icons.clockIcon;
    addButtons.weather().innerHTML = icons.weatherIcon;
    addButtons.mosaic().innerHTML = icons.mosaicIcon;
    controlButtons.play().innerHTML = icons.playIcon;
    controlButtons.relinkFiles().innerHTML = icons.linkIcon;
    controlButtons.playlistManagement().innerHTML = icons.listIcon;
    controlButtons.globalSettings().innerHTML = icons.settingsIcon;
    controlButtons.logo().innerHTML = icons.logoIcon;
    controlButtons.removeLogo().innerHTML = icons.trashIcon;
    controlButtons.import().innerHTML = icons.importIcon;
    controlButtons.export().innerHTML = icons.exportIcon;
    controlButtons.clear().innerHTML = icons.trashIcon;
}

function setupTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltips = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new Tooltip(tooltipTriggerEl);
    });
}

function handleAddFiles(files, type) {
    for (const file of files) {
        const item = {
            type,
            name: file.name,
            file,
            duration: 10,
            displayMode: 'zoom',
            transition: 'fadeIn',
            caption: '',
            autoScroll: false,
        };
        if (type === 'image' || type === 'video') {
            item.captionFontSize = '1.5vw';
            item.captionFontColor = '#FFFFFF';
        }
        if (type === 'audio') {
            item.muted = false; // Audio should be unmuted by default
            item.autoCaption = false;
        }
        addCallback(item);
    }
}

function setupEventListeners() {
    // Add media buttons
    addButtons.image().addEventListener('click', () => fileInputs.image().click());
    fileInputs.image().addEventListener('change', (e) => handleAddFiles(e.target.files, 'image'));

    addButtons.video().addEventListener('click', () => fileInputs.video().click());
    fileInputs.video().addEventListener('change', (e) => handleAddFiles(e.target.files, 'video'));

    addButtons.html().addEventListener('click', () => fileInputs.html().click());
    fileInputs.html().addEventListener('change', (e) => handleAddFiles(e.target.files, 'html'));

    addButtons.pdf().addEventListener('click', () => fileInputs.pdf().click());
    fileInputs.pdf().addEventListener('change', (e) => handleAddFiles(e.target.files, 'pdf'));

    addButtons.audio().addEventListener('click', () => fileInputs.audio().click());
    fileInputs.audio().addEventListener('change', (e) => handleAddFiles(e.target.files, 'audio'));

    addButtons.markdown().addEventListener('click', () => fileInputs.markdown().click());
    fileInputs.markdown().addEventListener('change', (e) => handleAddFiles(e.target.files, 'markdown'));

    addButtons.clock().addEventListener('click', () => {
        openInputModal({
            title: 'Adicionar Relógio Digital',
            body: `
                <div class="mb-3">
                    <label for="clock-format" class="form-label">Formato</label>
                    <select id="clock-format" class="form-select">
                        <option value="24h">24 Horas (HH:MM:SS)</option>
                        <option value="12h">12 Horas (HH:MM:SS AM/PM)</option>
                        <option value="date">Data e Hora</option>
                        <option value="date-only">Apenas Data</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="clock-font-size" class="form-label">Tamanho da Fonte</label>
                    <input type="text" class="form-control" id="clock-font-size" value="8vw">
                </div>
                <div class="mb-3">
                    <label for="clock-color" class="form-label">Cor</label>
                    <input type="color" class="form-control form-control-color" id="clock-color" value="#00BCD4">
                </div>
                ${createMediaItemConfigForm()}
            `,
            onSave: () => {
                const clockConfig = {
                    format: document.getElementById('clock-format').value,
                    fontSize: document.getElementById('clock-font-size').value,
                    color: document.getElementById('clock-color').value,
                };
                addCallback({
                    type: 'clock',
                    name: `Relógio: ${clockConfig.format}`,
                    clockConfig,
                    ...getFormValues(),
                });
                return true;
            }
        });
    });

    addButtons.web().addEventListener('click', () => {
        openInputModal({
            title: 'Adicionar Página Web',
            body: `
                <div class="mb-3">
                    <label for="web-url" class="form-label">URL da Página</label>
                    <input type="url" class="form-control" id="web-url" placeholder="https://example.com" required>
                </div>
                ${createMediaItemConfigForm({}, 'web')}
            `,
            onSave: () => {
                const url = document.getElementById('web-url').value;
                if (!url) return false;
                addCallback({
                    type: 'web',
                    name: url,
                    url,
                    ...getFormValues(),
                });
                return true;
            }
        });
    });

    addButtons.youtube().addEventListener('click', () => {
         openInputModal({
            title: 'Adicionar Vídeo do YouTube',
            body: `
                <div class="mb-3">
                    <label for="yt-url" class="form-label">URL do Vídeo YouTube</label>
                    <input type="url" class="form-control" id="yt-url" placeholder="https://www.youtube.com/watch?v=..." required>
                </div>
                ${createMediaItemConfigForm({duration: 0}, 'youtube')}
                 <p class="form-text">Deixe a duração em 0 para tocar o vídeo inteiro.</p>
            `,
            onSave: () => {
                const url = document.getElementById('yt-url').value;
                if (!url) return false;
                addCallback({
                    type: 'youtube',
                    name: `YouTube: ${url.split('v=')[1] || url}`,
                    url,
                    ...getFormValues(),
                });
                return true;
            }
        });
    });

    addButtons.text().addEventListener('click', () => {
        openInputModal({
            title: 'Adicionar Texto Animado',
            body: `
                <div class="mb-3"><label class="form-label">Texto</label><textarea class="form-control" id="text-content" rows="3"></textarea></div>
                <div class="mb-3"><label class="form-label">Tamanho da Fonte (css)</label><input type="text" class="form-control" id="text-font-size" value="7vw"></div>
                <div class="mb-3"><label class="form-label">Cor</label><input type="color" class="form-control form-control-color" id="text-color" value="#FFFFFF"></div>
                <div class="mb-3">
                    <label for="text-animation" class="form-label">Animação do Texto</label>
                    <select id="text-animation" class="form-select">
                        <option value="none">Nenhuma</option>
                        <option value="typewriter">Máquina de Escrever</option>
                        <option value="fadeInWords">Fade por Palavra</option>
                        <option value="slideInWords">Slide por Palavra</option>
                        <option value="bounceIn">Bounce</option>
                    </select>
                </div>
                ${createMediaItemConfigForm()}
            `,
            onSave: () => {
                const text = document.getElementById('text-content').value;
                if (!text) return false;
                addCallback({
                    type: 'text',
                    name: `Texto: ${text.substring(0, 20)}...`,
                    text: text,
                    fontSize: document.getElementById('text-font-size').value,
                    color: document.getElementById('text-color').value,
                    textAnimation: document.getElementById('text-animation').value,
                    ...getFormValues(),
                });
                return true;
            }
        });
    });

    addButtons.weather().addEventListener('click', () => {
        openInputModal({
            title: 'Adicionar Previsão do Tempo',
            body: `
                <div class="mb-3">
                    <label for="weather-location" class="form-label">Localização (ex: "São Paulo")</label>
                    <input type="text" class="form-control" id="weather-location" placeholder="Cidade" required>
                </div>
                ${createMediaItemConfigForm({ duration: 15 }, 'weather')}
            `,
            onSave: () => {
                const location = document.getElementById('weather-location').value;
                if (!location) return false;

                addCallback({
                    type: 'weather',
                    name: `Previsão: ${location}`,
                    location,
                    ...getFormValues(),
                });
                return true;
            }
        });
    });

    addButtons.mosaic().addEventListener('click', () => {
        let mosaicFiles = []; // To store File objects from the inputs for this modal instance

        const getPaneConfigHTML = (paneIndex) => `
            <div class="mosaic-pane-config mb-3 p-2 border rounded" data-pane-index="${paneIndex}">
                <h6 class="mb-2">Painel ${paneIndex + 1}</h6>
                <div class="mb-2">
                    <label class="form-label form-label-sm">Tipo de Mídia</label>
                    <select class="form-select form-select-sm mosaic-pane-type">
                        <option value="empty">Vazio</option>
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                        <option value="web">Página Web</option>
                    </select>
                </div>
                <div class="mosaic-pane-source">
                    <!-- Source input will be injected here by JS -->
                </div>
            </div>
        `;

        const modalBodyHTML = `
            <div class="mb-3">
                <label for="mosaic-layout" class="form-label">Layout do Mosaico</label>
                <select id="mosaic-layout" class="form-select">
                    <option value="2-vert">2 Painéis (Vertical)</option>
                    <option value="2-horiz">2 Painéis (Horizontal)</option>
                    <option value="2x2">4 Painéis (2x2)</option>
                    <option value="3-L2S">3 Painéis (1 Esquerda, 2 Direita)</option>
                    <option value="3-R2S">3 Painéis (1 Direita, 2 Esquerda)</option>
                    <option value="3-vert">3 Painéis (Vertical)</option>
                    <option value="3-horiz">3 Painéis (Horizontal)</option>
                    <option value="1-top-2-bottom">3 Painéis (1 Topo, 2 Embaixo)</option>
                </select>
            </div>
            <div id="mosaic-panes-container" class="mb-3"></div>
            <hr>
            <h5>Configurações Gerais do Mosaico</h5>
            ${createMediaItemConfigForm({ duration: 30 })}
        `;

        openInputModal({
            title: 'Adicionar Mosaico de Mídias',
            body: modalBodyHTML,
            onSave: () => {
                const layout = document.getElementById('mosaic-layout').value;
                const panes = [];
                document.querySelectorAll('.mosaic-pane-config').forEach((paneEl) => {
                    const paneIndex = parseInt(paneEl.dataset.paneIndex, 10);
                    const type = paneEl.querySelector('.mosaic-pane-type').value;
                    let paneData = { type };

                    if (type === 'image' || type === 'video') {
                        const file = mosaicFiles[paneIndex];
                        if (file) {
                            paneData.file = file;
                            paneData.name = file.name;
                        } else {
                            paneData.type = 'empty';
                        }
                    } else if (type === 'web') {
                        const urlInput = paneEl.querySelector('.mosaic-pane-url');
                        const url = urlInput ? urlInput.value : '';
                        if (url) {
                            paneData.url = url;
                            paneData.name = url;
                        } else {
                            paneData.type = 'empty';
                        }
                    }
                    panes.push(paneData);
                });

                addCallback({
                    type: 'mosaic',
                    name: `Mosaico (${layout})`,
                    layout,
                    panes,
                    ...getFormValues(),
                });

                document.getElementById('input-modal-body').removeEventListener('change', modalChangeListener);
                return true;
            }
        });

        // --- Post-modal setup for dynamic content ---
        const modalBodyEl = document.getElementById('input-modal-body');

        const updatePaneSourceInput = (paneConfigEl) => {
            const type = paneConfigEl.querySelector('.mosaic-pane-type').value;
            const sourceContainer = paneConfigEl.querySelector('.mosaic-pane-source');
            switch (type) {
                case 'image': sourceContainer.innerHTML = `<input type="file" class="form-control form-control-sm mosaic-pane-file" accept="image/*">`; break;
                case 'video': sourceContainer.innerHTML = `<input type="file" class="form-control form-control-sm mosaic-pane-file" accept="video/*">`; break;
                case 'web': sourceContainer.innerHTML = `<input type="url" class="form-control form-control-sm mosaic-pane-url" placeholder="https://...">`; break;
                default: sourceContainer.innerHTML = ''; break;
            }
        };

        const updatePanesLayout = () => {
            const layout = document.getElementById('mosaic-layout').value;
            const container = document.getElementById('mosaic-panes-container');
            let paneCount = 0;
            if (layout === '2-vert' || layout === '2-horiz') paneCount = 2;
            else if (layout === '3-L2S' || layout === '3-R2S' || layout === '3-vert' || layout === '3-horiz' || layout === '1-top-2-bottom') paneCount = 3;
            else if (layout === '2x2') paneCount = 4;

            container.innerHTML = '';
            mosaicFiles = new Array(paneCount).fill(null);

            for (let i = 0; i < paneCount; i++) {
                container.insertAdjacentHTML('beforeend', getPaneConfigHTML(i));
                updatePaneSourceInput(container.lastElementChild);
            }
        };

        const modalChangeListener = (e) => {
            if (e.target.id === 'mosaic-layout') updatePanesLayout();
            if (e.target.classList.contains('mosaic-pane-type')) updatePaneSourceInput(e.target.closest('.mosaic-pane-config'));
            if (e.target.classList.contains('mosaic-pane-file')) {
                const index = e.target.closest('.mosaic-pane-config').dataset.paneIndex;
                mosaicFiles[index] = e.target.files.length > 0 ? e.target.files[0] : null;
            }
        };

        modalBodyEl.addEventListener('change', modalChangeListener);
        updatePanesLayout(); // Initial setup
    });

    // Control buttons
    controlButtons.play().addEventListener('click', () => {
        const playlist = getPlaylistCallback();
        if (playlist.length === 0) {
            showNotification('Lista Vazia', 'A playlist está vazia. Adicione alguma mídia primeiro.', 'warning');
        } else {
            playCallback();
        }
    });

    controlButtons.relinkFiles().addEventListener('click', () => {
        showMissingFilesModal(() => {
            showNotification('Mídia Relincada', 'A lista de reprodução foi atualizada com os arquivos fornecidos.', 'info');
        });
    });

    controlButtons.playlistManagement().addEventListener('click', () => {
        showPlaylistManagementModal();
    });

    controlButtons.globalSettings().addEventListener('click', setupAndShowGlobalSettingsModal);

    controlButtons.logo().addEventListener('click', () => fileInputs.logo().click());
    fileInputs.logo().addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                localStorage.setItem('easyplay-logo', event.target.result);
                applyLogo(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    controlButtons.removeLogo().addEventListener('click', () => {
        showConfirmation('Remover Logo', 'Deseja remover a logo da visualização?', () => {
            localStorage.removeItem('easyplay-logo');
            localStorage.removeItem('easyplay-logo-position');
            applyLogo(null);
            showNotification('Logo Removida', 'A logo foi removida com sucesso.', 'info');
        });
    });

    controlButtons.export().addEventListener('click', () => exportCallback());
    controlButtons.import().addEventListener('click', () => fileInputs.import().click());
    fileInputs.import().addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importCallback(e.target.files[0]);
        }
    });

    controlButtons.clear().addEventListener('click', () => {
        showConfirmation('Limpar Playlist', 'Isso removerá todos os itens da playlist atual. Deseja continuar?', () => {
            clearPlaylistCallback();
            showNotification('Playlist Limpa', 'Todos os itens foram removidos.', 'success');
        });
    });

    // Reset file inputs so the 'change' event fires even if the same file is selected
    Object.values(fileInputs).forEach(inputGetter => {
        const input = inputGetter();
        if(input) input.addEventListener('click', (e) => { e.target.value = null; });
    });
}

function setupAndShowGlobalSettingsModal() {
    const currentSettings = settings.loadSettings();

    // Populate Clock tab
    const clockEnabledCheckbox = document.getElementById('setting-clock-enabled');
    const clockOptions = document.getElementById('clock-options');
    clockEnabledCheckbox.checked = currentSettings.clock.enabled;
    document.getElementById('setting-clock-position').value = currentSettings.clock.position;
    document.getElementById('setting-clock-format').value = currentSettings.clock.format;
    document.getElementById('setting-clock-size').value = currentSettings.clock.size;
    document.getElementById('setting-clock-color').value = currentSettings.clock.color;
    clockOptions.classList.toggle('d-none', !currentSettings.clock.enabled);
    clockEnabledCheckbox.onchange = (e) => {
        clockOptions.classList.toggle('d-none', !e.target.checked);
    };
    
    // Populate Weather tab
    const weatherEnabledCheckbox = document.getElementById('setting-weather-enabled');
    const weatherOptions = document.getElementById('weather-options');
    weatherEnabledCheckbox.checked = currentSettings.weather.enabled;
    document.getElementById('setting-weather-location').value = currentSettings.weather.location || '';
    document.getElementById('setting-weather-units').value = currentSettings.weather.units;
    document.getElementById('setting-weather-position').value = currentSettings.weather.position;
    weatherOptions.classList.toggle('d-none', !currentSettings.weather.enabled);
    weatherEnabledCheckbox.onchange = (e) => {
        weatherOptions.classList.toggle('d-none', !e.target.checked);
    };

    // Populate RSS tab
    const rssEnabledCheckbox = document.getElementById('setting-rss-enabled');
    const rssOptions = document.getElementById('rss-options');
    rssEnabledCheckbox.checked = currentSettings.rss.enabled;
    document.getElementById('setting-rss-url').value = currentSettings.rss.url || '';
    document.getElementById('setting-rss-position').value = currentSettings.rss.position;
    document.getElementById('setting-rss-speed').value = currentSettings.rss.speed;
    document.getElementById('rss-speed-value').textContent = `${currentSettings.rss.speed} px/s`;
    document.getElementById('setting-rss-bgcolor').value = currentSettings.rss.bgColor;
    document.getElementById('setting-rss-color').value = currentSettings.rss.textColor;
    rssOptions.classList.toggle('d-none', !currentSettings.rss.enabled);
    rssEnabledCheckbox.onchange = (e) => {
        rssOptions.classList.toggle('d-none', !e.target.checked);
    };
    
    // Populate Logo tab
    const logoPositionSelect = document.getElementById('setting-logo-position');
    const logoFormText = document.getElementById('logo-settings-form-text');
    logoPositionSelect.value = localStorage.getItem('easyplay-logo-position') || 'top-right';
    const hasLogo = !!localStorage.getItem('easyplay-logo');
    logoPositionSelect.disabled = !hasLogo;
    logoFormText.textContent = hasLogo
        ? "A posição da logo pode ser definida aqui. A imagem da logo pode ser alterada na barra de ferramentas do editor."
        : "Adicione uma logo na barra de ferramentas do editor para poder definir a sua posição.";

    // Save button
    document.getElementById('global-settings-save-btn').onclick = () => {
        const newSettings = {
            clock: {
                enabled: document.getElementById('setting-clock-enabled').checked,
                position: document.getElementById('setting-clock-position').value,
                format: document.getElementById('setting-clock-format').value,
                size: document.getElementById('setting-clock-size').value,
                color: document.getElementById('setting-clock-color').value,
            },
            weather: {
                enabled: document.getElementById('setting-weather-enabled').checked,
                location: document.getElementById('setting-weather-location').value,
                units: document.getElementById('setting-weather-units').value,
                position: document.getElementById('setting-weather-position').value,
            },
            rss: {
                enabled: document.getElementById('setting-rss-enabled').checked,
                url: document.getElementById('setting-rss-url').value,
                position: document.getElementById('setting-rss-position').value,
                speed: parseFloat(document.getElementById('setting-rss-speed').value),
                bgColor: document.getElementById('setting-rss-bgcolor').value,
                textColor: document.getElementById('setting-rss-color').value,
            },
            logo: { // Add this to persist settings object structure
                position: document.getElementById('setting-logo-position').value
            }
        };
        settings.saveSettings(newSettings);
        
        // Save logo position separately as it's not part of the main settings object flow yet
        if (hasLogo) {
            localStorage.setItem('easyplay-logo-position', logoPositionSelect.value);
            applyLogo(localStorage.getItem('easyplay-logo')); // Re-apply logo with new position
        }

        hideGlobalSettingsModal();
    };
    
    showGlobalSettingsModal();
}

function setupPlaylistManagement() {
    document.getElementById('new-playlist-btn').addEventListener('click', () => {
        showConfirmation('Nova Playlist', 'Isso irá limpar a playlist atual. Deseja continuar?', () => {
            clearPlaylistCallback();
            showNotification('Nova Playlist', 'Playlist limpa. Você pode agora adicionar novas mídias.', 'success');
        });
    });

    document.getElementById('save-playlist-btn').addEventListener('click', () => {
        const playlist = getPlaylistCallback();
        if (playlist.length === 0) {
            showNotification('Playlist Vazia', 'Não há itens para salvar.', 'warning');
            return;
        }
        
        openInputModal({
            title: 'Salvar Playlist',
            body: `
                <div class="mb-3">
                    <label for="playlist-name" class="form-label">Nome da Playlist</label>
                    <input type="text" class="form-control" id="playlist-name" placeholder="Minha Playlist" required>
                </div>
            `,
            onSave: () => {
                const name = document.getElementById('playlist-name').value;
                if (!name) return false;
                
                const savedPlaylists = JSON.parse(localStorage.getItem('easyplay-saved-playlists') || '{}');
                savedPlaylists[name] = playlist.map(item => {
                    const { file, ...rest } = item;
                    return rest;
                });
                localStorage.setItem('easyplay-saved-playlists', JSON.stringify(savedPlaylists));
                
                showNotification('Playlist Salva', `Playlist "${name}" foi salva com sucesso.`, 'success');
                updateSavedPlaylistsList();
                hidePlaylistManagementModal();
                return true;
            }
        });
    });

    document.getElementById('load-playlist-btn').addEventListener('click', () => {
        document.getElementById('load-playlist-input').click();
    });

    document.getElementById('load-playlist-input').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importCallback(e.target.files[0]);
            hidePlaylistManagementModal();
        }
    });
}

function updateSavedPlaylistsList() {
    const savedPlaylists = JSON.parse(localStorage.getItem('easyplay-saved-playlists') || '{}');
    const listEl = document.getElementById('saved-playlists-list');
    listEl.innerHTML = '';
    
    if (Object.keys(savedPlaylists).length === 0) {
        listEl.innerHTML = '<div class="text-muted p-3">Nenhuma playlist salva.</div>';
        return;
    }
    
    Object.entries(savedPlaylists).forEach(([name, playlist]) => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <strong>${name}</strong>
                <small class="text-muted d-block">${playlist.length} item(s)</small>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary me-2 load-saved-btn" title="Carregar Playlist" data-name="${name}">Carregar</button>
                <button class="btn btn-sm btn-outline-secondary me-2 rename-saved-btn" title="Renomear Playlist" data-name="${name}">${icons.renameIcon}</button>
                <button class="btn btn-sm btn-outline-danger delete-saved-btn" title="Excluir Playlist" data-name="${name}">Excluir</button>
            </div>
        `;
        
        item.querySelector('.load-saved-btn').addEventListener('click', () => {
            // Clear current playlist and load saved one
            const currentPlaylist = getPlaylistCallback();
            for (let i = currentPlaylist.length - 1; i >= 0; i--) {
                removeItemCallback(i);
            }
            
            playlist.forEach(item => addCallback(item));
            showNotification('Playlist Carregada', `Playlist "${name}" foi carregada com sucesso.`, 'success');
            hidePlaylistManagementModal();
        });
        
        item.querySelector('.rename-saved-btn').addEventListener('click', () => {
            const oldName = item.querySelector('.rename-saved-btn').dataset.name;
            openInputModal({
                title: 'Renomear Playlist',
                body: `
                    <div class="mb-3">
                        <label for="playlist-new-name" class="form-label">Novo nome para "${oldName}"</label>
                        <input type="text" class="form-control" id="playlist-new-name" value="${oldName}" required>
                    </div>
                `,
                onSave: () => {
                    const newName = document.getElementById('playlist-new-name').value;
                    if (!newName || newName === oldName) return true; // Close modal if no change

                    const savedPlaylists = JSON.parse(localStorage.getItem('easyplay-saved-playlists') || '{}');
                    if(savedPlaylists[newName]) {
                        showNotification('Erro', `Uma playlist com o nome "${newName}" já existe.`, 'error');
                        return false; // Keep modal open
                    }

                    savedPlaylists[newName] = savedPlaylists[oldName];
                    delete savedPlaylists[oldName];
                    localStorage.setItem('easyplay-saved-playlists', JSON.stringify(savedPlaylists));
                    
                    showNotification('Sucesso', 'Playlist renomeada.', 'success');
                    updateSavedPlaylistsList();
                    return true;
                }
            });
        });

        item.querySelector('.delete-saved-btn').addEventListener('click', () => {
            showConfirmation('Excluir Playlist', `Tem certeza que deseja excluir a playlist "${name}"?`, () => {
                delete savedPlaylists[name];
                localStorage.setItem('easyplay-saved-playlists', JSON.stringify(savedPlaylists));
                updateSavedPlaylistsList();
                showNotification('Playlist Excluída', `Playlist "${name}" foi excluída.`, 'success');
            });
        });
        
        listEl.appendChild(item);
    });
}

function applyLogo(logoDataUrl) {
    const watermarkContainer = document.getElementById('watermark-container');
    const removeLogoBtn = controlButtons.removeLogo();

    // Reset styles first
    watermarkContainer.style.top = '';
    watermarkContainer.style.right = '';
    watermarkContainer.style.bottom = '';
    watermarkContainer.style.left = '';
    watermarkContainer.style.transform = '';

    if (logoDataUrl) {
        watermarkContainer.innerHTML = `<img src="${logoDataUrl}" alt="logo">`;
        removeLogoBtn.style.display = 'inline-block';

        const position = (settings.loadSettings().logo.position) || 'top-right';
        const margin = '20px';

        switch (position) {
            case 'top-left':
                watermarkContainer.style.top = margin;
                watermarkContainer.style.left = margin;
                break;
            case 'top-right':
                watermarkContainer.style.top = margin;
                watermarkContainer.style.right = margin;
                break;
            case 'bottom-left':
                watermarkContainer.style.bottom = margin;
                watermarkContainer.style.left = margin;
                break;
            case 'bottom-right':
                watermarkContainer.style.bottom = margin;
                watermarkContainer.style.right = margin;
                break;
        }
    } else {
        watermarkContainer.innerHTML = '';
        removeLogoBtn.style.display = 'none';
    }
}

export function showMissingFilesModal(onContinue) {
    const listEl = document.getElementById('missing-files-list');
    const fileInput = document.getElementById('missing-file-input');
    const continueBtn = document.getElementById('continue-from-missing-files-btn');
    const skipBtn = document.getElementById('skip-missing-files-btn');
    
    let activeItemIndex = -1;
    let activePaneIndex = -1;

    function renderList() {
        listEl.innerHTML = '';
        const playlist = getPlaylistCallback();
        const allMissing = [];

        playlist.forEach((item, itemIndex) => {
            if (item.isMissing) {
                if (item.type === 'mosaic') {
                    item.panes.forEach((pane, paneIndex) => {
                        if (pane.isMissing) {
                             allMissing.push({
                                name: `Mosaico: ${item.name} > Painel ${paneIndex + 1} (${pane.name || 'arquivo local'})`,
                                type: pane.type,
                                itemIndex,
                                paneIndex,
                            });
                        }
                    });
                } else {
                    allMissing.push({
                        name: `${item.name} (${item.type})`,
                        type: item.type,
                        itemIndex,
                        paneIndex: -1,
                    });
                }
            }
        });

        if (allMissing.length === 0) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'Continuar e Reproduzir';
            listEl.innerHTML = '<div class="list-group-item list-group-item-success">Todos os arquivos foram encontrados!</div>';
            return;
        }

        continueBtn.disabled = true;
        continueBtn.textContent = 'Continuar';

        allMissing.forEach(missing => {
            const itemEl = document.createElement('div');
            itemEl.className = 'list-group-item d-flex justify-content-between align-items-center';
            itemEl.innerHTML = `
                <span><span class="badge bg-warning me-2">!</span> ${missing.name}</span>
                <button class="btn btn-sm btn-outline-primary locate-btn" data-item-index="${missing.itemIndex}" data-pane-index="${missing.paneIndex}">Localizar...</button>
            `;
            listEl.appendChild(itemEl);
        });

        listEl.querySelectorAll('.locate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeItemIndex = parseInt(e.target.dataset.itemIndex, 10);
                activePaneIndex = parseInt(e.target.dataset.paneIndex, 10);
                
                const item = getPlaylistCallback()[activeItemIndex];
                const subItem = activePaneIndex === -1 ? item : item.panes[activePaneIndex];
                
                let accept = '*/*';
                if (subItem.type === 'image') accept = 'image/*';
                else if (subItem.type === 'video') accept = 'video/*';
                else if (subItem.type === 'audio') accept = 'audio/*';
                else if (subItem.type === 'pdf') accept = 'application/pdf';
                else if (subItem.type === 'html') accept = 'text/html';
                else if (subItem.type === 'markdown') accept = '.md,.markdown';

                fileInput.accept = accept;
                fileInput.click();
            });
        });
    }

    fileInput.onchange = (e) => {
        if (e.target.files.length > 0 && activeItemIndex !== -1) {
            const file = e.target.files[0];
            const item = getPlaylistCallback()[activeItemIndex];

            if (activePaneIndex === -1) {
                // Not a mosaic pane, simple item update
                const updatedItem = { ...item, file: file, name: file.name, isMissing: false };
                updateItemCallback(activeItemIndex, updatedItem);
            } else {
                // It's a pane within a mosaic
                const newPanes = [...item.panes];
                newPanes[activePaneIndex] = {
                    ...newPanes[activePaneIndex],
                    file: file,
                    name: file.name,
                    isMissing: false,
                };
                const updatedItem = { ...item, panes: newPanes };
                // Check if the whole mosaic is still missing
                updatedItem.isMissing = updatedItem.panes.some(p => p.isMissing);
                updateItemCallback(activeItemIndex, updatedItem);
            }
            renderList(); // Re-render the modal list
        }
        fileInput.value = null;
    };

    continueBtn.onclick = () => {
        hideMissingFilesModal();
        if (onContinue) onContinue();
    };
    
    skipBtn.onclick = () => {
        hideMissingFilesModal();
        if (onContinue) onContinue();
    };

    renderList();
    showMFM();
}

export function updateRelinkButtonState() {
    const missingFiles = getPlaylistCallback().filter(item => item.isMissing);
    const btn = controlButtons.relinkFiles();
    if (btn) {
        if (missingFiles.length > 0) {
            btn.style.display = 'inline-block';
            btn.title = `Localizar ${missingFiles.length} mídia(s) faltante(s)`;
            const tooltip = Tooltip.getInstance(btn);
            if (tooltip) {
                tooltip.setContent({ '.tooltip-inner': btn.title });
            }
        } else {
            btn.style.display = 'none';
        }
    }
}

export function showPlaylistManagementModal() {
    updateSavedPlaylistsList();
    showPMM();
}

export function toggleEditorPanel(visible) {
    const panel = editorPanel();
    settings.applySettings(visible);
    if (visible) {
        panel.classList.remove('d-none');
        // A small delay to allow display: block to apply before transition
        setTimeout(() => panel.style.transform = 'translateY(0)', 10);
    } else {
        panel.style.transform = 'translateY(100%)';
        // Hide with d-none after transition for performance
        setTimeout(() => {
            if (panel) panel.classList.add('d-none');
        }, 300);
    }
}

export function init(addCb, getPlaylistCb, updateCb, removeCb, moveUpCb, moveDownCb, importCb, exportCb, playCb, stopCb, clearCb) {
    addCallback = addCb;
    getPlaylistCallback = getPlaylistCb;
    updateItemCallback = updateCb;
    removeItemCallback = removeCb;
    moveUpCallback = moveUpCb;
    moveDownCallback = moveDownCb;
    importCallback = importCb;
    exportCallback = exportCb;
    playCallback = playCb;
    stopCallback = stopCb;
    clearPlaylistCallback = clearCb;
    
    initModals();
    settings.init();
    initTimeline(getPlaylistCb, updateCb, removeCb, moveUpCb, moveDownCb);

    setupIcons();
    setupEventListeners();
    setupTooltips();
    setupPlaylistManagement();
    applyLogo(localStorage.getItem('easyplay-logo'));
}

export function renderPlaylist() {
    renderTimeline();
}

export { showNotification, showConfirmation, showInstructionsModal };