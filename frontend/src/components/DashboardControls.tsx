import { Pause, Play, Check, SkipForward, Square, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionState } from "@/types/session";
import { useSession } from "@/context/SessionContext";

interface Props {
  state: SessionState;
  onPause: () => void;
  onResume: () => void;
  onDone: () => void;
  onSkip: () => void;
  onEnd: () => void;
}

const DashboardControls = ({
  state,
  onPause,
  onResume,
  onDone,
  onSkip,
  onEnd
}: Props) => {

  const {
    emotionMonitoringEnabled,
    setEmotionMonitoringEnabled,
    emotionStatus
  } = useSession();

  const getStatusColor = () => {

    if (!emotionMonitoringEnabled) return "bg-muted text-muted-foreground";

    if (emotionStatus === "No Camera")
      return "bg-warning/20 text-warning";

    if (emotionStatus === "API Issue")
      return "bg-destructive/20 text-destructive";

    return "bg-primary/20 text-primary";
  };

  return (
    <div className="space-y-3">

      {/* 🔥 EMOTION MONITOR TOGGLE */}
      <div className="flex justify-end">

        <button
          onClick={() => setEmotionMonitoringEnabled(!emotionMonitoringEnabled)}
          className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md border transition-all ${getStatusColor()}`}
        >
          <Camera className="w-3 h-3" />
          {emotionMonitoringEnabled
            ? emotionStatus || "Monitoring"
            : "OFF"}
        </button>

      </div>

      {/* MAIN CONTROLS */}
      <div className="flex gap-3">
        {state === "active" ? (
          <Button
            onClick={onPause}
            variant="outline"
            className="flex-1 h-12 border-border text-foreground hover:bg-muted"
          >
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
        ) : (
          <Button
            onClick={onResume}
            className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            <Play className="w-4 h-4 mr-2" /> Resume
          </Button>
        )}

        <Button
          onClick={onDone}
          className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Check className="w-4 h-4 mr-2" /> Done
        </Button>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-10 border-border text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="w-4 h-4 mr-2" /> Skip
        </Button>

        <Button
          onClick={onEnd}
          variant="outline"
          className="flex-1 h-10 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <Square className="w-4 h-4 mr-2" /> End
        </Button>
      </div>

    </div>
  );
};

export default DashboardControls;
