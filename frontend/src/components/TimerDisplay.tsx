import type { SessionState } from "@/types/session";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const TimerDisplay = ({ seconds, state }: { seconds: number; state: SessionState }) => {
  const isLow = seconds <= 60 && seconds > 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`font-mono text-7xl font-bold tracking-wider transition-all ${
          state === "paused"
            ? "text-muted-foreground"
            : isLow
            ? "text-destructive animate-countdown-pulse"
            : "text-foreground text-glow"
        }`}
      >
        {formatTime(seconds)}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        {state === "paused" ? "Paused" : state === "active" ? "Studying" : "—"}
      </div>
    </div>
  );
};

export default TimerDisplay;
