// Générateur de pages SEO statiques — 8 styles × 12 villes = 96 pages
const fs = require('fs');
const path = require('path');

// Partials partagés (header, footer)
const HEADER_HTML = fs.readFileSync(path.join(__dirname, 'partials/header.html'), 'utf-8');
const FOOTER_HTML = fs.readFileSync(path.join(__dirname, 'partials/footer.html'), 'utf-8');

const STYLES = [
  { slug: 'fineline',   label: 'Fineline',    airtable: 'Fineline' },
  { slug: 'blackwork',  label: 'Blackwork',   airtable: 'Blackwork' },
  { slug: 'realisme',    label: 'Réalisme',    airtable: 'Réalisme' },
  { slug: 'japonais',   label: 'Japonais',    airtable: 'Japonais' },
  { slug: 'geometrique',label: 'Géométrique', airtable: 'Géométrique' },
  { slug: 'tribal',     label: 'Tribal',      airtable: 'Tribal' },
  { slug: 'old-school', label: 'Old School',  airtable: 'Old School' },
  { slug: 'aquarelle',  label: 'Aquarelle',   airtable: 'Aquarelle' },
  { slug: 'dotwork',    label: 'Dotwork',     airtable: 'Dotwork' },
  { slug: 'lettering',  label: 'Lettering',   airtable: 'Lettering' },
];

const CITIES = [
  { slug: 'paris',       label: 'Paris',        region: 'Île-de-France' },
  { slug: 'lyon',        label: 'Lyon',         region: 'Auvergne-Rhône-Alpes' },
  { slug: 'bordeaux',    label: 'Bordeaux',     region: 'Nouvelle-Aquitaine' },
  { slug: 'marseille',   label: 'Marseille',    region: "Provence-Alpes-Côte d'Azur" },
  { slug: 'toulouse',    label: 'Toulouse',     region: 'Occitanie' },
  { slug: 'nantes',      label: 'Nantes',       region: 'Pays de la Loire' },
  { slug: 'montpellier', label: 'Montpellier',  region: 'Occitanie' },
  { slug: 'lille',       label: 'Lille',        region: 'Hauts-de-France' },
  { slug: 'strasbourg',  label: 'Strasbourg',   region: 'Grand Est' },
  { slug: 'rennes',      label: 'Rennes',       region: 'Bretagne' },
  { slug: 'nice',        label: 'Nice',         region: "Provence-Alpes-Côte d'Azur" },
  { slug: 'grenoble',    label: 'Grenoble',     region: 'Auvergne-Rhône-Alpes' },
];

// Descriptions de style (ouverture + caractéristiques)
const STYLE_INTRO = {
  'fineline': {
    desc1: `Le tatouage fineline se distingue par la finesse extrême de ses traits, réalisés à l'aiguille single needle (1RL) ou 3RL. Ce style donne des compositions délicates, presque graphiques, qui se lisent comme des illustrations posées sur la peau.`,
    desc2: `Apparu sur la côte ouest américaine dans les années 70-80 et popularisé mondialement via Instagram à partir des années 2010, le fineline regroupe aujourd'hui plusieurs familles : botanique, micro-réalisme, lettering fin et géométrique fin. Sa réussite dépend surtout de la maîtrise technique de la profondeur d'aiguille par le tatoueur.`,
    keywords: 'botanique, micro-réalisme, lettering, single needle, minimaliste',
    metaKw: 'botanique, micro-réalisme, lettering fin, single needle',
  },
  'blackwork': {
    desc1: `Le blackwork repose entièrement sur l'encre noire : aplats massifs, contrastes francs, contours assumés. C'est un style à fort impact visuel qui couvre aussi bien les pièces graphiques contemporaines que les motifs inspirés des traditions tribales et ornementales.`,
    desc2: `Le blackwork rassemble plusieurs courants : le dotwork (dégradés en points), l'ornemental (motifs symétriques denses), le blackout (zones entièrement noires) et le blackwork illustratif (gravures, animaux, scènes narratives). C'est l'un des styles qui vieillit le mieux grâce à la densité de l'encre.`,
    keywords: 'noir, dotwork, ornemental, blackout, contraste fort',
    metaKw: 'aplats noirs, dotwork, ornemental, blackout',
  },
  'realisme': {
    desc1: `Le tatouage réaliste reproduit avec une précision photographique les sujets les plus complexes — portraits, animaux, scènes de vie — grâce à des jeux d'ombres et de lumières parfaitement maîtrisés.`,
    desc2: `Ce style exige une technique impeccable : chaque dégradé, chaque reflet et chaque texture doit être rendu fidèlement sur la peau. Les meilleurs tatoueurs réalistes travaillent aussi bien en noir et gris qu'en couleur, adaptant leur palette à chaque projet.`,
    keywords: 'portraits, animaux, scènes de vie, noir & gris, couleur',
    metaKw: 'portraits photographiques, noir et gris, hyper-réalisme',
  },
  'japonais': {
    desc1: `Le style japonais puise dans une tradition séculaire : dragons, carpes koï, geishas et fleurs de cerisier composent des œuvres monumentales aux couleurs intenses et aux contours affirmés, souvent organisées autour du corps en sleeve ou en back-piece.`,
    desc2: `Hérité des maîtres irezumi du Japon, ce style impose des règles de composition précises, une maîtrise parfaite du remplissage et un sens narratif fort. Chaque élément est porteur d'un symbolisme riche que les artistes les plus talentueux savent honorer.`,
    keywords: 'dragons, carpes koï, fleurs de cerisier, sleeve, irezumi',
    metaKw: 'dragons, carpes koï, geishas, sleeve japonais',
  },
  'geometrique': {
    desc1: `Le tatouage géométrique transforme le corps en espace graphique, jouant avec les formes, les symétries et les proportions pour créer des compositions d'une précision mathématique absolue.`,
    desc2: `Des mandales aux polyèdres, des fractales aux lignes épurées, ce style demande une rigueur technique et un sens aigu de la géométrie. Il peut être minimaliste ou d'une complexité vertigineuse, souvent rehaussé de dotwork ou de fins aplats noirs.`,
    keywords: 'mandalas, polyèdres, fractales, symétries, lignes épurées',
    metaKw: 'mandalas, fractales, formes géométriques, symétrie',
  },
  'tribal': {
    desc1: `Le style tribal s'inspire des traditions ancestrales polynésiennes, maories, aztèques et berbères : motifs en aplats noirs, lignes épaisses et symboles chargés d'un sens culturel et spirituel profond.`,
    desc2: `Loin d'être un simple décor, le tatouage tribal raconte une histoire, marque une appartenance ou célèbre un rite de passage. Les artistes spécialisés maîtrisent les codes de chaque tradition et peuvent créer des pièces authentiques ou des interprétations contemporaines de ces motifs ancestraux.`,
    keywords: 'polynésien, maori, aztèque, aplats noirs, motifs ancestraux',
    metaKw: 'polynésien, maori, motifs tribaux, aplats noirs',
  },
  'old-school': {
    desc1: `L'Old School, ou tatouage traditionnel américain, se reconnaît à ses contours gras, ses couleurs vives et saturées, et ses sujets iconiques — ancres marines, roses épanouies, aigles et cœurs enflammés hérités des marins du début du XXe siècle.`,
    desc2: `Ce style intemporel connaît un regain de popularité grâce à son caractère affirmé et sa résistance dans le temps. Les tatoueurs Old School maîtrisent une palette réduite mais percutante, et savent donner à chaque pièce une lisibilité et une force visuelle immédiate.`,
    keywords: 'ancres, roses, aigles, contours gras, couleurs vives',
    metaKw: 'traditionnel américain, ancres, roses, contours gras',
  },
  'aquarelle': {
    desc1: `Le tatouage aquarelle reproduit l'effet fluide et transparent de la peinture à l'eau : éclaboussures de couleur, dégradés subtils et absence de contours nets créent des œuvres d'une délicatesse picturale unique.`,
    desc2: `Ce style, apparu dans les années 2010, demande une grande maîtrise de la couleur et une technique spécifique pour maintenir la lisibilité dans le temps. Les meilleurs artistes aquarelle savent doser pigments et espaces vides pour créer des compositions à la fois légères et expressives.`,
    keywords: 'couleurs vives, dégradés, éclaboussures, effet peinture',
    metaKw: 'effet peinture, dégradés, couleurs, style aquarelle',
  },
  'dotwork': {
    desc1: `Le dotwork construit chaque image à partir de milliers de points soigneusement placés, créant des dégradés, des textures et des patterns géométriques ou organiques d'une profondeur et d'une précision hypnotiques.`,
    desc2: `Ce style, souvent associé au noir pur ou aux encres grises, exige une patience et une régularité exemplaires. Il se prête aussi bien aux mandalas et motifs sacrés qu'aux portraits ou aux compositions abstraites. Les artistes dotwork développent un style reconnaissable immédiatement à la qualité de leur pointillé.`,
    keywords: 'pointillisme, mandalas, géométrie sacrée, noir et gris',
    metaKw: 'pointillisme, mandalas, géométrie, noir et gris',
  },
  'lettering': {
    desc1: `Le lettering transforme les mots en œuvres d'art : typographies calligraphiques, scripts fluides, lettres gothiques ou imprimées composent des phrases, des citations ou des prénoms destinés à s'inscrire pour toujours sur la peau.`,
    desc2: `Un bon tatoueur lettering maîtrise les règles de la typographie, la gestion des espacements et les particularités de la peau comme support. Du lettering fin et discret au script monumental qui couvre un bras entier, chaque artiste développe une signature visuelle et une technique propre.`,
    keywords: 'calligraphie, script, typographie, citations, prénoms',
    metaKw: 'calligraphie, script, typographie, citations',
  },
};

