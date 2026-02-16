import { useState, useEffect, useRef, useCallback } from "react";
import { rescheduleApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Coffee, Play, Plus } from "lucide-react";
import { useSession } from "@/context/SessionContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onBreakEnd: () => void;
}

const BreakModal = ({ open, onClose, onBreakEnd }: Props) => {

  const [onBreak, setOnBreak] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakActiveRef = useRef(false);

  const {
    setIsOnBreak,
    setSessionState,
    setEmotionStatus
  } = useSession();

  // -----------------------------
  // START BREAK
  // -----------------------------
  const startBreak = () => {

    breakActiveRef.current = true;

    setBreakSeconds(5 * 60);
    setOnBreak(true);

    setIsOnBreak(true);
    setSessionState("paused");
    setEmotionStatus("BREAK");
  };

  // -----------------------------
  // END BREAK
  // -----------------------------
  const endBreak = useCallback(async () => {

    breakActiveRef.current = false;

    if (timerRef.current)
      clearInterval(timerRef.current);

    try {
      await rescheduleApi.trigger();
      await onBreakEnd();
    } catch {
      toast({
        title: "Error",
        description: "Failed to reschedule",
        variant: "destructive"
      });
    }

    setOnBreak(false);
    setIsOnBreak(false);
    setSessionState("active");
    setEmotionStatus("Monitoring");

    onClose();

  }, [onBreakEnd, onClose]);

  // -----------------------------
  // SAFE BREAK TIMER
  // -----------------------------
  useEffect(() => {

    if (!onBreak || !breakActiveRef.current) return;

    timerRef.current = setInterval(() => {

      setBreakSeconds(prev => {

        if (prev <= 1) {
          endBreak();
          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => {
      if (timerRef.current)
        clearInterval(timerRef.current);
    };

  }, [onBreak, endBreak]);

  if (!open && !onBreak) return null;

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // -----------------------------
  // BREAK SCREEN
  // -----------------------------
  if (onBreak) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="text-center space-y-8">
          <Coffee className="w-16 h-16 text-primary mx-auto animate-pulse-slow" />
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Take a breather
            </h2>
            <p className="text-muted-foreground">
              Relax, stretch, hydrate.
            </p>
          </div>
          <div className="font-mono text-6xl font-bold text-foreground text-glow">
            {formatTime(breakSeconds)}
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={endBreak}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="w-4 h-4 mr-2" /> End Break
            </Button>
            <Button
              variant="outline"
              onClick={() => setBreakSeconds(p => p + 60)}
              className="border-border text-muted-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> 1 min
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // MODAL
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
        <Coffee className="w-12 h-12 text-warning mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Feeling fatigued?
          </h2>
          <p className="text-muted-foreground text-sm">
            We detected signs of fatigue. A short break might help you focus better.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border text-muted-foreground"
          >
            Continue
          </Button>
          <Button
            onClick={startBreak}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Take a Break
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BreakModal;
