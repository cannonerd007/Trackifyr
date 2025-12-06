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


const saveProjectsAndActiveIds = async () => {
    await saveData(STORAGE_KEYS.PROJECTS, projects);
    await saveData(STORAGE_KEYS.ACTIVE_PROJECT_ID, activeProjectId); 
};


export const initializeData = async () => {
    
            const loadedProjects = await loadData(STORAGE_KEYS.PROJECTS);

           
            if (loadedProjects !== null) {
            projects = loadedProjects;
            } else {
          
            projects = DEFAULT_PROJECTS;
            await saveData(STORAGE_KEYS.PROJECTS, projects);
            }

    activeProjectId = await loadData(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    if (activeProjectId && !projects.some(p => p.id === activeProjectId)) {
        activeProjectId = null; 
    }
    
    
    if (!activeProjectId && projects.length > 0) {
        activeProjectId = projects[0].id;
    }

    const activeProject = getActiveProject();
    activeMilestoneId = activeProject?.milestones[0]?.id || null;
};


export const getProjects = () => projects;

export const getActiveProject = () => projects.find(p => p.id === activeProjectId) || null;

export const getMilestones = () => getActiveProject()?.milestones || [];

export const getActiveMilestone = () => getMilestones().find(m => m.id === activeMilestoneId) || null;

export const getTasksForMilestone = (milestoneId) => {
    const milestone = getMilestones().find(m => m.id === milestoneId);
    return milestone ? milestone.tasks : [];
};


const findProject = (projectId) => projects.find(p => p.id === projectId);


const findMilestone = (milestoneId) => {
    for (const project of projects) {
        const milestone = project.milestones.find(m => m.id === milestoneId);
        if (milestone) return { milestone, project };
    }
    return null;
};

const findTask = (taskId) => {
    for (const project of projects) {
        for (const milestone of project.milestones) {
            const task = milestone.tasks.find(t => t.id === taskId);
            if (task) return { task, milestone, project };
        }
    }
    return null;
};

export const getTaskDetails = (taskId) => findTask(taskId)?.task;

export const getMilestoneDetails = (milestoneId) => findMilestone(milestoneId)?.milestone;

export const getProjectDetails = (projectId) => findProject(projectId);

export const isTaskLocked = (taskId) => {
    const { task } = findTask(taskId) || {};
    if (!task || !task.dependencyId) return false;

    const dependencyTaskResult = findTask(task.dependencyId);
    if (!dependencyTaskResult) return false;

    return dependencyTaskResult.task.status !== 'complete';
};

export const isTaskDependent = (taskId) => {
    for (const project of projects) {
        for (const milestone of project.milestones) {
            if (milestone.tasks.some(t => t.dependencyId === taskId)) {
                return true;
            }
        }
    }
    return false;
};

export const getTaskDependencyChain = (taskId) => {
    const chain = [];
    let currentTask = findTask(taskId)?.task;

    if (!currentTask) return [];

    chain.push({ id: currentTask.id, name: currentTask.name, status: currentTask.status, isCurrent: true });

    let dependencyId = currentTask.dependencyId;

    while (dependencyId) {
        const depResult = findTask(dependencyId);
        if (!depResult) break; 
        
        const depTask = depResult.task;
        chain.unshift({ id: depTask.id, name: depTask.name, status: depTask.status, isCurrent: false });
        
        dependencyId = depTask.dependencyId;
        
        
        if (chain.some((t, i) => i !== 0 && t.id === dependencyId)) {
            console.warn("Circular dependency detected!");
            break;
        }
    }
    return chain;
};

export const checkForCircularDependency = (taskId, newDependencyId) => {
    if (!newDependencyId) return false;

    let currentDepId = newDependencyId;

    while (currentDepId) {

        if (currentDepId === taskId) {
            return true;
        }

        const task = getTaskDetails(currentDepId);
        
        currentDepId = task?.dependencyId;
    }

    return false;
};


const isProjectNameUnique = (name, currentProjectId = null) => {
    return !projects.some(p => p.name === name && p.id !== currentProjectId);
};

const isMilestoneNameUnique = (projectId, name, currentMilestoneId = null) => {
    const project = findProject(projectId);
    if (!project) return true;
    return !project.milestones.some(m => m.name === name && m.id !== currentMilestoneId);
};

const isTaskNameUnique = (milestoneId, name, currentTaskId = null) => {
    const milestoneResult = findMilestone(milestoneId);
    const milestone = milestoneResult?.milestone;
    if (!milestone) return true;
    return !milestone.tasks.some(t => t.name === name && t.id !== currentTaskId);
};


export const setActiveProject = async (projectId) => {
    activeProjectId = projectId;
    const project = getActiveProject();
    if (project && project.milestones.length > 0) {
        activeMilestoneId = project.milestones[0].id;
    } else {
        activeMilestoneId = null;
    }
    await saveData(STORAGE_KEYS.ACTIVE_PROJECT_ID, activeProjectId); 
};

export const setActiveMilestone = (milestoneId) => {
    activeMilestoneId = milestoneId;
};


export const toggleTaskStatus = async (taskId) => {
    const taskResult = findTask(taskId);
    if (!taskResult) return;

    const { task } = taskResult;

    if (task.status === 'complete') {
        return 'alreadyComplete';
    }

    const dependencyLocked = isTaskLocked(taskId);
    if (dependencyLocked) {
        return 'locked'; 
    }

    task.status = 'complete';
    
    await saveProjectsAndActiveIds();
    return task.status;
};


export const addTask = async (milestoneId, task) => {
    if (!isTaskNameUnique(milestoneId, task.name)) {
        throw new Error(`Task name "${task.name}" already exists in this milestone.`);
    }

    const milestoneResult = findMilestone(milestoneId);
    if (milestoneResult) {
        milestoneResult.milestone.tasks.push({ ...task, id: generateId('t') });
        await saveProjectsAndActiveIds();
    }
};

export const updateTask = async (taskId, updatedTask) => {
    const taskResult = findTask(taskId);
    if (taskResult) {
        const { milestone, task } = taskResult;

        
        if (updatedTask.name && updatedTask.name !== task.name && !isTaskNameUnique(milestone.id, updatedTask.name, taskId)) {
            throw new Error(`Task name "${updatedTask.name}" already exists in this milestone.`);
        }
        
        const newDependencyId = updatedTask.dependencyId;

       
        if (newDependencyId && newDependencyId === taskId) {
            throw new Error("A task cannot depend on itself.");
        }
        
        if (newDependencyId && checkForCircularDependency(taskId, newDependencyId)) {
            throw new Error("Circular dependency detected. The selected dependency already relies on this task.");
        }
        
       
        if (updatedTask.status === 'complete' && isTaskLocked(taskId)) {
            throw new Error("Task cannot be marked complete while its dependency is pending.");
        }

        Object.assign(task, updatedTask);
        await saveProjectsAndActiveIds();
    }
};

export const deleteTask = async (taskId) => {
    const taskResult = findTask(taskId);
    if (taskResult) {
        const { milestone } = taskResult;
        milestone.tasks = milestone.tasks.filter(t => t.id !== taskId);
        
        for (const project of projects) {
            for (const m of project.milestones) {
                m.tasks.forEach(t => {
                    if (t.dependencyId === taskId) {
                        t.dependencyId = null;
                    }
                });
            }
        }

        await saveProjectsAndActiveIds();
    }
};


export const addProject = async (project) => {
    if (!isProjectNameUnique(project.name)) {
        throw new Error(`Project name "${project.name}" already exists.`);
    }

    projects.push({ ...project, id: generateId('p'), milestones: [] });
    await saveProjectsAndActiveIds();
};

export const updateProject = async (projectId, updatedProject) => {
    const project = findProject(projectId);
    if (project) {
        if (updatedProject.name && updatedProject.name !== project.name && !isProjectNameUnique(updatedProject.name, projectId)) {
            throw new Error(`Project name "${updatedProject.name}" already exists.`);
        }
        
        Object.assign(project, updatedProject);
        await saveProjectsAndActiveIds();
    }
};

export const deleteProject = async (projectId) => {
    
    projects = projects.filter(p => p.id !== projectId);
    
    if (activeProjectId === projectId) {
        activeProjectId = projects.length > 0 ? projects[0].id : null;
        activeMilestoneId = projects[0]?.milestones[0]?.id || null;
    }
    
    
    await saveProjectsAndActiveIds();
};



export const addMilestone = async (projectId, milestone) => {
    if (!isMilestoneNameUnique(projectId, milestone.name)) {
        throw new Error(`Milestone name "${milestone.name}" already exists in this project.`);
    }

    const project = findProject(projectId);
    if (project) {
        project.milestones.push({ ...milestone, id: generateId('m'), tasks: [] });
        await saveProjectsAndActiveIds();
    }
};

export const updateMilestone = async (milestoneId, updatedMilestone) => {
    const milestoneResult = findMilestone(milestoneId);
    if (milestoneResult) {
        const { project, milestone } = milestoneResult;

        if (updatedMilestone.name && updatedMilestone.name !== milestone.name && !isMilestoneNameUnique(project.id, updatedMilestone.name, milestoneId)) {
            throw new Error(`Milestone name "${updatedMilestone.name}" already exists in this project.`);
        }

        Object.assign(milestoneResult.milestone, updatedMilestone);
        await saveProjectsAndActiveIds();
    }
};

export const deleteMilestone = async (milestoneId) => {
    const milestoneResult = findMilestone(milestoneId);
    if (milestoneResult) {
        const { project } = milestoneResult;
        project.milestones = project.milestones.filter(m => m.id !== milestoneId);

        if (activeMilestoneId === milestoneId) {
            activeMilestoneId = project.milestones[0]?.id || null;
        }

        await saveProjectsAndActiveIds();
    }
};


export const calculateProjectProgress = (project) => {
    let totalTasks = 0;
    let completedTasks = 0;

    project.milestones.forEach(milestone => {
        totalTasks += milestone.tasks.length;
        completedTasks += milestone.tasks.filter(task => task.status === 'complete').length;
    });

    const progressPercentage = totalTasks > 0 ? Math.floor((completedTasks / totalTasks) * 100) : 0;
    
    return { totalTasks, completedTasks, progressPercentage };
};





