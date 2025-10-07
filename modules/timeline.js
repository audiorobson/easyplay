import * as icons from './icons.js';
import { showConfirmation, openInputModal } from './modals.js';
import { createMediaItemConfigForm, getFormValues } from './forms.js';

let getPlaylistCallback, updateItemCallback, removeItemCallback, moveUpCallback, moveDownCallback;

const timelineEl = () => document.getElementById('timeline');

export function renderPlaylist() {
    const playlist = getPlaylistCallback();
    const timeline = timelineEl();
    timeline.innerHTML = '';
    
    if (playlist.length === 0) {
        timeline.innerHTML = `<div class="text-center p-3 text-muted">A linha do tempo está vazia. Adicione mídias para começar.</div>`;
        return;
    }

    playlist.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'timeline-item';
        itemEl.dataset.index = index;

        let icon = '';
        switch (item.type) {
            case 'image': icon = icons.imageIcon; break;
            case 'video': icon = icons.videoIcon; break;
            case 'web': icon = icons.webIcon; break;
            case 'youtube': icon = icons.youtubeIcon; break;
            case 'html': icon = icons.htmlIcon; break;
            case 'pdf': icon = icons.pdfIcon; break;
            case 'text': icon = icons.textIcon; break;
            case 'audio': icon = icons.audioIcon; break;
            case 'markdown': icon = icons.markdownIcon; break;
            case 'clock': icon = icons.clockIcon; break;
            case 'mosaic': icon = icons.mosaicIcon; break;
            case 'weather': icon = icons.weatherIcon; break;
        }

        itemEl.innerHTML = `
            <div class="item-icon">${icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-controls">
                <button class="up-item-btn" title="Mover para Cima">${icons.arrowUpIcon}</button>
                <button class="down-item-btn" title="Mover para Baixo">${icons.arrowDownIcon}</button>
                <button class="edit-item-btn" title="Editar">${icons.settingsIcon}</button>
                <button class="delete-item-btn" title="Remover">${icons.trashIcon}</button>
            </div>
        `;

        itemEl.querySelector('.delete-item-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmation('Confirmar Remoção', `Tem certeza que deseja remover "${item.name}"?`, () => {
                removeItemCallback(index);
            });
        });

        itemEl.querySelector('.edit-item-btn').addEventListener('click', (e) => {
             e.stopPropagation();
             let modalBody = '';
             if (item.type === 'text') {
                 modalBody = `
                    <div class="mb-3"><label class="form-label">Texto</label><textarea class="form-control" id="text-content" rows="3">${item.text || ''}</textarea></div>
                    <div class="mb-3"><label class="form-label">Tamanho da Fonte</label><input type="text" class="form-control" id="text-font-size" value="${item.fontSize || '7vw'}"></div>
                    <div class="mb-3"><label class="form-label">Cor</label><input type="color" class="form-control form-control-color" id="text-color" value="${item.color || '#FFFFFF'}"></div>
                    <div class="mb-3">
                        <label for="text-animation" class="form-label">Animação do Texto</label>
                        <select id="text-animation" class="form-select">
                            <option value="none" ${item.textAnimation === 'none' ? 'selected' : ''}>Nenhuma</option>
                            <option value="typewriter" ${item.textAnimation === 'typewriter' ? 'selected' : ''}>Máquina de Escrever</option>
                            <option value="fadeInWords" ${item.textAnimation === 'fadeInWords' ? 'selected' : ''}>Fade por Palavra</option>
                            <option value="slideInWords" ${item.textAnimation === 'slideInWords' ? 'selected' : ''}>Slide por Palavra</option>
                            <option value="bounceIn" ${item.textAnimation === 'bounceIn' ? 'selected' : ''}>Bounce</option>
                        </select>
                    </div>
                    ${createMediaItemConfigForm(item, item.type)}
                 `;
             } else if (item.type === 'audio') {
                 modalBody = `
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" role="switch" id="item-autocaption" ${item.autoCaption ? 'checked' : ''}>
                        <label class="form-check-label" for="item-autocaption">Habilitar Legendas Automáticas (Experimental)</label>
                        <div class="form-text">Usa o microfone para "ouvir" o áudio e transcrevê-lo. A qualidade pode variar. Funciona melhor no Google Chrome.</div>
                    </div>
                    ${createMediaItemConfigForm(item, item.type)}
                 `;
             } else if (item.type === 'clock') {
                 modalBody = `
                    <div class="mb-3">
                        <label for="clock-format" class="form-label">Formato</label>
                        <select id="clock-format" class="form-select">
                            <option value="24h" ${item.clockConfig?.format === '24h' ? 'selected' : ''}>24 Horas</option>
                            <option value="12h" ${item.clockConfig?.format === '12h' ? 'selected' : ''}>12 Horas</option>
                            <option value="date" ${item.clockConfig?.format === 'date' ? 'selected' : ''}>Data e Hora</option>
                            <option value="date-only" ${item.clockConfig?.format === 'date-only' ? 'selected' : ''}>Apenas Data</option>
                        </select>
                    </div>
                    <div class="mb-3"><label class="form-label">Tamanho da Fonte</label><input type="text" class="form-control" id="clock-font-size" value="${item.clockConfig?.fontSize || '8vw'}"></div>
                    <div class="mb-3"><label class="form-label">Cor</label><input type="color" class="form-control form-control-color" id="clock-color" value="${item.clockConfig?.color || '#00BCD4'}"></div>
                    ${createMediaItemConfigForm(item, item.type)}
                 `;
             } else if (item.type === 'image' || item.type === 'video') {
                 modalBody = `
                    <div class="mb-3">
                        <label for="item-caption" class="form-label">Legenda (opcional)</label>
                        <input type="text" class="form-control" id="item-caption" value="${item.caption || ''}" placeholder="Texto que aparece sobre a mídia">
                    </div>
                     <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="item-caption-font-size" class="form-label">Tamanho da Fonte da Legenda</label>
                                <input type="text" class="form-control" id="item-caption-font-size" value="${item.captionFontSize || '1.5vw'}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="item-caption-font-color" class="form-label">Cor da Fonte da Legenda</label>
                                <input type="color" class="form-control form-control-color" id="item-caption-font-color" value="${item.captionFontColor || '#FFFFFF'}">
                            </div>
                        </div>
                    </div>
                    ${createMediaItemConfigForm(item, item.type)}
                 `;
             } else if (item.type === 'web' || item.type === 'html') {
                  modalBody = createMediaItemConfigForm(item, item.type);
             } else if (item.type === 'mosaic') {
                 // Editing mosaic panes is complex; for now, allow editing general settings.
                 modalBody = `
                    <p class="text-muted">A edição detalhada dos painéis do mosaico não está disponível. Você pode editar as configurações gerais abaixo.</p>
                    ${createMediaItemConfigForm(item, item.type)}
                 `;
             } else if (item.type === 'weather') {
                 modalBody = `
                    <div class="mb-3">
                        <label for="weather-location" class="form-label">Localização</label>
                        <input type="text" class="form-control" id="weather-location" value="${item.weatherConfig?.location || ''}" placeholder="Digite o nome do local">
                    </div>
                    <div class="mb-3">
                        <label for="weather-unit" class="form-label">Unidade</label>
                        <select id="weather-unit" class="form-select">
                            <option value="metric" ${item.weatherConfig?.unit === 'metric' ? 'selected' : ''}>Celsius</option>
                            <option value="imperial" ${item.weatherConfig?.unit === 'imperial' ? 'selected' : ''}>Fahrenheit</option>
                        </select>
                    </div>
                    ${createMediaItemConfigForm(item, item.type)}
                 `;
             } else {
                 modalBody = createMediaItemConfigForm(item, item.type);
             }
             
             openInputModal({
                 title: `Editar: ${item.name}`,
                 body: modalBody,
                 onSave: () => {
                      let updatedItem = {
                         ...item,
                         ...getFormValues(),
                      };
                     
                      if (item.type === 'image' || item.type === 'video') {
                         updatedItem.caption = document.getElementById('item-caption').value;
                         updatedItem.captionFontSize = document.getElementById('item-caption-font-size').value;
                         updatedItem.captionFontColor = document.getElementById('item-caption-font-color').value;
                      } else if (item.type === 'text') {
                         updatedItem.text = document.getElementById('text-content').value;
                         updatedItem.fontSize = document.getElementById('text-font-size').value;
                         updatedItem.color = document.getElementById('text-color').value;
                         updatedItem.textAnimation = document.getElementById('text-animation').value;
                      } else if (item.type === 'audio') {
                         updatedItem.autoCaption = document.getElementById('item-autocaption').checked;
                      } else if (item.type === 'clock') {
                         updatedItem.clockConfig = {
                             format: document.getElementById('clock-format').value,
                             fontSize: document.getElementById('clock-font-size').value,
                             color: document.getElementById('clock-color').value,
                         };
                      } else if (item.type === 'weather') {
                         updatedItem.weatherConfig = {
                             location: document.getElementById('weather-location').value,
                             unit: document.getElementById('weather-unit').value,
                         };
                      }
                     
                      updateItemCallback(index, updatedItem);
                      return true;
                 }
             });
        });

        itemEl.querySelector('.up-item-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            moveUpCallback(index);
        });
        
        itemEl.querySelector('.down-item-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            moveDownCallback(index);
        });

        timeline.appendChild(itemEl);
    });
}

export function init(getPlaylistCb, updateCb, removeCb, moveUpCb, moveDownCb) {
    getPlaylistCallback = getPlaylistCb;
    updateItemCallback = updateCb;
    removeItemCallback = removeCb;
    moveUpCallback = moveUpCb;
    moveDownCallback = moveDownCb;
}