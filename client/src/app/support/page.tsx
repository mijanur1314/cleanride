"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SupportPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/my');
      setTickets(res.data.data.tickets);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return toast.error('Subject and message are required');
    
    try {
      setIsSubmitting(true);
      await api.post('/tickets', { subject, message });
      toast.success('Ticket created successfully');
      setIsCreateOpen(false);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewTicket = async (ticket: any) => {
    setActiveTicket(ticket);
    try {
      const res = await api.get(`/tickets/${ticket.id}`);
      setTicketDetails(res.data.data.ticket);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  const replyToTicket = async () => {
    if (!replyMessage || !activeTicket) return;
    try {
      setIsReplying(true);
      await api.post(`/tickets/${activeTicket.id}/reply`, { content: replyMessage });
      setReplyMessage('');
      viewTicket(activeTicket);
      fetchTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl pt-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Support Center</h1>
          <p className="text-muted-foreground mt-1">Get help with your account or bookings.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open a Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={createTicket} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What do you need help with?" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue in detail..." rows={4} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Ticket
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border/50 shadow-sm h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Your Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No tickets found.</div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => viewTicket(ticket)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${activeTicket?.id === ticket.id ? 'bg-muted' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm truncate pr-2">{ticket.subject}</h4>
                    <Badge variant={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'outline' : ticket.status === 'IN_PROGRESS' ? 'secondary' : 'default'} className="text-[10px]">
                      {ticket.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{format(new Date(ticket.updatedAt), 'MMM d, h:mm a')}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {ticket._count.messages}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 shadow-sm h-[600px] flex flex-col">
          {activeTicket ? (
            ticketDetails ? (
              <>
                <CardHeader className="border-b bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{ticketDetails.subject}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Ticket ID: {ticketDetails.id}</p>
                    </div>
                    <Badge variant={ticketDetails.status === 'RESOLVED' || ticketDetails.status === 'CLOSED' ? 'outline' : 'default'}>
                      {ticketDetails.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
                  {ticketDetails.messages.map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{isMe ? 'You' : msg.sender.name}</span>
                          {!isMe && <Badge variant="secondary" className="text-[9px] h-4 px-1">{msg.sender.role}</Badge>}
                          <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-background border rounded-tl-sm shadow-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
                <div className="p-4 border-t bg-background flex gap-2">
                  <Input 
                    placeholder={ticketDetails.status === 'CLOSED' ? 'Ticket is closed' : "Type your reply..."} 
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && replyToTicket()}
                    disabled={ticketDetails.status === 'CLOSED' || isReplying}
                  />
                  <Button onClick={replyToTicket} disabled={ticketDetails.status === 'CLOSED' || isReplying || !replyMessage}>
                    {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
            )
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground p-8 text-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">Select a ticket</h3>
              <p className="text-sm mt-2">Choose a ticket from the left sidebar to view the conversation, or create a new one to get help.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
