import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dump } = await req.json();
    if (!dump || typeof dump !== "string" || dump.trim().length < 20) {
      return new Response(JSON.stringify({ rejected: true, reason: "Content too short or empty" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY =
      Deno.env.get("GEMINI_API_KEY") ?? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `You extract structured interview data from raw dumps.
Return ONLY valid JSON that matches the schema.
IMPORTANT: Extract ALL questions mentioned, including round numbers and context. Do not truncate.
Format questions as: "Round X - Question text" to preserve structure.
If content is spam, a test, or irrelevant to interview experiences, return rejected=true and a reason.
For category: use "Software" for CS/IT/software roles, "Core ECE" for electronics/hardware/VLSI/embedded roles, and "Management" for HR/finance/consulting/management roles.`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: dump }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              rejected: { type: "BOOLEAN" },
              reason: { type: "STRING" },
              company_name: { type: "STRING" },
              role: { type: "STRING" },
              category: { type: "STRING", enum: ["Software", "Core ECE", "Management"] },
              questions: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
            },
            required: ["rejected", "company_name", "role", "category", "questions"],
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ rejected: true, reason: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ rejected: true, reason: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error(`AI extraction failed: ${response.status} ${t}`);
    }

    const result = await response.json();
    const modelText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!modelText) throw new Error("No JSON content in Gemini response");

    const extracted = JSON.parse(modelText);
    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-interview error:", e);
    return new Response(JSON.stringify({ rejected: true, reason: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
