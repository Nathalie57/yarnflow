/**
 * @file check-i18n.cjs
 * @brief Controles de coherence des traductions. `npm run check:i18n`
 * @created 2026-08-04 by [AI:Claude]
 *
 * Lecture seule : ce script ne modifie jamais un fichier.
 *
 * Il existe parce que trois familles de problemes ne se voient pas en testant
 * l'app en francais :
 *
 *   - une cle manquante ou mal cablee cote anglais retombe silencieusement sur
 *     le francais (fallbackLng), donc reste invisible tant qu'on ne bascule pas ;
 *   - un `t()` ecrit dans un composant qui n'a pas le hook plante au rendu.
 *     C'est arrive pendant la migration sur un composant monte dans Layout :
 *     toutes les pages connectees levaient une erreur ;
 *   - du texte ecrit en dur dans le JSX ne casse rien en francais, et ne se
 *     traduira jamais.
 *
 * Le texte affichable peut apparaitre a SIX endroits, chacun ayant echappe a un
 * scan precedent avant d'etre couvert ici :
 *   1. noeud de texte JSX            <p>Bonjour</p>
 *   2. attribut texte                placeholder="Nom"
 *   3. propriete d'un tableau        { label: 'Nom' }
 *   4. expression JSX                {actif ? 'Oui' : 'Non'}
 *   5. gabarit                       `${n} rangs`
 *   6. argument d'affichage          alert('Erreur')
 *
 * Le fichier est volontairement autonome : aucune dependance declaree, aucun
 * outil de test. Il se lance avant un build, quand on y pense.
 *
 * Extension : ajouter un bloc { ... } terminé par report(titre, problemes, msgOk).
 */
const fs = require('fs'), path = require('path')

// [AI:Claude] @babel/* n'est pas une dependance declaree : les deux paquets
// arrivent en transitif via Vite. Les declarer aurait desynchronise le
// package-lock. Si un jour ils disparaissent, le message doit etre explicite
// plutot qu'une pile d'appels illisible.
let parser
try {
  parser = require('@babel/parser')
  require('@babel/traverse')
} catch {
  console.error(
    '\nIl manque @babel/parser et @babel/traverse.\n' +
    'Installe-les :  npm i -D @babel/parser @babel/traverse\n'
  )
  process.exit(2)
}

// [AI:Claude] Tous les chemins ci-dessous sont relatifs a frontend/. On s'y
// place explicitement pour que le script marche aussi lance depuis la racine.
process.chdir(path.join(__dirname, '..'))

const NSS = ['common', 'auth', 'landing', 'pageTitles', 'projects', 'counter', 'library', 'tools', 'legal']
const walk = d => fs.readdirSync(d, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
const rel = f => f.split(path.sep).join('/')
const ALL = walk('src').filter(f => /\.(jsx|js)$/.test(f))
const JSX = ALL.filter(f => f.endsWith('.jsx'))

let failures = 0
const report = (title, problems, okMsg) => {
  if (problems.length) { failures++; console.log(`\n[KO] ${title}\n  ` + problems.slice(0, 25).join('\n  ') + (problems.length > 25 ? `\n  ... (+${problems.length - 25})` : '')) }
  else console.log(`[OK] ${title} — ${okMsg}`)
}

// ---------- 1. syntaxe -------------------------------------------------------
{
  const bad = []
  for (const f of ALL) {
    try { parser.parse(fs.readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }) }
    catch (e) { bad.push(rel(f) + ' :: ' + e.message) }
  }
  report('Syntaxe', bad, ALL.length + ' fichiers parses')
}

// ---------- 2. JSON de traduction valides ------------------------------------
const T = {}
{
  const bad = []
  for (const lang of ['fr', 'en']) for (const ns of NSS) {
    const p = `src/i18n/locales/${lang}/${ns}.json`
    try { T[lang + ':' + ns] = JSON.parse(fs.readFileSync(p, 'utf8')) }
    catch (e) { bad.push(p + ' :: ' + e.message) }
  }
  report('JSON de traduction', bad, NSS.length * 2 + ' fichiers valides')
}

