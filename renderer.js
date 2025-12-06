
import { 
    calculateProjectProgress, 
    getProjects, 
    getActiveProject, 
    getMilestones, 
    getActiveMilestone, 
    getTasksForMilestone, 
    isTaskLocked,
    getTaskDetails,
    getTaskDependencyChain,
    isTaskDependent,
    getProjectDetails,
    getMilestoneDetails
} from './data.js';


const projectsListEl = document.getElementById('projects-list');
const milestonesListEl = document.getElementById('milestones-list');
const tasksListEl = document.getElementById('tasks-list');
const tasksPanelTitleEl = document.getElementById('tasks-panel-title');
const taskDetailsViewEl = document.getElementById('task-details-view');
const progressFillEl = document.querySelector('.progress-fill');
const progressValueEl = document.querySelector('.progress-value');
const taskDetailTitleEl = document.getElementById('task-detail-title');


export const renderProjectProgress = () => {
    const activeProject = getActiveProject();
    if (!activeProject) {
        progressFillEl.style.width = `0%`;
        progressValueEl.textContent = `0%`;
        return;
    }

    const { progressPercentage } = calculateProjectProgress(activeProject);

    progressFillEl.style.width = `${progressPercentage}%`;
    progressValueEl.textContent = `${progressPercentage}%`;
};
