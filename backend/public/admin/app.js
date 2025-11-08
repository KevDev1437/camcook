/**
 * Super Admin Dashboard - Application JavaScript
 * 
 * Gère toute la logique du dashboard :
 * - Login/Logout avec JWT
 * - Appels API
 * - Affichage des données
 * - Gestion des formulaires
 */

// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';
let currentToken = localStorage.getItem('adminToken');
let currentPage = 1;
let currentLimit = 20;
let currentFilters = {};

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    if (currentToken) {
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });

    // Refresh buttons
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', () => loadGlobalStats());
    }

    const refreshRestaurantsBtn = document.getElementById('refreshRestaurantsBtn');
    if (refreshRestaurantsBtn) {
        refreshRestaurantsBtn.addEventListener('click', () => loadRestaurants());
    }

    // Filters
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }

    const planFilter = document.getElementById('planFilter');
    if (planFilter) {
        planFilter.addEventListener('change', handleFilterChange);
    }

    const activeFilter = document.getElementById('activeFilter');
    if (activeFilter) {
        activeFilter.addEventListener('change', handleFilterChange);
    }

    // Create restaurant form
    const createForm = document.getElementById('createRestaurantForm');
    if (createForm) {
        console.log('[SETUP] ✅ Formulaire createRestaurantForm trouvé, ajout du listener');
        createForm.addEventListener('submit', handleCreateRestaurant);
    } else {
        console.error('[SETUP] ❌ Formulaire createRestaurantForm non trouvé !');
    }

    const resetFormBtn = document.getElementById('resetFormBtn');
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', () => {
            document.getElementById('createRestaurantForm').reset();
            hideNewOwnerForm();
        });
    }

    // New owner form buttons
    const createNewOwnerBtn = document.getElementById('createNewOwnerBtn');
    if (createNewOwnerBtn) {
        createNewOwnerBtn.addEventListener('click', showNewOwnerForm);
    }

    const cancelNewOwnerBtn = document.getElementById('cancelNewOwnerBtn');
    if (cancelNewOwnerBtn) {
        cancelNewOwnerBtn.addEventListener('click', hideNewOwnerForm);
    }

    const createOwnerBtn = document.getElementById('createOwnerBtn');
    if (createOwnerBtn) {
        createOwnerBtn.addEventListener('click', handleCreateNewOwner);
    }

    // Generate app form
    const generateAppForm = document.getElementById('generateAppForm');
    if (generateAppForm) {
        generateAppForm.addEventListener('submit', handleGenerateApp);
    }

    const resetGenerateFormBtn = document.getElementById('resetGenerateFormBtn');
    if (resetGenerateFormBtn) {
        resetGenerateFormBtn.addEventListener('click', () => {
            document.getElementById('generateAppForm').reset();
            document.getElementById('generateAppError').style.display = 'none';
            document.getElementById('generateAppSuccess').style.display = 'none';
            document.getElementById('generateAppOutput').style.display = 'none';
        });
    }

    // Modal
    const closeModalBtns = document.querySelectorAll('#closeModalBtn, #closeModalBtnFooter');
    closeModalBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeModal);
        }
    });

    const modal = document.getElementById('restaurantModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// ============================================
// AUTHENTICATION
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Vérifier que l'utilisateur est superadmin
            // Le rôle est dans data.data.user.role, pas data.data.role
            const userRole = data.data.user?.role || data.data.role;
            
            if (userRole !== 'superadmin') {
                showError(errorDiv, 'Accès refusé. Seuls les super administrateurs peuvent accéder à ce dashboard.');
                return;
            }

            currentToken = data.data.token;
            localStorage.setItem('adminToken', currentToken);
            
            // Afficher l'email de l'utilisateur dans le header
            const userEmail = data.data.user?.email || email;
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = userEmail;
            }
            
            showToast('Connexion réussie !', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showError(errorDiv, data.error || data.message || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(errorDiv, 'Erreur de connexion au serveur');
    }
}

function handleLogout() {
    currentToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
    showToast('Déconnexion réussie', 'success');
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'flex';
    
    // Afficher l'email de l'utilisateur si disponible
    // (Vous pouvez récupérer l'email depuis le token ou une API)
}

