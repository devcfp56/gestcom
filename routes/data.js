const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Connexion à la base de données
const db = mysql.createConnection({
  host: '10.46.98.4',
  port: '3306',
  user: 'root',
  password: 'roototo',
  database: 'prod'
});

// Route pour récupérer les données de la semaine en cours avec les informations CA
router.get('/semaine-en-cours', (req, res) => {
    const sqlQuery = `
      SELECT Utilisateur, typeDoc, NumDoc
      FROM cfpcallreport
      WHERE Utilisateur IN ('GESCOMALU', 'GESCOMCAALU', 'GESCOMPVC', 'GESCOMCAPVC');
    `;
  
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Erreur de requête SQL:', err);
        res.status(500).send('Erreur serveur');
      } else {        
        // Organiser les résultats par Utilisateur
        const data = results.reduce((acc, row) => {
          // Formater les résultats sous la forme Utilisateur: TypeDoc/NumDoc pour la semaine en cours
          if (!acc[row.Utilisateur]) {
            acc[row.Utilisateur] = [];
          }
  
          // Ajouter de TypeDoc/NumDoc pour la semaine en cours (avec /)
          if (row.Utilisateur === 'GESCOMALU' || row.Utilisateur === 'GESCOMPVC') {
            acc[row.Utilisateur].push(`${row.typeDoc}-${row.NumDoc}`);
          } else {
            // Pour le CA, pas de /, donc ajout de TypeDoc NumDoc
            acc[row.Utilisateur].push(`${row.typeDoc} ${row.NumDoc}`);
          }
          return acc;
        }, {});
  
        // Ajouter le TypeDoc seul pour certains utilisateurs
        data['GESCOMALU'] = data['GESCOMALU'] || [];
        data['GESCOMCAALU'] = data['GESCOMCAALU'] || [];
        data['GESCOMPVC'] = data['GESCOMPVC'] || [];
        data['GESCOMCAPVC'] = data['GESCOMCAPVC'] || [];
        
        // Ajouter le TypeDoc seul pour les utilisateurs 'GESCOMAALU' et 'GESCOMAPVC'
        if (!data['GESCOMCAALU'].length) {
          data['GESCOMCAALU'].push('typeDoc');  // Ajouter TypeDoc si nécessaire
        }
        if (!data['GESCOMCAPVC'].length) {
          data['GESCOMCAPVC'].push('typeDoc');  // Ajouter TypeDoc si nécessaire
        }
  
        // Calcul de la semaine en cours (le premier résultat de typeDoc/NumDoc)
        const semaineEnCours = results.length > 0 ? `${results[0].typeDoc}-${results[0].NumDoc}` : null;
  
        // Ajouter "semaine_en_cours" au résultat
        data['semaine_en_cours'] = semaineEnCours;
  
        res.json(data);  // Renvoi des données sous forme de JSON
      }
    });
  });

  // Route pour modifier la semaine en cours
router.post('/modif-semaine', (req, res) => {

    console.log('Requête POST reçue:', req.body);

    let { utilisateur, semaine, annee } = req.body;
  
    // Vérifier les paramètres
    if (!utilisateur || !semaine || !annee) {
      res.status(400).send('Paramètres manquants');
      return;
    }
  
    // Vérifier que la semaine est un nombre
    if (isNaN(semaine) || isNaN(annee)) {
      res.status(400).send('La semaine et l\'année doivent être des nombres');
      return;
    }
  
    // Vérifier que la semaine est comprise entre 1 et 53
    if (semaine < 1 || semaine > 53) {
      res.status(400).send('La semaine doit être comprise entre 1 et 53');
      return;
    }

    // La semaine doit avoir 2 chiffres donc il faut ajouter un 0 si nécessaire
    semaine = semaine.toString().padStart(2, '0');
  
    // Vérifier que l'année est supérieure à 2000
    if (annee < 2000) {
      res.status(400).send('L\'année doit être supérieure à 2000');
      return;
    }
  
    // Mettre à jour la base de données
    const sqlQuery = `
      UPDATE cfpcallreport
      SET typeDoc = '${semaine}', NumDoc = '${annee}'
      WHERE Utilisateur = '${utilisateur}';
    `;
  
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Erreur de requête SQL:', err);
        res.status(500).send('Erreur serveur');
      } else {
        res.send('Semaine modifiée avec succès');
      }
    });
  });
  
  module.exports = router;