// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// Initialisation Firebase si configuré
let auth = null;
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
    }
} catch (e) {
    console.warn("Firebase non initialisé - mode simulation disponible", e);
}

// --- CONFIGURATION MONGODB ATLAS / API ---
const MONGODB_API_URL = "VOTRE_ENDPOINT_MONGODB_API"; 

// --- LANGUES DISPONIBLES (index.html) ---
const LANGUAGES = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' }
];

// --- FORMATAGE DU TEMPS ÉCOULÉ ---
function formatTimeAgo(timestamp) {
    if (!timestamp) return "Récemment";
    const now = new Date();
    const past = new Date(timestamp);
    const diffSeconds = Math.floor((now - past) / 1000);

    const minutes = Math.floor(diffSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const years = Math.floor(days / 365);

    if (years >= 1) {
        return `Mis en ligne il y a ${years} ${years > 1 ? 'ans' : 'an'}`;
    } else if (days >= 1) {
        return `Mis en ligne il y a ${days} ${days > 1 ? 'jours' : 'jour'}`;
    } else if (hours >= 1) {
        return `Mis en ligne il y a ${hours} ${hours > 1 ? 'heures' : 'heure'}`;
    } else if (minutes >= 1) {
        return `Mis en ligne il y a ${minutes} min`;
    } else {
        return "À l'instant";
    }
}

// --- DÉTECTION LIEN YOUTUBE OU CLASSIQUE ---
function getEmbedPlayer(url) {
    let youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    let match = url.match(youtubeRegex);
    if (match && match[1]) {
        return `<iframe width="100%" height="180" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
    } else {
        return `<a href="${url}" target="_blank" class="external-video-link" style="color: #0a84ff; text-decoration: none; font-weight: 600;">🔗 Voir la vidéo externe</a>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // 1) INDEX.HTML LOGIC (Splash & Langues)
    if (path.includes('index.html') || path === '/' || path.endsWith('/FIFA-TV/')) {
        const splashContainer = document.getElementById('splashContainer');
        const langModal = document.getElementById('langModal');
        const langGrid = document.getElementById('langGrid');
        const langConfirmBtn = document.getElementById('langConfirmBtn');

        let selectedLang = localStorage.getItem('fifa_tv_lang');

        LANGUAGES.forEach(lang => {
            const btn = document.createElement('button');
            btn.className = 'lang-option';
            btn.textContent = lang.name;
            btn.dataset.code = lang.code;
            if (selectedLang === lang.code) {
                btn.classList.add('selected');
                langConfirmBtn.disabled = false;
            }
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lang-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedLang = lang.code;
                langConfirmBtn.disabled = false;
            });
            langGrid.appendChild(btn);
        });

        langConfirmBtn.addEventListener('click', () => {
            if (selectedLang) {
                localStorage.setItem('fifa_tv_lang', selectedLang);
                langModal.classList.remove('active');
                splashContainer.classList.add('splash-fade-out');
                setTimeout(() => { window.location.href = 'login.html'; }, 800);
            }
        });

        setTimeout(() => {
            if (selectedLang) {
                splashContainer.classList.add('splash-fade-out');
                setTimeout(() => { window.location.href = 'login.html'; }, 800);
            } else {
                langModal.classList.add('active');
            }
        }, 1800);
    }

    // 2) LOGIN.HTML LOGIC (Firebase Google Login)
    if (path.includes('login.html')) {
        const googleLoginBtn = document.getElementById('googleLoginBtn');

        googleLoginBtn.addEventListener('click', async () => {
            if (!auth) {
                alert("Firebase non configuré. Simulation de connexion Google réussie !");
                localStorage.setItem('fifa_tv_user', JSON.stringify({
                    displayName: "Clément Cochie (Simulé)",
                    email: "clementcochie@gmail.com"
                }));
                window.location.href = 'home.html';
                return;
            }

            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                const result = await auth.signInWithPopup(provider);
                const user = result.user;
                localStorage.setItem('fifa_tv_user', JSON.stringify({
                    displayName: user.displayName || "Utilisateur FIFA",
                    email: user.email
                }));
                window.location.href = 'home.html';
            } catch (error) {
                console.error("Erreur de connexion Google:", error);
                alert("Échec de la connexion Google : " + error.message);
            }
        });
    }

    // 3) HOME.HTML LOGIC (Admin, MongoDB, Vidéos, Catégories)
    if (path.includes('home.html')) {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminFabBtn = document.getElementById('adminFabBtn');
        const adminModal = document.getElementById('adminModal');
        const closeAdminModal = document.getElementById('closeAdminModal');
        const addVideoForm = document.getElementById('addVideoForm');
        const createCatBtn = document.getElementById('createCatBtn');
        const newCatNameInput = document.getElementById('newCatName');

        // Récupération de l'utilisateur connecté
        const userData = JSON.parse(localStorage.getItem('fifa_tv_user')) || { email: "", displayName: "Visiteur" };
        userNameDisplay.textContent = userData.displayName;

        // Restriction stricte de l'Admin pour clementcochie@gmail.com
        const ADMIN_EMAIL = "clementcochie@gmail.com";
        if (userData.email && userData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            if (adminFabBtn) adminFabBtn.style.display = 'flex';
        }

        // Ouverture / Fermeture modale Admin
        if (adminFabBtn) {
            adminFabBtn.addEventListener('click', () => adminModal.classList.add('active'));
            closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
        }

        // Onglets de la modale Admin
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Déconnexion Firebase & Locale
        logoutBtn.addEventListener('click', async () => {
            if (auth) {
                try { await auth.signOut(); } catch(e) { console.error(e); }
            }
            localStorage.removeItem('fifa_tv_user');
            window.location.href = 'login.html';
        });

        // Charger les données depuis MongoDB (avec persistance locale de secours)
        loadMongoDBData();

        // Créer une catégorie
        if (createCatBtn) {
            createCatBtn.addEventListener('click', () => {
                const catName = newCatNameInput.value.trim();
                if (!catName) return;
                
                let categories = JSON.parse(localStorage.getItem('fifa_tv_cats')) || ["Actualités", "Matchs Historiques", "Interviews"];
                if (!categories.includes(catName)) {
                    categories.push(catName);
                    localStorage.setItem('fifa_tv_cats', JSON.stringify(categories));
                    newCatNameInput.value = '';
                    loadMongoDBData();
                } else {
                    alert("Cette catégorie existe déjà.");
                }
            });
        }

        // Ajouter une vidéo
        if (addVideoForm) {
            addVideoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const title = document.getElementById('videoTitle').value;
                const thumbnail = document.getElementById('videoThumb').value;
                const category = document.getElementById('videoCategorySelect').value;
                const link = document.getElementById('videoLink').value;

                let videos = JSON.parse(localStorage.getItem('fifa_tv_videos')) || [];
                const newVideo = {
                    id: 'vid_' + Date.now(),
                    title,
                    thumbnail,
                    category,
                    link,
                    createdAt: new Date().toISOString()
                };

                videos.unshift(newVideo);
                localStorage.setItem('fifa_tv_videos', JSON.stringify(videos));

                addVideoForm.reset();
                adminModal.classList.remove('active');
                loadMongoDBData();
            });
        }
    }
});

