import { loadData, saveData, STORAGE_KEYS } from './storage.js';

const DEFAULT_PROJECTS = [{
    id: 'p-1',
    name: 'Initial Setup Project',
    milestones: [{
        id: 'm-1',
        name: 'Phase I: Core Functionality',
        tasks: [{
            id: 't-1',
            name: 'Define Data Structures',
            description: 'Establish JSON schemas for projects, milestones, and tasks.',
            status: 'complete',
            dependencyId: null
        }, {
            id: 't-2',
            name: 'Implement IndexedDB API', 
            description: 'Create storage.js to handle persistence using IndexedDB.',
            status: 'pending',
            dependencyId: 't-1'
        }, {
            id: 't-3',
            name: 'Set up ES6 Modules',
            description: 'Configure all scripts for modular import/export.',
            status: 'pending',
            dependencyId: 't-2'
        }]
    }, {
        id: 'm-2',
        name: 'Phase II: UI/UX',
        tasks: [{
            id: 't-4',
            name: 'Implement Theme Toggle',
            description: 'Make dark/light mode functional.',
            status: 'pending',
            dependencyId: null
        }]
    }]
}];

let projects = []; 
let activeProjectId = null;
let activeMilestoneId = null;

const generateId = (prefix) => {
    return `${prefix}-${Date.now()}`;
};