// Contexte par ville
const CITY_CONTEXT = {
  'paris': {
    ctx: `Paris concentre la plus grande scène tattoo de France, avec des centaines de studios répartis dans tous les arrondissements. Du 11e au 18e en passant par le Marais, les artistes parisiens sont exposés à une clientèle internationale exigeante qui élève en permanence le niveau artistique. La capitale accueille chaque année plusieurs conventions tattoo majeures et attire des artistes du monde entier.`,
  },
  'lyon': {
    ctx: `Lyon développe une scène tattoo reconnue à l'échelle nationale. Les studios se concentrent dans les quartiers créatifs de la Croix-Rousse, de la Guillotière et du centre-ville, animés par une communauté d'artistes locaux passionnés. La ville, carrefour entre le nord et le sud de la France, attire une clientèle variée et des artistes aux influences multiples.`,
  },
  'bordeaux': {
    ctx: `Bordeaux vit une effervescence créative qui touche aussi le monde du tatouage. Les studios du centre-ville, de Saint-Pierre et du quartier des Chartrons accueillent des artistes aux profils variés, souvent attirés par la qualité de vie bordelaise. La scène tattoo locale est jeune, dynamique et de plus en plus reconnue sur la scène nationale.`,
  },
  'marseille': {
    ctx: `Marseille développe une scène tattoo unique, portée par le cosmopolitisme et l'énergie méditerranéenne de la ville. Les studios du Cours Julien, de la Plaine et du centre-ville côtoient des artistes aux influences mêlées — nord-africaines, italiennes, orientales — qui donnent à la scène marseillaise un caractère singulier et bouillonnant.`,
  },
  'toulouse': {
    ctx: `La ville rose concentre ses studios dans le centre historique et les quartiers Saint-Cyprien et Carmes, animés par une vie culturelle intense. La scène tattoo toulousaine profite de l'dynamisme universitaire et créatif de la ville, avec des artistes souvent passés par les écoles des Beaux-Arts et développant des univers très personnels.`,
  },
  'nantes': {
    ctx: `Nantes, ville d'art et de culture réputée pour son imagination débordante, accueille une scène tattoo à son image : inventive, exigeante et ouverte sur le monde. Les studios des quartiers Bouffay, Talensac et Zola proposent des univers artistiques variés, dans une ville qui sait attirer et retenir les créatifs de toute la France.`,
  },
  'montpellier': {
    ctx: `Montpellier, ville étudiante et cosmopolite du Languedoc, développe une scène tattoo jeune et créative. Avec sa population universitaire importante et son rayonnement méditerranéen, la ville attire des artistes aux influences mêlant tradition du Sud et modernité graphique. Les studios du centre-ville et d'Antigone proposent des artistes talentueux au rapport qualité-prix souvent attractif.`,
  },
  'lille': {
    ctx: `Capitale des Hauts-de-France, Lille développe une scène tattoo solide et en pleine croissance. Le Vieux-Lille, le quartier de Wazemmes et l'Euralille concentrent des studios aux univers artistiques distincts. La ville, porte d'entrée vers la Belgique et l'Europe du Nord, bénéficie d'influences croisées qui enrichissent et diversifient la scène locale.`,
  },
  'strasbourg': {
    ctx: `Strasbourg, ville frontalière entre France et Allemagne, développe une scène tattoo originale aux influences croisées. Les artistes strasbourgeois mêlent rigueur germanique et sensibilité française dans des univers souvent très travaillés. La Petite France, la Krutenau et Neudorf accueillent des studios qui font rayonner la scène alsacienne bien au-delà des frontières régionales.`,
  },
  'rennes': {
    ctx: `Rennes, capitale bretonne et grande ville universitaire, anime une scène tattoo vivante et engagée. Les artistes rennais, souvent issus de la scène artistique locale très active, développent des univers singuliers nourris par la culture bretonne et une ouverture sur les tendances internationales. Les studios du centre et du quartier colombier accueillent une clientèle jeune et curieuse.`,
  },
  'nice': {
    ctx: `Nice, capitale de la Côte d'Azur, bénéficie d'un environnement unique qui influence la scène tattoo locale. La lumière méditerranéenne, le cosmopolitisme azuréen et l'attrait touristique de la ville attirent des artistes aux parcours internationaux. Les studios du Vieux-Nice et des collines niçoises proposent des œuvres souvent influencées par la vivacité des couleurs du Sud.`,
  },
  'grenoble': {
    ctx: `Grenoble, entourée de ses massifs alpins et réputée pour sa scène scientifique et artistique, développe une communauté tattoo engagée et innovante. Les artistes grenoblois, souvent formés aux Beaux-Arts ou autodidactes passionnés, proposent des univers graphiques travaillés dans une ville où la culture de la création est profondément ancrée.`,
  },
};

