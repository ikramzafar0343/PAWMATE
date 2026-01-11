import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSend, FiSearch, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import { getMessages, sendMessage, getConversations, deleteMessage } from '../../utils/messageStore';
import { getAppointments } from '../../utils/appointmentStore';
import { getPets } from '../../utils/petStore';
import { getUsers } from '../../utils/userStore';

const MessagesModal = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const role = localStorage.getItem('role') || 'pet-owner';
  const isVet = role === 'vet';
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('_id');

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      
      // Poll for new conversations/messages even when no conversation is selected
      const conversationPollInterval = setInterval(() => {
        loadConversations();
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(conversationPollInterval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      // Force refresh when conversation is first selected
      loadMessages(selectedConversation.userId, true);
      
      // Poll for new messages every 2 seconds while conversation is open (more frequent for real-time feel)
      // Always bypass cache when polling to ensure we get the latest messages
      const interval = setInterval(() => {
        loadMessages(selectedConversation.userId, true); // Always bypass cache when polling
        loadConversations(); // Also refresh conversation list to update last message
      }, 2000); // Reduced to 2 seconds for faster updates
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // First, try backend-provided conversations (built from message history)
      let conversationsFromApi = await getConversations();
      const conversationMap = new Map();
      conversationsFromApi.forEach(c => {
        conversationMap.set(c.userId.toString(), {
          userId: c.userId.toString(),
          name: c.name,
          image: c.image,
          lastMessage: c.lastMessage || null,
          unreadCount: c.unreadCount || 0
        });
      });
      
      // Fallback: derive from appointments if no prior messages exist
      if (conversationMap.size === 0) {
        const appointments = await getAppointments();
        if (isVet) {
          appointments.forEach(appt => {
            const ownerId = appt.ownerId?._id || appt.ownerId;
            if (ownerId && !conversationMap.has(ownerId.toString())) {
              const ownerName = appt.ownerId?.name || 'Pet Owner';
              const petName = appt.petId?.name || 'Pet';
              const petImage = appt.petId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(petName)}&background=random`;
              
              conversationMap.set(ownerId.toString(), {
                userId: ownerId.toString(),
                name: ownerName,
                image: appt.ownerId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=random`,
                petName,
                petImage,
                lastMessage: null,
                unreadCount: 0
              });
            }
          });
        } else {
          appointments.forEach(appt => {
            const vetId = appt.vetId?._id || appt.vetId;
            if (vetId && !conversationMap.has(vetId.toString())) {
              const vetName = appt.vetId?.name || 'Veterinarian';
              const clinicName = appt.vetId?.clinicName || '';
              
              conversationMap.set(vetId.toString(), {
                userId: vetId.toString(),
                name: vetName,
                image: appt.vetId?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(vetName)}&background=random`,
                clinicName,
                lastMessage: null,
                unreadCount: 0
              });
            }
          });
        }
      }
      
      const conversationsList = Array.from(conversationMap.values());
      const currentUserId = localStorage.getItem('userId') || localStorage.getItem('_id');
      
      const conversationsWithMessages = await Promise.all(
        conversationsList.map(async (conv) => {
          try {
            const msgs = await getMessages(conv.userId);
            const unreadMsgs = JSON.parse(localStorage.getItem('read_messages') || '[]');
            const unreadCount = msgs.filter(m => {
              const msgId = m._id || m.id;
              const senderId = m.sender?._id || m.sender || m.senderId;
              const isMe = senderId?.toString() === currentUserId?.toString();
              return !isMe && !unreadMsgs.includes(msgId);
            }).length;
            
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            return {
              ...conv,
              lastMessage: lastMsg,
              unreadCount: unreadCount
            };
          } catch (e) {
            return conv;
          }
        })
      );
      
      setConversations(conversationsWithMessages.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || 0;
        return bTime - aTime;
      }));
    } catch (error) {
      console.error('Error loading conversations', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId, forceRefresh = false) => {
    try {
      console.log(`[Messages] Loading messages for userId: ${userId}, forceRefresh: ${forceRefresh}`);
      const msgs = await getMessages(userId, null, forceRefresh);
      console.log(`[Messages] Received ${msgs.length} messages from API`);
      const currentUserId = localStorage.getItem('userId') || localStorage.getItem('_id');
      
      if (!currentUserId) {
        console.error('Current user ID not found in localStorage');
        return;
      }
      
      console.log(`[Messages] Current user ID: ${currentUserId}`);
      
      const formattedMessages = msgs.map(msg => {
        // Handle different sender ID formats
        let senderId = null;
        if (msg.sender) {
          senderId = msg.sender._id || msg.sender.id || msg.sender;
        } else if (msg.senderId) {
          senderId = msg.senderId._id || msg.senderId.id || msg.senderId;
        }
        
        // Convert to string for comparison
        const senderIdStr = senderId?.toString();
        const currentUserIdStr = currentUserId.toString();
        const isMe = senderIdStr === currentUserIdStr;
        
        return {
          id: msg._id || msg.id,
          content: msg.content,
          sender: msg.sender?.name || (isMe ? 'Me' : 'User'),
          senderImage: msg.sender?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name || 'U')}&background=random`,
          time: new Date(msg.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          isMe: isMe,
          type: msg.type || 'text',
          createdAt: msg.createdAt || new Date().toISOString()
        };
      }).sort((a, b) => {
        // Sort by creation time, oldest first
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
      
      // Always update messages to ensure new messages appear (removed optimization to ensure real-time updates)
      console.log(`[Messages] Setting ${formattedMessages.length} formatted messages`);
      setMessages(formattedMessages);
      
      // Mark messages as read
      const readMessagesRaw = localStorage.getItem('read_messages') || '[]';
      const readMessages = JSON.parse(readMessagesRaw);
      const readMessagesSet = new Set(readMessages.map(id => id?.toString()));
      const newReadMessages = [...readMessages];
      
      formattedMessages.forEach(msg => {
        if (!msg.isMe) {
          const msgId = msg.id?.toString();
          if (msgId && !readMessagesSet.has(msgId)) {
            newReadMessages.push(msgId);
            readMessagesSet.add(msgId);
          }
        }
      });
      
      // Keep only unique IDs and limit to last 1000 to prevent localStorage bloat
      const uniqueReadMessages = [...new Set(newReadMessages.map(id => id?.toString()))].slice(-1000);
      localStorage.setItem('read_messages', JSON.stringify(uniqueReadMessages));
      
      // Update unread count for this conversation
      setConversations(prev => prev.map(conv => 
        conv.userId.toString() === userId.toString() 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      // Update badge count
      window.dispatchEvent(new CustomEvent('messageRead', { detail: { userId } }));
    } catch (error) {
      console.error('Error loading messages', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;
    
    const messageContent = messageText.trim();
    // Ensure receiverId is a string
    const receiverId = selectedConversation.userId?.toString() || selectedConversation.userId;
    
    // Validate receiverId
    if (!receiverId) {
      console.error('No receiver ID available', selectedConversation);
      alert('Error: Unable to identify recipient. Please try again.');
      return;
    }
    
    // Validate token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      alert('Error: You are not authenticated. Please log in again.');
      return;
    }
    
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic UI update - show message immediately
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      sender: localStorage.getItem('userName') || localStorage.getItem('userFirstName') || 'Me',
      senderImage: localStorage.getItem('userImage') || localStorage.getItem('userProfileImage') || `https://ui-avatars.com/api/?name=${encodeURIComponent('Me')}&background=random`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isMe: true,
      type: 'text',
      createdAt: new Date().toISOString()
    };
    
    // Add message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageText('');
    setSending(true);
    
    try {
      console.log('[Messages] Sending message:', { receiverId, content: messageContent, receiverIdType: typeof receiverId });
      
      // Send message to backend
      const sentMessage = await sendMessage(receiverId, messageContent, 'text', null, null);
      
      console.log('[Messages] Message sent successfully:', {
        id: sentMessage._id || sentMessage.id,
        sender: sentMessage.sender,
        receiver: sentMessage.receiver,
        content: sentMessage.content
      });
      
      // Replace optimistic message with real message from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? {
              id: sentMessage._id || sentMessage.id || tempId,
              content: sentMessage.content,
              sender: sentMessage.sender?.name || optimisticMessage.sender,
              senderImage: sentMessage.sender?.image || optimisticMessage.senderImage,
              time: new Date(sentMessage.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              isMe: true,
              type: sentMessage.type || 'text',
              createdAt: sentMessage.createdAt
            }
          : msg
      ));
      
      // Reload messages immediately to ensure sync (with cache bypass)
      setTimeout(async () => {
        await loadMessages(receiverId, true); // Force refresh to bypass cache
        await loadConversations();
      }, 100); // Small delay to ensure backend has processed the message
      
      // Trigger badge update
      window.dispatchEvent(new CustomEvent('messageRead'));
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        receiverId,
        content: messageContent
      });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Restore message text
      setMessageText(messageContent);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message. Please try again.';
      alert(`Failed to send message: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return conv.name.toLowerCase().includes(searchLower) || 
           (conv.petName && conv.petName.toLowerCase().includes(searchLower)) ||
           (conv.clinicName && conv.clinicName.toLowerCase().includes(searchLower));
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] max-h-[800px] flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modalSlideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FiMessageCircle className="text-green-600 text-xl" />
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="text-gray-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Conversations */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No conversations found</div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedConversation?.userId.toString() === conv.userId.toString() ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                          {conv.image ? (
                            <img src={conv.image} alt={conv.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-green-600 font-bold">{conv.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-5 px-1.5 flex items-center justify-center border-2 border-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 truncate">{conv.name}</h3>
                          {conv.clinicName && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {conv.clinicName}
                            </span>
                          )}
                        </div>
                        {conv.petName && (
                          <p className="text-xs text-gray-500 truncate">{conv.petName}</p>
                        )}
                        {conv.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conv.lastMessage.content?.substring(0, 30)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Chat */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                      {selectedConversation.image ? (
                        <img src={selectedConversation.image} alt={selectedConversation.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-green-600 font-bold">{selectedConversation.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{selectedConversation.name}</h3>
                      {selectedConversation.clinicName && (
                        <p className="text-xs text-gray-500">{selectedConversation.clinicName}</p>
                      )}
                      {selectedConversation.petName && (
                        <p className="text-xs text-gray-500">{selectedConversation.petName}</p>
                      )}
                      <p className="text-xs text-green-600">Active now</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('[Messages] Manual refresh triggered');
                      loadMessages(selectedConversation.userId, true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Refresh messages"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <FiMessageCircle className="text-6xl mb-4" />
                      <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
                        >
                          {!msg.isMe && (
                            <img
                              src={msg.senderImage}
                              alt={msg.sender}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className={`max-w-[70%] ${msg.isMe ? 'text-right' : ''}`}>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                msg.isMe
                                  ? 'bg-green-600 text-white rounded-br-none'
                                  : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                              } ${msg.id?.toString().startsWith('temp-') ? 'opacity-70' : ''} relative group`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              {!msg.id?.toString().startsWith('temp-') && (
                                <button
                                  title="Delete message"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const id = msg.id;
                                    const prev = messages;
                                    // Optimistic remove
                                    setMessages(prevMsgs => prevMsgs.filter(m => m.id !== id));
                                    try {
                                      await deleteMessage(id);
                                      // If no messages left, remove conversation from list
                                      setTimeout(async () => {
                                        const current = await getMessages(selectedConversation.userId, null, true);
                                        if (current.length === 0) {
                                          setConversations(list => list.filter(c => c.userId !== selectedConversation.userId));
                                          setSelectedConversation(null);
                                        }
                                      }, 50);
                                    } catch (err) {
                                      // Restore on error
                                      setMessages(prev);
                                      alert('Failed to delete message');
                                    }
                                  }}
                                  className={`absolute ${msg.isMe ? 'left-2' : 'right-2'} top-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-red-600`}
                                >
                                  <FiTrash2 />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <p className="text-xs text-gray-500">{msg.time}</p>
                              {msg.isMe && msg.id?.toString().startsWith('temp-') && (
                                <span className="text-xs text-gray-400">Sending...</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !messageText.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FiMessageCircle className="text-6xl mx-auto mb-4" />
                  <p className="text-sm">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesModal;

