/**
 * @file projectTemplates.js
 * @brief Catégories de projet et suggestions de sections pour le wizard
 * @created 2026-01-27 by [AI:Claude]
 */

export const PROJECT_CATEGORIES = [
  {
    id: 'vetements',
    value: 'Vêtements',
    icon: '🧥',
    description: 'Pull, gilet, robe, t-shirt...',
    sectionPresets: [
      {
        name: 'Pull',
        icon: '🧶',
        sections: [
          { name: 'Face', description: '', total_rows: null },
          { name: 'Dos', description: '', total_rows: null },
          { name: 'Manche gauche', description: '', total_rows: null },
          { name: 'Manche droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Gilet',
        icon: '🧥',
        sections: [
          { name: 'Face gauche', description: '', total_rows: null },
          { name: 'Face droite', description: '', total_rows: null },
          { name: 'Dos', description: '', total_rows: null },
          { name: 'Manche gauche', description: '', total_rows: null },
          { name: 'Manche droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Personnalisé',
        icon: '✨',
        sections: [
          { name: '', description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'accessoires',
    value: 'Accessoires',
    icon: '👜',
    description: 'Écharpe, snood, bonnet, sac...',
    sectionPresets: [
      {
        name: 'Chaussettes',
        icon: '🧦',
        sections: [
          { name: 'Chaussette gauche', description: '', total_rows: null },
          { name: 'Chaussette droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Gants/Moufles',
        icon: '🧤',
        sections: [
          { name: 'Main gauche', description: '', total_rows: null },
          { name: 'Main droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Écharpe',
        icon: '🧣',
        sections: [
          { name: 'Écharpe', description: '', total_rows: null }
        ]
      },
      {
        name: 'Bonnet',
        icon: '🎩',
        sections: [
          { name: 'Bonnet', description: '', total_rows: null }
        ]
      },
      {
        name: 'Sac',
        icon: '👜',
        sections: [
          { name: 'Corps du sac', description: '', total_rows: null },
          { name: 'Anse(s)', description: '', total_rows: null }
        ]
      },
      {
        name: 'Personnalisé',
        icon: '✨',
        sections: [
          { name: '', description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'jouets',
    value: 'Jouets/Peluches',
    icon: '🧸',
    description: 'Amigurumi, doudou, personnage...',
    sectionPresets: [
      {
        name: 'Amigurumi',
        icon: '🧸',
        sections: [
          { name: 'Corps', description: '', total_rows: null },
          { name: 'Tête', description: '', total_rows: null },
          { name: 'Bras gauche', description: '', total_rows: null },
          { name: 'Bras droit', description: '', total_rows: null },
          { name: 'Jambe gauche', description: '', total_rows: null },
          { name: 'Jambe droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Personnalisé',
        icon: '✨',
        sections: [
          { name: '', description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'vetements-bebe',
    value: 'Vêtements bébé',
    icon: '👶',
    description: 'Brassière, chaussons, bonnet bébé...',
    sectionPresets: [
      {
        name: 'Brassière',
        icon: '👕',
        sections: [
          { name: 'Face', description: '', total_rows: null },
          { name: 'Dos', description: '', total_rows: null },
          { name: 'Manche gauche', description: '', total_rows: null },
          { name: 'Manche droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Personnalisé',
        icon: '✨',
        sections: [
          { name: '', description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'accessoires-bebe',
    value: 'Accessoires bébé',
    icon: '🎀',
    description: 'Chaussons, moufles, doudou...',
    sectionPresets: [
      {
        name: 'Chaussons',
        icon: '🧦',
        sections: [
          { name: 'Chausson gauche', description: '', total_rows: null },
          { name: 'Chausson droit', description: '', total_rows: null }
        ]
      },
      {
        name: 'Couverture/Nid d\'ange',
        icon: '🛏️',
        sections: []
      },
      {
        name: 'Bonnet bébé',
        icon: '🧢',
        sections: [
          { name: 'Bonnet', description: '', total_rows: null }
        ]
      },
      {
        name: 'Personnalisé',
        icon: '✨',
        sections: [
          { name: '', description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'vetements-enfant',
    value: 'Vêtements enfant',
    icon: '👧',
    description: 'Pull, gilet, robe enfant (2-10 ans)...',
    sectionPresets: [
      {
        name: 'Pull enfant',
        icon: '🧶',
        sections: [
          { name: 'Face', description: '', total_rows: null },
          { name: 'Dos', description: '', total_rows: null },
          { name: 'Manche gauche', description: '', total_rows: null },
          { name: 'Manche droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Gilet enfant',
        icon: '🧥',
        sections: [
          { name: 'Face gauche', description: '', total_rows: null },
          { name: 'Face droite', description: '', total_rows: null },
          { name: 'Dos', description: '', total_rows: null },
          { name: 'Manche gauche', description: '', total_rows: null },
          { name: 'Manche droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Robe enfant',
        icon: '👗',
        sections: [
          { name: 'Corsage', description: '', total_rows: null },
          { name: 'Jupe', description: '', total_rows: null },
          { name: 'Manche gauche', description: '', total_rows: null },
          { name: 'Manche droite', description: '', total_rows: null }
        ]
      },
      {
        name: 'Personnalisé',
        icon: '✨',
        sections: [
          { name: '', description: '', total_rows: null }
        ]
      }
    ]
  },
  {
    id: 'maison',
    value: 'Maison/Déco',
    icon: '🏠',
    description: 'Coussin, plaid, napperon...',
    sectionPresets: []
  }
]

export default PROJECT_CATEGORIES
