import prisma from '../utils/prisma';
import { getIO } from '../socket';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export async function findBestPartner(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true }
  });

  if (!booking || booking.status !== 'PENDING' || booking.partnerId) {
    return null; // Already assigned or cancelled
  }

  // Default to a central location if booking coords are missing
  const bookingLat = booking.latitude ?? 19.0760;
  const bookingLng = booking.longitude ?? 72.8777;

  // Find all verified partners
  const partners = await prisma.user.findMany({
    where: {
      role: 'PARTNER',
      isVerified: true
    },
    include: {
      schedules: true,
      assignedBookings: {
        where: {
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          // Only check bookings for the same day
          bookingDate: {
            gte: new Date(booking.bookingDate.setHours(0,0,0,0)),
            lt: new Date(booking.bookingDate.setHours(23,59,59,999))
          }
        }
      }
    }
  });

  const bookingStart = booking.bookingDate;
  const dischargeTimeDate = booking.dischargeTime || new Date(bookingStart.getTime() + booking.service.duration * 60000);
  const dayOfWeek = bookingStart.getDay(); // 0 = Sunday, 6 = Saturday

  let bestPartner = null;
  let minDistance = Infinity;

  for (const partner of partners) {
    // 1. Check Schedule
    const schedule = partner.schedules.find(s => s.dayOfWeek === dayOfWeek && s.isActive);
    if (!schedule) continue; // Not working today

    // Very basic time check (assumes schedule start/end are "HH:mm")
    // For a robust system, we would parse the exact time. For now, assuming they are available if active on this day.

    // 2. Check Overlapping Bookings
    const hasOverlap = partner.assignedBookings.some(b => {
      const bStart = b.bookingDate;
      const bEnd = b.dischargeTime || new Date(bStart.getTime() + 60 * 60000);
      return (bookingStart < bEnd && dischargeTimeDate > bStart);
    });

    if (hasOverlap) continue;

    // 3. Calculate Distance
    const pLat = partner.latitude ?? 19.0760;
    const pLng = partner.longitude ?? 72.8777;
    const distance = calculateDistance(bookingLat, bookingLng, pLat, pLng);

    // If within 30km and closest so far
    if (distance < 30 && distance < minDistance) {
      minDistance = distance;
      bestPartner = partner;
    }
  }

  if (bestPartner) {
    // Assign booking
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { 
        partnerId: bestPartner.id,
        status: 'PARTNER_ASSIGNED'
      }
    });

    // Notify Partner
    getIO().to(bestPartner.id).emit('notification', {
      title: 'New Job Auto-Assigned! 🤖',
      message: 'The AI Dispatcher has assigned you a new wash job based on your location and availability.',
      type: 'success'
    });

    // Notify User
    getIO().to(booking.userId).emit('notification', {
      title: 'Partner Assigned',
      message: `${bestPartner.name} has been assigned to your booking and is on the way!`,
      type: 'success'
    });

    return updatedBooking;
  }

  return null; // No partner available
}
