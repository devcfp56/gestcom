const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

router.get('/files/:orderNumber', async (req, res) => {
    const orderNumber = req.params.orderNumber;
    const directoryPath = '\\\\srv-applis19\\winpro\\pdf';

    try {
        const files = await fs.readdir(directoryPath);

        const matchingFiles = files.filter(file => file.includes(orderNumber));

        if (matchingFiles.length === 0) {
            return res.json([]);
        }

        // Séparer les fichiers en deux catégories : ceux qui commencent par "ARC2" ou "Cde", et les autres
        const arc2OrCdeFiles = matchingFiles.filter(file => file.startsWith('ARC2') || file.startsWith('Cde'));
        const otherFiles = matchingFiles.filter(file => !file.startsWith('ARC2') && !file.startsWith('Cde'));

        let mostRecentFile = null;

        if (arc2OrCdeFiles.length > 0) {
            // Collecter les stats de manière asynchrone
            const filesWithStats = await Promise.all(
                arc2OrCdeFiles.map(async file => {
                    const fullPath = path.join(directoryPath, file);
                    const stats = await fs.stat(fullPath);
                    return { file, mtime: stats.mtime };
                })
            );

            mostRecentFile = filesWithStats.reduce((latest, current) =>
                current.mtime > latest.mtime ? current : latest
            ).file;
        }

        const responseFiles = mostRecentFile ? [mostRecentFile, ...otherFiles] : otherFiles;

        res.json(responseFiles);

        console.log('Fichiers trouvés:', responseFiles);
    } catch (err) {
        console.error('Erreur lors de l’accès au répertoire :', err);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;