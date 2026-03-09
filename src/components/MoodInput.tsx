import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Music, ImageIcon, Mic, X, Upload, MicOff } from "lucide-react";
import { toast } from "sonner";

interface MoodInputProps {
  onSubmit: (mood: string, imageBase64?: string) => void;
  isLoading: boolean;
}

const MoodInput = ({ onSubmit, isLoading }: MoodInputProps) => {
  const [mood, setMood] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = async () => {
    const fullMood = [mood, transcript].filter(Boolean).join("\n");
    if (!fullMood.trim() && !imageFile) return;

    let imageBase64: string | undefined;
    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }

    onSubmit(fullMood || "이미지 기반 무드 분석", imageBase64);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("5MB 이하의 이미지만 업로드할 수 있습니다.");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Use Web Speech API for transcription
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          toast.success("음성 녹음이 완료되었습니다!");
        }

        // Convert audio blob to text description as fallback
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setTranscript(
          (prev) =>
            prev +
            (prev ? "\n" : "") +
            `[음성 녹음 포함 - ${sizeMB}MB]`
        );
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("녹음 중... 다시 클릭하면 중지됩니다.");

      // Use Web Speech API for real-time transcription
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript((prev) =>
              prev ? prev + " " + finalTranscript : finalTranscript
            );
          }
        };

        recognition.onerror = () => {
          // Speech recognition not critical, continue
        };

        recognition.start();

        // Stop recognition when recording stops
        const originalStop = mediaRecorder.onstop;
        mediaRecorder.onstop = (e) => {
          recognition.stop();
          if (originalStop) (originalStop as any).call(mediaRecorder, e);
        };
      }
    } catch {
      toast.error("마이크 접근이 거부되었습니다.");
    }
  };

  const exampleMoods = [
    "비 오는 새벽, 창가에서 커피 한 잔",
    "여름 밤 해변에서의 파티",
    "우울하고 몽환적인 밤거리",
    "에너지 넘치는 아침 운동",
  ];

  const hasInput = mood.trim() || transcript.trim() || imageFile;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card-glass rounded-2xl p-6 glow-border relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              무드 입력
            </h2>
          </div>

          {/* Text Input */}
          <Textarea
            placeholder="당신의 무드를 설명해주세요... 감정, 상황, 분위기, 장면 등 자유롭게 표현해보세요."
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="min-h-[120px] bg-input/50 border-border focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground relative z-10"
          />

          {/* Voice transcript display */}
          {transcript && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-primary flex items-center gap-1">
                  <Mic className="w-3 h-3" /> 음성 인식 결과
                </span>
                <button
                  onClick={() => setTranscript("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Uploaded mood"
                className="w-32 h-32 object-cover rounded-lg border border-border"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </div>
          )}

          {/* Input type buttons */}
          <div className="flex items-center gap-2 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              이미지 업로드
            </button>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                isRecording
                  ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 animate-pulse" /> 녹음 중지
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> 음성 녹음
                </>
              )}
            </button>
          </div>

          {/* Example moods */}
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
            disabled={!hasInput || isLoading}
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
    </div>
  );
};

export default MoodInput;
