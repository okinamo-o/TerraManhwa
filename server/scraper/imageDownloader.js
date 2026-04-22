import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import config from './config.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Download an image and upload it to Cloudinary
 * @param {string} imageUrl - Source image URL
 * @param {string} folder - Cloudinary folder path
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Additional options (width, height for transforms)
 * @returns {string} Cloudinary URL
 */
export async function uploadToCloudinary(imageUrl, folder, publicId, options = {}) {
  try {
    const transformation = [];

    if (options.width || options.height) {
      transformation.push({
        width: options.width,
        height: options.height,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      public_id: publicId,
      transformation: transformation.length ? transformation : undefined,
      overwrite: true,
      resource_type: 'image',
    });

    return result.secure_url;
  } catch (err) {
    console.error(`  ❌ Cloudinary upload failed for ${publicId}: ${err.message}`);
    // Fallback: return the original URL (will hotlink, but at least works)
    return imageUrl;
  }
}

/**
 * Upload a manhwa cover to Cloudinary
 */
export async function uploadCover(imageUrl, slug) {
  return uploadToCloudinary(imageUrl, config.cloudinary.coverFolder, slug, {
    width: config.cloudinary.coverWidth,
    height: config.cloudinary.coverHeight,
  });
}

/**
 * Upload a chapter page to Cloudinary
 */
export async function uploadChapterPage(imageUrl, slug, chapterNumber, pageIndex) {
  if (!config.cloudinary || !config.cloudinary.chapterFolder) {
    return imageUrl; // Fallback to source URL if config is missing
  }
  const folder = `${config.cloudinary.chapterFolder}/${slug}/chapter-${chapterNumber}`;
  const publicId = `page-${String(pageIndex).padStart(3, '0')}`;
  return uploadToCloudinary(imageUrl, folder, publicId);
}

/**
 * Batch upload chapter pages
 */
export async function uploadChapterPages(pages, slug, chapterNumber) {
  const uploaded = [];
  for (let i = 0; i < pages.length; i++) {
    if (!pages[i]) continue;
    try {
      const url = await uploadChapterPage(pages[i], slug, chapterNumber, i);
      uploaded.push({ url, order: i });
    } catch (err) {
      console.error(`  ❌ Failed to upload page ${i}: ${err.message}`);
      uploaded.push({ url: pages[i], order: i }); // fallback to source
    }

    // Small delay between uploads to avoid rate limits
    if (i % 5 === 0 && i > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return uploaded;
}
