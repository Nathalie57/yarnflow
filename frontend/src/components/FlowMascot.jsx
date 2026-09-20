import React from 'react'

// [AI:Claude] 2026-09-17 — Chaque pose est une copie exacte, attribut par
// attribut, d'un dessin.svg trace a la main par l'utilisatrice dans Inkscape et
// valide visuellement (export PNG compare au dessin original). Aucune
// coordonnee n'est recalculee ou reinterpretee : on a essaye de reconstruire
// les courbes/positions a la main a partir des chiffres et ca a introduit des
// erreurs (bras/traits mal places) — la seule methode fiable est de reprendre
// le SVG source tel quel, avec son propre viewBox et son propre groupe
// translate() (absent si le calque source n'en a pas). Manque encore : la
// pose "bravo" (dessin dedie) et "dodo" (svg fourni sans calque vectoriel,
// seulement l'image de reference).
const LINE_COLOR = '#000000'
const BODY_COLOR = '#9cc6a9'
const BLUSH_COLOR = '#f9b4b4'

// dessin.svg — pose "content"
const ContentDrawing = () => (
  <g transform="translate(-34.348616,-39.167867)">
    <ellipse cx="107.46468" cy="87.407051" rx="46.317936" ry="46.869984" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="2.7384" />
    <ellipse cx="94.399628" cy="82.622681" rx="2.7602229" ry="4.9684014" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="2.73299" />
    <ellipse cx="122.58449" cy="81.454643" rx="2.7602229" ry="4.9684014" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="2.73299" />
    <path d="m 97.895909,133.59479 -0.36803,26.49815" stroke={LINE_COLOR} strokeWidth="2.73299" fill="none" />
    <path d="m 120.71375,132.49071 12.88104,25.02602" stroke={LINE_COLOR} strokeWidth="2.73299" fill="none" />
    <ellipse cx="42.507431" cy="93.847588" rx="3.8643124" ry="4.048327" fill={LINE_COLOR} stroke="none" />
    <path
      d="m 173.01974,70.822845 a 4.2323418,4.4163566 0 0 1 -4.19692,4.416202 4.2323418,4.4163566 0 0 1 -4.26717,-4.342275 4.2323418,4.4163566 0 0 1 4.12549,-4.488891 4.2323418,4.4163566 0 0 1 4.33623,4.267131 l -4.22997,0.147833 z"
      fill={LINE_COLOR}
      stroke="none"
    />
    <ellipse cx="164.88617" cy="-62.174942" rx="0.18401487" ry="5.1524162" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="3.63299" transform="rotate(37.411176)" />
    <ellipse cx="207.18953" cy="-22.839031" rx="0.1547939" ry="4.2558026" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="3.02831" transform="matrix(0.57560085,0.8177308,-0.77975116,0.62608955,0,0)" />
    <ellipse cx="3.795567" cy="-72.786972" rx="0.18401487" ry="5.1524162" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="3.63299" transform="rotate(135.92013)" />
    <ellipse cx="72.882607" cy="-40.921135" rx="0.18401487" ry="5.1524162" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="3.63299" transform="rotate(89.687984)" />
    <ellipse cx="120.71939" cy="-163.05901" rx="0.16991499" ry="3.9888911" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="3.07167" transform="matrix(0.21037425,0.97762093,-0.95155769,0.30747027,0,0)" />
    <ellipse cx="171.11577" cy="-75.381462" rx="0.17440382" ry="4.5676413" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="3.33009" transform="matrix(0.10572306,0.99439561,-0.99264594,0.12105384,0,0)" />
    <path
      d="m 44.439439,97.464637 c 5.1176,7.735723 9.21168,11.603573 11.25872,11.955203 2.04704,0.35162 -1.705866,0.35162 3.070561,0.35162 4.776427,0 7.505814,-1.05487 7.505814,-1.05487"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="3.41907"
    />
    <path
      d="m 101.94424,92.007435 c 6.62453,6.624534 11.40892,1.472118 11.40892,1.472118 l 1.84015,-1.840148"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="2.833"
      strokeLinecap="round"
    />
    <path
      d="m 153.83643,92.743492 c 8.46468,-7.360594 12.88104,-16.561336 12.88104,-16.561336 l 0.73606,-3.680299"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="2.833"
      strokeLinecap="round"
    />
    {/* [AI:Claude] 2026-09-18 — Joues roses manquantes depuis la copie verbatim
        d'origine de dessin.svg (path3-0 / path3-0-9), retrouvees et ajoutees. */}
    <ellipse cx="76.707024" cy="100.33443" rx="5.6571732" ry="3.7492964" fill={BLUSH_COLOR} stroke="none" transform="matrix(0.99533089,-0.09652159,0.07898648,0.99687569,0,0)" />
    <ellipse cx="125.10164" cy="101.56189" rx="5.6571732" ry="3.7492964" fill={BLUSH_COLOR} stroke="none" transform="matrix(0.99533089,-0.09652159,0.07898648,0.99687569,0,0)" />
  </g>
)

