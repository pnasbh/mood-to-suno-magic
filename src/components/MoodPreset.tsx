import { Palette, Music2, Zap, Heart, MapPin, Mic, Clock, Layers, Target, Eye, Thermometer, Cloud } from "lucide-react";

export interface EpisodeData {
  brand: string;
  project_slug: string;
  series_code: string;
  scene: string;
  place_context: string;
  time_of_day: string;
  season: string;
  weather: string;
  emotion_primary: string;
  emotion_secondary: string;
  function: string;
  mood_keywords: string[];
  tempo_feel: string;
  groove_profile: string;
  vocal_mode: string;
  instrument_hints: string[];
  sonic_keywords: string[];
  sonic_restraints: string[];
  cover_motif: string;
  track_count: number;
  lyrics_track_count: number;
  language_mode: string;
  marketing_platforms: string[];
  // legacy/optional fields
  channel?: string;
  lens?: string;
  series_name?: string;
  scene_axis?: string;
  use_context?: string;
  listener_state?: string;
  variation_axes?: string[];
  texture_keywords?: string[];
  sound_rules?: string[];
  avoid_rules?: string[];
}

export interface UploadPackData {
  playlist_identity: {
    brand: string;
    series: string;
    project_slug: string;
    scene: string;
    function_ko: string;
    emotion: string;
    series_copy_hook: string;
  };
  source_rules: {
    identity_guide: string;
    voice_guide: string;
    visual_guide: string;
  };
  packaging_direction: {
    voice_north_star: string;
    visual_north_star: string;
    cta_tone: string;
    next_scene_expansion: string;
  };
  primary_title: {
    final_title: string;
    ko_reference_title: string;
    display_label: string;
  };
  title_candidates: {
    safe: string;
    search_friendly: string;
    editorial: string;
  };
  messaging_guardrails: string[];
  description_intent: {
    scene_phrase: string;
    motion_hint: string;
    primary_visual_anchor: string;
    supporting_detail: string;
  };
  description_pack: {
    ko_short: string;
    ko_standard: string;
    storyline: {
      opening: string;
      middle: string;
      closing: string;
    };
    en_short: string;
    en_standard: string;
  };
  search_metadata: {
    keywords: string;
    hashtags: string;
    scene_anchor: string;
    series_anchor: string;
    search_intent_notes: string;
  };
  thumbnail_brief: {
    visual_motif: string;
    primary_anchor: string;
    supporting_detail: string;
    light: string;
    light_logic: string;
    surface_focus: string;
    color_bias: string;
    text_rules: string[];
    avoid: string[];
  };
  publishing_guardrails: string[];
  pinned_comment: string;
}

export interface MoodPresetData {
  project_id: string;
  episode?: EpisodeData;
  upload_pack?: UploadPackData;
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
  const ep = preset.episode;

  return (
    <div className="card-glass rounded-2xl p-6 glow-border fade-in space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display text-2xl font-bold gradient-text">
            {gen?.preset_name || preset.name || "Untitled"}
          </h3>
          {ep?.series_code && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-accent/20 text-accent-foreground font-medium">
              {ep.brand} · {ep.series_code} {ep.series_name || ""}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          {brief?.audience || preset.description || ""}
        </p>
        {brief?.working_title && (
          <span className="text-xs text-muted-foreground/70 italic">
            "{brief.working_title}"
          </span>
        )}
      </div>

      {/* Episode Info */}
      {ep && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">장면</span>
            </div>
            <p className="text-xs text-foreground">{ep.scene}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">시간 / 계절</span>
            </div>
            <p className="text-xs text-foreground">{ep.time_of_day} · {ep.season}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Cloud className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">날씨</span>
            </div>
            <p className="text-xs text-foreground">{ep.weather}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Heart className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">감정</span>
            </div>
            <p className="text-xs text-foreground">{ep.emotion_primary}</p>
            <p className="text-xs text-muted-foreground">{ep.emotion_secondary}</p>
          </div>
        </div>
      )}

      {/* Sonic details */}
      {ep && (ep.instrument_hints?.length > 0 || ep.sonic_keywords?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ep.instrument_hints?.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs font-medium text-muted-foreground">악기 힌트</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {ep.instrument_hints.map((h, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{h}</span>
                ))}
              </div>
            </div>
          )}
          {ep.sonic_keywords?.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs font-medium text-muted-foreground">소닉 키워드</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {ep.sonic_keywords.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-secondary/10 text-secondary">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tempo & Groove */}
      {ep && (ep.tempo_feel || ep.groove_profile) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ep.tempo_feel && (
            <div className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs font-medium text-muted-foreground">템포</span>
              <p className="text-xs text-foreground mt-1">{ep.tempo_feel}</p>
            </div>
          )}
          {ep.groove_profile && (
            <div className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs font-medium text-muted-foreground">그루브</span>
              <p className="text-xs text-foreground mt-1">{ep.groove_profile}</p>
            </div>
          )}
        </div>
      )}

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
