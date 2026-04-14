const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const { supplierName, supplierUrl, action } = await req.json();

    if (!supplierName) {
      return new Response(JSON.stringify({ error: 'supplierName is required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Action 1: Find the supplier website URL via DuckDuckGo
    if (action === 'find_url') {
      const query = encodeURIComponent(`${supplierName} site officiel`);
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${query}`;
      const response = await fetch(ddgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SapajooBot/1.0)' },
      });
      const html = await response.text();

      // Extract URLs from DuckDuckGo HTML results
      const urlMatches = html.match(/href="https?:\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/g) || [];
      const urls: string[] = [];
      for (const match of urlMatches.slice(0, 5)) {
        const encoded = match.match(/uddg=([^&"]+)/)?.[1];
        if (encoded) {
          try {
            const decoded = decodeURIComponent(encoded);
            // Skip search engines, social media generic pages, directories
            if (!decoded.includes('duckduckgo.com') && !decoded.includes('google.com') && !decoded.includes('wikipedia.org')) {
              urls.push(decoded);
            }
          } catch { /* skip */ }
        }
      }

      return new Response(JSON.stringify({ success: true, urls }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Action 2: Scrape and extract legal data from supplier URL using Lovable AI
    if (action === 'extract_data') {
      if (!supplierUrl) {
        return new Response(JSON.stringify({ error: 'supplierUrl is required for extract_data' }), {
          status: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // Fetch the page content
      let pageContent = '';
      try {
        const pageResponse = await fetch(supplierUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SapajooBot/1.0)' },
          redirect: 'follow',
        });
        const html = await pageResponse.text();
        // Strip tags to get text content (rough extraction)
        pageContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000);
      } catch (e) {
        console.error('Error fetching supplier page:', e);
        return new Response(JSON.stringify({ success: false, error: 'Impossible de charger la page du fournisseur.' }), {
          status: 200,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // Also try to fetch mentions légales / legal pages
      let legalContent = '';
      for (const suffix of ['/mentions-legales', '/legal', '/mentions', '/a-propos', '/about']) {
        try {
          const base = new URL(supplierUrl);
          const legalUrl = `${base.origin}${suffix}`;
          const res = await fetch(legalUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SapajooBot/1.0)' },
            redirect: 'follow',
          });
          if (res.ok) {
            const html = await res.text();
            const text = html
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 5000);
            if (text.length > 200) {
              legalContent = text;
              break;
            }
          }
        } catch { /* skip */ }
      }

      // Use Lovable AI to extract structured data
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ success: false, error: 'AI API key not configured' }), {
          status: 500,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const prompt = `Tu es un assistant d'extraction de données. Analyse le contenu ci-dessous du site web "${supplierName}" (${supplierUrl}) et extrais les informations suivantes au format JSON strict. Si une information n'est pas trouvée, utilise null.

Champs à extraire :
- legal_name: raison sociale exacte
- siren: numéro SIREN (9 chiffres) ou SIRET (14 chiffres)
- vat_number: numéro de TVA intracommunautaire
- address: adresse postale
- city: ville
- country: pays
- representative: nom du représentant légal / dirigeant
- instagram: URL du profil Instagram
- linkedin: URL du profil LinkedIn
- logo_url: URL du logo si visible

Contenu de la page principale :
${pageContent}

${legalContent ? `Contenu de la page mentions légales :
${legalContent}` : ''}

Réponds UNIQUEMENT avec le JSON, sans markdown ni commentaire.`;

      const aiResponse = await fetch('https://ai.lovable.dev/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', await aiResponse.text());
        return new Response(JSON.stringify({ success: false, error: 'Erreur IA lors de l\'extraction.' }), {
          status: 200,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      
      // Parse JSON from AI response
      let extracted: Record<string, any> = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Error parsing AI response:', content);
        return new Response(JSON.stringify({ success: false, error: 'Impossible de parser la réponse IA.' }), {
          status: 200,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data: extracted }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use find_url or extract_data.' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enrich-supplier:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});