// FAQ par style (questions fréquentes pour le SEO)
const STYLE_FAQ = {
  'fineline': [
    { q: `Combien coûte un tatouage fineline ?`, a: `Compte un minimum de 100 à 150 € pour une petite pièce (3-4 cm²), puis 120 à 200 € de l'heure selon l'artiste. Les artistes les plus demandés peuvent atteindre 250 à 300 € de l'heure dans les grandes villes.` },
    { q: `Le fineline vieillit-il mal ?`, a: `Non, pas si la profondeur d'aiguille est correctement gérée par le tatoueur. C'est le critère technique le plus important : trop superficiel, le trait s'efface en 2-3 ans ; trop profond, il bave et s'épaissit. Un bon fineline pratiqué dans les règles vieillit aussi bien qu'un tatouage classique.` },
    { q: `Combien de séances pour un projet fineline ?`, a: `La majorité des projets se font en une seule séance de 1 à 3 heures. Au-delà de 10-15 cm avec beaucoup de détails, prévois 2 séances espacées d'au moins 3 semaines, le temps que la première cicatrise.` },
    { q: `Quelle taille minimum pour un fineline ?`, a: `En dessous de 3 cm, le trait risque de fusionner en cicatrisant et le motif devient flou. Pour du lettering ou un micro-réalisme, demande à l'artiste un test à l'échelle réelle avant de valider.` },
    { q: `Comment préparer ma séance de tatouage fineline ?`, a: `Bonne nuit de sommeil, manger 1h avant, pas d'alcool ni d'anti-inflammatoires 24h avant car cela fluidifie le sang. Hydrate ta peau les jours précédents. Pas de bronzage la semaine d'avant.` },
    { q: `Vaut-il mieux un studio ou un freelance pour un premier fineline ?`, a: `Aucune différence de qualité par défaut. Le studio offre un cadre rassurant avec hygiène encadrée et plusieurs avis sur place. Le freelance offre souvent une relation plus directe et des créneaux plus souples. Le seul critère qui compte vraiment, c'est le portfolio.` },
  ],
  'blackwork': [
    { q: `Combien coûte un tatouage blackwork ?`, a: `Compte entre 100 et 180 € de l'heure selon l'artiste. Les pièces ornementales et le dotwork demandent souvent plus de temps que les aplats simples, donc prévois 3 à 10 heures pour une pièce d'avant-bras complète.` },
    { q: `Le blackwork vieillit-il bien ?`, a: `C'est l'un des styles qui vieillit le mieux. La densité d'encre noire reste lisible des décennies même en cas de léger affaissement. Pour les aplats massifs, prévois une retouche après 5-7 ans si tu veux garder un noir profond.` },
    { q: `Le blackwork fait-il plus mal qu'un autre style ?`, a: `Les longs aplats noirs sont plus éprouvants que les traits fins parce que le tatoueur repasse sur la même zone pour saturer la peau. La douleur reste comparable mais sur une durée plus longue. Hydratation et coupe-faim avant la séance aident.` },
    { q: `Peut-on couvrir un ancien tatouage avec un blackwork ?`, a: `Oui, c'est l'un des usages classiques du blackwork (notamment blackout) : la densité d'encre noire couvre la plupart des tatouages existants. Un tatoueur spécialisé en cover-up te dira si ton ancien tatouage est compatible.` },
    { q: `Combien de séances pour un projet blackwork ?`, a: `Une petite pièce se fait en 1 séance. Un avant-bras ornemental complet demande 2 à 3 séances. Un sleeve blackout peut prendre 4 à 6 séances espacées de 3-4 semaines pour laisser la peau cicatriser entre les passes.` },
    { q: `Comment entretenir un tatouage blackwork ?`, a: `Crème cicatrisante 2-3 fois par jour pendant 2 semaines, pas d'exposition solaire ni de baignade pendant 1 mois, puis crème solaire SPF 50 à vie pour préserver la densité du noir. Le noir résiste mieux que la couleur mais l'UV reste son ennemi.` },
  ],
  'realisme': [
    { q: `Combien coûte un tatouage réaliste ?`, a: `Un tatouage réaliste demande un travail minutieux. Comptez entre 150 € et 400 € de l'heure selon l'artiste. Une pièce de taille moyenne (bras) prend généralement 2 à 5 séances.` },
    { q: `Combien de temps dure une séance de tatouage réaliste ?`, a: `Une séance dure en moyenne 3 à 5 heures. Les pièces complexes comme les portraits ou les scènes complètes peuvent nécessiter plusieurs séances espacées de 3 à 4 semaines.` },
    { q: `Le tatouage réaliste vieillit-il bien ?`, a: `Oui, à condition de choisir un artiste expérimenté qui utilise les bonnes techniques de dégradé et de contraste. Un bon réaliste anticipe le vieillissement de l'encre et adapte sa technique en conséquence.` },
  ],
  'japonais': [
    { q: `Combien coûte un tatouage japonais ?`, a: `Le tatouage japonais est souvent un projet ambitieux. Comptez entre 150 € et 350 € de l'heure. Un sleeve complet peut représenter 15 à 30 heures de travail, soit plusieurs milliers d'euros.` },
    { q: `Quelle est la signification des motifs japonais ?`, a: `Chaque élément a un symbolisme fort : le dragon représente la force et la sagesse, la carpe koï incarne la persévérance, les fleurs de cerisier évoquent l'éphémère de la vie, et le tigre symbolise le courage.` },
    { q: `Faut-il faire un sleeve complet en japonais ?`, a: `Non, le style japonais s'adapte à toutes les tailles. Vous pouvez commencer par une pièce isolée (carpe, masque, fleur) et l'étendre progressivement si vous le souhaitez.` },
  ],
  'geometrique': [
    { q: `Le tatouage géométrique fait-il plus mal ?`, a: `La douleur dépend de l'emplacement, pas du style. Cependant, les lignes droites et les formes géométriques demandent de rester immobile, ce qui peut rendre les longues séances plus éprouvantes.` },
    { q: `Combien coûte un tatouage géométrique ?`, a: `Comptez entre 100 € et 300 € de l'heure selon la complexité. Les pièces simples (triangle, cercle) sont rapides, tandis que les mandalas ou compositions complexes demandent plusieurs heures.` },
    { q: `Le tatouage géométrique vieillit-il bien ?`, a: `Les lignes fines et les formes précises peuvent s'estomper légèrement avec le temps. Choisissez un artiste expérimenté qui adapte l'épaisseur des traits pour garantir la longévité du tatouage.` },
  ],
  'tribal': [
    { q: `Quelle est la signification du tatouage tribal ?`, a: `Le tribal trouve ses origines dans les traditions polynésiennes, maories et aztèques. Chaque motif porte un sens : la force, la protection, l'appartenance à un groupe, ou le passage à l'âge adulte.` },
    { q: `Combien coûte un tatouage tribal ?`, a: `Le tribal est souvent en aplats noirs, ce qui accélère l'exécution. Comptez entre 100 € et 250 € de l'heure. Une pièce bras ou épaule prend généralement 2 à 4 heures.` },
    { q: `Peut-on moderniser un tatouage tribal ?`, a: `Oui, beaucoup d'artistes proposent des versions contemporaines du tribal, mêlant motifs traditionnels et lignes graphiques modernes pour un rendu plus actuel.` },
  ],
  'old-school': [
    { q: `Combien coûte un tatouage old school ?`, a: `L'old school utilise des couleurs vives et des contours épais. Comptez entre 100 € et 250 € de l'heure. Les pièces classiques (ancre, rose, aigle) prennent 1 à 3 heures.` },
    { q: `Le tatouage old school vieillit-il bien ?`, a: `C'est l'un des styles qui vieillit le mieux grâce à ses contours épais et ses couleurs saturées. Les lignes restent nettes et les couleurs gardent leur éclat pendant des décennies.` },
    { q: `Peut-on personnaliser un tatouage old school ?`, a: `Absolument. Les meilleurs artistes old school savent réinterpréter les motifs classiques avec votre touche personnelle, tout en respectant les codes du style (contours gras, palette vive).` },
  ],
  'aquarelle': [
    { q: `Le tatouage aquarelle dure-t-il dans le temps ?`, a: `Le tatouage aquarelle peut s'estomper plus vite que les styles à contours épais. Choisissez un artiste expérimenté qui sait doser les pigments et ajoutez des retouches si nécessaire après quelques années.` },
    { q: `Combien coûte un tatouage aquarelle ?`, a: `Comptez entre 150 € et 350 € de l'heure. La technique aquarelle demande une grande maîtrise de la couleur et des dégradés, ce qui justifie un tarif souvent plus élevé.` },
    { q: `Peut-on combiner aquarelle et fineline ?`, a: `Oui, c'est même une combinaison très populaire. Les traits fins du fineline structurent le design tandis que les touches aquarelle apportent couleur et mouvement.` },
  ],
  'dotwork': [
    { q: `Combien coûte un tatouage dotwork ?`, a: `Le dotwork est un travail de patience. Comptez entre 100 € et 300 € de l'heure. Les mandalas et compositions géométriques complexes peuvent prendre 4 à 8 heures.` },
    { q: `Le tatouage dotwork fait-il plus mal ?`, a: `Le dotwork utilise des points répétés, ce qui peut créer une sensation différente du trait continu. La douleur reste comparable aux autres styles et dépend surtout de la zone tatouée.` },
    { q: `Quelle est la différence entre dotwork et handpoke ?`, a: `Le dotwork désigne le style visuel (motifs en points), tandis que le handpoke est une technique (tatouage sans machine, point par point). On peut faire du dotwork à la machine comme en handpoke.` },
  ],
  'lettering': [
    { q: `Comment choisir la typographie de son tatouage lettering ?`, a: `Votre tatoueur lettering vous proposera plusieurs typographies adaptées à votre texte et à l'emplacement choisi. Script, gothique, minimaliste — chaque police a son caractère et sa lisibilité.` },
    { q: `Combien coûte un tatouage lettering ?`, a: `Le lettering est souvent plus rapide que les autres styles. Comptez entre 80 € et 200 € pour une phrase courte. Les compositions complexes (full arm, chest) coûtent davantage.` },
    { q: `Le tatouage lettering vieillit-il bien ?`, a: `Les lettres fines peuvent s'épaissir légèrement avec le temps. Un bon artiste lettering anticipe ce phénomène en adaptant la taille et l'espacement des lettres.` },
  ],
};