// ampoule.svg — pose "bonneIdee"
const BonneIdeeDrawing = () => (
  <g transform="translate(-43.330682,-11.36684)">
    <path d="m 98.128724,46.238599 -0.83366,3.946594" fill="#f1dcbd" stroke={LINE_COLOR} strokeWidth="1.953" strokeLinecap="round" />
    <path
      d="m -65.944464,70.279006 a 11.818772,11.396673 0 0 1 13.671169,-0.444486 11.818772,11.396673 0 0 1 4.94963,12.296609 11.818772,11.396673 0 0 1 -10.402203,8.56574 11.818772,11.396673 0 0 1 -11.81973,-6.639394"
      fill="#f1dcbd"
      stroke={LINE_COLOR}
      strokeWidth="1.7055"
      strokeLinecap="round"
      transform="rotate(-104.71089)"
    />
    <rect width="10.304832" height="3.3122678" x="87.223038" y="51.524166" fill="#f1dcbd" stroke="none" />
    <rect width="9.2007437" height="3.6802974" x="87.591072" y="46.003716" fill="#f1dcbd" stroke="none" />
    <path d="m 85.920141,46.54096 1.133694,3.709901" fill="#f1dcbd" stroke={LINE_COLOR} strokeWidth="1.83264" strokeLinecap="round" />
    <path d="m 87.211193,51.303909 9.59249,-0.295552" fill="#f1dcbd" stroke={LINE_COLOR} strokeWidth="2.23055" strokeLinecap="round" />
    <ellipse cx="92.927193" cy="99.184006" rx="36.534321" ry="36.166595" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="1.831" strokeLinecap="round" />
    <ellipse cx="103.31522" cy="95.224403" rx="0.62772167" ry="2.8359001" fill="none" stroke={LINE_COLOR} strokeWidth="4.21572" />
    <ellipse cx="80.839371" cy="95.411362" rx="0.62772167" ry="2.8359001" fill="none" stroke={LINE_COLOR} strokeWidth="4.21572" />
    <path d="m 87.634289,103.70151 c 4.531327,6.37426 8.747892,-0.19961 8.747892,-0.19961" fill="none" stroke={LINE_COLOR} strokeWidth="1.931" />
    <path d="m 44.339182,74.147035 4.96879,3.925171" fill="none" stroke={LINE_COLOR} strokeWidth="2.017" strokeLinecap="round" />
    <path d="m 129.79978,65.609779 4.41009,-4.543883" fill="none" stroke={LINE_COLOR} strokeWidth="2.017" strokeLinecap="round" />
    <path d="m 106.11151,25.914725 3.28248,-2.630963" fill="none" stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 93.009104,16.531139 0.21378,-4.201299" fill="none" stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 69.31101,38.069282 5.252755,-0.895696" fill="none" stroke={LINE_COLOR} strokeWidth="2.03095" strokeLinecap="round" />
    <path d="m 109.07138,38.300154 4.14217,1.216939" fill="none" stroke={LINE_COLOR} strokeWidth="1.86131" strokeLinecap="round" />
    <path d="m 88.695166,51.156134 -0.36803,3.680296" fill="#f1dcbd" stroke={LINE_COLOR} strokeWidth="2.23055" strokeLinecap="round" />
    <path d="M 95.894624,50.788104 V 55.20446" fill="#f1dcbd" stroke={LINE_COLOR} strokeWidth="2.23055" strokeLinecap="round" />
    <path d="m 88.327136,55.043323 7.728625,-0.36803" fill="#f1dcbd" stroke={LINE_COLOR} strokeWidth="1.931" strokeLinecap="round" />
    <path
      d="m 107.67156,21.495828 a 2.5762081,2.3921933 0 0 1 -0.17973,2.409798 2.5762081,2.3921933 0 0 1 -2.35011,1.035768 2.5762081,2.3921933 0 0 1 -2.12421,-1.394375 l 2.34575,-0.988957 z"
      fill={LINE_COLOR}
      stroke={LINE_COLOR}
      strokeWidth="1.931"
      strokeLinecap="round"
      transform="rotate(19.107786)"
    />
    <path d="m 75.901245,22.973104 -2.54864,-3.346799" fill="none" stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 86.486988,134.69888 c 0,2.57621 0.36803,19.50558 0.36803,19.50558" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 96.791821,135.06691 v 19.13755" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 86.486988,153.99757 -7.728624,1.84015" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 96.055761,153.83643 8.096659,2.20818" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <ellipse cx="111.16273" cy="13.060911" rx="2.9397166" ry="2.2054353" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.31096" transform="matrix(0.52673182,0.85003152,-0.88994636,0.45606521,0,0)" />
    <ellipse cx="79.151947" cy="149.00601" rx="2.4163527" ry="1.8496661" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.08847" transform="matrix(0.97103948,-0.23891909,0.20645448,0.97845621,0,0)" />
    <path d="m 109.67286,126.60223 c 0,0 5.15242,1.10409 6.62454,0.36803 1.47211,-0.73606 3.68029,-3.31227 3.68029,-3.31227" fill="none" stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 47.475835,101.94424 3.312269,8.09665 4.048326,4.78439 5.152416,1.47212" fill="none" stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <ellipse cx="56.39241" cy="79.18412" rx="1.0068974" ry="1.5589488" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.75234" transform="rotate(-30.646324)" />
    <ellipse cx="101.76694" cy="-12.675118" rx="0.92007434" ry="1.6561338" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" transform="rotate(29.569262)" />
    <path d="m 89.063197,40.115241 c 2.576208,4.048328 2.576208,10.304833 2.576208,10.304833" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
    <path d="m 93.479553,40.115241 c -2.208178,5.152416 -1.840148,9.568772 -1.840148,9.568772" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.926" strokeLinecap="round" />
  </g>
)

