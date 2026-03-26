exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let image, mediaType;
  try {
    ({ image, mediaType } = JSON.parse(event.body));
    if (!image) throw new Error('No image');
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const prompt = `Tu es un expert en tatouage avec 20 ans d'expérience. Analyse cette image en deux étapes.

ÉTAPE 1 — Observe les caractéristiques visuelles :
- Épaisseur des traits (ultra-fins, moyens, épais, absents)
- Palette de couleurs (noir pur, noir & gris, couleurs vives, aquarelle, monochrome)
- Technique (pointillisme, hachures, aplats, dégradés, effets aquarelle)
- Sujet (portrait, nature, géométrie, lettering, symboles, motifs culturels)
- Niveau de détail et réalisme

ÉTAPE 2 — Attribue un score à chaque style selon tes observations.

Styles possibles (utilise uniquement ces noms exacts) :
Fineline, Blackwork, Réalisme, Micro-réalisme, Noir & Gris, Portrait, Old School, Neo-Traditional, Japonais, Irezumi, Aquarelle, Géométrique, Tribal, Polynésien, Dotwork, Illustratif, Floral, Minimaliste, Flash, Organique, Biomécanique, Lettering, Trash Polka, Chicano, Surréalisme

Retourne UNIQUEMENT ce JSON sans aucun texte autour :
{"style":"<style principal>","explication":"<1 phrase courte, max 15 mots, décrivant les caractéristiques visuelles clés>","scores":[["<style1>",<score1>],["<style2>",<score2>],["<style3>",<score3>],["<style4>",<score4>],["<style5>",<score5>]]}

Règles :
- Les scores sont entre 0 et 100
- Le style principal = scores[0][0]
- Si l'image n'est pas un tatouage, analyse quand même le style graphique`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 400,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType || 'image/jpeg'};base64,${image}`,
              },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return { statusCode: 502, body: JSON.stringify({ error: 'AI service error' }) };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from Groq');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const result = JSON.parse(match[0]);

    if (!result.style || !Array.isArray(result.scores)) {
      throw new Error('Invalid response structure');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (e) {
    console.error('ia-match error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Analysis failed' }) };
  }
};
