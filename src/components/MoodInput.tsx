import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Music, Image, Mic } from "lucide-react";

interface MoodInputProps {
  onSubmit: (mood: string) => void;
  isLoading: boolean;
}

const MoodInput = ({ onSubmit, isLoading }: MoodInputProps) => {
  const [mood, setMood] = useState("");

  const handleSubmit = () => {
    if (mood.trim()) {
      onSubmit(mood);
    }
  };

  const exampleMoods = [
    "비 오는 새벽, 창가에서 커피 한 잔",
    "여름 밤 해변에서의 파티",
    "우울하고 몽환적인 밤거리",
    "에너지 넘치는 아침 운동",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card-glass rounded-2xl p-6 glow-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            무드 입력
          </h2>
        </div>

        <Textarea
          placeholder="당신의 무드를 설명해주세요... 감정, 상황, 분위기, 장면 등 자유롭게 표현해보세요."
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="min-h-[120px] bg-input/50 border-border focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>지원:</span>
            <div className="flex gap-1">
              <span className="px-2 py-1 rounded-md bg-muted/50 flex items-center gap-1">
                <Music className="w-3 h-3" /> 텍스트
              </span>
              <span className="px-2 py-1 rounded-md bg-muted/50 flex items-center gap-1 opacity-50">
                <Image className="w-3 h-3" /> 이미지 (준비중)
              </span>
              <span className="px-2 py-1 rounded-md bg-muted/50 flex items-center gap-1 opacity-50">
                <Mic className="w-3 h-3" /> 음성 (준비중)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">예시:</p>
          <div className="flex flex-wrap gap-2">
            {exampleMoods.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setMood(example)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!mood.trim() || isLoading}
          className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-xl transition-all duration-300"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⟳</span> 분석 중...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 무드 프리셋 생성
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MoodInput;
