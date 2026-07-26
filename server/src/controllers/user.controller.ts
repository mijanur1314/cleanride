import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getUsers = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    results: users.length,
    data: {
      users,
    },
  });
});
export const updateLocation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return next(new AppError('Please provide latitude and longitude', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { latitude, longitude },
  });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: updatedUser.id,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude
      }
    }
  });
});

export const getAvailablePartners = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { lat, lng } = req.query;
  const userLat = lat ? parseFloat(lat as string) : null;
  const userLng = lng ? parseFloat(lng as string) : null;

  let partners = await prisma.user.findMany({
    where: {
      role: 'PARTNER',
      isBanned: false,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
  });

  // Calculate distance if user location is provided
  if (userLat !== null && userLng !== null) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    partners = partners.map(partner => {
      if (partner.latitude === null || partner.longitude === null) {
        return { ...partner, distance: Infinity };
      }

      const dLat = toRad(partner.latitude - userLat);
      const dLon = toRad(partner.longitude - userLng);
      const lat1 = toRad(userLat);
      const lat2 = toRad(partner.latitude);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return { ...partner, distance };
    })
    // Filter out partners further than 30km and sort by distance
    .filter((p: any) => p.distance <= 30)
    .sort((a: any, b: any) => a.distance - b.distance);
  }

  res.status(200).json({
    success: true,
    results: partners.length,
    data: {
      partners,
    },
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user!.role !== 'ADMIN' && req.user!.id !== req.params.id) {
    return next(new AppError('Unauthorized access to user profile', 403));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      bookings: true,
    },
  });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Prevent role or password update via this route
  if (req.body.password || req.body.role) {
    return next(new AppError('This route is not for password or role updates.', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: req.body.name,
      phone: req.body.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      user: updatedUser,
    },
  });
});

export const updateKyc = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { kycDocumentUrl, kycSelfieUrl } = req.body;
  if (!kycDocumentUrl || !kycSelfieUrl) {
    return next(new AppError('Please provide both KYC document URL and Selfie URL.', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      kycDocumentUrl,
      kycSelfieUrl,
    },
  });

  res.status(200).json({
    success: true,
    message: 'KYC Document submitted successfully',
    data: {
      user: updatedUser,
    },
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  await prisma.user.delete({
    where: { id: req.params.id as string },
  });

  res.status(204).json({
    success: true,
    data: null,
  });
});

export const banUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { isBanned } = req.body;
  if (isBanned === undefined) {
    return next(new AppError('Please provide isBanned status', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { isBanned },
    select: { id: true, name: true, email: true, isBanned: true }
  });

  res.status(200).json({
    success: true,
    message: updatedUser.isBanned ? 'User banned successfully' : 'User unbanned successfully',
    data: { user: updatedUser }
  });
});
