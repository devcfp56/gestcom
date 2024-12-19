# Ce script supprime tous les fichiers de moins de 2ko dans le dossier W:\pdf

import os

# Chemin du dossier
dossier = "W:\\pdf"

# Liste des fichiers du dossier
fichiers = os.listdir(dossier)

# Démarrer un timer
import time
start = time.time()

nombre_de_fichiers = 0

# Parcours de la liste des fichiers
for fichier in fichiers:
    # ignore les dossiers
    if os.path.isdir(os.path.join(dossier, fichier)):
        continue
    
    # Chemin complet du fichier
    chemin = os.path.join(dossier, fichier)
    # Taille du fichier
    taille = os.path.getsize(chemin)
    # Si la taille est inférieure à 2ko
    if taille < 2048:
        # Suppression du fichier
        os.remove(chemin)
        print(fichier, "supprimé")
        nombre_de_fichiers += 1

# Afficher le temps d'exécution
print("Temps d'exécution:", time.time() - start)
print("Nombre de fichiers supprimés:", nombre_de_fichiers)