import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/context/SessionContext";

interface Props {
  onCapture: (blob: Blob) => void;
  intervalMs: number;
  active: boolean;
}

const WebcamCapture = ({ onCapture, intervalMs, active }: Props) => {

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setEmotionStatus } = useSession();

  useEffect(() => {

    if (!active) {
      setEmotionStatus("OFF");
      return;
    }

    const startCapture = async () => {

      try {

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        toast({ title: "📷 Camera Started" });
        setEmotionStatus("Camera Active");

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        intervalRef.current = setInterval(() => {

          if (!videoRef.current || !canvasRef.current) {
            setEmotionStatus("Capture Fail");
            return;
          }

          const canvas = canvasRef.current;
          const video = videoRef.current;

          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            setEmotionStatus("Canvas Fail");
            return;
          }

          ctx.drawImage(video, 0, 0);

          canvas.toBlob((blob) => {

            if (!blob) {
              setEmotionStatus("Blob Fail");
              return;
            }

            toast({ title: "📸 Image Sent" });
            setEmotionStatus("Sending...");

            onCapture(blob);

          }, "image/jpeg", 0.7);

        }, intervalMs);

      } catch (err: any) {

        console.error("Camera error:", err);

        toast({
          title: "❌ Camera Not Available",
          description: "Permission denied or no webcam",
          variant: "destructive"
        });

        setEmotionStatus("No Camera");

      }
    };

    startCapture();

    return () => {

      if (intervalRef.current)
        clearInterval(intervalRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

    };

  }, [active]);

  return (
    <>
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default WebcamCapture;