// court.svg — pose "cestParti"
const CestPartiDrawing = () => (
  <g transform="translate(-33.280264,-38.433848)">
    <path
      d="M 151.13669,79.678993 A 38.703396,39.807148 0 0 1 112.46387,119.48613 38.703396,39.807148 0 0 1 73.729949,79.741875 38.703396,39.807148 0 0 1 112.34159,39.871957 38.703396,39.807148 0 0 1 151.1365,79.55323"
      fill={BODY_COLOR}
      stroke={LINE_COLOR}
      strokeWidth="2.87599"
      strokeLinecap="round"
    />
    <ellipse cx="104.59216" cy="75.074165" rx="0.62772167" ry="2.8359001" fill="none" stroke={LINE_COLOR} strokeWidth="4.21572" />
    <ellipse cx="127.42793" cy="74.473396" rx="0.62772167" ry="2.8359001" fill="none" stroke={LINE_COLOR} strokeWidth="4.21572" />
    <path d="m 112.38891,83.488239 c 4.53132,6.37426 8.74789,-0.19961 8.74789,-0.19961" fill="none" stroke={LINE_COLOR} strokeWidth="1.931" />
    <ellipse cx="-83.815804" cy="-170.08052" rx="2.9397166" ry="2.2054353" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.31096" transform="matrix(-0.75082019,0.66050666,-0.59744483,-0.80191001,0,0)" />
    <ellipse cx="97.242844" cy="78.647369" rx="2.9397166" ry="2.2054353" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.31096" transform="matrix(0.95079812,0.30981114,-0.3858941,0.92254308,0,0)" />
    <path
      d="m 144.26766,89.431227 c 5.52044,1.472117 4.41635,3.312265 8.46468,1.472117 4.04833,-1.840147 5.15242,-2.576208 6.99257,-4.048326 1.84014,-1.47212 3.31226,-4.048328 3.31226,-4.048328"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="2.893"
      strokeLinecap="round"
    />
    <path
      d="m 74.710035,89.431227 c -5.152416,1.104087 -8.464682,2.576208 -8.464682,2.576208 l -2.20818,2.576207 -1.104089,4.784387 -0.73606,3.312271"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="2.893"
      strokeLinecap="round"
    />
    <path
      d="m 120.71375,118.13754 c 4.41636,6.62454 5.15242,8.83272 5.15242,8.83272 l 2.94424,4.41636 1.47212,2.5762 3.31226,6.99257"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="2.893"
      strokeLinecap="round"
    />
    <path d="m 134.33085,141.32342 6.25651,-5.88848" fill="none" stroke={LINE_COLOR} strokeWidth="2.993" strokeLinecap="round" />
    <path d="m 80.230482,122.92193 -5.888474,5.88848" fill="none" stroke={LINE_COLOR} strokeWidth="2.893" strokeLinecap="round" />
    <path d="m 43.427509,76.182156 18.401488,0.36803" fill="none" stroke={LINE_COLOR} strokeWidth="1.893" strokeLinecap="round" />
    <path d="m 34.226764,94.583643 18.769518,-0.36803" fill="none" stroke={LINE_COLOR} strokeWidth="1.893" strokeLinecap="round" />
    <path d="m 43.059479,113.14627 22.817844,0.36803" fill="none" stroke={LINE_COLOR} strokeWidth="1.893" strokeLinecap="round" />
    <path
      d="m 80.230482,122.5539 c 6.992564,5.52045 6.992564,7.3606 9.936802,5.88848 2.944239,-1.47212 9.936806,-9.93681 9.936806,-9.93681"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="2.893"
      strokeLinecap="round"
    />
  </g>
)

// dessin-1.svg — pose "onYVa"
const YARN_COLOR = '#e68f88'
const YARN_LINE = '#93544a'
const OnYVaDrawing = () => (
  <g transform="translate(-32.257176,-22.270371)">
    <ellipse cx="80.414505" cy="53.916355" rx="30.730482" ry="30.730484" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="1.831" />
    <ellipse cx="71.581795" cy="51.340145" rx="0.55204457" ry="2.3921933" fill="none" stroke={LINE_COLOR} strokeWidth="3.63101" />
    <ellipse cx="89.878967" cy="49.97855" rx="0.55204457" ry="2.3921933" fill="none" stroke={LINE_COLOR} strokeWidth="3.63101" />
    <ellipse cx="104.52045" cy="69.557625" rx="13.18648" ry="12.818449" fill={YARN_COLOR} stroke={YARN_LINE} strokeWidth="1.55618" />
    <path
      d="m 100.84015,57.573775 c 0.4907,0.245353 1.22676,1.226767 1.47212,0.73606 0.24535,-0.490707 -1.81485,-1.164463 -1.47212,-0.73606 0.81464,1.01831 2.02212,1.654093 2.94424,2.576208 0.0867,0.08675 -0.0867,0.281286 0,0.36803 0.0199,0.01995 1.08414,0.716119 1.10409,0.73606 0.1692,0.169204 0.59134,1.182696 0.73605,1.472118 0.11111,0.222208 -0.17012,0.933963 0,1.104091 0.0868,0.08675 0.28129,-0.08675 0.36803,0 0.17349,0.173489 0,0.490706 0,0.73606 0,1.395227 0.36803,2.32062 0.36803,3.680296"
      fill={YARN_COLOR}
      fillOpacity="0.516129"
      stroke={YARN_LINE}
      strokeWidth="1.121"
    />
    <path d="m 105.99256,63.301115 c 1.39693,-0.08298 3.31227,-0.736167 3.31227,-5.152417" fill={YARN_COLOR} fillOpacity="0.516129" stroke={YARN_LINE} strokeWidth="1.121" />
    <path
      d="m 114.62546,61.031819 c 0,0.428144 -0.69713,1.79857 -0.77728,1.89641 -0.0917,0.11174 -0.29709,-0.111753 -0.38864,0 -0.0916,0.11174 0.0915,0.362358 0,0.474098 -0.0916,0.111753 -0.29709,-0.11174 -0.38864,0 -0.0916,0.111753 0.0916,0.362363 0,0.474103 -0.80411,0.980935 0.0315,-1.498996 -0.77728,0.474102 -0.058,0.14135 0.11587,0.403431 0,0.474102 -0.23174,0.14135 -0.54554,-0.14135 -0.77728,0 -0.11588,0.07067 0.0915,0.36235 0,0.474103 -0.5075,0.619088 -3.12703,1.065934 -3.88641,1.422303 2.25139,0.764261 6.03533,4.015967 8.16145,1.422308 0.44753,-0.545948 0.77728,-0.245827 0.77728,-0.948205"
      fill={YARN_COLOR}
      fillOpacity="0.516129"
      stroke={YARN_LINE}
      strokeWidth="1.30747"
    />
    <path
      d="m 114.80372,77.695816 c -0.33074,0 -1.3894,-0.837513 -1.46493,-0.933874 -0.0864,-0.110064 0.0863,-0.356872 0,-0.466936 -0.0864,-0.110064 -0.25705,0.0696 -0.36623,0 -0.35395,-0.225632 -1.28796,-1.416475 -1.46493,-1.867742 -1.29149,-3.293204 -1.52642,-6.91838 -5.49349,-6.537102 3.41525,0.427772 0.8291,3.981902 1.46493,5.603231 0.0772,0.196877 0.31164,0.258116 0.36623,0.466936 0.25636,0.980565 -0.25636,2.287986 0,3.268551 0.0546,0.20882 0.31164,0.258116 0.36623,0.466936 0.0795,0.304158 -0.20506,2.073224 0,2.334679 0.34111,0.434891 0.36623,-0.03663 0.36623,0.933871"
      fill={YARN_COLOR}
      fillOpacity="0.516129"
      stroke={YARN_LINE}
      strokeWidth="1.121"
    />
    <path
      d="m 106.3533,66.609772 c 0.13376,2.388817 0.0832,4.684889 -0.73234,6.663663 -0.32495,0.788481 -0.0311,2.296708 -0.36617,3.10971 -0.0546,0.132449 -0.31158,-0.132448 -0.36616,0 -0.10918,0.264897 0.10916,0.623594 0,0.88849 -0.0546,0.132449 -0.27987,-0.104715 -0.36617,0 -0.17263,0.209417 0.10916,0.623593 0,0.88849 -0.1544,0.374618 -0.57796,0.513868 -0.73234,0.888489 -0.35191,0.853883 -0.36617,1.6203 -0.36617,2.665466"
      fill={YARN_COLOR}
      fillOpacity="0.516129"
      stroke={YARN_LINE}
      strokeWidth="1.2285"
    />
    <ellipse cx="85.029694" cy="103.9255" rx="2.5762081" ry="1.8401487" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.121" transform="rotate(-12.835696)" />
    <path d="M 85.014868,84.27881 84.64684,100.47212" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.831" />
    <path d="m 84.64684,99.368029 6.256504,2.576211" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.831" strokeLinecap="round" />
    <path d="m 75.078065,84.27881 0.36803,15.82528" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.831" strokeLinecap="round" />
    <path d="m 75.446095,100.84015 -6.624534,1.10409" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.831" strokeLinecap="round" />
    <path
      d="m 72.869887,76.918216 c 0.490707,-0.122677 1.594797,0.122676 1.472121,-0.36803 -0.122677,-0.490707 -1.962828,0.490706 -1.472121,0.36803 3.692321,-0.923081 2.251792,-0.757867 4.416356,-1.840151 0.329176,-0.164587 0.754946,0.116382 1.104091,0 0.329176,-0.109725 0.413895,-0.607192 0.73606,-0.736057 1.897615,-0.759048 4.43248,-0.192077 6.256504,-1.104091 0.569008,-0.284504 2.152639,-0.933958 2.944238,-0.73606 0.8078,0.201951 0.839375,0.787717 1.472118,1.10409 0.270145,0.135073 0.82283,0.642305 1.10409,0.736061 0.232762,0.07759 0.503299,-0.07759 0.736061,0 0.801756,-0.13756 0.122676,0.61338 0.36803,0.736057 0.858734,0.429369 0.736057,-0.460036 0.736057,0.36803"
      fill="none"
      stroke={YARN_LINE}
      strokeWidth="1.031"
      strokeLinecap="round"
    />
    <path
      d="m 55.94052,71.926936 c 1.840148,8.832713 3.312269,8.096655 6.992564,8.464682 3.680299,0.368031 6.624535,-1.104087 6.624535,-1.104087 l 2.576208,-2.576208"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="1.731"
    />
    <ellipse cx="54.933479" cy="91.47374" rx="2.5762081" ry="1.8401487" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.121" transform="rotate(-12.835696)" />
    <path d="m 33.122676,51.156134 8.464685,0.736057" fill="none" stroke={LINE_COLOR} strokeWidth="1.731" strokeLinecap="round" />
    <path d="m 37.539033,37.907063 7.360594,4.048326" fill="none" stroke={LINE_COLOR} strokeWidth="1.731" strokeLinecap="round" />
    <path d="m 76.526722,59.229764 c 4.53133,6.37426 8.74789,-0.19961 8.74789,-0.19961" fill="none" stroke={LINE_COLOR} strokeWidth="1.931" />
  </g>
)

