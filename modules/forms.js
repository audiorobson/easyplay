export function createMediaItemConfigForm(item = {}, itemType = '') {
    const defaults = {
        duration: 10,
        displayMode: 'zoom',
        transition: 'fadeIn',
        transitionDuration: 800,
        backgroundColor: '#000000',
        opacity: 1,
        scale: 1,
        rotate: 0,
        blur: 0,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        muted: true, // Default to muted
        autoScroll: false,
        scrollSpeed: 30,
        refreshInterval: 0,
        ...item
    };

    let extraFields = '';
    if (itemType === 'web' || itemType === 'html') {
        extraFields = `
            <div class="form-check mt-3">
                <input class="form-check-input" type="checkbox" id="item-autoscroll" ${defaults.autoScroll ? 'checked' : ''} onchange="document.getElementById('autoscroll-options').classList.toggle('d-none', !this.checked)">
                <label class="form-check-label" for="item-autoscroll">
                    Rolagem Automática
                </label>
                <div class="form-text">Pode não funcionar em sites externos devido a restrições de segurança.</div>
            </div>
             <div id="autoscroll-options" class="${defaults.autoScroll ? '' : 'd-none'}">
                <div class="my-3">
                    <label for="item-scroll-speed" class="form-label">Velocidade da Rolagem: <span id="scroll-speed-value">${defaults.scrollSpeed} px/s</span></label>
                    <input type="range" class="form-range" id="item-scroll-speed" min="10" max="150" step="5" value="${defaults.scrollSpeed}" oninput="document.getElementById('scroll-speed-value').textContent = this.value + ' px/s'">
                </div>
            </div>
             <div class="mb-3">
                <label for="item-refresh-interval" class="form-label">Atualizar a cada (segundos)</label>
                <input type="number" class="form-control" id="item-refresh-interval" value="${defaults.refreshInterval}" min="0">
                <div class="form-text">Deixe em 0 para não atualizar automaticamente. Pode não funcionar em todos os sites devido a restrições.</div>
            </div>
        `;
    }
    if (itemType === 'video' || itemType === 'youtube' || itemType === 'audio') {
        extraFields += `
            <div class="form-check mt-3">
                <input class="form-check-input" type="checkbox" id="item-muted" ${!defaults.muted ? 'checked' : ''}>
                <label class="form-check-label" for="item-muted">
                    Habilitar Áudio (desmarcado = mudo)
                </label>
            </div>
        `;
    }

    const imageOnlyOptions = itemType === 'image' ? `
        <option value="pan" ${defaults.displayMode === 'pan' ? 'selected' : ''}>Panorâmico</option>
    ` : '';

    return `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label for="item-duration" class="form-label">Duração (segundos)</label>
                    <input type="number" class="form-control" id="item-duration" value="${defaults.duration}" min="0" step="0.1">
                </div>
                <div class="mb-3">
                    <label for="item-display-mode" class="form-label">Modo de Exibição</label>
                    <select id="item-display-mode" class="form-select">
                        <option value="native" ${defaults.displayMode === 'native' ? 'selected' : ''}>Nativo</option>
                        <option value="stretch" ${defaults.displayMode === 'stretch' ? 'selected' : ''}>Esticado</option>
                        <option value="zoom" ${defaults.displayMode === 'zoom' ? 'selected' : ''}>Zoom</option>
                        <option value="contain" ${defaults.displayMode === 'contain' ? 'selected' : ''}>Ajustar</option>
                        ${imageOnlyOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="item-transition" class="form-label">Transição de Entrada</label>
                    <select id="item-transition" class="form-select">
                        <option value="fadeIn" ${defaults.transition === 'fadeIn' ? 'selected' : ''}>Fade In</option>
                        <option value="slideInLeft" ${defaults.transition === 'slideInLeft' ? 'selected' : ''}>Slide da Esquerda</option>
                        <option value="slideInRight" ${defaults.transition === 'slideInRight' ? 'selected' : ''}>Slide da Direita</option>
                        <option value="slideInTop" ${defaults.transition === 'slideInTop' ? 'selected' : ''}>Slide de Cima</option>
                        <option value="slideInBottom" ${defaults.transition === 'slideInBottom' ? 'selected' : ''}>Slide de Baixo</option>
                        <option value="zoomIn" ${defaults.transition === 'zoomIn' ? 'selected' : ''}>Zoom In</option>
                        <option value="zoomOut" ${defaults.transition === 'zoomOut' ? 'selected' : ''}>Zoom Out</option>
                        <option value="rotateIn" ${defaults.transition === 'rotateIn' ? 'selected' : ''}>Rotação</option>
                        <option value="flipIn" ${defaults.transition === 'flipIn' ? 'selected' : ''}>Flip</option>
                        <option value="bounceIn" ${defaults.transition === 'bounceIn' ? 'selected' : ''}>Bounce</option>
                        <option value="spiralIn" ${defaults.transition === 'spiralIn' ? 'selected' : ''}>Espiral</option>
                        <option value="expandIn" ${defaults.transition === 'expandIn' ? 'selected' : ''}>Expandir</option>
                        <option value="swingIn" ${defaults.transition === 'swingIn' ? 'selected' : ''}>Balançar</option>
                        <option value="rollIn" ${defaults.transition === 'rollIn' ? 'selected' : ''}>Rolar</option>
                        <option value="lightSpeedIn" ${defaults.transition === 'lightSpeedIn' ? 'selected' : ''}>Velocidade da Luz</option>
                        <option value="rubberBand" ${defaults.transition === 'rubberBand' ? 'selected' : ''}>Elástico</option>
                        <option value="jello" ${defaults.transition === 'jello' ? 'selected' : ''}>Gelatina</option>
                        <option value="heartBeat" ${defaults.transition === 'heartBeat' ? 'selected' : ''}>Batimento</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="item-transition-duration" class="form-label">Duração da Transição: <span id="transition-duration-value">${defaults.transitionDuration}ms</span></label>
                    <input type="range" class="form-range" id="item-transition-duration" min="200" max="3000" step="100" value="${defaults.transitionDuration}" oninput="document.getElementById('transition-duration-value').textContent = this.value + 'ms'">
                </div>
                <div class="mb-3">
                    <label for="item-bg-color" class="form-label">Cor de Fundo</label>
                    <input type="color" class="form-control form-control-color" id="item-bg-color" value="${defaults.backgroundColor}">
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label for="item-opacity" class="form-label">Opacidade: <span id="opacity-value">${Math.round(defaults.opacity * 100)}%</span></label>
                    <input type="range" class="form-range" id="item-opacity" min="0" max="1" step="0.01" value="${defaults.opacity}" oninput="document.getElementById('opacity-value').textContent = Math.round(this.value * 100) + '%'">
                </div>
                <div class="mb-3">
                    <label for="item-scale" class="form-label">Escala: <span id="scale-value">${Math.round(defaults.scale * 100)}%</span></label>
                    <input type="range" class="form-range" id="item-scale" min="0.1" max="3" step="0.05" value="${defaults.scale}" oninput="document.getElementById('scale-value').textContent = Math.round(this.value * 100) + '%'">
                </div>
                <div class="mb-3">
                    <label for="item-rotate" class="form-label">Rotação: <span id="rotate-value">${defaults.rotate}°</span></label>
                    <input type="range" class="form-range" id="item-rotate" min="-180" max="180" step="1" value="${defaults.rotate}" oninput="document.getElementById('rotate-value').textContent = this.value + '°'">
                </div>
                <div class="mb-3">
                    <label for="item-blur" class="form-label">Desfoque: <span id="blur-value">${defaults.blur}px</span></label>
                    <input type="range" class="form-range" id="item-blur" min="0" max="20" step="0.5" value="${defaults.blur}" oninput="document.getElementById('blur-value').textContent = this.value + 'px'">
                </div>
                <div class="mb-3">
                    <label for="item-brightness" class="form-label">Brilho: <span id="brightness-value">${defaults.brightness}%</span></label>
                    <input type="range" class="form-range" id="item-brightness" min="0" max="200" step="5" value="${defaults.brightness}" oninput="document.getElementById('brightness-value').textContent = this.value + '%'">
                </div>
                <div class="mb-3">
                    <label for="item-contrast" class="form-label">Contraste: <span id="contrast-value">${defaults.contrast}%</span></label>
                    <input type="range" class="form-range" id="item-contrast" min="0" max="200" step="5" value="${defaults.contrast}" oninput="document.getElementById('contrast-value').textContent = this.value + '%'">
                </div>
                ${extraFields}
            </div>
        </div>
    `;
}

export function getFormValues() {
    const mutedCheckbox = document.getElementById('item-muted');
    return {
        duration: parseFloat(document.getElementById('item-duration').value),
        displayMode: document.getElementById('item-display-mode').value,
        transition: document.getElementById('item-transition').value,
        transitionDuration: parseFloat(document.getElementById('item-transition-duration').value),
        backgroundColor: document.getElementById('item-bg-color').value,
        opacity: parseFloat(document.getElementById('item-opacity').value),
        scale: parseFloat(document.getElementById('item-scale').value),
        rotate: parseFloat(document.getElementById('item-rotate').value),
        blur: parseFloat(document.getElementById('item-blur').value),
        brightness: parseFloat(document.getElementById('item-brightness').value),
        contrast: parseFloat(document.getElementById('item-contrast').value),
        saturate: parseFloat(document.getElementById('item-saturate')?.value || 100),
        autoScroll: document.getElementById('item-autoscroll')?.checked || false,
        scrollSpeed: parseFloat(document.getElementById('item-scroll-speed')?.value || 30),
        refreshInterval: parseFloat(document.getElementById('item-refresh-interval')?.value || 0),
        muted: mutedCheckbox ? !mutedCheckbox.checked : true,
    };
}