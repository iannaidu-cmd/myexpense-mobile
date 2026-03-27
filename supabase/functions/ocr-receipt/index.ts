import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const { imageBase64 } = await req.json();

      if (!imageBase64) {
        return new Response(JSON.stringify({ error: "No image provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const client = new Anthropic({
        apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
      });

      const response = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `You are a South African tax receipt OCR assistant. Extract the following fields from this receipt image and respond ONLY with a JSON object, no markdown, no explanation:
{
  "vendor": "business name on the receipt",
  "amount": "total amount as a number string e.g. 1250.00",
  "date": "date in YYYY-MM-DD format",
  "vatAmount": "VAT amount as number string if shown, else null",
  "category": "one of: Travel & Transport, Home Office, Equipment & Tools, Software & Subscriptions, Meals & Entertainment, Professional Fees, Telephone & Cell, Marketing & Advertising, Bank Charges, Insurance, Rent, Repairs & Maintenance, Education, Vehicle Expenses, Personal / Non-deductible",
  "notes": "brief description of what was purchased"
}
If you cannot determine a value, use null.`,
              },
            ],
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const extracted = JSON.parse(clean);

      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
  { verifyJWT: false },
);
