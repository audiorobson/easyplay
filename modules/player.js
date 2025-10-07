import * as playlist from './playlist.js';
import { transitionOut, transitionIn } from './transitions.js';
import { createMediaElement, applyItemStyles, getYouTubeID, createYouTubePlayer, stopYouTubePlayer, getYouTubePlayer } from './renderers.js';
import { resetProgressBar, showProgressBar, hideProgressBar, animateProgressBar } from './progress.js';
import anime from 'animejs';

const viewer = document.getElementById('viewer');
let currentItemIndex = -1;
let currentElements = [];
let timeoutId = null;
let playing = false;
let editorToggleCallback;

// --- YouTube Player Logic ---
function initYouTubeAPI() {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube API Ready");
    };
}

// --- Media Renderers ---
async function renderItem(item) {
    await Promise.all(currentElements.map(el => {
        if (el.speechRecognition) { // Stop speech recognition before transitioning out
            el.speechRecognition.stop();
        }
        if (el.refreshInterval) {
            clearInterval(el.refreshInterval);
        }
        if (el.scrollRaf) {
            cancelAnimationFrame(el.scrollRaf);
        }
        return transitionOut(el);
    }));
    resetProgressBar();
    currentElements = [];

    if (!item) {
        console.log("Render item was null, stopping.");
        stop();
        return;
    }

    if (item.isMissing) {
        console.warn(`Skipping missing item: ${item.name}`);
        playNext();
        return;
    }

    const result = await createMediaElement(item, playNext);
    if (!result) {
        playNext();
        return;
    }

    const { element: el, isAsync } = result;

    if (el) {
        if (item.type === 'image' && item.displayMode === 'pan') {
            const img = el;
            img.style.position = 'absolute';
            const viewerAspect = viewer.clientWidth / viewer.clientHeight;
            const imgAspect = img.naturalWidth / img.naturalHeight;
            let panX = imgAspect > viewerAspect;

            if (panX) { // Pan horizontally
                img.style.height = '100%';
                img.style.width = 'auto';
                img.style.maxWidth = 'none';
            } else { // Pan vertically
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxHeight = 'none';
            }

            // Let the browser render the image to calculate its new dimensions
            setTimeout(() => {
                const panDistance = panX ? (img.scrollWidth - viewer.clientWidth) : (img.scrollHeight - viewer.clientHeight);
                if (panDistance > 0) {
                    anime({
                        targets: img,
                        [panX ? 'translateX' : 'translateY']: [0, -panDistance],
                        duration: item.duration * 1000,
                        easing: 'linear',
                        direction: 'alternate' // Pan back and forth
                    });
                }
            }, 100);
        } else {
            el.className = `display-${item.displayMode}`;
        }

        applyItemStyles(el, item);
        currentElements.push(el);
        await transitionIn(el, item.transition, item.transitionDuration || 800);
        
        if (item.caption && (item.type === 'image' || item.type === 'video')) {
            const captionEl = document.createElement('div');
            captionEl.className = 'caption-overlay';
            captionEl.textContent = item.caption;
            if (item.captionFontSize) {
                captionEl.style.fontSize = item.captionFontSize;
            }
            if (item.captionFontColor) {
                captionEl.style.color = item.captionFontColor;
            }
            currentElements.push(captionEl);
            await transitionIn(captionEl, 'fadeIn', 500); // Simple fade for caption
        }

        if ((item.type === 'web' || item.type === 'html')) {
             el.onload = () => {
                try {
                    if(el.scrollRaf) cancelAnimationFrame(el.scrollRaf); // Clear old one before starting new

                    if (!item.autoScroll || !el.contentWindow?.document?.body) return;

                    // Delay to let complex pages render before checking height
                    setTimeout(() => {
                        const doc = el.contentWindow.document;
                        if (!doc?.body || Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) <= el.contentWindow.innerHeight) {
                            return; // No scroll needed or possible
                        }

                        let scrollDirection = 1;
                        let lastTime = 0;
                        const scrollSpeed = item.scrollSpeed || 30; // px/s
                        let paused = false;
                        const pauseDuration = 2000; // ms

                        const scrollLoop = (timestamp) => {
                            if (!el.contentWindow?.document?.body) { // Iframe might have been removed
                                if(el.scrollRaf) cancelAnimationFrame(el.scrollRaf);
                                return;
                            }

                            if (lastTime === 0) lastTime = timestamp;
                            
                            if (!paused) {
                                const deltaTime = timestamp - lastTime;
                                const pixelsToScroll = (scrollSpeed / 1000) * deltaTime * scrollDirection;
                                el.contentWindow.scrollBy(0, pixelsToScroll);
                            }
                            lastTime = timestamp;

                            const scrollableHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
                            const visibleHeight = el.contentWindow.innerHeight;
                            const currentScroll = el.contentWindow.scrollY;

                            const atBottom = scrollDirection === 1 && (visibleHeight + currentScroll >= scrollableHeight);
                            const atTop = scrollDirection === -1 && currentScroll <= 0;

                            if (atBottom || atTop) {
                                // Clamp position
                                if (atBottom) el.contentWindow.scrollTo(0, scrollableHeight - visibleHeight);
                                if (atTop) el.contentWindow.scrollTo(0, 0);

                                scrollDirection *= -1; // Reverse direction
                                paused = true;
                                setTimeout(() => { paused = false; }, pauseDuration);
                            }
                            
                            el.scrollRaf = requestAnimationFrame(scrollLoop);
                        };
                        el.scrollRaf = requestAnimationFrame(scrollLoop);

                    }, 500);
                } catch (e) {
                    console.warn("Could not enable auto-scroll due to cross-origin restrictions.", e);
                }
            };
            
            if (item.refreshInterval > 0) {
                el.refreshInterval = setInterval(() => {
                    if(el) el.src = el.src; // Reloads the iframe, which will trigger onload again
                }, item.refreshInterval * 1000);
            }
        }
        
        // Post-transition logic, now that element is in the DOM
        if (item.type === 'youtube' && getYouTubeID(item.url)) {
            createYouTubePlayer(el, item, playNext);
        } else if (!isAsync) {
            const duration = Number(item.duration);
            if (duration > 0) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(playNext, duration * 1000);
                animateProgressBar(duration);
            } else {
                 console.log("Item has no duration, playback paused.");
            }
        }
    } else {
        console.warn(`Could not create element for item type: ${item.type}. Skipping.`);
        playNext();
    }
}

