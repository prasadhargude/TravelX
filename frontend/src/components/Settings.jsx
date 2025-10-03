"use client"

import { Camera, Hand, Mic, Palette } from "lucide-react"

function Settings() {
  return (
    <div className="h-full bg-card p-6 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Camera Settings */}
        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Camera className="text-primary" size={24} />
            <h2 className="text-xl font-semibold">Camera</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Default camera mode</span>
              <select className="bg-background rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Inside</option>
                <option>Outside</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span>Image quality</span>
              <select className="bg-background rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>
        </div>

        {/* Gesture Settings */}
        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Hand className="text-accent" size={24} />
            <h2 className="text-xl font-semibold">Gesture Detection</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Enable gesture capture</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <span>Thumbs up gesture</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <span>Peace sign gesture</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="text-secondary" size={24} />
            <h2 className="text-xl font-semibold">Voice Commands</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Enable voice commands</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <span>Wake word</span>
              <input
                type="text"
                defaultValue="Hey Tata"
                className="bg-background rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </div>

        {/* Caption Settings */}
        <div className="bg-muted rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="text-primary" size={24} />
            <h2 className="text-xl font-semibold">Captions</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Auto-generate captions</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <span>Caption style</span>
              <select className="bg-background rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Gen Z</option>
                <option>Professional</option>
                <option>Casual</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span>Car model for hashtags</span>
              <input
                type="text"
                defaultValue="Harrier"
                className="bg-background rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
