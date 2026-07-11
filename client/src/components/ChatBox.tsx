import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { io, Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface ChatBoxProps {
  bookingId: string;
  partnerName?: string;
  userName?: string;
  onClose: () => void;
}

export function ChatBox({ bookingId, partnerName, userName, onClose }: ChatBoxProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-booking', bookingId);
    });

    newSocket.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [bookingId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/${bookingId}`);
        setMessages(res.data.data.messages);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [bookingId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !socket) return;

    socket.emit('send-message', {
      bookingId,
      senderId: user.id,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 w-80 sm:w-96 z-50 shadow-2xl"
      >
        <Card className="flex flex-col h-[500px] border-primary/20">
          <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Chat {partnerName ? `with ${partnerName}` : userName ? `with ${userName}` : ''}
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="p-3 border-t bg-background rounded-b-lg">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
