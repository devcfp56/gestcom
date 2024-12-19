import {updateLastRefresh} from './script.js';

export let allCommandes = []; // Pour stocker toutes les commandes récupérées
let currentIndex = 0;  // Pour suivre l'indice des commandes actuellement affichées
const commandesPerBatch = 20; // Nombre de commandes à afficher à chaque fois

let initialCommandes = []; // Pour stocker toutes les commandes initiales

let firstOpen = true; // Pour savoir si c'est la première ouverture de la page

const pdfIcon = new Image();
pdfIcon.src = "images/pdf-icon.png";

let semaineAlu = ''; // Pour stocker la semaine en cours pour ALU
let semainePvc = ''; // Pour stocker la semaine en cours pour PVC
let caAlu = 0; // Pour stocker le CA en cours pour ALU
let caPvc = 0; // Pour stocker le CA en cours pour PVC

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

            loadNextBatch();  // Charger le premier lot
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des commandes:', error);
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

            // si c'est la colonne 1, on ne fait rien
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

    console.log(commandes.length);

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

//* ---- Filtres ---- */

let firstPassage = true;

let currentProductFilter = 'Tous';
let currentTransportFilter = 'Tous';
let currentEtatFilter = 'Tous';

let currentWeekFilter = '';
let currentYearFilter = '';

let currentStartDateFilter = '';
let currentEndDateFilter = '';

let currentEnAttenteFilter = false;

let currentSearchValue = ''; // Valeur de recherche actuelle

let currentStatusFilter = '';

let dateTriType = 'livraison'; // Tri par défaut

let currentSearchClient = '';

let currentRepresentantFilter = 'Tous';

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
        initialCommandes = allCommandes; // Stocker toutes les commandes initiales
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
    currentIndex = 0;
    const table = document.getElementById('commandes-list');
    table.innerHTML = ''; // Vider le tableau
    allCommandes = filteredCommandes; // Utiliser les commandes filtrées

    // Si currentStatusFilter === 'groupage-ports', trier les commandes par nom de client
    if (currentStatusFilter === 'groupage-ports') {
        allCommandes.sort((a, b) => a.nom.localeCompare(b.nom));
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
function injectTransporteurs() {
    
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
function injectRepresentants() {
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
function injectEtats() {
    
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