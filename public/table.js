import {updateLastRefresh} from './script.js';
import {currentStatusFilter, injectTransporteurs, injectRepresentants, injectEtats} from './filters.js';

export let allCommandes = []; // Pour stocker toutes les commandes récupérées
export let currentIndex = 0;  // Pour suivre l'indice des commandes actuellement affichées

const commandesPerBatch = 20; // Nombre de commandes à afficher à chaque fois

export let initialCommandes = []; // Pour stocker toutes les commandes initiales

export let selectedCommands = []; // Liste des commandes cochées

let firstOpen = true; // Pour savoir si c'est la première ouverture de la page

const pdfIcon = new Image();
pdfIcon.src = "images/pdf-icon.png";

let semaineAlu = ''; // Pour stocker la semaine en cours pour ALU
let semainePvc = ''; // Pour stocker la semaine en cours pour PVC
let caAlu = 0; // Pour stocker le CA en cours pour ALU
let caPvc = 0; // Pour stocker le CA en cours pour PVC

// fonctions pour modifier les variables allCommandes, currentIndex et initialCommandes
export function setAllCommandes(newCommandes) {
    allCommandes = newCommandes;
}

export function setCurrentIndex(newIndex) {
    currentIndex = newIndex;
}

// Faire une requête GET vers le serveur pour obtenir les informations de la semaine en cours et CA
fetch('/data/semaine-en-cours')
    .then(response => response.json())
    .then(data => {
        // Extraction des valeurs de semaine en cours pour ALU et PVC
        semaineAlu = data.GESCOMALU ? data.GESCOMALU[0] : 'Non défini';  // Première valeur de ALU
        semainePvc = data.GESCOMPVC ? data.GESCOMPVC[0] : 'Non défini'; // Première valeur de PVC

        // Affichage des semaines en cours dans le DOM
        document.getElementById('alu-doc').textContent = semaineAlu;
        document.getElementById('pvc-doc').textContent = semainePvc;

        // Extraction des valeurs CA pour ALU et PVC
        caAlu = data.GESCOMCAALU ? data.GESCOMCAALU[0] : 0;  // Première valeur du CA pour ALU
        caPvc = data.GESCOMCAPVC ? data.GESCOMCAPVC[0] : 0;  // Première valeur du CA pour PVC

        // Affichage du CA dans le DOM
        document.getElementById('alu-CA').textContent = caAlu + "€";
        document.getElementById('pvc-CA').textContent = caPvc + "€";
    })
    .catch(error => console.error('Erreur lors de la récupération des données de la semaine en cours:', error));

// Charger toutes les commandes dès que la page est chargée
loadAllCommandes();

