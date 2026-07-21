import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FS_BASE = Deno.env.get("FS_BASE") ?? "https://ninanoten.furious-squad.com";
const FS_USER = Deno.env.get("FS_USER") ?? "";
const FS_PASS = Deno.env.get("FS_PASS") ?? "";

async function authenticate(): Promise<string> {
  const res = await fetch(`${FS_BASE}/api/v2/auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "auth", data: { username: FS_USER, password: FS_PASS } }),
  });
  if (!res.ok) throw new Error(`Auth failed: HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.token) throw new Error("Auth failed: no token");
  return json.token;
}

async function fetchPurchasePdf(token: string, purchaseId: number): Promise<Uint8Array | null> {
  const query = `{PurchasePdf(filter:{id:{eq:"${purchaseId}"}}){id,pdf_base64,attachments}}`;
  const url = `${FS_BASE}/api/v2/purchase-pdf/?query=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", "F-Auth-Token": token },
  });

  if (!res.ok) throw new Error(`PurchasePdf HTTP ${res.status}`);
  const json = await res.json();

  const arr = json?.data?.PurchasePdf;
  if (!arr || arr.length === 0) return null;

  const pdfData = arr[0];

  // Try attachments first (latest one), then pdf_base64
  if (pdfData.attachments) {
    const keys = Object.keys(pdfData.attachments)
      .filter((k: string) => k.startsWith("attachment_"))
      .sort((a: string, b: string) => {
        const numA = parseInt(a.split("_")[1], 10);
        const numB = parseInt(b.split("_")[1], 10);
        return numB - numA;
      });

    if (keys.length > 0) {
      const b64 = pdfData.attachments[keys[0]];
      if (b64) return base64ToBytes(b64);
    }
  }

  if (pdfData.pdf_base64) {
    return base64ToBytes(pdfData.pdf_base64);
  }

  return null;
}

function base64ToBytes(b64: string): Uint8Array {
  // Clean base64 string
  let cleaned = b64.trim();
  if (cleaned.includes(",") && cleaned.startsWith("data:")) {
    cleaned = cleaned.split(",")[1];
  }
  cleaned = cleaned.replace(/\s/g, "");

  const binaryString = atob(cleaned);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function detectContentType(bytes: Uint8Array): string {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  return "application/pdf"; // Default for purchases
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { items } = await req.json() as {
    items: { csv_id: number; storage_path: string }[];
  };

  // Authenticate once
  const token = await authenticate();

  const results: { csv_id: number; status: string; error?: string; size?: number }[] = [];

  for (const item of items) {
    try {
      const bytes = await fetchPurchasePdf(token, item.csv_id);
      if (!bytes || bytes.length === 0) throw new Error("No PDF data returned");

      // Verify it's actually a PDF (starts with %PDF)
      const header = String.fromCharCode(...bytes.slice(0, 4));
      const contentType = detectContentType(bytes);

      const { error: uploadError } = await supabase.storage
        .from("invoice-attachments")
        .upload(item.storage_path, bytes, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      results.push({ csv_id: item.csv_id, status: "ok", size: bytes.length });
    } catch (e: any) {
      results.push({ csv_id: item.csv_id, status: "error", error: e.message });
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  return new Response(
    JSON.stringify({ ok, failed, details: results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
