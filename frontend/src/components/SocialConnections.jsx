"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"

function SocialConnections({ connections, setConnections }) {
  const [connecting, setConnecting] = useState(null)

  const platforms = [
    { id: "instagram", name: "Instagram", color: "from-purple-500 to-pink-500" },
    { id: "facebook", name: "Facebook", color: "from-blue-600 to-blue-400" },
    { id: "linkedin", name: "LinkedIn", color: "from-blue-700 to-blue-500" },
  ]

  const toggleConnection = async (platformId) => {
    if (!connections[platformId]) {
      setConnecting(platformId)
      // Simulate OAuth flow delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setConnections((prev) => ({ ...prev, [platformId]: true }))
      setConnecting(null)
    } else {
      setConnections((prev) => ({ ...prev, [platformId]: false }))
    }
  }

  return (
    <div className="h-full bg-card p-6 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6">Social Connections</h1>
      <p className="text-muted-foreground mb-8">
        Connect your social media accounts to post moments directly from the dashboard.
      </p>

      <div className="grid gap-6 max-w-2xl">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-muted rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color}`} />
              <div>
                <h3 className="text-xl font-semibold">{platform.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  {connecting === platform.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-primary">Connecting...</span>
                    </>
                  ) : connections[platform.id] ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-green-500">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-muted-foreground" />
                      <span>Not connected</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleConnection(platform.id)}
              disabled={connecting === platform.id}
              className={`px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                connections[platform.id]
                  ? "bg-background text-foreground hover:bg-background/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {connections[platform.id] ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-primary/10 border border-primary rounded-2xl max-w-2xl">
        <h3 className="text-lg font-semibold mb-2">🎭 Demo Mode</h3>
        <p className="text-sm text-muted-foreground">
          This is a frontend demo. Social media connections are simulated. In production, this would integrate with
          OAuth providers for secure authentication.
        </p>
      </div>
    </div>
  )
}

export default SocialConnections