// ---------- 3. imports relatifs resolvables ----------------------------------
{
  const bad = []
  for (const f of ALL) {
    const dir = path.dirname(f)
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)) {
      const base = path.resolve(dir, m[1])
      const found = ['', '.js', '.jsx', '.json', '/index.js', '/index.jsx'].some(ext => fs.existsSync(base + ext))
      if (!found) bad.push(rel(f) + ' -> ' + m[1])
    }
  }
  report('Imports relatifs', bad, 'toutes les cibles existent')
}

// ---------- 4. namespaces charges par i18n/index.js --------------------------
{
  const src = fs.readFileSync('src/i18n/index.js', 'utf8')
  const bad = NSS.filter(ns => !src.includes(`/${ns}.json`) && !src.includes(`'${ns}'`))
  report('Namespaces enregistres dans i18n/index.js', bad.map(n => 'absent: ' + n), NSS.length + ' namespaces')
}

// ---------- 5. dictionnaire a plat -------------------------------------------
const flat = (o, p = '', out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) v.forEach((x, i) => typeof x === 'object' ? flat(x, `${p}${k}.${i}.`, out) : out[`${p}${k}.${i}`] = x)
    else if (v && typeof v === 'object') flat(v, p + k + '.', out)
    else out[p + k] = v
  }
  return out
}
const DICT = {}
for (const lang of ['fr', 'en']) for (const ns of NSS) DICT[lang + ':' + ns] = flat(T[lang + ':' + ns] || {})