// Contenu local unique : combos style × ville indexés (pour SEO)
// Inséré au-dessus du guide générique. Différencie chaque page Google
// au lieu d'avoir 10 pages template-identiques.
const STYLE_CITY_INSIGHT = {
  'fineline': {
    'paris': {
      where: `Paris est la première scène fineline française, portée par une demande qui a explosé depuis 2020. Le style s'est diffusé mondialement via Instagram dans les années 2010, à partir des techniques single needle développées sur la côte ouest américaine dans les années 70-80.`,
      zones: [
        { name: 'Le 11e arrondissement', desc: `Bastille, Oberkampf, République côté sud. C'est ce qu'on appelle "le tattoo district" parisien, avec la plus forte densité de studios fineline en France, du studio confidentiel à l'atelier collectif.` },
        { name: 'Le Marais (3e et 4e)', desc: `Concentration d'artistes installés, clientèle internationale, délais d'attente longs : souvent 4 à 6 mois chez les plus demandés.` },
        { name: 'Le Canal Saint-Martin (10e)', desc: `La scène plus jeune, studios récents, créneaux plus accessibles pour un premier projet.` },
        { name: 'Pigalle et 18e', desc: `Historiquement old school, mais une nouvelle génération de fineliners s'y est installée depuis 2020.` },
      ],
      price: `Entre <strong>120 € et 200 € de l'heure</strong> pour un fineline parisien, avec un minimum tarifaire autour de <strong>100 à 150 €</strong> pour les très petites pièces (3-4 cm²). Les artistes les plus demandés peuvent atteindre 250 à 300 € de l'heure. Délais d'attente : 2 semaines chez les studios récents, 6 à 8 mois chez les artistes les plus reconnus.`,
      tip: `La qualité d'un fineline ne se juge pas à chaud. Demande toujours à voir des photos <strong>cicatrisées 3 mois après la séance</strong>. Un trait trop fin mal posé s'estompe ou s'épaissit avec le temps, même chez un artiste au feed Instagram impeccable.`,
    },
    'lyon': {
      where: `La scène fineline lyonnaise s'est développée plus tardivement qu'à Paris mais avec une exigence technique remarquable. La Croix-Rousse concentre les studios spécialisés, suivie par la Guillotière et le centre presqu'île. Les artistes lyonnais sont souvent issus de l'illustration ou de la peinture, ce qui donne à la scène un caractère graphique très assumé.`,
      price: `Entre <strong>100 € et 150 € de l'heure</strong> chez nos artistes vérifiés, avec un minimum tarifaire autour de 80 à 100 € pour les très petites pièces. Les tarifs lyonnais restent en moyenne 15 à 20 % inférieurs à Paris pour une qualité technique équivalente.`,
      tip: `Le tissu de studios à Lyon est plus petit qu'à Paris : les bons artistes fineline sont vite saturés. Anticipe ta prise de rendez-vous de 2 à 4 mois minimum. Demande aussi des photos cicatrisées d'au moins 6 mois : le fineline ne révèle sa vraie qualité qu'après cicatrisation complète.`,
    },
  },
  'blackwork': {
    'paris': {
      where: `Le blackwork parisien est l'un des styles les plus diversifiés de la capitale : ornemental dense dans le Marais, dotwork à République, blackout dans le 11e, illustratif gravure à Pigalle. C'est aussi le style le plus représenté côté tatoueurs hommes, avec une scène qui s'inspire largement des courants nord-européens (Berlin, Copenhague, Stockholm).`,
      zones: [
        { name: 'Le Marais (3e, 4e)', desc: `Spécialisé ornemental et illustratif. Des artistes installés depuis 10-15 ans, clientèle internationale, projets souvent ambitieux (sleeves, dos complets).` },
        { name: 'Bastille et 11e', desc: `Le hub des projets blackout et grandes surfaces noires. C'est ici que se trouvent les artistes les plus radicaux côté esthétique.` },
        { name: 'République et Canal (10e)', desc: `Concentration de dotwork et blackwork géométrique. Studios collectifs, ambiance plus contemporaine, créneaux parfois plus accessibles.` },
        { name: 'Pigalle (9e, 18e)', desc: `Influence old school mêlée au blackwork illustratif type gravure. Gravures sur bois, animaux stylisés, scènes narratives.` },
      ],
      price: `Entre <strong>120 € et 180 € de l'heure</strong> pour un blackwork parisien. Les pièces ornementales et dotwork (très chronophages) peuvent grimper à 200 €/h chez les spécialistes reconnus. Les minimums démarrent autour de 100 € pour une petite pièce, mais la majorité des projets blackwork sont moyens à grands (3-10 heures).`,
      tip: `Zoome sur les photos des aplats noirs : ils doivent être uniformément saturés, sans zones plus claires ni "trous" dans le remplissage. C'est le signe d'un tatoueur qui maîtrise la profondeur d'aiguille sur les zones denses. Pour un cover-up, demande des exemples concrets avec le "avant".`,
    },
  },
  'aquarelle': {
    'paris': {
      where: `Paris ne concentre pas l'aquarelle dans un quartier précis : les artistes spécialisés sont disséminés entre Belleville (20e), Oberkampf (11e) et le Marais. C'est un style de niche en France, choisi par des tatoueurs venus de l'illustration ou de la peinture, qui assument une palette colorée à contre-courant du tout-noir parisien.`,
      price: `Entre <strong>120 € et 180 € de l'heure</strong> chez nos artistes vérifiés, avec un minimum tarifaire autour de 100 € pour une petite pièce. La fourchette haute reflète la difficulté technique : les pigments dilués demandent une maîtrise précise de la profondeur d'aiguille.`,
      tip: `L'aquarelle est le style qui vieillit le moins bien si l'artiste n'est pas expérimenté. Demande à voir des photos <strong>cicatrisées 1 an minimum</strong> pour vérifier comment les pigments tiennent dans le temps. Méfie-toi des designs trop "watercolor splash" sans contour de structure : ils s'estompent vite.`,
    },
  },
  'geometrique': {
    'paris': {
      where: `Le géométrique parisien s'est concentré autour du Marais et d'Oberkampf, dans des studios qui assument une approche graphique et architecturale du tatouage. Mandalas, dotwork géométrique, patterns sacrés : Paris a importé tôt cette esthétique venue de Londres et Berlin, et la scène est aujourd'hui mature.`,
      price: `Entre <strong>100 € et 180 € de l'heure</strong> chez nos artistes vérifiés. Les pièces simples (triangles, cercles, motifs minimalistes) partent de 100 € fixe ; les mandalas ou compositions complexes peuvent demander 8 à 15 heures de travail.`,
      tip: `Le géométrique ne pardonne aucune approximation. <strong>Zoome sur les photos du portfolio</strong> : les lignes droites doivent être parfaitement parallèles, les symétries impeccables, l'espacement des points régulier. C'est le seul style où la qualité technique se voit immédiatement, même sur Instagram.`,
    },
  },
  'japonais': {
    'paris': {
      where: `Les studios spécialisés en japonais traditionnel à Paris se concentrent autour de Pigalle, Bastille et République, dans des espaces conçus pour les longues séances. C'est un style historiquement implanté dans la capitale, avec une scène qui respecte les codes irezumi : sens des vagues, équilibre des éléments, symbolique des motifs.`,
      price: `Entre <strong>130 € et 180 € de l'heure</strong> chez nos artistes vérifiés. Mais le bon repère, c'est le <strong>projet total</strong> : un sleeve japonais demande 15 à 25 heures, soit 2 500 à 4 500 € ; un dos complet peut atteindre 50 heures et 8 000 €+.`,
      tip: `Choisis un artiste qui maîtrise la <strong>composition traditionnelle</strong>, pas juste le dessin de carpe ou de dragon isolé. Demande-lui d'expliquer la symbolique de tes motifs et leur disposition : un vrai japonisant te parlera du sens des vagues, de la position des fleurs de cerisier, de la hiérarchie visuelle. Si tu n'entends pas ça, change.`,
    },
  },
  'lettering': {
    'paris': {
      where: `Le lettering parisien est porté par une vague script et calligraphie qui a explosé depuis 2020. Les studios spécialisés se trouvent surtout dans le Marais et autour de Pigalle, où les artistes mêlent influences chicano, gothique allemand et typographie contemporaine. Phrase courte, prénom, citation longue : Paris couvre tous les registres.`,
      price: `À partir de <strong>80 € pour une phrase courte</strong> (forfait), et entre <strong>120 € et 150 € de l'heure</strong> chez nos artistes vérifiés pour les compositions plus longues (full arm, dos, citations en plusieurs lignes). Le lettering est l'un des styles les plus rapides à exécuter, ce qui le rend accessible.`,
      tip: `Demande toujours une <strong>maquette validée avant la séance</strong>, à l'échelle réelle, sur papier ou en projection sur la peau. Le lettering ne se rattrape pas : une lettre mal espacée ou trop fine restera ainsi à vie. Teste plusieurs polices avec ton artiste avant de fixer le choix.`,
    },
  },
  'realisme': {
    'paris': {
      where: `Le réalisme premium parisien se concentre dans des studios privés du Marais, de Bastille et du 11e, souvent sur rendez-vous uniquement. Portraits, animaux hyper-réalistes, scènes photographiques : Paris attire des artistes formés aux Beaux-Arts ou venus de l'illustration, capables de reproduire des images avec une précision photographique.`,
      price: `Entre <strong>130 € et 200 € de l'heure</strong> chez nos artistes vérifiés. Un portrait de format A4 demande typiquement 5 à 8 heures, soit 800 à 1 600 €. Les pièces couleur ou les hyper-réalismes complexes peuvent dépasser 200 € de l'heure chez les artistes les plus reconnus.`,
      tip: `Le réalisme se juge <strong>après cicatrisation</strong>, pas frais. Demande à voir des photos prises 6 mois après la séance, voire 1-2 ans : c'est là que tu vois si l'artiste maîtrise les contrastes, les dégradés, et anticipe la fonte légère des pigments dans la peau. Un beau portrait à J+0 ne dit rien.`,
    },
  },
};

function buildLocalInsight(style, city) {
  const insight = STYLE_CITY_INSIGHT[style.slug]?.[city.slug];
  if (!insight) return '';
  const zonesHtml = insight.zones && insight.zones.length
    ? `<p style="color:#222;font-size:1rem;line-height:1.85;margin-bottom:32px;">Concrètement, la scène locale se découpe en ${insight.zones.length} zones :</p>` +
      insight.zones.map(z => `
  <div style="margin-bottom:24px;">
    <p style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--accent);text-transform:uppercase;letter-spacing:2.5px;margin-bottom:8px;">${z.name}</p>
    <p style="color:#222;font-size:1rem;line-height:1.75;margin-bottom:0;">${z.desc}</p>
  </div>`).join('')
    : '';
  return `
<!-- LOCAL INSIGHT (contenu unique style × ville) -->
<section style="max-width:780px;margin:64px auto;padding:0 56px;">
  <h2 style="font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;text-transform:uppercase;letter-spacing:-0.5px;margin-bottom:32px;line-height:1.2;color:var(--text);">${style.label} à ${city.label} : où et comment</h2>
  <p style="color:#222;font-size:1rem;line-height:1.85;margin-bottom:${zonesHtml ? '28px' : '40px'};">${insight.where}</p>
  ${zonesHtml}
  <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:32px;margin-bottom:32px;">
    <p style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--accent);text-transform:uppercase;letter-spacing:2.5px;margin-bottom:12px;">Fourchette de prix observée</p>
    <p style="color:#222;font-size:1rem;line-height:1.85;margin-bottom:0;">${insight.price}</p>
  </div>
  <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:32px;">
    <p style="font-family:'Space Mono',monospace;font-size:0.7rem;color:var(--accent);text-transform:uppercase;letter-spacing:2.5px;margin-bottom:12px;">Conseil avant de réserver</p>
    <p style="color:#222;font-size:1rem;line-height:1.85;margin-bottom:0;">${insight.tip}</p>
  </div>
</section>`;
}