// ============================================
// NAVIGATION
// ============================================
function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });

    // Remove active class from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Add active class to nav button
    const navBtn = document.querySelector(`[data-section="${section}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Load section data
    if (section === 'stats') {
        loadGlobalStats();
    } else if (section === 'restaurants') {
        loadRestaurants();
    } else if (section === 'create') {
        // Reset form
        const form = document.getElementById('createRestaurantForm');
        if (form) {
            form.reset();
        }
        hideNewOwnerForm();
        
        // Cacher les messages d'erreur/succès
        const errorDiv = document.getElementById('createRestaurantError');
        const successDiv = document.getElementById('createRestaurantSuccess');
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        
        // Load users for owner selection
        loadUsersForOwner();
    } else if (section === 'generate-app') {
        // Reset form
        const form = document.getElementById('generateAppForm');
        if (form) {
            form.reset();
        }
        
        // Cacher les messages
        const errorDiv = document.getElementById('generateAppError');
        const successDiv = document.getElementById('generateAppSuccess');
        const outputDiv = document.getElementById('generateAppOutput');
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
        if (outputDiv) outputDiv.style.display = 'none';
        
        // Load restaurants for selection
        loadRestaurantsForGeneration();
    }
}

// ============================================
// DASHBOARD DATA
// ============================================
function loadDashboardData() {
    loadGlobalStats();
}

async function loadGlobalStats() {
    const statsGrid = document.getElementById('globalStats');
    if (!statsGrid) return;

    // Show loading
    statsGrid.innerHTML = '<div class="stat-card loading"><div class="stat-loader"></div></div>'.repeat(8);

    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/stats`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayGlobalStats(data.data);
        } else {
            if (response.status === 401) {
                handleLogout();
                showToast('Session expirée. Veuillez vous reconnecter.', 'error');
            } else {
                showToast(data.error || 'Erreur lors du chargement des statistiques', 'error');
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

function displayGlobalStats(stats) {
    const statsGrid = document.getElementById('globalStats');
    
    const statsCards = [
        {
            title: 'Total Restaurants',
            value: stats.totalRestaurants,
            icon: '🏪',
            color: 'var(--primary-color)'
        },
        {
            title: 'Restaurants Actifs',
            value: stats.activeRestaurants,
            icon: '✅',
            color: 'var(--success-color)'
        },
        {
            title: 'Restaurants Inactifs',
            value: stats.inactiveRestaurants,
            icon: '❌',
            color: 'var(--danger-color)'
        },
        {
            title: 'En Trial',
            value: stats.trialRestaurants,
            icon: '⏳',
            color: 'var(--warning-color)'
        },
        {
            title: 'Total Commandes',
            value: stats.totalOrders.toLocaleString(),
            icon: '📦',
            color: 'var(--primary-color)'
        },
        {
            title: 'Revenu Total',
            value: `${parseFloat(stats.totalRevenue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
            icon: '💰',
            color: 'var(--success-color)'
        },
        {
            title: 'Commandes Ce Mois',
            value: stats.ordersThisMonth.toLocaleString(),
            icon: '📊',
            color: 'var(--primary-color)'
        },
        {
            title: 'Revenu Ce Mois',
            value: `${parseFloat(stats.revenueThisMonth).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
            icon: '💵',
            color: 'var(--success-color)'
        },
        {
            title: 'Nouveaux Restaurants (Ce Mois)',
            value: stats.newRestaurantsThisMonth,
            icon: '🆕',
            color: 'var(--secondary-color)'
        },
        {
            title: 'Croissance',
            value: `${parseFloat(stats.growth).toFixed(2)}%`,
            icon: '📈',
            color: parseFloat(stats.growth) >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
        },
        {
            title: 'Plan Free',
            value: stats.restaurantsByPlan.free,
            icon: '🆓',
            color: 'var(--text-secondary)'
        },
        {
            title: 'Plan Starter',
            value: stats.restaurantsByPlan.starter,
            icon: '⭐',
            color: 'var(--primary-color)'
        },
        {
            title: 'Plan Pro',
            value: stats.restaurantsByPlan.pro,
            icon: '💎',
            color: '#8b5cf6'
        },
        {
            title: 'Plan Enterprise',
            value: stats.restaurantsByPlan.enterprise,
            icon: '🏆',
            color: 'var(--success-color)'
        }
    ];

    statsGrid.innerHTML = statsCards.map(card => `
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">${card.title}</span>
                <span class="stat-icon">${card.icon}</span>
            </div>
            <div class="stat-value" style="color: ${card.color}">${card.value}</div>
        </div>
    `).join('');
}

// ============================================
// RESTAURANTS LIST
// ============================================
async function loadRestaurants(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('restaurantsTableBody');
    const pagination = document.getElementById('pagination');

    if (!tableBody) return;

    // Show loading
    tableBody.innerHTML = '<tr><td colspan="8" class="loading-row"><div class="table-loader">Chargement...</div></td></tr>';

    // Build query params
    const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        ...currentFilters
    });

    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants?${params}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayRestaurants(data.data, data.meta);
            displayPagination(data.meta, pagination);
        } else {
            if (response.status === 401) {
                handleLogout();
                showToast('Session expirée. Veuillez vous reconnecter.', 'error');
            } else {
                showToast(data.error || 'Erreur lors du chargement des restaurants', 'error');
            }
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

function displayRestaurants(restaurants, meta) {
    const tableBody = document.getElementById('restaurantsTableBody');

    if (restaurants.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading-row">Aucun restaurant trouvé</td></tr>';
        return;
    }

    tableBody.innerHTML = restaurants.map(restaurant => {
        const owner = restaurant.owner || {};
        const isActive = restaurant.isActive ? 'Oui' : 'Non';
        const activeClass = restaurant.isActive ? 'badge-active' : 'badge-inactive';

        return `
            <tr>
                <td>${restaurant.id}</td>
                <td><strong>${restaurant.name}</strong></td>
                <td>${restaurant.email}</td>
                <td>${owner.name || 'N/A'} <br><small>${owner.email || ''}</small></td>
                <td><span class="badge badge-${restaurant.subscriptionPlan || 'free'}">${(restaurant.subscriptionPlan || 'free').toUpperCase()}</span></td>
                <td><span class="badge badge-${restaurant.subscriptionStatus || 'trial'}">${(restaurant.subscriptionStatus || 'trial').toUpperCase()}</span></td>
                <td><span class="badge ${activeClass}">${isActive}</span></td>
                <td>
                    <div class="actions">
                        <button class="action-btn action-btn-view" onclick="viewRestaurantStats(${restaurant.id})">📊 Stats</button>
                        <button class="action-btn action-btn-edit" onclick="editRestaurantLogo(${restaurant.id}, '${(restaurant.logo || '').replace(/'/g, "\\'")}')">🖼️ Logo</button>
                        <button class="action-btn action-btn-edit" onclick="editRestaurantTheme(${restaurant.id}, this)" data-theme='${JSON.stringify(restaurant.settings?.theme || {})}'>🎨 Couleurs</button>
                        <button class="action-btn action-btn-edit" onclick="editRestaurantSubscription(${restaurant.id})">✏️ Abonnement</button>
                        <button class="action-btn action-btn-toggle" onclick="toggleRestaurantStatus(${restaurant.id}, ${restaurant.isActive})">
                            ${restaurant.isActive ? '⏸️ Désactiver' : '▶️ Activer'}
                        </button>
                        <button class="action-btn action-btn-delete" onclick="deleteRestaurant(${restaurant.id})">🗑️ Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function displayPagination(meta, paginationDiv) {
    if (!meta || meta.pages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    const { page, pages, total } = meta;
    const paginationHTML = [];

    // Previous button
    paginationHTML.push(`
        <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="loadRestaurants(${page - 1})">
            ← Précédent
        </button>
    `);

    // Page numbers
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            paginationHTML.push(`
                <button class="pagination-btn ${i === page ? 'active' : ''}" onclick="loadRestaurants(${i})">
                    ${i}
                </button>
            `);
        } else if (i === page - 3 || i === page + 3) {
            paginationHTML.push('<span class="pagination-info">...</span>');
        }
    }

    // Next button
    paginationHTML.push(`
        <button class="pagination-btn" ${page === pages ? 'disabled' : ''} onclick="loadRestaurants(${page + 1})">
            Suivant →
        </button>
    `);

    // Info
    paginationHTML.push(`
        <span class="pagination-info">
            Page ${page} sur ${pages} (${total} restaurants)
        </span>
    `);

    paginationDiv.innerHTML = paginationHTML.join('');
}

// ============================================
// FILTERS & SEARCH
// ============================================
function handleSearch(e) {
    const search = e.target.value.trim();
    if (search) {
        currentFilters.search = search;
    } else {
        delete currentFilters.search;
    }
    loadRestaurants(1);
}

function handleFilterChange() {
    const statusFilter = document.getElementById('statusFilter').value;
    const planFilter = document.getElementById('planFilter').value;
    const activeFilter = document.getElementById('activeFilter').value;

    currentFilters = {};

    if (statusFilter) {
        currentFilters.subscriptionStatus = statusFilter;
    }

    if (planFilter) {
        currentFilters.subscriptionPlan = planFilter;
    }

    if (activeFilter) {
        currentFilters.isActive = activeFilter;
    }

    loadRestaurants(1);
}

// ============================================
// CREATE RESTAURANT
// ============================================
async function handleCreateRestaurant(e) {
    e.preventDefault();
    
    console.log('[CREATE RESTAURANT] 🚀 Début de la création du restaurant...');

    const errorDiv = document.getElementById('createRestaurantError');
    const successDiv = document.getElementById('createRestaurantSuccess');
    
    if (!errorDiv || !successDiv) {
        console.error('[CREATE RESTAURANT] ❌ Erreur: errorDiv ou successDiv non trouvé');
        alert('Erreur: éléments du formulaire non trouvés');
        return;
    }
    
    // IMPORTANT : S'assurer que les champs du formulaire owner sont désactivés si le formulaire est caché
    // pour éviter les erreurs de validation du navigateur
    const newOwnerForm = document.getElementById('newOwnerForm');
    if (newOwnerForm && newOwnerForm.style.display === 'none') {
        const newOwnerName = document.getElementById('newOwnerName');
        const newOwnerEmail = document.getElementById('newOwnerEmail');
        const newOwnerPhone = document.getElementById('newOwnerPhone');
        const newOwnerPassword = document.getElementById('newOwnerPassword');
        
        if (newOwnerName) newOwnerName.required = false;
        if (newOwnerEmail) newOwnerEmail.required = false;
        if (newOwnerPhone) newOwnerPhone.required = false;
        if (newOwnerPassword) newOwnerPassword.required = false;
    }
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Récupérer les valeurs du formulaire
    const name = document.getElementById('restaurantName')?.value.trim();
    const email = document.getElementById('restaurantEmail')?.value.trim();
    const phone = document.getElementById('restaurantPhone')?.value.trim();
    const street = document.getElementById('restaurantStreet')?.value.trim();
    const city = document.getElementById('restaurantCity')?.value.trim();
    const postalCode = document.getElementById('restaurantPostalCode')?.value.trim();
    const description = document.getElementById('restaurantDescription')?.value.trim() || 'Description à compléter';
    const logo = document.getElementById('restaurantLogo')?.value.trim() || null;
    const ownerId = parseInt(document.getElementById('restaurantOwnerId')?.value);
    const subscriptionPlan = document.getElementById('restaurantSubscriptionPlan')?.value;

    console.log('[CREATE RESTAURANT] 📋 Données du formulaire:', {
        name, email, phone, street, city, postalCode, description, logo, ownerId, subscriptionPlan
    });

    // Validation des champs obligatoires
    if (!name || !email || !phone || !street || !city) {
        const missingFields = [];
        if (!name) missingFields.push('Nom');
        if (!email) missingFields.push('Email');
        if (!phone) missingFields.push('Téléphone');
        if (!street) missingFields.push('Rue');
        if (!city) missingFields.push('Ville');
        showError(errorDiv, `Veuillez remplir tous les champs obligatoires: ${missingFields.join(', ')}`);
        console.error('[CREATE RESTAURANT] ❌ Champs manquants:', missingFields);
        return;
    }

    // Validation : vérifier que l'ownerId est sélectionné
    if (!ownerId || isNaN(ownerId)) {
        showError(errorDiv, 'Veuillez sélectionner un propriétaire pour le restaurant');
        console.error('[CREATE RESTAURANT] ❌ OwnerId non sélectionné');
        return;
    }

    const formData = {
        name,
        email,
        phone,
        street,
        city,
        postalCode,
        description,
        logo,
        ownerId,
        subscriptionPlan
    };

    console.log('[CREATE RESTAURANT] ✅ Validation OK, envoi de la requête...');

    try {
        console.log('[CREATE RESTAURANT] 📤 Envoi de la requête à:', `${API_BASE_URL}/superadmin/restaurants`);
        console.log('[CREATE RESTAURANT] 📤 Token présent:', !!currentToken);
        
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(formData)
        });

        console.log('[CREATE RESTAURANT] 📥 Réponse reçue, status:', response.status);
        
        const data = await response.json();
        console.log('[CREATE RESTAURANT] 📥 Données reçues:', data);

        if (response.ok && data.success) {
            console.log('[CREATE RESTAURANT] ✅ Succès ! Restaurant créé:', data.data);
            
            // Afficher le message de succès
            const successMessage = `Restaurant "${data.data.name}" créé avec succès ! ID: ${data.data.id}`;
            showSuccess(successDiv, successMessage);
            console.log('[CREATE RESTAURANT] ✅ Message de succès affiché');
            
            // Afficher le toast
            showToast(successMessage, 'success');
            console.log('[CREATE RESTAURANT] ✅ Toast affiché');
            
            // Réinitialiser le formulaire
            const form = document.getElementById('createRestaurantForm');
            if (form) {
                form.reset();
                console.log('[CREATE RESTAURANT] ✅ Formulaire réinitialisé');
                
                // Réinitialiser aussi le select owner
                const ownerSelect = document.getElementById('restaurantOwnerId');
                if (ownerSelect) {
                    ownerSelect.value = '';
                }
                
                // Cacher le formulaire de création d'owner s'il est visible
                hideNewOwnerForm();
            }
            
            // Recharger la liste des utilisateurs disponibles (au cas où on voudrait créer un autre restaurant)
            loadUsersForOwner();
            
            // Switch to restaurants section after 3 seconds (plus de temps pour voir le message)
            setTimeout(() => {
                switchSection('restaurants');
                loadRestaurants();
            }, 3000);
        } else {
            console.error('[CREATE RESTAURANT] ❌ Erreur dans la réponse:', data);
            showError(errorDiv, data.error || 'Erreur lors de la création du restaurant');
        }
    } catch (error) {
        console.error('Error creating restaurant:', error);
        showError(errorDiv, 'Erreur de connexion au serveur');
    }
}

// ============================================
// NEW OWNER FORM MANAGEMENT
// ============================================
function showNewOwnerForm() {
    const newOwnerForm = document.getElementById('newOwnerForm');
    const ownerSelect = document.getElementById('restaurantOwnerId');
    if (newOwnerForm) {
        newOwnerForm.style.display = 'block';
        if (ownerSelect) {
            ownerSelect.required = false;
            ownerSelect.value = '';
        }
        
        // Activer les champs required du formulaire owner
        const newOwnerName = document.getElementById('newOwnerName');
        const newOwnerEmail = document.getElementById('newOwnerEmail');
        const newOwnerPhone = document.getElementById('newOwnerPhone');
        const newOwnerPassword = document.getElementById('newOwnerPassword');
        
        if (newOwnerName) newOwnerName.required = true;
        if (newOwnerEmail) newOwnerEmail.required = true;
        if (newOwnerPhone) newOwnerPhone.required = true;
        if (newOwnerPassword) newOwnerPassword.required = true;
    }
}

function hideNewOwnerForm() {
    const newOwnerForm = document.getElementById('newOwnerForm');
    const ownerSelect = document.getElementById('restaurantOwnerId');
    if (newOwnerForm) {
        newOwnerForm.style.display = 'none';
        
        // Désactiver les champs required du formulaire owner pour éviter les erreurs de validation
        const newOwnerName = document.getElementById('newOwnerName');
        const newOwnerEmail = document.getElementById('newOwnerEmail');
        const newOwnerPhone = document.getElementById('newOwnerPhone');
        const newOwnerPassword = document.getElementById('newOwnerPassword');
        
        if (newOwnerName) {
            newOwnerName.required = false;
            newOwnerName.value = '';
        }
        if (newOwnerEmail) {
            newOwnerEmail.required = false;
            newOwnerEmail.value = '';
        }
        if (newOwnerPhone) {
            newOwnerPhone.required = false;
            newOwnerPhone.value = '';
        }
        if (newOwnerPassword) {
            newOwnerPassword.required = false;
            newOwnerPassword.value = '';
        }
        
        document.getElementById('createOwnerError').style.display = 'none';
        document.getElementById('createOwnerSuccess').style.display = 'none';
        
        if (ownerSelect) {
            ownerSelect.required = true;
        }
    }
}

async function handleCreateNewOwner() {
    const errorDiv = document.getElementById('createOwnerError');
    const successDiv = document.getElementById('createOwnerSuccess');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const name = document.getElementById('newOwnerName').value.trim();
    const email = document.getElementById('newOwnerEmail').value.trim();
    const phone = document.getElementById('newOwnerPhone').value.trim();
    const password = document.getElementById('newOwnerPassword').value;

    // Validation
    if (!name || !email || !phone || !password || password.length < 6) {
        showError(errorDiv, 'Veuillez remplir tous les champs. Le mot de passe doit contenir au moins 6 caractères.');
        return;
    }

    try {
        // Créer l'utilisateur via l'API /auth/register
        // Note: On utilise role='adminrestaurant' directement car il sera owner d'un restaurant
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                password,
                role: 'adminrestaurant' // Directement adminrestaurant car il sera owner
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const newUser = data.data.user;
            
            // Afficher le succès
            showSuccess(successDiv, `Utilisateur créé avec succès ! ID: ${newUser.id}`);
            
            // Ajouter le nouvel utilisateur au select
            const ownerSelect = document.getElementById('restaurantOwnerId');
            if (ownerSelect) {
                const option = document.createElement('option');
                option.value = newUser.id;
                option.textContent = `${newUser.name} (${newUser.email}) - Admin Restaurant`;
                option.selected = true;
                ownerSelect.appendChild(option);
            }
            
            // Cacher le formulaire de création
            setTimeout(() => {
                hideNewOwnerForm();
            }, 2000);
            
            showToast(`Utilisateur "${newUser.name}" créé avec succès !`, 'success');
        } else {
            showError(errorDiv, data.message || data.error || 'Erreur lors de la création de l\'utilisateur');
        }
    } catch (error) {
        console.error('Error creating owner:', error);
        showError(errorDiv, 'Erreur de connexion au serveur');
    }
}

// ============================================
// LOAD USERS FOR OWNER SELECTION
// ============================================
async function loadUsersForOwner() {
    const ownerSelect = document.getElementById('restaurantOwnerId');
    if (!ownerSelect) return;

    // Show loading
    ownerSelect.innerHTML = '<option value="">Chargement des utilisateurs...</option>';
    ownerSelect.disabled = true;

    try {
        // Utiliser la nouvelle route pour obtenir uniquement les utilisateurs disponibles
        const response = await fetch(`${API_BASE_URL}/superadmin/available-owners`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Clear select
            ownerSelect.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';

            // Add users to select
            data.data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                // Afficher le nom, l'email et le rôle actuel
                const roleLabel = user.role === 'superadmin' ? 'Super Admin' : 
                                 user.role === 'adminrestaurant' ? 'Admin Restaurant' : 
                                 user.role === 'customer' ? 'Client' : user.role;
                option.textContent = `${user.name} (${user.email}) - ${roleLabel}`;
                ownerSelect.appendChild(option);
            });

            ownerSelect.disabled = false;
        } else {
            ownerSelect.innerHTML = '<option value="">Erreur lors du chargement des utilisateurs</option>';
            console.error('Error loading users:', data.error || data.message);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        ownerSelect.innerHTML = '<option value="">Erreur de connexion au serveur</option>';
    }
}

// ============================================
// LOAD RESTAURANTS FOR APP GENERATION
// ============================================
async function loadRestaurantsForGeneration() {
    const restaurantSelect = document.getElementById('generateRestaurantId');
    if (!restaurantSelect) return;

    // Show loading
    restaurantSelect.innerHTML = '<option value="">Chargement des restaurants...</option>';
    restaurantSelect.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants?limit=100`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Clear select
            restaurantSelect.innerHTML = '<option value="">-- Sélectionner un restaurant --</option>';

            // Add restaurants to select
            data.data.forEach(restaurant => {
                const option = document.createElement('option');
                option.value = restaurant.id;
                
                // Indiquer si l'app existe déjà
                const appStatus = restaurant.hasAppGenerated ? ' ✅ (App déjà générée)' : '';
                option.textContent = `${restaurant.name} (ID: ${restaurant.id}) - ${restaurant.email || 'Pas d\'email'}${appStatus}`;
                
                // Stocker l'info dans l'attribut data pour référence
                option.dataset.hasApp = restaurant.hasAppGenerated || false;
                
                restaurantSelect.appendChild(option);
            });

            restaurantSelect.disabled = false;
        } else {
            restaurantSelect.innerHTML = '<option value="">Erreur lors du chargement des restaurants</option>';
            console.error('Error loading restaurants:', data.error || data.message);
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
        restaurantSelect.innerHTML = '<option value="">Erreur de connexion au serveur</option>';
    }
}

// ============================================
// GENERATE CLIENT APP
// ============================================
async function handleGenerateApp(e) {
    e.preventDefault();
    
    console.log('[GENERATE APP] 🚀 Début de la génération de l\'app...');

    const errorDiv = document.getElementById('generateAppError');
    const successDiv = document.getElementById('generateAppSuccess');
    const outputDiv = document.getElementById('generateAppOutput');
    const generateBtn = document.getElementById('generateAppBtn');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    outputDiv.style.display = 'none';

    const restaurantId = parseInt(document.getElementById('generateRestaurantId').value);
    const primaryColor = document.getElementById('generatePrimaryColor').value;
    const secondaryColor = document.getElementById('generateSecondaryColor').value;
    const apiUrl = document.getElementById('generateApiUrl')?.value.trim() || 'http://localhost:5000/api';
    const stripeKey = document.getElementById('generateStripeKey')?.value.trim() || '';
    const wifiIp = document.getElementById('generateWifiIp')?.value.trim() || '';
    const autoInstall = document.getElementById('autoInstallDeps')?.checked || false;

    // Validation
    if (!restaurantId || isNaN(restaurantId)) {
        showError(errorDiv, 'Veuillez sélectionner un restaurant');
        return;
    }
    
    // Validation du format de l'URL API (si fournie)
    if (apiUrl && apiUrl.trim()) {
        try {
            new URL(apiUrl);
        } catch (e) {
            showError(errorDiv, 'Format d\'URL API invalide. Exemple: https://api.votredomaine.com/api ou http://localhost:5000/api');
            return;
        }
    }
    
    // Validation du format de la clé Stripe si fournie
    if (stripeKey && !stripeKey.startsWith('pk_test_') && !stripeKey.startsWith('pk_live_')) {
        showError(errorDiv, 'Format de clé Stripe invalide. La clé doit commencer par "pk_test_" (test) ou "pk_live_" (production)');
        return;
    }

    // Vérifier si l'app existe déjà
    const restaurantSelect = document.getElementById('generateRestaurantId');
    const selectedOption = restaurantSelect.options[restaurantSelect.selectedIndex];
    const hasAppAlready = selectedOption && selectedOption.dataset.hasApp === 'true';

    // Avertir si l'app existe déjà
    if (hasAppAlready) {
        const confirmRegenerate = confirm(
            '⚠️ Une app a déjà été générée pour ce restaurant.\n\n' +
            'Si vous continuez, l\'ancienne app sera remplacée.\n\n' +
            'Voulez-vous continuer ?'
        );
        
        if (!confirmRegenerate) {
            return;
        }
    }

    // Désactiver le bouton pendant la génération
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Génération en cours...';
    }

    // Afficher le output
    outputDiv.style.display = 'block';
    outputDiv.textContent = '⏳ Génération de l\'app en cours...\n\n';

    try {
        // Récupérer les infos du restaurant depuis la liste
        const restaurantsResponse = await fetch(`${API_BASE_URL}/superadmin/restaurants?limit=100`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const restaurantsData = await restaurantsResponse.json();
        
        if (!restaurantsResponse.ok || !restaurantsData.success) {
            throw new Error('Impossible de récupérer les informations du restaurant');
        }

        // Trouver le restaurant dans la liste
        const restaurant = restaurantsData.data.find(r => r.id === restaurantId);
        
        if (!restaurant) {
            throw new Error('Restaurant non trouvé');
        }
        
        // Générer l'app
        const response = await fetch(`${API_BASE_URL}/superadmin/generate-app`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                restaurantName: restaurant.name,
                restaurantId: restaurant.id,
                email: restaurant.email,
                primaryColor,
                secondaryColor,
                apiUrl,
                stripePublishableKey: stripeKey,
                wifiIp,
                autoInstall: autoInstall
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Afficher le succès
            const wasRegenerated = data.data.wasRegenerated;
            const npmInstalled = data.data.npmInstalled;
            const npmInstallSuccess = data.data.npmInstallSuccess;
            
            let successMessage = wasRegenerated
                ? `App régénérée avec succès pour ${data.data.restaurantName} !\n\nChemin: ${data.data.appPath}\nSlug: ${data.data.slug}\n\n⚠️ L'ancienne app a été remplacée.`
                : `App générée avec succès pour ${data.data.restaurantName} !\n\nChemin: ${data.data.appPath}\nSlug: ${data.data.slug}`;
            
            if (npmInstalled) {
                if (npmInstallSuccess) {
                    successMessage += `\n\n✅ Dépendances npm installées automatiquement avec succès !`;
                } else {
                    successMessage += `\n\n⚠️ Installation npm automatique échouée. Vous devrez exécuter "npm install" manuellement.`;
                }
            }
            
            showSuccess(successDiv, successMessage);
            
            // Afficher la sortie du script
            let outputText = data.data.output || 'App générée avec succès !';
            if (npmInstalled && data.data.installOutput) {
                outputText += '\n\n--- Installation npm ---\n' + data.data.installOutput;
            }
            outputDiv.textContent = outputText;
            outputDiv.style.color = '#4caf50';
            
            const toastMessage = wasRegenerated
                ? `App régénérée avec succès pour ${data.data.restaurantName} !${npmInstalled && npmInstallSuccess ? ' (npm installé)' : ''}`
                : `App générée avec succès pour ${data.data.restaurantName} !${npmInstalled && npmInstallSuccess ? ' (npm installé)' : ''}`;
            showToast(toastMessage, 'success');
            
            // Recharger la liste des restaurants pour mettre à jour les statuts
            loadRestaurantsForGeneration();
        } else {
            showError(errorDiv, data.error || 'Erreur lors de la génération de l\'app');
            if (data.stderr) {
                outputDiv.textContent = `Erreur:\n${data.stderr}`;
                outputDiv.style.color = '#f44336';
            }
        }
    } catch (error) {
        console.error('Error generating app:', error);
        showError(errorDiv, 'Erreur de connexion au serveur');
        outputDiv.textContent = `Erreur: ${error.message}`;
        outputDiv.style.color = '#f44336';
    } finally {
        // Réactiver le bouton
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = '🚀 Générer l\'App';
        }
    }
}

// ============================================
// RESTAURANT ACTIONS
// ============================================
async function viewRestaurantStats(restaurantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants/${restaurantId}/stats`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            openStatsModal(data.data);
        } else {
            showToast(data.error || 'Erreur lors du chargement des statistiques', 'error');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

async function editRestaurantSubscription(restaurantId) {
    const plan = prompt('Nouveau plan (free, starter, pro, enterprise):');
    if (!plan) return;

    const status = prompt('Nouveau statut (active, inactive, trial, cancelled):');
    if (!status) return;

    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants/${restaurantId}/subscription`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                subscriptionPlan: plan,
                subscriptionStatus: status
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Abonnement mis à jour avec succès', 'success');
            loadRestaurants(currentPage);
        } else {
            showToast(data.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error updating subscription:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

async function editRestaurantLogo(restaurantId, currentLogo) {
    const logoUrl = prompt('Entrez l\'URL du logo du restaurant:', currentLogo || '');
    
    if (logoUrl === null) {
        return; // Annulé par l'utilisateur
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants/${restaurantId}/logo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ logo: logoUrl.trim() || null })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast(data.message || 'Logo mis à jour avec succès', 'success');
            loadRestaurants(currentPage);
        } else {
            showToast(data.error || 'Erreur lors de la mise à jour du logo', 'error');
        }
    } catch (error) {
        console.error('Error updating logo:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

window.editRestaurantTheme = async function(restaurantId, buttonElement) {
    console.log('editRestaurantTheme called with restaurantId:', restaurantId);
    
    // Fonction pour normaliser une couleur (s'assurer qu'elle est en format hexadécimal valide)
    const normalizeColor = (color, defaultValue) => {
        if (!color || typeof color !== 'string') return defaultValue;
        // Si la couleur commence par #, la retourner telle quelle
        if (color.startsWith('#')) {
            // S'assurer que c'est en format #RRGGBB (6 caractères après #)
            if (color.length === 4) {
                // Convertir #RGB en #RRGGBB
                return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
            }
            return color.length === 7 ? color : defaultValue;
        }
        return defaultValue;
    };
    
    // Récupérer le thème depuis le data attribute
    let currentTheme = {};
    
    if (buttonElement && buttonElement.dataset.theme) {
        try {
            currentTheme = JSON.parse(buttonElement.dataset.theme);
            console.log('Theme loaded from data attribute:', currentTheme);
        } catch (e) {
            console.error('Error parsing theme data:', e);
        }
    } else {
        console.log('No theme data found in button element');
    }
    
    // Valeurs par défaut
    const defaults = {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
        text: { primary: '#333333', secondary: '#666666', tertiary: '#999999' },
        background: { light: '#f5f5f5', lighter: '#fafafa', border: '#eeeeee', white: '#ffffff' }
    };
    
    // Construire le thème avec normalisation des couleurs
    const theme = {
        primary: normalizeColor(currentTheme.primary, defaults.primary),
        secondary: normalizeColor(currentTheme.secondary, defaults.secondary),
        error: normalizeColor(currentTheme.error, defaults.error),
        success: normalizeColor(currentTheme.success, defaults.success),
        warning: normalizeColor(currentTheme.warning, defaults.warning),
        text: {
            primary: normalizeColor(currentTheme.text?.primary, defaults.text.primary),
            secondary: normalizeColor(currentTheme.text?.secondary, defaults.text.secondary),
            tertiary: normalizeColor(currentTheme.text?.tertiary, defaults.text.tertiary),
        },
        background: {
            light: normalizeColor(currentTheme.background?.light, defaults.background.light),
            lighter: normalizeColor(currentTheme.background?.lighter, defaults.background.lighter),
            border: normalizeColor(currentTheme.background?.border, defaults.background.border),
            white: normalizeColor(currentTheme.background?.white, defaults.background.white),
        }
    };
    
    console.log('Normalized theme:', theme);
    
    // Créer un modal avec onglets pour organiser les couleurs
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>🎨 Modifier les couleurs du thème</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <!-- Onglets -->
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid ${theme.background.border};">
                    <button class="theme-tab-btn active" onclick="switchThemeTab('basic')" data-tab="basic">Couleurs principales</button>
                    <button class="theme-tab-btn" onclick="switchThemeTab('status')" data-tab="status">Statuts</button>
                    <button class="theme-tab-btn" onclick="switchThemeTab('text')" data-tab="text">Textes</button>
                    <button class="theme-tab-btn" onclick="switchThemeTab('background')" data-tab="background">Arrière-plans</button>
                </div>
                
                <!-- Onglet: Couleurs principales -->
                <div id="themeTab-basic" class="theme-tab-content active">
                    <div class="form-group">
                        <label for="themePrimaryColor">Couleur primaire</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themePrimaryColor" value="${theme.primary}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themePrimaryColorText" value="${theme.primary}" placeholder="#FF6B6B" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur principale de l'app (boutons, header, liens, etc.)</small>
                    </div>
                    <div class="form-group">
                        <label for="themeSecondaryColor">Couleur secondaire</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeSecondaryColor" value="${theme.secondary}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeSecondaryColorText" value="${theme.secondary}" placeholder="#4ECDC4" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur secondaire de l'app (accents, éléments secondaires)</small>
                    </div>
                </div>
                
                <!-- Onglet: Statuts -->
                <div id="themeTab-status" class="theme-tab-content" style="display: none;">
                    <div class="form-group">
                        <label for="themeErrorColor">Couleur d'erreur</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeErrorColor" value="${theme.error}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeErrorColorText" value="${theme.error}" placeholder="#ef4444" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les erreurs, suppressions, annulations</small>
                    </div>
                    <div class="form-group">
                        <label for="themeSuccessColor">Couleur de succès</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeSuccessColor" value="${theme.success}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeSuccessColorText" value="${theme.success}" placeholder="#10b981" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les actions réussies, confirmations</small>
                    </div>
                    <div class="form-group">
                        <label for="themeWarningColor">Couleur d'avertissement</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeWarningColor" value="${theme.warning}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeWarningColorText" value="${theme.warning}" placeholder="#f59e0b" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les avertissements, notifications importantes</small>
                    </div>
                </div>
                
                <!-- Onglet: Textes -->
                <div id="themeTab-text" class="theme-tab-content" style="display: none;">
                    <div class="form-group">
                        <label for="themeTextPrimaryColor">Texte principal</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeTextPrimaryColor" value="${theme.text.primary}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeTextPrimaryColorText" value="${theme.text.primary}" placeholder="#333" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les titres et textes principaux</small>
                    </div>
                    <div class="form-group">
                        <label for="themeTextSecondaryColor">Texte secondaire</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeTextSecondaryColor" value="${theme.text.secondary}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeTextSecondaryColorText" value="${theme.text.secondary}" placeholder="#666" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les sous-titres et descriptions</small>
                    </div>
                    <div class="form-group">
                        <label for="themeTextTertiaryColor">Texte tertiaire</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeTextTertiaryColor" value="${theme.text.tertiary}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeTextTertiaryColorText" value="${theme.text.tertiary}" placeholder="#999" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les textes désactivés, placeholders</small>
                    </div>
                </div>
                
                <!-- Onglet: Arrière-plans -->
                <div id="themeTab-background" class="theme-tab-content" style="display: none;">
                    <div class="form-group">
                        <label for="themeBackgroundLightColor">Arrière-plan clair</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeBackgroundLightColor" value="${theme.background.light}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeBackgroundLightColorText" value="${theme.background.light}" placeholder="#f5f5f5" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Arrière-plan principal des pages</small>
                    </div>
                    <div class="form-group">
                        <label for="themeBackgroundLighterColor">Arrière-plan très clair</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeBackgroundLighterColor" value="${theme.background.lighter}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeBackgroundLighterColorText" value="${theme.background.lighter}" placeholder="#fafafa" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Arrière-plan des inputs et cartes</small>
                    </div>
                    <div class="form-group">
                        <label for="themeBackgroundBorderColor">Couleur des bordures</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeBackgroundBorderColor" value="${theme.background.border}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeBackgroundBorderColorText" value="${theme.background.border}" placeholder="#eee" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les bordures et séparateurs</small>
                    </div>
                    <div class="form-group">
                        <label for="themeBackgroundWhiteColor">Arrière-plan blanc</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="themeBackgroundWhiteColor" value="${theme.background.white}" style="width: 60px; height: 40px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <input type="text" id="themeBackgroundWhiteColorText" value="${theme.background.white}" placeholder="#fff" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small class="form-hint">Couleur pour les cartes, modals et éléments blancs</small>
                    </div>
                </div>
                
                <div id="themeError" class="error-message" style="display: none; margin-top: 10px;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                <button class="btn-primary" onclick="saveRestaurantTheme(${restaurantId})">💾 Enregistrer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fonction pour changer d'onglet
    window.switchThemeTab = function(tabName) {
        // Masquer tous les onglets
        document.querySelectorAll('.theme-tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        document.querySelectorAll('.theme-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Afficher l'onglet sélectionné
        document.getElementById(`themeTab-${tabName}`).style.display = 'block';
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    };
    
    // Synchroniser tous les inputs color et text
    const colorInputs = [
        { id: 'themePrimaryColor', textId: 'themePrimaryColorText' },
        { id: 'themeSecondaryColor', textId: 'themeSecondaryColorText' },
        { id: 'themeErrorColor', textId: 'themeErrorColorText' },
        { id: 'themeSuccessColor', textId: 'themeSuccessColorText' },
        { id: 'themeWarningColor', textId: 'themeWarningColorText' },
        { id: 'themeTextPrimaryColor', textId: 'themeTextPrimaryColorText' },
        { id: 'themeTextSecondaryColor', textId: 'themeTextSecondaryColorText' },
        { id: 'themeTextTertiaryColor', textId: 'themeTextTertiaryColorText' },
        { id: 'themeBackgroundLightColor', textId: 'themeBackgroundLightColorText' },
        { id: 'themeBackgroundLighterColor', textId: 'themeBackgroundLighterColorText' },
        { id: 'themeBackgroundBorderColor', textId: 'themeBackgroundBorderColorText' },
        { id: 'themeBackgroundWhiteColor', textId: 'themeBackgroundWhiteColorText' },
    ];
    
    colorInputs.forEach(({ id, textId }) => {
        const colorInput = document.getElementById(id);
        const textInput = document.getElementById(textId);
        
        if (colorInput && textInput) {
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value.toUpperCase();
            });
            
            textInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    colorInput.value = value;
                }
            });
        }
    });
}

