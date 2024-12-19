import {updateLastRefresh} from './script.js';

// Fonction pour vérifier si une heure est passée
function checkIfOneHourPassed() {
    const lastRefresh = localStorage.getItem('lastRefresh');
    if (lastRefresh) {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // Obtenir la date actuelle (AAAA-MM-JJ)

        // Ajouter la date au dernier rafraîchissement
        const lastRefreshDateTime = new Date(`${today}T${lastRefresh}`);
        // Différence en millisecondes
        const diffInMs = now - lastRefreshDateTime;

        // Convertir en heures
        const diffInHours = diffInMs / (1000 * 60 *60);

        if (diffInHours >= 1) { // Vérifie si 1 heure ou plus s'est écoulée
            console.log('Une heure s\'est écoulée depuis le dernier rafraîchissement.');
            showPopup(); // Affiche la popup
        }
    }
}

// Fonction pour afficher la popup
function showPopup() {
    const popup = document.getElementById('refresh-popup');
    popup.style.display = 'flex'; // Affiche la popup

    // Gérer les actions des boutons
    document.getElementById('refresh-yes').addEventListener('click', () => {
        updateLastRefresh(); // Met à jour l'heure
        location.reload();   // Recharge la page
    });

    document.getElementById('refresh-no').addEventListener('click', () => {
        popup.style.display = 'none'; // Cache la popup

        const now = new Date();
        const formattedTime = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
        localStorage.setItem('lastRefresh', formattedTime);
    });
}

// Lors du clic sur un lien de navigation
document.querySelectorAll('#nav a').forEach(link => {
    link.addEventListener('click', function (event) {
        if (!this.classList.contains('active')) {
            event.preventDefault(); // Empêche la navigation par défaut

            const popup = document.getElementById('leave-popup');
            popup.style.display = 'flex'; // Affiche la popup

            // Gérer les actions des boutons
            document.getElementById('leave-yes').addEventListener('click', () => {

                popup.style.display = 'none'; // Cache la popup
                const pageName = this.textContent.toUpperCase();
                document.getElementById('gestcom').textContent = pageName;

                if (pageName !== 'ACCUEIL' && pageName !== 'GESTCOM' && pageName !== 'STATS' && pageName !== 'PARAMÈTRES') {
                    document.getElementById('gestcom').textContent = 'ACCUEIL';
                }

                const gestcomElement = document.getElementById('gestcom');
                const gestcomContainer = document.getElementById('gestcom-container');

                document.body.classList.add('no-scroll');
                gestcomElement.style.opacity = 1;
                gestcomElement.classList.add('start-animation');
                gestcomContainer.style.display = 'flex';

                // Naviguer après l'animation
                setTimeout(() => {
                    window.location = this.href;
                }, 1900); // Délai plus court que l'animation pour éviter que la transition ne soit visible

                // Cacher après la navigation (au cas où)
                setTimeout(() => {
                    gestcomElement.classList.remove('start-animation');
                    gestcomContainer.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                }, 2000); // Durée de l'animation


            });

            document.getElementById('leave-no').addEventListener('click', () => {
                popup.style.display = 'none'; // Cache la popup
            });
                    
        }
    });
});


// Appel toutes les 5 minutes
setInterval(checkIfOneHourPassed, 300000); // 5 minutes en millisecondes