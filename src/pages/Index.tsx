import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MoodInput from "@/components/MoodInput";
import MoodPreset, { MoodPresetData } from "@/components/MoodPreset";
import SunoPromptCard, { SunoPrompt } from "@/components/SunoPromptCard";
import { Music2, Sparkles, Download, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import ApiSettings, { getApiConfig } from "@/components/ApiSettings";
import yaml from "js-yaml";

interface AnalysisResult {
  preset: MoodPresetData;
  prompts: SunoPrompt[];
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleExportYaml = () => {
    if (!result) return;
    const { preset, prompts } = result;

    const yamlData = {
      ...preset,
      prompts: prompts.map((p) => ({
        id: p.id,
        title: p.title,
        prompt: p.prompt,
        style: p.style,
        ...(p.lyrics_ko ? { lyrics_ko: p.lyrics_ko } : {}),
        ...(p.lyrics_en ? { lyrics_en: p.lyrics_en } : {}),
        ...(p.lyrics && !p.lyrics_ko && !p.lyrics_en ? { lyrics: p.lyrics } : {}),
      })),
    };

    const yamlStr = yaml.dump(yamlData, { lineWidth: 120, noRefs: true, quotingType: '"', forceQuotes: false });
    const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.project_id || preset.generation?.preset_name || "mood-preset"}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("YAML 파일이 다운로드되었습니다!");
  };

  const handleExportEpisodeYaml = () => {
    if (!result) return;
    const { preset } = result;
    const ep = preset.episode;
    if (!ep) return;

    // Match exact sample YAML format
    const episodeData: Record<string, any> = {
      brand: ep.brand || "",
      project_slug: ep.project_slug || preset.project_id || "",
      series_code: ep.series_code || "",
      scene: ep.scene || "",
      place_context: ep.place_context || "",
      time_of_day: ep.time_of_day || "",
      season: ep.season || "",
      weather: ep.weather || "",
      emotion_primary: ep.emotion_primary || "",
      emotion_secondary: ep.emotion_secondary || "",
      function: ep.function || "",
      mood_keywords: ep.mood_keywords || [],
      tempo_feel: ep.tempo_feel || "",
      groove_profile: ep.groove_profile || "",
      vocal_mode: ep.vocal_mode || "",
      instrument_hints: ep.instrument_hints || [],
      sonic_keywords: ep.sonic_keywords || [],
      sonic_restraints: ep.sonic_restraints || [],
      cover_motif: ep.cover_motif || "",
      track_count: ep.track_count || 10,
      lyrics_track_count: ep.lyrics_track_count ?? 0,
      language_mode: ep.language_mode || "mixed",
      marketing_platforms: ep.marketing_platforms || [],
    };

    const yamlStr = yaml.dump(episodeData, { lineWidth: 120, noRefs: true, quotingType: '"', forceQuotes: false });
    const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${episodeData.project_slug}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Episode YAML 파일이 다운로드되었습니다!");
  };

  const handleExportUploadPack = () => {
    if (!result) return;
    const { preset, prompts } = result;
    const up = preset.upload_pack;
    if (!up) return;

    const tracklist = prompts.slice(0, 10).map((p, i) => `- ${String(i + 1).padStart(2, "0")}. ${p.title}`).join("\n");

    const uploadPack = `# Upload Pack

## Playlist Identity
- Brand: ${up.playlist_identity.brand}
- Series: ${up.playlist_identity.series}
- Project Slug: ${up.playlist_identity.project_slug}
- Scene: ${up.playlist_identity.scene}
- Function: ${up.playlist_identity.function_ko}
- Emotion: ${up.playlist_identity.emotion}
- Series Copy Hook: ${up.playlist_identity.series_copy_hook}

## Source Rules
- Identity Guide: ${up.source_rules.identity_guide}
- Voice Guide: ${up.source_rules.voice_guide}
- Visual Guide: ${up.source_rules.visual_guide}

## Packaging Direction
- Voice North Star: ${up.packaging_direction.voice_north_star}
- Visual North Star: ${up.packaging_direction.visual_north_star}
- CTA Tone: ${up.packaging_direction.cta_tone}
- Next Scene Expansion: ${up.packaging_direction.next_scene_expansion}

## Primary Title
- Final Title: ${up.primary_title.final_title}
- KO Reference Title: ${up.primary_title.ko_reference_title}
- Display Label: ${up.primary_title.display_label}

## Title Candidates
- Safe: ${up.title_candidates.safe}
- Search-friendly: ${up.title_candidates.search_friendly}
- Editorial: ${up.title_candidates.editorial}

## Messaging Guardrails
${(up.messaging_guardrails || []).map(g => `- ${g}`).join("\n")}

## Description Intent
- Scene Phrase: ${up.description_intent.scene_phrase}
- Motion Hint: ${up.description_intent.motion_hint}
- Primary Visual Anchor: ${up.description_intent.primary_visual_anchor}
- Supporting Detail: ${up.description_intent.supporting_detail}

## Description Pack
### KO Short
${up.description_pack.ko_short}

### KO Standard
${up.description_pack.ko_standard}

### Storyline
- Opening: ${up.description_pack.storyline.opening}
- Middle: ${up.description_pack.storyline.middle}
- Closing: ${up.description_pack.storyline.closing}

### EN Short
${up.description_pack.en_short}

### EN Standard
${up.description_pack.en_standard}

## Tracklist Preview
${tracklist}

## Search Metadata
- Keywords: ${up.search_metadata.keywords}
- Hashtags: ${up.search_metadata.hashtags}
- Scene anchor: ${up.search_metadata.scene_anchor}
- Series anchor: ${up.search_metadata.series_anchor}
- Search intent notes: ${up.search_metadata.search_intent_notes}

## Thumbnail Brief
- Visual motif: ${up.thumbnail_brief.visual_motif}
- Primary anchor: ${up.thumbnail_brief.primary_anchor}
- Supporting detail: ${up.thumbnail_brief.supporting_detail}
- Light: ${up.thumbnail_brief.light}
- Light logic: ${up.thumbnail_brief.light_logic}
- Surface focus: ${up.thumbnail_brief.surface_focus}
- Color bias: ${up.thumbnail_brief.color_bias}
- Text rules:
${(up.thumbnail_brief.text_rules || []).map(r => `- ${r}`).join("\n")}
- Avoid:
${(up.thumbnail_brief.avoid || []).map(a => `- ${a}`).join("\n")}

## Publishing Guardrails
${(up.publishing_guardrails || []).map(g => `- ${g}`).join("\n")}

## Pinned Comment
${up.pinned_comment}

## Publishing Checklist
- [ ] Title confirmed
- [ ] Description confirmed
- [ ] Tracklist confirmed
- [ ] Thumbnail confirmed
- [ ] Tags confirmed
`;

    const blob = new Blob([uploadPack], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.episode?.project_slug || preset.project_id || "export"}.upload-pack.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Upload Pack이 다운로드되었습니다!");
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    const { preset, prompts } = result;
    const gen = preset.generation;
    const brief = preset.project_brief;

    let md = `# 🎵 Mood to Suno - 분석 결과\n\n`;
    md += `## 무드 프리셋: ${gen?.preset_name || preset.name || ""}\n\n`;
    md += `> ${brief?.audience || preset.description || ""}\n\n`;
    md += `| 항목 | 값 |\n|------|----|\n`;
    md += `| 무드 키워드 | ${(gen?.mood_keywords || preset.mood_tags || []).join(", ")} |\n`;
    md += `| 템포 | ${gen?.tempo_hint || preset.tempo || ""} |\n`;
    md += `| 에너지 | ${gen?.energy_curve || preset.energy || ""} |\n`;
    md += `| 보컬 | ${gen?.vocal_mode || ""} |\n`;
    md += `| 장면 | ${gen?.scene || ""} |\n\n`;
    md += `---\n\n`;
    md += `## Suno 프롬프트 (${prompts.length}곡)\n\n`;

    prompts.forEach((p, i) => {
      md += `### ${i + 1}. ${p.title}\n\n`;
      md += `**스타일:** ${p.style}\n\n`;
      md += `**프롬프트:**\n\`\`\`\n${p.prompt}\n\`\`\`\n\n`;
      if (p.lyrics_ko) md += `**가사 (한국어):**\n\`\`\`\n${p.lyrics_ko}\n\`\`\`\n\n`;
      if (p.lyrics_en) md += `**가사 (English):**\n\`\`\`\n${p.lyrics_en}\n\`\`\`\n\n`;
      if (!p.lyrics_ko && !p.lyrics_en && p.lyrics) md += `**가사:**\n\`\`\`\n${p.lyrics}\n\`\`\`\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mood-to-suno-${gen?.preset_name || preset.name || "export"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("마크다운 파일이 다운로드되었습니다!");
  };

  const handleMoodSubmit = async (mood: string, imagesBase64?: string[], withLyrics?: boolean) => {
    setIsLoading(true);
    try {
      const apiConfig = getApiConfig();
      const { data, error } = await supabase.functions.invoke("analyze-mood", {
        body: { mood, imagesBase64, withLyrics, apiConfig },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("무드 분석에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      if (!data || data.error) {
        console.error("API returned error:", data?.error);
        toast.error(data?.error || "무드 분석에 실패했습니다.");
        return;
      }

      let normalizedResult: AnalysisResult;
      if (data.preset && data.prompts) {
        normalizedResult = data as AnalysisResult;
      } else if (data.prompts) {
        const { prompts, ...rest } = data;
        normalizedResult = { preset: rest as MoodPresetData, prompts };
      } else {
        console.error("Unexpected response structure:", JSON.stringify(data).slice(0, 500));
        toast.error("AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
        return;
      }

      if (!normalizedResult.preset.generation) {
        normalizedResult.preset.generation = {
          preset_name: "", mood_keywords: [], scene: "", energy_curve: "",
          vocal_mode: "", tempo_hint: "", era_hint: "", location_hint: "", reference_words: [],
        };
      }
      if (!normalizedResult.preset.project_brief) {
        normalizedResult.preset.project_brief = {
          playlist_name: "", working_title: "", audience: "", use_case: "",
          differentiator: "", notes: "",
        };
      }

      setResult(normalizedResult);
      toast.success("무드 분석이 완료되었습니다!");
    } catch (err) {
      console.error("Error analyzing mood:", err);
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="pt-12 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 pulse-glow">
              <Music2 className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute right-4 top-4">
              <ApiSettings />
            </div>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Mood to Suno</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            당신의 무드를 분석하여 맞춤형 프리셋과
            <br className="hidden md:block" /> Suno AI용 음악 프롬프트를 생성합니다
          </p>
        </div>
      </header>

      <main className="px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <MoodInput onSubmit={handleMoodSubmit} isLoading={isLoading} />

          {result && (
            <div className="space-y-8 fade-in">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    생성된 무드 프리셋
                  </h2>
                </div>
                <MoodPreset preset={result.preset} />
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-secondary" />
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Suno 프롬프트 ({result.prompts.length}곡)
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">클릭하여 복사</span>
                    <button
                      onClick={handleExportEpisodeYaml}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent-foreground text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Episode
                    </button>
                    <button
                      onClick={handleExportUploadPack}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-medium transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Upload Pack
                    </button>
                    <button
                      onClick={handleExportYaml}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      YAML
                    </button>
                    <button
                      onClick={handleExportMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-medium transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      MD
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 stagger-in">
                  {result.prompts.map((prompt, index) => (
                    <SunoPromptCard key={prompt.id} prompt={prompt} index={index} />
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
