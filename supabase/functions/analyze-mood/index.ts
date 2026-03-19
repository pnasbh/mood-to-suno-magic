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

    const systemPrompt = `You are a music mood analyst and Suno AI prompt expert for a multi-channel playlist brand.

## SERIES ARCHITECTURE
You must select the correct Brand, Channel, and Series based on mood analysis.

### Channel 1: PLS Radio (scene-first, soft daylight, everyday atmosphere)
Portrait Series:
- P1 Tender Portraits: 온기 중심 인물 감정 | 봄빛 창가, 부드러운 표정
- P2 Private Weather: 내면 기분 변화 | 밝은 흐림, 잔상, 감정의 온도
- P3 Memory Letters: 기억과 관계 서사 | 편지, 오래된 장면, 회상
- P4 Soft Replies: 다정한 반응 | 답장, 눈빛, 짧은 대화 뒤의 공기
- P5 Window Silhouettes: 반쯤 보이는 인물성 | 커튼, 실루엣, 반사광
- P6 Afterglow Notes: 순간 뒤 남는 온기 | 대화 후 여운, 늦은 빛

Landscape Series:
- L1 Window Roads: 이동감, 창밖 풍경 | 강변길, 버스, 차창
- L2 Season Lines: 계절/시간 흐름 | 봄 공기, 초여름 저녁
- L3 Weather Cinema: 날씨 중심 시네마틱 | 비 갠 뒤 빛, 노을
- L4 Riverside Air: 물가, 바람 중심 산책 | 강변길, 잔물결, 밝은 공기
- L5 Open Horizons: 넓고 밝은 풍경 | 연한 하늘, 들판, 바다
- L6 Daybreak Routes: 이른 시간 이동감 | 아침길, 가벼운 출발

Still Life Series:
- S1 Desk Light: 작업/독서 실용 | 창가 책상, 머그컵
- S2 Quiet Objects: 사물/질감 중심 정적 | 컵, 책, 의자, 그림자
- S3 Slow Room: 오래 틀어둘 방 bgm | 조용한 방, 오후 빛
- S4 Sunny Corners: 밝은 구석, 생활감 | 볕 드는 모서리, 쿠션
- S5 Paper Morning: 종이, 아침 집중 | 노트, 엽서, 맑은 오전빛
- S6 Table Steam: 차, 식탁, 부엌 온기 | 찻잔, 토스트, 얇은 김

### Channel 2: Modern Quiet Jazz (genre-first, 실내 세련미, polished modern jazz)
- MJ1 Lobby Glow: 호텔 로비, 라운지 | elegant lounge listening
- MJ2 Gallery Air: 갤러리, 유리 반사 | reading, quiet focus
- MJ3 Late Brew: 카페, 비 오는 창가 | cafe ambience, night work
- MJ4 Soft Table: 테이블 램프, 대화 | intimate indoor calm
- MJ5 Terrace Silk: 테라스, 밤바람 | breezy evening unwind
- MJ6 After Rain Modern: 비 온 뒤 맑은 도시 | reset, polished calm
Sound rules: upright bass, brushed drums, Rhodes, muted trumpet, tenor sax, guitar comping, subtle swing, soft R&B feel, medium tempo
Avoid: swing revival, bebop speed, hard bop, free jazz, fusion sheen, generic lo-fi jazz, sleepy elevator mood

### Channel 3: riverside park (genre-first, retro city pop, Seoul night drive, bittersweet motion)
- RP1 Han River Sunset: 한강 노을, 강변 도로 | sunset drive
- RP2 Olympic Night Drive: 올림픽대로, 서울 야경 | night drive
- RP3 Seoul Afterglow: 하루 끝 도시 온기 | bittersweet evening
- RP4 Rooftop Weekend: 루프탑, 주말 밤 | weekend mood-up
- RP5 Apgujeong Breeze: 90s 세련미, 네온 | stylish retro walk
- RP6 Bridge Light Memory: 다리 조명, 반사광 | nostalgic reflection
Sound rules: clean guitar, slap bass, analog synth, bright EP, glossy drums, lush reverb, midtempo drive, airy vocal optional
Avoid: vaporwave parody, cyberpunk synthwave, comic retro, smoky jazz, novelty disco, overly playful kitsch

## TASK
Analyze the user's mood and create:
1. A structured project preset with correct brand/channel/series mapping
2. 10 diverse Suno AI prompts matching the mood
${lyricsInstruction}

Respond in JSON format with this exact structure:
{
  "preset": {
    "project_id": "p-kebab-case-project-name",
    "episode": {
      "brand": "PLS Radio | Modern Quiet Jazz | riverside park",
      "channel": "pls-radio | modern-quiet-jazz | riverside-park",
      "lens": "portrait | landscape | still_life (PLS Radio only, omit for other channels)",
      "series_code": "P1-P6 | L1-L6 | S1-S6 | MJ1-MJ6 | RP1-RP6",
      "series_name": "exact series name from architecture (e.g. Tender Portraits, Lobby Glow)",
      "project_slug": "channel-series-descriptive-slug-001",
      "scene": "vivid scene description with sensory details",
      "scene_axis": "장면 축 from series definition",
      "use_context": "사용 맥락 from series definition",
      "place_context": "brief location context",
      "time_of_day": "dawn | morning | late_morning | afternoon | late_afternoon | evening | night | late_night",
      "season": "spring | summer | autumn | winter",
      "weather": "clear | soft_clouds | overcast | rain | snow | fog | humid | windy",
      "emotion_primary": "primary emotional tone",
      "emotion_secondary": "secondary emotional nuance",
      "function": "deep_listening | walking | reading_bgm | focus_work | meditation | driving | social_ambient",
      "cover_motif": "visual motif for cover art",
      "listener_state": "listener's mental/physical state",
      "track_count": 10,
      "variation_axes": ["3-6 items"],
      "instrument_hints": ["3-6 instruments"],
      "texture_keywords": ["3-6 sonic textures"],
      "sonic_restraints": ["things to avoid"],
      "sound_rules": ["channel-specific sound rules"],
      "avoid_rules": ["channel-specific avoid rules"]
    },
    "project_brief": {
      "playlist_name": "Creative playlist name",
      "working_title": "short internal working title",
      "audience": "target audience description",
      "use_case": "how this music will be used",
      "differentiator": "what makes this unique",
      "notes": "additional production notes"
    },
    "generation": {
      "preset_name": "Creative Preset Name (2-4 words, Korean)",
      "mood_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "scene": "vivid scene description",
      "energy_curve": "wave/steady/rising/falling",
      "vocal_mode": "instrumental/vocal/mixed",
      "tempo_hint": "slow/medium/fast/variable",
      "era_hint": "timeless/retro/modern/futuristic",
      "location_hint": "evocative location description",
      "reference_words": ["avoid X", "prefer Y imagery"]
    },
    "publishing": {
      "platform": "youtube",
      "language_mode": "mixed",
      "constraints": {
        "banned_words": [],
        "must_include_words": [],
        "title_length_hint": "50 to 75 characters",
        "description_length_hint": "under 900 characters",
        "thumbnail_text_policy": "minimal overlay text only"
      },
      "channel_samples": [
        {
          "channel_name": "channel name",
          "audience_or_positioning": "positioning",
          "video_title": "sample title",
          "description_excerpt": "sample description",
          "hashtags": ["#tag1", "#tag2"],
          "thumbnail_notes": {
            "subject": "visual subject",
            "composition": "framing",
            "palette": "colors",
            "text_overlay": "overlay strategy"
          },
          "performance_hint": "engagement driver"
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

IMPORTANT RULES:
- Select the BEST matching channel and series based on the mood
- PLS Radio: scene-first, soft daylight, everyday atmosphere
- Modern Quiet Jazz: genre-first, indoor sophistication, polished jazz
- riverside park: genre-first, retro city pop, Seoul night drive
- For PLS Radio, set lens (portrait/landscape/still_life) matching the series prefix
- For other channels, lens can be omitted or set to the channel's dominant mood
- sound_rules and avoid_rules MUST come from the selected channel's rules
- scene_axis and use_context MUST come from the selected series definition
- Generate 2-3 channel_samples for publishing
- Make 10 prompts diverse in genre/tempo while maintaining core mood
- Each prompt should be 50-100 words for Suno
If an image is provided, analyze its colors, mood, atmosphere to derive musical mood.`;

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
