import { motion } from "framer-motion";
import { MessageCircle, Settings, Volume2, VolumeX, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatHeaderProps {
  userName: string;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onSettingsClick: () => void;
  onBrowserClick?: () => void;
}

export function ChatHeader({
  userName,
  isAudioEnabled,
  onToggleAudio,
  onSettingsClick,
  onBrowserClick,
}: ChatHeaderProps) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-200">
              Chat with {userName}
            </h1>
            <p className="text-sm text-zinc-400">
              Your personalized AI assistant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onBrowserClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBrowserClick}
              className="p-2"
            >
              <Globe className="w-5 h-5 text-zinc-400" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAudio}
            className="p-2"
          >
            {isAudioEnabled ? (
              <Volume2 className="w-5 h-5 text-green-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-zinc-400" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="p-2"
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
