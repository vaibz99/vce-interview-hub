import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You extract structured interview data from raw dumps. Return a JSON object via the tool provided.
If the content is spam, a test, or irrelevant to interviews, call the tool with rejected=true.
For category: use "Software" for CS/IT/software roles, "Core ECE" for electronics/hardware/VLSI/embedded roles, "Management" for HR/finance/consulting/management roles.`,
          },
          { role: "user", content: dump },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_interview",
              description: "Extract interview data or reject spam",
              parameters: {
                type: "object",
                properties: {
                  rejected: { type: "boolean", description: "True if content is spam/irrelevant" },
                  reason: { type: "string", description: "Rejection reason if rejected" },
                  company_name: { type: "string" },
                  role: { type: "string" },
                  category: { type: "string", enum: ["Software", "Core ECE", "Management"] },
                  questions: { type: "array", items: { type: "string" }, description: "List of interview questions extracted" },
                },
                required: ["rejected"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_interview" } },
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
      throw new Error("AI extraction failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const extracted = JSON.parse(toolCall.function.arguments);
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
