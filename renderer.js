
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

const createDependencyNodeHtml = (task, isFirst, isLast) => {
    const statusClass = task.status === 'complete' ? 'unlocked' : 'locked';
    const isCurrent = task.isCurrent;
    
    const lineStyle = isLast ? 'height: 12px; top: 0;' : 
                      isFirst ? 'height: 100%; top: 18px;' : 
                      'height: 100%; top: 0;';

    const nodeHtml = `
        <div class="dependency-node ${isCurrent ? 'current' : ''}" style="height: ${isLast ? '25px' : '40px'};">
            ${!isFirst ? `<div class="dependency-node-line" style="${lineStyle}"></div>` : ''}
            <div class="dependency-node-dot"></div>
            <div class="dependency-node-text" style="margin-left: 20px; margin-top: 5px;">
                <span class="dependency-badge ${statusClass}">${task.status === 'complete' ? 'Done' : 'Pending'}</span>
                <span>${task.name}</span>
            </div>
        </div>
    `;
    return nodeHtml;
};

export const renderTaskDetails = (taskId) => {
    const task = getTaskDetails(taskId);
    if (!task) return;

    const dependencyChain = getTaskDependencyChain(taskId);
    const locked = isTaskLocked(taskId);
    const isComplete = task.status === 'complete';
    
    const statusClass = isComplete ? 'status-complete' : locked ? 'status-pending' : 'status-in-progress';
    const statusText = isComplete ? 'Complete' : locked ? 'Blocked' : 'In Progress';

    let dependencyHtml = '<p>No dependencies.</p>';
    if (dependencyChain.length > 1) {
        dependencyHtml = '<div class="dependency-tree">';
        dependencyChain.forEach((depTask, index) => {
            dependencyHtml += createDependencyNodeHtml(
                depTask, 
                index === 0, 
                index === dependencyChain.length - 1
            );
        });
        dependencyHtml += '</div>';
    }


    taskDetailsViewEl.innerHTML = `
        <div class="detail-section">
            <h4>Description</h4>
            <p>${task.description || 'No description provided.'}</p>
        </div>
        <div class="detail-section">
            <h4>Status</h4>
            <span class="status-tag ${statusClass}">${statusText}</span>
        </div>
        <div class="detail-section">
            <h4>Dependency Chain</h4>
            ${dependencyHtml}
        </div>
        <div class="detail-section">
            <h4>Actions</h4>
            <button 
                type="button" 
                class="add-btn primary-btn" 
                id="edit-task-details-btn" 
                data-task-id="${task.id}"
                ${isComplete ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} 
                title="${isComplete ? 'Cannot edit completed tasks.' : 'Edit Task Details'}"
            >
                Edit Task
            </button>
        </div>
    `;

    if (!isComplete) {
        document.getElementById('edit-task-details-btn').addEventListener('click', (e) => {
            const taskId = e.target.dataset.taskId;
            document.getElementById('tasks-list').querySelector(`[data-task-id="${taskId}"] .edit-card-btn`).click();
        });
    }
};

export const renderProjectsList = () => {
    const projects = getProjects();
    const activeProject = getActiveProject();
    projectsListEl.innerHTML = ''; 

    if (projects.length === 0) {
        projectsListEl.innerHTML = '<p class="empty-state">No projects found. Add one!</p>';
        return;
    }

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = `milestone-card project-card ${project.id === activeProject?.id ? 'active' : ''}`;
        projectCard.dataset.projectId = project.id;

        const { progressPercentage } = calculateProjectProgress(project);
        
        projectCard.innerHTML = `
            <div class="milestone-info">
                <h3>${project.name}</h3>
                <p>${project.description || 'No description'}</p>
            </div>
            <div class="progress-ring-text">${progressPercentage}%</div>
            <button class="edit-card-btn" data-modal-target="edit-project-modal" data-project-id="${project.id}">
                <span class="icon">⚙️</span>
            </button>
        `;

        projectsListEl.appendChild(projectCard);

        projectCard.querySelector('.edit-card-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            const projectId = e.target.closest('button').dataset.projectId;
            const projectDetails = getProjectDetails(projectId);
            
            const editProjectModal = document.getElementById('edit-project-modal');
            const editProjectForm = document.getElementById('edit-project-form');
            
            document.getElementById('edit-project-name').value = projectDetails.name;
            document.getElementById('edit-project-description').value = projectDetails.description || '';
            editProjectForm.dataset.projectId = projectId;
            
            editProjectModal.classList.remove('hidden');
        });
    });
};

