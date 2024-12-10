import {updateLastRefresh} from './script.js';

export let allCommandes = []; // Pour stocker toutes les commandes récupérées
let currentIndex = 0;  // Pour suivre l'indice des commandes actuellement affichées
const commandesPerBatch = 20; // Nombre de commandes à afficher à chaque fois

let firstOpen = true; // Pour savoir si c'est la première ouverture de la page

// Charger toutes les commandes dès que la page est chargée
loadAllCommandes();

function loadAllCommandes() {
    fetch(`/commandes`)
        .then(response => response.json())
        .then(data => {
            allCommandes = data;

            /* mettre les en-têtes de colonnes */
            const table = document.getElementById('table-header');
            table.innerHTML = `
                <th class="commande">Commande</th>
                <th class="aravp">AR/AVP</th>
                <th class="commentaire">Commentaire</th>
                <th class="semliv" title="Semaine de livraison">Sem. de liv.</th>
                <th class="dep" title="Département de livraison">Dép.</th>
                <th class="transp">Transporteur</th>
                <th class="client">Client</th>
                <th class="ref">Référence</th>
                <th class="ca">CA</th>
                <th class="etat">État</th>
                <th class="details">Détails</th>
            `;

            // Mettre à jour le nombre de commandes et le CA total
            const numberOfCommands = document.getElementById('number-of-commands-and-ca');
        
            let totalCA = 0;
        
            allCommandes.forEach(commande => {
                totalCA += parseFloat(commande.PrixFabriquer) || 0;
            });
        
            // Mettre des espaces pour séparer les milliers
            totalCA = totalCA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
            // 2 chiffres après la virgule
            totalCA = totalCA.split('.');
            totalCA[1] = totalCA[1] ? totalCA[1].substring(0, 2) : '00';
            totalCA = totalCA.join('.');
        
            numberOfCommands.textContent = `${allCommandes.length} commandes - CA total : ${totalCA} €`;

            if (allCommandes.length === 0) {
                numberOfCommands.textContent = 'Aucune commande trouvée';
            }

            loadNextBatch();  // Charger le premier lot
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
}

function loadNextBatch() {
    const batch = allCommandes.slice(currentIndex, currentIndex + commandesPerBatch);
    currentIndex += commandesPerBatch;

        // Afficher l'écran de chargement
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.visibility = 'visible';
        loadingScreen.style.opacity = '1';
        const loadingText = document.getElementById('loading-text');
        loadingText.innerHTML = 'Chargement des commandes...';
    
    // Afficher les commandes dans la table
    const listContainer = document.getElementById('commandes-list');
    batch.forEach(commande => {
        const weekYear = commande.wlivr; // Récupérer la semaine de livraison

        // Si un champ est null, undefined ou vide, le remplacer par un tiret
        Object.keys(commande).forEach(key => {
            if (commande[key] === null || commande[key] === undefined || commande[key] === '') {
                commande[key] = '-';
            }
        });

        let ca = parseFloat(commande.PrixFabriquer); // Convertir en nombre

        // Si un seul chiffre après la virgule, ajouter un zéro
        if (ca % 1 !== 0) {
            ca = ca.toFixed(2);
        }

        // Récupérer la progression et le texte de l'état
        const { progression, stateText } = getStateProgression(commande.etat);

        let complement = "";

        // Remplacer les NomLot vides par /
        if (commande.NomLot === '-') {
            commande.NomLot = '/';
        }

        if (stateText === 'Approvisionnement' || stateText === 'Production') {
            complement = "Appro : " + commande.NomLot;
        } else if (stateText === 'Fin production') {
            complement = "Appro : " + commande.NomLot;
            complement += "<br>Fin production : " + commande.wfinprod;
        } else if (stateText === 'Livraison') {
            complement = "Appro : " + commande.NomLot;
            complement += "<br>Fin production : " + commande.wfinprod;
            complement += "<br>Bon de livraison: " + commande.NumeroBL;
        } else if (stateText === 'Facture') {
            complement = "Appro : " + commande.NomLot;
            complement += "<br>Fin production : " + commande.wfinprod;
            complement += "<br>Bon de livraison: " + commande.NumeroBL;
            complement += "<br>Facture : " + commande.nfacture;
        } else {
            complement = "Aucun détail pour le moment";
        }

        // Remplacer l'état par la barre de progression et le texte de l'état
        const stateDisplay = progression === '' ? stateText : `
        <div class="progress-bar">
            <div class="progress" style="width: ${Math.round((progression / 7) * 100)}%;"></div>
            <div class="state-text">${stateText}</div> <!-- Texte de l'état sous la barre -->
        </div>
        `;

        let transport = commande.descriptio; // Valeur par défaut

        if (commande.descriptio.includes('Transport ')) {
            // Retirer le mot "Transport " du début
            transport = commande.descriptio.replace('Transport ', '');
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="commande">${commande.numero}</td>
            <td class="aravp">${commande.motifattente}</td>
            <td class="commentaire">${commande.notes}</td>
            <td class="semliv">${commande.wlivr}</td>
            <td class="dep">${commande.deptlivr}</td>
            <td class="transp">${transport}</td>
            <td class="client">${commande.nom}</td>
            <td class="ref">${commande.reference}</td>
            <td class="ca">${ca} €</td>
            <td class="etat">${stateDisplay}</td>
            <td class="details">${complement}</td>
        `;

        row.dataset.week = weekYear; // Stocker dans data-week au format WW-AAAA
        row.dataset.model = commande.biblio; // Stocker le modèle dans data-model
        row.dataset.systeme = commande.systeme; // Stocker le système dans data-systeme
        row.dataset.couleur = commande.couleur; // Stocker la couleur dans data-couleur
        row.dataset.notesLivraison = commande.noteslivraison; // Stocker les notes de livraison
        row.dataset.nomlivr = commande.nomlivr; // Stocker le nom de livraison

        // Convertir les dates
        let dcreation = new Date(commande.dcreation);
        row.dataset.dcreation = dcreation.toLocaleDateString('fr-FR')

        let dlivraison = new Date(commande.dlivraison);
        row.dataset.dlivraison = dlivraison.toLocaleDateString('fr-FR')

        // Ajouter un gestionnaire de clic à chaque ligne du tableau
        listContainer.addEventListener('click', function(event) {
            // Vérifier si l'élément cliqué est une ligne de commande (tr)
            const row = event.target.closest('tr');
            if (!row) return; // Si ce n'est pas une ligne, on quitte

            // Récupérer les données de la ligne
            let numeroCommande = row.querySelector('.commande').textContent;
            let motifAttente = row.querySelector('.aravp').textContent;
            let commentaire = row.querySelector('.commentaire').textContent;
            let semaineLivraison = row.querySelector('.semliv').textContent;
            let deptLivraison = row.querySelector('.dep').textContent;
            let transport = row.querySelector('.transp').textContent;
            let client = row.querySelector('.client').textContent;
            let reference = row.querySelector('.ref').textContent;
            let prix = row.querySelector('.ca').textContent;
            let etat = row.querySelector('.etat').textContent;
            let details = row.querySelector('.details').textContent;

            // Mettre à jour le h2 de la popup
            const popupTitle = document.getElementById('commande-popup-title');
            popupTitle.textContent = `Commande ${numeroCommande} - réf: ${reference}`;

            // Récupérer les données supplémentaires de la ligne
            let model = row.dataset.model;
            let couleur = row.dataset.couleur;
            let systeme = row.dataset.systeme;
            let dcreation = row.dataset.dcreation;

            let notesLivraison = row.dataset.notesLivraison;
            let nomlivr = row.dataset.nomlivr;
            let dlivraison = row.dataset.dlivraison;

            // Remplacer les tirets par des &
            model = model.split('-').join(' & ');
            couleur = couleur.split('-').join(' & ');
            systeme = systeme.split('-').join(' & ');

            // Remplacer les tirets par "Non renseigné"
            commentaire = commentaire === '-' ? 'Non renseigné' : commentaire;
            motifAttente = motifAttente === '-' ? 'Non renseigné' : motifAttente;
            notesLivraison = notesLivraison === '-' ? 'Non renseigné' : notesLivraison;

            // Mettre à jour les informations dans la popup
            const popupDetails = document.getElementById('commande-popup-details');
            popupDetails.innerHTML = `
                <div id="commande-popup-contenu">
                    <h3>Informations de la commande</h3>
                    <p><strong>Catégorie(s) :</strong> ${systeme}</p>
                    <p><strong>Modèle(s) :</strong> ${model}</p>
                    <p><strong>Couleur :</strong> ${couleur}</p>
                    <p><strong>CA :</strong> ${prix}</p>
                    <p><strong>Commande du :</strong> ${dcreation}</p>
                    <p><strong>Client :</strong> ${client}</p>
                </div>

                <div id="commande-popup-livr">
                    <h3>Informations de livraison</h3>
                    <p><strong>Date de livraison :</strong> ${dlivraison}</p>
                    <p><strong>Semaine de livraison :</strong> ${semaineLivraison}</p>
                    <p><strong>Département de livraison :</strong> ${deptLivraison}</p>
                    <p><strong>Transporteur :</strong> ${transport}</p>
                    <p><strong>Notes de livraison :</strong> ${notesLivraison}</p>
                    <p><strong>Nom de livraison :</strong> ${nomlivr}</p>
                </div>

                <div id="commande-popup-infos">
                    <h3>Informations supplémentaires</h3>
                    <p><strong>État de la commande :</strong> ${etat}</p>
                    <p><strong>Commentaire :</strong> ${commentaire}</p>
                    <p><strong>AR/AVP :</strong> ${motifAttente}</p>
                </div>
            `;

            // Afficher la popup
            const popup = document.getElementById('commande-popup');
            popup.style.display = 'flex';
        });

        // Ajouter un gestionnaire de clic pour fermer la popup
        const closePopupButton = document.querySelector('.commande-popup-close');
        closePopupButton.addEventListener('click', function() {
            const popup = document.getElementById('commande-popup');
            popup.style.display = 'none';
        });

        // Si l'utilisateur clique en dehors de la popup, la fermer
        window.addEventListener('click', function(event) {
            const popup = document.getElementById('commande-popup');
            if (event.target === popup) {
                popup.style.display = 'none';
            }
        });

        calculateTotalCA(allCommandes);

        // Mettre à jour l'heure de rafraîchissement
        updateLastRefresh();

        listContainer.appendChild(row);
    });

    // Masquer l'écran de chargement une fois que les commandes sont affichées
    loadingScreen.style.visibility = 'hidden';
    loadingText.textContent = 'Chargement...'; // Réinitialise le texte

    if (firstOpen) {
        // Une fois le chargement terminé, lancer l'animation de "GESTCOM"
        const gestcomElement = document.getElementById('gestcom');
        const gestcomContainer = document.getElementById('gestcom-container');
        // ajouter no-scroll à body pour empêcher le défilement pendant l'animation
        document.body.classList.add('no-scroll'); // Empêcher le défilement pendant l'animation

        // Ajouter une classe CSS pour démarrer l'animation
        gestcomElement.style.opacity = 1; // Assurer que le texte est visible avant l'animation
        gestcomElement.classList.add('start-animation'); // Ajouter une classe pour lancer l'animation
        gestcomContainer.style.display = 'flex'; // Afficher le conteneur

        // Supprimer la classe après l'animation
        setTimeout(() => {
            gestcomElement.classList.remove('start-animation');
            gestcomContainer.style.display = 'none'; // Cacher le conteneur
            document.body.classList.remove('no-scroll'); // Réactiver le défilement
        }, 2000); // Durée de l'animation
    }

    firstOpen = false; // Ne plus être la première ouverture

    // Si il y a encore des commandes à afficher, déclencher un chargement supplémentaire au défilement
    if (currentIndex < allCommandes.length) {
        window.addEventListener('scroll', onScroll);
    }
}

// Gérer le défilement pour charger davantage de commandes
function onScroll() {
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.innerHeight + window.scrollY;
    if (scrollPosition >= documentHeight - 200) { // 200px avant la fin
        loadNextBatch();
    }
}

window.addEventListener('scroll', onScroll);

// Calculer la progression en fonction de l'état
export function getStateProgression(commandeEtat) {
    // Pour la commande annulée, on renvoie une chaîne vide
    if (commandeEtat === 900) {
        return {progression: '', stateText: 'Commande annulée'};
    }

    // Mapping des états sur une échelle de 1 à 7
    const stateMapping = {
        280: 1,  // Traitée
        400: 2,  // Validée
        500: 3,  // Approvisionnement
        600: 4,  // Production
        740: 5,  // Fin production
        800: 6,  // Livraison
        850: 7   // Facture
    };

    // Récupérer le niveau de progression de l'état de la commande
    const progressionLevel = stateMapping[commandeEtat] || 0;

    return {
        progression: progressionLevel,
        stateText: getStateText(commandeEtat)
    };
}

// Retourner le texte de l'état
function getStateText(commandeEtat) {
    if (commandeEtat < 280) return 'Enregistrée';
    if (commandeEtat === 280) return 'Traitée';
    if (commandeEtat === 400) return 'Validée';
    if (commandeEtat === 500) return 'Approvisionnement';
    if (commandeEtat === 600) return 'Production';
    if (commandeEtat === 740) return 'Fin production';
    if (commandeEtat === 800) return 'Livraison';
    if (commandeEtat === 850) return 'Facture';
}

function calculateTotalCA(commandes) {
    let caTotalPortailsAlu = 0;
    let caTotalCloturesAlu = 0;
    let caTotalPortailsPVC = 0;
    let caTotalCloturesPVC = 0;
    let caTotalAlu = 0;
    let caTotalPVC = 0;
    let caTotalAcces = 0;
    let caTotal = 0;
    let caTotalFacture = 0;

    // Calculer le CA total pour chaque type de produit
    commandes.forEach(commande => {
        caTotalPortailsAlu += parseFloat(commande.prixportailAlu) || 0;
        caTotalCloturesAlu += parseFloat(commande.prixClotureAlu) || 0;
        caTotalPortailsPVC += parseFloat(commande.prixportailPVC) || 0;
        caTotalCloturesPVC += parseFloat(commande.prixCloturePVC) || 0;
        caTotalAlu += parseFloat(commande.prixportailAlu) + parseFloat(commande.prixClotureAlu) || 0;
        caTotalPVC += parseFloat(commande.prixportailPVC) + parseFloat(commande.prixCloturePVC) || 0;
        caTotalAcces += parseFloat(commande.prixAutres) + parseFloat(commande.prixartcde) || 0;
        caTotal += parseFloat(commande.PrixFabriquer) || 0;
        caTotalFacture += parseFloat(commande.totconf) || 0;
    });

    // Mettre des espaces pour séparer les milliers
    caTotalPortailsAlu = caTotalPortailsAlu.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalCloturesAlu = caTotalCloturesAlu.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalPortailsPVC = caTotalPortailsPVC.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalCloturesPVC = caTotalCloturesPVC.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalAlu = caTotalAlu.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalPVC = caTotalPVC.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalAcces = caTotalAcces.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotal = caTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    caTotalFacture = caTotalFacture.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    // Arrondir à l'entier le plus proche (pas de décimales)
    caTotalPortailsAlu = caTotalPortailsAlu.split('.')[0];
    caTotalCloturesAlu = caTotalCloturesAlu.split('.')[0];
    caTotalPortailsPVC = caTotalPortailsPVC.split('.')[0];
    caTotalCloturesPVC = caTotalCloturesPVC.split('.')[0];
    caTotalAlu = caTotalAlu.split('.')[0];
    caTotalPVC = caTotalPVC.split('.')[0];
    caTotalAcces = caTotalAcces.split('.')[0];
    caTotal = caTotal.split('.')[0];
    caTotalFacture = caTotalFacture.split('.')[0];


    // Mettre à jour les éléments HTML
    const totalCaFab = document.getElementById('ca-fab');
    const totalCaFac = document.getElementById('ca-fac');
    const totalCaPortailsCloturesAlu = document.getElementById('ca-portails-clotures-alu');
    const totalCaPortailsCloturesPVC = document.getElementById('ca-portails-clotures-pvc');
    const totalCaPortailsAlu = document.getElementById('ca-portails-alu');
    const totalCaCloturesAlu = document.getElementById('ca-clotures-alu');
    const totalCaPortailsPVC = document.getElementById('ca-portails-pvc');
    const totalCaCloturesPVC = document.getElementById('ca-clotures-pvc');
    const totalCaAcces = document.getElementById('ca-acces');

    totalCaFab.textContent = `Fabriqués : ${caTotal} €`;
    totalCaFac.textContent = `Facturés : ${caTotalFacture} €`;
    totalCaPortailsCloturesAlu.textContent = `ALU : ${caTotalAlu} €`;
    totalCaPortailsCloturesPVC.textContent = `PVC : ${caTotalPVC} €`;
    totalCaPortailsAlu.textContent = `${caTotalPortailsAlu} €`;
    totalCaCloturesAlu.textContent = `${caTotalCloturesAlu} €`;
    totalCaPortailsPVC.textContent = `${caTotalPortailsPVC} €`;
    totalCaCloturesPVC.textContent = `${caTotalCloturesPVC} €`;
    totalCaAcces.textContent = `${caTotalAcces} €`;


}

/* ---- Tri des commandes ---- */
// Écouteur pour le changement dans le menu déroulant de tri
document.getElementById('sort-options').addEventListener('change', function () {
    // Afficher l'écran de chargement immédiatement
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.visibility = 'visible';
    loadingScreen.style.opacity = '1';
    
    const sortBy = this.value; // Récupérer la valeur sélectionnée (commande, client, etc.)

    // Appliquer le tri sur allCommandes
    let sortedCommandes = [...allCommandes]; // Créer une copie des commandes pour ne pas modifier l'original
    
    if (sortBy === 'sem_livraison') {
        sortedCommandes.sort((a, b) => {
            const weekA = a.wlivr.split('-').map(Number);
            const weekB = b.wlivr.split('-').map(Number);

            if (weekA[1] !== weekB[1]) {
                return weekB[1] - weekA[1]; // Plus récente en premier
            }

            return weekB[0] - weekA[0]; // Plus récente en premier
        });
    }

    if (sortBy === 'commande') {
        sortedCommandes.sort((a, b) => b.numero.localeCompare(a.numero));
    }

    if (sortBy === 'bon_livraison') {
        sortedCommandes.sort((a, b) => {
            const bonLivraisonA = a.NumeroBL || -1
            const bonLivraisonB = b.NumeroBL || -1
            console.log(bonLivraisonA, bonLivraisonB);
            return bonLivraisonB - bonLivraisonA;
        });
    }

    if (sortBy === 'fact') {
        sortedCommandes.sort((a, b) => {
            const factA = a.nfacture || -1
            const factB = b.nfacture || -1
            return factB - factA;
        });
    }

    if (sortBy === 'ca') {
        sortedCommandes.sort((a, b) => {
            const caA = parseFloat(a.PrixFabriquer) || 0;
            const caB = parseFloat(b.PrixFabriquer) || 0;
            return caB - caA;
        });
    }

    // Réinitialiser l'affichage des commandes
    currentIndex = 0; // Réinitialiser l'indice des commandes affichées
    const table = document.getElementById('commandes-list');
    table.innerHTML = ''; // Vider le tableau

    // Afficher les commandes triées (batchées)
    allCommandes = sortedCommandes;

    // Mettre à jour le nombre de commandes et le CA total
    const numberOfCommands = document.getElementById('number-of-commands-and-ca');

    let totalCA = 0;

    allCommandes.forEach(commande => {
        totalCA += parseFloat(commande.PrixFabriquer) || 0;
    });

    // Mettre des espaces pour séparer les milliers
    totalCA = totalCA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    // 2 chiffres après la virgule
    totalCA = totalCA.split('.');
    totalCA[1] = totalCA[1] ? totalCA[1].substring(0, 2) : '00';
    totalCA = totalCA.join('.');

    numberOfCommands.textContent = `${allCommandes.length} commandes - CA total : ${totalCA} €`;

    if (allCommandes.length === 0) {
        numberOfCommands.textContent = 'Aucune commande trouvée';
    }

    loadNextBatch(); // Charger le premier lot trié

    // Masquer l'écran de chargement une fois que le tri est terminé
    loadingScreen.style.visibility = 'hidden';
});

let searchTimeout; // Variable pour stocker le délai
let previousSearchValue = ''; // Pour garder une trace de la dernière valeur de recherche

document.getElementById('search-text').addEventListener('input', function () {
    const searchValue = this.value.toLowerCase(); // Texte recherché en minuscules

    let initialCommandes = allCommandes; // Pour stocker les commandes initiales

    // Si la valeur de la recherche n'a pas changé, ne rien faire
    if (searchValue === previousSearchValue) {
        return;
    }

    // Annule le délai précédent si l'utilisateur continue à taper
    clearTimeout(searchTimeout);

    // Déclenche la recherche après un délai de 300 ms pour laisser l'utilisateur taper
    searchTimeout = setTimeout(() => {
        // Filtrer sur la liste complète allCommandes
        let filteredCommandes = allCommandes;

        // Si le champ de recherche n'est pas vide, filtrer les commandes
        if (searchValue !== '') {
            filteredCommandes = allCommandes.filter(commande => {
                const rowText = [
                    commande.numero,
                    commande.motifattente,
                    commande.notes,
                    commande.wlivr,
                    commande.deptlivr,
                    commande.descriptio,
                    commande.nom,
                    commande.reference,
                    commande.PrixFabriquer,
                    commande.etat,
                    commande.NomLot,
                    commande.wfinprod,
                    commande.NumeroBL,
                    commande.nfacture
                ].join(' ').toLowerCase(); // Convertir tout en une seule chaîne de texte

                // Vérifie si le texte recherché est présent dans l'une des propriétés de la commande
                return rowText.includes(searchValue);
            });
        }

        // Si aucune commande ne correspond à la recherche, affiche un message
        const table = document.getElementById('commandes-list');
        if (filteredCommandes.length === 0) {
            table.innerHTML = '<td colspan="11">Aucune commande trouvée</td>';
            const numberOfCommands = document.getElementById('number-of-commands-and-ca');
            numberOfCommands.textContent = 'Aucune commande trouvée';
        } else {
            // Réinitialiser l'affichage des commandes
            currentIndex = 0; // Réinitialiser l'indice des commandes affichées
            table.innerHTML = ''; // Vider le tableau

            // Afficher les commandes filtrées (batchées)
            // Utiliser les commandes filtrées sans affecter la liste `allCommandes`
            let commandsToDisplay = filteredCommandes;

            // Mettre à jour le nombre de commandes et le CA total
            const numberOfCommands = document.getElementById('number-of-commands-and-ca');
            let totalCA = 0;

            // Calculer le CA total des commandes filtrées
            commandsToDisplay.forEach(commande => {
                totalCA += parseFloat(commande.PrixFabriquer) || 0;
            });

            // Mettre des espaces pour séparer les milliers
            totalCA = totalCA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

            // 2 chiffres après la virgule
            totalCA = totalCA.split('.');

            totalCA[1] = totalCA[1] ? totalCA[1].substring(0, 2) : '00';

            totalCA = totalCA.join('.');

            // Mettre à jour le nombre de commandes et le CA total
            numberOfCommands.textContent = `${commandsToDisplay.length} commandes - CA total : ${totalCA} €`;

            allCommandes = filteredCommandes; // Mettre à jour la liste de commandes

            loadNextBatch(); // Charger le premier lot filtré
        }

        // Mettre à jour la valeur précédente
        previousSearchValue = searchValue;


        allCommandes = initialCommandes; // Réinitialiser la liste des commandes

    }, 300); // Délai de 300 ms
});

//* ---- Filtres ---- */

let firstPassage = true;
let initialCommandes;
let currentProductFilter = 'Tous';
let currentWeekFilter = '';
let currentYearFilter = '';

// Ajoutez cet écouteur pour les boutons de filtrage des produits
document.getElementById('produits-tous').addEventListener('click', function() {
    currentProductFilter = 'Tous';
    applyCombinedFilters();

    // Mettre à jour l'apparence des boutons
    updateProductButtons();
});

document.getElementById('produits-alu').addEventListener('click', function() {
    currentProductFilter = 'ALU';
    applyCombinedFilters();

    // Mettre à jour l'apparence des boutons
    updateProductButtons();
});

document.getElementById('produits-pvc').addEventListener('click', function() {
    currentProductFilter = 'PVC';
    applyCombinedFilters();

    // Mettre à jour l'apparence des boutons
    updateProductButtons();
});

// Fonction pour mettre à jour l'apparence des boutons de filtrage des produits
function updateProductButtons() {
    // Récupérer les boutons de filtrage des produits
    const allButton = document.getElementById('produits-tous');
    const aluButton = document.getElementById('produits-alu');
    const pvcButton = document.getElementById('produits-pvc');

    // Réinitialiser les classes actives
    allButton.classList.remove('active');
    aluButton.classList.remove('active');
    pvcButton.classList.remove('active');

    // Ajouter la classe active au bouton actuel
    if (currentProductFilter === 'Tous') {
        allButton.classList.add('active');
    } else if (currentProductFilter === 'ALU') {
        aluButton.classList.add('active');
    } else if (currentProductFilter === 'PVC') {
        pvcButton.classList.add('active');
    }
}

// Écouteur pour le bouton "Filtrer"
document.getElementById('filter-button').addEventListener('click', function() {
    const weekNumber = document.getElementById('week-number').value.trim(); // Semaine entrée par l'utilisateur
    const year = document.getElementById('year').value.trim(); // Année entrée par l'utilisateur

    // Vérifier si la semaine ou l'année sont valides et non vides
    if ((!weekNumber && !year) || isNaN(weekNumber) || isNaN(year) || weekNumber < 1 || weekNumber > 53 || year < 2000) {
        alert("Veuillez entrer une semaine et une année valides.");
        return;
    }

    currentWeekFilter = weekNumber;
    currentYearFilter = year;
    applyCombinedFilters();
});

// Écouteur pour le bouton "Réinitialiser"
document.getElementById('reset-button').addEventListener('click', function() {
    // Réinitialiser les filtres
    currentProductFilter = 'Tous';
    currentWeekFilter = '';
    currentYearFilter = '';

    document.getElementById('week-number').value = '';
    document.getElementById('year').value = '';

    document.getElementById('produits-tous').classList.add('active');
    document.getElementById('produits-alu').classList.remove('active');
    document.getElementById('produits-pvc').classList.remove('active');

    // Réinitialiser les commandes affichées
    allCommandes = initialCommandes;  // Restaurer toutes les commandes
    currentIndex = 0;
    const table = document.getElementById('commandes-list');
    table.innerHTML = '';  // Vider le tableau
    loadNextBatch();  // Recharger toutes les commandes

    updateNumberOfCommands(allCommandes);
});

// Appliquer les filtres combinés
function applyCombinedFilters() {
    if (firstPassage) {
        initialCommandes = allCommandes; // Stocker toutes les commandes initiales
        firstPassage = false;
    }

    // Filtrer les commandes initiales selon les critères actifs
    const filteredCommandes = initialCommandes.filter(commande => {
        const matchesProduct = (currentProductFilter === 'Tous') || 
                               (commande.systeme && commande.systeme.includes(currentProductFilter));

        const matchesWeekAndYear = (!currentWeekFilter && !currentYearFilter) || 
                                   (commande.wlivr && isMatchingWeekAndYear(commande.wlivr, currentWeekFilter, currentYearFilter));

        return matchesProduct && matchesWeekAndYear;
    });

    console.log("Filtres : " + currentProductFilter + " " + currentWeekFilter + " " + currentYearFilter);
    console.log("Commandes filtrées combinées:", filteredCommandes);

    // Réinitialiser l'affichage des commandes
    currentIndex = 0;
    const table = document.getElementById('commandes-list');
    table.innerHTML = ''; // Vider le tableau
    allCommandes = filteredCommandes; // Utiliser les commandes filtrées

    loadNextBatch();  // Charger les commandes filtrées

    updateNumberOfCommands(allCommandes);
}

// Vérifie si une commande correspond à la semaine et à l'année spécifiées
function isMatchingWeekAndYear(wlivr, week, year) {
    const deliveryDate = wlivr.split('-');
    const deliveryWeek = deliveryDate[0];  // Semaine de livraison (WW)
    const deliveryYear = deliveryDate[1];  // Année de livraison (AAAA)

    const matchesWeek = !week || deliveryWeek === week;
    const matchesYear = !year || deliveryYear === year;

    return matchesWeek && matchesYear;
}

// Met à jour le nombre de commandes et le CA total
function updateNumberOfCommands(commandes) {
    const numberOfCommands = document.getElementById('number-of-commands-and-ca');
    let totalCA = 0;

    commandes.forEach(commande => {
        totalCA += parseFloat(commande.PrixFabriquer) || 0;
    });

    totalCA = totalCA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    totalCA = totalCA.split('.');
    totalCA[1] = totalCA[1] ? totalCA[1].substring(0, 2) : '00';
    totalCA = totalCA.join('.');

    numberOfCommands.textContent = `${commandes.length} commandes - CA total : ${totalCA} €`;

    if (commandes.length === 0) {
        numberOfCommands.textContent = 'Aucune commande trouvée';
    }
}