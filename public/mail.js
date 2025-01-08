/* ---- Envoi de mail ---- */

/* ---- Commandes selectionnées ---- */
import { selectedCommands, allCommandes } from './table.js';

// Écouteur pour les cases à cocher
document.getElementById('commandes-list').addEventListener('change', function(event) {
    if (event.target.tagName === 'INPUT') {
        const row = event.target.closest('tr');
        const commandNumber = row.querySelector('.commande').textContent;

        if (event.target.checked) {
            selectedCommands.push(commandNumber);
        } else {
            const index = selectedCommands.indexOf(commandNumber);
            selectedCommands.splice(index, 1);
        }

        // mettre à jour le nombre de commandes sélectionnées
        const numberOfSelected = document.getElementById('number-of-selected');
        numberOfSelected.textContent = `Nombre de commandes sélectionnées : ${selectedCommands.length}`;

        console.log(selectedCommands);
    }
});

/* ---- ACTIONS LIVR. ---- */
// select-all (ajoute toutes les filteredCommandes à la liste des commandes sélectionnées et coche la case de la première colonne)
document.getElementById('select-all').addEventListener('click', function() {
    if (this.classList.contains('active')) {
        // Désélectionne toutes les commandes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Vide la liste des commandes sélectionnées
        selectedCommands.length = 0;

        // Retire la classe active de select-all
        this.classList.remove('active');

        // Retire .selected de la ligne
        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('selected');
        });
    } else {
        // Coche toutes les cases à cocher
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });

        // Ajoute toutes les commandes à la liste des commandes sélectionnées
        selectedCommands.length = 0; // Vide la liste
        allCommandes.forEach(commande => {
            selectedCommands.push(commande.numero);
        });

        // Ajoute la classe active à select-all
        this.classList.add('active');

        // Ajoute .selected à la ligne
        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.add('selected');
        });

        // Supprime la classe active de select-all-correze
        document.getElementById('select-all-correze').classList.remove('active');
    }

    // mettre à jour le nombre de commandes sélectionnées
    const numberOfSelected = document.getElementById('number-of-selected');
    numberOfSelected.textContent = `Nombre de commandes sélectionnées : ${selectedCommands.length}`;

    console.log(selectedCommands);
});

// select-all-correze (ajoute toutes les commandes sauf celles où client = 'CORREZE FERMETURE' à la liste des commandes sélectionnées et coche la case de la première colonne)
document.getElementById('select-all-correze').addEventListener('click', function() {
    if (this.classList.contains('active')) {
        // Désélectionne toutes les commandes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Vide la liste des commandes sélectionnées
        selectedCommands.length = 0;

        // Retire la classe active de select-all-correze
        this.classList.remove('active');

        // Retire .selected de la ligne
        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.remove('selected');
        });
    } else {

        selectedCommands.length = 0; // Vide la liste

        allCommandes.forEach(commande => {
            if (commande.nom !== 'CORREZE FERMETURE' && commande.nom !== 'MEN 85' && commande.nom !== 'LALLEMANT FERMETURES SAS') {
                selectedCommands.push(commande.numero);

                // Coche la case à cocher et ajoute .selected à la ligne
                const rows = document.querySelectorAll('tr');
                rows.forEach(row => {
                    const commandNumber = row.querySelector('.commande').textContent;
                    if (selectedCommands.includes(commandNumber)) {
                        row.classList.add('selected');
                        row.querySelector('input[type="checkbox"]').checked = true;
                    }
                });
            }
        });

        // Ajoute la classe active à select-all-correze
        this.classList.add('active');

        // Supprime la classe active de select-all
        document.getElementById('select-all').classList.remove('active');
    }

    // mettre à jour le nombre de commandes sélectionnées
    const numberOfSelected = document.getElementById('number-of-selected');
    numberOfSelected.textContent = `Nombre de commandes sélectionnées : ${selectedCommands.length}`;

    console.log(selectedCommands);
});

