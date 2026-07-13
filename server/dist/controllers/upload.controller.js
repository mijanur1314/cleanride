"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.uploadMiddleware = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const supabase_js_1 = require("@supabase/supabase-js");
const multer_1 = __importDefault(require("multer"));
// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
let supabase = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT_ID')) {
    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
}
// Multer memory storage (we don't save to disk, we upload directly to Supabase)
const storage = multer_1.default.memoryStorage();
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
exports.uploadFile = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError_1.AppError('No file provided for upload', 400));
    }
    if (!supabase) {
        return next(new AppError_1.AppError('Supabase storage is not configured properly in .env', 500));
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
        return next(new AppError_1.AppError(`Supabase upload failed: ${error.message}`, 500));
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
