import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { sessionApi, emotionApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import TimerDisplay from "@/components/TimerDisplay";
import TopicInfo from "@/components/TopicInfo";
import DashboardControls from "@/components/DashboardControls";
import BreakModal from "@/components/BreakModal";
import WebcamCapture from "@/components/WebcamCapture";

const DashboardPage = () => {

  const navigate = useNavigate();

  const {
    currentTopic,
    setCurrentTopic,
    remainingSeconds,
    setRemainingSeconds,
    sessionState,
    setSessionState,
    breakModalOpen,
    setBreakModalOpen,
    emotionMonitoringEnabled,
    setEmotionStatus,
    isOnBreak                 // 🔥 NEW
  } = useSession();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDetectingRef = useRef(false);

  // -----------------------------
  // FETCH CURRENT TOPIC
  // -----------------------------
  const fetchCurrent = useCallback(async () => {
    try {
      const { data } = await sessionApi.getCurrent();
      setCurrentTopic(data.topic);
      setRemainingSeconds(data.timer_remaining_seconds);
      setSessionState("active");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        navigate("/summary");
      } else {
        toast({
          title: "Error",
          description: "Failed to load session",
          variant: "destructive",
        });
        navigate("/setup");
      }
    }
  }, [navigate, setCurrentTopic, setRemainingSeconds, setSessionState]);

  useEffect(() => {
    fetchCurrent();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchCurrent]);

  // -----------------------------
  // TIMER LOOP
  // -----------------------------
  useEffect(() => {

    if (timerRef.current) clearInterval(timerRef.current);

    if (sessionState === "active" && !isOnBreak) {

      timerRef.current = setInterval(() => {

        setRemainingSeconds((prev) => {

          if (prev <= 1) {
            handleDone();
            return 0;
          }

          return prev - 1;

        });

      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

  }, [sessionState, isOnBreak]);

  // -----------------------------
  // FSM SAFE COMPLETE
  // -----------------------------
  const handleDone = async () => {
    try {

      const { data } = await sessionApi.completeTopic(true);

      if (data?.session_complete) {
        navigate("/summary");
        return;
      }

      await fetchCurrent();

    } catch {
      toast({
        title: "Error",
        description: "Failed to complete topic",
        variant: "destructive"
      });
    }
  };

  const handleSkip = async () => {
    try {

      const { data } = await sessionApi.completeTopic(false);

      if (data?.session_complete) {
        navigate("/summary");
        return;
      }

      await fetchCurrent();

    } catch {
      toast({
        title: "Error",
        description: "Failed to skip topic",
        variant: "destructive"
      });
    }
  };

  const handlePause = async () => {
    try {
      await sessionApi.pause();
      setSessionState("paused");
    } catch {
      toast({ title: "Error", description: "Failed to pause", variant: "destructive" });
    }
  };

  const handleResume = async () => {
    try {
      await sessionApi.resume();
      setSessionState("active");
    } catch {
      toast({ title: "Error", description: "Failed to resume", variant: "destructive" });
    }
  };

  const handleEnd = async () => {
    try {
      await sessionApi.delete();
      navigate("/setup");
    } catch {
      toast({ title: "Error", description: "Failed to end session", variant: "destructive" });
    }
  };

  // -----------------------------
  // SAFE EMOTION HANDLER
  // -----------------------------
  const handleEmotionCheck = useCallback(async (blob: Blob) => {

    if (!emotionMonitoringEnabled) return;
    if (isOnBreak) return;               // 🔥 STOP DURING BREAK
    if (isDetectingRef.current) return;

    isDetectingRef.current = true;

    try {

      setEmotionStatus("Detecting...");

      const detectRes = await emotionApi.detect(blob);

      if (detectRes?.data?.emotion) {
        setEmotionStatus(detectRes.data.emotion);
      }

      const { data } = await emotionApi.getStatus();

      if (data.trigger_ready) {
        setBreakModalOpen(true);
      }

    } catch (err) {
      console.error("Emotion API error:", err);
      setEmotionStatus("API Issue");
    } finally {
      isDetectingRef.current = false;
    }

  }, [emotionMonitoringEnabled, isOnBreak, setEmotionStatus, setBreakModalOpen]);

  if (!currentTopic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse-slow font-mono">
          Loading session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">

      {/* 🔥 CAMERA NOW DISABLED DURING BREAK */}
      <WebcamCapture
        onCapture={handleEmotionCheck}
        intervalMs={3000}
        active={sessionState === "active" && emotionMonitoringEnabled && !isOnBreak}
      />

      <div className="w-full max-w-lg space-y-8">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Mind<span className="text-primary">Track</span>
          </h1>
        </div>

        <TopicInfo topic={currentTopic} />

        <TimerDisplay
          seconds={remainingSeconds}
          state={sessionState}
        />

        <DashboardControls
          state={sessionState}
          onPause={handlePause}
          onResume={handleResume}
          onDone={handleDone}
          onSkip={handleSkip}
          onEnd={handleEnd}
        />

      </div>

      <BreakModal
        open={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        onBreakEnd={fetchCurrent}
      />

    </div>
  );
};

export default DashboardPage;
