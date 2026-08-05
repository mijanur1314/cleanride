import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const getWalletBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await prisma.wallet.create({
        data: { userId },
        include: { transactions: true }
      });
    }

    res.status(200).json({
      status: 'success',
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

export const creditWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only Admin can arbitrarily credit wallets (or system triggers)
    if (req.user?.role !== 'ADMIN') {
      return next(new AppError('Forbidden', 403));
    }

    const { userId, amount, type, description } = req.body;

    if (!userId || !amount || amount <= 0 || !type) {
      return next(new AppError('Please provide valid userId, amount, and type', 400));
    }

    // Use transaction to ensure data integrity
    const updatedWallet = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId } });
      }

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: type,
          description: description || 'Admin Credit'
        }
      });

      return await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } }
      });
    });

    res.status(200).json({
      status: 'success',
      data: updatedWallet
    });
  } catch (error) {
    next(error);
  }
};

export const debitWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const { amount, type, description } = req.body;

    if (!amount || amount <= 0 || !type) {
      return next(new AppError('Please provide valid amount and type', 400));
    }

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      
      if (!wallet) {
        throw new AppError('Wallet not found', 404);
      }

      if (wallet.balance < amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount, // Negative for debit
          type: type,
          description: description || 'Wallet Debit'
        }
      });

      return await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } }
      });
    });

    res.status(200).json({
      status: 'success',
      data: updatedWallet
    });
  } catch (error) {
    next(error);
  }
};
