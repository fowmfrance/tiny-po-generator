import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { items } = await req.json() as {
    items: { csv_id: number; source_url: string }[];
  };

  const results: { csv_id: number; status: string; error?: string }[] = [];

  for (const item of items) {
    try {
      // Download original file from source URL
      const res = await fetch(item.source_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      if (bytes.length === 0) throw new Error("Empty file");

      // Determine content type from magic bytes
      let contentType = "application/octet-stream";
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        contentType = "application/pdf";
      } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
        contentType = "image/png";
      } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
        contentType = "image/jpeg";
      }

      // Build storage path: nina-noten/{csv_id}_{filename_from_url}
      const urlFilename = item.source_url.split("/uploads/").pop() || `file_${item.csv_id}`;
      const storagePath = `nina-noten/${item.csv_id}_${urlFilename}`;

      // Upload (upsert) to storage bucket
      const { error: uploadError } = await supabase.storage
        .from("invoice-attachments")
        .upload(storagePath, bytes, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      results.push({ csv_id: item.csv_id, status: "ok" });
    } catch (e: any) {
      results.push({ csv_id: item.csv_id, status: "error", error: e.message });
    }
  }

  const ok = results.filter(r => r.status === "ok").length;
  const failed = results.filter(r => r.status === "error").length;

  return new Response(
    JSON.stringify({ ok, failed, details: results.filter(r => r.status === "error") }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
