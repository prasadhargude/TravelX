"use client"

import { useRef, useEffect, useState } from "react"
import VoiceAssistant from "./VoiceAssistant"
import { Camera, SwitchCamera, Circle, AlertCircle, Info } from "lucide-react"

function CameraFeed({ onCapture, cameraMode, setCameraMode }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] = useState("prompt")

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: "camera" })
          setPermissionState(result.state)

          result.addEventListener("change", () => {
            console.log("[v0] Camera permission changed to:", result.state)
            setPermissionState(result.state)

            if (result.state === "granted") {
              startCamera()
            } else if (result.state === "denied") {
              setPermissionGranted(false)
              setError({
                type: "permission",
                message: "Camera Permission Required",
                details:
                  "You must allow camera access for this app to work. Look for the camera icon in your browser's address bar.",
              })
            }
          })
        }
      } catch (err) {
        console.log("[v0] Permissions API not supported:", err)
      }
    }

    checkPermission()
  }, [])

  useEffect(() => {
    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraMode])

  const startCamera = async () => {
    try {
      console.log("[v0] Starting camera with mode:", cameraMode)
      setError(null)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraMode === "inside" ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      console.log("[v0] Camera stream obtained successfully")
      setStream(mediaStream)
      setPermissionGranted(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("[v0] Camera error:", err.name, err.message)
      setPermissionGranted(false)

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError({
          type: "permission",
          message: "Camera Permission Required",
          details:
            "You must allow camera access for this app to work. Look for the camera icon in your browser's address bar.",
        })
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError({
          type: "notfound",
          message: "No Camera Found",
          details: "Please connect a camera device and click Retry.",
        })
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError({
          type: "inuse",
          message: "Camera Already In Use",
          details: "Please close other applications using the camera and click Retry.",
        })
      } else {
        setError({
          type: "unknown",
          message: "Camera Error",
          details: err.message || "An unknown error occurred. Please try again.",
        })
      }
    }
  }

  const captureFrame = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageUrl = canvas.toDataURL("image/jpeg", 0.9)
    onCapture(imageUrl, cameraMode)
  }

  const handleVoiceCapture = (mode) => {
    setCameraMode(mode)
    setTimeout(() => captureFrame(), 500)
  }

  const toggleCameraMode = () => {
    setCameraMode((prev) => (prev === "inside" ? "outside" : "inside"))
  }

  return (
    <div className="relative h-full flex flex-col bg-background">
      <div className="relative border-b border-primary/30 bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${cameraMode === "inside" ? "bg-neon-cyan" : "bg-accent"}`}
              ></div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">Camera View</span>
                <span className="text-base font-bold tracking-wide text-foreground uppercase">
                  {cameraMode === "inside" ? "Inside Car" : "Outside Car"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleCameraMode}
              className="px-4 py-2 rounded-md bg-muted border border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-colors flex items-center gap-2"
              title="Switch camera view"
            >
              <SwitchCamera size={18} className="text-primary" />
              <span className="text-xs font-mono text-foreground">SWITCH</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        {permissionGranted ? (
          <div className="relative w-full h-full">
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/60"></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/60"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary/60"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/60"></div>

            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/40">
              <Circle size={8} className="text-red-500 fill-red-500" />
              <span className="text-xs font-mono text-foreground tracking-wider">RECORDING</span>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-primary/40">
              <div className="flex items-center gap-6 text-xs font-mono">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Voice Commands:</span>
                  <div className="flex gap-4">
                    <span className="text-neon-cyan">"Hey Tata, take a selfie"</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-accent">"Hey Tata, capture outside"</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-primary/30"></div>
                <div className="flex gap-3 items-center">
                  <span className="text-muted-foreground">Gestures:</span>
                  <span className="text-lg">✌️</span>
                  <span className="text-lg">👍</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center max-w-2xl">
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-destructive/10 border-4 border-destructive/40 flex items-center justify-center animate-pulse">
                {error ? (
                  <AlertCircle size={56} className="text-destructive" />
                ) : (
                  <Camera size={56} className="text-primary" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-wide uppercase">
                {error ? error.message : "Camera Access Required"}
              </h2>

              <p className="text-base text-muted-foreground mb-8">
                {error ? error.details : "Enable camera to capture moments"}
              </p>

              {error && error.type === "permission" && (
                <div className="mb-8 p-6 bg-destructive/5 rounded-xl border-2 border-destructive/30 text-left">
                  <div className="flex items-start gap-3 mb-4">
                    <Info size={24} className="text-destructive flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">
                        Camera Access Blocked
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your browser is blocking camera access. Follow these steps to enable it:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 ml-9">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Look at your browser's address bar</p>
                        <p className="text-xs text-muted-foreground">
                          Find the camera icon (🎥) or lock icon (🔒) next to the URL
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Click the camera icon</p>
                        <p className="text-xs text-muted-foreground">
                          A dropdown menu will appear showing camera permissions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Select "Allow" for camera</p>
                        <p className="text-xs text-muted-foreground">
                          Change the camera permission from "Block" to "Allow"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">4</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Click "Retry Camera" below</p>
                        <p className="text-xs text-muted-foreground">
                          The camera should now work. If not, try refreshing the page.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-primary/20">
                    <p className="text-xs font-mono text-muted-foreground">
                      <span className="font-bold text-foreground">Still not working?</span> Try refreshing the page (F5)
                      or restarting your browser. Make sure no other app is using your camera.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={startCamera}
                className="px-12 py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg tracking-wider hover:bg-primary/90 transition-all hover:scale-105 shadow-lg"
              >
                {error ? "🔄 RETRY CAMERA" : "📷 ENABLE CAMERA"}
              </button>

              {error && error.type === "permission" && (
                <p className="mt-6 text-xs text-muted-foreground">
                  After allowing camera access, click the button above
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative border-t border-primary/30 bg-card">
        <div className="px-6 py-5 flex items-center justify-center gap-6">
          <VoiceAssistant onVoiceCommand={handleVoiceCapture} />

          <button
            onClick={captureFrame}
            disabled={!permissionGranted}
            className="relative w-16 h-16 rounded-full bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-4 border-background shadow-lg"
          >
            <Camera size={28} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CameraFeed
