"use client"

import { useState } from "react"
import { X, Save, Trash2, Share2, Cloud, CheckCircle } from "lucide-react"

function PreviewModal({ moment, onSave, onDiscard, onPost, socialConnections }) {
  const [caption, setCaption] = useState(moment.caption)
  const [showSocialMenu, setShowSocialMenu] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [postSuccess, setPostSuccess] = useState(false)
  const [isSavingToCloud, setIsSavingToCloud] = useState(false)
  const [cloudSaveSuccess, setCloudSaveSuccess] = useState(false)

  const handlePost = async () => {
    const disconnected = selectedPlatforms.filter((p) => !socialConnections[p])
    if (disconnected.length > 0) {
      setShowConnectionPrompt(true)
      return
    }

    setIsPosting(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsPosting(false)
    setPostSuccess(true)

    // Show success message then proceed
    setTimeout(() => {
      onPost({ ...moment, caption }, selectedPlatforms)
    }, 1000)
  }

  const handleSaveToGooglePhotos = async () => {
    setIsSavingToCloud(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSavingToCloud(false)
    setCloudSaveSuccess(true)

    // Show success message then save
    setTimeout(() => {
      onSave({ ...moment, caption, savedToCloud: true })
    }, 1000)
  }

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) => (prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Preview Moment</h2>
          <button onClick={onDiscard} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <img src={moment.imageUrl || "/placeholder.svg"} alt="Preview" className="w-full rounded-2xl mb-6" />

          {/* Caption Editor */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-muted rounded-xl p-4 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Add a caption..."
            />
          </div>

          {/* Social Platform Selection */}
          {showSocialMenu && (
            <div className="mb-6 p-4 bg-muted rounded-xl">
              <p className="text-sm font-semibold mb-3">Select platforms to post:</p>
              <div className="flex flex-wrap gap-3">
                {["instagram", "facebook", "linkedin"].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`px-4 py-2 rounded-xl font-semibold capitalize transition-all ${
                      selectedPlatforms.includes(platform)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-background/80"
                    }`}
                  >
                    {platform}
                    {!socialConnections[platform] && <span className="ml-2 text-xs">(Not connected)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connection Prompt */}
          {showConnectionPrompt && (
            <div className="mb-6 p-4 bg-secondary/20 border border-secondary rounded-xl">
              <p className="text-sm text-secondary font-semibold">
                ⚠️ Some platforms are not connected. Please connect them in the Social tab first.
              </p>
            </div>
          )}

          {postSuccess && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-sm text-green-500 font-semibold">
                Successfully posted to {selectedPlatforms.join(", ")}!
              </p>
            </div>
          )}

          {cloudSaveSuccess && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500 rounded-xl flex items-center gap-3">
              <CheckCircle className="text-blue-500" size={20} />
              <p className="text-sm text-blue-500 font-semibold">Successfully saved to Google Photos!</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border flex flex-wrap gap-3">
          <button
            onClick={() => onSave({ ...moment, caption })}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            <Save size={20} />
            Save
          </button>
          <button
            onClick={() => setShowSocialMenu(!showSocialMenu)}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-xl font-semibold hover:bg-accent/90 transition-colors"
          >
            <Share2 size={20} />
            Post to Social
          </button>
          {showSocialMenu && selectedPlatforms.length > 0 && (
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="px-6 py-3 bg-secondary text-white rounded-xl font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {isPosting ? "Posting..." : "Post Now"}
            </button>
          )}
          <button
            onClick={handleSaveToGooglePhotos}
            disabled={isSavingToCloud}
            className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <Cloud size={20} />
            {isSavingToCloud ? "Saving..." : "Google Photos"}
          </button>
          <button
            onClick={onDiscard}
            className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors ml-auto"
          >
            <Trash2 size={20} />
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreviewModal
