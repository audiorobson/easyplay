import { showNotification } from './modals.js';

const SETTINGS_KEY = 'easyplay-global-settings';

const clockEl = () => document.getElementById('corner-clock');
const weatherEl = () => document.getElementById('weather-display');
const rssWrapperEl = () => document.getElementById('rss-ticker-wrapper');
const rssContentEl = () => document.getElementById('rss-ticker-content');

let settings = {};
let clockInterval = null;
let weatherInterval = null;
let rssFetchInterval = null;

const defaultSettings = {
    clock: { 
        enabled: false, 
        position: 'top-right', 
        format: '24h', 
        size: '2.5vw', 
        color: '#FFFFFF' 
    },
    weather: { 
        enabled: false, 
        location: '', 
        units: 'celsius', 
        position: 'top-left' 
    },
    rss: { 
        enabled: false, 
        url: '', 
        position: 'bottom', 
        bgColor: 'rgba(0, 0, 0, 0.6)',
        textColor: '#FFFFFF',
        speed: 100 // pixels per second
    },
    logo: {
        position: 'top-right'
    }
};

// --- Weather ---
async function fetchWeather() {
    if (!settings.weather.enabled || !settings.weather.location) {
        weatherEl().innerHTML = '';
        return;
    }
    try {
        // 1. Geocode location to get lat/lon
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(settings.weather.location)}&count=1&language=pt&format=json`);
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            weatherEl().innerHTML = `Cidade não encontrada`;
            console.warn(`Weather location not found: ${settings.weather.location}`);
            return;
        }
        const { latitude, longitude, name } = geoData.results[0];

        // 2. Fetch weather
        const unitsParam = settings.weather.units === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1${unitsParam}`);
        const weatherData = await weatherResponse.json();
        
        // 3. Display it
        const temp = Math.round(weatherData.current.temperature_2m);
        const tempUnit = weatherData.current_units.temperature_2m;
        const weatherCode = weatherData.current.weather_code;
        const icon = getWeatherEmoji(weatherCode);

        weatherEl().innerHTML = `<span class="weather-icon">${icon}</span> <span>${temp}${tempUnit}</span>`;

    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        weatherEl().innerHTML = 'Erro no tempo';
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


// --- RSS Feed ---
async function fetchAndDisplayRss() {
    if (!settings.rss.enabled || !settings.rss.url) {
        rssContentEl().innerHTML = '';
        return;
    }
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(settings.rss.url)}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const str = await response.text();
        const data = new window.DOMParser().parseFromString(str, "text/xml");
        const items = data.querySelectorAll("item");
        let html = '';
        items.forEach(el => {
            const title = el.querySelector("title")?.textContent;
            if (title) {
                html += `${title.trim()} • `;
            }
        });
        rssContentEl().innerHTML = html;
        
        // Adjust animation speed based on content length
        const contentWidth = rssContentEl().offsetWidth;
        const scrollSpeed = settings.rss.speed || 100; // pixels per second
        const duration = contentWidth / scrollSpeed;
        rssContentEl().style.animationDuration = `${duration}s`;

    } catch (error) {
        console.error('Error fetching or parsing RSS feed:', error);
        rssContentEl().innerHTML = `Erro ao carregar feed RSS. • `;
    }
}