// heureux.svg — pose "heureux" (celebration)
const HeureuxDrawing = () => (
  <g transform="translate(-26.617785,-19.137546)">
    <ellipse cx="101.76022" cy="91.087357" rx="39.489826" ry="37.281647" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3.04" strokeLinecap="round" />
    <path d="m 35.330855,110.77695 12.14498,-6.99256" fill="#68a087" stroke="#68a087" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 138.93808,121.64068 4.03462,5.87477" fill="#68a087" stroke="#68a087" strokeWidth="2.35063" strokeLinecap="round" />
    <path d="m 96.061247,84.386314 c -5.504639,-5.55545 -8.599849,1.614968 -8.599849,1.614968" fill="none" stroke={LINE_COLOR} strokeWidth="1.931" strokeLinecap="round" />
    <path d="m 123.36624,79.618844 c -5.63558,-5.422574 -8.55888,1.819632 -8.55888,1.819632" fill="none" stroke={LINE_COLOR} strokeWidth="1.931" strokeLinecap="round" />
    <ellipse cx="26.687651" cy="125.34596" rx="3.6802974" ry="2.2081783" fill={BLUSH_COLOR} stroke="none" transform="rotate(-29.291363)" />
    <ellipse cx="69.892456" cy="139.23218" rx="3.6802974" ry="2.2081783" fill={BLUSH_COLOR} stroke="none" transform="rotate(-29.291363)" />
    <path
      d="m 101.35177,91.668247 c -0.76407,-3.484378 2.2063,-2.086911 5.36349,-2.779224 3.1572,-0.692314 5.27025,-3.204499 6.03432,0.279879 0.76407,3.484378 -0.74087,7.968691 -3.89806,8.661005 -3.15719,0.692322 -6.73569,-2.677282 -7.49975,-6.16166 z"
      stroke={LINE_COLOR}
      strokeWidth="1.54703"
      strokeLinecap="round"
    />
    <path d="m 94.609293,128.20129 c -3.93193,14.18842 -7.54313,18.62744 -16.988531,10.29028" fill="none" stroke={LINE_COLOR} strokeWidth="2.97227" strokeLinecap="round" />
    <path d="m 78.030705,139.21482 -4.065132,5.5978" fill="none" stroke={LINE_COLOR} strokeWidth="3.441" strokeLinecap="round" />
    <path d="m 111.88104,127.70632 11.04089,19.50557" fill="none" stroke={LINE_COLOR} strokeWidth="3.04001" strokeLinecap="round" />
    <path d="m 131.01859,140.58736 -7.72863,6.2565" fill="none" stroke={LINE_COLOR} strokeWidth="3.04001" strokeLinecap="round" />
    <path d="m 142.05948,90.903344 8.46468,-13.985128" fill="none" stroke={LINE_COLOR} strokeWidth="3.44101" strokeLinecap="round" />
    <path d="M 61.828997,94.583643 51.156134,79.862451" fill="none" stroke={LINE_COLOR} strokeWidth="3.44101" strokeLinecap="round" />
    <ellipse cx="1.4826543" cy="-92.531944" rx="3.5884395" ry="2.7504053" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.61748" transform="matrix(-0.71531518,0.69880197,-0.55713068,-0.83042483,0,0)" />
    <ellipse cx="-162.97202" cy="25.084896" rx="3.5884395" ry="2.7504053" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.61748" transform="matrix(-0.82061236,-0.57148522,0.71113366,-0.70305684,0,0)" />
    <path d="M 282.2788,151.26022 276.39033,173.342" fill="#f38a78" stroke="none" strokeWidth="3.44101" strokeLinecap="round" />
    <path
      d="m 71.029739,19.137546 -1.840148,10.672862 -8.464685,4.048329 8.096655,4.416356 0.736058,8.464685 7.360597,-6.256507 8.832712,2.576208 -3.312268,-8.832715 4.048328,-8.832712 -8.096654,0.736059 z"
      fill="#fac268"
      stroke="none"
      strokeWidth="3.44101"
      strokeLinecap="round"
    />
    <path
      d="m 165.30058,73.442249 -4.60459,-9.802747 -9.23519,-1.658644 6.63559,-6.405379 -1.53504,-8.356812 8.75622,4.080547 7.83329,-4.826311 -0.85134,9.39485 6.24572,7.442898 -8.00195,1.437436 z"
      fill="#f38c78"
      stroke="none"
      strokeWidth="3.44101"
      strokeLinecap="round"
    />
    <path d="m 111.88104,28.33829 -1.84015,12.144981" fill="#fac268" stroke="none" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 48.947956,42.323419 8.464682,10.672863" fill="#fac268" stroke="none" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 35.698885,57.412638 11.77695,7.728625" fill="#fac268" stroke="none" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="M 57.412638,55.20446 46.371748,40.851301" fill="#fac268" stroke="#fac268" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 36.066915,57.044608 10.672863,7.728624" fill="#fac268" stroke="#fac268" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 50.420074,126.60223 6.256506,-8.09666" fill="#fac268" stroke="#fac268" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="M 108.9368,39.747211 113.35316,26.86617" fill="#fac268" stroke="#fac268" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 139.48327,46.003717 8.46468,-9.936802" fill="#fac268" stroke="#f38c78" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 149.7881,111.14498 10.67287,7.72862" fill="#fac268" stroke="#f38c78" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 28.33829,85.382898 14.353159,1.10409" fill="#fac268" stroke="#f38c78" strokeWidth="3.44101" strokeLinecap="round" />
    <path d="m 157.88476,89.799254 13.6171,5.520447" fill="none" stroke="#f38c78" strokeWidth="3.44101" strokeLinecap="round" />
    <path
      d="m 158.11372,261.41431 a 4.2323418,4.4163566 0 0 1 -4.19692,4.4162 4.2323418,4.4163566 0 0 1 -4.26717,-4.34228 4.2323418,4.4163566 0 0 1 4.12548,-4.48889 4.2323418,4.4163566 0 0 1 4.33624,4.26713 l -4.22997,0.14784 z"
      fill={LINE_COLOR}
      stroke="none"
    />
  </g>
)

