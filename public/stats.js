/* hide-nav cache nav */
document.getElementById('hide-nav').addEventListener('click', () => {
    const nav = document.querySelector('nav');
    nav.style.display = 'none';

    /* afficher a la place un fin bandeau blanc (id=show-nav qui existe deja) qui affiche nav au survol et réaffiche nav au clic */
    const showNav = document.getElementById('show-nav');
    showNav.style.display = 'flex';

    showNav.addEventListener('click', () => {
        nav.style.display = 'flex';
        showNav.style.display = 'none';
        showNav.style.border = 'none';
    });
});


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

// Charger toutes les commandes dès que la page est chargée
loadAllCommandes();

// Compter le nombre de commandes du mois
let nbCommandesThisMonth = 0;

function loadAllCommandes() {
    fetch(`/commandes`)
        .then(response => response.json())
        .then(data => {

            // Afficher l'écran de chargement
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.style.visibility = 'visible';
            loadingScreen.style.opacity = '1';

            // Calculer le CA total pour chaque type de produit cette année (l'année est dans la colonne wlivr, comme ca : 21-2021 pour semaine 21 de 2021)
            let caTotalAluThisYear = 0;
            let caTotalPvcThisYear = 0;

            // Parcourir chaque commande et calculer le CA en cours
            data.forEach(commande => {
                const date = commande.wlivr.split('-'); // Séparer la semaine de l'année
                const year = date[1]; // Récupérer l'année

                const currentYear = new Date().getFullYear(); // Récupérer l'année actuelle

                if (year == currentYear) {
                    caTotalAluThisYear += commande.prixportailAlu + commande.prixClotureAlu;  // Ajouter au CA en cours ALU
                    caTotalPvcThisYear += commande.prixportailPVC + commande.prixCloturePVC;  // Ajouter au CA en cours PVC
                }

            });

            // Arrondir les valeurs et mettre des espaces pour la lisibilité
            caTotalAluThisYear = Math.round(caTotalAluThisYear);
            caTotalPvcThisYear = Math.round(caTotalPvcThisYear);

            // Afficher le CA total pour chaque type de produit cette année
            document.getElementById('ca-total-alu-this-year').textContent = caTotalAluThisYear.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' €';
            document.getElementById('ca-total-pvc-this-year').textContent = caTotalPvcThisYear.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' €';

            // Calculer l'evolution du CA total par rapport à l'année dernière pour chaque type de produit
            let caTotalAluLastYear = 0;
            let caTotalPvcLastYear = 0;

            // Parcourir chaque commande et calculer le CA en cours
            data.forEach(commande => {
                const date = commande.wlivr.split('-'); // Séparer la semaine de l'année
                const year = date[1]; // Récupérer l'année

                const currentYear = new Date().getFullYear(); // Récupérer l'année actuelle

                if (year == currentYear - 1) {
                    caTotalAluLastYear += commande.prixportailAlu + commande.prixClotureAlu;  // Ajouter au CA en cours ALU
                    caTotalPvcLastYear += commande.prixportailPVC + commande.prixCloturePVC;  // Ajouter au CA en cours PVC
                }

            });

            // Calculer l'évolution du CA total par rapport à l'année dernière pour chaque type de produit
            const evolutionAlu = caTotalAluThisYear - caTotalAluLastYear;
            const evolutionPvc = caTotalPvcThisYear - caTotalPvcLastYear;

            // Afficher aussi en pourcentage
            const evolutionAluPercent = Math.round((evolutionAlu / caTotalAluLastYear) * 100);
            const evolutionPvcPercent = Math.round((evolutionPvc / caTotalPvcLastYear) * 100);

            document.getElementById('evolution-alu-percent').textContent = evolutionAluPercent + ' %';
            document.getElementById('evolution-pvc-percent').textContent = evolutionPvcPercent + ' %';

            let caTotalThisMonth = 0;
            let caTotalLastMonth = 0;
            let nbCommandesThisMonth = 0;

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // Mois actuel (de 1 à 12)
            const currentYear = currentDate.getFullYear();  // Année actuelle

            // Parcourir chaque commande et calculer le CA pour le mois en cours et le mois précédent
            data.forEach(commande => {
                const [year, month] = commande.dcreation.split('-').map(Number); // Extraire l'année et le mois comme entiers

                if (month === currentMonth && year === currentYear) {
                    // CA et nombre de commandes pour le mois en cours
                    caTotalThisMonth += commande.PrixFabriquer;
                    nbCommandesThisMonth++;
                } else if (month === currentMonth - 1 && year === currentYear) {
                    // CA pour le mois précédent
                    caTotalLastMonth += commande.PrixFabriquer;
                } else if (currentMonth === 1 && month === 12 && year === currentYear - 1) {
                    // Cas spécial : si le mois actuel est janvier, prendre les commandes de décembre de l'année précédente
                    caTotalLastMonth += commande.PrixFabriquer;
                }
            });

            // Arrondir les valeurs et mettre des espaces pour la lisibilité
            caTotalThisMonth = Math.round(caTotalThisMonth);
            caTotalLastMonth = Math.round(caTotalLastMonth);

            // Mettre à jour l'affichage
            document.getElementById('current-month').textContent = "CA " + currentDate.toLocaleString('default', { month: 'long' });
            document.getElementById('nb-commandes-this-month').textContent = nbCommandesThisMonth + ' commandes reçues';
            document.getElementById('ca-total-this-month').textContent = caTotalThisMonth.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' €';


            // Calculer l'evolution du CA total par rapport au mois dernier
            let evolutionMonth = caTotalThisMonth - caTotalLastMonth;

            // Arrondir les valeurs et mettre des espaces pour la lisibilité
            evolutionMonth = Math.round(evolutionMonth);

            // Afficher l'évolution du CA total par rapport au mois dernier
            document.getElementById('evolution-month').textContent = evolutionMonth.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' €';

            // Afficher aussi en pourcentage
            const evolutionMonthPercent = Math.round((evolutionMonth / caTotalLastMonth) * 100);

            document.getElementById('evolution-month-percent').textContent = evolutionMonthPercent + ' %';

            // Cache l'écran de chargement
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.opacity = '0';
        });
}

Date.prototype.getWeek = function () {
    const oneJan = new Date(this.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((this - oneJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
};