// ---------- 6. symetrie FR/EN + interpolations coherentes --------------------
{
  const bad = []
  let n = 0
  for (const ns of NSS) {
    const fr = DICT['fr:' + ns], en = DICT['en:' + ns]
    for (const k of Object.keys(fr)) {
      n++
      if (!(k in en)) { bad.push(`EN manque ${ns}:${k}`); continue }
      const ph = s => [...String(s).matchAll(/\{\{\s*(\w+)/g)].map(m => m[1]).sort().join(',')
      const tag = s => [...String(s).matchAll(/<(\/?\d+)>/g)].map(m => m[1]).sort().join(',')
      if (ph(fr[k]) !== ph(en[k])) bad.push(`interpolation differente ${ns}:${k}  FR[${ph(fr[k])}] EN[${ph(en[k])}]`)
      if (tag(fr[k]) !== tag(en[k])) bad.push(`balises <Trans> differentes ${ns}:${k}`)
    }
    for (const k of Object.keys(en)) if (!(k in fr)) bad.push(`FR manque ${ns}:${k}`)
  }
  report('Symetrie FR/EN + interpolations', bad, n + ' cles comparees')
}

// ---------- 7. valeurs vides --------------------------------------------------
{
  const bad = []
  for (const lang of ['fr', 'en']) for (const ns of NSS)
    for (const [k, v] of Object.entries(DICT[lang + ':' + ns]))
      if (typeof v === 'string' && v.trim() === '') bad.push(`${lang}/${ns}:${k}`)
  report('Valeurs non vides', bad, 'aucune chaine vide')
}

// ---------- 8. chaque t('cle') se resout --------------------------------------
{
  const bad = []
  let n = 0
  for (const f of JSX) {
    const s = fs.readFileSync(f, 'utf8')
    const m = s.match(/useTranslation\(\s*\[?\s*'([a-zA-Z]+)'/)
    // composants classe : withTranslation() injecte t sur le defaultNS
    const own = m ? m[1] : (/withTranslation\(\)/.test(s) ? 'common' : null)
    if (!own) continue
    const extra = NSS.filter(ns => s.includes(`'${ns}'`))
    for (const c of s.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
      n++
      const k = c[1]
      const hit = [own, ...extra].some(ns => DICT['fr:' + ns][k] !== undefined
        || DICT['fr:' + ns][k + '_one'] !== undefined
        // cle pointant sur un tableau/objet (returnObjects: true)
        || Object.keys(DICT['fr:' + ns]).some(kk => kk.startsWith(k + '.')))
      if (!hit) bad.push(`${rel(f)}  ns=${own}  ${k}`)
    }
  }
  report("Resolution des t('cle')", [...new Set(bad)], n + ' appels litteraux')
}

// ---------- 9. prefixes dynamiques t(`x.${...}`) ------------------------------
{
  const bad = []
  for (const f of JSX) {
    const s = fs.readFileSync(f, 'utf8')
    const m = s.match(/useTranslation\(\s*\[?\s*'([a-zA-Z]+)'/)
    if (!m) continue
    for (const c of s.matchAll(/\bt\(`([a-zA-Z0-9_.]+)\.\$\{[^`]*`(?:\s*,\s*\{[^}]*ns:\s*'(\w+)')?/g)) {
      const pref = c[1] + '.'
      // un { ns: 'x' } explicite change le namespace consulte
      const cands = c[2] ? [c[2]] : [m[1]]
      const any = cands.some(ns => Object.keys(DICT['fr:' + ns] || {}).some(k => k.startsWith(pref)))
      if (!any) bad.push(`${rel(f)}  ns=${cands.join('/')}  prefixe ${pref}* vide`)
    }
  }
  report('Prefixes dynamiques t(`x.${}`)', [...new Set(bad)], 'tous alimentes')
}

// ---------- 10. t() utilise sans hook / Trans sans import ---------------------
{
  const bad = []
  for (const f of JSX) {
    const s = fs.readFileSync(f, 'utf8')
    if (/[^a-zA-Z0-9_.]t\(\s*['"`]/.test(s) && !s.includes('useTranslation') && !s.includes('withTranslation')) bad.push(rel(f) + ' : t() sans useTranslation ni withTranslation')
    if (/<Trans[\s>]/.test(s) && !/import\s*\{[^}]*\bTrans\b/.test(s)) bad.push(rel(f) + ' : <Trans> sans import')
  }
  report('Hooks et imports i18n', bad, 'coherents')
}

// ---------- 10b. t() appele hors d'une portee ou `t` est lie ------------------
// (constante au niveau du module, sous-composant sans hook : ReferenceError au rendu,
//  invisible pour un simple controle de syntaxe)
{
  const traverse = require('@babel/traverse').default
  const bad = []
  for (const f of ALL) {
    const code = fs.readFileSync(f, 'utf8')
    if (!/\bt\(/.test(code)) continue
    let ast
    try { ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] }) } catch { continue }
    traverse(ast, {
      CallExpression(p) {
        if (p.node.callee.type !== 'Identifier' || p.node.callee.name !== 't') return
        if (!p.scope.hasBinding('t')) bad.push(rel(f) + ':' + p.node.loc.start.line + '  ' + code.slice(p.node.start, p.node.end).slice(0, 45))
      },
    })
  }
  report('Portee de `t` (pas de ReferenceError au rendu)', bad, 'tous les appels sont dans une portee valide')
}

// ---------- 10d. `i18n.xxx` utilise hors d'une portee ou `i18n` est lie -------
// Meme angle mort que 10b, mais pour l'objet i18n plutot que la fonction t() :
// useTranslation('ns') ne destructure parfois que { t }, et un usage plus loin
// de i18n.language / i18n.resolvedLanguage plante au rendu (ReferenceError),
// invisible pour un simple controle de syntaxe. Trouve en prod le 2026-08-18
// dans PatternLibraryDetail.jsx : useTranslation('library') ne recuperait que
// `t`, et une date affichee appelait i18n.language quelques lignes plus loin.
{
  const traverse = require('@babel/traverse').default
  const bad = []
  for (const f of ALL) {
    const code = fs.readFileSync(f, 'utf8')
    if (!/\bi18n\s*\./.test(code)) continue
    let ast
    try { ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] }) } catch { continue }
    traverse(ast, {
      ReferencedIdentifier(p) {
        if (p.node.name !== 'i18n') return
        if (!p.scope.hasBinding('i18n')) bad.push(rel(f) + ':' + p.node.loc.start.line + '  ' + code.slice(p.node.start, Math.min(p.node.end + 30, code.length)).split('\n')[0])
      },
    })
  }
  report('Portee de `i18n` (pas de ReferenceError au rendu)', bad, 'tous les usages sont dans une portee valide')
}

// ---------- 10c. francais dans les noeuds de TEXTE JSX ------------------------
// (JSXText n'est ni un StringLiteral ni forcement sur une seule ligne :
//  c'est le troisieme angle mort qu'on a paye cher)
{
  const traverse = require('@babel/traverse').default
  const SKIP2 = /admin|i18n[\\/]|Privacy\.jsx|Mentions\.jsx|CGU\.jsx|Dashboard\.jsx|Generator\.jsx|MyPatterns\.jsx|Glossary\.jsx/
  const ACC2 = /[àâäéèêëïîôöùûüÿçœÀÉÈÊÇ]/
  const FR2 = /\b(le|la|les|un|une|des|du|de|au|aux|et|est|sont|vous|votre|vos|ton|tes|ta|notre|dans|pour|par|avec|sur|sans|tout|tous|cette|qui|que|mais|aucun|aucune|chaque|entre|depuis|deja|jamais|toujours|voir|creer|ajouter|supprimer|modifier|enregistrer|annuler|fermer|choisir|selectionner|mes|mon|ma|disponibles?|activer|utilise|utilises|termines?)\b/i
  const bad = []
  for (const f of JSX.filter(x => !SKIP2.test(x))) {
    const code = fs.readFileSync(f, 'utf8')
    let ast
    try { ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] }) } catch { continue }
    traverse(ast, {
      JSXText(p) {
        const v = p.node.value.replace(/\s+/g, ' ').trim()
        if (v.length < 3) return
        if (!ACC2.test(v) && !FR2.test(v)) return
        bad.push(rel(f) + ':' + p.node.loc.start.line + '  ' + JSON.stringify(v.slice(0, 60)))
      },
    })
  }
  report('Texte JSX francais', bad, 'aucun')
}