// interrogatif.svg — pose "interrogatif"
const InterrogatifDrawing = () => (
  <g>
    <ellipse cx="105.18312" cy="116.51645" rx="46.725433" ry="45.621346" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="58.866344" cy="141.92113" rx="0.72396559" ry="3.2707076" fill="none" stroke={LINE_COLOR} strokeWidth="4.86209" transform="rotate(-18.441792)" />
    <ellipse cx="89.171989" cy="141.36171" rx="0.72396559" ry="3.2707076" fill="none" stroke={LINE_COLOR} strokeWidth="4.86209" transform="rotate(-18.441792)" />
    <path d="m 117.67271,124.78719 c -0.0687,-3.76423 1.0257,-4.43614 1.0257,-4.43614 0,0 4.48165,-1.99386 5.15022,3.73028" fill="none" stroke={LINE_COLOR} strokeWidth="1.54558" strokeLinecap="round" />
    <path
      d="m 147.96552,42.540725 c 0.78457,-1.157687 -0.10516,-0.698889 2.57034,-2.199005 2.98954,-1.676192 6.85218,-2.050846 9.3261,-1.025744 3.42887,1.420798 5.29563,4.562723 5.13921,7.997917 -0.13837,3.038816 -1.17315,6.124512 -5.79841,7.614469 -4.36215,2.844102 -5.92356,7.788592 -5.92356,7.788592"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="4.9"
      strokeLinecap="round"
    />
    <path
      d="m 150.51929,72.506492 a 1.3011817,1.1710634 0 0 1 -0.12035,-1.492325 1.3011817,1.1710634 0 0 1 1.60778,-0.380704 1.3011817,1.1710634 0 0 1 0.71125,1.352411 1.3011817,1.1710634 0 0 1 -1.34639,0.877738"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="4.9"
      strokeLinecap="round"
    />
    <path d="m 75.446095,151.26022 -0.73606,9.9368" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path
      d="m 141.59944,144.72769 c 4.87639,6.34852 4.60037,7.54461 4.60037,7.54461 0,0 0.36803,-0.092 -0.092,0.46004 -0.46003,0.55204 -0.82806,0.92007 -1.65613,0.82807 -0.82807,-0.092 0,0.27602 -1.93216,-0.64405 -1.93215,-0.92008 -4.14033,-3.12826 -4.14033,-3.12826 0,0 2.20819,2.02416 0,0 0,0 -2.76023,-3.31226 -3.12826,-3.86431 -0.36803,-0.55204 -2.20818,-4.78438 -2.20818,-4.78438"
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <ellipse cx="131.62505" cy="138.38016" rx="3.8643124" ry="4.048327" fill={LINE_COLOR} stroke="none" />
    <ellipse cx="75.158951" cy="165.4995" rx="3.8643124" ry="4.048327" fill={LINE_COLOR} stroke="none" />
    <path d="m 117.76072,161.74065 0.86312,22.10956 9.27854,0.26321" fill="none" stroke={LINE_COLOR} strokeWidth="2.74732" strokeLinecap="round" />
    <path d="m 97.068147,162.38747 1.040947,20.03819 -9.88898,0.52048" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="M 43.459466,90.562241 52.3075,91.863422" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 49.444901,73.126406 9.108271,7.286617" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 63.757899,63.237427 5.7252,10.669688" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="-2.2355039" cy="162.03873" rx="4.679882" ry="2.4130437" fill={BLUSH_COLOR} stroke="none" transform="matrix(0.92302041,-0.38475098,0.6025266,0.7980988,0,0)" />
    <ellipse cx="66.755997" cy="169.05147" rx="4.2251992" ry="2.5351193" fill={BLUSH_COLOR} stroke="none" transform="rotate(-29.291363)" />
  </g>
)

