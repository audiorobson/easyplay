import { Modal } from 'bootstrap';

let bsInstructionsModal, bsInputModal, bsNotificationModal, bsConfirmationModal, bsPlaylistManagementModal, bsGlobalSettingsModal, bsMissingFilesModal;

// DOM Element getters
const instructionsModalEl = () => document.getElementById('instructions-modal');
const inputModalEl = () => document.getElementById('input-modal');
const inputModalTitle = () => document.getElementById('input-modal-title');
const inputModalBody = () => document.getElementById('input-modal-body');
const inputModalSaveBtn = () => document.getElementById('input-modal-save-btn');

const notificationModalEl = () => document.getElementById('notification-modal');
const notificationModalTitle = () => document.getElementById('notification-modal-title');
const notificationModalBody = () => document.getElementById('notification-modal-body');

const confirmationModalEl = () => document.getElementById('confirmation-modal');
const confirmationModalTitle = () => document.getElementById('confirmation-modal-title');
const confirmationModalBody = () => document.getElementById('confirmation-modal-body');
const confirmationModalConfirmBtn = () => document.getElementById('confirmation-modal-confirm-btn');

const playlistManagementModalEl = () => document.getElementById('playlist-management-modal');
const globalSettingsModalEl = () => document.getElementById('global-settings-modal');
const missingFilesModalEl = () => document.getElementById('missing-files-modal');

export function showNotification(title, message, type = 'info') {
    notificationModalTitle().textContent = title;
    notificationModalBody().textContent = message;
    const modalContent = notificationModalEl().querySelector('.modal-content');
    modalContent.className = `modal-content notification-${type}`;
    bsNotificationModal.show();
}

export function showConfirmation(title, message, onConfirm) {
    confirmationModalTitle().textContent = title;
    confirmationModalBody().textContent = message;
    confirmationModalConfirmBtn().onclick = () => {
        onConfirm();
        bsConfirmationModal.hide();
    };
    bsConfirmationModal.show();
}

export function openInputModal({ title, body, onSave }) {
    inputModalTitle().textContent = title;
    inputModalBody().innerHTML = body;
    inputModalSaveBtn().onclick = () => {
        if (onSave()) {
            bsInputModal.hide();
        }
    };
    bsInputModal.show();
}

export function showInstructionsModal() {
    bsInstructionsModal.show();
}

export function showPlaylistManagementModal() {
    bsPlaylistManagementModal.show();
}

export function hidePlaylistManagementModal() {
    bsPlaylistManagementModal.hide();
}

export function showGlobalSettingsModal() {
    bsGlobalSettingsModal.show();
}

export function hideGlobalSettingsModal() {
    bsGlobalSettingsModal.hide();
}

export function showMissingFilesModal() {
    bsMissingFilesModal.show();
}

export function hideMissingFilesModal() {
    bsMissingFilesModal.hide();
}

export function init() {
    bsInstructionsModal = new Modal(instructionsModalEl());
    bsInputModal = new Modal(inputModalEl());
    bsNotificationModal = new Modal(notificationModalEl());
    bsConfirmationModal = new Modal(confirmationModalEl());
    bsPlaylistManagementModal = new Modal(playlistManagementModalEl());
    bsGlobalSettingsModal = new Modal(globalSettingsModalEl());
    bsMissingFilesModal = new Modal(missingFilesModalEl());
}