window.saveRestaurantTheme = async function(restaurantId) {
    const errorDiv = document.getElementById('themeError');
    
    // Récupérer toutes les couleurs
    const themeData = {
        primaryColor: document.getElementById('themePrimaryColor')?.value,
        secondaryColor: document.getElementById('themeSecondaryColor')?.value,
        errorColor: document.getElementById('themeErrorColor')?.value,
        successColor: document.getElementById('themeSuccessColor')?.value,
        warningColor: document.getElementById('themeWarningColor')?.value,
        textPrimaryColor: document.getElementById('themeTextPrimaryColor')?.value,
        textSecondaryColor: document.getElementById('themeTextSecondaryColor')?.value,
        textTertiaryColor: document.getElementById('themeTextTertiaryColor')?.value,
        backgroundLightColor: document.getElementById('themeBackgroundLightColor')?.value,
        backgroundLighterColor: document.getElementById('themeBackgroundLighterColor')?.value,
        backgroundBorderColor: document.getElementById('themeBackgroundBorderColor')?.value,
        backgroundWhiteColor: document.getElementById('themeBackgroundWhiteColor')?.value,
    };
    
    // Validation
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    for (const [key, value] of Object.entries(themeData)) {
        if (value && !hexColorRegex.test(value)) {
            errorDiv.textContent = `${key} invalide. Format attendu: #RRGGBB (ex: #FF6B6B)`;
            errorDiv.style.display = 'block';
            return;
        }
    }
    
    // Convertir en majuscules et filtrer les valeurs vides
    const payload = {};
    for (const [key, value] of Object.entries(themeData)) {
        if (value) {
            payload[key] = value.toUpperCase();
        }
    }
    
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants/${restaurantId}/theme`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast(data.message || 'Couleurs du thème mises à jour avec succès', 'success');
            document.querySelector('.modal').remove();
            loadRestaurants(currentPage);
        } else {
            errorDiv.textContent = data.error || 'Erreur lors de la mise à jour des couleurs';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error updating theme:', error);
        errorDiv.textContent = 'Erreur de connexion au serveur';
        errorDiv.style.display = 'block';
    }
}

async function toggleRestaurantStatus(restaurantId, currentStatus) {
    if (!confirm(`Êtes-vous sûr de vouloir ${currentStatus ? 'désactiver' : 'activer'} ce restaurant ?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants/${restaurantId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast(data.message || 'Statut mis à jour avec succès', 'success');
            loadRestaurants(currentPage);
        } else {
            showToast(data.error || 'Erreur lors de la mise à jour', 'error');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

async function deleteRestaurant(restaurantId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce restaurant ? Cette action est irréversible.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/superadmin/restaurants/${restaurantId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Restaurant supprimé avec succès', 'success');
            loadRestaurants(currentPage);
        } else {
            showToast(data.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

// ============================================
// MODAL
// ============================================
function openStatsModal(stats) {
    const modal = document.getElementById('restaurantModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `Statistiques - ${stats.restaurantName}`;
    
    modalBody.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Total Commandes</span>
                    <span class="stat-icon">📦</span>
                </div>
                <div class="stat-value">${stats.totalOrders}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Commandes Ce Mois</span>
                    <span class="stat-icon">📊</span>
                </div>
                <div class="stat-value">${stats.ordersThisMonth}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Commandes Cette Semaine</span>
                    <span class="stat-icon">📅</span>
                </div>
                <div class="stat-value">${stats.ordersThisWeek}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Revenu Total</span>
                    <span class="stat-icon">💰</span>
                </div>
                <div class="stat-value">${parseFloat(stats.totalRevenue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Revenu Ce Mois</span>
                    <span class="stat-icon">💵</span>
                </div>
                <div class="stat-value">${parseFloat(stats.revenueThisMonth).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Nombre de Plats</span>
                    <span class="stat-icon">🍽️</span>
                </div>
                <div class="stat-value">${stats.menuItemsCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Clients Distincts</span>
                    <span class="stat-icon">👥</span>
                </div>
                <div class="stat-value">${stats.customersCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Note Moyenne</span>
                    <span class="stat-icon">⭐</span>
                </div>
                <div class="stat-value">${parseFloat(stats.averageRating).toFixed(2)}</div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('restaurantModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// UTILITIES
// ============================================
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function showSuccess(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.marginTop = '15px';
        element.style.marginBottom = '15px';
        console.log('[SHOW SUCCESS] ✅ Message affiché:', message);
    } else {
        console.error('[SHOW SUCCESS] ❌ Élément non trouvé pour afficher le succès');
    }
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Expose functions to global scope for onclick handlers
window.viewRestaurantStats = viewRestaurantStats;
window.editRestaurantSubscription = editRestaurantSubscription;
window.toggleRestaurantStatus = toggleRestaurantStatus;
window.deleteRestaurant = deleteRestaurant;
window.loadRestaurants = loadRestaurants;

