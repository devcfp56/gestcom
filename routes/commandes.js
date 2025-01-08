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

router.get('/', (req, res) => {
    const sqlQuery = `
      SELECT DISTINCT 
              c.numero, c.etat, c.client, cl.nom, c.reference, c.date AS dcreation, dfacture, 
              c.dconfirme, c.dlivraison, c.encodeur, c.zonelivr, c.wlivr, c.nomlivr,
              c.delaicli,
              r.nom AS repres_nom,
              CONCAT(week(c.date, 1), '-', year(c.date)) AS wcrea,
              CONCAT(week(c.dfacture, 1), '-', year(c.dfacture)) AS wfact,
              CONCAT(week(c.fin, 1), '-', year(c.fin)) AS wfinprod,
              c.fin AS dfinprod, c.cplivr, c.adresse AS noteslivraison, c.totconf, 
              c.chantier AS motifattente, c.paiement,
              MAX(a.ordre + 1) AS NBAcomptes,
              (SELECT sum(b.pu)  FROM artcde b WHERE b.commande=c.numero AND b.type=4 GROUP BY b.commande) AS TTAcomptes,
              LEFT(c.cplivr, 2) AS deptlivr,
              REPLACE(REPLACE(c.notes, CHAR(13), '/'), CHAR(10), '/') AS notes, 
              c.nfacture, c.numne AS NumeroBL,
              GROUP_CONCAT(DISTINCT d.systeme SEPARATOR '-') AS systeme,
              GROUP_CONCAT(DISTINCT d.biblio SEPARATOR '-') AS biblio, d.couleur, d.lot,
              l.code AS NomLot,
              ROUND(SUM(CASE WHEN d.systeme = 'ALU PORTAIL' THEN d.pvconf + d.pvconfacc ELSE 0 END), 2) AS prixportailAlu,
              ROUND(SUM(CASE WHEN d.systeme = 'ALU CLOTURE' THEN d.pvconf + d.pvconfacc ELSE 0 END), 2) AS prixClotureAlu,
              ROUND(SUM(CASE WHEN d.systeme = 'PVC PORTAIL' THEN d.pvconf + d.pvconfacc ELSE 0 END), 2) AS prixportailPVC,
              ROUND(SUM(CASE WHEN d.systeme = 'PVC CLOTURE' THEN d.pvconf + d.pvconfacc ELSE 0 END), 2) AS prixCloturePVC,
              ROUND(SUM(CASE WHEN d.systeme NOT IN ('ALU PORTAIL', 'ALU CLOTURE', 'PVC PORTAIL', 'PVC CLOTURE') 
                  THEN d.pvconf + d.pvconfacc ELSE 0 END), 2) AS prixAutres,
              ROUND(SUM(a2.pu * a2.quantite * (100 - c.remise) / 100), 2) AS prixartcde,
              ROUND(SUM(CASE WHEN d.systeme IN ('ALU PORTAIL', 'ALU CLOTURE', 'PVC PORTAIL', 'PVC CLOTURE') 
                  THEN d.pvconf + d.pvconfacc ELSE 0 END), 2) AS PrixFabriquer,
              z.descriptio, p.soudure, p.gainage, p.debit, p.usinage, p.montage, p.cloture, p.embalage, 
              c.fraisport, c.supplfft, c.supplpc, cl.email
            FROM commande c
            LEFT JOIN client cl ON cl.code = c.client
            LEFT JOIN detail d ON d.commande = c.numero
            LEFT JOIN zonelivr z ON z.code = c.zonelivr
            LEFT JOIN lot l ON l.lot = d.lot
            LEFT JOIN artcde a ON a.commande = c.numero AND a.type = 4
            AND a.ordre = (SELECT MAX(a4.ordre) FROM artcde a4 WHERE a4.commande = a.commande AND a4.type = 4)
            LEFT JOIN artcde a2 ON a2.commande = c.numero AND a2.type <> 4 
            AND a2.ordre = (SELECT MAX(a3.ordre) FROM artcde a3 WHERE a3.commande = a2.commande AND a3.type <> 4)
            LEFT JOIN cfpetatprod p ON p.numero = c.numero
            LEFT JOIN repres r ON c.repres = r.code
            WHERE c.numero LIKE 'W%' AND c.etat >= 200 AND c.etat <= 850
            AND ((year (c.dlivraison) = year(now())) OR (year (c.dlivraison) = year(now()) + 1) OR (year (c.dlivraison) = year(now()) - 1))
            GROUP BY c.numero
            ORDER BY c.numne ASC, c.dlivraison DESC, c.client DESC, c.cplivr DESC, c.etat DESC, c.chantier DESC, c.typepose, c.zonelivr, c.numero
    `;
  
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Erreur de requête SQL:', err);
        res.status(500).send('Erreur serveur');
      } else {
        res.json(results);
      }
    });
});  

module.exports = router;