// Conseils pour choisir son tatoueur par style
const STYLE_TIPS = {
  'fineline': `Regarde toujours des photos cicatrisées (3 mois minimum, idéalement 1 an). C'est là que se voit la vraie qualité d'un fineline. Vérifie aussi la régularité du trait sur les longues lignes : une variation d'épaisseur trahit un manque de maîtrise de la profondeur d'aiguille. Méfie-toi des artistes qui mélangent fineline, couleur et japonais dans le même feed : pour du fineline, cherche un spécialiste qui ne fait quasiment que ça.`,
  'blackwork': `Le blackwork ne pardonne aucune imprécision : zoome sur les photos pour vérifier l'uniformité des aplats noirs (pas de zones plus claires, pas de "trous" dans le remplissage). Demande à voir des photos cicatrisées de pièces ornementales : c'est là que se voit si l'artiste maîtrise la densité d'encre dans la durée. Pour un cover-up, demande des exemples concrets et la photo "avant" pour juger du résultat.`,
  'realisme': `Demandez à voir des photos cicatrisées, pas seulement fraîches. Le réalisme révèle la vraie qualité de l'artiste une fois la peau guérie. Vérifiez aussi qu'il maîtrise les contrastes et les dégradés sur différentes carnations.`,
  'japonais': `Regardez si l'artiste respecte les règles de composition du japonais traditionnel (sens des vagues, placement des éléments). Un bon tatoueur japonais connaît la symbolique de chaque motif et saura vous conseiller.`,
  'geometrique': `La précision est tout dans le géométrique. Zoomez sur les photos pour vérifier la régularité des lignes et la symétrie. Un bon artiste géométrique travaille avec des gabarits et une rigueur mathématique.`,
  'tribal': `Assurez-vous que l'artiste connaît la tradition derrière les motifs et ne se contente pas de copier des designs. Un bon tatoueur tribal crée des pièces sur mesure qui respectent les codes culturels.`,
  'old-school': `Vérifiez la saturation des couleurs et la netteté des contours sur les photos cicatrisées. Un bon old school, même simple, doit avoir des couleurs vibrantes et des lignes nettes et régulières.`,
  'aquarelle': `Demandez des photos de tatouages cicatrisés depuis plus d'un an. L'aquarelle est un style qui peut évoluer avec le temps, et seul un artiste expérimenté sait doser les pigments pour la longévité.`,
  'dotwork': `Regardez la régularité des points : ils doivent être uniformes en taille et en espacement. Les dégradés doivent être fluides sans zones de points agglutinés. C'est le signe d'un vrai maître du dotwork.`,
  'lettering': `Demandez une maquette de votre texte avant la séance. La lisibilité est cruciale en lettering — testez différentes tailles et polices. Un bon artiste lettering adapte la typographie à la morphologie de la zone tatouée.`,
};

// Sous-styles par style (4 familles à connaître)
const STYLE_SUBSTYLES = {
  'fineline': [
    { name: 'Botanique', desc: `Le plus demandé. Feuilles, fleurs, branches, illustrations type planche d'herbier. Idéal sur avant-bras, omoplate, côtes. Vieillit bien si les traits ne sont pas trop rapprochés.` },
    { name: 'Micro-réalisme', desc: `Portraits, animaux, objets miniatures en moins de 5 cm. La spécialité la plus exigeante techniquement : un trait mal posé et le sujet devient illisible. À réserver aux artistes très expérimentés.` },
    { name: 'Lettering fin', desc: `Citations, prénoms, dates en écriture manuscrite ou typographique. Demande un calibrage parfait : trop fin, ça disparaît à 6 mois ; trop épais, ça perd le caractère fineline.` },
    { name: 'Géométrique fin', desc: `Mandalas, formes pures, motifs sacrés. Souvent combiné avec du dotwork pour les ombrés. Le style le moins pardonnant : la moindre asymétrie se voit immédiatement.` },
  ],
  'blackwork': [
    { name: 'Ornemental', desc: `Motifs symétriques denses, inspiration baroque ou tribale revisitée. Idéal pour les pièces structurées sur avant-bras, mollet, dos. La cohérence géométrique fait toute la qualité.` },
    { name: 'Dotwork', desc: `Construction par points pour les dégradés. Demande une patience et une régularité énormes. Souvent combiné avec de l'ornemental pour adoucir les transitions entre aplats noirs et zones claires.` },
    { name: 'Blackout', desc: `Zones entièrement remplies de noir, parfois sur de larges surfaces (manchette complète, demi-cuisse). Utilisé pour des effets graphiques radicaux ou pour couvrir d'anciens tatouages. Cicatrisation plus longue.` },
    { name: 'Illustratif', desc: `Gravures, animaux, scènes narratives au trait noir avec hachures et points. Inspiré des illustrations anciennes type gravure sur bois. Permet beaucoup de finesse tout en restant 100 % noir.` },
  ],
  'realisme': [
    { name: 'Portrait noir & gris', desc: `Le classique du réalisme : visages, animaux, scènes en dégradés de noir. Demande une maîtrise parfaite des contrastes pour rester lisible sur la durée. Idéal en moyenne ou grande taille.` },
    { name: 'Réalisme couleur', desc: `Plus rare et plus exigeant. Reproduit fidèlement des photos en couleur. Risque d'estompage plus rapide sur les pigments rouges et jaunes : à confier à un artiste expérimenté qui anticipe le vieillissement.` },
    { name: 'Hyper-réalisme', desc: `Précision photographique extrême, souvent sur petite ou moyenne pièce. Le travail prend plus de temps qu'un réalisme classique et coûte généralement plus cher. À réserver aux projets très étudiés.` },
    { name: 'Micro-réalisme', desc: `Réalisme sur moins de 5 cm. Croisement avec le fineline. Très difficile techniquement : un cheveu d'erreur et le sujet devient flou. Demande absolument un test à l'échelle avant validation.` },
  ],
  'japonais': [
    { name: 'Irezumi traditionnel', desc: `Le japonais classique : dragons, carpes koï, fleurs de cerisier, vagues, masques Hannya. Compositions très codifiées qui demandent un artiste maîtrisant les règles traditionnelles (sens des vagues, hiérarchie des éléments).` },
    { name: 'Néo-japonais', desc: `Mêle les codes traditionnels et des touches contemporaines (couleurs vives, compositions plus libres, références modernes). Permet de garder l'esthétique japonaise avec une signature personnelle.` },
    { name: 'Sumi-e / tebori', desc: `Inspiré de la peinture à l'encre japonaise. Tracé délicat, beaucoup de vide, esthétique épurée. Le tebori (à la main, sans machine) reste rare en France mais existe.` },
    { name: 'Blackwork japonais', desc: `Compositions japonaises en noir pur, sans couleur. Vieillit très bien grâce à la densité d'encre. Idéal pour les amateurs du style japonais qui préfèrent un rendu graphique plus contemporain.` },
  ],
  'geometrique': [
    { name: 'Mandala', desc: `Le plus demandé. Compositions circulaires symétriques inspirées des traditions indiennes et bouddhistes. Demande une précision mathématique : la moindre asymétrie se voit immédiatement.` },
    { name: 'Sacré géométrique', desc: `Fleur de vie, métatron, motifs ésotériques. Souvent combiné avec dotwork pour les ombrés. Charge symbolique forte, à choisir avec un artiste qui maîtrise la signification des motifs.` },
    { name: 'Linework graphique', desc: `Compositions abstraites en traits fins, formes pures, lignes parallèles. Influence Bauhaus et graphisme contemporain. Permet beaucoup de personnalisation.` },
    { name: 'Géométrique animalier', desc: `Animaux stylisés avec des compositions géométriques (loup mandala, cerf polygonal, etc.). Très populaire car combine pouvoir symbolique de l'animal et précision graphique.` },
  ],
  'tribal': [
    { name: 'Polynésien (Maori, Samoan)', desc: `Le plus codifié des styles tribaux. Chaque motif porte un sens précis lié au statut, au lignage, au parcours de vie. À faire avec un artiste qui connaît la tradition, pas un simple décor.` },
    { name: 'Maori', desc: `Sous-famille du polynésien, originaire de Nouvelle-Zélande. Motifs en spirales (koru), tikis, lézards. Demande une consultation préalable pour ne pas usurper des motifs réservés.` },
    { name: 'Néo-tribal', desc: `Réinterprétation contemporaine des motifs tribaux. Permet l'esthétique sans la charge culturelle. Plus libre, plus personnalisable, plus accessible à un public sans lien avec la culture d'origine.` },
    { name: 'Berbère / amazigh', desc: `Motifs ancestraux d'Afrique du Nord. Symboles de protection, de fertilité, d'appartenance. Style en regain d'intérêt chez les descendants de cultures berbères qui veulent renouer avec leurs racines.` },
  ],
  'old-school': [
    { name: 'American Traditional', desc: `Le classique : ancres, roses, hirondelles, aigles, pin-ups. Contours épais, couleurs vives (rouge, vert, jaune, bleu), aplats francs. Vieillit exceptionnellement bien grâce à la densité des contours.` },
    { name: 'Neo-Traditional', desc: `Évolution moderne de l'old school. Garde les contours gras mais autorise plus de détails, de nuances et de couleurs. Idéal pour des sujets plus complexes (animaux, portraits stylisés).` },
    { name: 'Traditional japonais', desc: `Mélange entre old school occidental et codes japonais. Vagues, fleurs, masques avec contours épais et palette saturée. Très populaire pour les sleeves complets.` },
    { name: 'Sailor Jerry style', desc: `Inspiré du tatoueur emblématique Norman "Sailor Jerry" Collins. Esthétique marin, militaire, érotique vintage. Style très iconographique, peu personnalisable mais immédiatement reconnaissable.` },
  ],
  'aquarelle': [
    { name: 'Splash watercolor', desc: `Le plus emblématique. Éclaboussures de couleur sans contour structuré, effet "peinture qui coule". Risque d'estompage plus rapide : choisir un artiste qui sait doser les pigments.` },
    { name: 'Aquarelle structurée', desc: `Couleurs aquarelle posées sur un dessin au trait fin (souvent fineline). Tient mieux dans le temps que le splash pur car le trait conserve la lisibilité même si la couleur s'estompe.` },
    { name: 'Galaxie / cosmique', desc: `Nébuleuses, étoiles, dégradés violets/bleus/roses. Très demandé pour les pièces moyennes. Vieillit moyen sur les zones très exposées au soleil.` },
    { name: 'Botanique aquarelle', desc: `Fleurs, plumes, papillons en couleur aquarelle. Combine la délicatesse du fineline botanique et l'expressivité de la couleur. L'un des sous-styles les plus populaires actuellement.` },
  ],
  'dotwork': [
    { name: 'Mandala dotwork', desc: `Compositions circulaires entièrement construites en points. La discipline reine du dotwork. Demande une régularité exemplaire : les points doivent être uniformes en taille et en espacement.` },
    { name: 'Dotwork géométrique', desc: `Formes géométriques avec dégradés en points. Souvent associé à des lignes fines pour structurer la composition. Très long à exécuter (plusieurs heures même sur petite pièce).` },
    { name: 'Dotwork illustratif', desc: `Portraits, animaux, scènes en pointillisme pur. Style proche de la gravure ou du dessin à l'encre. Très peu courant car techniquement exigeant.` },
    { name: 'Handpoke', desc: `Dotwork réalisé à la main (sans machine), point par point. Technique ancestrale qui connaît un revival. Plus lent, moins traumatisant pour la peau, esthétique plus organique.` },
  ],
  'lettering': [
    { name: 'Script', desc: `Écriture manuscrite cursive, élégante. Le plus demandé pour citations et prénoms. Demande un calibrage parfait des espacements pour rester lisible dans la durée.` },
    { name: 'Gothique / blackletter', desc: `Inspiration médiévale, lettres anguleuses et denses. Très impactant visuellement mais peut être moins lisible : choisir des compositions courtes ou des emplacements bien visibles.` },
    { name: 'Chicano lettering', desc: `Style issu de la culture chicano californienne. Lettres ombrées, contrastes forts, esthétique très typée. Souvent en noir et gris, idéal pour des phrases ou des prénoms emblématiques.` },
    { name: 'Lettering minimaliste', desc: `Typographie simple, sans fioritures, souvent en fineline. Idéal pour des dates, des initiales, des mots courts. Discret et intemporel, vieillit très bien.` },
  ],
};

