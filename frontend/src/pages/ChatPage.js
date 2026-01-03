import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { chatAPI } from '../services/api';
import axios from 'axios';
import { 
  MessageCircle, 
  Plus, 
  Send, 
  Trash2, 
  Loader2, 
  Paperclip,
  BookOpen,
  Sparkles,
  X,
  FileText,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const chatId = searchParams.get('id');
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        selectChat(chat);
      }
    }
  }, [searchParams, chats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Chyba pri načítaní chatov:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chat) => {
    setCurrentChat(chat);
    setSearchParams({ id: chat.id });
    
    try {
      const response = await chatAPI.getMessages(chat.id);
      setMessages(response.data);
    } catch (error) {
      console.error('Chyba pri načítaní správ:', error);
      toast.error('Nepodarilo sa načítať správy');
    }
  };

  const createNewChat = async () => {
    try {
      const response = await chatAPI.createChat('Nová konverzácia');
      const newChat = response.data;
      setChats([newChat, ...chats]);
      selectChat(newChat);
      toast.success('Nová konverzácia vytvorená');
    } catch (error) {
      console.error('Chyba pri vytváraní chatu:', error);
      toast.error('Nepodarilo sa vytvoriť konverzáciu');
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    try {
      await chatAPI.deleteChat(chatId);
      setChats(chats.filter(c => c.id !== chatId));
      
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
        setSearchParams({});
      }
      
      toast.success('Konverzácia bola zmazaná');
    } catch (error) {
      console.error('Chyba pri mazaní chatu:', error);
      toast.error('Nepodarilo sa zmazať konverzáciu');
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API}/chat/attachments/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setAttachments(prev => [...prev, {
          id: response.data.id,
          file_name: response.data.file_name,
          file_type: response.data.file_type
        }]);
        
        toast.success(`Súbor "${file.name}" bol nahraný`);
      } catch (error) {
        console.error('Chyba pri nahrávaní súboru:', error);
        toast.error(`Nepodarilo sa nahrať súbor "${file.name}"`);
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-purple-400" />;
    } else if (fileType?.includes('pdf')) {
      return <FileText className="w-4 h-4 text-red-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentChat) return;

    const messageContent = inputMessage.trim();
    const currentAttachments = [...attachments];
    setInputMessage('');
    setAttachments([]);
    setSending(true);

    // Add user message immediately for better UX
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      chat_id: currentChat.id,
      sender_type: 'user',
      content: messageContent,
      created_at: new Date().toISOString(),
      attachments: currentAttachments
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await chatAPI.sendMessage(currentChat.id, messageContent);
      
      // Replace temp message and add AI response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        response.data.user_message,
        response.data.ai_message
      ]);

      // Update chat in list
      setChats(prev => prev.map(c => 
        c.id === currentChat.id 
          ? { ...c, updated_at: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Chyba pri odosielaní správy:', error);
      toast.error('Nepodarilo sa odoslať správu');
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInputMessage(messageContent);
      setAttachments(currentAttachments);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-120px)] flex gap-6" data-testid="chat-page">
        {/* Chat List Sidebar */}
        <Card className="w-80 flex-shrink-0 hidden lg:flex flex-col bg-slate-800 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-100">Konverzácie</CardTitle>
              <Button 
                size="sm" 
                onClick={createNewChat}
                className="bg-pink-500 hover:bg-pink-600"
                data-testid="new-chat-btn"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nová
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {chats.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm">Žiadne konverzácie</p>
                    <p className="text-xs text-slate-500">Vytvorte novú konverzáciu</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                        ${currentChat?.id === chat.id 
                          ? 'bg-pink-500/20 text-pink-300' 
                          : 'hover:bg-slate-700 text-slate-300'}
                      `}
                      data-testid={`chat-item-${chat.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                          ${currentChat?.id === chat.id ? 'bg-pink-500/30' : 'bg-slate-700'}
                        `}>
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{chat.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(chat.updated_at).toLocaleDateString('sk-SK')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="flex-shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/20"
                        data-testid={`delete-chat-${chat.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-slate-800 border-slate-700">
          {currentChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-100">{currentChat.title}</CardTitle>
                    <p className="text-sm text-slate-400">PocketBuddy AI asistent</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-pink-400" />
                        </div>
                        <h3 className="font-semibold text-slate-200 mb-2">Ahoj! Som PocketBuddy 😊</h3>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">
                          Tvoj osobný AI asistent pre štúdium. Opýtaj sa ma čokoľvek - pomôžem ti s matematikou, 
                          vysvetlím ťažkú látku alebo ti poradím so štúdiom. Môžeš mi aj poslať súbory! 📚
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className={`
                            max-w-[80%] px-5 py-3 
                            ${msg.sender_type === 'user' 
                              ? 'chat-bubble-user' 
                              : 'chat-bubble-ai'}
                          `}>
                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {msg.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center gap-2 text-xs bg-slate-600/50 rounded px-2 py-1">
                                    {getFileIcon(att.file_type)}
                                    <span className="truncate">{att.file_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className={`
                              text-xs mt-2 
                              ${msg.sender_type === 'user' ? 'text-white/70' : 'text-slate-500'}
                            `}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {sending && (
                      <div className="flex justify-start animate-fadeIn">
                        <div className="chat-bubble-ai px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                            <span className="text-slate-400">PocketBuddy píše...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/50">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <div 
                        key={att.id} 
                        className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2"
                      >
                        {getFileIcon(att.file_type)}
                        <span className="text-sm text-slate-300 truncate max-w-[150px]">{att.file_name}</span>
                        <button 
                          onClick={() => removeAttachment(att.id)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-slate-700 p-4 flex-shrink-0 bg-slate-800">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    data-testid="file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="attach-file-btn"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Napíšte správu..."
                    className="flex-1 rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                    disabled={sending}
                    data-testid="chat-input"
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || sending}
                    className="bg-pink-500 hover:bg-pink-600 rounded-xl px-6"
                    data-testid="send-message-btn"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">PocketBuddy 😊</h2>
              <p className="text-slate-400 text-center max-w-md mb-6">
                Tvoj osobný AI asistent pre štúdium. Vyber si konverzáciu alebo vytvor novú.
              </p>
              <Button 
                onClick={createNewChat}
                className="btn-primary"
                data-testid="start-new-chat-btn"
              >
                <Plus className="w-5 h-5 mr-2" />
                Začať novú konverzáciu
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ChatPage;
