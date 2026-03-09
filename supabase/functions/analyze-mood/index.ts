import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, imagesBase64, withLyrics } = await req.json();

    if (!mood && (!imagesBase64 || imagesBase64.length === 0)) {
      return new Response(
        JSON.stringify({ error: "무드 설명 또는 이미지가 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a music mood analyst and Suno AI prompt expert. 
Analyze the user's mood description (and/or image if provided) and create:
1. A mood preset with name, description, genres, tempo, energy level, mood tags, and color palette
2. 10 diverse Suno AI prompts that match this mood

Respond in JSON format with this exact structure:
{
  "preset": {
    "name": "Korean preset name (creative, 2-4 words)",
    "description": "Korean description of the mood (1-2 sentences)",
    "genres": ["genre1", "genre2", "genre3"],
    "tempo": "Slow/Medium/Fast/Variable",
    "energy": "Low/Medium/High/Building",
    "mood_tags": ["tag1", "tag2", "tag3", "tag4"],
    "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"]
  },
  "prompts": [
    {
      "id": 1,
      "title": "Korean song title",
      "prompt": "English Suno prompt describing the musical style, instruments, mood, tempo, genre mix",
      "style": "Genre/Style descriptor"
    }
  ]
}

Make prompts diverse: mix of genres, tempos, and approaches while maintaining the core mood.
Each prompt should be 50-100 words, detailed enough for Suno to generate quality music.
Include specific instruments, production styles, vocal types if applicable.
If an image is provided, analyze its colors, mood, atmosphere, and subject to derive the musical mood.`;

    // Build user message content - support multimodal
    const userContent: any[] = [];
    
    if (mood) {
      userContent.push({
        type: "text",
        text: `Analyze this mood and create a preset with 10 Suno prompts: "${mood}"`,
      });
    }
    
    if (imagesBase64 && imagesBase64.length > 0) {
      const imageCount = imagesBase64.length;
      userContent.push({
        type: "text",
        text: mood
          ? `Also consider these ${imageCount} image(s) for mood analysis:`
          : `Analyze the mood of these ${imageCount} image(s) and create a preset with 10 Suno prompts:`,
      });
      for (const img of imagesBase64) {
        userContent.push({
          type: "image_url",
          image_url: { url: img },
        });
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent.length === 1 ? userContent[0].text : userContent },
          ],
          temperature: 0.8,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from the response (handle markdown code blocks)
    let result;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-mood error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
