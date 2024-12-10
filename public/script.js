// Remplir la date dans le bandeau
document.getElementById('current-date').textContent = new Date().toLocaleDateString();

// Restaure l'heure du dernier rafraîchissement depuis le localStorage
const lastRefresh = localStorage.getItem('lastRefresh');
if (lastRefresh) {
    document.getElementById('last-refresh').textContent = lastRefresh;
}

// Fonction pour mettre à jour l'heure du dernier rafraîchissement
export function updateLastRefresh() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    localStorage.setItem('lastRefresh', formattedTime); // Sauvegarde dans le localStorage
    document.getElementById('last-refresh').textContent = formattedTime; // Mise à jour de l'affichage
}

// Bouton d'actualisation
document.getElementById('refresh-button').addEventListener('click', () => {
    // se souvenir de la vue active
    const activeView = document.querySelector('.views button.active').id;
    localStorage.setItem('activeView', activeView); // Stocker la vue active dans le localStorage pour la recharger après le rafraîchissement
    location.reload(); // Recharge la page
});

// Vérifier et restaurer la vue active après le rechargement
window.addEventListener('load', () => {
    const activeView = localStorage.getItem('activeView');
    if (activeView) {
        // Activer la vue précédemment sélectionnée
        setActiveView(activeView);
    }
});

document.getElementById('adv-view').addEventListener('click', () => {
    setActiveView('adv-view');
});

document.getElementById('prod-view').addEventListener('click', () => {
    setActiveView('prod-view');
});

document.getElementById('livr-view').addEventListener('click', () => {
    setActiveView('livr-view');
});


// Fonction pour activer le bouton cliqué et désactiver les autres
function setActiveView(viewId) {
    // Supprimer la classe active de tous les boutons
    document.querySelectorAll('.views button').forEach(button => {
        button.classList.remove('active');
    });

    // Ajouter la classe active au bouton cliqué
    document.getElementById(viewId).classList.add('active');

    if (viewId === 'livr-view') {
        // Changer toutes les occurrences de bleu (#004d99) en vert (#4CAF50)
        document.getElementById('header').style.backgroundColor = '#4CAF50';

        // Modifier la couleur de fond de header .views button.active
        document.styleSheets[0].addRule('#header .views button.active', 'background-color: #4CAF50');

        // Modifier la couleur de fond de header .refresh-button.active
        document.styleSheets[0].addRule('#header .refresh-button.active', 'background-color: #4CAF50');

        // Modifier la couleur de fond de .filters button
        document.styleSheets[0].addRule('.filters button', 'background-color: #4CAF50');

        // Modifier la couleur de fond de table th
        document.styleSheets[0].addRule('table th', 'background-color: #4CAF50');

        // Modifier la couleur de fond de .popup button
        document.styleSheets[0].addRule('.popup button', 'background-color: #4CAF50');

        // Modifier la couleur de fond de aside
        document.styleSheets[0].addRule('aside', 'background-color: #e6ffe6;');

        // Modifier la couleur de fond de #produits-alu.active, #produits-pvc.active, #produits-tous.active
        document.styleSheets[0].addRule('#produits-alu.active', 'background-color: #4CAF50');
        document.styleSheets[0].addRule('#produits-pvc.active', 'background-color: #4CAF50');
        document.styleSheets[0].addRule('#produits-tous.active', 'background-color: #4CAF50');

    } else if (viewId === 'adv-view') {
        // Revenir à la couleur bleue (#004d99)
        document.getElementById('header').style.backgroundColor = '#004d99';

        // Modifier la couleur de fond de header .views button.active
        document.styleSheets[0].addRule('#header .views button.active', 'background-color: #004d99');

        // Modifier la couleur de fond de header .refresh-button.active
        document.styleSheets[0].addRule('#header .refresh-button.active', 'background-color: #004d99');

        // Modifier la couleur de fond de .filters button
        document.styleSheets[0].addRule('.filters button', 'background-color: #004d99');

        // Modifier la couleur de fond de table th
        document.styleSheets[0].addRule('table th', 'background-color: #004d99');

        // Modifier la couleur de fond de .popup button
        document.styleSheets[0].addRule('.popup button', 'background-color: #004d99');

        // Modifier la couleur de fond de aside
        document.styleSheets[0].addRule('aside', 'background-color: #e6f7ff;');

        // Modifier la couleur de fond de #produits-alu.active, #produits-pvc.active, #produits-tous.active
        document.styleSheets[0].addRule('#produits-alu.active', 'background-color: #004d99');
        document.styleSheets[0].addRule('#produits-pvc.active', 'background-color: #004d99');
        document.styleSheets[0].addRule('#produits-tous.active', 'background-color: #004d99');

    } else if (viewId === 'prod-view') {
        // Changer la couleur de l'en-tête en rouge (#FF8C00)
        document.getElementById('header').style.backgroundColor = '#FF8C00';

        // Modifier la couleur de fond de header .views button.active
        document.styleSheets[0].addRule('#header .views button.active', 'background-color: #FF8C00');

        // Modifier la couleur de fond de header .refresh-button.active
        document.styleSheets[0].addRule('#header .refresh-button.active', 'background-color: #FF8C00');

        // Modifier la couleur de fond de .filters button
        document.styleSheets[0].addRule('.filters button', 'background-color: #FF8C00');

        // Modifier la couleur de fond de table th
        document.styleSheets[0].addRule('table th', 'background-color: #FF8C00');

        // Modifier la couleur de fond de .popup button
        document.styleSheets[0].addRule('.popup button', 'background-color: #FF8C00');

        // Modifier la couleur de fond de aside
        document.styleSheets[0].addRule('aside', 'background-color: #ffe6cc;');

        // Modifier la couleur de fond de #produits-alu.active, #produits-pvc.active, #produits-tous.active
        document.styleSheets[0].addRule('#produits-alu.active', 'background-color: #FF8C00');
        document.styleSheets[0].addRule('#produits-pvc.active', 'background-color: #FF8C00');
        document.styleSheets[0].addRule('#produits-tous.active', 'background-color: #FF8C00');
    }
}

