//* ---- Filtres ---- */
import {allCommandes, initialCommandes, loadNextBatch, calculateTotalCA, getStateText, setAllCommandes, setCurrentIndex} from './table.js';

// Variables
export let firstPassage = true;
export let currentProductFilter = 'Tous';
export let currentTransportFilter = 'Tous';
export let currentEtatFilter = 'Tous';
export let currentWeekFilter = '';
export let currentYearFilter = '';
export let currentStartDateFilter = '';
export let currentEndDateFilter = '';
export let currentEnAttenteFilter = false;
export let currentSearchValue = '';
export let currentStatusFilter = '';
export let dateTriType = 'livraison';
export let currentSearchClient = '';
export let currentRepresentantFilter = 'Tous';

// Ecouteur pour le changement dans le menu déroulant de tri
document.getElementById('filter-date-options').addEventListener('change', function () {
    dateTriType = this.value; // Récupérer la valeur sélectionnée (livraison, commande, etc.)

    // Appliquer les filtres sur allCommandes
    applyCombinedFilters(dateTriType);
});

// Ecouteur pour les boutons de filtrage des produits
document.getElementById('produits-tous').addEventListener('click', function() {
    currentProductFilter = 'Tous';

    applyCombinedFilters(dateTriType);

    // Mettre à jour l'apparence des boutons
    updateProductButtons();
});

document.getElementById('produits-alu').addEventListener('click', function() {
    currentProductFilter = 'ALU';
    applyCombinedFilters(dateTriType);

    // Mettre à jour l'apparence des boutons
    updateProductButtons();
});

document.getElementById('produits-pvc').addEventListener('click', function() {
    currentProductFilter = 'PVC';
    applyCombinedFilters(dateTriType);

    // Mettre à jour l'apparence des boutons
    updateProductButtons();
});

