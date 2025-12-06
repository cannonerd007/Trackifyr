
const alertModal = document.getElementById("custom-alert");
const alertMsg = document.getElementById("custom-alert-msg");
const alertOk = document.getElementById("custom-alert-ok");

const confirmModal = document.getElementById("custom-confirm");
const confirmMsg = document.getElementById("custom-confirm-msg");
const confirmYes = document.getElementById("custom-confirm-yes");
const confirmCancel = document.getElementById("custom-confirm-cancel");

function showAlert(message) {
    return new Promise(resolve => {
        alertMsg.textContent = message;
        alertModal.classList.remove("hidden");
        alertOk.onclick = () => {
            alertModal.classList.add("hidden");
            resolve();
        };
    });
}

function showConfirm(message) {
    return new Promise(resolve => {
        confirmMsg.textContent = message;
        confirmModal.classList.remove("hidden");

        confirmYes.onclick = () => {
            confirmModal.classList.add("hidden");
            resolve(true);
        };

        confirmCancel.onclick = () => {
            confirmModal.classList.add("hidden");
            resolve(false);
        };
    });
}


import { loadData,
    loadTheme, 
    saveTheme 
} from './storage.js';

import { 
    initializeData, 
    setActiveProject, 
    getActiveProject,
    setActiveMilestone, 
    getActiveMilestone, 
    toggleTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    getTaskDetails,
    addProject,
    updateProject,
    deleteProject,
    getProjectDetails,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestoneDetails,
    getTasksForMilestone,
    getProjects,
    isTaskLocked,
    isTaskDependent,
    calculateProjectProgress
} from './data.js';

import { 
    renderProjectProgress, 
    renderProjectsList, 
    renderMilestonesList, 
    renderTasksList, 
    renderTaskDetails,
    populateMilestoneDropdown,
    populateDependencyDropdown
} from './renderer.js';

let activeTaskId = null;
const body = document.body;
const panelLeft = document.querySelector('.panel-left');

// Project Modals
const addProjectModal = document.getElementById('add-project-modal'); 
const addProjectForm = document.getElementById('add-project-form'); 
const editProjectModal = document.getElementById('edit-project-modal'); 
const editProjectForm = document.getElementById('edit-project-form');   

// Milestone Modals
const addMilestoneModal = document.getElementById('add-milestone-modal'); 
const addMilestoneForm = document.getElementById('add-milestone-form');
const editMilestoneModal = document.getElementById('edit-milestone-modal'); 
const editMilestoneForm = document.getElementById('edit-milestone-form');
const deleteMilestoneBtn = document.getElementById('delete-milestone-btn');

// Task Modal
const taskModal = document.getElementById('add-task-modal');
const taskForm = document.getElementById('add-task-form');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const projectCompleteModal = document.getElementById('project-complete-modal');
const tasksPanelTitleEl = document.getElementById('tasks-panel-title');
const taskDetailsViewEl = document.getElementById('task-details-view');
const taskDetailTitleEl = document.getElementById('task-detail-title');
const taskLockedModal = document.getElementById('task-locked-modal');
const taskMilestoneContainer = document.getElementById('task-milestone-container');


const renderAll = () => {
    const activeProject = getActiveProject();
    document.querySelector('.logo-container h1').textContent = 'Trackifyr';
    renderProjectProgress();
    renderProjectsList();
    renderMilestonesList();
    renderTasksList(getActiveMilestone()?.id);

    const activeMilestone = getActiveMilestone();
    tasksPanelTitleEl.textContent = activeMilestone ? `Tasks: ${activeMilestone.name}` : 'Tasks';
};

const hideTaskModal = () => {
    taskModal.classList.add('hidden');
    taskForm.reset();
    document.getElementById('task-modal-title').textContent = 'Add New Task';
    deleteTaskBtn.classList.add('hidden');
    activeTaskId = null;
};