// Faire une requête GET vers le serveur pour obtenir les informations de la semaine en cours et CA
fetch('/data/semaine-en-cours')
    .then(response => response.json())
    .then(data => {
        // Extraction des valeurs de semaine en cours pour ALU et PVC
        const semaineAlu = data.GESCOMALU ? data.GESCOMALU[0] : 'Non défini';  // Première valeur de ALU
        const semainePvc = data.GESCOMPVC ? data.GESCOMPVC[0] : 'Non défini'; // Première valeur de PVC

        // Affichage des semaines en cours dans le DOM
        document.getElementById('alu-doc').textContent = semaineAlu;
        document.getElementById('pvc-doc').textContent = semainePvc;

        // Extraction des valeurs CA pour ALU et PVC
        const caAlu = data.GESCOMCAALU ? data.GESCOMCAALU[0] : 0;  // Première valeur du CA pour ALU
        const caPvc = data.GESCOMCAPVC ? data.GESCOMCAPVC[0] : 0;  // Première valeur du CA pour PVC

        // Affichage du CA dans le DOM
        document.getElementById('alu-CA').textContent = caAlu + "€";
        document.getElementById('pvc-CA').textContent = caPvc + "€";

        // Calcul des valeurs "en cours" et "reste"
        calculateEnCoursReste(caAlu, caPvc, semaineAlu, semainePvc);
    })
    .catch(error => console.error('Erreur lors de la récupération des données de la semaine en cours:', error));

// Fonction pour calculer le CA en cours et le reste
function calculateEnCoursReste(caAlu, caPvc, semaineAlu, semainePvc) {
    // Faire une requête GET vers le serveur pour obtenir les commandes
    fetch('/commandes')
        .then(response => response.json())  // Recevoir la réponse sous forme de JSON
        .then(data => {
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
        })
        .catch(error => console.error('Erreur lors de la récupération des commandes:', error));  // Gestion des erreurs
}

/* EASTEREGG PLM */