function buildLeadCta(style, city) {
  return `
<!-- LEAD CTA -->
<section class="lead-cta">
  <div class="lead-cta-inner">
    <div class="lead-cta-text">
      <p class="lead-cta-title">Décris ton projet ${style.label.toLowerCase()} à ${city.label}, reçois 2-3 propositions d'artistes.</p>
      <p class="lead-cta-sub">Gratuit · Réponse sous 48h</p>
    </div>
    <a href="demande.html?style=${encodeURIComponent(style.airtable)}&ville=${encodeURIComponent(city.label)}" class="lead-cta-btn">Décrire mon projet →</a>
  </div>
</section>`;
}

function buildSubstylesHtml(style) {
  const list = STYLE_SUBSTYLES[style.slug];
  if (!list) return '';
  const items = list.map(s => `
    <div class="substyle-item">
      <h3 class="substyle-name">${s.name}</h3>
      <p class="substyle-desc">${s.desc}</p>
    </div>`).join('');
  return `
<!-- SOUS-STYLES -->
<section class="seo-section">
  <h2 class="seo-section-title">Le ${style.label.toLowerCase()} en détail : 4 familles à connaître</h2>
  <p class="seo-section-sub">Le ${style.label.toLowerCase()} n'est pas un style unique mais une famille d'approches qui partagent un même langage graphique. Voici les 4 sous-styles les plus représentés.</p>
  <div class="substyle-list">${items}
  </div>
</section>`;
}

// Phrases de clôture Inkmap
const INKMAP_CLOSE = [
  `Inkmap recense et vérifie les profils des meilleurs tatoueurs spécialisés dans ce style, partout en France.`,
  `Chaque profil Inkmap est sélectionné pour la cohérence de son portfolio, la qualité de ses réalisations et son professionnalisme.`,
  `Inkmap vous permet de comparer les artistes, leurs tarifs et leurs univers pour trouver celui qui réalisera exactement le tatouage que vous imaginez.`,
  `Sur Inkmap, tous les profils sont vérifiés : vous avez la certitude de contacter un vrai artiste, réactif et professionnel.`,
];

function getClose(styleSlug, citySlug) {
  const idx = (STYLES.findIndex(s => s.slug === styleSlug) + CITIES.findIndex(c => c.slug === citySlug)) % INKMAP_CLOSE.length;
  return INKMAP_CLOSE[idx];
}

function buildIntro(style, city) {
  const s = STYLE_INTRO[style.slug];
  const c = CITY_CONTEXT[city.slug];
  const close = getClose(style.slug, city.slug);
  return `${s.desc1} ${s.desc2} ${c.ctx} ${close}`;
}

function buildMetaDesc(style, city) {
  const s = STYLE_INTRO[style.slug];
  const raw = `Trouvez les meilleurs tatoueurs ${style.label.toLowerCase()} à ${city.label}. ${s.metaKw.charAt(0).toUpperCase() + s.metaKw.slice(1)} — profils vérifiés sur Inkmap, l'annuaire tatoueurs de France.`;
  return raw.length > 160 ? raw.slice(0, 157) + '...' : raw;
}

function buildTitle(style, city) {
  return `Tatoueur ${style.label} ${city.label} — Meilleurs artistes | Inkmap`;
}

function buildFaqSchema(style) {
  const faqs = STYLE_FAQ[style.slug] || [];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }, null, 2);
}

function buildBreadcrumbSchema(style, city, url) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inkmap", "item": "https://inkmap.fr/" },
      { "@type": "ListItem", "position": 2, "name": `Tatoueurs ${city.label}`, "item": `https://inkmap.fr/tatoueur-fineline-${city.slug}` },
      { "@type": "ListItem", "position": 3, "name": `${style.label} ${city.label}`, "item": url }
    ]
  }, null, 2);
}

function buildInternalLinks(currentStyle, city) {
  return STYLES
    .filter(s => s.slug !== currentStyle.slug)
    .map(s => `<a href="tatoueur-${s.slug}-${city.slug}.html" class="internal-link">${s.label}</a>`)
    .join('');
}

function buildCityLinks(style, currentCity) {
  return CITIES
    .filter(c => c.slug !== currentCity.slug)
    .map(c => `<a href="tatoueur-${style.slug}-${c.slug}.html" class="internal-link">${c.label}</a>`)
    .join('');
}

function buildFaqHtml(style) {
  const faqs = STYLE_FAQ[style.slug] || [];
  return faqs.map(f => `
      <details class="faq-item">
        <summary class="faq-q">${f.q}</summary>
        <div class="faq-a">${f.a}</div>
      </details>`).join('');
}

