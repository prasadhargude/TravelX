"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff } from "lucide-react"

function VoiceAssistant({ onVoiceCommand }) {
  const [isListening, setIsListening] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.warn("Speech recognition not supported")
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setPermissionGranted(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()
      console.log("Voice command:", transcript)

      if (transcript.includes("hey tata")) {
        if (transcript.includes("selfie") || transcript.includes("inside")) {
          onVoiceCommand("inside")
        } else if (transcript.includes("outside") || transcript.includes("capture outside")) {
          onVoiceCommand("outside")
        }
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onVoiceCommand])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  return (
    <button
      onClick={toggleListening}
      className={`relative p-5 rounded-full transition-all border-2 ${
        isListening
          ? "bg-accent/20 text-accent border-accent animate-neon-pulse"
          : "bg-muted/50 text-muted-foreground border-primary/20 hover:border-primary/50 hover:bg-primary/10"
      }`}
      title={isListening ? "Listening..." : "Start voice commands"}
    >
      {isListening ? (
        <>
          <Mic size={24} className="drop-shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
        </>
      ) : (
        <MicOff size={24} />
      )}
    </button>
  )
}

export default VoiceAssistant
