"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { VoiceUpload } from "@/components/voice-upload/VoiceUpload";

// API utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VoiceUploadPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const formData = new FormData();
      formData.append("file", file);

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

  const handleSkip = () => {
    router.push(`/onboarding/${userId}`);
  };

  return (
    <VoiceUpload
      userId={userId}
      onUpload={handleUpload}
      onSkip={handleSkip}
      isUploading={isUploading}
      uploadStatus={uploadStatus}
    />
  );
}