/* ---- Mail de BL ---- */

// récupération du numéro de téléphone du transporteur
function getTelTransporteur(transporteur) {
    if (transporteur.includes('TRS')) {
        return '02.41.49.49.72';
    } else if (transporteur.includes('PASQUIER')) {
        return '02.41.63.65.64';
    }
    return '***';
}

/* Envoie du mail BL au clic sur le bouton mail-bl */
document.getElementById('send-mail-bl').addEventListener('click', () => {
    // Boucler sur chaque commande sélectionnée
    selectedCommands.forEach((numCommande) => {
        // Récupérer les informations de la commande
        const commande = allCommandes.find((commande) => commande.numero === numCommande);

        if (!commande) {
            console.error(`Commande ${numCommande} introuvable.`);
            return;
        }

        const transporteur = commande.descriptio || '';
        const tel = getTelTransporteur(transporteur);

        // Si pas de BL, ne pas envoyer de mail et passer à la commande suivante
        if (commande.NumeroBL === 0) {
            console.error(`Pas de BL pour la commande ${numCommande}.`);
            
            // Afficher un message dans la boite de dialogue
            alert(`Pas de BL pour la commande ${numCommande}.`);
            return; // Passer à la commande suivante
        }

        const BL = `W:/pdf/BL${numCommande}.pdf` || '';
        const ref = commande.reference || '';
        const numeroBL = commande.NumeroBL || '';

        // Envoyer un mail pour chaque commande
        fetch('/mail/send-mail-bl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transport: transporteur,
                tel: tel,
                BL: BL,
                ref: ref,
                numeroBL: numeroBL,
                numeroCommande: numCommande
            })
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(`Mail envoyé pour la commande ${numCommande}:`, data);
        })
        .catch((error) => {
            console.error(`Erreur lors de l'envoi du mail pour la commande ${numCommande}:`, error);
        });
    });

    // Fermer la popup
    const mailBlPopup = document.getElementById('mail-bl-popup');
    mailBlPopup.style.display = 'none';
});

// mail-bl-popup s'ouvre au clic sur le bouton mail-bl
document.getElementById('mail-bl').addEventListener('click', () => {
    const mailBlPopup = document.getElementById('mail-bl-popup');
    mailBlPopup.style.display = 'flex';

    // Mettre à jour mail-text avec les commandes sélectionnées "Envoyer le mail BL des X commandes sélectionnées ?"
    const mailText = document.getElementById('mail-text');
    mailText.textContent = `Envoyer le mail BL des ${selectedCommands.length} commandes sélectionnées ?`;

    if (selectedCommands.length === 1) {
        mailText.textContent = `Envoyer le mail BL de la commande sélectionnée ?`;
    } else if (selectedCommands.length === 0) {
        mailText.textContent = `Aucune commande sélectionnée`;
    }

    // Mettre à jour le nombre de commandes sélectionnées send-mail-bl "Envoyer les X mails"
    const sendMailBl = document.getElementById('send-mail-bl');
    sendMailBl.textContent = `Envoyer les ${selectedCommands.length} mails`;

    if (selectedCommands.length === 1) {
        sendMailBl.textContent = `Envoyer le mail`;
    }

    // Si 0 commandes sélectionnées, désactiver le bouton
    if (selectedCommands.length === 0) {
        sendMailBl.disabled = true;

        // Changement de couleur du bouton
        sendMailBl.style.backgroundColor = 'grey';
    } else {
        sendMailBl.disabled = false;

        // Changement de couleur du bouton
        sendMailBl.style.backgroundColor = '#4CAF50';
    }
});

// fermeture de mail-bl-popup
document.getElementById('mail-bl-popup-close').addEventListener('click', () => {
    const mailBlPopup = document.getElementById('mail-bl-popup');
    mailBlPopup.style.display = 'none';
});

