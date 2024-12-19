const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/files/:orderNumber', (req, res) => {
    const orderNumber = req.params.orderNumber;
    const directoryPath = 'W:/pdf';

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }

        const matchingFiles = files.filter(file => file.includes(orderNumber));

        if (matchingFiles.length === 0) {
            return res.json([]);
        }

        // Séparer les fichiers en deux catégories : ceux qui commencent par "ARC2" ou "Cde", et les autres
        const arc2OrCdeFiles = matchingFiles.filter(file => file.startsWith('ARC2') || file.startsWith('Cde'));
        const otherFiles = matchingFiles.filter(file => !file.startsWith('ARC2') && !file.startsWith('Cde'));

        let mostRecentFile = null;

        // Trouver le fichier le plus récent parmi ceux qui commencent par "ARC2" ou "Cde"
        if (arc2OrCdeFiles.length > 0) {
            const filesWithStats = arc2OrCdeFiles.map(file => {
                const fullPath = path.join(directoryPath, file);
                const stats = fs.statSync(fullPath);
                return { file, mtime: stats.mtime };
            });

            mostRecentFile = filesWithStats.reduce((latest, current) =>
                current.mtime > latest.mtime ? current : latest
            ).file;
        }

        // Construire la réponse
        const responseFiles = mostRecentFile ? [mostRecentFile, ...otherFiles] : otherFiles;

        res.json(responseFiles);

        // Afficher les fichiers trouvés
        console.log('Fichiers trouvés:', responseFiles);
    });
});

module.exports = router;