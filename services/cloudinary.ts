
import { CONFIG } from './config';

/**
 * Universal Media Uplink for VibeStream 2026
 * Supports: AVIF, WEBP, HEIC, MP4, MOV, and all modern formats
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const { cloudName, uploadPreset } = CONFIG.CLOUDINARY;
  
  if (!cloudName) {
    throw new Error("Cloudinary configuration missing: cloudName");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'VibeStream_Profiles');

  // Using 'auto' allows Cloudinary to detect if it's an image or video automatically
  const resourceType = 'auto';
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    
    if (data.secure_url) {
      return data.secure_url;
    }
    
    throw new Error(data.error?.message || 'Uplink failed');
  } catch (error) {
    console.error('Cloudinary Uplink Error:', error);
    throw error;
  }
};