// fermeture de mail-bl-popup au clic en dehors
window.addEventListener('click', (event) => {
    const mailBlPopup = document.getElementById('mail-bl-popup');
    if (event.target === mailBlPopup) {
        mailBlPopup.style.display = 'none';
    }
});

/* ---- Mail de paiement ---- */

// mail-paiement-popup s'ouvre au clic sur le bouton mail-paiement
document.getElementById('mail-paiement').addEventListener('click', () => {
    const mailPaiementPopup = document.getElementById('mail-paiement-popup');
    mailPaiementPopup.style.display = 'flex';

    // Mettre à jour mail-text avec les commandes sélectionnées "Envoyer le mail de paiement des X commandes sélectionnées ?"
    const mailText = document.getElementById('mail-paiement-text');
    mailText.textContent = `Envoyer le mail de paiement avant fabrication des ${selectedCommands.length} commandes sélectionnées ?`;

    if (selectedCommands.length === 1) {
        mailText.textContent = `Envoyer le mail de paiement avant fabrication de la commande sélectionnée ?`;
    } else if (selectedCommands.length === 0) {
        mailText.textContent = `Aucune commande sélectionnée`;
    }

    // Mettre à jour le nombre de commandes sélectionnées send-mail-paiement "Envoyer les X mails"
    const sendMailPaiement = document.getElementById('send-mail-paiement');
    sendMailPaiement.textContent = `Envoyer les ${selectedCommands.length} mails`;

    if (selectedCommands.length === 1) {
        sendMailPaiement.textContent = `Envoyer le mail`;
    }

    // Si 0 commandes sélectionnées, désactiver le bouton
    if (selectedCommands.length === 0) {
        sendMailPaiement.disabled = true;

        // Changement de couleur du bouton
        sendMailPaiement.style.backgroundColor = 'grey';
    } else {
        sendMailPaiement.disabled = false;

        // Changement de couleur du bouton
        sendMailPaiement.style.backgroundColor = '#4CAF50';
    }
});

// fermeture de mail-paiement-popup
document.getElementById('mail-paiement-popup-close').addEventListener('click', () => {
    const mailPaiementPopup = document.getElementById('mail-paiement-popup');
    mailPaiementPopup.style.display = 'none';
});

// fermeture de mail-paiement-popup au clic en dehors
window.addEventListener('click', (event) => {
    const mailPaiementPopup = document.getElementById('mail-paiement-popup');
    if (event.target === mailPaiementPopup) {
        mailPaiementPopup.style.display = 'none';
    }
});

// Envoie du mail de paiement au clic sur le bouton send-mail-paiement
document.getElementById('send-mail-paiement').addEventListener('click', () => {
    // Boucler sur chaque commande sélectionnée
    selectedCommands.forEach((numCommande) => {
        // Récupérer les informations de la commande
        const commande = allCommandes.find((commande) => commande.numero === numCommande);

        if (!commande) {
            console.error(`Commande ${numCommande} introuvable.`);
            return;
        }

        // date de fabrication = Date livraison -8 jours (dlivraison au format 'YYYY-MM-DD')
        // Récupérer la date de livraison au format 'YYYY-MM-DD'
        const dateLivraison = new Date(commande.dlivraison);

        // Soustraire 8 jours
        const dateFabrication = new Date(dateLivraison);
        dateFabrication.setDate(dateLivraison.getDate() - 8);

        // Passer les dates en format 'DD/MM/YYYY'
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const dateFabricationStr = dateFabrication.toLocaleDateString('fr-FR', options);
        const dateLivraisonStr = dateLivraison.toLocaleDateString('fr-FR', options);


        // Envoyer un mail pour chaque commande
        fetch('/mail/send-mail-paiement', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numeroCommande: numCommande,
                dateFabrication: dateFabricationStr,
                dateLivraison: dateLivraisonStr,
                ref: commande.reference || '',
            })
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(`Mail de paiement envoyé pour la commande ${numCommande}:`, data);
        })
        .catch((error) => {
            console.error(`Erreur lors de l'envoi du mail de paiement pour la commande ${numCommande}:`, error);
        });
    });

    // Fermer la popup
    const mailPaiementPopup = document.getElementById('mail-paiement-popup');
    mailPaiementPopup.style.display = 'none';
});