// Fonction pour mettre à jour l'apparence des boutons de filtrage des produits
function updateProductButtons() {
    // Récupérer les boutons de filtrage des produits
    const allButton = document.getElementById('produits-tous');
    const aluButton = document.getElementById('produits-alu');
    const pvcButton = document.getElementById('produits-pvc');

    //Réinitialiserles classes actives
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

// Ecouteur pour les boutons de filtrage de statut
document.getElementById('retards').addEventListener('click', function() {
    // Si le bouton est déjà actif, désactiver le filtre
    if (currentStatusFilter === 'retards') {
        currentStatusFilter = '';
    } else {
        currentStatusFilter = 'retards';
    }

    applyCombinedFilters(dateTriType);

    // Mettre à jour l'apparence des boutons
    updateStatusButtons();
});

// Ecouteur pour les boutons de filtrage de statut
document.getElementById('groupage-ports').addEventListener('click', function() {
    // Si le bouton est déjà actif, désactiver le filtre
    if (currentStatusFilter === 'groupage-ports') {
        currentStatusFilter = '';
    } else {
        currentStatusFilter = 'groupage-ports';
    }

    // Récupérer les éléments de l'écran de chargement
    const loadingScreen = document.getElementById('loading-screen');

    // Afficher l'écran de chargement
    loadingScreen.style.visibility = 'visible';

    // Mettre à jour l'apparence des boutons
    updateStatusButtons();
    
    // Appliquer les filtres après un court délai pour permettre à l'écran de chargement de s'afficher
    setTimeout(() => {
        applyCombinedFilters(dateTriType);

        // Masquer l'écran de chargement après application des filtres
        loadingScreen.style.visibility = 'hidden';
    }, 200); // 200ms suffisent pour garantir que l'écran de chargement est visible
});


// Ecouteur pour les boutons de filtrage de statut
document.getElementById('attente-paiement').addEventListener('click', function() {
    // Si le bouton est déjà actif, désactiver le filtre
    if (currentStatusFilter === 'attente-paiement') {
        currentStatusFilter = '';
    } else {
        currentStatusFilter = 'attente-paiement';
    }
    
    applyCombinedFilters(dateTriType);

    // Mettre à jour l'apparence des boutons
    updateStatusButtons();
});

// Fonction pour mettre à jour l'apparence des boutons de filtrage de statut
function updateStatusButtons() {
    // Récupérer les boutons de filtrage des produits
    const retardsButton = document.getElementById('retards');
    const groupagePortsButton = document.getElementById('groupage-ports');
    const attentePaiementButton = document.getElementById('attente-paiement');

    //Réinitialiserles classes actives
    retardsButton.classList.remove('active');
    groupagePortsButton.classList.remove('active');
    attentePaiementButton.classList.remove('active');

    // Ajouter la classe active au bouton actuel
    if (currentStatusFilter === 'retards') {
        retardsButton.classList.add('active');
    } else if (currentStatusFilter === 'groupage-ports') {
        groupagePortsButton.classList.add('active');
    } else if (currentStatusFilter === 'attente-paiement') {
        attentePaiementButton.classList.add('active');
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

    // Reinitaliser les filtres de date
    currentStartDateFilter = '';
    currentEndDateFilter = '';

    // Videz les champs de date
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';

    currentWeekFilter = weekNumber;
    currentYearFilter = year;
    applyCombinedFilters(dateTriType);
});

// Écouteur pour le bouton "x" de la semaine et de l'année
document.getElementById('reset-button').addEventListener('click', function() {
    //Réinitialiserles filtres
    currentWeekFilter = '';
    currentYearFilter = '';

    document.getElementById('week-number').value = '';
    document.getElementById('year').value = '';

    applyCombinedFilters(dateTriType);
});

// Écouteur pour le bouton "x" de la plage de dates
document.getElementById('reset-date-button').addEventListener('click', function() {
    //Réinitialiserles filtres
    currentStartDateFilter = '';
    currentEndDateFilter = '';

    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';

    applyCombinedFilters(dateTriType);
});

// Appliquer les filtres combinés
function applyCombinedFilters(dateTriType) {
    if (firstPassage) {
        setAllCommandes(initialCommandes);
        firstPassage = false;
    }

    // Filtrer les commandes initiales selon les critères actifs
    const filteredCommandes = initialCommandes.filter(commande => {

        let dateTri = ''; // Date de tri
        let dateTriWeek = ''; // Date de tri pour la semaine

        if (dateTriType === 'livraison') {
            dateTri = new Date(commande.dlivraison);
            dateTri = dateTri.toLocaleDateString('fr-FR');
            dateTriWeek = commande.wlivr;
        } else if (dateTriType === 'commande') {
            dateTri = new Date(commande.dcreation);
            dateTri = dateTri.toLocaleDateString('fr-FR');
            dateTriWeek = commande.wcrea;
        } else if (dateTriType === 'fact') {
            dateTri = new Date(commande.dfacture);
            dateTri = dateTri.toLocaleDateString('fr-FR');
            dateTriWeek = commande.wfact;
        } else if (dateTriType === 'finProd') {
            dateTri = new Date(commande.dfinprod);
            dateTri = dateTri.toLocaleDateString('fr-FR');
            dateTriWeek = commande.wfinprod;
        }

        // si dateTriWeek est null, on le met à ''
        if (!dateTriWeek) {
            dateTriWeek = '';
        }

        // Si la semaine n'a que 1 chiffre, ajouter un 0 devant
        if (dateTriWeek.length === 6) {
            dateTriWeek = '0' + dateTriWeek;
        }

        const matchesProduct = (currentProductFilter === 'Tous') || 
                            (commande.systeme && commande.systeme.includes(currentProductFilter));

        const matchesWeekAndYear = (!currentWeekFilter && !currentYearFilter) || 
                                (dateTriWeek && isMatchingWeekAndYear(dateTriWeek, currentWeekFilter, currentYearFilter));

        const matchesDateRange = (!currentStartDateFilter || !currentEndDateFilter) || 
                                (dateTri && isWithinDateRange(dateTri, currentStartDateFilter, currentEndDateFilter));

        const matchesTransport = (currentTransportFilter === 'Tous') ||
                                (commande.descriptio && commande.descriptio === currentTransportFilter);

        const matchesEnAttente = !currentEnAttenteFilter || (commande.dateTri && !commande.dateTri.startsWith('20'));

        // Vérifier si l'état de la commande est présent dans les états actifs
        const matchesEtat = etatsActifs.includes(getStateText(commande.etat));

        // Zone de recherche
        const searchValue = currentSearchValue.toLowerCase(); // Valeur de recherche en minuscules
        const matchesSearch = !searchValue || Object.values(commande).some(value => {
            if (value === null || value === undefined) {
                return false;
            }
            return value.toString().toLowerCase().includes(searchValue);
        });

        // Vérifie si la commande est en retard
        const matchesStatus = (currentStatusFilter === '') ||
                                (currentStatusFilter === 'retards' && estEnRetard(commande)) || (currentStatusFilter === 'groupage-ports' && aCommandeSimilaire(commande)) || (currentStatusFilter === 'attente-paiement' && estEnAttenteDePaiement(commande));

        // Zone de recherche client
        const searchClient = currentSearchClient.toLowerCase().replace(/\s+/g, ''); // Supprimer tous les espaces et convertir en minuscules
        const client = commande.nom.toLowerCase().replace(/\s+/g, ''); // Supprimer tous les espaces et convertir en minuscules
        const matchesClient = searchClient === '' || client.includes(searchClient);

        const matchesRepresentant = (currentRepresentantFilter === 'Tous') ||
                                (commande.repres_nom && commande.repres_nom === currentRepresentantFilter);
        
        return matchesProduct && matchesWeekAndYear && matchesDateRange && matchesTransport && matchesEtat && matchesEnAttente && matchesSearch && matchesStatus && matchesClient && matchesRepresentant;
    });

    //Réinitialiserl'affichage des commandes
    setCurrentIndex(0);
    const table = document.getElementById('commandes-list');
    table.innerHTML = ''; // Vider le tableau
    setAllCommandes(filteredCommandes);

    // Si currentStatusFilter === 'groupage-ports', trier les commandes par nom de client
    if (currentStatusFilter === 'groupage-ports') {
        allCommandesbyClient = allCommandes.slice().sort((a, b) => a.nom.localeCompare(b.nom));

        setAllCommandes(allCommandesbyClient);
    }

    loadNextBatch();  // Charger les commandes filtrées

    updateNumberOfCommands(allCommandes);

    // Mettre à jour le texte du bouton de filtre de date id=filter-date-text
    const filterDateToggle = document.getElementById('filter-date-text');
    let numberOfDateFilters = 0;

    if (currentStartDateFilter || currentEndDateFilter) {
        numberOfDateFilters++;
    }

    if (currentWeekFilter || currentYearFilter) {
        numberOfDateFilters++;
    }

    if (currentEnAttenteFilter) {
        numberOfDateFilters++;
    }

    // Mettre à jour le texte du bouton de filtre de date en conservant l'icône
    filterDateToggle.innerHTML = `<i class="fas fa-calendar-alt"></i> Filtres de date (${numberOfDateFilters})`;

    // Mettre à jour le texte du bouton de filtre de produit
    const filterProductToggle = document.getElementById('filter-matiere-text');
    let numberOfProductFilters = 0;

    if (currentProductFilter !== 'Tous') {
        numberOfProductFilters++;
    }

    filterProductToggle.innerHTML = `<i class="fas fa-cube"></i> Filtres de matière (${numberOfProductFilters})`;

    // Mettre à jour le texte du bouton de filtre de transport
    const filterTransportToggle = document.getElementById('filter-transp-text');
    let numberOfTransportFilters = 0;

    if (currentTransportFilter !== 'Tous') {
        numberOfTransportFilters++;
    }

    filterTransportToggle.innerHTML = `<i class="fas fa-truck"></i> Filtres de transporteur (${numberOfTransportFilters})`;

    // Mettre à jour le texte du bouton de filtre d'état
    const filterEtatToggle = document.getElementById('filter-etat-text');
    let numberOfEtatFilters = 0;

    // Si tous les boutons visibles ne sont pas actifs, incrémenter le nombre de filtres
    const etatButtons = document.querySelectorAll('.etat-button');
    etatButtons.forEach(button => {
        if (!button.classList.contains('active')) {
            numberOfEtatFilters = 1;
        }
    });
    
    filterEtatToggle.innerHTML = `<i class="fas fa-check"></i> Filtres d'état (${numberOfEtatFilters})`;

    // Mettre à jour le texte du bouton de filtre de statut
    const filterStatusToggle = document.getElementById('filter-status-text');
    let numberOfStatusFilters = 0;

    if (currentStatusFilter !== '') {
        numberOfStatusFilters++;
    }

    filterStatusToggle.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Filtres de statut (${numberOfStatusFilters})`;

    // Mettre à jour le texte du bouton de recherche client
    const filterClientToggle = document.getElementById('filter-client-text');
    let numberOfClientFilters = 0;

    if (currentSearchClient !== '') {
        numberOfClientFilters++;
    }

    filterClientToggle.innerHTML = `<i class="fas fa-user"></i> Filtres de client (${numberOfClientFilters})`;

    // Mettre à jour le texte du bouton de filtre de représentant
    const filterRepresentantToggle = document.getElementById('filter-repres-text');
    let numberOfRepresentantFilters = 0;

    if (currentRepresentantFilter !== 'Tous') {
        numberOfRepresentantFilters++;
    }

    filterRepresentantToggle.innerHTML = `<i class="fas fa-user-tie"></i> Filtres de représentant (${numberOfRepresentantFilters})`;
}

// Le clic sur la case entière sélectionne la case à cocher
document.querySelector('table').addEventListener('click', function(event) {
    // Le clic sur td sélectionne la case à cocher si la case à cocher est présente
    if (event.target.tagName === 'TD' && event.target.querySelector('input')) {
        event.target.querySelector('input').click();
         
        // changer la couleur de fond de la ligne entière
        const tr = event.target.closest('tr');
        tr.classList.toggle('selected');
    }
});

// Vérifie si une commande correspond à la semaine et à l'année spécifiées
function isMatchingWeekAndYear(commandeWeekYear, week, year) {

    // si la semaine n'a que 1 chiffre, ajouter un 0 devant
    if (week.length === 1) {
        week = '0' + week;
    }

    commandeWeekYear = commandeWeekYear.split('-');
    const commandeWeek = commandeWeekYear[0];
    const commandeYear = commandeWeekYear[1];

    const matchesWeek = !week || commandeWeek === week;
    const matchesYear = !year || commandeYear === year;

    return matchesWeek && matchesYear;
}

// Vérifie si une commande est en retard (état de la commande différent de "Livraison" ou "Facture" ET la date de livraison est passée)
function estEnRetard(commande) {
    // Vérifie si l'état de la commande est inférieur à 800 (ce qui signifie qu'il n'est pas "Livraison" ou "Facture")
    // Et si la date de livraison est bien renseignée et que la date actuelle est supérieure à la date de livraison
    if ((commande.etat < 800) && commande.dlivraison && new Date(new Date(commande.dlivraison).setDate(new Date(commande.dlivraison).getDate() + 1)) < new Date()) {
        return true; // La commande est en retard
    }
    return false; // La commande n'est pas en retard
}

// attente de paiement : commande.etat < 850 & dans la liste des modes de paiement & commande.TTAcomptes < totconf
function estEnAttenteDePaiement(commande) {
    let modesDePaiement = ['CHEQUE 50PC 1ERE', 'CHEQUE A LA CDE', 'ESPECES', 'TRAITE FM', 'VIRT 50CDE+DEPAR', 'VIRT A LA CDE', 'VIRT SOLD AV EXP', 'VIRT SOLD AV FAB'];

    if ((commande.etat < 850) && modesDePaiement.includes(commande.paiement) && (commande.TTAcomptes < commande.totconf)) {
        return true; // La commande est en attente de paiement
    }
    
    return false; // La commande n'est pas en attente de paiement
}


// Met à jour le nombre de commandes et le CA total
function updateNumberOfCommands(commandes) {
    const numberOfCommands = document.getElementById('number-of-commands-and-ca');
    let totalCA = 0;

    commandes.forEach(commande => {
        totalCA += parseFloat(commande.PrixFabriquer) || 0;
        totalCA += parseFloat(commande.prixartcde) || 0;
        totalCA += parseFloat(commande.prixAutres) || 0;
    });

    totalCA = totalCA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    totalCA = totalCA.split('.');
    totalCA[1] = totalCA[1] ? totalCA[1].substring(0, 2) : '00';
    totalCA = totalCA.join('.');

    numberOfCommands.textContent = `${commandes.length} commandes - CA total : ${totalCA} €`;

    const table = document.getElementById('commandes-list');

    if (commandes.length === 0) {
        numberOfCommands.textContent = 'Aucune commande trouvée';
        table.innerHTML = '<td colspan="11">Aucune commande trouvée</td>';

        // Mettre à jour le nombre de commandes et le CA total
        calculateTotalCA(allCommandes);
    }
}

// Écouteur pour le bouton "Filtrer" (2 jours)
document.getElementById('filter-date-button').addEventListener('click', function() {
    const startDate = document.getElementById('start-date').value; // Date de début
    const endDate = document.getElementById('end-date').value; // Date de fin

    // Vérifier si les dates sont valides
    if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
        alert("Veuillez entrer une plage de dates valide.");
        return;
    } else {
        currentStartDateFilter = startDate;
        currentEndDateFilter = endDate;
    }
    
    currentWeekFilter = ''; //Réinitialiserle filtre de la semaine
    currentYearFilter = ''; //Réinitialiserl'année

    // Videz les champs de la semaine et de l'année
    document.getElementById('week-number').value = '';
    document.getElementById('year').value = '';

    applyCombinedFilters(dateTriType);
});

// Ecouteurs pour le bouton "en-attente"
document.getElementById('en-attente').addEventListener('click', function() {
    // Inverser la valeur du filtre
    currentEnAttenteFilter = !currentEnAttenteFilter;

    // Mettre à jour l'apparence du bouton
    const enAttenteButton = document.getElementById('en-attente');
    enAttenteButton.classList.toggle('active');

    applyCombinedFilters(dateTriType);
});


// Vérifie si une commande correspond à la plage de dates spécifiée. (dlivraison au format jj/mm/aaaa, startDate et endDate au format aaaa-mm-jj)
function isWithinDateRange(dlivraison, startDate, endDate) {
    /* remettre au meme format */
    const dateParts = dlivraison.split('/');
    const date = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];

    return date >= startDate && date <= endDate;
}

// Recupérer les transporteurs dans les commandes
function getTransporteurs(commandes) {
    const transporteurs = [];

    commandes.forEach(commande => {
        /* Ajouter le transporteur à la liste si ce n'est pas déjà présent */
        if (commande.descriptio && !transporteurs.includes(commande.descriptio) && commande.descriptio !== null && commande.descriptio !== '(test)') {
            transporteurs.push(commande.descriptio);
        }
    });

    return transporteurs;
}

// Recupérer les représentants dans les commandes
function getRepresentants(commandes) {
    const representants = [];

    commandes.forEach(commande => {
        /* Ajouter le représentant à la liste si ce n'est pas déjà présent */
        if (commande.repres_nom && !representants.includes(commande.repres_nom) && commande.repres_nom !== null && !commande.repres_nom.includes('OBSOLETE')) {
            representants.push(commande.repres_nom);
        }
    });

    return representants;
}

// Conteneur des options
const transportOptionContainer = document.querySelector('.filters-transp-container');

// Injecter les boutons des transporteurs
export function injectTransporteurs() {
    
    // Récupérer les transporteurs
    const transporteurs = getTransporteurs(allCommandes);

    // Ajoute "Tous" en premier
    transporteurs.unshift('Tous');

    // Créer un élément de sélection
    const select = document.createElement('select');
    select.id = 'transporteurs';

    // Ajouter une option pour chaque transporteur
    transporteurs.forEach(transporteur => {
        const option = document.createElement('option');
        option.textContent = transporteur;
        select.appendChild(option);
    });
    
    // Ajouter le sélecteur à la page
    transportOptionContainer.innerHTML = '';
    transportOptionContainer.appendChild(select);

    // Écouteur pour le changement dans le menu déroulant des transporteurs
    document.getElementById('transporteurs').addEventListener('change', function() {
        let transporteur = this.value; // Récupérer la valeur sélectionnée

        // Appliquer le filtre sur les commandes
        currentTransportFilter = transporteur;

        applyCombinedFilters(dateTriType);
    });
}

// Injecter les boutons des représentants
export function injectRepresentants() {
    // Récupérer les représentants
    const representants = getRepresentants(allCommandes);

    // Ajoute "Tous" en premier
    representants.unshift('Tous');

    // Créer un élément de sélection
    const select = document.createElement('select');
    select.id = 'representants';

    // Ajouter une option pour chaque représentant
    representants.forEach(representant => {
        const option = document.createElement('option');
        option.textContent = representant;
        select.appendChild(option);
    });

    // Ajouter le sélecteur à la page
    const representantOptionContainer = document.querySelector('.filters-repres-container');
    representantOptionContainer.innerHTML = '';
    representantOptionContainer.appendChild(select);

    // Écouteur pour le changement dans le menu déroulant des représentants
    document.getElementById('representants').addEventListener('change', function() {
        let representant = this.value; // Récupérer la valeur sélectionnée

        // Appliquer le filtre sur les commandes
        currentRepresentantFilter = representant;

        applyCombinedFilters(dateTriType);
    });
}

// Récupérer les états dans les commandes
function getEtats(commandes) {
    let etats = [];

    commandes.forEach(commande => {
        /* Ajouter l'état à la liste si ce n'est pas déjà présent */
        if (commande.etat && !etats.includes(commande.etat) && commande.etat !== null) {
            etats.push(commande.etat);
        }
    });

    // Trier les états par ordre croissant
    etats.sort((a, b) => a - b);

    // Utiliser getStateText(commandeEtat) pour obtenir le texte de l'état
    for (let i = 0; i < etats.length; i++) {
        etats[i] = getStateText(etats[i]);
    }

    // Supprimer les états en double
    etats = [...new Set(etats)];

    return etats;
}

// Variable pour suivre les états actifs
let etatsActifs = [];

// Injecter les boutons des états
export function injectEtats() {
    
    // Récupérer les états
    const etats = getEtats(initialCommandes);

    // Conteneur des boutons
    const etatOptionContainer = document.getElementById('etatOptionContainer');  // Assure-toi que ce conteneur existe

    // Vider le conteneur avant d'ajouter les boutons
    etatOptionContainer.innerHTML = '';

    // Créer un bouton pour chaque état
    etats.forEach(etat => {
        const div = document.createElement('div');
        div.textContent = etat;
        div.classList.add('etat-button', 'active');  // Ajouter la classe 'active' par défaut

        // Ajouter l'état à la liste des états actifs
        etatsActifs.push(etat);

        // Ajouter un écouteur d'événements pour chaque bouton
        div.addEventListener('click', function() {
            // Si l'état est déjà dans la liste des filtres actifs, on le retire
            if (etatsActifs.includes(etat)) {
                etatsActifs = etatsActifs.filter(e => e !== etat);  // Retirer l'état
                div.classList.remove('active');  // Retirer la classe 'active'
            } else {
                // Sinon, on l'ajoute à la liste des filtres actifs
                etatsActifs.push(etat);
                div.classList.add('active');  // Ajouter la classe 'active'
            }

            // Appliquer les filtres cumulés
            applyCombinedFilters(dateTriType);
        });

        // Ajouter le bouton au conteneur
        etatOptionContainer.appendChild(div);
    });
}

// Ecouteur pour la zone de recherche
document.getElementById('search-text').addEventListener('input', function() {
    currentSearchValue = this.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Texte de recherche en minuscules et sans accents

    applyCombinedFilters(dateTriType);
});

// Sélectionner les éléments
const clearBtn = document.getElementById('clear-btn');
const searchInput = document.getElementById('search-text');

// Ajouter un événement au clic sur l'icône
clearBtn.addEventListener('click', () => {
    searchInput.value = ''; // Effacer le contenu de la zone de texte
    currentSearchValue = ''; // Réinitialiser la valeur de recherche

    applyCombinedFilters(dateTriType);

    searchInput.focus();    // Remettre le focus sur la zone de texte
});

// Ecouteur pour la zone de recherche client
document.getElementById('search-client').addEventListener('input', function() {
    currentSearchClient = this.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Texte de recherche en minuscules et sans accents

    // Afficher les clients qui contiennent la valeur de recherche (sans casse, accent ou espace) en dessous de la zone de recherche
    const clients = allCommandes.map(commande => commande.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')); // Supprimer tous les espaces et convertir en minuscules et sans accents
    const searchClient = currentSearchClient.replace(/\s+/g, ''); // Supprimer tous les espaces

    const matchingClients = clients.filter(client => client.includes(searchClient));

    // Retirer les doublons
    const uniqueClients = [...new Set(matchingClients)];
    
    // Mettre en majuscule
    uniqueClients.forEach((client, index) => {
        uniqueClients[index] = client.toUpperCase();
    });

    // Retrouver le vrai client
    allCommandes.forEach(commande => {
        uniqueClients.forEach((client, index) => {
            if (commande.nom.toLowerCase().replace(/\s+/g, '') === client.toLowerCase().replace(/\s+/g, '')) {
                uniqueClients[index] = commande.nom.toUpperCase();
            }
        }
    )});

    const clientList = document.getElementById('client-list');
    clientList.innerHTML = ''; // Vider la liste

    // N'afficher que les 5 premiers clients
    for (let i = 0; i < 5; i++) {
        if (uniqueClients[i] && searchClient !== '') {
            const div = document.createElement('div');
            div.textContent = uniqueClients[i];
            div.classList.add('client-list-item');

            // Ajouter la bordure
            document.getElementById('client-list').style.border = '1px solid #ccc';
            document.getElementById('client-list').style.marginTop = '10px';

            // Ajouter un écouteur d'événements pour chaque client
            div.addEventListener('click', function() {
                document.getElementById('search-client').value = uniqueClients[i]; // Mettre à jour la valeur de recherche
                currentSearchClient = uniqueClients[i]; // Mettre à jour la valeur de recherche

                applyCombinedFilters(dateTriType);

                clientList.innerHTML = ''; // Vider la liste

                // enlever la bordure
                document.getElementById('client-list').style.border = 'none';
                document.getElementById('client-list').style.marginTop = '0px';
            });

            clientList.appendChild(div);
        } else if (searchClient === '' || uniqueClients.length === 0) {
            clientList.innerHTML = ''; // Vider la liste

            // enlever la bordure
            document.getElementById('client-list').style.border = 'none';
            document.getElementById('client-list').style.marginTop = '0px';
        }
    }

    applyCombinedFilters(dateTriType);
});

const clearClientBtn = document.getElementById('clear-client-btn');
const searchClient = document.getElementById('search-client');

// Ajouter un événement au clic sur l'icône
clearClientBtn.addEventListener('click', () => {
    searchClient.value = ''; // Effacer le contenu de la zone de texte
    currentSearchClient = ''; // Réinitialiser la valeur de recherche

    // enlever la bordure
    document.getElementById('client-list').style.border = 'none';
    document.getElementById('client-list').style.marginTop = '0px';

    applyCombinedFilters(dateTriType);

    searchClient.focus();    // Remettre le focus sur la zone de texte
});

// Vérifie si une commande a au moins une autre commande avec la même semaine de livraison (wlivr), le même client (nom) et la même adresse de livraison (cplivr)
// On renvoie true si il existe au moins une autre commande similaire
function aCommandeSimilaire(commande) {

    // On récupère les commandes
    const commandes = initialCommandes;

    // On récupère les informations de la commande
    const semaine = commande.wlivr;
    const client = commande.nom;
    const adresse = commande.cplivr;

    // Utilisation de `some` pour arrêter dès qu'une commande similaire est trouvée
    const result = commandes.some(c => 
        c !== commande && 
        c.wlivr === semaine && 
        c.nom === client && 
        c.cplivr === adresse && 
        c.etat < 800
    );

    return result;
}


//clear-all remet tout les filtres aux valeurs par défaut
document.getElementById('clear-all').addEventListener('click', function() {
    // Réinitialiser les filtres
    currentProductFilter = 'Tous';
    currentTransportFilter = 'Tous';
    currentEtatFilter = 'Tous';

    currentWeekFilter = '';
    currentYearFilter = '';

    currentStartDateFilter = '';
    currentEndDateFilter = '';

    currentEnAttenteFilter = false;

    currentSearchValue = ''; // Valeur de recherche actuelle

    currentStatusFilter = '';

    currentSearchClient = '';

    currentRepresentantFilter = 'Tous';

    // Réinitialiser les boutons de filtrage des produits
    updateProductButtons();

    // Réinitialiser les boutons de filtrage de statut
    updateStatusButtons();

    // Réinitialiser les boutons de filtrage d'état
    etatsActifs = [];

    injectEtats();

    // Réinitialiser les filtres de date
    document.getElementById('week-number').value = '';
    document.getElementById('year').value = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';

    // Réinitialiser la zone de recherche
    document.getElementById('search-text').value = '';

    // Réinitialiser la zone de recherche client
    document.getElementById('search-client').value = '';

    // Appliquer les filtres combinés
    applyCombinedFilters(dateTriType);

    // Réinitialiser les boutons de filtrage de transport
    injectTransporteurs();

    // Réinitialiser les boutons de filtrage de représentant
    injectRepresentants();

    // Refermer les conteneurs de filtres
    
    var filterContainer = document.getElementById("filters-date-container");
    var icon = document.getElementById("chevron-date"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }
    
    var filterContainer = document.getElementById("filters-matiere-container");
    var icon = document.getElementById("chevron-matiere"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }
    
    var filterContainer = document.getElementById("filters-transp-container");
    // icone chevron
    var icon = document.getElementById("chevron-transp"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }
    
    var filterContainer = document.getElementById("filters-etat-container");
    var icon = document.getElementById("chevron-etat"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }
    
    var filterContainer = document.getElementById("filters-status-container");
    var icon = document.getElementById("chevron-status"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }
    
    var filterContainer = document.getElementById("filters-client-container");
    var icon = document.getElementById("chevron-client"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }

    var filterContainer = document.getElementById("filters-repres-container");
    var icon = document.getElementById("chevron-repres"); // Sélectionner l'icône chevron

    if (filterContainer.style.display === "block") {
        // Masquer le conteneur
        filterContainer.style.display = "none";
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
    }
});