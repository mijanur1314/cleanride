"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminSupportPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = await api.get('/tickets');
      setTickets(res.data.data.tickets);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
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

  const updateStatus = async (status: string) => {
    if (!activeTicket) return;
    try {
      await api.patch(`/tickets/${activeTicket.id}/status`, { status });
      toast.success('Ticket status updated');
      viewTicket(activeTicket);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold">Support Inbox</h1>
        <p className="text-muted-foreground mt-1">Manage and respond to user support tickets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border/50 shadow-sm h-[700px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">All Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No tickets found.</div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => viewTicket(ticket)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${activeTicket?.id === ticket.id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm truncate pr-2">{ticket.subject}</h4>
                    <Badge variant={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'outline' : ticket.status === 'IN_PROGRESS' ? 'secondary' : 'default'} className="text-[10px]">
                      {ticket.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{ticket.user.name}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {ticket._count.messages}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 shadow-sm h-[700px] flex flex-col">
          {activeTicket ? (
            ticketDetails ? (
              <>
                <CardHeader className="border-b bg-muted/20">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl">{ticketDetails.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        From: <span className="text-foreground font-medium">{ticketDetails.user.name}</span> ({ticketDetails.user.email})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={ticketDetails.status} onValueChange={updateStatus}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
                  {ticketDetails.messages.map((msg: any) => {
                    const isAdmin = msg.sender.role === 'ADMIN';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{isAdmin ? 'You (Admin)' : msg.sender.name}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${isAdmin ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-background border rounded-tl-sm shadow-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
                <div className="p-4 border-t bg-background flex gap-2">
                  <Input 
                    placeholder={ticketDetails.status === 'CLOSED' ? 'Ticket is closed' : "Type your reply to the user..."} 
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && replyToTicket()}
                    disabled={ticketDetails.status === 'CLOSED' || isReplying}
                  />
                  <Button onClick={replyToTicket} disabled={ticketDetails.status === 'CLOSED' || isReplying || !replyMessage}>
                    {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send Reply
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
            )
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground p-8 text-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">Select a ticket to view</h3>
              <p className="text-sm mt-2">Manage customer issues, reply to tickets, and resolve problems.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
