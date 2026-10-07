"use client";
import { useState, useRef } from "react";

export default function ImageUpload({ onSuccess, onError, folder, fileName }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Get authentication parameters from our Next.js API
      const authRes = await fetch("/api/imagekit/auth");
      if (!authRes.ok) {
        let errMessage = "Failed to authenticate with ImageKit";
        try {
          const errData = await authRes.json();
          if (errData.error) errMessage = errData.error;
        } catch(e) {}
        throw new Error(errMessage);
      }
      const { signature, expire, token } = await authRes.json();

      // 2. Prepare FormData for ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);
      formData.append("signature", signature);
      formData.append("expire", expire);
      formData.append("token", token);
      formData.append("fileName", fileName || file.name);
      if (folder) formData.append("folder", folder);
      formData.append("useUniqueFileName", "true");

      // 3. Upload to ImageKit
      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // 4. Success callback
      if (onSuccess) onSuccess(data);
      
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="imagekit-upload-wrapper">
      <input 
        type="file" 
        accept="image/*"
        onChange={handleUpload}
        ref={fileInputRef}
        disabled={isUploading}
        style={{
          padding: "10px",
          border: "1px dashed #ccc",
          borderRadius: "4px",
          cursor: isUploading ? "not-allowed" : "pointer",
          background: isUploading ? "#f5f5f5" : "transparent"
        }}
      />
      {isUploading && <span style={{ marginLeft: "10px" }}>Uploading...</span>}
    </div>
  );
}
