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

// Ouvrir la popup modif-semaine-popup quand modif-semaine est cliqué
document.getElementById('modif-semaine').addEventListener('click', () => {
    document.getElementById('modif-semaine-popup').style.display = 'flex';

    // modif-semaine-reset et commande-popup-close et clic en dehors de la popup pour fermer la popup
    document.getElementById('modif-semaine-reset').addEventListener('click', () => {
        document.getElementById('modif-semaine-popup').style.display = 'none';
    });

    document.getElementById('modif-semaine-popup-close').addEventListener('click', () => {
        document.getElementById('modif-semaine-popup').style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target.id === 'modif-semaine-popup') {
            document.getElementById('modif-semaine-popup').style.display = 'none';
        }
    });

    /* Préremplir les chaps par les valeurs actuelles (recuperer alu-doc et pvc-doc qui sont les dates sous la forme "SS-AAAA") */
    const semaineAlu = document.getElementById('alu-doc').textContent.split('-')[0];
    const anneeAlu = document.getElementById('alu-doc').textContent.split('-')[1];
    const semainePvc = document.getElementById('pvc-doc').textContent.split('-')[0];
    const anneePvc = document.getElementById('pvc-doc').textContent.split('-')[1];

    console.log(semaineAlu, anneeAlu, semainePvc, anneePvc);

    document.getElementById('week-number-alu').value = semaineAlu;
    document.getElementById('year-alu').value = anneeAlu;

    document.getElementById('week-number-pvc').value = semainePvc;
    document.getElementById('year-pvc').value = anneePvc;

    // Si modif-semaine-button on envoie la requête data/modif-semaine avec les valeurs GESCOMALU/GESCOMPVC, la semaine et l'année
    document.getElementById('modif-semaine-button').addEventListener('click', () => {
        const semaineAlu = document.getElementById('week-number-alu').value;
        const anneeAlu = document.getElementById('year-alu').value;
        const semainePvc = document.getElementById('week-number-pvc').value;
        const anneePvc = document.getElementById('year-pvc').value;
        
        // Si les semaines n'ont pas été modifiées, on ne fait rien
        if (semaineAlu === document.getElementById('alu-doc').textContent.split('-')[0] && anneeAlu === document.getElementById('alu-doc').textContent.split('-')[1] && semainePvc === document.getElementById('pvc-doc').textContent.split('-')[0] && anneePvc === document.getElementById('pvc-doc').textContent.split('-')[1]) {
            document.getElementById('modif-semaine-popup').style.display = 'none';
            return;
        }

        fetch('/data/modif-semaine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                utilisateur: 'GESCOMALU',
                semaine: semaineAlu,
                annee: anneeAlu
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        });

        fetch('/data/modif-semaine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                utilisateur: 'GESCOMPVC',
                semaine: semainePvc,
                annee: anneePvc
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        });

        document.getElementById('modif-semaine-popup').style.display = 'none';

        // Recharger la page après la modification
        location.reload();
    });
});

// Appel toutes les 5 minutes
setInterval(checkIfOneHourPassed, 300000); // 5 minutes en millisecondes