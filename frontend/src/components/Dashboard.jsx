"use client"

import { useState, useCallback } from "react"
import CameraFeed from "./CameraFeed"
import MomentsFeed from "./MomentsFeed"
import PreviewModal from "./PreviewModal"
import SocialConnections from "./SocialConnections"
import Settings from "./Settings"
import { Camera, Grid3x3, SettingsIcon, Share2 } from "lucide-react"

function Dashboard() {
  const [moments, setMoments] = useState([])
  const [previewMoment, setPreviewMoment] = useState(null)
  const [activeTab, setActiveTab] = useState("camera")
  const [cameraMode, setCameraMode] = useState("inside")
  const [socialConnections, setSocialConnections] = useState({
    instagram: false,
    facebook: false,
    linkedin: false,
  })

  const handleCapture = useCallback(
    (imageUrl, category) => {
      const newMoment = {
        id: Date.now().toString(),
        category: category || cameraMode,
        timestamp: new Date().toISOString(),
        imageUrl,
        caption: generateAutoCaption(category || cameraMode),
        posted: false,
        postedPlatforms: [],
      }
      setPreviewMoment(newMoment)
    },
    [cameraMode],
  )

  const generateAutoCaption = (category) => {
    const model = "Harrier"
    const captions = {
      inside: [
        `Cruising in style 🚗 #MomentsWith${model}`,
        `Road trip vibes ✨ #MomentsWith${model}`,
        `Living my best life 🌟 #MomentsWith${model}`,
      ],
      outside: [
        `Golden hour magic 🌅 #MomentsWith${model}`,
        `Adventure awaits 🏔️ #MomentsWith${model}`,
        `Scenic routes only 🛣️ #MomentsWith${model}`,
      ],
    }
    const options = captions[category] || captions.inside
    return options[Math.floor(Math.random() * options.length)]
  }

  const handleSaveMoment = (moment) => {
    setMoments((prev) => [moment, ...prev])
    setPreviewMoment(null)
  }

  const handleDiscardMoment = () => {
    setPreviewMoment(null)
  }

  const handlePostMoment = (moment, platforms) => {
    const updatedMoment = {
      ...moment,
      posted: true,
      postedPlatforms: platforms,
    }
    setMoments((prev) => [updatedMoment, ...prev])
    setPreviewMoment(null)
  }

  const tabs = [
    { id: "camera", label: "Camera", icon: Camera },
    { id: "moments", label: "Moments", icon: Grid3x3 },
    { id: "social", label: "Social", icon: Share2 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-20 bg-card border-r border-primary/30 flex flex-col items-center py-6 gap-6">
        <div className="relative flex flex-col items-center">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="35" width="80" height="8" fill="url(#neonGradient)" rx="2" />
            <rect x="20" y="45" width="15" height="25" fill="url(#neonGradient)" rx="2" />
            <rect x="42.5" y="45" width="15" height="25" fill="url(#neonGradient)" rx="2" />
            <rect x="65" y="45" width="15" height="25" fill="url(#neonGradient)" rx="2" />
            <rect x="10" y="72" width="80" height="6" fill="url(#neonGradient)" rx="2" />
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" />
                <stop offset="50%" stopColor="#00ffcc" />
                <stop offset="100%" stopColor="#ff6b35" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-[9px] text-accent font-bold tracking-widest text-center mt-1.5">MOMENTS</div>
        </div>

        <div className="flex-1 flex flex-col gap-4 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
                title={tab.label}
              >
                <Icon size={20} />
                {activeTab === tab.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r"></div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
          <span className="text-[8px] text-muted-foreground font-mono">LIVE</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "camera" && (
          <CameraFeed onCapture={handleCapture} cameraMode={cameraMode} setCameraMode={setCameraMode} />
        )}
        {activeTab === "moments" && <MomentsFeed moments={moments} onMomentClick={setPreviewMoment} />}
        {activeTab === "social" && (
          <SocialConnections connections={socialConnections} setConnections={setSocialConnections} />
        )}
        {activeTab === "settings" && <Settings />}
      </div>

      {/* Preview Modal */}
      {previewMoment && (
        <PreviewModal
          moment={previewMoment}
          onSave={handleSaveMoment}
          onDiscard={handleDiscardMoment}
          onPost={handlePostMoment}
          socialConnections={socialConnections}
        />
      )}
    </div>
  )
}

export default Dashboard
