/**
 * Cloudinary Upload Service
 * 
 * To use this service:
 * 1. Go to your Cloudinary Dashboard -> Settings -> Upload -> Upload presets
 * 2. Create a new "Unsigned" upload preset
 * 3. Fill in the CLOUD_NAME and UPLOAD_PRESET below
 */

const CLOUD_NAME = 'da2nzol3f'; // TODO: Thay bằng Cloud Name của bạn
const UPLOAD_PRESET = 'ml_default'; // TODO: Thay bằng Unsigned Upload Preset của bạn

/**
 * Uploads a file (audio, image, etc.) to Cloudinary
 * @param file The file object OR a public URL to upload
 * @returns The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file: File | string, resourceType: 'auto' | 'video' | 'image' | 'raw' = 'auto'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Tải file lên Cloudinary thất bại');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};
