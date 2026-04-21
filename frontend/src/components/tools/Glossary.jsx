/**
 * @file Glossary.jsx
 * @brief Outil : Glossaire tricot / crochet
 *
 * - Recherche en temps réel (terme FR, terme EN, définition)
 * - Filtres par catégorie (tous / tricot / crochet / commun)
 * - Filtre par difficulté (pills)
 * - Tri alphabétique par défaut
 */

import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

const TERMS = [
  // ── Communs ───────────────────────────────────────────────────────────────
  {
    term: 'Maille',
    en: 'Stitch',
    definition: `Unité de base du tricot et du crochet : une boucle de fil passée autour de l'aiguille ou du crochet. Toute pièce est constituée d'un enchaînement de mailles.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Rang',
    en: 'Row',
    definition: `Suite horizontale de mailles travaillées d'un bord à l'autre de l'ouvrage. Au tricot en rang, on alterne rangs endroit et rangs envers.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Point',
    en: 'Stitch pattern',
    definition: `Combinaison de mailles endroit et envers (ou de techniques crochet) qui se répète pour créer une texture ou un motif décoratif.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Montage des mailles',
    en: 'Cast on',
    definition: `Opération initiale qui consiste à placer le nombre de mailles voulu sur l'aiguille avant de commencer à tricoter. Il existe de nombreuses méthodes (long tail, câble, provisoire…).`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Rabattage',
    en: 'Bind off / Cast off',
    definition: `Technique pour terminer un ouvrage en fermant les mailles de façon à ce qu'elles ne se défassent pas. On passe chaque maille par-dessus la suivante.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Pelote',
    en: 'Ball / Skein',
    definition: `Quantité de fil conditionnée en boule (pelote) ou en écheveau (skein). L'étiquette indique le poids, la longueur et les recommandations d'aiguilles.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Échantillon',
    en: 'Gauge / Tension swatch',
    definition: `Petit carré de tissu (au moins 10 × 10 cm) tricoté ou crocheté avant un projet pour vérifier que le nombre de mailles et de rangs par 10 cm correspond aux indications du patron.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Point endroit',
    en: 'Knit stitch (k)',
    abbr: { fr: 'end', us: 'k', uk: 'k' },
    definition: `Maille de base du tricot où l'aiguille entre par l'avant de la maille. Au crochet, équivalent approximatif à la maille serrée par l'avant.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Point envers',
    en: 'Purl stitch (p)',
    abbr: { fr: 'env', us: 'p', uk: 'p' },
    definition: `Maille miroir du point endroit : l'aiguille entre par l'arrière de la maille. Combiné au point endroit, il permet de créer tous les points de texture.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Augmentation',
    en: 'Increase (inc)',
    abbr: { fr: 'aug', us: 'inc', uk: 'inc' },
    definition: `Technique ajoutant une ou plusieurs mailles pour élargir l'ouvrage. Exemples : KFB, M1L, M1R au tricot ; 2 ms dans la même maille au crochet.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Diminution',
    en: 'Decrease (dec)',
    abbr: { fr: 'dim', us: 'dec', uk: 'dec' },
    definition: `Technique supprimant une ou plusieurs mailles pour rétrécir l'ouvrage. Exemples : k2tog, SSK au tricot ; ms2ensemble au crochet.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Jersey',
    en: 'Stockinette stitch (St st)',
    definition: `Point de base obtenu en alternant un rang endroit et un rang envers. L'endroit est lisse et les mailles forment des V ; l'envers est côtelé.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Côtes',
    en: 'Ribbing',
    definition: `Alternance régulière de mailles endroit et envers sur le même rang (ex. 1×1 ou 2×2). Le tissu obtenu est très élastique, idéal pour les bordures.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Maille glissée',
    en: 'Slip stitch (sl)',
    abbr: { fr: 'mg', us: 'sl', uk: 'sl' },
    definition: `Maille transférée d'une aiguille à l'autre (ou ignorée au crochet) sans être tricotée. Elle sert à façonner, créer des textures ou réduire sans torsion.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Fil',
    en: 'Yarn',
    definition: `Matière première filée utilisée pour tricoter ou crocheter. Les fils se distinguent par leur poids (lace, fingering, DK, worsted, bulky…), leur composition et leur retors.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Aiguille',
    en: 'Needle',
    definition: `Outil long et pointu, en métal, bois ou bambou, utilisé pour tricoter. La taille (diamètre en mm) détermine la grosseur des mailles.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Crochet',
    en: 'Crochet hook',
    definition: `Outil court muni d'un crochet à son extrémité, utilisé pour crocheter. Comme pour les aiguilles, la taille est exprimée en mm.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Abréviation m',
    en: 'st (stitch)',
    definition: `Abréviation standard de « maille » dans les patrons français. Correspond à « st » (stitch) en anglais.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Abréviation rg',
    en: 'row / rnd',
    definition: `Abréviation de « rang » dans les patrons français. Correspond à « row » en anglais ou « rnd » (round) pour le tricot/crochet en rond.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Abréviation pt',
    en: 'st / patt',
    definition: `Abréviation de « point » dans les patrons français, désignant soit une maille isolée soit un motif de points (patt).`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Maille tricotée ensemble',
    en: 'Knit two together (k2tog)',
    abbr: { us: 'k2tog', uk: 'k2tog' },
    definition: `Diminution simple au tricot : on insère l'aiguille dans deux mailles à la fois et on les tricote comme une seule. Cela penche vers la droite.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Surjet simple',
    en: 'Slip, slip, knit (SSK)',
    abbr: { fr: 'ssk', us: 'ssk', uk: 'skpo' },
    definition: `Diminution penchant vers la gauche au tricot : on glisse deux mailles une à une à l'envers, puis on les tricote ensemble par l'arrière.`,
    category: 'commun',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Rentrer les fils',
    en: 'Weave in ends',
    definition: `Finition consistant à cacher les queues de fil à l'intérieur de l'ouvrage à l'aide d'une aiguille à laine, pour qu'elles ne soient pas visibles.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Blocage',
    en: 'Blocking',
    definition: `Processus humidifiant puis mettant en forme l'ouvrage pour égaliser les mailles, ouvrir les motifs dentelle et lui donner ses dimensions finales.`,
    category: 'commun',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Retors',
    en: 'Ply',
    definition: `Nombre de brins torsadés ensemble pour former un fil. Un fil 4 brins (4-ply) est généralement plus solide et plus régulier qu'un fil simple.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Répétition',
    en: 'Repeat (rep)',
    definition: `Séquence de mailles indiquée entre crochets ou astérisques dans un patron et à reproduire un certain nombre de fois sur le rang.`,
    category: 'commun',
    difficulty: 'débutant',
  },
  {
    term: 'Tension',
    en: 'Tension / Gauge',
    definition: `Degré de serrage du fil lors du travail. Une tension trop serrée produit des mailles petites et un tissu rigide ; trop lâche, des mailles grandes et un tissu mou.`,
    category: 'commun',
    difficulty: 'débutant',
  },

  // ── Tricot ────────────────────────────────────────────────────────────────
  {
    term: 'Aiguilles circulaires',
    en: 'Circular needles',
    definition: `Deux pointes d'aiguilles reliées par un câble flexible. Elles permettent de tricoter en rond (bonnets, pulls) ou de gérer un grand nombre de mailles à plat.`,
    category: 'tricot',
    difficulty: 'débutant',
  },
  {
    term: 'Aiguilles double-pointe',
    en: 'Double-pointed needles (DPN)',
    definition: `Jeu de 4 ou 5 courtes aiguilles pointues aux deux extrémités. Elles servent à tricoter en rond sur de petites circonférences : chaussettes, manches, doigts.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Point mousse',
    en: 'Garter stitch',
    definition: `Point obtenu en tricotant tous les rangs à l'endroit (ou tous à l'envers). Le tissu est réversible, épais, et ne s'enroule pas sur les bords.`,
    category: 'tricot',
    difficulty: 'débutant',
  },
  {
    term: 'Point de riz',
    en: 'Seed stitch / Moss stitch',
    definition: `Point texturé alternant maille endroit et maille envers sur le même rang, puis inversé au rang suivant. Le tissu obtenu est plat, réversible et non élastique.`,
    category: 'tricot',
    difficulty: 'débutant',
  },
  {
    term: 'Tricot en rond',
    en: 'Knitting in the round',
    definition: `Technique de tricotage formant un tube continu sans couture grâce aux aiguilles circulaires ou DPN. On tricote toujours du même côté de l'ouvrage.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Rangs raccourcis',
    en: 'Short rows',
    definition: `Rangs partiels : on ne va pas jusqu'au bout du rang avant de faire demi-tour. Cette technique permet de créer des formes en courbe (épaules, talons, col bateau).`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'SSK',
    en: 'Slip, slip, knit',
    definition: `Diminution penchant à gauche : on glisse deux mailles séparément à l'envers, puis on les retricote ensemble par le brin arrière.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'K2tog',
    en: 'Knit two together',
    definition: `Diminution penchant à droite : on tricote deux mailles ensemble en une seule passe, en insérant l'aiguille dans les deux boucles simultanément.`,
    category: 'tricot',
    difficulty: 'débutant',
  },
  {
    term: 'Jeté',
    en: 'Yarn over',
    abbr: { fr: 'j', us: 'yo', uk: 'yfwd' },
    definition: `Augmentation décorative : on passe le fil par-dessus l'aiguille droite avant de tricoter la maille suivante. Cela crée une maille supplémentaire et un trou volontaire, utilisé en dentelle.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Point torsadé',
    en: 'Cable stitch',
    definition: `Technique croisant des groupes de mailles pour créer l'apparence de cordons tressés. On utilise une aiguille auxiliaire pour mettre des mailles en attente avant de les tricoter dans un ordre inversé.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Aiguille auxiliaire',
    en: 'Cable needle',
    definition: `Courte aiguille coudée ou droite servant à mettre des mailles en attente lors de la réalisation d'une torsade, le temps de tricoter les mailles suivantes.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Relever des mailles',
    en: 'Pick up stitches',
    definition: `Opération consistant à créer de nouvelles mailles le long d'un bord existant (encolure, emmanchure) pour y ajouter une bordure ou une pièce supplémentaire.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'KFB',
    en: 'Knit front and back',
    abbr: { us: 'kfb', uk: 'kfb' },
    definition: `Augmentation simple : on tricote dans le brin avant puis dans le brin arrière de la même maille, créant ainsi deux mailles à partir d'une seule.`,
    category: 'tricot',
    difficulty: 'débutant',
  },
  {
    term: 'M1L',
    en: 'Make one left',
    abbr: { us: 'M1L', uk: 'M1L' },
    definition: `Augmentation penchant à gauche : on soulève le brin horizontal entre deux mailles par l'avant et on le tricote par le brin arrière pour éviter un trou.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'M1R',
    en: 'Make one right',
    abbr: { us: 'M1R', uk: 'M1R' },
    definition: `Augmentation penchant à droite : on soulève le brin horizontal entre deux mailles par l'arrière et on le tricote par le brin avant.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Magic loop',
    en: 'Magic loop',
    definition: `Technique permettant de tricoter en rond sur une petite circonférence avec une seule longue aiguille circulaire, en créant une boucle de câble sur le côté.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Icord',
    en: 'I-cord',
    definition: `Petit tube de mailles (3 à 5) tricoté en continu sur DPN ou aiguilles circulaires en glissant les mailles sans retourner le travail. Utilisé pour les liens, bordures ou sangles.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Dentelle',
    en: 'Lace',
    definition: `Technique combinant jetés et diminutions pour créer des motifs ajourés délicats. Les patrons de dentelle sont souvent chartrés sur grille.`,
    category: 'tricot',
    difficulty: 'avancé',
  },
  {
    term: 'Intarsia',
    en: 'Intarsia',
    definition: `Technique de colorwork où chaque zone de couleur est tricotée avec une pelote distincte. Les fils ne se croisent pas sur l'envers comme en jacquard.`,
    category: 'tricot',
    difficulty: 'avancé',
  },
  {
    term: 'Jacquard',
    en: 'Stranded colorwork / Fair Isle',
    definition: `Technique de tricot à plusieurs couleurs où les fils non utilisés sont portés en flottantes à l'envers du travail. Permet de créer des motifs géométriques répétitifs.`,
    category: 'tricot',
    difficulty: 'avancé',
  },
  {
    term: 'Maille envers tordue',
    en: 'Twisted purl',
    definition: `Maille envers tricotée par le brin arrière, créant une légère torsion qui peut être utilisée pour des effets décoratifs ou pour renforcer certains points.`,
    category: 'tricot',
    difficulty: 'intermédiaire',
  },

  // ── Crochet ───────────────────────────────────────────────────────────────
  {
    term: 'Chaînette',
    en: 'Chain stitch',
    abbr: { fr: 'ch', us: 'ch', uk: 'ch' },
    definition: `Suite de boucles enchaînées formant la base de départ de la plupart des ouvrages au crochet. On peut aussi l'utiliser comme espace d'arc dans les motifs.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Maille serrée',
    en: 'Single crochet / Double crochet UK',
    abbr: { fr: 'ms', us: 'sc', uk: 'dc' },
    definition: `Point le plus court du crochet : on insère le crochet dans une maille, on tire une boucle, puis on tire à travers les deux boucles sur le crochet. Tissu dense et solide.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Demi-bride',
    en: 'Half double crochet',
    abbr: { fr: 'demi-br', us: 'hdc', uk: 'htr' },
    definition: `Point intermédiaire entre la maille serrée et la bride : on jette le fil, insère le crochet, tire une boucle, puis tire à travers les trois boucles en une seule fois.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Bride',
    en: 'Double crochet / Treble UK',
    abbr: { fr: 'br', us: 'dc', uk: 'tr' },
    definition: `Point standard du crochet, deux fois plus haut que la maille serrée : on jette le fil, insère le crochet, tire une boucle, puis tricote deux fois deux boucles ensemble.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Double bride',
    en: 'Treble crochet / Double treble UK',
    abbr: { fr: 'db', us: 'tr', uk: 'dtr' },
    definition: `Point encore plus haut que la bride : on jette le fil deux fois avant d'insérer le crochet, créant un point élancé utilisé dans les dentelles et motifs ajourés.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Magic ring',
    en: 'Magic ring / Magic loop',
    abbr: { fr: 'mr', us: 'mr' },
    definition: `Technique de départ en crochet en rond : on forme un anneau ajustable avec le fil, on crochète dedans, puis on tire la queue pour fermer le centre sans trou.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Amigurumi',
    en: 'Amigurumi',
    definition: `Technique japonaise de crochet en spirale continue (sans jonction de rang) pour créer de petits personnages ou animaux en 3D, rembourrés de ouate.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Granny square',
    en: 'Granny square',
    definition: `Motif carré traditionnel au crochet travaillé en rond à partir d'un centre, composé de groupes de brides séparés par des espaces d'arc. Peut être assemblé en couverture ou vêtement.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Maille coulée',
    en: 'Slip stitch',
    abbr: { fr: 'mc', us: 'sl st', uk: 'ss' },
    definition: `Point le plus bas du crochet, sans hauteur propre. Utilisé pour fermer un anneau, se déplacer discrètement sur l'ouvrage ou créer un jonction de rang invisible.`,
    category: 'crochet',
    difficulty: 'débutant',
  },
  {
    term: 'Picot',
    en: 'Picot',
    definition: `Petite pointe décorative formée d'une chaînette de 3 à 5 mailles fermée par une maille coulée. Souvent utilisée en bordure de dentelle ou d'ouvrage au crochet.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Bobble stitch',
    en: 'Bobble stitch',
    definition: `Groupe de 3 à 5 brides incomplètes travaillées dans la même maille et fermées ensemble, créant un relief arrondi en 3D sur l'endroit de l'ouvrage.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Shell stitch',
    en: 'Shell stitch',
    definition: `Groupe de 5 ou 7 brides travaillées dans la même maille ou le même espace, formant un éventail en forme de coquille. Très utilisé dans les châles et couvertures.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Crochet tunisien',
    en: 'Tunisian crochet',
    definition: `Technique hybride entre tricot et crochet utilisant un long crochet à arrêt. On ramasse toutes les mailles dans un sens puis on les tricote en retour, créant un tissu dense et légèrement texturé.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Crochet en relief avant',
    en: 'Front post double crochet',
    abbr: { us: 'FPdc', uk: 'FPtr' },
    definition: `Bride travaillée autour du montant de la bride du rang précédent par l'avant du tissu, créant un relief saillant sur l'endroit. Utilisé pour simuler des torsades au crochet.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Crochet en relief arrière',
    en: 'Back post double crochet',
    abbr: { us: 'BPdc', uk: 'BPtr' },
    definition: `Bride travaillée autour du montant de la bride du rang précédent par l'arrière du tissu, créant un creux sur l'endroit. Combiné au FPdc, permet des côtes au crochet.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Jonction invisible',
    en: 'Invisible join',
    definition: `Méthode pour fermer un rang en rond sans que la jonction ne soit visible, en cousant le fil à l'aiguille sous la tête de la première maille du rang.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
  {
    term: 'Popcorn stitch',
    en: 'Popcorn stitch',
    definition: `Groupe de brides complètes fermées par le haut pour former un relief bombé plus prononcé que le bobble. On termine en tirant la boucle de la dernière bride à travers la première.`,
    category: 'crochet',
    difficulty: 'avancé',
  },
  {
    term: 'Spike stitch',
    en: 'Spike stitch',
    definition: `Maille serrée longue insérée un ou plusieurs rangs plus bas que le rang en cours, créant un effet graphique en pointe. Fréquent dans les créations graphiques et géométriques.`,
    category: 'crochet',
    difficulty: 'intermédiaire',
  },
]

// ---------------------------------------------------------------------------
// Config UI
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: 'all',    label: 'Tous' },
  { value: 'commun', label: 'Commun' },
  { value: 'tricot', label: 'Tricot' },
  { value: 'crochet', label: 'Crochet' },
]

const DIFFICULTIES = ['débutant', 'intermédiaire', 'avancé']

const CATEGORY_STYLES = {
  commun:  'bg-violet-100 text-violet-700',
  tricot:  'bg-blue-100 text-blue-700',
  crochet: 'bg-emerald-100 text-emerald-700',
}

const DIFFICULTY_STYLES = {
  'débutant':      'bg-green-100 text-green-700',
  'intermédiaire': 'bg-amber-100 text-amber-700',
  'avancé':        'bg-red-100 text-red-700',
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export default function Glossary() {
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('all')
  const [difficulty, setDifficulty]   = useState(null) // null = tous

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return TERMS
      .filter(t => {
        if (category !== 'all' && t.category !== category) return false
        if (difficulty && t.difficulty !== difficulty) return false
        if (q) {
          return (
            t.term.toLowerCase().includes(q) ||
            t.en.toLowerCase().includes(q) ||
            t.definition.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => a.term.localeCompare(b.term, 'fr'))
  }, [search, category, difficulty])

  return (
    <div className="space-y-4">

      {/* ── Barre de recherche ── */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un terme, une définition…"
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Effacer la recherche"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Filtres catégorie ── */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              category === c.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Filtres difficulté (pills) ── */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-gray-500 font-medium">Niveau :</span>
        <button
          onClick={() => setDifficulty(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
            difficulty === null
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        {DIFFICULTIES.map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(prev => prev === d ? null : d)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              difficulty === d
                ? DIFFICULTY_STYLES[d] + ' ring-2 ring-offset-1 ring-current'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Compteur de résultats ── */}
      <p className="text-xs text-gray-500">
        {filtered.length} terme{filtered.length !== 1 ? 's' : ''}
        {(search || category !== 'all' || difficulty) ? ' trouvé' + (filtered.length !== 1 ? 's' : '') : ''}
      </p>

      {/* ── Liste des termes ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Aucun terme ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div
              key={t.term}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition"
            >
              {/* En-tête de la card */}
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <span className="font-semibold text-gray-900 text-sm leading-tight">{t.term}</span>
                <span className="text-gray-400 text-xs mt-0.5 leading-tight">{t.en}</span>
                <div className="flex gap-1.5 ml-auto flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[t.category]}`}>
                    {t.category.charAt(0).toUpperCase() + t.category.slice(1)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_STYLES[t.difficulty]}`}>
                    {t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1)}
                  </span>
                </div>
              </div>
              {/* Abréviations */}
              {t.abbr && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {t.abbr.fr && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                      <span className="text-gray-400 font-sans">FR</span> {t.abbr.fr}
                    </span>
                  )}
                  {t.abbr.us && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">
                      <span className="font-sans">US</span> {t.abbr.us}
                    </span>
                  )}
                  {t.abbr.uk && (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded font-mono">
                      <span className="font-sans">UK</span> {t.abbr.uk}
                    </span>
                  )}
                </div>
              )}
              {/* Définition */}
              <p className="text-sm text-gray-600 leading-relaxed">{t.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
