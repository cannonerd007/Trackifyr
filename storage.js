

export const STORAGE_KEYS = {
    PROJECTS: 'projectTracker_projects',
    ACTIVE_PROJECT_ID: 'projectTracker_activeProjectId',
    THEME: 'projectTracker_theme'
};

const DB_NAME = 'ProjectTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracker_store';

/**
 * @returns {Promise<IDBDatabase>}
 */
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject(event.target.error);
        };
    });
};