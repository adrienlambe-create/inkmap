// Générateur de pages SEO statiques — 8 styles × 12 villes = 96 pages
const fs = require('fs');
const path = require('path');

// Partials partagés (header, footer)
const HEADER_HTML = fs.readFileSync(path.join(__dirname, 'partials/header.html'), 'utf-8');
const FOOTER_HTML = fs.readFileSync(path.join(__dirname, 'partials/footer.html'), 'utf-8');

const STYLES = [
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

// Conseils pour choisir son tatoueur par style
const STYLE_TIPS = {
  'realisme': `Demandez à voir des photos cicatrisées, pas seulement fraîches. Le réalisme révèle la vraie qualité de l'artiste une fois la peau guérie. Vérifiez aussi qu'il maîtrise les contrastes et les dégradés sur différentes carnations.`,
  'japonais': `Regardez si l'artiste respecte les règles de composition du japonais traditionnel (sens des vagues, placement des éléments). Un bon tatoueur japonais connaît la symbolique de chaque motif et saura vous conseiller.`,
  'geometrique': `La précision est tout dans le géométrique. Zoomez sur les photos pour vérifier la régularité des lignes et la symétrie. Un bon artiste géométrique travaille avec des gabarits et une rigueur mathématique.`,
  'tribal': `Assurez-vous que l'artiste connaît la tradition derrière les motifs et ne se contente pas de copier des designs. Un bon tatoueur tribal crée des pièces sur mesure qui respectent les codes culturels.`,
  'old-school': `Vérifiez la saturation des couleurs et la netteté des contours sur les photos cicatrisées. Un bon old school, même simple, doit avoir des couleurs vibrantes et des lignes nettes et régulières.`,
  'aquarelle': `Demandez des photos de tatouages cicatrisés depuis plus d'un an. L'aquarelle est un style qui peut évoluer avec le temps, et seul un artiste expérimenté sait doser les pigments pour la longévité.`,
  'dotwork': `Regardez la régularité des points : ils doivent être uniformes en taille et en espacement. Les dégradés doivent être fluides sans zones de points agglutinés. C'est le signe d'un vrai maître du dotwork.`,
  'lettering': `Demandez une maquette de votre texte avant la séance. La lisibilité est cruciale en lettering — testez différentes tailles et polices. Un bon artiste lettering adapte la typographie à la morphologie de la zone tatouée.`,
};

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
  const faqHtml = buildFaqHtml(style);
  const tips = STYLE_TIPS[style.slug] || '';

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

    .seo-hero-blob {
      position: absolute;
      top: -60px; right: -100px;
      width: 480px; height: 420px;
      background:
        radial-gradient(ellipse 60% 60% at 60% 50%, rgba(210,168,138,0.7) 0%, transparent 55%),
        radial-gradient(ellipse 80% 70% at 55% 55%, rgba(245,225,205,0.25) 0%, transparent 65%);
      filter: blur(55px);
      border-radius: 50%;
      pointer-events: none;
    }

    /* ── SEO SECTIONS ── */
    .seo-section {
      max-width: 900px;
      margin: 0 auto;
      padding: 56px 56px;
      border-bottom: 1px solid var(--border);
    }

    .seo-section-alt {
      background: var(--surface);
      max-width: 100%;
      padding-left: calc((100% - 900px) / 2 + 56px);
      padding-right: calc((100% - 900px) / 2 + 56px);
    }

    .seo-section-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.3rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin-bottom: 20px;
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
      gap: 8px;
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
  <div class="seo-hero-blob"></div>
  <div class="seo-hero-inner">
    <div class="seo-tag">// ${style.label} · ${city.label}</div>
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
    let nextId = 1;
    records.forEach(({ fields: f }) => {
      if (!f.Nom) return;
      const rawStyles = f.Styles || f.styles || [];
      const styles = Array.isArray(rawStyles)
        ? rawStyles
        : rawStyles.split(',').map(s => s.trim()).filter(Boolean);
      const statut = (f.Statut || f.statuts || '').toLowerCase();
      tatoueurs.push({
        id: nextId++,
        nom: f.Nom,
        ville: f.Ville || f.ville || '',
        region: f.Region || f.region || '',
        styles,
        tarif: parseInt(f.Tarif || f.tarif) || 0,
        instagram: f.Instagram || f.instagram || '',
        bio: f.Bio || f.bio || '',
        verifie: statut.includes('véri') || statut.includes('actif') || statut.includes('publi'),
        emoji: STYLE_EMOJI[styles[0]] || '✦',
      });
    });
  } catch(e) {
    console.warn('Airtable indisponible.', e);
  }
}

function renderCard(t) {
  return \`
    <div class="card" onclick="ouvrirModal(\${t.id})">
      <div class="card-img">\${t.emoji}</div>
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
  document.getElementById('modal-content').innerHTML = \`
    <div class="modal-emoji">\${t.emoji}</div>
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

// ── BLOBS ALÉATOIRES ──
(function() {
  const blobs = [
    document.querySelector('.bg-blob-1'),
    document.querySelector('.bg-blob-2'),
    document.querySelector('.bg-blob-3'),
  ];
  const parallax = [{ x: 0.04, y: 0.07 }, { x: -0.05, y: -0.04 }, { x: 0.03, y: -0.06 }];
  const amp = [110, 130, 90];
  const state = blobs.map(() => ({ cx: 0, cy: 0, tx: 0, ty: 0 }));
  function pickTarget(i) { state[i].tx = (Math.random()*2-1)*amp[i]; state[i].ty = (Math.random()*2-1)*amp[i]; }
  function scheduleNext(i) { setTimeout(() => { pickTarget(i); scheduleNext(i); }, 3000 + Math.random()*4000); }
  state.forEach((_, i) => { pickTarget(i); scheduleNext(i); });
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  const LERP = 0.013;
  (function loop() {
    requestAnimationFrame(loop);
    state.forEach((s, i) => {
      s.cx += (s.tx - s.cx) * LERP;
      s.cy += (s.ty - s.cy) * LERP;
      blobs[i].style.transform = \`translate(\${s.cx + scrollY * parallax[i].x}px, \${s.cy + scrollY * parallax[i].y}px)\`;
    });
  })();
})();
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
