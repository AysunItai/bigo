// Drag and Drop functionality
let draggedElement = null;
let draggedData = null;

// Initialize drag and drop
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    initializeEventListeners();
});

function initializeDragAndDrop() {
    const cards = document.querySelectorAll('.card');
    const columns = document.querySelectorAll('.cards-container');

    // Card drag events
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    // Column drop events
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    draggedData = {
        id: parseInt(this.dataset.id),
        column: this.closest('.column').dataset.column
    };
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    document.querySelectorAll('.cards-container').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    this.classList.remove('drag-over');

    if (draggedElement != null) {
        const targetColumn = this.closest('.column').dataset.column;
        
        // Only move if dropped in a different column
        if (draggedData.column !== targetColumn) {
            updateCardColumn(draggedData.id, targetColumn);
        }
    }

    return false;
}

// API calls
async function updateCardColumn(cardId, newColumn) {
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ column: newColumn })
        });

        if (response.ok) {
            location.reload(); // Reload to show updated state
        }
    } catch (error) {
        console.error('Error updating card:', error);
    }
}

async function createCard(title, description, column) {
    try {
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, column })
        });

        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error('Error creating card:', error);
    }
}

async function updateCard(cardId, title, description, column) {
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, column })
        });

        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error('Error updating card:', error);
    }
}

async function deleteCard(cardId) {
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            location.reload();
        }
    } catch (error) {
        console.error('Error deleting card:', error);
    }
}

// Event listeners
function initializeEventListeners() {
    // Add card buttons
    document.querySelectorAll('.add-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const column = e.target.dataset.column;
            openModal(null, column);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const cardId = parseInt(e.target.dataset.id);
            const card = await getCard(cardId);
            if (card) {
                openModal(card);
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this card?')) {
                const cardId = parseInt(e.target.dataset.id);
                deleteCard(cardId);
            }
        });
    });

    // Modal events
    const modal = document.getElementById('card-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('card-form');

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cardId = document.getElementById('card-id').value;
        const title = document.getElementById('card-title').value;
        const description = document.getElementById('card-description').value;
        const column = document.getElementById('card-column').value;

        if (cardId) {
            updateCard(parseInt(cardId), title, description, column);
        } else {
            createCard(title, description, column);
        }
    });
}

async function getCard(cardId) {
    try {
        const response = await fetch('/api/cards');
        const cards = await response.json();
        return cards.find(c => c.id === cardId);
    } catch (error) {
        console.error('Error fetching card:', error);
        return null;
    }
}

function openModal(card = null, defaultColumn = 'todo') {
    const modal = document.getElementById('card-modal');
    const titleInput = document.getElementById('card-title');
    const descriptionInput = document.getElementById('card-description');
    const columnSelect = document.getElementById('card-column');
    const cardIdInput = document.getElementById('card-id');
    const modalTitle = document.getElementById('modal-title');

    if (card) {
        modalTitle.textContent = 'Edit Card';
        cardIdInput.value = card.id;
        titleInput.value = card.title;
        descriptionInput.value = card.description;
        columnSelect.value = card.column;
    } else {
        modalTitle.textContent = 'Add Card';
        cardIdInput.value = '';
        titleInput.value = '';
        descriptionInput.value = '';
        columnSelect.value = defaultColumn;
    }

    modal.classList.remove('hidden');
    titleInput.focus();
}

function closeModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.add('hidden');
}

