import { Palette, Music2, Zap, Heart } from "lucide-react";

export interface MoodPresetData {
  name: string;
  description: string;
  genres: string[];
  tempo: string;
  energy: string;
  mood_tags: string[];
  color_palette: string[];
}

interface MoodPresetProps {
  preset: MoodPresetData;
}

const MoodPreset = ({ preset }: MoodPresetProps) => {
  return (
    <div className="card-glass rounded-2xl p-6 glow-border fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-2xl font-bold gradient-text">
            {preset.name}
          </h3>
          <p className="text-muted-foreground mt-1">{preset.description}</p>
        </div>
        <div
          className="flex gap-1 rounded-lg overflow-hidden"
          title="Color Palette"
        >
          {preset.color_palette.map((color, idx) => (
            <div
              key={idx}
              className="w-6 h-6"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Music2 className="w-4 h-4" />
            <span className="text-xs font-medium">장르</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {preset.genres.map((genre, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium">템포</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {preset.tempo}
          </span>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">에너지</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {preset.energy}
          </span>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-pink-400 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-xs font-medium">무드</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {preset.mood_tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-md bg-pink-500/10 text-pink-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodPreset;
