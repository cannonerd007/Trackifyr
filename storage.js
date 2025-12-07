

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

/**
 * @param {string} key 
 * @param {any} data
 * @returns {Promise<void>}
 */
export const saveData = async (key, data) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
    
        const request = store.put({ key: key, value: data });

        await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });


        return tx.done;
    } catch (error) {
        console.error(`Error saving data for key ${key} to IndexedDB:`, error);
    }
};