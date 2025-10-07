import anime from 'animejs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs`;

let ytPlayer = null;
let progressInterval = null;

export function applyItemStyles(element, item) {
    if (item.backgroundColor && item.backgroundColor !== '#000000') {
        element.style.backgroundColor = item.backgroundColor;
    }
    if (item.opacity !== undefined && item.opacity !== 1) {
        element.style.opacity = item.opacity;
    }
    
    const filters = [];
    if (item.blur && item.blur > 0) filters.push(`blur(${item.blur}px)`);
    if (item.brightness !== undefined && item.brightness !== 100) filters.push(`brightness(${item.brightness}%)`);
    if (item.contrast !== undefined && item.contrast !== 100) filters.push(`contrast(${item.contrast}%)`);
    if (item.saturate !== undefined && item.saturate !== 100) filters.push(`saturate(${item.saturate}%)`);
    if (filters.length > 0) element.style.filter = filters.join(' ');
    
    const transforms = [];
    if (item.scale !== undefined && item.scale !== 1) transforms.push(`scale(${item.scale})`);
    if (item.rotate !== undefined && item.rotate !== 0) transforms.push(`rotate(${item.rotate}deg)`);
    if (transforms.length > 0) element.style.transform = transforms.join(' ');
}

export function animateText(element, animation, text) {
    if (!animation || animation === 'none') {
        element.innerHTML = text.replace(/\n/g, '<br>');
        return;
    }
    
    const words = text.split(' ');
    element.innerHTML = '';
    
    switch (animation) {
        case 'typewriter':
            let charIndex = 0;
            const typeInterval = setInterval(() => {
                if (charIndex < text.length) {
                    element.textContent = text.substring(0, charIndex + 1);
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 50);
            break;
            
        case 'fadeInWords':
            words.forEach((word, index) => {
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.style.opacity = '0';
                element.appendChild(span);
                
                anime({
                    targets: span,
                    opacity: 1,
                    delay: index * 200,
                    duration: 500
                });
            });
            break;
            
        case 'slideInWords':
            words.forEach((word, index) => {
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.style.transform = 'translateX(-20px)';
                span.style.opacity = '0';
                element.appendChild(span);
                
                anime({
                    targets: span,
                    translateX: 0,
                    opacity: 1,
                    delay: index * 150,
                    duration: 400
                });
            });
            break;
            
        case 'bounceIn':
            element.innerHTML = text.replace(/\n/g, '<br>');
            anime({
                targets: element,
                scale: [0.3, 1.05, 0.9, 1],
                duration: 800
            });
            break;
            
        default:
            element.innerHTML = text.replace(/\n/g, '<br>');
    }
}

// Map WMO Weather interpretation codes to emojis
function getWeatherEmoji(code) {
    if ([0, 1].includes(code)) return '☀️'; // Clear, mainly clear
    if ([2].includes(code)) return '⛅'; // Partly cloudy
    if ([3].includes(code)) return '☁️'; // Overcast
    if ([45, 48].includes(code)) return '🌫️'; // Fog
    if ([51, 53, 55, 56, 57].includes(code)) return '🌧️'; // Drizzle
    if ([61, 63, 65, 66, 67].includes(code)) return '🌧️'; // Rain
    if ([80, 81, 82].includes(code)) return '🌦️'; // Rain showers
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️'; // Snow
    if ([95, 96, 99].includes(code)) return '⛈️'; // Thunderstorm
    return '...';
}

export function formatTime(format) {
    const now = new Date();
    const options = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    
    switch (format) {
        case '12h':
            return now.toLocaleTimeString('pt-BR', { ...options, hour12: true });
        case '24h':
            return now.toLocaleTimeString('pt-BR', { ...options, hour12: false });
        case 'date':
            return now.toLocaleString('pt-BR', options);
        case 'date-only':
            return now.toLocaleDateString('pt-BR', options);
        default:
            return now.toLocaleTimeString('pt-BR', { ...options, hour12: false });
    }
}

export function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export async function createMediaElement(item, playNext) {
    let el;
    let isAsync = false;

    switch (item.type) {
        case 'image':
            if (!item.file) {
                console.warn(`Image item "${item.name}" has no file. Skipping.`);
                return null;
            }
            return new Promise(resolve => {
                const img = document.createElement('img');
                img.onload = () => resolve({ element: img, isAsync: false });
                img.onerror = () => {
                    console.error(`Failed to load image: ${item.name}`);
                    resolve(null);
                };
                img.src = URL.createObjectURL(item.file);
            });
        case 'video':
            if (!item.file) {
                console.warn(`Video item "${item.name}" has no file. Skipping.`);
                return null;
            }
            el = document.createElement('video');
            el.src = URL.createObjectURL(item.file);
            el.autoplay = true;
            el.muted = item.muted ?? true;
            el.loop = false;
            el.ontimeupdate = () => {
                if(el.duration) {
                    const progressBar = document.getElementById('progress-bar');
                    progressBar.style.width = `${(el.currentTime / el.duration) * 100}%`;
                }
            };
            el.onended = () => playNext();
            isAsync = true;
            break;
        case 'audio':
            if (!item.file) {
                console.warn(`Audio item "${item.name}" has no file. Skipping.`);
                return null;
            }
            el = document.createElement('div');
            el.className = 'audio-visualization-bg';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.textAlign = 'center';
            el.style.color = '#00BCD4';
            el.style.fontSize = '3vw';
            el.innerHTML = `
                <div class="audio-viz-content">
                    <div style="font-size: 4vw;">🎵</div>
                    <div>Reproduzindo Áudio</div>
                    <div style="font-size: 1.5vw; margin-top: 1vw;">${item.name}</div>
                </div>
                <div class="viz-bars"></div>
                <div class="caption-overlay audio-caption"></div>
            `;
            
            // Generate bars for visualization
            const barsContainer = el.querySelector('.viz-bars');
            if (barsContainer) {
                for (let i = 0; i < 50; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'viz-bar';
                    bar.style.height = `${Math.floor(Math.random() * 60 + 20)}px`;
                    bar.style.animationDelay = `${Math.random() * -2}s`;
                    barsContainer.appendChild(bar);
                }
            }

            const audio = document.createElement('audio');
            audio.src = URL.createObjectURL(item.file);
            audio.autoplay = true;
            audio.muted = item.muted ?? false;
            audio.ontimeupdate = () => {
                if(audio.duration) {
                    const progressBar = document.getElementById('progress-bar');
                    progressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
                }
            };
            audio.onended = () => playNext();

            if (item.autoCaption) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const captionEl = el.querySelector('.audio-caption');
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'pt-BR';
                    recognition.continuous = true;
                    recognition.interimResults = true;
            
                    recognition.onresult = (event) => {
                        let interimTranscript = '';
                        let finalTranscript = '';
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) {
                                finalTranscript += event.results[i][0].transcript;
                            } else {
                                interimTranscript += event.results[i][0].transcript;
                            }
                        }
                        captionEl.innerHTML = finalTranscript + '<span style="opacity: 0.6;">' + interimTranscript + '</span>';
                    };
            
                    recognition.onerror = (event) => {
                        console.error('Speech recognition error', event.error);
                        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                            captionEl.textContent = 'Acesso ao microfone negado.';
                        } else if (event.error !== 'no-speech') {
                            captionEl.textContent = 'Erro na legenda automática.';
                        }
                    };
                    
                    recognition.onend = () => {
                        if (!audio.paused && !audio.ended) {
                            try {
                                recognition.start();
                            } catch(e) { console.error("Could not restart recognition", e); }
                        }
                    };
                    
                    audio.onplay = () => {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error("Speech recognition could not start.", e);
                            captionEl.textContent = 'Erro ao iniciar legendas.';
                        }
                    };
            
                    audio.onpause = () => recognition.stop();
            
                    el.speechRecognition = recognition; // Attach for cleanup
                } else {
                    el.querySelector('.audio-caption').textContent = 'Legendas automáticas não são suportadas neste navegador.';
                }
            }

            el.appendChild(audio);
            isAsync = true;
            break;
        case 'markdown':
            if (!item.file) {
                console.warn(`Markdown item "${item.name}" has no file. Skipping.`);
                return null;
            }
            return new Promise(resolve => {
                const el = document.createElement('div');
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.textAlign = 'left';
                el.style.color = '#f0f0f0';
                el.style.fontSize = '2vw';
                el.style.padding = '5vw';
                el.style.backgroundColor = 'rgba(0,0,0,0.8)';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    let html = e.target.result
                        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                        .replace(/^\* (.*$)/gim, '<li>$1</li>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br>');
                    // Basic wrapping of li in ul
                    if (html.includes('<li>')) {
                        html = html.replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!\s*<li>)/g, '</li></ul>');
                    }
                    el.innerHTML = html;
                    resolve({ element: el, isAsync: false });
                };
                 reader.onerror = () => {
                    console.error(`Failed to read markdown file: ${item.name}`);
                    resolve(null);
                };
                reader.readAsText(item.file);
            });
        case 'clock':
            el = document.createElement('div');
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.textAlign = 'center';
            el.style.color = item.clockConfig?.color || '#00BCD4';
            el.style.fontSize = item.clockConfig?.fontSize || '8vw';
            el.style.fontFamily = 'monospace';
            el.style.fontWeight = 'bold';
            
            const updateClock = () => {
                el.textContent = formatTime(item.clockConfig?.format || '24h');
            };
            updateClock();
            const clockInterval = setInterval(updateClock, 1000);
            
            el.clockInterval = clockInterval;
            break;
        case 'web':
        case 'html':
            if ((item.type === 'web' && !item.url) || (item.type === 'html' && !item.file)) {
                console.warn(`${item.type} item "${item.name}" has no ${item.type === 'web' ? 'url' : 'file'}. Skipping.`);
                return null;
            }
            el = document.createElement('iframe');
            el.src = item.type === 'web' ? item.url : URL.createObjectURL(item.file);
            el.style.border = 'none';
            // The displayMode classes use object-fit, which doesn't apply to iframes.
            // We must set the size explicitly to fill the viewer.
            el.style.width = '100%';
            el.style.height = '100%';
            break;
        case 'mosaic':
            el = document.createElement('div');
            el.className = 'mosaic-container';
            el.style.display = 'grid';

            // Apply layout styles
            switch (item.layout) {
                case '2-vert':
                    el.style.gridTemplateColumns = '1fr 1fr';
                    break;
                case '2-horiz':
                    el.style.gridTemplateRows = '1fr 1fr';
                    break;
                case '3-L2S':
                    el.style.gridTemplateColumns = '2fr 1fr';
                    el.style.gridTemplateRows = '1fr 1fr';
                    el.style.gridTemplateAreas = '"large small-top" "large small-bottom"';
                    break;
                case '3-R2S':
                    el.style.gridTemplateColumns = '1fr 2fr';
                    el.style.gridTemplateRows = '1fr 1fr';
                    el.style.gridTemplateAreas = '"small-top large" "small-bottom large"';
                    break;
                case '3-vert':
                    el.style.gridTemplateColumns = '1fr 1fr 1fr';
                    break;
                case '3-horiz':
                    el.style.gridTemplateRows = '1fr 1fr 1fr';
                    break;
                case '1-top-2-bottom':
                    el.style.gridTemplateColumns = '1fr 1fr';
                    el.style.gridTemplateRows = '2fr 1fr';
                    el.style.gridTemplateAreas = '"top top" "bottom-left bottom-right"';
                    break;
                case '2x2':
                    el.style.gridTemplateColumns = '1fr 1fr';
                    el.style.gridTemplateRows = '1fr 1fr';
            }
            
            // Create panes
            const panePromises = item.panes.map(async (paneItem, index) => {
                const paneEl = document.createElement('div');
                paneEl.className = 'mosaic-pane';

                if (item.layout === '3-L2S') {
                    if (index === 0) paneEl.style.gridArea = 'large';
                    else if (index === 1) paneEl.style.gridArea = 'small-top';
                    else if (index === 2) paneEl.style.gridArea = 'small-bottom';
                } else if (item.layout === '3-R2S') {
                    if (index === 0) paneEl.style.gridArea = 'small-top';
                    else if (index === 1) paneEl.style.gridArea = 'small-bottom';
                    else if (index === 2) paneEl.style.gridArea = 'large';
                } else if (item.layout === '1-top-2-bottom') {
                    if (index === 0) paneEl.style.gridArea = 'top';
                    else if (index === 1) paneEl.style.gridArea = 'bottom-left';
                    else if (index === 2) paneEl.style.gridArea = 'bottom-right';
                }

                if (paneItem.type !== 'empty' && !paneItem.isMissing) {
                     // Use a simplified version of a playlist item for the pane content
                    const fullPaneItem = { ...paneItem, muted: true };
                    
                    const mediaResult = await createMediaElement(fullPaneItem, () => {}); // Dummy playNext
                    if (mediaResult && mediaResult.element) {
                        const mediaEl = mediaResult.element;
                         // The .mosaic-pane > * CSS will style this element
                        if(mediaEl.tagName === 'VIDEO') {
                            mediaEl.loop = true;
                            mediaEl.muted = true;
                        }
                        paneEl.appendChild(mediaEl);
                    }
                }
                el.appendChild(paneEl);
            });

            await Promise.all(panePromises);
            break;
        case 'pdf':
            if (!item.file) {
                console.warn(`PDF item "${item.name}" has no file. Skipping.`);
                return null;
            }
            el = document.createElement('canvas');
            try {
                const pdf = await pdfjsLib.getDocument(URL.createObjectURL(item.file)).promise;
                const page = await pdf.getPage(1);
                // Render at a high resolution for better quality when scaled down by CSS.
                const desiredWidth = 1920;
                const viewportAtScale1 = page.getViewport({ scale: 1 });
                const scale = desiredWidth / viewportAtScale1.width;
                const viewport = page.getViewport({ scale: scale });

                el.width = viewport.width;
                el.height = viewport.height;
                const context = el.getContext('2d');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
            } catch (error) {
                console.error('Error rendering PDF:', error);
                el = document.createElement('div');
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.color = 'white';
                el.style.padding = '2rem';
                el.style.backgroundColor = 'rgba(0,0,0,0.7)';
                el.textContent = `Erro ao carregar PDF: ${item.name}. Detalhes: ${error.message}`;
            }
            break;
        case 'youtube':
            const videoId = getYouTubeID(item.url);
            if (videoId) {
                el = document.createElement('div');
                el.id = 'yt-player-' + Date.now();
                isAsync = true;
            }
            break;
        case 'text':
             el = document.createElement('div');
             el.style.display = 'flex';
             el.style.alignItems = 'center';
             el.style.justifyContent = 'center';
             el.style.textAlign = 'center';
             el.style.color = item.color;
             el.style.fontSize = item.fontSize;
             el.style.padding = '5vw';
             animateText(el, item.textAnimation, item.text);
             break;
        case 'weather':
            if (!item.location) {
                console.warn(`Weather item "${item.name}" has no location. Skipping.`);
                return null;
            }
            isAsync = true;
            return new Promise(async resolve => {
                const el = document.createElement('div');
                el.className = 'weather-forecast-container';
                el.innerHTML = '<p>Carregando previsão do tempo...</p>';

                try {
                    // 1. Geocode
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(item.location)}&count=1&language=pt&format=json`);
                    const geoData = await geoResponse.json();
                    if (!geoData.results || geoData.results.length === 0) throw new Error(`Cidade não encontrada: ${item.location}`);
                    const { latitude, longitude, name } = geoData.results[0];

                    // 2. Fetch forecast
                    const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`);
                    const forecastData = await forecastResponse.json();
                    
                    const daysData = forecastData.daily.time.map((time, index) => ({
                        time: new Date(time),
                        weatherCode: forecastData.daily.weather_code[index],
                        maxTemp: Math.round(forecastData.daily.temperature_2m_max[index]),
                        minTemp: Math.round(forecastData.daily.temperature_2m_min[index]),
                    }));
                    
                    const tempUnit = forecastData.daily_units.temperature_2m_max;

                    let daysHTML = '';
                    daysData.forEach(day => {
                        daysHTML += `
                            <div class="weather-forecast-day">
                                <h4>${day.time.toLocaleDateString('pt-BR', { weekday: 'short' })}</h4>
                                <div class="forecast-icon">${getWeatherEmoji(day.weatherCode)}</div>
                                <div class="forecast-temps">
                                    <span class="high">${day.maxTemp}${tempUnit}</span> / <span class="low">${day.minTemp}${tempUnit}</span>
                                </div>
                            </div>
                        `;
                    });

                    el.innerHTML = `
                        <div class="weather-forecast-header">
                            <h2>${name}</h2>
                            <p>Previsão para os próximos 5 dias</p>
                        </div>
                        <div class="weather-forecast-days">
                            ${daysHTML}
                        </div>
                    `;
                    
                } catch (error) {
                    console.error("Failed to render weather forecast item:", error);
                    el.innerHTML = `<p>Erro ao carregar previsão do tempo para "${item.location}".</p>`;
                }

                resolve({ element: el, isAsync: false });
            });
    }

    return { element: el, isAsync };
}

export function createYouTubePlayer(element, item, playNext) {
    const videoId = getYouTubeID(item.url);
    ytPlayer = new YT.Player(element.id, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { 'autoplay': 1, 'controls': 0, 'showinfo': 0, 'rel': 0, 'iv_load_policy': 3, 'mute': (item.muted ?? true) ? 1 : 0 },
        events: {
            'onReady': (event) => event.target.playVideo(),
            'onStateChange': (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                    progressInterval = setInterval(() => {
                        if (ytPlayer && typeof ytPlayer.getDuration === 'function') {
                            const currentTime = ytPlayer.getCurrentTime();
                            const duration = ytPlayer.getDuration();
                            if (duration > 0) {
                                const progressBar = document.getElementById('progress-bar');
                                progressBar.style.width = `${(currentTime / duration) * 100}%`;
                            }
                        }
                    }, 250);
                }
                if (event.data === YT.PlayerState.ENDED) {
                    playNext();
                }
            }
        }
    });
    return ytPlayer;
}

export function stopYouTubePlayer() {
    if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
        ytPlayer.stopVideo();
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    ytPlayer = null;
}

export function getYouTubePlayer() {
    return ytPlayer;
}