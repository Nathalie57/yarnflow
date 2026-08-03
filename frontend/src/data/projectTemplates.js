/**
 * @file projectTemplates.js
 * @brief Catégories de projet et suggestions de sections pour le wizard
 * @created 2026-01-27 by [AI:Claude]
 * @modified 2026-08-03 by [AI:Claude] - Clés de traduction (i18n)
 *
 * [AI:Claude] Structure i18n :
 *  - `id` / `presetKey` / `sectionKey` : clés STABLES, jamais affichées, servent
 *    à retrouver le libellé traduit (namespace "projects", section wizard.*).
 *  - `value` : valeur enregistrée en base comme type de projet — volontairement
 *    NON traduite ici pour ne pas changer la donnée stockée. Le wizard affiche
 *    la traduction via `id` mais enregistre toujours `value`.
 *  - `sections[].name` : nom pré-rempli d'une section, traduit à l'usage via
 *    `sectionKey` (contrairement à `value`, c'est du contenu propre au projet
 *    de l'utilisatrice, qu'elle peut de toute façon éditer ensuite).
 */

export const PROJECT_CATEGORIES = [
  {
    id: 'vetements',
    value: 'Vêtements',
    icon: '🧥',
    sectionPresets: [
      {
        presetKey: 'pull',
        icon: '🧶',
        sections: [
          { sectionKey: 'face', description: '', total_rows: null },
          { sectionKey: 'dos', description: '', total_rows: null },
          { sectionKey: 'mancheGauche', description: '', total_rows: null },
          { sectionKey: 'mancheDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'gilet',
        icon: '🧥',
        sections: [
          { sectionKey: 'faceGauche', description: '', total_rows: null },
          { sectionKey: 'faceDroite', description: '', total_rows: null },
          { sectionKey: 'dos', description: '', total_rows: null },
          { sectionKey: 'mancheGauche', description: '', total_rows: null },
          { sectionKey: 'mancheDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'custom',
        icon: '✨',
        sections: [
          { sectionKey: null, description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'accessoires',
    value: 'Accessoires',
    icon: '👜',
    sectionPresets: [
      {
        presetKey: 'chaussettes',
        icon: '🧦',
        sections: [
          { sectionKey: 'chaussetteGauche', description: '', total_rows: null },
          { sectionKey: 'chaussetteDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'gants',
        icon: '🧤',
        sections: [
          { sectionKey: 'mainGauche', description: '', total_rows: null },
          { sectionKey: 'mainDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'echarpe',
        icon: '🧣',
        sections: [
          { sectionKey: 'echarpe', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'bonnet',
        icon: '🎩',
        sections: [
          { sectionKey: 'bonnet', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'sac',
        icon: '👜',
        sections: [
          { sectionKey: 'corpsDuSac', description: '', total_rows: null },
          { sectionKey: 'anses', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'custom',
        icon: '✨',
        sections: [
          { sectionKey: null, description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'jouets',
    value: 'Jouets/Peluches',
    icon: '🧸',
    sectionPresets: [
      {
        presetKey: 'amigurumi',
        icon: '🧸',
        sections: [
          { sectionKey: 'corps', description: '', total_rows: null },
          { sectionKey: 'tete', description: '', total_rows: null },
          { sectionKey: 'brasGauche', description: '', total_rows: null },
          { sectionKey: 'brasDroit', description: '', total_rows: null },
          { sectionKey: 'jambeGauche', description: '', total_rows: null },
          { sectionKey: 'jambeDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'custom',
        icon: '✨',
        sections: [
          { sectionKey: null, description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'vetements-bebe',
    value: 'Vêtements bébé',
    icon: '👶',
    sectionPresets: [
      {
        presetKey: 'brassiere',
        icon: '👕',
        sections: [
          { sectionKey: 'face', description: '', total_rows: null },
          { sectionKey: 'dos', description: '', total_rows: null },
          { sectionKey: 'mancheGauche', description: '', total_rows: null },
          { sectionKey: 'mancheDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'custom',
        icon: '✨',
        sections: [
          { sectionKey: null, description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'accessoires-bebe',
    value: 'Accessoires bébé',
    icon: '🎀',
    sectionPresets: [
      {
        presetKey: 'chaussons',
        icon: '🧦',
        sections: [
          { sectionKey: 'chaussonGauche', description: '', total_rows: null },
          { sectionKey: 'chaussonDroit', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'couverture',
        icon: '🛏️',
        sections: []
      },
      {
        presetKey: 'bonnetBebe',
        icon: '🧢',
        sections: [
          { sectionKey: 'bonnet', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'custom',
        icon: '✨',
        sections: [
          { sectionKey: null, description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'vetements-enfant',
    value: 'Vêtements enfant',
    icon: '👧',
    sectionPresets: [
      {
        presetKey: 'pullEnfant',
        icon: '🧶',
        sections: [
          { sectionKey: 'face', description: '', total_rows: null },
          { sectionKey: 'dos', description: '', total_rows: null },
          { sectionKey: 'mancheGauche', description: '', total_rows: null },
          { sectionKey: 'mancheDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'giletEnfant',
        icon: '🧥',
        sections: [
          { sectionKey: 'faceGauche', description: '', total_rows: null },
          { sectionKey: 'faceDroite', description: '', total_rows: null },
          { sectionKey: 'dos', description: '', total_rows: null },
          { sectionKey: 'mancheGauche', description: '', total_rows: null },
          { sectionKey: 'mancheDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'robeEnfant',
        icon: '👗',
        sections: [
          { sectionKey: 'corsage', description: '', total_rows: null },
          { sectionKey: 'jupe', description: '', total_rows: null },
          { sectionKey: 'mancheGauche', description: '', total_rows: null },
          { sectionKey: 'mancheDroite', description: '', total_rows: null }
        ]
      },
      {
        presetKey: 'custom',
        icon: '✨',
        sections: [
          { sectionKey: null, description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'maison',
    value: 'Maison/Déco',
    icon: '🏠',
    sectionPresets: []
  }
]

export default PROJECT_CATEGORIES
