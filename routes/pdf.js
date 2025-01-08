const express = require('express');
const path = require('path');
const router = express.Router();

// Dossier contenant les fichiers PDF
const pdfDirectory = 'W:/pdf';

// Route pour servir les fichiers PDF
router.get('/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(pdfDirectory, fileName);

    // Vérifier si le fichier existe
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Erreur lors de l'envoi du fichier:", err);
            res.status(404).send('Fichier non trouvé');
        }
    });
});

module.exports = router;