import React, { useState, useEffect, useRef } from 'react';
import { FiArrowLeft, FiSend, FiMoreVertical } from 'react-icons/fi';
import { getMessages, sendMessage } from '../../utils/messageStore';

const BuyerSellerChat = ({ seller, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
        const sellerId = seller._id || seller.id;
        if (!sellerId) {
          console.error('No seller ID provided');
          setLoading(false);
          return;
        }
        const data = await getMessages(sellerId);
        setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds (simple real-time simulation)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [seller]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const sellerId = seller._id || seller.id;
    if (!sellerId) {
      alert("Cannot send message: Seller information is missing");
      return;
    }
    
    try {
        const newMessage = await sendMessage(sellerId, inputText);
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    } catch (error) {
        console.error('Error sending message:', error);
        alert("Failed to send message. Please try again.");
    }
  };

  const currentUserId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage or retrieved from auth context

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiArrowLeft className="text-gray-600" />
          </button>
          <div className="relative">
            {(() => {
              // Get seller image from multiple possible sources
              const sellerImage = 
                seller.image || 
                seller.profileImage || 
                seller.avatar ||
                null;
              
              const sellerName = seller.name || seller.fullName || 'Seller';
              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName.replace(/\s+/g, '+'))}&background=random&size=128`;
              
              return (
                <>
                  <img 
                    src={sellerImage || fallbackUrl} 
                    alt={sellerName} 
                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                    onError={(e) => {
                      // Fallback to generated avatar if image fails to load
                      if (e.target.src !== fallbackUrl) {
                        e.target.src = fallbackUrl;
                      }
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </>
              );
            })()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{seller.name || seller.fullName || 'Seller'}</h3>
            <p className="text-xs text-green-600 font-medium">Online</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <FiMoreVertical />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
            <div className="text-center text-gray-500 mt-10">Loading messages...</div>
        ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">No messages yet. Say hello!</div>
        ) : (
            messages.map((msg) => {
                const isMe = msg.sender === currentUserId || msg.sender?._id === currentUserId || (msg.sender !== (seller._id || seller.id)); 
                // Logic: if sender is NOT the seller, it's me. 
                // Better logic: if I have my ID, check against it.
                // Assuming backend returns populated sender or just ID. 
                // Our controller returns messages with sender ID.
                // We need to know "my" ID.
                // Let's assume the token decode or a store has 'user'.
                // For now, let's use a simpler heuristic: if sender === seller.id, it's 'them', else 'me'.
                const isSeller = msg.sender === (seller._id || seller.id) || msg.sender?._id === (seller._id || seller.id);
                
                return (
                  <div 
                    key={msg._id} 
                    className={`flex ${!isSeller ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                        !isSeller 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${!isSeller ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button 
            type="submit" 
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputText.trim()}
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuyerSellerChat;
