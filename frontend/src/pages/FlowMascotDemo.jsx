import FlowMascot from '../components/FlowMascot'

/**
 * [TEMPORAIRE] Page de demo pour visualiser les poses de la mascotte Flow.
 * A supprimer (avec la route /flow-demo dans App.jsx) une fois la validation faite.
 */
const POSES = [
  { key: 'content', label: 'Trop bien !' },
  { key: 'onYVa', label: 'On y va !' },
  { key: 'bonneIdee', label: 'Bonne idée !' },
  { key: 'cestParti', label: "C'est parti !" },
  { key: 'bravo', label: 'Bravo !' },
  { key: 'heureux', label: 'Heureux / qui fête' },
  { key: 'interrogatif', label: 'Interrogatif' },
  { key: 'avecPatron', label: 'Avec un patron' },
  { key: 'surpris', label: 'Surpris' },
  { key: 'quiReflechit', label: 'Qui réfléchit' },
]

const FlowMascotDemo = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#faf5f0', padding: '40px 20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 40, fontFamily: 'sans-serif' }}>
        Flow — demo des poses (page temporaire)
      </h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {POSES.map(({ key, label }) => (
          <div
            key={key}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <FlowMascot pose={key} size={140} />
            <div style={{ marginTop: 12, fontFamily: 'sans-serif', fontSize: 14, color: '#445944' }}>
              {label}
            </div>
          </div>
        ))}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <FlowMascot pose="content" size={140} animate />
          <div style={{ marginTop: 12, fontFamily: 'sans-serif', fontSize: 14, color: '#445944' }}>
            Animee (rebond + balancement)
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlowMascotDemo
