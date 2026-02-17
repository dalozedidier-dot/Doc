import re
from collections import Counter

def detect_doublons_consecutifs(texte, min_longueur=8):
    """
    Recherche les séquences de lignes ou de phrases qui se répètent consécutivement.
    Retourne une liste des doublons trouvés avec leur position.
    """
    lignes = texte.splitlines()
    doublons = []

    i = 0
    while i < len(lignes) - 1:
        ligne_actuelle = lignes[i].strip()
        if not ligne_actuelle:
            i += 1
            continue

        # On regarde les lignes suivantes
        for j in range(i + 1, min(i + 10, len(lignes))):
            ligne_suivante = lignes[j].strip()
            if ligne_actuelle == ligne_suivante and len(ligne_actuelle) >= min_longueur:
                doublons.append({
                    'ligne': i + 1,
                    'texte': ligne_actuelle,
                    'répétitions': j - i + 1,
                    'positions': list(range(i + 1, j + 2))
                })
                # On saute les lignes déjà vues
                i = j
                break
        else:
            i += 1

    return doublons


def detect_patterns_artefacts(texte):
    """
    Recherche des motifs classiques d'erreurs de rendu / conversion :
    - répétitions de caractères spéciaux
    - collage sans espace
    - parenthèses en trop
    - mots collés comme "textet/ouquad"
    """
    patterns = [
        (r'([^\s]{3,})\1{2,}', "répétition de mot ou séquence"),
        (r'\w+(?:et/ou|ou/et)\w+', "mots collés sans espace autour de et/ou"),
        (r'\(.*?[^)]{2,}\)', "parenthèse probablement mal fermée"),
        (r'[@$%&\*]{2,}', "séquence de caractères spéciaux suspects"),
        (r'\w+quad\w+', "artefact typique 'quad' ou 'textet/ouquad'"),
        (r'Page \d+ / 74\s*Page \d+ / 74', "pagination doublée"),
        (r'\\\(.*?\\\)\s*\\\(.*?\\\)', "formule LaTeX doublée consécutive"),
    ]

    resultats = []
    for motif, description in patterns:
        for m in re.finditer(motif, texte):
            debut = max(0, m.start() - 40)
            fin = min(len(texte), m.end() + 40)
            contexte = texte[debut:fin].replace('\n', ' ').strip()
            resultats.append({
                'motif': motif,
                'description': description,
                'occurrence': m.group(0),
                'contexte': contexte,
                'position': m.start()
            })

    return resultats


def analyser_fichier_ou_texte(chemin_ou_texte, min_longueur_doublon=8):
    if '\n' in chemin_ou_texte and len(chemin_ou_texte) > 200:
        texte = chemin_ou_texte
    else:
        try:
            with open(chemin_ou_texte, encoding='utf-8') as f:
                texte = f.read()
        except Exception as e:
            return {"erreur": str(e)}

    print("=== Analyse du texte ===")
    print(f"Longueur totale : {len(texte):,} caractères")
    print(f"Lignes : {texte.count('\n') + 1}\n")

    print("1. Doublons consécutifs détectés :")
    doublons = detect_doublons_consecutifs(texte, min_longueur_doublon)
    if doublons:
        for d in doublons:
            print(f"  Ligne {d['ligne']} → répété {d['répétitions']} fois")
            print(f"  Texte : {d['texte'][:120]}{'...' if len(d['texte']) > 120 else ''}")
            print()
    else:
        print("  Aucun doublon consécutif clair détecté (longueur min = {min_longueur_doublon})\n")

    print("2. Artefacts / motifs suspects :")
    artefacts = detect_patterns_artefacts(texte)
    if artefacts:
        for a in artefacts[:15]:  # limite pour ne pas inonder
            print(f"  {a['description']:<35} | {a['occurrence']}")
            print(f"  Contexte : {a['contexte'][:140]}{'...' if len(a['contexte']) > 140 else ''}")
            print()
        if len(artefacts) > 15:
            print(f"... et {len(artefacts) - 15} autres occurrences")
    else:
        print("  Aucun motif suspect détecté\n")

    return {
        "doublons_consecutifs": doublons,
        "artefacts": artefacts,
        "longueur_texte": len(texte)
    }


if __name__ == '__main__':
    texte_ou_fichier = "chemin/vers/votre/fichier.html"   # ← MODIFIER ICI
    resultat = analyser_fichier_ou_texte(texte_ou_fichier, min_longueur_doublon=10)
