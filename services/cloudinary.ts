
import { CONFIG } from './config';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const { cloudName, uploadPreset } = CONFIG.CLOUDINARY;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'VibeStream');

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
  
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
    throw new Error(data.error?.message || 'Upload failed');
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};
