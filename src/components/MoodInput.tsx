import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, ImageIcon, Mic, X, MicOff, FileText, Video, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MAX_FILES = 20;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

interface MediaItem {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface MoodInputProps {
  onSubmit: (mood: string, imagesBase64?: string[], withLyrics?: boolean) => void;
  isLoading: boolean;
}

const MoodInput = ({ onSubmit, isLoading }: MoodInputProps) => {
  const [mood, setMood] = useState("");
  const [withLyrics, setWithLyrics] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const dragCounterRef = useRef(0);

  const handleSubmit = async () => {
    const fullMood = [mood, transcript].filter(Boolean).join("\n");
    if (!fullMood.trim() && mediaFiles.length === 0) return;

    let imagesBase64: string[] | undefined;
    if (mediaFiles.length > 0) {
      imagesBase64 = await Promise.all(mediaFiles.map((item) => fileToBase64(item.file)));
    }

    onSubmit(fullMood || "미디어 기반 무드 분석", imagesBase64, withLyrics);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback((files: File[]) => {
    if (!files.length) return;

    const remaining = MAX_FILES - mediaFiles.length;
    if (remaining <= 0) {
      toast.error(`최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
      return;
    }

    const validFiles: MediaItem[] = [];
    for (const file of files.slice(0, remaining)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name}: 이미지 또는 동영상 파일만 업로드할 수 있습니다.`);
        continue;
      }

      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      const maxLabel = isVideo ? "50MB" : "5MB";
      if (file.size > maxSize) {
        toast.error(`${file.name}: ${maxLabel} 이하의 파일만 업로드할 수 있습니다.`);
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
      });
    }

    if (files.length > remaining) {
      toast.warning(`최대 ${MAX_FILES}개까지만 업로드 가능합니다. ${remaining}개만 추가됩니다.`);
    }

    setMediaFiles((prev) => [...prev, ...validFiles]);
  }, [mediaFiles.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  const removeFile = (index: number) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeAllFiles = () => {
    mediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    setMediaFiles([]);
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

  const hasInput = mood.trim() || transcript.trim() || mediaFiles.length > 0;
  const imageCount = mediaFiles.filter((f) => f.type === "image").length;
  const videoCount = mediaFiles.filter((f) => f.type === "video").length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`card-glass rounded-2xl p-6 glow-border relative transition-all duration-200 ${
          isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 rounded-2xl bg-primary/10 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-primary">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="w-10 h-10 animate-bounce" />
              <p className="font-semibold text-lg">이미지 또는 동영상을 놓으세요</p>
              <p className="text-sm text-muted-foreground">최대 {MAX_FILES}개, 이미지 5MB / 동영상 50MB</p>
            </div>
          </div>
        )}

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

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  미디어 {mediaFiles.length}/{MAX_FILES}
                  {imageCount > 0 && ` (이미지 ${imageCount})`}
                  {videoCount > 0 && ` (동영상 ${videoCount})`}
                </span>
                <button
                  onClick={removeAllFiles}
                  className="text-xs text-destructive hover:underline"
                >
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {item.type === "image" ? (
                      <img
                        src={item.preview}
                        alt={`Mood ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="relative w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                        <video
                          src={item.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                          <Video className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
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
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= MAX_FILES}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-4 h-4" />
              미디어 업로드 {mediaFiles.length > 0 && `(${mediaFiles.length}/${MAX_FILES})`}
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

          {/* Drag & drop hint */}
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <Upload className="w-3 h-3" /> 이미지/동영상을 드래그하여 놓을 수도 있습니다
          </p>

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

          {/* Lyrics toggle */}
          <div className="flex items-center justify-between mt-5 p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <Label htmlFor="lyrics-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                가사 포함 생성
              </Label>
              <span className="text-xs text-muted-foreground">
                프롬프트와 함께 가사를 생성합니다
              </span>
            </div>
            <Switch
              id="lyrics-toggle"
              checked={withLyrics}
              onCheckedChange={setWithLyrics}
            />
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
