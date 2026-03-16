import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ApiConfig {
  provider: "lovable" | "openai" | "google";
  apiKey: string;
  model: string;
}

function getEndpointAndHeaders(config: ApiConfig): { url: string; headers: Record<string, string>; model: string } {
  switch (config.provider) {
    case "openai":
      return {
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        model: config.model || "gpt-4o",
      };
    case "google":
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        model: config.model || "gemini-2.5-flash-preview-05-20",
      };
    case "lovable":
    default: {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
      return {
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        model: config.model || "google/gemini-3-flash-preview",
      };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, imagesBase64, withLyrics, apiConfig } = await req.json();

    if (!mood && (!imagesBase64 || imagesBase64.length === 0)) {
      return new Response(
        JSON.stringify({ error: "무드 설명 또는 이미지가 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config: ApiConfig = apiConfig || { provider: "lovable", apiKey: "", model: "google/gemini-3-flash-preview" };
    const { url, headers, model } = getEndpointAndHeaders(config);

    const lyricsInstruction = withLyrics
      ? `\nIMPORTANT: For each of the 10 prompts, generate FULL-LENGTH original lyrics for a 3-4 minute song with a complete narrative arc. 
Each lyrics MUST include ALL of these sections in order:
[Intro]
[Verse 1]
[Pre-Chorus]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Outro]

Generate TWO versions of lyrics for each song:
1. "lyrics_ko": Full Korean lyrics
2. "lyrics_en": Full English lyrics

Both versions should convey the same emotions and narrative but be naturally written in each language (not direct translations).
Make lyrics poetic, emotionally resonant, and fitting for the musical style. Each section should have 4-8 lines.`
      : "";

    const promptStructure = withLyrics
      ? `{
      "id": 1,
      "title": "Korean song title",
      "prompt": "English Suno prompt describing the musical style, instruments, mood, tempo, genre mix",
      "style": "Genre/Style descriptor",
      "lyrics_ko": "[Intro]\\n...\\n[Verse 1]\\n...\\n[Pre-Chorus]\\n...\\n[Chorus]\\n...\\n[Verse 2]\\n...\\n[Chorus]\\n...\\n[Bridge]\\n...\\n[Outro]\\n...",
      "lyrics_en": "[Intro]\\n...\\n[Verse 1]\\n...\\n[Pre-Chorus]\\n...\\n[Chorus]\\n...\\n[Verse 2]\\n...\\n[Chorus]\\n...\\n[Bridge]\\n...\\n[Outro]\\n..."
    }`
      : `{
      "id": 1,
      "title": "Korean song title",
      "prompt": "English Suno prompt describing the musical style, instruments, mood, tempo, genre mix",
      "style": "Genre/Style descriptor"
    }`;

    const systemPrompt = `You are a music mood analyst and Suno AI prompt expert. 
Analyze the user's mood description (and/or image if provided) and create:
1. A structured project preset following the YAML-compatible schema below
2. An "episode" object following the PLS Radio episode YAML format
3. 10 diverse Suno AI prompts that match this mood
${lyricsInstruction}

Respond in JSON format with this exact structure:
{
  "preset": {
    "project_id": "p-kebab-case-project-name",
    "episode": {
      "lens": "portrait | landscape | still_life",
      "series": "P1-P6 for portrait, L1-L6 for landscape, S1-S6 for still_life",
      "project_slug": "pls-series-descriptive-slug-001",
      "scene": "vivid scene description with sensory details (e.g. spring evening window, warm curtain air, soft table light)",
      "place_context": "brief location context (e.g. quiet room by the window)",
      "time_of_day": "dawn | morning | late_morning | afternoon | late_afternoon | evening | night | late_night",
      "season": "spring | summer | autumn | winter",
      "weather": "clear | soft_clouds | overcast | rain | snow | fog | humid | windy",
      "emotion_primary": "primary emotional tone (e.g. tender calm, open wonder)",
      "emotion_secondary": "secondary emotional nuance (e.g. quiet hope, gentle melancholy)",
      "function": "deep_listening | walking | reading_bgm | focus_work | meditation | driving | social_ambient",
      "cover_motif": "visual motif for cover art (e.g. curtain, window light, soft table edge)",
      "listener_state": "listener's mental/physical state (e.g. unwinding after work, quiet morning reflection)",
      "track_count": 10,
      "variation_axes": ["axes of variation between tracks, e.g. tempo_shift", "instrument_swap", "reverb_depth"],
      "instrument_hints": ["suggested instruments, e.g. acoustic guitar", "soft piano", "ambient pad"],
      "texture_keywords": ["sonic textures, e.g. warm", "breathy", "lo-fi hiss", "vinyl crackle"],
      "sonic_restraints": ["things to avoid, e.g. no hard bass drops", "no aggressive distortion"]
    },
    "project_brief": {
      "playlist_name": "Creative playlist name",
      "working_title": "short internal working title",
      "audience": "target audience description",
      "use_case": "how this music will be used (e.g. deep work, driving, relaxation)",
      "differentiator": "what makes this unique compared to generic playlists",
      "notes": "additional production notes"
    },
    "generation": {
      "preset_name": "Creative Preset Name (2-4 words, Korean)",
      "mood_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "scene": "vivid scene description capturing the atmosphere",
      "energy_curve": "wave/steady/rising/falling",
      "vocal_mode": "instrumental/vocal/mixed",
      "tempo_hint": "slow/medium/fast/variable",
      "era_hint": "timeless/retro/modern/futuristic",
      "location_hint": "evocative location description",
      "reference_words": ["avoid X", "prefer Y imagery", "use Z tones"]
    },
    "publishing": {
      "platform": "youtube",
      "language_mode": "mixed",
      "constraints": {
        "banned_words": ["words to avoid"],
        "must_include_words": ["required keywords for SEO"],
        "title_length_hint": "50 to 75 characters",
        "description_length_hint": "under 900 characters",
        "thumbnail_text_policy": "minimal overlay text only"
      },
      "channel_samples": [
        {
          "channel_name": "Sample Channel Name",
          "audience_or_positioning": "channel positioning description",
          "video_title": "sample video title for this mood",
          "description_excerpt": "sample description text",
          "hashtags": ["#tag1", "#tag2", "#tag3"],
          "thumbnail_notes": {
            "subject": "main visual subject",
            "composition": "framing description",
            "palette": "color palette description",
            "text_overlay": "overlay strategy"
          },
          "performance_hint": "what drives engagement"
        }
      ]
    },
    "workflow": {
      "release_brief_strategy": "manual-seed-plus-derive",
      "output_language": "mixed"
    }
  },
  "prompts": [
    ${promptStructure}
  ]
}

IMPORTANT for the "episode" object:
- lens and series MUST match: portrait→P1-P6, landscape→L1-L6, still_life→S1-S6
- Choose lens based on the mood: portrait for intimate/personal, landscape for open/spacious, still_life for quiet/focused
- scene should be rich with sensory keywords separated by commas
- instrument_hints, texture_keywords, variation_axes, sonic_restraints should each have 3-6 items
- Infer appropriate time_of_day, season, weather from the mood description

Generate 2-3 channel_samples that represent different angles for publishing this mood as content.
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

    const requestBody = JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent.length === 1 ? userContent[0].text : userContent },
      ],
      temperature: 0.8,
    });

    // Retry logic with fallback to Lovable gateway
    const MAX_RETRIES = 2;
    let lastError = "";
    let content: string | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let currentUrl = url;
      let currentHeaders = headers;
      let currentBody = requestBody;

      // On final retry, fallback to Lovable gateway if using external provider
      if (attempt === MAX_RETRIES && config.provider !== "lovable") {
        console.log("Falling back to Lovable AI Gateway...");
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          currentUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
          currentHeaders = {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          };
          currentBody = JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent.length === 1 ? userContent[0].text : userContent },
            ],
            temperature: 0.8,
          });
        }
      }

      try {
        const response = await fetch(currentUrl, {
          method: "POST",
          headers: currentHeaders,
          body: currentBody,
        });

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "크레딧이 부족합니다. 충전 후 다시 시도해주세요." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `AI API error (${config.provider}): ${response.status} - ${errorText.slice(0, 200)}`;
          console.error(`Attempt ${attempt + 1} failed:`, lastError);
          // Retry on 503/500/502/504
          if ([500, 502, 503, 504].includes(response.status) && attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(lastError);
        }

        const aiResponse = await response.json();
        content = aiResponse.choices?.[0]?.message?.content;
        if (content) break;
        
        lastError = "No content in AI response";
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
      } catch (fetchErr) {
        lastError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.error(`Attempt ${attempt + 1} error:`, lastError);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    if (!content) {
      throw new Error(lastError || "All AI attempts failed");
    }

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
