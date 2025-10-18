"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileAudio,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";

// API utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VoiceUploadPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select an audio file");
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);

      // Create audio URL for preview
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setUploadStatus("idle");

      toast.success("Audio file selected successfully!");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".webm", ".ogg", ".flac"],
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = () => {
    setSelectedFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setUploadStatus("idle");
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const uploadVoice = async () => {
    if (!selectedFile) {
      toast.error("No file selected");
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/api/voice/upload/${userId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setUploadStatus("success");
        toast.success(
          "Voice uploaded successfully! Training will begin shortly."
        );

        // Redirect to questionnaire after a short delay
        setTimeout(() => {
          router.push(`/onboarding/${userId}`);
        }, 2000);
      } else {
        setUploadStatus("error");
        toast.error(data.error || "Failed to upload voice");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const skipVoiceUpload = () => {
    router.push(`/onboarding/${userId}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <Upload className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-zinc-200 mb-2">
              Voice Training
            </h1>

            <p className="text-zinc-400 leading-relaxed">
              Upload a clear voice recording so your AI assistant can speak in
              your voice. Use a high-quality recording of 10-30 seconds speaking
              naturally.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="space-y-6">
            {/* Drop Zone */}
            {!selectedFile && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-blue-400 bg-blue-400/10"
                    : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/40"
                }`}
              >
                <input {...getInputProps()} />
                <FileAudio className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">
                  {isDragActive
                    ? "Drop your audio file here"
                    : "Upload Voice Recording"}
                </h3>
                <p className="text-zinc-400 mb-4">
                  Drag and drop an audio file, or click to browse
                </p>
                <div className="text-sm text-zinc-500">
                  Supports: MP3, WAV, M4A, WebM, OGG, FLAC (max 50MB)
                </div>
              </div>
            )}

            {/* Selected File Display */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-800/40 rounded-2xl p-6 border border-zinc-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileAudio className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-200">
                        {selectedFile.name}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {formatFileSize(selectedFile.size)} •{" "}
                        {selectedFile.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 hover:bg-zinc-700/50 rounded-xl transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-zinc-400 hover:text-zinc-300" />
                  </button>
                </div>

                {/* Audio Preview */}
                {audioUrl && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={playAudio}
                      className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>

                    <div className="flex-1">
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="w-full"
                      />
                      <div className="text-sm text-zinc-400 mt-1">
                        {isPlaying ? "Playing..." : "Click to preview"}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Upload Status */}
            <AnimatePresence>
              {uploadStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-green-900/20 border border-green-500/30 rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-medium">
                      Voice uploaded successfully! Redirecting to
                      questionnaire...
                    </span>
                  </div>
                </motion.div>
              )}

              {uploadStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300 font-medium">
                      Upload failed. Please try again.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={uploadVoice}
                disabled={!selectedFile || isUploading}
                className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  !selectedFile || isUploading
                    ? "bg-zinc-800/30 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 inline mr-2" />
                    Upload Voice Sample
                  </>
                )}
              </button>

              <button
                onClick={skipVoiceUpload}
                className="px-6 py-3 bg-zinc-800/50 text-zinc-300 rounded-2xl font-semibold hover:bg-zinc-700/50 transition-all duration-200"
              >
                Skip
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/50">
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">
              Recording Tips:
            </h4>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>• Use a quiet environment with minimal background noise</li>
              <li>• Speak clearly and at a normal pace</li>
              <li>• Record for 10-30 seconds for best results</li>
              <li>
                • You can talk about anything - your hobbies, interests, or just
                read a paragraph
              </li>
              <li>• Use a good quality microphone if available</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
