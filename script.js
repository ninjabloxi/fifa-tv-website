// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyA0wGD-T7bzHGuSu7qxw7qEe-tExpqz0p4",
  authDomain: "fifa-tv-database.firebaseapp.com",
  projectId: "fifa-tv-database",
  storageBucket: "fifa-tv-database.firebasestorage.app",
  messagingSenderId: "916734081043",
  appId: "1:916734081043:web:13a741a8747ace5d3ee7e6",
  measurementId: "G-P89G4BDBWX"
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

// --- LANGUES DISPONIBLES ---
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

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // 1) INDEX.HTML LOGIC
    if (path.includes('index.html') || path === '/' || path.endsWith('/FIFA-TV/')) {
        const splashContainer = document.getElementById('splashContainer');
        const langModal = document.getElementById('langModal');
        const langGrid = document.getElementById('langGrid');
        const langConfirmBtn = document.getElementById('langConfirmBtn');

        let selectedLang = localStorage.getItem('fifa_tv_lang');

        // Remplissage des langues
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
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 800);
            }
        });

        // Séquence Splash -> Langue ou Login
        setTimeout(() => {
            if (selectedLang) {
                // Déjà choisi, transition directe vers login
                splashContainer.classList.add('splash-fade-out');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 800);
            } else {
                // Premier lancement : afficher modal langue
                langModal.classList.add('active');
            }
        }, 1800);
    }

    // 2) LOGIN.HTML LOGIC
    if (path.includes('login.html')) {
        const googleLoginBtn = document.getElementById('googleLoginBtn');

        googleLoginBtn.addEventListener('click', async () => {
            if (!auth) {
                // Mode simulation si Firebase non configuré
                alert("Firebase non configuré. Simulation de connexion Google réussie !");
                localStorage.setItem('fifa_tv_user', JSON.stringify({
                    displayName: "Utilisateur FIFA",
                    email: "user@fifatv.com"
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

    // 3) HOME.HTML LOGIC
    if (path.includes('home.html')) {
        const userNameDisplay = document.getElementById('userNameDisplay');
        const logoutBtn = document.getElementById('logoutBtn');
        const navTabs = document.querySelectorAll('.nav-tab');
        const sections = document.querySelectorAll('.content-section');

        // Vérification session utilisateur
        const userData = JSON.parse(localStorage.getItem('fifa_tv_user'));
        if (userData && userData.displayName) {
            userNameDisplay.textContent = userData.displayName;
        }

        // Déconnexion
        logoutBtn.addEventListener('click', async () => {
            if (auth) {
                try {
                    await auth.signOut();
                } catch(e) { console.error(e); }
            }
            localStorage.removeItem('fifa_tv_user');
            window.location.href = 'login.html';
        });

        // Navigation par onglets
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const target = tab.dataset.target;
                sections.forEach(sec => {
                    if (target === 'cat-all') {
                        sec.style.display = 'block';
                    } else if (sec.id === 'section-' + target.replace('cat-', '')) {
                        sec.style.display = 'block';
                    } else {
                        sec.style.display = 'none';
                    }
                });
            });
        });
    }
});
