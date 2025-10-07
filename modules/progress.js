import anime from 'animejs';

const progressBar = document.getElementById('progress-bar');
let progressInterval = null;

export function resetProgressBar() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = null;
    anime.remove(progressBar);
    progressBar.style.width = '0%';
}

export function showProgressBar() {
    progressBar.style.display = 'block';
}

export function hideProgressBar() {
    progressBar.style.display = 'none';
}

export function animateProgressBar(duration) {
    anime({
        targets: progressBar,
        width: '100%',
        duration: duration * 1000,
        easing: 'linear'
    });
}