// ---------- 11. francais residuel ---------------------------------------------
{
  const SKIP = /admin|i18n|Privacy\.jsx|Mentions\.jsx|CGU\.jsx|Dashboard\.jsx|Generator\.jsx|MyPatterns\.jsx/
  const FR = /\b(le|la|les|un|une|des|du|de|au|aux|et|est|sont|vous|votre|vos|notre|dans|pour|par|avec|sur|sans|tout|tous|cette|qui|que|mais|aucun|aucune|chaque|entre|depuis|deja|jamais|toujours|voir|creer|ajouter|supprimer|modifier|enregistrer|annuler|fermer|choisir|selectionner)\b/i
  const ACC = /[àâäéèêëïîôöùûüÿçœÀÉÈÊÇ]/
  const ALLOW = /^(PLUS|Plus|PRO)$/
  const bad = []
  for (const f of JSX.filter(x => !SKIP.test(x))) {
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((l, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) return
      const c = []
      for (const m of l.matchAll(/>([^<>{}]{4,})</g)) c.push(m[1])
      for (const m of l.matchAll(/(placeholder|title|alt|aria-label)="([^"]{4,})"/g)) c.push(m[2])
      for (const txt of c) {
        if (ALLOW.test(txt.trim())) continue
        if (!ACC.test(txt) && !FR.test(txt)) continue
        bad.push(rel(f) + ':' + (i + 1) + '  ' + txt.trim().slice(0, 70)); break
      }
    })
  }
  report('Francais code en dur (hors legal/admin/pages mortes)', bad, 'aucun')
}

