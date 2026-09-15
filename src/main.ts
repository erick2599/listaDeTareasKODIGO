import "./style.css";
import type { Task, Priority } from './domain/Task';
import { LocalStorageRepository } from './repository/LocalStorageRepository';


const repository = new LocalStorageRepository();
let tasks: Task[] = repository.getAll();
let editingTaskId: string | null = null;

// Elementos del DOM
const taskForm = document.getElementById('task-form') as HTMLFormElement;
const taskList = document.getElementById('task-list') as HTMLDivElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const filterStatus = document.getElementById('filter-status') as HTMLSelectElement;
const filterPriority = document.getElementById('filter-priority') as HTMLSelectElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const statsTotal = document.getElementById('stats-total') as HTMLSpanElement;
const statsPending = document.getElementById('stats-pending') as HTMLSpanElement;
const statsCompleted = document.getElementById('stats-completed') as HTMLSpanElement;
const btnClearCompleted = document.getElementById('btn-clear-completed') as HTMLButtonElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;


// Inicializar la aplicación
function init() {
  taskForm.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', renderTasks);
  filterStatus.addEventListener('change', renderTasks);
  filterPriority.addEventListener('change', renderTasks);
  btnClearCompleted.addEventListener('click', clearCompletedTasks); // <-- Nueva Línea
  
  // Inicializador del Tema Oscuro
  themeToggle.addEventListener('click', toggleTheme);
  const savedTheme = localStorage.getItem('app-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonText(savedTheme);
  renderTasks();
}

// Renderizar lista filtrada
function renderTasks() {
  // --- ACTUALIZACIÓN DE CONTADORES EN TIEMPO REAL ---
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completada').length;
  const pendingCount = totalCount - completedCount;

  statsTotal.textContent = totalCount.toString();
  statsPending.textContent = pendingCount.toString();
  statsCompleted.textContent = completedCount.toString();


  const query = searchInput.value.toLowerCase().trim();
  const statusFilter = filterStatus.value;
  const priorityFilter = filterPriority.value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'todas' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'todas' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  filteredTasks.sort((a, b) => {
    if (a.status === 'completada' && b.status === 'pendiente') return 1;
    if (a.status === 'pendiente' && b.status === 'completada') return -1;
    return b.createdAt - a.createdAt; // Si tienen el mismo estado, ordena por la más reciente primero
  });

  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `<p class="empty-message">No se encontraron tareas.</p>`;
    return;
  }

  filteredTasks.forEach(task => {
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority} ${task.status === 'completada' ? 'completed' : ''}`;
    
    card.innerHTML = `
      <div class="task-content">
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="task-tags">
          <span class="tag-category">${task.category}</span>
          <span class="tag-priority">${task.priority}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-toggle" data-id="${task.id}">
          ${task.status === 'completada' ? 'Deshacer' : 'Completar'}
        </button>
        <button class="btn-edit" data-id="${task.id}">Editar</button>
        <button class="btn-delete" data-id="${task.id}">Eliminar</button>
      </div>
    `;

    // Asignar eventos de forma segura
    card.querySelector('.btn-toggle')?.addEventListener('click', () => toggleTaskStatus(task.id));
    card.querySelector('.btn-edit')?.addEventListener('click', () => loadTaskIntoForm(task));
    card.querySelector('.btn-delete')?.addEventListener('click', () => deleteTask(task.id));

    taskList.appendChild(card);
  });
}

// Crear o Editar Tarea
function handleFormSubmit(e: SubmitEvent) {
  e.preventDefault();
  
  const formData = new FormData(taskForm);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const priority = formData.get('priority') as Priority;

  if (editingTaskId) {
    tasks = tasks.map(t => t.id === editingTaskId ? { ...t, title, description, category, priority } : t);
    editingTaskId = null;
    submitBtn.textContent = 'Guardar Tarea';
  } else {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      priority,
      status: 'pendiente',
      createdAt: Date.now()
    };
    tasks.push(newTask);
  }

  repository.saveAll(tasks);
  taskForm.reset();
  renderTasks();
}

function toggleTaskStatus(id: string) {
  tasks = tasks.map(t => t.id === id ? { ...t, status: t.status === 'pendiente' ? 'completada' : 'pendiente' } : t);
  repository.saveAll(tasks);
  renderTasks();
}

function loadTaskIntoForm(task: Task) {
  editingTaskId = task.id;
  (document.getElementById('form-title') as HTMLInputElement).value = task.title;
  (document.getElementById('form-description') as HTMLTextAreaElement).value = task.description;
  (document.getElementById('form-category') as HTMLInputElement).value = task.category;
  (document.getElementById('form-priority') as HTMLSelectElement).value = task.priority;
  submitBtn.textContent = 'Actualizar Tarea';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTask(id: string) {
  if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
    tasks = tasks.filter(t => t.id !== id);
    repository.saveAll(tasks);
    renderTasks();
  }
}

function clearCompletedTasks() {
  const completedCount = tasks.filter(t => t.status === 'completada').length;
  
  if (completedCount === 0) {
    alert('No hay tareas completadas para eliminar.');
    return;
  }

  if (confirm(`¿Estás seguro de que deseas eliminar las ${completedCount} tareas completadas?`)) {
    tasks = tasks.filter(t => t.status !== 'completada');
    repository.saveAll(tasks);
    renderTasks();
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('app-theme', newTheme);
  updateThemeButtonText(newTheme);
}

function updateThemeButtonText(theme: string) {
  themeToggle.textContent = theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
}

init();
