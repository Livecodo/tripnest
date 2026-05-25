module.exports = async function(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const userKey = body.openRouterKey;
    // OPENROUTER_API_KEY must be set in your deployment environment variables.
    // Callers may optionally supply their own key via body.openRouterKey.
    // See .env.example at the repository root for required variable names.
    const finalKey = userKey || Deno.env.get('OPENROUTER_API_KEY');
    if (!finalKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: OPENROUTER_API_KEY is not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (action === 'describe-image') {
      const imageUrl = body.imageUrl;
      if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'imageUrl is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Call OpenRouter with a vision model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tripnest.insforge.app',
          'X-Title': 'TripNest AI Helper'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Generate a short, elegant, travel-journal style caption for this photo (max 12 words, no hashtags, focus on aesthetics).' },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(JSON.stringify({ error: `OpenRouter error: ${response.status} - ${errText}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const resData = await response.json();
      const caption = resData.choices?.[0]?.message?.content || 'A beautiful day in paradise.';
      return new Response(JSON.stringify({ caption }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } 
    
    if (action === 'summarize-trip') {
      const tripId = body.tripId;
      const mediaUrls = body.mediaUrls || [];

      // Call OpenRouter text summarizer model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tripnest.insforge.app',
          'X-Title': 'TripNest AI Helper'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional travel journal editor. Summarize the trip into bullet points of key highlights and suggest a creative name/theme for a memory book.'
            },
            {
              role: 'user',
              content: `Please synthesize the highlights of our trip. We uploaded these memories: ${JSON.stringify(mediaUrls)}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(JSON.stringify({ error: `OpenRouter error: ${response.status} - ${errText}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const resData = await response.json();
      const summary = resData.choices?.[0]?.message?.content || 'Perfect trip memories loaded!';
      return new Response(JSON.stringify({ summary }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