/* ---- Mail de relance ---- */

// Ouverture de la popup de mail-relance-popup au clic sur le bouton relance-paiement
document.getElementById('relance-paiement').addEventListener('click', () => {
    const mailRelancePopup = document.getElementById('mail-relance-popup');
    mailRelancePopup.style.display = 'flex';

    // Mettre à jour mail-text avec les commandes sélectionnées "Envoyer le mail de relance des X commandes sélectionnées ?"
    const mailText = document.getElementById('mail-relance-text');
    mailText.textContent = `Envoyer le mail de relance des ${selectedCommands.length} commandes sélectionnées ?`;

    if (selectedCommands.length === 1) {
        mailText.textContent = `Envoyer le mail de relance de la commande sélectionnée ?`;
    } else if (selectedCommands.length === 0) {
        mailText.textContent = `Aucune commande sélectionnée`;
    }

    // Mettre à jour le nombre de commandes sélectionnées send-mail-relance "Envoyer les X mails"
    const sendMailRelance = document.getElementById('send-mail-relance');
    sendMailRelance.textContent = `Envoyer les ${selectedCommands.length} mails`;

    if (selectedCommands.length === 1) {
        sendMailRelance.textContent = `Envoyer le mail`;
    }

    // Si 0 commandes sélectionnées, désactiver le bouton
    if (selectedCommands.length === 0) {
        sendMailRelance.disabled = true;

        // Changement de couleur du bouton
        sendMailRelance.style.backgroundColor = 'grey';
    } else {
        sendMailRelance.disabled = false;

        // Changement de couleur du bouton
        sendMailRelance.style.backgroundColor = '#4CAF50';
    }
});

// fermeture de mail-relance-popup
document.getElementById('mail-relance-popup-close').addEventListener('click', () => {
    const mailRelancePopup = document.getElementById('mail-relance-popup');
    mailRelancePopup.style.display = 'none';
});

// fermeture de mail-relance-popup au clic en dehors
window.addEventListener('click', (event) => {
    const mailRelancePopup = document.getElementById('mail-relance-popup');
    if (event.target === mailRelancePopup) {
        mailRelancePopup.style.display = 'none';
    }
});

// Envoie du mail de relance au clic sur le bouton send-mail-relance
document.getElementById('send-mail-relance').addEventListener('click', () => {
    // Boucler sur chaque commande sélectionnée
    selectedCommands.forEach((numCommande) => {
        // Récupérer les informations de la commande
        const commande = allCommandes.find((commande) => commande.numero === numCommande);

        if (!commande) {
            console.error(`Commande ${numCommande} introuvable.`);
            return;
        }

        // Récupérer la date de livraison au format 'YYYY-MM-DD'
        const dateLivraison = new Date(commande.dlivraison);

        // Passer les dates en format 'DD/MM/YYYY'
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const dateLivraisonStr = dateLivraison.toLocaleDateString('fr-FR', options);

        // Envoyer un mail pour chaque commande
        fetch('/mail/send-mail-relance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numeroCommande: numCommande,
                dateLivraison: dateLivraisonStr,
                ref: commande.reference || '',
            })
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(`Mail de relance envoyé pour la commande ${numCommande}:`, data);
        })
        .catch((error) => {
            console.error(`Erreur lors de l'envoi du mail de relance pour la commande ${numCommande}:`, error);
        });
    });

    // Fermer la popup
    const mailRelancePopup = document.getElementById('mail-relance-popup');
    mailRelancePopup.style.display = 'none';
});