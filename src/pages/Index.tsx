import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MoodInput from "@/components/MoodInput";
import MoodPreset, { MoodPresetData } from "@/components/MoodPreset";
import SunoPromptCard, { SunoPrompt } from "@/components/SunoPromptCard";
import { Music2, Sparkles, Download, FileText } from "lucide-react";
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

    const yamlStr = yaml.dump(yamlData, {
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });

    const blob = new Blob([yamlStr], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.project_id || preset.generation?.preset_name || "mood-preset"}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("YAML 파일이 다운로드되었습니다!");
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

      setResult(data);
      toast.success("무드 분석이 완료되었습니다!");
    } catch (err) {
      console.error("Error analyzing mood:", err);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
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

      {/* Main Content */}
      <main className="px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <MoodInput onSubmit={handleMoodSubmit} isLoading={isLoading} />

          {result && (
            <div className="space-y-8 fade-in">
              {/* Preset */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    생성된 무드 프리셋
                  </h2>
                </div>
                <MoodPreset preset={result.preset} />
              </section>

              {/* Prompts */}
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