// --- SYNCHRONISATION ET RENDU (MONGODB / LOCAL) ---
function loadMongoDBData() {
    let categories = JSON.parse(localStorage.getItem('fifa_tv_cats')) || ["Actualités", "Matchs Historiques", "Interviews"];
    let videos = JSON.parse(localStorage.getItem('fifa_tv_videos')) || [];

    // Connexion MongoDB Atlas optionnelle par API REST
    /*
    fetch(MONGODB_API_URL + '/getData')
        .then(res => res.json())
        .then(data => {
            categories = data.categories;
            videos = data.videos;
            renderAll(categories, videos);
        }).catch(() => renderAll(categories, videos));
    */
    renderAll(categories, videos);
}

function renderAll(categories, videos) {
    renderCategoriesNav(categories);
    renderCategoryDropdown(categories);
    renderAdminCategories(categories);
    renderVideosGrid(videos);
}

function renderCategoriesNav(categories) {
    const nav = document.getElementById('categoriesNav');
    if (!nav) return;

    let html = `
        <button class="nav-tab active" data-target="cat-all">Tout</button>
        <button class="nav-tab" data-target="cat-channels">Chaînes TV</button>
        <button class="nav-tab" data-target="cat-matches">Matchs en Direct</button>
        <button class="nav-tab" data-target="cat-favorites">Favoris</button>
    `;
    categories.forEach(cat => {
        let slug = 'cat-' + cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
        html += `<button class="nav-tab" data-target="${slug}">${cat}</button>`;
    });
    nav.innerHTML = html;

    // Gestion du clic sur les onglets de filtrage
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.dataset.target;
            const grid = document.getElementById('dynamicVideosGrid');
            let videos = JSON.parse(localStorage.getItem('fifa_tv_videos')) || [];

            if (target === 'cat-all' || target === 'cat-channels' || target === 'cat-matches' || target === 'cat-favorites') {
                // Afficher l'ensemble ou sections de base
                renderVideosGrid(videos);
            } else {
                // Filtrer par catégorie dynamique
                let catName = categories.find(c => 'cat-' + c.toLowerCase().replace(/[^a-z0-9]/g, '-') === target);
                let filtered = videos.filter(v => v.category === catName);
                renderVideosGrid(filtered);
            }
        });
    });
}