function buildPage(style, city) {
  const slug = `tatoueur-${style.slug}-${city.slug}`;
  const url = `https://inkmap.fr/${slug}`;
  const title = buildTitle(style, city);
  const desc = buildMetaDesc(style, city);
  const intro = buildIntro(style, city);
  const s = STYLE_INTRO[style.slug];
  const faqSchema = buildFaqSchema(style);
  const breadcrumbSchema = buildBreadcrumbSchema(style, city, url);
  const internalLinks = buildInternalLinks(style, city);
  const cityLinks = buildCityLinks(style, city);
  const faqHtml = buildFaqHtml(style);
  const tips = STYLE_TIPS[style.slug] || '';
  const localInsight = buildLocalInsight(style, city);
  const substylesHtml = buildSubstylesHtml(style);
  const leadCtaHtml = buildLeadCta(style, city);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:title" content="Tatoueur ${style.label} ${city.label} — Inkmap" />
  <meta property="og:description" content="Les meilleurs tatoueurs ${style.label.toLowerCase()} à ${city.label}. ${s.metaKw.charAt(0).toUpperCase() + s.metaKw.slice(1)} — profils vérifiés." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="https://inkmap.fr/og-image.jpg" />
  <meta property="og:site_name" content="Inkmap" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Tatoueur ${style.label} ${city.label} — Inkmap" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="https://inkmap.fr/og-image.jpg" />
  <meta name="theme-color" content="#c0392b" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Tatoueurs ${style.label} à ${city.label}",
    "description": "Les meilleurs tatoueurs ${style.label.toLowerCase()} à ${city.label}. Profils vérifiés sur Inkmap.",
    "url": "${url}",
    "image": "https://inkmap.fr/og-image.jpg",
    "isPartOf": { "@type": "WebSite", "name": "Inkmap", "url": "https://inkmap.fr" }
  }
  </script>
  <script type="application/ld+json">
  ${breadcrumbSchema}
  </script>
  <script type="application/ld+json">
  ${faqSchema}
  </script>

  <link rel="stylesheet" href="/styles.css" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    /* ── SEO HERO ── */
    .seo-hero {
      padding-top: 64px;
      padding: 120px 56px 64px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }

    .seo-hero-inner {
      max-width: 760px;
      position: relative;
      z-index: 1;
    }

    .seo-tag {
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 16px;
    }

    .seo-hero h1 {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.4rem, 5vw, 4.2rem);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -1px;
      line-height: 1;
      margin-bottom: 24px;
      color: var(--text);
    }

    .seo-hero h1 em {
      font-style: normal;
      color: var(--accent);
    }

    .seo-intro {
      color: var(--muted2);
      font-size: 0.98rem;
      line-height: 1.75;
      max-width: 620px;
      margin-bottom: 32px;
    }

    .seo-stats {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .seo-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .seo-stat-num {
      font-family: 'Syne', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1;
    }

    .seo-stat-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
    }


    /* ── SEO SECTIONS ── */
    .seo-section {
      max-width: 780px;
      margin: 0 auto;
      padding: 56px 56px;
      border-bottom: 1px solid var(--border);
    }

    .seo-section-alt {
      background: var(--surface);
      max-width: 100%;
      padding-left: calc((100% - 780px) / 2 + 56px);
      padding-right: calc((100% - 780px) / 2 + 56px);
    }

    .seo-section-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin-bottom: 20px;
      line-height: 1.2;
      color: var(--text);
    }

    .seo-section-content p {
      color: var(--muted2);
      font-size: 0.92rem;
      line-height: 1.75;
      margin-bottom: 16px;
    }

    .seo-section-content p:last-child { margin-bottom: 0; }

    .seo-section-sub {
      color: var(--muted2);
      font-size: 0.88rem;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    /* LEAD CTA */
    .lead-cta {
      max-width: 780px;
      margin: 48px auto 0;
      padding: 0 56px;
    }

    .lead-cta-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 20px 24px;
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      border-radius: 8px;
      background: var(--surface);
    }

    .lead-cta-text {
      flex: 1;
      min-width: 0;
    }

    .lead-cta-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
      margin: 0;
    }

    .lead-cta-sub {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      color: var(--muted2);
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .lead-cta-btn {
      flex-shrink: 0;
      display: inline-block;
      background: transparent;
      color: var(--accent);
      font-family: 'Space Mono', monospace;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 10px 18px;
      border: 1px solid var(--accent);
      border-radius: 6px;
      text-decoration: none;
      transition: background .15s, color .15s;
      white-space: nowrap;
    }

    .lead-cta-btn:hover {
      background: var(--accent);
      color: #fff;
    }

    @media (max-width: 720px) {
      .lead-cta { padding: 0 20px; }
      .lead-cta-inner { flex-direction: column; align-items: flex-start; padding: 18px 20px; }
      .lead-cta-btn { width: 100%; text-align: center; }
    }

    /* SUBSTYLES */
    .substyle-list { display: flex; flex-direction: column; gap: 0; margin-top: 24px; }

    .substyle-item {
      border-top: 1px solid var(--border);
      padding: 24px 0;
    }

    .substyle-item:last-child { padding-bottom: 0; }

    .substyle-name {
      font-family: 'Syne', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0;
      margin-bottom: 8px;
      color: var(--text);
    }

    .substyle-desc {
      color: var(--text);
      font-size: 1rem;
      line-height: 1.75;
      margin: 0;
    }

    /* FAQ */
    .seo-faq { display: flex; flex-direction: column; gap: 8px; }

    .faq-item {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--card);
      overflow: hidden;
    }

    .faq-q {
      padding: 16px 20px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .faq-q::after {
      content: '+';
      font-size: 1.2rem;
      color: var(--accent);
      flex-shrink: 0;
      transition: transform .2s;
    }

    details[open] .faq-q::after {
      content: '−';
    }

    .faq-a {
      padding: 0 20px 16px;
      color: var(--muted2);
      font-size: 0.85rem;
      line-height: 1.7;
    }

    /* INTERNAL LINKS */
    .internal-links {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }

    .internal-link {
      display: inline-block;
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 0.78rem;
      font-family: 'Space Mono', monospace;
      color: var(--text);
      text-decoration: none;
      letter-spacing: 0.5px;
      transition: all .15s;
      background: var(--card);
    }

    .internal-link:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(192,57,43,0.04);
    }

    .breadcrumb {
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 16px;
    }
    .breadcrumb a {
      color: var(--accent);
      text-decoration: none;
      transition: color .15s;
    }
    .breadcrumb a:hover { color: var(--text); }
    .breadcrumb span { color: var(--muted); margin: 0 4px; }
    .breadcrumb strong { color: var(--muted2); font-weight: 500; }

    @media (max-width: 768px) {
      .seo-section { padding: 40px 20px; }
      .seo-section-alt { padding-left: 20px; padding-right: 20px; }
      .seo-hero { padding: 80px 20px 48px; }
      .seo-hero h1 { font-size: clamp(2.4rem, 10vw, 4rem); letter-spacing: -1px; }
    }

    @media (max-width: 380px) {
      .seo-hero h1 { font-size: clamp(2rem, 12vw, 3rem); }
    }
  </style>
</head>
<body>


${HEADER_HTML}

<!-- SEO HERO -->
<section class="seo-hero">
  <div class="seo-hero-inner">
    <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> <span>›</span> <a href="tatoueur-${style.slug}-paris.html">${style.label}</a> <span>›</span> <strong>${city.label}</strong></nav>
    <h1>Tatoueurs <em>${style.label}</em><br>à ${city.label}</h1>
    <p class="seo-intro">${intro}</p>
    <div class="seo-stats">
      <div class="seo-stat">
        <div class="seo-stat-num" id="nb-resultats">—</div>
        <div class="seo-stat-label">Artistes trouvés</div>
      </div>
      <div class="seo-stat">
        <div class="seo-stat-num">${city.label}</div>
        <div class="seo-stat-label">Ville</div>
      </div>
      <div class="seo-stat">
        <div class="seo-stat-num">${style.label}</div>
        <div class="seo-stat-label">Style</div>
      </div>
    </div>
  </div>
</section>

<!-- RÉSULTATS -->
<div class="results-header" id="results-count"></div>

<!-- GRID -->
<div class="grid" id="grid"></div>

${leadCtaHtml}

${substylesHtml}

${localInsight}

<!-- GUIDE DU STYLE -->
<section class="seo-section">
  <h2 class="seo-section-title">Guide : le tatouage ${style.label.toLowerCase()}</h2>
  <div class="seo-section-content">
    <p>${s.desc1}</p>
    <p>${s.desc2}</p>
  </div>
</section>

<!-- CONSEILS -->
<section class="seo-section seo-section-alt">
  <h2 class="seo-section-title">Comment choisir son tatoueur ${style.label.toLowerCase()} à ${city.label} ?</h2>
  <div class="seo-section-content">
    <p>${tips}</p>
    <p>Sur Inkmap, chaque artiste est référencé avec son style, ses tarifs et son portfolio. Comparez les profils, consultez les réalisations et contactez directement l'artiste qui vous correspond — le tout gratuitement.</p>
  </div>
</section>

<!-- FAQ -->
<section class="seo-section">
  <h2 class="seo-section-title">Questions fréquentes — Tatouage ${style.label}</h2>
  <div class="seo-faq">${faqHtml}
  </div>
</section>

<!-- AUTRES STYLES -->
<section class="seo-section seo-section-alt">
  <h2 class="seo-section-title">Autres styles de tatouage à ${city.label}</h2>
  <p class="seo-section-sub">Découvrez aussi les tatoueurs spécialisés dans d'autres styles à ${city.label} :</p>
  <div class="internal-links">${internalLinks}</div>
</section>

<section class="seo-section">
  <h2 class="seo-section-title">Tatoueurs ${style.label} dans d'autres villes</h2>
  <p class="seo-section-sub">Retrouvez les meilleurs tatoueurs ${style.label.toLowerCase()} partout en France :</p>
  <div class="internal-links">${cityLinks}</div>
</section>

<!-- CTA -->
<div class="cta-band">
  <div class="cta-band-text">Explore tous les<br><span>tatoueurs français →</span></div>
  <div class="cta-band-actions">
    <a href="index.html" class="btn-primary">Voir tout l'annuaire</a>
    <a href="inscription.html" class="btn-secondary">Inscrire mon studio</a>
  </div>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="modal" onclick="fermerModal(event)">
  <div class="modal">
    <button class="modal-close" onclick="fermerModal()">✕</button>
    <div id="modal-content"></div>
  </div>
</div>

<!-- FOOTER -->
${FOOTER_HTML}

<script>
const PAGE_STYLE = "${style.airtable}";
const PAGE_VILLE = "${city.label}";

const tatoueurs = [];

const STYLE_EMOJI = {
  'Blackwork':'◼','Fineline':'🌿','Réalisme':'📷','Old School':'⚓',
  'Aquarelle':'🎨','Géométrique':'◆','Japonais':'⛩','Neo-Traditional':'🌹',
  'Tribal':'◉','Dotwork':'⬡','Illustratif':'🖤','Floral':'🌸',
  'Minimaliste':'✦','Portrait':'👁','Flash':'🦅','Organique':'🌑',
  'Micro-réalisme':'🔬','Noir & Gris':'🖤','Irezumi':'⛩','Lettering':'✍️'
};