// patron.svg — pose "avecPatron"
const AvecPatronDrawing = () => (
  <g transform="translate(-34.198885,-32.726766)">
    <ellipse cx="101.76022" cy="78.758362" rx="46.090641" ry="44.434505" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3.19418" strokeLinecap="round" />
    <ellipse cx="92.451218" cy="72.513855" rx="0.80265266" ry="2.6428013" fill="none" stroke={LINE_COLOR} strokeWidth="4.60192" />
    <ellipse cx="124.3166" cy="68.06768" rx="0.80265266" ry="2.6428013" fill="none" stroke={LINE_COLOR} strokeWidth="4.60192" />
    <path d="m 105.57551,78.50096 c 4.53132,6.37426 8.74789,-0.19961 8.74789,-0.19961" fill="none" stroke={LINE_COLOR} strokeWidth="1.931" />
    <ellipse cx="77.340111" cy="90.373848" rx="4.2908521" ry="2.5745111" fill={BLUSH_COLOR} stroke="none" transform="rotate(-4.1446338)" />
    <ellipse cx="82.684258" cy="130.19316" rx="4.2908521" ry="2.5745111" fill={BLUSH_COLOR} stroke="none" transform="rotate(-27.332082)" />
    <path d="m 39.747211,54.4684 9.568772,6.624536" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 35.698885,77.654273 h 9.568772" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 85.750928,121.08178 -3.312268,20.60967 -8.096652,-1.10409" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 110.40892,136.90706 c 0,0 -0.73606,5.88848 0,4.41636 0.73606,-1.47212 9.9368,-0.36803 9.9368,-0.36803" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="M 155.30855,59.988846 166.71747,54.4684" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 147.57992,47.475835 7.72863,-9.200742" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 90.535314,112.24907 c 6.256507,2.57621 4.784387,3.31227 8.096655,2.57621 7.728621,-2.57621 7.728621,-2.57621 7.728621,-2.57621" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 117.03346,80.966542 -15.08922,57.412638 49.31598,-5.15242 15.45725,-58.148695 z" fill="#ffffff" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 117.03346,118.8736 30.17843,-2.5762" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 115.56134,126.2342 30.17843,-2.94424" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 122.67913,103.50582 30.17843,-2.94424" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 125.12406,92.371435 30.17843,-2.94424" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path
      d="m 112.43399,112.00027 a 4.2323418,4.4163566 0 0 1 -4.19691,4.4162 4.2323418,4.4163566 0 0 1 -4.26718,-4.34228 4.2323418,4.4163566 0 0 1 4.12549,-4.48889 4.2323418,4.4163566 0 0 1 4.33623,4.26713 l -4.22997,0.14784 z"
      fill={LINE_COLOR}
      stroke="none"
    />
    <path
      d="m 165.31683,102.76177 a 4.2323418,4.4163566 0 0 1 -4.19692,4.4162 4.2323418,4.4163566 0 0 1 -4.26717,-4.34227 4.2323418,4.4163566 0 0 1 4.12548,-4.488892 4.2323418,4.4163566 0 0 1 4.33624,4.267132 l -4.22997,0.14783 z"
      fill={LINE_COLOR}
      stroke="none"
    />
  </g>
)