function renderCategoryDropdown(categories) {
    const select = document.getElementById('videoCategorySelect');
    if (!select) return;
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderAdminCategories(categories) {
    const container = document.getElementById('categoriesListAdmin');
    if (!container) return;
    container.innerHTML = categories.map(c => `
        <div class="cat-admin-row">
            <span>${c}</span>
            <button onclick="deleteCategory('${c}')" class="delete-cat-btn">Supprimer</button>
        </div>
    `).join('');
}

function renderVideosGrid(videos) {
    const grid = document.getElementById('dynamicVideosGrid');
    if (!grid) return;

    const userData = JSON.parse(localStorage.getItem('fifa_tv_user')) || {};
    const isAdmin = userData.email && userData.email.toLowerCase() === "clementcochie@gmail.com";

    if (videos.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1; padding: 20px;">Aucune vidéo publiée pour le moment.</p>';
        return;
    }

    grid.innerHTML = videos.map(v => `
        <div class="stream-card" data-id="${v.id}">
            <div class="card-thumbnail" style="background-image: url('${v.thumbnail}')">
                <span class="time-ago-badge">${formatTimeAgo(v.createdAt)}</span>
            </div>
            <div class="stream-info">
                <h3>${v.title}</h3>
                <p style="font-size: 12px; color: var(--accent-blue); margin-bottom: 10px;">Catégorie : ${v.category}</p>
                <div class="player-wrapper">
                    ${getEmbedPlayer(v.link)}
                </div>
                ${isAdmin ? `<button onclick="deleteVideo('${v.id}')" class="delete-video-btn">Supprimer la vidéo</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Fonctions globales de suppression admin (reliées à MongoDB / LocalStorage)
window.deleteVideo = function(id) {
    if (confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
        let videos = JSON.parse(localStorage.getItem('fifa_tv_videos')) || [];
        videos = videos.filter(v => v.id !== id);
        localStorage.setItem('fifa_tv_videos', JSON.stringify(videos));
        loadMongoDBData();
    }
};

window.deleteCategory = function(catName) {
    if (confirm(`Voulez-vous supprimer la catégorie "${catName}" ?`)) {
        let categories = JSON.parse(localStorage.getItem('fifa_tv_cats')) || [];
        categories = categories.filter(c => c !== catName);
        localStorage.setItem('fifa_tv_cats', JSON.stringify(categories));
        loadMongoDBData();
    }
};