async function chargerDepuisAirtable() {
  try {
    const res = await fetch('/api/tatoueurs');
    if (!res.ok) return;
    const { records } = await res.json();
    let nextId = tatoueurs.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    records.forEach(({ fields: f, instagramThumb }) => {
      if (!f.Nom) return;
      const rawStyles = f.Styles || f.styles || [];
      const styles = Array.isArray(rawStyles)
        ? rawStyles
        : rawStyles.split(',').map(s => s.trim()).filter(Boolean);
      const statut = (f.Statut || f.statuts || '').toLowerCase();
      const photoArr = f.Photos || f.Photo || f.photo || [];
      const allPhotos = Array.isArray(photoArr)
        ? photoArr.map(p => p.thumbnails?.large?.url || p.url || '').filter(Boolean)
        : [];
      const profile = {
        nom: f.Pseudo || f.Nom,
        nomComplet: f.Nom,
        ville: f.Ville || f.ville || '',
        region: f.Region || f.region || '',
        styles,
        tarif: parseInt(f.Tarif || f.tarif) || 0,
        instagram: f.Instagram || f.instagram || '',
        bio: f.Bio || f.bio || '',
        verifie: statut.includes('véri') || statut.includes('actif') || statut.includes('publi') || !!(f.Email || f.email),
        photo: allPhotos[0] || '',
        photos: allPhotos,
        instagramThumb: instagramThumb || '',
        emoji: STYLE_EMOJI[styles[0]] || '✦',
      };
      const fNom = f.Nom.toLowerCase().trim();
      const fPseudo = (f.Pseudo || '').toLowerCase().trim();
      const idx = tatoueurs.findIndex(t => {
        const tNom = t.nom.toLowerCase().trim();
        const tComplet = (t.nomComplet || '').toLowerCase().trim();
        return tNom === fNom || tNom === fPseudo || tComplet === fNom;
      });
      if (idx !== -1) {
        profile.id = tatoueurs[idx].id;
        tatoueurs[idx] = profile;
      } else {
        profile.id = nextId++;
        tatoueurs.push(profile);
      }
    });
  } catch(e) {
    console.warn('Airtable indisponible.', e);
  }
}

const PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.6" fill="rgba(192,57,43,0.12)"/></pattern><linearGradient id="glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#141414"/><stop offset="50%" stop-color="#0d0d0d"/><stop offset="100%" stop-color="#111"/></linearGradient></defs><rect width="320" height="180" fill="url(#glow)"/><rect width="320" height="180" fill="url(#grid)"/><line x1="0" y1="180" x2="320" y2="0" stroke="rgba(192,57,43,0.06)" stroke-width="40"/><g transform="translate(160,68)" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round"><path d="M-8,-18 L-8,8 C-8,12 -4,14 0,14 C4,14 8,12 8,8 L8,-18"/><line x1="-8" y1="-8" x2="8" y2="-8"/><line x1="-6" y1="-13" x2="6" y2="-13"/><line x1="0" y1="14" x2="0" y2="22" stroke="#c0392b" stroke-width="1.5"/><circle cx="-12" cy="-14" r="2.5" stroke="#333"/><line x1="-12" y1="-11.5" x2="-12" y2="-4"/><path d="M-12,-4 L-8,-2"/></g><text x="160" y="116" font-family="Arial Black, Impact, sans-serif" font-size="13" font-weight="900" letter-spacing="5" fill="#fff" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">INK<tspan fill="#c0392b">MAP</tspan></text><text x="160" y="134" font-family="Arial, Helvetica, sans-serif" font-size="7.5" letter-spacing="3" fill="#555" text-anchor="middle" dominant-baseline="middle">PHOTO À VENIR</text></svg>';

function renderCard(t) {
  const imgHtml = t.photo
    ? '<img src="' + t.photo + '" alt="Tatouage par ' + t.nom + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />'
    : (t.instagramThumb
      ? '<img src="' + t.instagramThumb + '" alt="Aperçu Instagram de ' + t.nom + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />'
      : PLACEHOLDER_SVG);
  return \`
    <div class="card" onclick="ouvrirModal(\${t.id})">
      <div class="card-img">\${imgHtml}</div>
      <div class="card-body">
        <div class="card-top">
          <div class="card-name">\${t.nom}</div>
          \${t.verifie ? '<span class="badge-verifie">✓ Vérifié</span>' : '<span class="badge-reclamer">Réclamer</span>'}
        </div>
        <div class="card-location">📍 \${t.ville}</div>
        <div class="styles">\${t.styles.map(s=>\`<span class="style-tag">\${s}</span>\`).join('')}</div>
        <div class="card-footer">
          <div class="tarif">\${t.tarif}€ <small>/ heure</small></div>
          <div class="card-actions">
            <button class="btn-voir" onclick="event.stopPropagation();ouvrirModal(\${t.id})">Voir →</button>
            <button class="btn-insta" onclick="event.stopPropagation()">Insta</button>
          </div>
        </div>
      </div>
    </div>\`;
}

function afficher(liste) {
  document.getElementById('results-count').textContent = \`— \${liste.length} résultat\${liste.length>1?'s':''}\`;
  document.getElementById('nb-resultats').textContent = liste.length;
  document.getElementById('grid').innerHTML = liste.length === 0
    ? \`<div class="no-results"><strong>Bientôt disponible</strong>Les premiers artistes \${PAGE_STYLE} à \${PAGE_VILLE} arrivent — <a href="inscription.html" style="color:var(--accent);text-decoration:none">inscris ton studio →</a></div>\`
    : liste.map(renderCard).join('');
}

function ouvrirModal(id) {
  const t = tatoueurs.find(x => x.id === id);
  const modalSrc = t.photo || t.instagramThumb || '';
  const modalImg = modalSrc
    ? '<div style="width:100%;height:200px;overflow:hidden;margin-bottom:16px"><img src="' + modalSrc + '" alt="' + (t.photo ? 'Tatouage par ' : 'Aperçu Instagram de ') + t.nom + '" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>'
    : '';
  document.getElementById('modal-content').innerHTML = \`
    \${modalImg}
    <div class="modal-name">\${t.nom}</div>
    <div class="modal-city">📍 \${t.ville} — \${t.region}</div>
    <div class="styles">\${t.styles.map(s=>\`<span class="style-tag">\${s}</span>\`).join('')}</div>
    <div class="modal-section"><h3>À propos</h3><p>\${t.bio}</p></div>
    <div class="modal-section"><h3>Tarif</h3><div class="modal-price">\${t.tarif}€<small style="font-size:0.9rem;color:var(--muted)"> / heure</small></div></div>
    <div class="modal-section"><h3>Contact</h3><p style="font-family:'Space Mono',monospace">\${t.instagram}</p></div>
    <div class="modal-actions">
      <button class="btn-primary">Contacter</button>
      <a href="https://www.instagram.com/\${t.instagram.replace('@','')}" target="_blank" class="btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center">Instagram</a>
    </div>
    \${!t.verifie ? \`
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div>
        <div style="font-size:0.75rem;color:var(--muted);font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Profil non réclamé</div>
        <div style="font-size:0.85rem;color:var(--muted2)">C'est vous ? Réclamez ce profil gratuitement.</div>
      </div>
      <a href="inscription.html?nom=\${encodeURIComponent(t.nom)}&ville=\${encodeURIComponent(t.ville)}&instagram=\${encodeURIComponent(t.instagram)}&region=\${encodeURIComponent(t.region)}&tarif=\${t.tarif}" style="background:transparent;border:1px solid var(--accent);color:var(--accent);padding:10px 20px;border-radius:3px;font-family:'Space Grotesk',sans-serif;font-size:0.85rem;font-weight:600;text-decoration:none;white-space:nowrap">Réclamer ce profil →</a>
    </div>\` : \`
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px">
      <span style="background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.2);color:#4caf50;font-size:0.72rem;padding:3px 10px;border-radius:2px;font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:0.5px">✓ Profil vérifié</span>
      <span style="color:var(--muted);font-size:0.78rem">Artiste inscrit et actif sur Inkmap</span>
    </div>\`}
  \`;
  document.getElementById('modal').classList.add('open');
}

function fermerModal(e) {
  if (!e || e.target === document.getElementById('modal'))
    document.getElementById('modal').classList.remove('open');
}

// ── MENU HAMBURGER ────────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

hamburger.addEventListener('click', function() {
  const ouvert = mobileNav.classList.toggle('open');
  hamburger.classList.toggle('open', ouvert);
  hamburger.setAttribute('aria-expanded', ouvert);
  document.body.style.overflow = ouvert ? 'hidden' : '';
});

function fermerMenu() {
  mobileNav.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

window.addEventListener('resize', function() {
  if (window.innerWidth > 768) fermerMenu();
});

chargerDepuisAirtable().then(() => {
  const liste = tatoueurs.filter(t =>
    t.styles.includes(PAGE_STYLE) &&
    t.ville.toLowerCase().includes(PAGE_VILLE.toLowerCase())
  );
  afficher(liste);
});

</script>
</body>
</html>`;
}

// Génération des pages
let generated = 0;
for (const style of STYLES) {
  for (const city of CITIES) {
    const filename = `tatoueur-${style.slug}-${city.slug}.html`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, buildPage(style, city), 'utf8');
    generated++;
    console.log(`✓ ${filename}`);
  }
}

// Génération des URLs pour le sitemap
console.log(`\n✅ ${generated} pages générées.`);
console.log('\n── URLs pour le sitemap ──');
for (const style of STYLES) {
  for (const city of CITIES) {
    console.log(`  <url>\n    <loc>https://inkmap.fr/tatoueur-${style.slug}-${city.slug}</loc>\n    <lastmod>2026-03-25</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
  }
}
