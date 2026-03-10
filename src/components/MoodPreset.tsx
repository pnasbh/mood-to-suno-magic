import { Palette, Music2, Zap, Heart, MapPin, Mic, Clock, Layers, Target } from "lucide-react";

export interface MoodPresetData {
  project_id: string;
  project_brief: {
    playlist_name: string;
    working_title: string;
    audience: string;
    use_case: string;
    differentiator: string;
    notes: string;
  };
  generation: {
    preset_name: string;
    mood_keywords: string[];
    scene: string;
    energy_curve: string;
    vocal_mode: string;
    tempo_hint: string;
    era_hint: string;
    location_hint: string;
    reference_words: string[];
  };
  publishing: {
    platform: string;
    language_mode: string;
    constraints: {
      banned_words: string[];
      must_include_words: string[];
      title_length_hint: string;
      description_length_hint: string;
      thumbnail_text_policy: string;
    };
    channel_samples: {
      channel_name: string;
      audience_or_positioning: string;
      video_title: string;
      description_excerpt: string;
      hashtags: string[];
      thumbnail_notes: string | {
        subject: string;
        composition: string;
        palette: string;
        text_overlay: string;
      };
      url?: string;
      performance_hint?: string;
    }[];
  };
  workflow: {
    release_brief_strategy: string;
    output_language: string;
  };
  // legacy fields for backward compat
  name?: string;
  description?: string;
  genres?: string[];
  tempo?: string;
  energy?: string;
  mood_tags?: string[];
  color_palette?: string[];
}

interface MoodPresetProps {
  preset: MoodPresetData;
}

const MoodPreset = ({ preset }: MoodPresetProps) => {
  const gen = preset.generation;
  const brief = preset.project_brief;

  return (
    <div className="card-glass rounded-2xl p-6 glow-border fade-in space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-display text-2xl font-bold gradient-text">
          {gen?.preset_name || preset.name || "Untitled"}
        </h3>
        <p className="text-muted-foreground mt-1">
          {brief?.audience || preset.description || ""}
        </p>
        {brief?.working_title && (
          <span className="text-xs text-muted-foreground/70 italic">
            "{brief.working_title}"
          </span>
        )}
      </div>

      {/* Project Brief */}
      {brief && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brief.use_case && (
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">활용</span>
              </div>
              <p className="text-sm text-foreground">{brief.use_case}</p>
            </div>
          )}
          {brief.differentiator && (
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-medium">차별점</span>
              </div>
              <p className="text-sm text-foreground">{brief.differentiator}</p>
            </div>
          )}
        </div>
      )}

      {/* Generation Settings */}
      {gen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-medium">무드</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(gen.mood_keywords || preset.mood_tags || []).map((tag, idx) => (
                <span key={idx} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">에너지 / 템포</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {gen.energy_curve || preset.energy || "—"} / {gen.tempo_hint || preset.tempo || "—"}
            </span>
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Mic className="w-4 h-4" />
              <span className="text-xs font-medium">보컬 / 시대</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {gen.vocal_mode || "—"} / {gen.era_hint || "—"}
            </span>
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-pink-400 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-medium">장소</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {gen.location_hint || "—"}
            </span>
          </div>
        </div>
      )}

      {/* Scene */}
      {gen?.scene && (
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">장면</span>
          </div>
          <p className="text-sm text-foreground italic">"{gen.scene}"</p>
        </div>
      )}

      {/* Reference Words */}
      {gen?.reference_words && gen.reference_words.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Music2 className="w-4 h-4" />
            <span className="text-xs font-medium">참고 키워드</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {gen.reference_words.map((word, idx) => (
              <span key={idx} className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Publishing Channel Samples */}
      {preset.publishing?.channel_samples && preset.publishing.channel_samples.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            채널 샘플 ({preset.publishing.platform})
          </h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {preset.publishing.channel_samples.map((ch, idx) => (
              <div key={idx} className="bg-muted/20 rounded-xl p-4 border border-border/50 space-y-2">
                <p className="text-sm font-semibold text-foreground">{ch.channel_name}</p>
                <p className="text-xs text-muted-foreground italic">"{ch.video_title}"</p>
                <p className="text-xs text-muted-foreground">{ch.description_excerpt}</p>
                {ch.hashtags && (
                  <div className="flex flex-wrap gap-1">
                    {ch.hashtags.map((h, i) => (
                      <span key={i} className="text-xs text-primary">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodPreset;