// surpris.svg — pose "surpris"
const SurprisDrawing = () => (
  <g transform="translate(-22.421933,-11.768313)">
    <ellipse cx="101.02417" cy="92.375465" rx="49.751518" ry="49.567505" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3.23302" strokeLinecap="round" />
    <ellipse cx="66.538704" cy="104.17202" rx="1.0663978" ry="3.5112042" fill="none" stroke={LINE_COLOR} strokeWidth="6.11408" transform="rotate(-13.366848)" />
    <ellipse cx="103.33539" cy="103.48071" rx="1.0663978" ry="3.5112042" fill="none" stroke={LINE_COLOR} strokeWidth="6.11408" transform="rotate(-13.366848)" />
    <ellipse cx="94.633064" cy="106.32022" rx="1.2470039" ry="3.3518178" fill="none" stroke={LINE_COLOR} strokeWidth="6.45978" transform="matrix(0.9950921,-0.09895313,0.14943257,0.98877192,0,0)" />
    <ellipse cx="74.363312" cy="110.49494" rx="5.6571732" ry="3.7492964" fill={BLUSH_COLOR} stroke="none" transform="matrix(0.99533089,-0.09652159,0.07898648,0.99687569,0,0)" />
    <ellipse cx="95.724976" cy="135.87" rx="5.7479029" ry="3.6347828" fill={BLUSH_COLOR} stroke="none" transform="matrix(0.92310827,-0.38454013,0.33977977,0.94050503,0,0)" />
    <path d="m 56.67658,115.19331 -8.464685,15.82528" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 88.327136,140.58736 -1.10409,19.87361 h -10.67286" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 112.24907,142.05948 2.57621,18.76951 10.30483,-0.73605" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 145.73977,113.72119 10.30484,11.77695" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 49.684013,34.594794 9.568776,14.353162" fill="none" stroke="#fac268" strokeWidth="3" strokeLinecap="round" />
    <path d="m 33.122676,52.260222 15.82528,10.304832" fill="none" stroke="#fac268" strokeWidth="3" strokeLinecap="round" />
    <path d="m 23.921933,75.078065 17.665428,2.208178" fill="none" stroke="#fac268" strokeWidth="3" strokeLinecap="round" />
    <path d="M 161.93308,71.765799 178.12639,60.356876" fill="none" stroke="#fac268" strokeWidth="3" strokeLinecap="round" />
    <path d="m 164.87732,90.903344 23.18588,-0.73606" fill="none" stroke="#fac268" strokeWidth="3" strokeLinecap="round" />
    <path d="M 174.28052,13.719488 161.28017,38.540735" fill="none" stroke="#f38c78" strokeWidth="3.90235" strokeLinecap="round" />
    <ellipse cx="157.88475" cy="46.555763" rx="3.3122675" ry="3.1282527" fill="#f38c78" stroke="#f38c78" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="-60.585957" cy="-203.79974" rx="3.5884395" ry="2.7504053" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.61748" transform="matrix(-0.71531518,0.69880197,-0.55713068,-0.83042483,0,0)" />
    <ellipse cx="-129.35622" cy="-85.789215" rx="3.5884395" ry="2.7504053" fill={LINE_COLOR} stroke={LINE_COLOR} strokeWidth="1.61748" transform="matrix(-0.82871865,-0.55966543,0.70098434,-0.71317666,0,0)" />
  </g>
)

// travail.svg — pose "quiReflechit" (avec engrenages/loupe et main au menton)
const QuiReflechitDrawing = () => (
  <g transform="translate(-22.421933,-21.345725)">
    <path
      d="m 190.47897,79.621601 c 0,6.581504 -0.0662,13.544943 -3.36388,13.448517 -2.57977,-0.07543 -2.12074,-6.862744 -2.12074,-13.444248 0,-6.581505 0.96017,-11.916868 2.1446,-11.916868 1.18443,0 3.34002,5.331094 3.34002,11.912599 z"
      fill="#557082"
      stroke={LINE_COLOR}
      strokeWidth="1.83559"
      strokeLinecap="round"
      transform="matrix(0.92171546,0.38786676,-0.52774697,0.84940164,0,0)"
    />
    <path
      d="m 135.43494,52.628252 v 5.520446 h 7.3606 l 0.73606,-4.048326 3.68029,-2.576208 4.04833,2.576208 5.15242,-5.888477 -3.31227,-3.312268 0.36803,-4.416356 4.78439,-1.840148 -2.57621,-6.992567 -3.6803,0.36803 -3.31227,-2.576208 0.36803,-5.520445 -6.2565,-2.576208 -2.57621,4.784386 -3.6803,0.736059 -2.94424,-2.944237 -4.78438,3.312267 1.47212,4.048328 -1.10409,3.312266 h -4.04833 l -1.10409,6.992567 4.04833,1.104088 0.73606,2.208178 -2.57621,2.944238 3.31227,4.784387 z"
      fill="#8bb4c0"
      stroke="none"
      strokeWidth="4.9"
      strokeLinecap="round"
    />
    <path
      d="m 136.8721,43.317127 a 5.1524162,5.1524162 0 0 1 0.12105,-7.261671 5.1524162,5.1524162 0 0 1 7.26231,0.07341 5.1524162,5.1524162 0 0 1 -0.0258,7.262634 5.1524162,5.1524162 0 0 1 -7.26265,0.02187"
      fill="#ffffff"
      stroke="none"
      strokeWidth="4.9"
      strokeLinecap="round"
    />
    <path
      d="m 172.23792,61.092936 1.47211,2.944239 4.04833,-0.36803 0.73606,5.520446 -3.6803,1.104088 -1.47212,2.576208 2.57621,3.312269 -4.41635,3.680295 -2.57621,-2.576208 -2.20818,0.36803 -2.20818,2.944239 -5.88847,-2.208178 1.47212,-3.312269 -1.47212,-2.208178 -3.6803,-0.36803 v -6.256504 l 2.94424,-0.36803 1.47212,-2.208178 -1.47212,-3.680299 4.41635,-3.312266 1.47212,2.576209 h 2.94424 l 1.10409,-2.944239 6.62453,1.840148 z"
      fill="#8bb4c0"
      stroke="none"
      strokeWidth="4.9"
      strokeLinecap="round"
    />
    <path
      d="m 164.22644,70.804992 a 2.9442379,3.1282527 0 0 1 -0.27233,-3.986439 2.9442379,3.1282527 0 0 1 3.63801,-1.01697 2.9442379,3.1282527 0 0 1 1.60936,3.612684 2.9442379,3.1282527 0 0 1 -3.04654,2.344695"
      fill="#ffffff"
      stroke="none"
      strokeWidth="4.49655"
      strokeLinecap="round"
    />
    <path
      d="m 52.458905,137.56636 a 48.211895,50.052044 0 0 1 1.178213,-70.587975 48.211895,50.052044 0 0 1 67.998062,0.853264 48.211895,50.052044 0 0 1 -0.46555,70.596911 48.211895,50.052044 0 0 1 -68.002943,-0.11336"
      fill={BODY_COLOR}
      stroke={LINE_COLOR}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <ellipse cx="49.603065" cy="159.67252" rx="4.4801702" ry="2.688102" fill={BLUSH_COLOR} stroke="none" transform="rotate(-29.291363)" />
    <ellipse cx="86.1772" cy="112.68293" rx="0.72396559" ry="3.2707076" fill="none" stroke={LINE_COLOR} strokeWidth="4.86209" transform="rotate(0.45340254)" />
    <ellipse cx="74.903725" cy="135.19868" rx="0.72396559" ry="3.2707076" fill="none" stroke={LINE_COLOR} strokeWidth="4.86209" transform="rotate(-18.441792)" />
    <path d="M 88.424319,103.0701 77.92512,107.90243" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3.01211" strokeLinecap="round" />
    <path d="m 104.52045,95.319701 1.84014,-6.624535 7.72863,2.944239" fill={BODY_COLOR} stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 80.598512,152.36431 0.36803,20.24164 -9.568773,-0.36803" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 101.20818,150.52416 1.10409,21.71376 9.9368,0.36803" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 61.092936,139.48327 -1.10409,7.36059 v 5.15242 l 0.73606,1.10409" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 120.71375,139.8513 6.99257,0.73606" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path
      d="m 137.13393,139.9109 a 5.8884759,4.7843866 0 0 1 -5.83919,4.78422 5.8884759,4.7843866 0 0 1 -5.93694,-4.70413 5.8884759,4.7843866 0 0 1 5.73981,-4.86296 5.8884759,4.7843866 0 0 1 6.03302,4.62272 l -5.88518,0.16015 z"
      fill={LINE_COLOR}
      stroke="none"
    />
    <path
      d="m 65.039719,154.91254 a 4.2323418,4.4163566 0 0 1 -4.196918,4.4162 4.2323418,4.4163566 0 0 1 -4.267173,-4.34228 4.2323418,4.4163566 0 0 1 4.125485,-4.48889 4.2323418,4.4163566 0 0 1 4.336234,4.26713 l -4.22997,0.14784 z"
      fill={LINE_COLOR}
      stroke="none"
    />
    <ellipse cx="68.507271" cy="134.61099" rx="4.7300224" ry="2.8380132" fill={BLUSH_COLOR} stroke="none" transform="rotate(-5.0095458)" />
    <path d="m 99.368029,123.65799 8.096651,-4.04833" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 23.921933,78.390334 11.776952,2.576208" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 32.018586,57.780668 10.672863,8.464685" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <path d="m 48.211895,46.003717 4.416357,11.776951" fill="none" stroke={LINE_COLOR} strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="182.16763" cy="9.6566515" rx="18.81904" ry="21.085718" fill="#557082" stroke={LINE_COLOR} strokeWidth="2.05299" strokeLinecap="round" transform="rotate(35.161189)" />
    <ellipse cx="180.33403" cy="30.67687" rx="13.926276" ry="15.766425" fill="#e7f3f3" stroke={LINE_COLOR} strokeWidth="1.98574" strokeLinecap="round" transform="rotate(28.564485)" />
    <path d="m 139.29974,105.80806 c -4.0493,5.13446 -4.0493,11.40989 -4.0493,11.40989" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <path d="m 152.12948,109.90913 c 0.33663,6.01502 -5.04935,10.93638 -5.04935,10.93638" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
  </g>
)

