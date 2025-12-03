import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-qonto-login, x-qonto-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const qontoLogin = req.headers.get('x-qonto-login');
    const qontoSecret = req.headers.get('x-qonto-secret');

    if (!qontoLogin || !qontoSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing Qonto credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { endpoint, params } = await req.json();
    
    // Build URL with query parameters
    let qontoUrl = `https://thirdparty.qonto.com/v2/${endpoint}`;
    if (params) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      if (queryString) {
        qontoUrl += `?${queryString}`;
      }
    }
    
    console.log(`Fetching Qonto: ${qontoUrl}`);
    
    const response = await fetch(qontoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `${qontoLogin}:${qontoSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Qonto API error: ${JSON.stringify(data)}`);
      return new Response(
        JSON.stringify({ error: data.message || 'Qonto API error', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Qonto response OK for ${endpoint}`);
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
