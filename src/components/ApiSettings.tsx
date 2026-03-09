import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface ApiConfig {
  provider: "lovable" | "openai" | "google";
  apiKey: string;
  model: string;
}

const PROVIDER_MODELS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  lovable: {
    label: "Lovable Cloud (기본)",
    models: [
      { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (기본)" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
  },
  openai: {
    label: "OpenAI",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
  },
  google: {
    label: "Google AI (Gemini)",
    models: [
      { value: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ],
  },
};

const STORAGE_KEY = "mood-to-suno-api-config";

export function getApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { provider: "lovable", apiKey: "", model: "google/gemini-3-flash-preview" };
}

const ApiSettings = () => {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<string>("lovable");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const config = getApiConfig();
    setProvider(config.provider);
    setApiKey(config.apiKey);
    setModel(config.model);
  }, [open]);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setModel(PROVIDER_MODELS[value].models[0].value);
    if (value === "lovable") setApiKey("");
  };

  const handleSave = () => {
    if (provider !== "lovable" && !apiKey.trim()) {
      toast.error("API 키를 입력해주세요.");
      return;
    }
    const config: ApiConfig = { provider: provider as ApiConfig["provider"], apiKey, model };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast.success("API 설정이 저장되었습니다.");
    setOpen(false);
  };

  const currentProvider = PROVIDER_MODELS[provider];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">API 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Provider */}
          <div className="space-y-2">
            <Label>AI 제공자</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_MODELS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          {provider !== "lovable" && (
            <div className="space-y-2">
              <Label>API 키</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === "openai" ? "sk-..." : "AIza..."}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                키는 브라우저 로컬 저장소에만 저장되며 서버에 저장되지 않습니다.
              </p>
            </div>
          )}

          {/* Model */}
          <div className="space-y-2">
            <Label>모델</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiSettings;