const POSES = {
  content: { viewBox: '0 0 151.4964 124.11194', Drawing: ContentDrawing },
  bonneIdee: { viewBox: '0 0 91.887688 145.64078', Drawing: BonneIdeeDrawing },
  cestParti: { viewBox: '0 0 134.46216 104.38607', Drawing: CestPartiDrawing },
  onYVa: { viewBox: '0 0 86.227837 80.589371', Drawing: OnYVaDrawing },
  // [AI:Claude] 2026-09-19 — viewBox recadree (185 au lieu de 255.66) : le
  // dessin (confettis compris) n'occupe que la partie gauche du canevas
  // d'origine, le reste etait du vide qui poussait le texte a cote de Flow
  // trop loin. Uniquement la fenetre d'affichage est changee, aucune
  // coordonnee de tracé n'est touchee.
  heureux: { viewBox: '0 0 185 154.20445', Drawing: HeureuxDrawing },
  // Le SVG source utilisait la taille de page par defaut d'Inkscape (A4, 210x297)
  // au lieu d'etre redimensionne au contenu comme les autres poses -> gros vide autour
  // du dessin. On recadre juste la fenetre d'affichage (viewBox), aucune coordonnee
  // de tracé n'est modifiee.
  interrogatif: { viewBox: '35 28 140 164', Drawing: InterrogatifDrawing },
  avecPatron: { viewBox: '0 0 134.53575 110.64883', Drawing: AvecPatronDrawing },
  surpris: { viewBox: '0 0 167.14127 150.657', Drawing: SurprisDrawing },
  quiReflechit: { viewBox: '0 0 156.07249 152.82013', Drawing: QuiReflechitDrawing },
  // Pas de dessin dedie pour "bravo" pour l'instant : reprend "content" en attendant
  bravo: { viewBox: '0 0 151.4964 124.11194', Drawing: ContentDrawing },
}

/**
 * Mascotte YarnFlow "Flow" — chaque pose est calquee sur un dessin de
 * reference vectorise a la main dans Inkscape par l'utilisatrice.
 * pose: 'content' | 'bonneIdee' | 'cestParti' | 'onYVa' | 'heureux' |
 *       'interrogatif' | 'avecPatron' | 'surpris' | 'quiReflechit'
 *       (pas encore 'bravo' ni 'dodo')
 */
// Animation globale legere (rebond + leger balancement), sans toucher au
// dessin : applique au <g> entier, pas a un membre en particulier.
const BOUNCE_KEYFRAMES = `
@keyframes flow-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-2deg); }
}
`

const FlowMascot = ({ pose = 'content', size = 120, className = '', animate = false }) => {
  const { viewBox, Drawing } = POSES[pose] || POSES.content
  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number)

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size * (vbHeight / vbWidth)}
      className={className}
      role="img"
      aria-label="Flow"
    >
      {animate && <style>{BOUNCE_KEYFRAMES}</style>}
      <g style={animate ? { animation: 'flow-bounce 1.6s ease-in-out infinite', transformOrigin: '50% 100%' } : undefined}>
        <Drawing />
      </g>
    </svg>
  )
}

export default FlowMascot
