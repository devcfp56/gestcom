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
  
  module.exports = router;