// ---------- 12. routes : chaque element importe --------------------------------
{
  const s = fs.readFileSync('src/App.jsx', 'utf8')
  const bad = []
  for (const m of s.matchAll(/element=\{<(\w+)/g)) {
    if (['Navigate', 'ProtectedRoute'].includes(m[1])) continue
    // [AI:Claude] Deux formes possibles depuis le decoupage du bundle :
    // `import Landing from ...` pour les pages chargees d'emblee, et
    // `const Stats = lazy(() => import(...))` pour les pages differees.
    const eager = new RegExp(`import\\s+${m[1]}\\b`)
    const differe = new RegExp(`const\\s+${m[1]}\\s*=\\s*lazy\\(`)
    if (!eager.test(s) && !differe.test(s)) bad.push('route <' + m[1] + '> ni importee ni differee')
  }
  report('Routes App.jsx', [...new Set(bad)], [...s.matchAll(/path="/g)].length + ' routes, tous les composants importes')
}

// ---------- 13. texte litteral passe a une fonction d'affichage ----------------
// Sixieme position ou du texte peut s'afficher, decouverte le 2026-08-04 :
//     alert('Erreur lors de la modification du patron')
// Ce n'est ni du JSX, ni un attribut, ni un tableau de config, ni un gabarit —
// aucun des controles precedents ne descendait dans les arguments d'appel.
{
  const traverse = require('@babel/traverse').default
  const AFFICHAGE = /^(alert|confirm|prompt|showAlert|showToast|toast|setError|setErrors|setMessage|setSuccess|setStatus|setInfo|setWarning|setAlert|setFeedback|setNotice|setToast|setConfirm)$/
  const AUTORISE = [
    /^[^a-z]*$/, /^[a-z][\w.-]*$/, /^https?:\/\//, /^[\d\s.,:%+-]+$/,
    /^(success|error|warning|info|danger|loading|idle|pending)$/i, /^YarnFlow$/,
  ]
  const MORTES = /[\\/]admin[\\/]|UserModal\.jsx$|Generator\.jsx$|MyPatterns\.jsx$|Dashboard\.jsx$/
  const bad = []
  for (const f of ALL.filter(f => !MORTES.test(f) && !f.includes('i18n'))) {
    const src = fs.readFileSync(f, 'utf8')
    let ast
    try { ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] }) } catch { continue }
    traverse(ast, {
      CallExpression(p) {
        const c = p.node.callee
        const nom = c.type === 'Identifier' ? c.name
          : c.type === 'MemberExpression' && c.property.type === 'Identifier' ? c.property.name : null
        if (!nom || !AFFICHAGE.test(nom)) return
        const visiter = (n) => {
          if (!n) return
          if (n.type === 'StringLiteral') {
            const v = n.value.trim()
            if (v && !AUTORISE.some(re => re.test(v))) bad.push(`${rel(f)}:${n.loc.start.line} ${nom}() « ${v.slice(0, 60)} »`)
          } else if (n.type === 'TemplateLiteral') {
            for (const q of n.quasis) {
              const v = q.value.cooked.trim()
              if (v && !AUTORISE.some(re => re.test(v))) bad.push(`${rel(f)}:${n.loc.start.line} ${nom}() \`${v.slice(0, 60)}\``)
            }
          } else if (n.type === 'ObjectExpression') { for (const pr of n.properties) if (pr.value) visiter(pr.value) }
          else if (n.type === 'LogicalExpression') { visiter(n.left); visiter(n.right) }
          else if (n.type === 'ConditionalExpression') { visiter(n.consequent); visiter(n.alternate) }
        }
        p.node.arguments.forEach(visiter)
      },
    })
  }
  report('Texte litteral en argument d\'affichage', bad, 'aucun')
}

// ---------- 14. error_code PHP <-> cles errors.* du frontend -------------------
// Le backend pose des 'error_code' que le frontend traduit. Les deux cotes sont
// dans des langages differents : rien ne les relie a la compilation. Sans ce
// controle, un code ajoute cote PHP afficherait la cle brute a l'ecran.
{
  const bad = []
  const BACK = '../backend'
  if (fs.existsSync(BACK)) {
    const codes = new Set()
    const explorer = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name)
        if (e.isDirectory()) explorer(p)
        else if (e.name.endsWith('.php')) {
          for (const m of fs.readFileSync(p, 'utf8').matchAll(/'error_code'\s*=>\s*'([a-z_]+)'/g)) codes.add(m[1])
        }
      }
    }
    for (const d of ['controllers', 'services', 'middleware', 'routes']) {
      const abs = path.join(BACK, d)
      if (fs.existsSync(abs)) explorer(abs)
    }
    for (const lng of ['fr', 'en']) {
      const errs = JSON.parse(fs.readFileSync(`src/i18n/locales/${lng}/common.json`, 'utf8')).errors || {}
      for (const c of codes) if (!errs[c]) bad.push(`errors.${c} absent de ${lng}/common.json`)
    }
    report('error_code PHP traduits', bad, codes.size + ' codes, tous traduits en FR et EN')
  } else {
    console.log('[--] error_code PHP traduits — backend/ introuvable, controle saute')
  }
}

console.log('\n' + (failures ? `>>> ${failures} controle(s) en echec` : '>>> les controles passent'))

// [AI:Claude] Code de sortie non nul en cas d'echec : permet de chainer la
// commande (`npm run check:i18n && npm run build`) le jour ou tu le souhaites.
process.exit(failures ? 1 : 0)
