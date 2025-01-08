// Importer les dépendances
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

// Créer une application Express
const app = express();

// Connexion à la base de données MariaDB
const db = mysql.createConnection({
  host: '10.46.98.4',
  port: '3306',
  user: 'root',
  password: 'roototo',
  database: 'dvpt'
});

// Vérifier la connexion
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
  } else {
    console.log('Connexion réussie à la base de données');
  }
});

// Middleware pour analyser le corps des requêtes
app.use(express.json());

// Configurer le dossier public pour les fichiers statiques (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Routes statiques
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/gestcom', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gestcom.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'stats.html'));
});

app.get('/parametres', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'parametres.html'));
});

// Importer les routes
const commandesRoutes = require('./routes/commandes');
app.use('/commandes', commandesRoutes);

const dataRoutes = require('./routes/data');
app.use('/data', dataRoutes);

const docRoutes = require('./routes/doc');
app.use('/doc', docRoutes);

const pdfRoutes = require('./routes/pdf');
app.use('/pdf', pdfRoutes);

const mailRoutes = require('./routes/mail');
app.use('/mail', mailRoutes);

// Servir les fichiers statiques (HTML, CSS, JS, vidéo, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});