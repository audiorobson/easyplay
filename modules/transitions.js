import anime from 'animejs';

export async function transitionOut(element) {
    if (!element) return;
    await anime({ targets: element, opacity: 0, duration: 500, easing: 'easeOutExpo' }).finished;
    element.remove();
}

export async function transitionIn(element, transitionType, duration = 800) {
    let animation = { targets: element, duration: duration, easing: 'easeOutExpo' };
    switch (transitionType) {
        case 'slideInLeft':
            Object.assign(animation, { translateX: ['-100%', '0%'], opacity: [1, 1] });
            break;
        case 'slideInRight':
            Object.assign(animation, { translateX: ['100%', '0%'], opacity: [1, 1] });
            break;
        case 'slideInTop':
            Object.assign(animation, { translateY: ['-100%', '0%'], opacity: [1, 1] });
            break;
        case 'slideInBottom':
            Object.assign(animation, { translateY: ['100%', '0%'], opacity: [1, 1] });
            break;
        case 'zoomIn':
             Object.assign(animation, { scale: [0.8, 1], opacity: [0, 1] });
            break;
        case 'zoomOut':
             Object.assign(animation, { scale: [1.2, 1], opacity: [0, 1] });
            break;
        case 'rotateIn':
             Object.assign(animation, { rotate: ['-180deg', '0deg'], opacity: [0, 1] });
            break;
        case 'flipIn':
             Object.assign(animation, { rotateY: ['-180deg', '0deg'], opacity: [0, 1] });
            break;
        case 'bounceIn':
             Object.assign(animation, { scale: [0.3, 1.05, 0.9, 1], opacity: [0, 1] });
            break;
        case 'spiralIn':
            Object.assign(animation, { scale: [0.1, 1], rotate: ['-360deg', '0deg'], opacity: [0, 1] });
            break;
        case 'expandIn':
            Object.assign(animation, { scaleX: [0, 1], scaleY: [0, 1], opacity: [0, 1] });
            break;
        case 'swingIn':
            Object.assign(animation, { rotate: ['-15deg', '10deg', '-5deg', '0deg'], opacity: [0, 1] });
            break;
        case 'rollIn':
            Object.assign(animation, { translateX: ['-100%', '0%'], rotate: ['-120deg', '0deg'], opacity: [0, 1] });
            break;
        case 'lightSpeedIn':
            Object.assign(animation, { translateX: ['100%', '0%'], skewX: ['-30deg', '0deg'], opacity: [0, 1], duration: duration * 0.6 });
            break;
        case 'rubberBand':
            Object.assign(animation, { scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1], scaleY: [1, 0.75, 1.25, 0.85, 1.05, 1], opacity: [0, 1] });
            break;
        case 'jello':
            Object.assign(animation, { skewX: ['0deg', '-12.5deg', '6.25deg', '-3.125deg', '1.5625deg', '0deg'], skewY: ['0deg', '-12.5deg', '6.25deg', '-3.125deg', '1.5625deg', '0deg'], opacity: [0, 1] });
            break;
        case 'heartBeat':
            Object.assign(animation, { scale: [1, 1.3, 1, 1.3, 1], opacity: [0, 1] });
            break;
        case 'fadeIn':
        default:
            Object.assign(animation, { opacity: [0, 1] });
            break;
    }
    const viewer = document.getElementById('viewer');
    viewer.appendChild(element);
    await anime(animation).finished;
}