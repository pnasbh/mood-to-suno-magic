import { useState } from "react";
import { Copy, Check, Music, FileText } from "lucide-react";
import { toast } from "sonner";

export interface SunoPrompt {
  id: number;
  title: string;
  prompt: string;
  style: string;
  lyrics?: string;
}

interface SunoPromptCardProps {
  prompt: SunoPrompt;
  index: number;
}

const SunoPromptCard = ({ prompt, index }: SunoPromptCardProps) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopiedPrompt(true);
    toast.success("프롬프트가 복사되었습니다!");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyLyrics = async () => {
    if (!prompt.lyrics) return;
    await navigator.clipboard.writeText(prompt.lyrics);
    setCopiedLyrics(true);
    toast.success("가사가 복사되었습니다!");
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  return (
    <div className="card-glass rounded-xl p-5 glow-border group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-sm font-bold gradient-text">{index + 1}</span>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground">
              {prompt.title}
            </h4>
            <span className="text-xs text-muted-foreground">{prompt.style}</span>
          </div>
        </div>
        <button
          onClick={handleCopyPrompt}
          className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="프롬프트 복사"
        >
          {copiedPrompt ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="bg-input/50 rounded-lg p-3 border border-border">
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <Music className="w-3 h-3" />
          <span>Suno Prompt</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed font-mono">
          {prompt.prompt}
        </p>
      </div>

      {prompt.lyrics && (
        <div className="mt-3 bg-input/50 rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>Lyrics</span>
            </div>
            <button
              onClick={handleCopyLyrics}
              className="p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="가사 복사"
            >
              {copiedLyrics ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {prompt.lyrics}
          </p>
        </div>
      )}
    </div>
  );
};

export default SunoPromptCard;
