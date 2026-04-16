/**
 * @file YarnWeightConverter.jsx
 * @brief Correspondance des épaisseurs de laine EU / US / UK + aiguilles recommandées
 */

const WEIGHTS = [
  {
    eu: 'Dentelle',
    us: 'Lace',
    uk: 'Lace / 1 ply',
    needlesMm: '1,5 – 2,5',
    needlesUs: '000 – 1',
    crochetMm: '1,5 – 2,5',
    wraps: '> 30',
  },
  {
    eu: 'Super fine / Fingering',
    us: 'Sock / Fingering / Baby',
    uk: '2 ply / 3 ply',
    needlesMm: '2 – 3,5',
    needlesUs: '1 – 4',
    crochetMm: '2 – 3,5',
    wraps: '26 – 32',
  },
  {
    eu: 'Fine / Sport',
    us: 'Sport / Baby',
    uk: '4 ply',
    needlesMm: '3 – 4',
    needlesUs: '3 – 6',
    crochetMm: '3 – 4',
    wraps: '22 – 26',
  },
  {
    eu: 'Légère / DK',
    us: 'DK / Light Worsted',
    uk: 'DK / 8 ply',
    needlesMm: '3,5 – 4,5',
    needlesUs: '4 – 7',
    crochetMm: '3,5 – 4,5',
    wraps: '18 – 22',
  },
  {
    eu: 'Moyenne / Worsted',
    us: 'Worsted / Afghan / Aran',
    uk: 'Aran / 10 ply',
    needlesMm: '4,5 – 5,5',
    needlesUs: '7 – 9',
    crochetMm: '5 – 6',
    wraps: '14 – 18',
  },
  {
    eu: 'Grosse / Bulky',
    us: 'Chunky / Craft / Rug',
    uk: 'Chunky / 12 ply',
    needlesMm: '5,5 – 8',
    needlesUs: '9 – 11',
    crochetMm: '6 – 9',
    wraps: '10 – 14',
  },
  {
    eu: 'Très grosse / Super Bulky',
    us: 'Super Bulky / Roving',
    uk: 'Super Chunky',
    needlesMm: '8 – 15',
    needlesUs: '11 – 17',
    crochetMm: '9 – 15',
    wraps: '6 – 10',
  },
]

export default function YarnWeightConverter() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Les noms varient selon les marques — utilisez les aiguilles recommandées comme référence principale.
      </p>

      {WEIGHTS.map((w, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          {/* Noms */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">FR · {w.eu}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">US · {w.us}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">UK · {w.uk}</span>
          </div>

          {/* Aiguilles */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-500">Aiguilles (mm)</p>
              <p className="text-sm font-semibold text-gray-800">{w.needlesMm}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Aiguilles (US)</p>
              <p className="text-sm font-semibold text-gray-800">{w.needlesUs}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Crochet (mm)</p>
              <p className="text-sm font-semibold text-gray-800">{w.crochetMm}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
