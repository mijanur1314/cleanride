import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getSettings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  let settings = await prisma.systemSetting.findUnique({
    where: { id: 'global' }
  });

  if (!settings) {
    settings = await prisma.systemSetting.create({
      data: {
        id: 'global'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: { settings }
  });
});

export const updateSettings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { siteName, supportEmail, contactPhone, taxRate, enableNotifications, maintenanceMode } = req.body;

  const settings = await prisma.systemSetting.upsert({
    where: { id: 'global' },
    update: {
      ...(siteName !== undefined && { siteName }),
      ...(supportEmail !== undefined && { supportEmail }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) }),
      ...(enableNotifications !== undefined && { enableNotifications }),
      ...(maintenanceMode !== undefined && { maintenanceMode }),
    },
    create: {
      id: 'global',
      siteName,
      supportEmail,
      contactPhone,
      taxRate: taxRate ? parseFloat(taxRate) : 8.5,
      enableNotifications,
      maintenanceMode
    }
  });

  res.status(200).json({
    success: true,
    data: { settings }
  });
});