function loadAllCommandes() {
    fetch(`/commandes`)
        .then(response => response.json())
        .then(data => {
            allCommandes = data;
            initialCommandes = data;            

            // Calculer le CA total pour chaque type de produit
            let caEnCoursAlu = 0;
            let caEnCoursPvc = 0;

            // Parcourir chaque commande et calculer le CA en cours
            data.forEach(commande => {
                if (commande.wlivr === semaineAlu) {
                    caEnCoursAlu += commande.prixportailAlu + commande.prixClotureAlu;  // Ajouter au CA en cours ALU
                }
                if (commande.wlivr === semainePvc) {
                    caEnCoursPvc += commande.prixportailPVC + commande.prixCloturePVC;  // Ajouter au CA en cours PVC
                }
            });

            // arrondir les valeurs à l'euro le plus proche
            caEnCoursAlu = Math.round(caEnCoursAlu);
            caEnCoursPvc = Math.round(caEnCoursPvc);

            // Calcul du reste pour ALU et PVC
            const resteAlu = caAlu - caEnCoursAlu;
            const restePvc = caPvc - caEnCoursPvc;

            // Affichage des résultats dans le DOM
            document.getElementById('alu-en-cours-reste').textContent = `${caEnCoursAlu} € / ${resteAlu} €`;
            document.getElementById('pvc-en-cours-reste').textContent = `${caEnCoursPvc} € / ${restePvc} €`;

            // Affiche le tableau des commandes de base
            changeTableForBaseView();

            // vérifier si prod-view a la classe active à l'ouverture
            if (document.getElementById('prod-view').classList.contains('active')) {
                changeTableForProdView();
            }

            loadNextBatch();  // Charger le premier lot

            // Mettre à jour le nombre de commandes et le CA total
            const numberOfCommands = document.getElementById('number-of-commands-and-ca');

            let totalCA = 0;

            allCommandes.forEach(commande => {
                totalCA += parseFloat(commande.PrixFabriquer) || 0;
                totalCA += parseFloat(commande.prixartcde) || 0;
                totalCA += parseFloat(commande.prixAutres) || 0;
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

                // Mettre à jour le nombre de commandes et le CA total
                calculateTotalCA(allCommandes);
            }

        })
        .catch(error => {
            console.error('Erreur lors de la récupération des commandes:', error);
        });
}

export function loadNextBatch() {

    let batch; 

    // Si c'est une nouvelle vue, on recommence à zéro
    if (newView) {
        currentIndex = 0;

        batch = allCommandes.slice(currentIndex, currentIndex + commandesPerBatch);
        currentIndex += commandesPerBatch;

        // Réinitialiser les commandes
        const listContainer = document.getElementById('commandes-list');
        listContainer.innerHTML = '';

        newView = false;
    } else {
        batch = allCommandes.slice(currentIndex, currentIndex + commandesPerBatch);
        currentIndex += commandesPerBatch;
    }


    // Afficher l'écran de chargement
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.visibility = 'visible';
    loadingScreen.style.opacity = '1';
    const loadingText = document.getElementById('loading-text');
    loadingText.innerHTML = 'Chargement des commandes...';

    // empecer le défilement pendant le chargement
    document.body.classList.add('no-scroll');
    
    
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
        ca += parseFloat(commande.prixartcde) || 0; // Ajouter le prix des accessoires
        ca += parseFloat(commande.prixAutres) || 0; // Ajouter le prix des autres produits

        // Si un seul chiffre après la virgule, ajouter un zéro
        if (ca % 1 !== 0) {
            ca = ca.toFixed(2);
        }

        // Récupérer la progression et le texte de l'état
        const { progression, stateText } = getStateProgression(commande.etat);

        // Remplacer les NomLot vides par /
        if (commande.NomLot === '-') {
            commande.NomLot = '/';
        }

        let complement;

        if (commande.NomLot !== '/') {
            complement = "Appro : " + commande.NomLot;
        } else {
            complement = "Appro : /"
        }
        
        if (commande.wfinprod !== '-') {
            complement += "<br>Fin production : " + commande.wfinprod;
        } else {
            complement += "<br>Fin production : /"
        }
        
        if (commande.NumeroBL !== 0) {
            complement += "<br>Bon de livraison : " + commande.NumeroBL;
        } else {
            complement += "<br>Bon de livraison : /"
        }
        
        if (commande.nfacture !== 0) {
            complement += "<br>Facture : " + commande.nfacture;
        } else {
            complement += "<br>Facture : /"
        }

        // Remplacer l'état par la barre de progression et le texte de l'état
        const stateDisplay = progression === '' ? stateText : `
        <div class="progress-bar">
            <div class="progress" style="width: ${Math.round((progression / 7) * 100)}%;"></div>
        </div>
        <div class="state-text">${stateText}</div> <!-- Texte de l'état sous la barre -->
        `;

        let transport = commande.descriptio; // Valeur par défaut

        if (commande.descriptio.includes('Transport ')) {
            // Retirer le mot "Transport " du début
            transport = commande.descriptio.replace('Transport ', '');
        }

        let commentaire = commande.notes;
        // si currentStatusFilter === 'groupage-ports', ajouter commande.fraisport dans la colonne commentaire
        if (currentStatusFilter === 'groupage-ports') {
            commentaire += `<br> <br>Frais de port : ${commande.fraisport} €`;
        }

        if (commande.TTAcomptes === '-') {
            commande.TTAcomptes = 0;
        }

        // si currentStatusFilter === 'attente-paiement', ajouter commande.paiement et commande.totconf - commande.TTAcomptes dans la colonne commentaire
        if (currentStatusFilter === 'attente-paiement') {
            commentaire += `<br> <br>Mode de paiement : ${commande.paiement}`;
            commentaire += `<br>Montant total des acomptes : ${commande.TTAcomptes} €`;
            commentaire += `<br>Reste à payer : ${commande.totconf - commande.TTAcomptes} €`;
        }

        const row = document.createElement('tr');

        // Si c'est la vue prod, ajouter les colonnes supplémentaires
        if (document.getElementById('prod-view').classList.contains('active')) {

            row.innerHTML = `
                <td class="check" id="check"><input type="checkbox"></td>
                <td class="commande">${commande.numero}</td>
                <td class="aravp">${commande.motifattente}</td>
                <td class="commentaire">${commentaire}</td>
                <td class="semliv">${commande.wlivr}</td>
                <td class="dep">${commande.deptlivr}</td>
                <td class="transp">${transport}</td>
                <td class="client">${commande.nom}</td>
                <td class="ref">${commande.reference}</td>
                <td class="portail">ici</td>
                <td class="cloture"></td>
                <td class="appro"></td>
                <td class="prod"></td>
                <td class="soudure"></td>
                <td class="gainage"></td>
                <td class="debit"></td>
                <td class="usinage"></td>
                <td class="montage"></td>
                <td class="cloture"></td>
                <td class="emballage"></td>
                <td class="finprod"></td>
                <td class="livraison"></td>
            `;
        } else {
            
            row.innerHTML = `
                <td class="check" id="check"><input type="checkbox"></td>
                <td class="commande">${commande.numero}</td>
                <td class="aravp">${commande.motifattente}</td>
                <td class="commentaire">${commentaire}</td>
                <td class="semliv">${commande.wlivr}</td>
                <td class="dep">${commande.deptlivr}</td>
                <td class="transp">${transport}</td>
                <td class="client">${commande.nom}</td>
                <td class="ref">${commande.reference}</td>
                <td class="ca">${ca} €</td>
                <td class="etat">${stateDisplay}</td>
                <td class="details">${complement}</td>
            `;
        }
            

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

        let facture = '';
        let bonCommande = '';
        let bonLivraison = '';

        // Récupérer les bons de commande
        fetch(`/doc/files/${commande.numero}`)
            .then(response => response.json())
            .then(data => {
                // Identifier les fichiers en fonction de leur préfixe
                const bonCommandes = data.filter(file => file.startsWith('ARC2') || file.startsWith('Cde'));

                // Assigner le premier fichier trouvé
                bonCommande = bonCommandes[0] || '';

                row.dataset.bonCommande = bonCommande;
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des fichiers:', error);
            });

        if (commande.NumeroBL !== 0) {
            // Récupérer les bons de livraison
            fetch(`/doc/files/${commande.numero}`)
                .then(response => response.json())
                .then(data => {
                    // Identifier les fichiers en fonction de leur préfixe
                    const bonsLivraison = data.filter(file => file.startsWith('BL'));

                    // Assigner le premier fichier trouvé
                    bonLivraison = bonsLivraison[0] || '';

                    row.dataset.bonLivraison = bonLivraison;
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des fichiers:', error);
                });
        }

        if (commande.nfacture !== 0) {
            // Récupérer les factures
            fetch(`/doc/files/${commande.nfacture}`)
                .then(response => response.json())
                .then(data => {
                    // Identifier les fichiers en fonction de leur préfixe
                    const factures = data.filter(file => file.startsWith('FW'));

                    // Assigner le premier fichier trouvé pour chaque type
                    facture = factures[0] || '';

                    row.dataset.facture = facture;
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des fichiers:', error);
                });
        }


        // Ajouter un gestionnaire de clic à chaque ligne du tableau
        listContainer.addEventListener('click', function(event) {
            // Vérifier si l'élément cliqué est une ligne de commande (tr)
            const row = event.target.closest('tr');

            // Si c'est une case à cocher, ne rien faire
            if (event.target.classList.contains('check')) return;

            // si c'est une case cochée, on ne fait rien
            if (event.target.tagName === 'INPUT') return;

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
                    <div id="fichiers" class="files-container">
                        <div id="bon-commande" class="file-item">
                            <img src="images/pdf-icon.png" alt="PDF Icon" class="pdf-icon">
                            <p>Bon de commande</p>
                        </div>
                        <div class="file-item" id="bon-livraison">
                            <img src="images/pdf-icon.png" alt="PDF Icon" class="pdf-icon">
                            <p>Bon de livraison</p>
                        </div>
                        <div class="file-item" id="facture">
                            <img src="images/pdf-icon.png" alt="PDF Icon" class="pdf-icon">
                            <p>Facture</p>
                        </div>
                    </div>
                </div>
            `;

            // Récupérer les divs contenant les fichiers
            const bonLivraisonDiv = document.getElementById('bon-livraison');
            const factureDiv = document.getElementById('facture');

            // Vérifie si bonLivraison contient '.pdf' et affiche la div si c'est le cas
            if (row.dataset.bonLivraison && (row.dataset.bonLivraison.includes('.pdf') || row.dataset.bonLivraison.includes('.PDF'))) {
                bonLivraisonDiv.style.display = 'block'; // ou une autre méthode pour rendre visible
            } else {
                bonLivraisonDiv.style.display = 'none'; // Masque la div si ce n'est pas le cas
            }

            // Vérifie si facture contient '.pdf' et affiche la div si c'est le cas
            if (row.dataset.facture && (row.dataset.facture.includes('.pdf') || row.dataset.facture.includes('.PDF'))) {
                factureDiv.style.display = 'block'; // ou une autre méthode pour rendre visible
            } else {
                factureDiv.style.display = 'none'; // Masque la div si ce n'est pas le cas
            }

            // Afficher la popup
            const popup = document.getElementById('commande-popup');
            popup.style.display = 'flex';

            // Ajouter l'événement de clic sur l'élément bon-commande
            document.getElementById('bon-commande').addEventListener('click', function() {
                if (row.dataset.bonCommande) {
                    // Construire le chemin de la requête HTTP pour le fichier PDF
                    const pdfUrl = `/pdf/${row.dataset.bonCommande}`;
    
                    // Ouvrir le fichier PDF dans un nouvel onglet
                    window.open(pdfUrl, '_blank');
                } else {
                    console.log('Aucun bon de commande trouvé');
                }
            });

            // Ajouter l'événement de clic sur l'élément bon-commande
            document.getElementById('bon-livraison').addEventListener('click', function() {
                if (row.dataset.bonLivraison) {
                    // Construire le chemin de la requête HTTP pour le fichier PDF
                    const pdfUrl = `/pdf/${row.dataset.bonLivraison}`;
    
                    // Ouvrir le fichier PDF dans un nouvel onglet
                    window.open(pdfUrl, '_blank');
                } else {
                    console.log('Aucun bon de livraison trouvé');
                }
            });

            // Ajouter l'événement de clic sur l'élément bon-commande
            document.getElementById('facture').addEventListener('click', function() {
                if (row.dataset.facture) {
                    // Construire le chemin de la requête HTTP pour le fichier PDF
                    const pdfUrl = `/pdf/${row.dataset.facture}`;
    
                    // Ouvrir le fichier PDF dans un nouvel onglet
                    window.open(pdfUrl, '_blank');
                } else {
                    console.log('Aucune facture trouvée');
                }
            });
    
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

        // Si la commande est dans la liste des commandes selectionnées, cocher la case et ajouter la classe selected
        const check = row.querySelector('.check input');
        if (selectedCommands.includes(commande.numero)) {
            check.checked = true;

            // Ajouter la classe selected
            row.classList.add('selected');
        }

        if (firstOpen) {
            // Initialiser l'injection des transporteurs
            injectTransporteurs();
            // Initialiser l'injection des états
            injectEtats();
            // Initialiser l'injection des représentants
            injectRepresentants();
        }

        // Mettre à jour l'heure de rafraîchissement
        updateLastRefresh();

        listContainer.appendChild(row);
    });

    // Masquer l'écran de chargement une fois que les commandes sont affichées
    loadingScreen.style.visibility = 'hidden';
    loadingText.textContent = 'Chargement...'; // Réinitialise le texte

    // Réactiver le défilement
    document.body.classList.remove('no-scroll');

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
export function getStateText(commandeEtat) {
    if (commandeEtat < 280) return 'Enregistrée';
    if (commandeEtat === 280) return 'Traitée';
    if (commandeEtat === 400) return 'Validée';
    if (commandeEtat === 500) return 'Approvisionnement';
    if (commandeEtat === 600) return 'Production';
    if (commandeEtat === 740) return 'Fin production';
    if (commandeEtat === 800) return 'Livraison';
    if (commandeEtat === 850) return 'Facture';
}

export function calculateTotalCA(commandes) {
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

        // si une valeur n'est pas un nombre, on la remplace par 0
        if (isNaN(parseFloat(commande.prixportailAlu))) {
            commande.prixportailAlu = 0;
        }

        if (isNaN(parseFloat(commande.prixClotureAlu))) {
            commande.prixClotureAlu = 0;
        }

        if (isNaN(parseFloat(commande.prixportailPVC))) {
            commande.prixportailPVC = 0;
        }

        if (isNaN(parseFloat(commande.prixCloturePVC))) {
            commande.prixCloturePVC = 0;
        }

        if (isNaN(parseFloat(commande.prixAutres))) {
            commande.prixAutres = 0;
        }

        if (isNaN(parseFloat(commande.prixartcde))) {
            commande.prixartcde = 0;
        }

        if (isNaN(parseFloat(commande.PrixFabriquer))) {
            commande.PrixFabriquer = 0;
        }

        if (isNaN(parseFloat(commande.totconf))) {
            commande.totconf = 0;
        }

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

    // Arrondir à l'entier le plus proche (pas de décimales)
    caTotalPortailsAlu = Math.round(caTotalPortailsAlu);
    caTotalCloturesAlu = Math.round(caTotalCloturesAlu);
    caTotalPortailsPVC = Math.round(caTotalPortailsPVC);
    caTotalCloturesPVC = Math.round(caTotalCloturesPVC);
    caTotalAlu = Math.round(caTotalAlu);
    caTotalPVC = Math.round(caTotalPVC);
    caTotalAcces = Math.round(caTotalAcces);
    caTotal = Math.round(caTotal);
    caTotalFacture = Math.round(caTotalFacture);    

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

    //Réinitialiserl'affichage des commandes
    currentIndex = 0; //Réinitialiserl'indice des commandes affichées
    const table = document.getElementById('commandes-list');
    table.innerHTML = ''; // Vider le tableau

    // Afficher les commandes triées (batchées)
    allCommandes = sortedCommandes;

    // Mettre à jour le nombre de commandes et le CA total
    const numberOfCommands = document.getElementById('number-of-commands-and-ca');

    let totalCA = 0;

    allCommandes.forEach(commande => {
        totalCA += parseFloat(commande.PrixFabriquer) || 0;
        totalCA += parseFloat(commande.prixartcde) || 0;
        totalCA += parseFloat(commande.prixAutres) || 0;
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

        // Mettre à jour le nombre de commandes et le CA total
        calculateTotalCA(allCommandes);
    }

    loadNextBatch(); // Charger le premier lot trié
});

/* ---- VUE DE BASE ---- */

// savoir si la vue est nouvelle pour charger les commandes depuis le début si c'est le cas
let newView = false;

// Ecouteur pour le clic sur la vue adv
document.getElementById('adv-view').addEventListener('click', function () {
    newView = true;
    changeTableForBaseView();
    newView = false;
});

// Ecoutuer pour le clic sur la vue livr
document.getElementById('livr-view').addEventListener('click', function () {
    newView = true;
    changeTableForBaseView();
    newView = false;
});

function changeTableForBaseView() {

    newView = true;

    // Vider le contenu du tableau
    const tableContent = document.getElementById('commandes-list');
    tableContent.innerHTML = ''; // Vider le tableau pour le remplir à nouveau

    /* mettre les en-têtes de colonnes */
    const table = document.getElementById('table-header');
    table.innerHTML = `
        <th class="check"></th>
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

    loadNextBatch(); // Charger le premier lot trié
}

/* ---- VUE PROD ---- */

// Si la vue prod est active, le tableau change

// Écouteur pour le clic sur la vue production
document.getElementById('prod-view').addEventListener('click', function () {
    newView = true;
    changeTableForProdView();
    newView = false;
});

// Fonction pour changer le tableau en vue production
function changeTableForProdView() {

    // Vider le contenu du tableau
    const tableContent = document.getElementById('commandes-list');
    tableContent.innerHTML = ''; // Vider le tableau pour le remplir à nouveau

    // Changement des en-têtes de colonnes
    // Check Commande AR/AVP Commentaire Sem. de liv. Dép. Transporteur Client Référence Portail Clôture Appro prod soudure gainage Débit Usinage Montage Cloture Emballage Fin prod Livraison
    const table = document.getElementById('table-header');
    table.innerHTML = `
        <th class="check"></th>
        <th class="commande-prod">Commande</th>
        <th class="aravp">AR/AVP</th>
        <th class="commentaire-prod">Commentaire</th>
        <th class="semliv-prod" title="Semaine de livraison">Sem. de liv.</th>
        <th class="dep" title="Département de livraison">Dép.</th>
        <th class="transp-prod">Transp.</th>
        <th class="client-prod">Client</th>
        <th class="ref-prod">Réf.</th>
        <th class="portail">Port.</th>
        <th class="cloture">Clot.</th>
        <th class="appro">Appro.</th>
        <th class="prod">Prod.</th>
        <th class="soudure">Soud.</th>
        <th class="gainage">Gaina.</th>
        <th class="debit">Débit</th>
        <th class="usinage">Usina.</th>
        <th class="montage">Monta.</th>
        <th class="cloture">Clotu.</th>
        <th class="emballage">Embal.</th>
        <th class="finprod">Fin prod.</th>
        <th class="livraison">Livr.</th>
    `;

    loadNextBatch(); // Charger le premier lot trié
}