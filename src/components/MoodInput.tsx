import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, ImageIcon, Mic, X, MicOff } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGES = 20;

interface ImageItem {
  file: File;
  preview: string;
}

interface MoodInputProps {
  onSubmit: (mood: string, imagesBase64?: string[]) => void;
  isLoading: boolean;
}

const MoodInput = ({ onSubmit, isLoading }: MoodInputProps) => {
  const [mood, setMood] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = async () => {
    const fullMood = [mood, transcript].filter(Boolean).join("\n");
    if (!fullMood.trim() && images.length === 0) return;

    let imagesBase64: string[] | undefined;
    if (images.length > 0) {
      imagesBase64 = await Promise.all(images.map((img) => fileToBase64(img.file)));
    }

    onSubmit(fullMood || "이미지 기반 무드 분석", imagesBase64);
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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`최대 ${MAX_IMAGES}개까지 업로드할 수 있습니다.`);
      return;
    }

    const validFiles: ImageItem[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: 이미지 파일만 업로드할 수 있습니다.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: 5MB 이하의 이미지만 업로드할 수 있습니다.`);
        continue;
      }
      validFiles.push({ file, preview: URL.createObjectURL(file) });
    }

    if (files.length > remaining) {
      toast.warning(`최대 ${MAX_IMAGES}개까지만 업로드 가능합니다. ${remaining}개만 추가됩니다.`);
    }

    setImages((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
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
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          toast.success("음성 녹음이 완료되었습니다!");
        }
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setTranscript((prev) => prev + (prev ? "\n" : "") + `[음성 녹음 포함 - ${sizeMB}MB]`);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("녹음 중... 다시 클릭하면 중지됩니다.");

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
            setTranscript((prev) => (prev ? prev + " " + finalTranscript : finalTranscript));
          }
        };

        recognition.onerror = () => {};
        recognition.start();

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

  const hasInput = mood.trim() || transcript.trim() || images.length > 0;

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

          <Textarea
            placeholder="당신의 무드를 설명해주세요... 감정, 상황, 분위기, 장면 등 자유롭게 표현해보세요."
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="min-h-[120px] bg-input/50 border-border focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground relative z-10"
          />

          {/* Voice transcript */}
          {transcript && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-primary flex items-center gap-1">
                  <Mic className="w-3 h-3" /> 음성 인식 결과
                </span>
                <button onClick={() => setTranscript("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          )}

          {/* Image previews */}
          {images.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  이미지 {images.length}/{MAX_IMAGES}
                </span>
                <button
                  onClick={removeAllImages}
                  className="text-xs text-destructive hover:underline"
                >
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Mood ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-destructive-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input type buttons */}
          <div className="flex items-center gap-2 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-4 h-4" />
              이미지 업로드 {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
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
