import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MoodInput from "@/components/MoodInput";
import MoodPreset, { MoodPresetData } from "@/components/MoodPreset";
import SunoPromptCard, { SunoPrompt } from "@/components/SunoPromptCard";
import { Music2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  preset: MoodPresetData;
  prompts: SunoPrompt[];
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleMoodSubmit = async (mood: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-mood", {
        body: { mood },
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
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 pulse-glow">
              <Music2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Mood to Suno</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            당신의 무드를 분석하여 맞춤형 프리셋과
            <br className="hidden md:block" /> Suno AI용 음악 프롬프트를
            생성합니다
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Input Section */}
          <MoodInput onSubmit={handleMoodSubmit} isLoading={isLoading} />

          {/* Results Section */}
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
                  <span className="text-xs text-muted-foreground">
                    클릭하여 복사
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 stagger-in">
                  {result.prompts.map((prompt, index) => (
                    <SunoPromptCard
                      key={prompt.id}
                      prompt={prompt}
                      index={index}
                    />
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
