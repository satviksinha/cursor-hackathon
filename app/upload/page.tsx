"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Camera,
  Mic,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";

function UploadPageContent() {
  const router = useRouter();
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState({
    text: null as File | null,
    photo: null as File | null,
    voice: null as File | null,
  });

  const onDropText = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFiles((prev) => ({ ...prev, text: file }));
      toast.success("Text file uploaded!");
    }
  }, []);

  const onDropPhoto = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFiles((prev) => ({ ...prev, photo: file }));
      toast.success("Photo uploaded!");
    }
  }, []);

  const onDropVoice = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFiles((prev) => ({ ...prev, voice: file }));
      toast.success("Voice sample uploaded!");
    }
  }, []);

  const {
    getRootProps: getTextRootProps,
    getInputProps: getTextInputProps,
    isDragActive: isTextDragActive,
  } = useDropzone({
    onDrop: onDropText,
    accept: {
      "text/plain": [".txt"],
      "application/json": [".json"],
    },
    multiple: false,
  });

  const {
    getRootProps: getPhotoRootProps,
    getInputProps: getPhotoInputProps,
    isDragActive: isPhotoDragActive,
  } = useDropzone({
    onDrop: onDropPhoto,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    },
    multiple: false,
  });

  const {
    getRootProps: getVoiceRootProps,
    getInputProps: getVoiceInputProps,
    isDragActive: isVoiceDragActive,
  } = useDropzone({
    onDrop: onDropVoice,
    accept: {
      "audio/*": [".wav", ".mp3", ".m4a"],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!files.text || !files.photo || !files.voice) {
      toast.error("Please upload all three files!");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("text_file", files.text);
      formData.append("photo_file", files.photo);
      formData.append("voice_file", files.voice);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();

        if (result.status === "training_started") {
          toast.success("Upload successful! Training started automatically.");
          // Redirect to training page
          router.push(`/training/${result.user_id}`);
        } else if (result.status === "uploaded") {
          toast.success("Upload successful! You can start training manually.");
          // Redirect to training page anyway - user can start training manually
          router.push(`/training/${result.user_id}`);
        } else {
          toast.success("Upload successful!");
          router.push(`/training/${result.user_id}`);
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const allFilesUploaded = files.text && files.photo && files.voice;

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Upload Your Digital DNA
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Provide the raw materials for your neural resurrection. We'll
            extract your personality, voice, and appearance.
          </p>
        </motion.div>

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Text Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-400" />
              Text Data
            </h3>
            <div
              {...getTextRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isTextDragActive
                  ? "border-blue-400 bg-blue-400/10"
                  : files.text
                  ? "border-green-400 bg-green-400/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/40"
              }`}
            >
              <input {...getTextInputProps()} />
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {files.text ? (
                <div>
                  <p className="text-green-400 font-medium">
                    {files.text.name}
                  </p>
                  <p className="text-sm text-gray-400">Ready to process</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 mb-2">Drop your text file here</p>
                  <p className="text-sm text-gray-500">
                    WhatsApp/Discord exports, plain text
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-purple-400" />
              Profile Photo
            </h3>
            <div
              {...getPhotoRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isPhotoDragActive
                  ? "border-purple-400 bg-purple-400/10"
                  : files.photo
                  ? "border-green-400 bg-green-400/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/40"
              }`}
            >
              <input {...getPhotoInputProps()} />
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {files.photo ? (
                <div>
                  <p className="text-green-400 font-medium">
                    {files.photo.name}
                  </p>
                  <p className="text-sm text-gray-400">Ready to process</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 mb-2">Drop your photo here</p>
                  <p className="text-sm text-gray-500">
                    High-res headshot preferred
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Voice Sample */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <Mic className="w-5 h-5 mr-2 text-green-400" />
              Voice Sample
            </h3>
            <div
              {...getVoiceRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isVoiceDragActive
                  ? "border-green-400 bg-green-400/10"
                  : files.voice
                  ? "border-green-400 bg-green-400/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/40"
              }`}
            >
              <input {...getVoiceInputProps()} />
              <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {files.voice ? (
                <div>
                  <p className="text-green-400 font-medium">
                    {files.voice.name}
                  </p>
                  <p className="text-sm text-gray-400">Ready to process</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 mb-2">Drop your audio here</p>
                  <p className="text-sm text-gray-500">
                    1-2 minutes of clear speech
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-200 font-semibold">
                  Uploading...
                </span>
                <span className="text-zinc-400 font-medium">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-zinc-800/50 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            onClick={handleUpload}
            disabled={!allFilesUploaded || isUploading}
            whileHover={allFilesUploaded && !isUploading ? { scale: 1.05 } : {}}
            whileTap={allFilesUploaded && !isUploading ? { scale: 0.95 } : {}}
            className={`px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
              allFilesUploaded && !isUploading
                ? "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                : "bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 inline mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="w-6 h-6 inline mr-2" />
                Begin Resurrection
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Upload Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-blue-400 mb-2">Text Data</h4>
              <ul className="space-y-1">
                <li>• WhatsApp/Discord chat exports</li>
                <li>• Plain text files with your writing</li>
                <li>• At least 1000 words recommended</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-400 mb-2">
                Profile Photo
              </h4>
              <ul className="space-y-1">
                <li>• High-resolution headshot</li>
                <li>• Clear face, good lighting</li>
                <li>• JPG, PNG, or WebP format</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-400 mb-2">Voice Sample</h4>
              <ul className="space-y-1">
                <li>• 1-2 minutes of clear speech</li>
                <li>• Minimal background noise</li>
                <li>• WAV, MP3, or M4A format</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadPageContent />
    </ProtectedRoute>
  );
}