// --- Clock ---
function updateClock() {
    if (!settings.clock.enabled) return;
    const now = new Date();
    const options = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    let timeString = '';
    
    switch (settings.clock.format) {
        case '24h':
            timeString = now.toLocaleTimeString('pt-BR', { ...options, hour: '2-digit', minute: '2-digit', hour12: false });
            break;
        case '24h-seconds':
            timeString = now.toLocaleTimeString('pt-BR', { ...options, hour12: false });
            break;
        case '12h':
            timeString = now.toLocaleTimeString('pt-BR', { ...options, hour: '2-digit', minute: '2-digit', hour12: true });
            break;
        case '12h-seconds':
            timeString = now.toLocaleTimeString('pt-BR', { ...options, hour12: true });
            break;
        case 'date-short':
            timeString = now.toLocaleDateString('pt-BR', { ...options });
            break;
        case 'date-long':
             timeString = now.toLocaleDateString('pt-BR', { ...options, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
             break;
        default:
            timeString = now.toLocaleTimeString('pt-BR', { ...options, hour: '2-digit', minute: '2-digit' });
    }
    clockEl().textContent = timeString;
}


// --- Main Functions ---

export function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    // Deep merge to handle nested objects
    const savedSettings = saved ? JSON.parse(saved) : {};
    settings = {
        ...defaultSettings,
        ...savedSettings,
        clock: { ...defaultSettings.clock, ...savedSettings.clock },
        weather: { ...defaultSettings.weather, ...savedSettings.weather },
        rss: { ...defaultSettings.rss, ...savedSettings.rss },
        logo: { ...defaultSettings.logo, ...savedSettings.logo },
    };
    return settings;
}

export function saveSettings(newSettings) {
    settings = newSettings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettings();
    showNotification('Configurações Salvas', 'Suas configurações globais foram atualizadas.', 'success');
}

function applyOverlayPosition(element, position, margin = '20px') {
    element.style.top = 'auto';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.left = 'auto';
    element.style.transform = '';

    switch (position) {
        case 'top-left':
            element.style.top = margin;
            element.style.left = margin;
            break;
        case 'top-right':
            element.style.top = margin;
            element.style.right = margin;
            break;
        case 'bottom-left':
            element.style.bottom = margin;
            element.style.left = margin;
            break;
        case 'bottom-right':
            element.style.bottom = margin;
            element.style.right = margin;
            break;
    }
}

export function applySettings(editorIsOpen = false) {
    // Clock
    const clockElement = clockEl();
    if (settings.clock.enabled && !editorIsOpen) {
        clockElement.classList.add('visible');
        clockElement.style.fontSize = settings.clock.size || defaultSettings.clock.size;
        clockElement.style.color = settings.clock.color || defaultSettings.clock.color;
        applyOverlayPosition(clockElement, settings.clock.position || defaultSettings.clock.position);
        if (!clockInterval) {
            updateClock();
            clockInterval = setInterval(updateClock, 1000);
        }
    } else {
        clockElement.classList.remove('visible');
        if (clockInterval) {
            clearInterval(clockInterval);
            clockInterval = null;
        }
    }

    // Weather
    const weatherElement = weatherEl();
    if (settings.weather.enabled && !editorIsOpen) {
        weatherElement.classList.add('visible');
        // Weather font size is derived from clock size for consistency
        const clockSize = parseFloat(settings.clock.size) || 2.5;
        weatherElement.style.fontSize = `${clockSize * 0.7}vw`;
        applyOverlayPosition(weatherElement, settings.weather.position || defaultSettings.weather.position);
        if (!weatherInterval) {
            fetchWeather();
            weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000); // Update every 30 mins
        }
    } else {
        weatherElement.classList.remove('visible');
        if (weatherInterval) {
            clearInterval(weatherInterval);
            weatherInterval = null;
        }
    }

    // RSS
    const rssElement = rssWrapperEl();
    if (settings.rss.enabled && !editorIsOpen) {
        rssElement.classList.add('visible');
        rssElement.style.backgroundColor = settings.rss.bgColor || defaultSettings.rss.bgColor;
        rssElement.style.color = settings.rss.textColor || defaultSettings.rss.textColor;
        if (settings.rss.position === 'top') {
            rssElement.style.top = '0';
            rssElement.style.bottom = 'auto';
        } else {
            rssElement.style.bottom = '0';
            rssElement.style.top = 'auto';
        }

        if (!rssFetchInterval) {
            fetchAndDisplayRss();
            rssFetchInterval = setInterval(fetchAndDisplayRss, 15 * 60 * 1000); // Refetch every 15 mins
        }
    } else {
        rssElement.classList.remove('visible');
        if (rssFetchInterval) {
            clearInterval(rssFetchInterval);
            rssFetchInterval = null;
        }
    }
}


export function init() {
    loadSettings();
    applySettings();
}