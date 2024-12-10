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
        const diffInHours = diffInMs / (1000 * 60 * 60);

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
    });
}

// Appel toutes les 5 minutes
setInterval(checkIfOneHourPassed, 300000); // 5 minutes en millisecondes