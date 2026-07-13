import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

import { SupabaseClient } from '@supabase/supabase-js';
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT_ID')) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Multer memory storage (we don't save to disk, we upload directly to Supabase)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadFile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('No file provided for upload', 400));
  }

  if (!supabase) {
    return next(new AppError('Supabase storage is not configured properly in .env', 500));
  }

  const file = req.file;
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Upload to Supabase bucket called 'cleanride-media'
  const { data, error } = await supabase
    .storage
    .from('cleanride-media')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    return next(new AppError(`Supabase upload failed: ${error.message}`, 500));
  }

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('cleanride-media')
    .getPublicUrl(fileName);

  res.status(200).json({
    success: true,
    data: {
      url: publicUrl,
      fileName
    }
  });
});
