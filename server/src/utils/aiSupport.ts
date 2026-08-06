import prisma from './prisma';

// Helper to dynamically import the ESM module
async function getGenAI() {
  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function processTicketWithAI(ticketId: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!ticket || ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') return;

    // Find a system user or the first ADMIN to act as the AI sender
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) return;

    // Find related booking context
    const recentBookings = await prisma.booking.findMany({
      where: { userId: ticket.userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { service: true, payment: true }
    });

    const ai = await getGenAI();

    // Construct conversation history
    let prompt = `You are CleanRide's AI Support Agent. You have the authority to issue refunds for valid complaints (e.g., poor wash quality, unassigned partners for too long). 
    
User Details:
Name: ${ticket.user.name}
Email: ${ticket.user.email}

Recent Bookings (for context):
${JSON.stringify(recentBookings, null, 2)}

Ticket Subject: ${ticket.subject}
Conversation:\n`;

    for (const msg of ticket.messages) {
      const sender = msg.senderId === ticket.userId ? "User" : "Agent";
      prompt += `${sender}: ${msg.content}\n`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [
            {
              name: 'issueRefund',
              description: 'Issues a refund to the user\'s wallet for a specific booking and amount.',
              parameters: {
                type: 'OBJECT' as any,
                properties: {
                  bookingId: { type: 'STRING' as any, description: 'The ID of the booking to refund' },
                  amount: { type: 'NUMBER' as any, description: 'The amount to refund in rupees (e.g., 500 for ₹500)' },
                  reason: { type: 'STRING' as any, description: 'Reason for the refund' }
                },
                required: ['bookingId', 'amount', 'reason']
              }
            }
          ]
        }]
      }
    });

    let aiReply = response.text;
    const toolCall = response.functionCalls?.[0];
    let refundIssued = false;

    if (toolCall && toolCall.name === 'issueRefund') {
      const args = toolCall.args as Record<string, any> || {};
      const amount = Number(args.amount as string || 0); // Handle any string/number discrepancies
      const bookingId = args.bookingId as string;
      
      // Execute the refund securely
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
      if (booking && booking.userId === ticket.userId && booking.payment && booking.payment.status === 'COMPLETED') {
        
        await prisma.$transaction(async (tx) => {
          // Find or create wallet
          let wallet = await tx.wallet.findUnique({ where: { userId: ticket.userId } });
          if (!wallet) {
            wallet = await tx.wallet.create({ data: { userId: ticket.userId, balance: 0 } });
          }

          // Add transaction
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: amount, // Positive amount to credit wallet
              type: 'REFUND',
              description: `Refund for booking ${bookingId}: ${args?.reason || 'AI autonomous refund'}`
            }
          });

          // Update wallet balance
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: amount } }
          });

          // Update payment status
          await tx.payment.update({
            where: { id: booking.payment!.id },
            data: { status: 'REFUNDED' }
          });
        });
        
        refundIssued = true;
        
        // Generate a follow-up message acknowledging the successful refund
        const followUp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt + `\nSystem: The tool issueRefund was called successfully. Please write a polite message to the user informing them that their refund of ₹${amount} has been processed to their wallet. Keep it brief.`,
        });
        aiReply = followUp.text;
      } else {
        // Generate a follow-up message saying the refund failed
        const followUp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt + `\nSystem: The tool issueRefund failed because the booking was not found, didn't belong to the user, or payment wasn't completed. Please politely tell the user you couldn't process the refund automatically and that a human agent will look into it.`,
        });
        aiReply = followUp.text;
      }
    }

    if (aiReply) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: admin.id,
          content: "[AI Agent] " + aiReply
        }
      });
      
      if (refundIssued) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'RESOLVED' }
        });
      }
    }

  } catch (error) {
    console.error("AI Support Error:", error);
  }
}