const showAddTaskModal = (taskId = null) => {
    activeTaskId = taskId;
    const activeMilestone = getActiveMilestone();

    if (!taskMilestoneContainer) return;

    taskMilestoneContainer.innerHTML = populateMilestoneDropdown('task-milestone-id', taskId); 
    populateDependencyDropdown('task-dependency-id', taskId); 

    if (taskId) {
        const task = getTaskDetails(taskId);

        if (task.status === 'complete') {
            showAlert(`Task "${task.name}" is already complete and cannot be edited.`);
            taskModal.classList.add('hidden');
            return; 
        }

        document.getElementById('task-modal-title').textContent = 'Edit Task';
        deleteTaskBtn.classList.remove('hidden');

        taskForm.elements['task-name'].value = task.name;
        taskForm.elements['task-description'].value = task.description;
        taskForm.elements['task-status'].value = task.status;
        taskForm.elements['task-dependency-id'].value = task.dependencyId || '';

    } else {
        if (!activeMilestone) {
            showAlert("Please select a milestone before adding a task.");
            return;
        }
        document.getElementById('task-modal-title').textContent = 'Add New Task';
        deleteTaskBtn.classList.add('hidden');
        taskForm.reset();
    }

    taskModal.classList.remove('hidden');
};


const toggleTheme = async () => {
    const newTheme = body.classList.contains('theme-light') ? 'dark' : 'light';

    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${newTheme}`);
    await saveTheme(newTheme);

    const themeIcon = document.getElementById("theme-toggle-icon");
    themeIcon.textContent = newTheme === "dark" ? "☀️" : "🌙";
};

const handleActiveProjectChange = async (projectId) => {
    await setActiveProject(projectId);
    renderAll();
    taskDetailsViewEl.innerHTML = ''; 
    taskDetailTitleEl.textContent = 'Task Details';
    taskDetailTitleEl.dataset.taskId = '';
};

const handleActiveMilestoneChange = (milestoneId) => {
    setActiveMilestone(milestoneId);
    renderTasksList(milestoneId);
    taskDetailsViewEl.innerHTML = '';
    taskDetailTitleEl.textContent = 'Task Details';
    taskDetailTitleEl.dataset.taskId = '';
};

const handleTaskClick = (taskId) => {
    renderTaskDetails(taskId);
    const taskName = getTaskDetails(taskId)?.name || 'N/A';
    taskDetailTitleEl.textContent = `Task Details: ${taskName}`;
    taskDetailTitleEl.dataset.taskId = taskId;
};


const handleInlineTaskDelete = async (taskId) => {
    const task = getTaskDetails(taskId);

    if (isTaskDependent(taskId)) {
        const ok = await showConfirm(`Task "${task.name}" is a dependency for other tasks. Deleting it will remove the dependency link. Continue?`);
        if (!ok) return;
    } else {
        const ok = await showConfirm(`Are you sure you want to delete the completed task "${task.name}"?`);
        if (!ok) return;
    }

    await deleteTask(taskId);
    renderAll();

    if (taskDetailTitleEl.dataset.taskId === taskId) {
        taskDetailsViewEl.innerHTML = ''; 
        taskDetailTitleEl.textContent = 'Task Details';
        taskDetailTitleEl.dataset.taskId = '';
    }
};

const handleTaskToggle = async (taskId) => {
    const activeProject = getActiveProject();
    const task = getTaskDetails(taskId);

    if (!task || task.status === 'complete') return;

    const ok = await showConfirm(
        `Mark "${task.name}" as completed?

⚠️ Once completed, it CANNOT be undone!`
    );
    if (!ok) { renderAll(); return; }

    const result = await toggleTaskStatus(taskId);
    if (result === 'locked') taskLockedModal.classList.remove('hidden');

    renderAll();

    if (taskDetailTitleEl.dataset.taskId === taskId) {
        renderTaskDetails(taskId);
    }

    if (result === 'complete' && activeProject && calculateProjectProgress(activeProject).progressPercentage === 100) {
        document.getElementById('completed-project-name').textContent = activeProject.name;
        projectCompleteModal.classList.remove('hidden');
    }
};



const handleAddTaskSubmit = async (e) => { 
    e.preventDefault();
    const form = e.target;
    const taskName = form.elements['task-name'].value;
    const milestoneId = form.elements['task-milestone-id'].value;
    const description = form.elements['task-description'].value;
    const status = form.elements['task-status'].value;
    const dependencyId = form.elements['task-dependency-id'].value || null;

    try {
        if (activeTaskId) {
            await updateTask(activeTaskId, { name: taskName, description, status, dependencyId });
            if (taskDetailTitleEl.dataset.taskId === activeTaskId) {
                renderTaskDetails(activeTaskId);
            }
        } else {
            await addTask(milestoneId, { name: taskName, description, status: 'pending', dependencyId });
        }
    } catch (error) {
        await showAlert(`Task operation failed: ${error.message}`);
        return;
    }

    hideTaskModal();
    renderAll();
};

const handleDeleteTask = async () => {
    if (!activeTaskId) return;

    const task = getTaskDetails(activeTaskId);

    if (isTaskDependent(activeTaskId)) {
        const ok = await showConfirm(`Task "${task.name}" is a dependency for others. Delete anyway?`);
        if (!ok) return;
    }

    await deleteTask(activeTaskId);
    hideTaskModal();
    renderAll();
    taskDetailsViewEl.innerHTML = '';
    taskDetailTitleEl.textContent = 'Task Details';
    taskDetailTitleEl.dataset.taskId = '';
};


const handleAddProjectSubmit = async (e) => { 
    e.preventDefault();
    const name = e.target.elements['project-name'].value;
    const description = e.target.elements['project-description'].value;
    try {
        await addProject({ name, description });
    } catch (error) {
        await showAlert(`Project operation failed: ${error.message}`);
        return;
    }
    addProjectModal.classList.add('hidden');
    addProjectForm.reset();
    renderAll();
};

const handleEditProjectSubmit = async (e) => { 
    e.preventDefault();
    const projectId = editProjectForm.dataset.projectId;
    const name = e.target.elements['edit-project-name'].value;
    const description = e.target.elements['edit-project-description'].value;
    try {
        await updateProject(projectId, { name, description });
    } catch (error) {
        await showAlert(`Project operation failed: ${error.message}`);
        return;
    }
    editProjectModal.classList.add('hidden');
    renderAll();
};

const handleDeleteProject = async () => { 
    const projectId = editProjectForm.dataset.projectId;
    const project = getProjectDetails(projectId);

    const ok = await showConfirm(`Delete project "${project.name}"? This action cannot be undone.`);
    if (!ok) return;

    await deleteProject(projectId);
    editProjectModal.classList.add('hidden');
    renderAll();
    taskDetailsViewEl.innerHTML = '';
    taskDetailTitleEl.textContent = 'Task Details';
    taskDetailTitleEl.dataset.taskId = '';
};



const handleAddMilestoneSubmit = async (e) => { 
    e.preventDefault();
    const activeProject = getActiveProject();
    if (!activeProject) return;

    const name = e.target.elements['milestone-name'].value;
    const description = e.target.elements['milestone-description'].value;

    try {
        await addMilestone(activeProject.id, { name, description });
    } catch (error) {
        await showAlert(`Milestone operation failed: ${error.message}`);
        return;
    }

    addMilestoneModal.classList.add('hidden');
    addMilestoneForm.reset();
    renderAll();
};

const handleEditMilestoneSubmit = async (e) => { 
    e.preventDefault();
    const milestoneId = editMilestoneForm.dataset.milestoneId;
    const name = e.target.elements['edit-milestone-name'].value;
    const description = e.target.elements['edit-milestone-description'].value;
    try {
        await updateMilestone(milestoneId, { name, description });
    } catch (error) {
        await showAlert(`Milestone operation failed: ${error.message}`);
        return;
    }

    editMilestoneModal.classList.add('hidden');
    renderAll();
};

const handleDeleteMilestone = async () => { 
    const milestoneId = editMilestoneForm.dataset.milestoneId;
    const milestone = getMilestoneDetails(milestoneId);

    const ok = await showConfirm(`Delete milestone "${milestone.name}"? All tasks inside it will also be deleted.`);
    if (!ok) return;

    await deleteMilestone(milestoneId);
    editMilestoneModal.classList.add('hidden');
    renderAll();
    taskDetailsViewEl.innerHTML = '';
    taskDetailTitleEl.textContent = 'Task Details';
    taskDetailTitleEl.dataset.taskId = '';
};



const setupEventListeners = () => {

    document.getElementById('project-complete-close')
    .addEventListener('click', () => {
        projectCompleteModal.classList.add('hidden');
    });

    
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    panelLeft.addEventListener('click', (e) => {


        if (e.target.closest('.project-card') && e.target.closest('.project-card').dataset.projectId) {
            handleActiveProjectChange(e.target.closest('.project-card').dataset.projectId);
        }

        
        const clickedMilestone = e.target.closest('.milestone-card');
        if (clickedMilestone && clickedMilestone.dataset.milestoneId) {
            const milestoneId = clickedMilestone.dataset.milestoneId;

            document.querySelectorAll('.milestone-card').forEach(card => card.classList.remove('active'));
            clickedMilestone.classList.add('active');

            handleActiveMilestoneChange(milestoneId);
        }
    });


    document.getElementById('tasks-list').addEventListener('click', (e) => {
        const taskRow = e.target.closest('.task-row');
        if (!taskRow) return;

        const taskId = taskRow.dataset.taskId;

        if (e.target.closest('.task-checkbox-input')) {
            handleTaskToggle(taskId);
            e.preventDefault();
            e.stopPropagation();
            return;
        }


        if (e.target.closest('.delete-task-row-btn')) {
            handleInlineTaskDelete(taskId);
            return;
        }

        if (e.target.closest('.edit-card-btn')) {
            showAddTaskModal(taskId);
            return;
        }

        handleTaskClick(taskId);
    });


    document.getElementById('add-project-btn').addEventListener('click', () => addProjectModal.classList.remove('hidden'));
    document.querySelector('#add-project-modal .close-modal-btn').addEventListener('click', () => addProjectModal.classList.add('hidden'));

    addProjectForm.addEventListener('submit', handleAddProjectSubmit);

    document.querySelector('#edit-project-modal .close-modal-btn').addEventListener('click', () => editProjectModal.classList.add('hidden'));
    document.getElementById('delete-project-btn').addEventListener('click', handleDeleteProject);
    editProjectForm.addEventListener('submit', handleEditProjectSubmit);

    document.getElementById('add-milestone-btn').addEventListener('click', () => addMilestoneModal.classList.remove('hidden'));
    document.querySelector('#add-milestone-modal .close-modal-btn').addEventListener('click', () => addMilestoneModal.classList.add('hidden'));

    addMilestoneForm.addEventListener('submit', handleAddMilestoneSubmit);

    document.querySelector('#edit-milestone-modal .close-modal-btn').addEventListener('click', () => editMilestoneModal.classList.add('hidden'));
    deleteMilestoneBtn.addEventListener('click', handleDeleteMilestone);
    editMilestoneForm.addEventListener('submit', handleEditMilestoneSubmit);

    
    document.getElementById('add-task-btn').addEventListener('click', () => showAddTaskModal());
    document.querySelector('#add-task-modal .close-modal-btn').addEventListener('click', hideTaskModal);

    taskForm.addEventListener('submit', handleAddTaskSubmit);
    deleteTaskBtn.addEventListener('click', handleDeleteTask);


document.getElementById('project-complete-close').addEventListener('click', () => {
    projectCompleteModal.classList.add('hidden');
});

};


const init = async () => {
    
    const savedTheme = await loadTheme();
    body.classList.add(`theme-${savedTheme}`);

    
    const themeIcon = document.getElementById("theme-toggle-icon");
    themeIcon.textContent = savedTheme === "dark" ? "☀️" : "🌙";

    
    await initializeData();

    
    const activeProjectId = await loadData("projectTracker_activeProjectId");
    if (activeProjectId) {
        await setActiveProject(activeProjectId);
    }

  
    renderAll();

    
    setupEventListeners();
};


init();