// Le clic sur plm-button affiche une popup ou il faut renseigner un code (le code est plm). Si le code est bon on modifie la couleur de fond du header et on ferme la popup, sinon si le code est mauvais on ferme la popup.
document.getElementById('plm-button').addEventListener('click', () => {
    // Afficher la popup
    const popupplm = document.createElement('div');
    popupplm.classList.add('popup-plm');
    popupplm.innerHTML = `
      <div class="popup-plm-content">
        <label for="code-plm">Entrez le code :</label>
        <input type="text" id="code-plm" />
        <button id="submitCode-plm">Valider</button>
        <button id="closePopup-plm">Fermer</button>
      </div>
    `;
    document.body.appendChild(popupplm);
  
    // Fonction pour vérifier le code
    const correctCode = 'Kod kuzh';
    document.getElementById('submitCode-plm').addEventListener('click', () => {
      const enteredCode = document.getElementById('code-plm').value;
      if (enteredCode === correctCode) {
        

        // Mofifier le cursor de html
        document.styleSheets[0].addRule('html', 'cursor: url("https://files.softicons.com/download/animal-icons/animal-icons-by-martin-berube/png/32/mouse.png"), auto;');

        const header = document.querySelector('header');
        
        header.style.backgroundImage = 'url("https://www.francebleu.fr/s3/cruiser-production-eu3/2024/05/d495e897-9e0f-4aba-835b-52476ad792a2/1200x680_sc_pxl-20240520-111314664-mp.jpg")';
        header.style.backgroundSize = 'cover'; // Ajuster la taille de l'image
        header.style.backgroundPosition = 'center'; // Centrer l'image

        // Ajouter un overlay sombre par-dessus le header
        const overlay = document.createElement('div');
        overlay.classList.add('header-overlay');
        header.appendChild(overlay);

        // Modifier le fond de aside
        document.styleSheets[0].addRule('aside', 'background-image: url("https://media.letelegramme.fr/api/v1/images/view/63a70821d11d004878764368/web_golden_xl/63a70821d11d004878764368.1');
        document.styleSheets[0].addRule('aside', 'background-size: 400px');
        document.styleSheets[0].addRule('aside', 'background-position: center');


        // Ajouter un overlay sombre par-dessus aside
        const overlayAside = document.createElement('div');
        overlayAside.classList.add('aside-overlay');
        document.querySelector('aside').appendChild(overlayAside);

        // Supprimer la couleur de fond de aside
        document.styleSheets[0].addRule('aside', 'background-color: transparent');

        // Fermer la popup avec animation de confettis
        closePopupWithConfetti(popupplm);
      }

      // Fermer la popup
      document.body.removeChild(popupplm);
    });
  
    // Fonction pour fermer la popup sans vérifier le code
    document.getElementById('closePopup-plm').addEventListener('click', () => {
      document.body.removeChild(popupplm);
    });

    function closePopupWithConfetti(popup) {
        // Liste des images à mélanger
        const images = [
            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Flag_of_Brittany_%28Gwenn_ha_du%29.svg/1200px-Flag_of_Brittany_%28Gwenn_ha_du%29.svg.png',
            'https://www.berco-design.com/wp-content/uploads/2024/10/Skaw-profil.png'
        ];
    
        for (let i = 0; i < 150; i++) {  // Augmenter le nombre d'éléments
            const randomImage = images[Math.floor(Math.random() * images.length)];  // Choisir une image aléatoire
            const element = document.createElement('div');
            element.classList.add('falling-object');
            element.style.left = `${Math.random() * 100}vw`;  // Placement aléatoire sur toute la largeur
            element.style.top = `${Math.random() * 100 - 100}vh`;   // Placement aléatoire sur toute la hauteur
            element.style.animationDuration = `${Math.random() * 0.5 + 2.5}s`;  // Durée d'animation aléatoire
            element.style.backgroundImage = `url(${randomImage})`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.width = '200px';  // Taille de l'élément
            element.style.height = '200px'; // Taille de l'élément
            document.body.appendChild(element);
        }
    
        // Attendre la fin de l'animation avant de supprimer la popup
        setTimeout(() => {
            document.body.removeChild(popup);  // Supprimer la popup après l'animation
            const elements = document.querySelectorAll('.falling-object');
            elements.forEach(element => element.remove());  // Supprimer les objets après l'animation
        }, 15000);  // 15 secondes (temps de l'animation)

        // Ajouter le bouton de bascule du mode sombre/clair
        const modeToggle = document.createElement('div');
        modeToggle.classList.add('mode-toggle');
        modeToggle.innerHTML = `
            <button id="theme-toggle" aria-label="Basculer le mode sombre/clair">
                <img src="https://img.icons8.com/material-outlined/24/000000/sun.png" alt="Mode clair" id="sun-icon" style="filter: invert(1) hue-rotate(180deg);" />
                <img src="https://img.icons8.com/material-outlined/24/000000/moon.png" alt="Mode sombre" id="moon-icon" style="display: none; filter: invert(1) hue-rotate(180deg);" />
            </button>
        `;

        // ajouter a la fin du header
        document.querySelector('header').appendChild(modeToggle);

        const sunIcon = document.getElementById("sun-icon");
        const moonIcon = document.getElementById("moon-icon");

        // Si c'est le soleil qui est cliqué
        sunIcon.addEventListener("click", () => {
            console.log("Passer au thème sombre");

            // Changer l'icône du soleil en lune
            sunIcon.style.display = "none";
            moonIcon.style.display = "block";

            document.styleSheets[0].addRule('html', 'filter: invert(1) hue-rotate(180deg);');
        });

        // Si c'est la lune qui est cliquée
        moonIcon.addEventListener("click", () => {
            console.log("Passer au thème clair");

            // Changer l'icône de la lune en soleil
            moonIcon.style.display = "none";
            sunIcon.style.display = "block";

            document.styleSheets[0].addRule('html', 'filter: invert(0) hue-rotate(0deg);');
        });
    }
  });