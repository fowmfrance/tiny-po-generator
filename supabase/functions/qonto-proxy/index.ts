import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const encryptionKey = Deno.env.get('BANK_CREDENTIALS_ENCRYPTION_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user JWT from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT to verify auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, endpoint, params, connectionId, bankData } = body;

    // Service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Action: Create new bank connection with encrypted credentials
    if (action === 'create_connection') {
      const { login, secretKey, bankName, organizationName, bankAccounts } = bankData;
      
      if (!login || !secretKey || !bankName) {
        return new Response(
          JSON.stringify({ error: 'Missing required bank data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Encrypt credentials using database function
      const { data: encryptedLogin, error: encLoginErr } = await supabaseAdmin.rpc(
        'encrypt_credential',
        { plain_text: login, encryption_key: encryptionKey, iv: '' }
      );

      const { data: encryptedSecret, error: encSecretErr } = await supabaseAdmin.rpc(
        'encrypt_credential',
        { plain_text: secretKey, encryption_key: encryptionKey, iv: '' }
      );

      if (encLoginErr || encSecretErr) {
        console.error('Encryption error:', encLoginErr || encSecretErr);
        return new Response(
          JSON.stringify({ error: 'Failed to encrypt credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert connection with encrypted credentials only
      const { data: newConn, error: insertError } = await supabaseAdmin
        .from('bank_connections')
        .insert({
          user_id: user.id,
          bank_name: bankName,
          encrypted_login: encryptedLogin,
          encrypted_secret_key: encryptedSecret,
          organization_name: organizationName || 'Qonto',
          bank_accounts: bankAccounts || [],
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Bank connection created for user ${user.id}`);
      return new Response(
        JSON.stringify({ connection: newConn }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Fetch from Qonto API using stored encrypted credentials
    if (action === 'qonto_api' && connectionId) {
      // Verify user owns this connection
      const { data: connCheck, error: connCheckError } = await supabaseAdmin
        .from('bank_connections')
        .select('id, user_id')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (connCheckError || !connCheck) {
        return new Response(
          JSON.stringify({ error: 'Bank connection not found or unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // First check if encrypted credentials exist
      const { data: connData, error: connDataError } = await supabaseAdmin
        .from('bank_connections')
        .select('encrypted_login, encrypted_secret_key')
        .eq('id', connectionId)
        .single();

      if (connDataError || !connData) {
        console.error('Connection data error:', connDataError);
        return new Response(
          JSON.stringify({ error: 'Connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!connData.encrypted_login || !connData.encrypted_secret_key) {
        console.error('Connection has no encrypted credentials - needs to be reconnected');
        return new Response(
          JSON.stringify({ 
            error: 'Cette connexion bancaire doit être reconfigurée. Veuillez la supprimer et la recréer.',
            code: 'CREDENTIALS_NOT_ENCRYPTED'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get decrypted credentials
      const { data: credentials, error: decryptError } = await supabaseAdmin.rpc(
        'get_decrypted_credentials',
        { p_connection_id: connectionId, p_encryption_key: encryptionKey }
      );

      if (decryptError || !credentials || credentials.length === 0) {
        console.error('Decrypt error:', decryptError);
        return new Response(
          JSON.stringify({ error: 'Failed to decrypt credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { decrypted_login, decrypted_secret_key } = credentials[0];

      if (!decrypted_login || !decrypted_secret_key) {
        return new Response(
          JSON.stringify({ error: 'Invalid stored credentials - please reconnect the bank' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call Qonto API
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
          'Authorization': `${decrypted_login}:${decrypted_secret_key}`,
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
    }

    // Action: Validate credentials before storing (test connection)
    if (action === 'validate_credentials') {
      const { login, secretKey } = bankData;

      if (!login || !secretKey) {
        return new Response(
          JSON.stringify({ error: 'Missing credentials' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch('https://thirdparty.qonto.com/v2/organization', {
        method: 'GET',
        headers: {
          'Authorization': `${login}:${secretKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Qonto peut renvoyer du non-JSON (page d'erreur, corps vide) : on ne
      // laisse pas response.json() faire planter la fonction en 500.
      const rawBody = await response.text();
      let data: any = {};
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        data = { message: rawBody?.slice(0, 300) || 'Réponse Qonto illisible' };
      }

      if (!response.ok) {
        const detail =
          data?.errors?.[0]?.detail ||
          data?.message ||
          `Qonto a refusé la connexion (HTTP ${response.status}). Vérifiez le login (slug) et la clé secrète.`;
        console.error(`Qonto validation error (${response.status}): ${rawBody?.slice(0, 500)}`);
        return new Response(
          JSON.stringify({ error: detail, code: 'QONTO_UNAUTHORIZED', status: response.status, details: data }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Qonto credentials validated successfully');
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get categories from Qonto transactions
    if (action === 'get_categories' && connectionId) {
      // Verify user owns this connection
      const { data: connCheck, error: connCheckError } = await supabaseAdmin
        .from('bank_connections')
        .select('id, user_id, bank_accounts')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (connCheckError || !connCheck) {
        return new Response(
          JSON.stringify({ error: 'Bank connection not found or unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get decrypted credentials
      const { data: credentials, error: decryptError } = await supabaseAdmin.rpc(
        'get_decrypted_credentials',
        { p_connection_id: connectionId, p_encryption_key: encryptionKey }
      );

      if (decryptError || !credentials || credentials.length === 0) {
        console.error('Decrypt error:', decryptError);
        return new Response(
          JSON.stringify({ error: 'Failed to decrypt credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { decrypted_login, decrypted_secret_key } = credentials[0];

      if (!decrypted_login || !decrypted_secret_key) {
        return new Response(
          JSON.stringify({ error: 'Invalid stored credentials - please reconnect the bank' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qontoHeaders = {
        'Authorization': `${decrypted_login}:${decrypted_secret_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Get organization to find account IBAN
      const orgResponse = await fetch('https://thirdparty.qonto.com/v2/organization', {
        method: 'GET',
        headers: qontoHeaders,
      });

      if (!orgResponse.ok) {
        const orgError = await orgResponse.json();
        console.error('Qonto org error:', orgError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch organization' }),
          { status: orgResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const orgData = await orgResponse.json();
      const accountIban = orgData.organization?.bank_accounts?.[0]?.iban;

      if (!accountIban) {
        return new Response(
          JSON.stringify({ error: 'No bank account found in organization' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch transactions to extract unique categories
      const categoriesSet = new Set<string>();
      let page = 1;
      const maxPages = 10;

      while (page <= maxPages) {
        const transUrl = `https://thirdparty.qonto.com/v2/transactions?iban=${encodeURIComponent(accountIban)}&current_page=${page}&per_page=100`;
        
        console.log(`Fetching categories page ${page}: ${transUrl}`);
        
        const transResponse = await fetch(transUrl, {
          method: 'GET',
          headers: qontoHeaders,
        });

        if (!transResponse.ok) {
          console.error(`Transactions fetch error on page ${page}`);
          break;
        }

        const transData = await transResponse.json();
        const transactions = transData.transactions || [];

        if (transactions.length === 0) break;

        for (const transaction of transactions) {
          if (transaction.category) {
            categoriesSet.add(transaction.category);
          }
        }

        const metadata = transData.meta || {};
        if (!metadata.next_page || metadata.next_page <= page) break;
        page = metadata.next_page;
      }

      const categories = Array.from(categoriesSet).sort();
      console.log(`Found ${categories.length} Qonto categories: ${categories.join(', ')}`);

      return new Response(
        JSON.stringify({ categories }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: create_connection, qonto_api, validate_credentials, or get_categories' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});