// --- Playback Control ---
function playNext() {
    clearTimeout(timeoutId);
    const pl = playlist.getPlaylist();
    if (pl.length === 0) {
        stop();
        return;
    }
    currentItemIndex = (currentItemIndex + 1) % pl.length;
    const nextItem = playlist.getItem(currentItemIndex);
    renderItem(nextItem);
}

export function play() {
    const pl = playlist.getPlaylist();
    if (pl.length > 0) {
        playing = true;
        showProgressBar();
        editorToggleCallback(false); // Hide editor
        currentItemIndex = -1;
        playNext();
    } else {
        alert("A playlist está vazia. Adicione alguma mídia primeiro.");
    }
}

export function stop() {
    playing = false;
    clearTimeout(timeoutId);
    resetProgressBar();
    hideProgressBar();
    currentItemIndex = -1;
    stopYouTubePlayer();
    // Clear intervals and stop animations
    currentElements.forEach(el => {
        if (el.clockInterval) clearInterval(el.clockInterval);
        if (el.scrollRaf) cancelAnimationFrame(el.scrollRaf);
        if (el.speechRecognition) el.speechRecognition.stop();
        if (el.refreshInterval) clearInterval(el.refreshInterval);
        anime.remove(el); // Stop any ongoing animations like pan
    });

    Promise.all(currentElements.map(el => transitionOut(el))).then(() => {
        currentElements = [];
        viewer.innerHTML = '<div id="progress-bar"></div><div id="watermark-container"></div>'; // Keep essentials
        const logo = localStorage.getItem('easyplay-logo');
        if (logo) {
            document.getElementById('watermark-container').innerHTML = `<img src="${logo}" alt="logo">`;
        }
    });
    editorToggleCallback(true); // Show editor
}

export function isPlaying() {
    return playing;
}

export function init(editorCb) {
    editorToggleCallback = editorCb;
    initYouTubeAPI();
}