

import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { 
  MessageSquare, Menu, X, Search, Send, Users 
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { 
  getAllUsers, 
  getRealtimeMessages, 
  getUnreadMessageCounts, 
  markMessagesAsRead,
  sendHecMessage, 
  getHecMessages  
} from "../connection/connection.js";
import { initSocket } from "../connection/socket.js";

export default function MessagePage() {
  const authState = useSelector((state) => state.auth);
  const currentUser = authState?.userData?.user || authState?.userData;
  const currentUserId = currentUser?.email || "";
  const userRole = currentUser?.role || ""; 

  const [selectedChat, setSelectedChat] = useState(null); 
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]); 
  const [newMessage, setNewMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getRoomId = (userId1, userId2) => [userId1, userId2].sort().join("_");
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);

  // 1. SOCKET INITIALIZATION
  useEffect(() => {
    socketRef.current = initSocket();
    const handler = (data) => {
      const messageRoom = getRoomId(data.sender, data.receiver);
      if (selectedChat && selectedChat !== "HEC" && messageRoom === getRoomId(currentUserId, selectedChat.email)) {
        setMessages((prev) => [...prev, data]);
      } else if (data.receiver === currentUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.sender]: (prev[data.sender] || 0) + 1,
        }));
      }
    };
    socketRef.current.on("receive_message", handler);
    return () => { if (socketRef.current) socketRef.current.off("receive_message", handler); };
  }, [currentUserId, selectedChat]);

  // 2. FETCH INITIAL DATA
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const usersResponse = await getAllUsers();
        const allUsers = (usersResponse.data || []).filter(u => u.email !== currentUserId);
        setUsers(allUsers);
        const unreadResponse = await getUnreadMessageCounts();
        if (unreadResponse?.success) setUnreadCounts(unreadResponse.data || {});
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    if (currentUserId) loadInitialData();
  }, [currentUserId]);

  // 3. SEARCH & FORCED TOP SORTING (UNREADS AT THE TOP)
  useEffect(() => {
    let result = [...users];
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => (u.name || u.email).toLowerCase().includes(q));
    }

    // MANDATORY SORT: If a user has unread messages, they MUST be at the top
    result.sort((a, b) => {
      const unreadA = unreadCounts[a.email] || 0;
      const unreadB = unreadCounts[b.email] || 0;

      // Primary sort by unread status (anyone with > 0 comes first)
      if (unreadB > 0 && unreadA === 0) return 1;
      if (unreadA > 0 && unreadB === 0) return -1;
      
      // Secondary sort by count if both have unread
      return unreadB - unreadA; 
    });

    setFilteredUsers(result);
  }, [searchQuery, users, unreadCounts]);

  // 4. HANDLERS
  const handleSelectUser = async (user) => {
    setSelectedChat(user);
    setMessages([]);
    setSidebarOpen(false);
    try {
      const history = await getRealtimeMessages(currentUserId, user.email);
      setMessages((history.data || []).map(item => ({
        message: item.message,
        sender: item.fromemail,
        senderName: item.fromemail.split("@")[0],
        timestamp: item.sendtime,
      })));
      await markMessagesAsRead(user.email);
      setUnreadCounts(prev => { const n = {...prev}; delete n[user.email]; return n; });
    } catch (err) { console.error(err); }
  };

  const handleSelectHEC = async () => {
    setSelectedChat("HEC");
    setSidebarOpen(false);
    try {
      const res = await getHecMessages();
      if (res?.result) {
        setMessages(res.result.map(item => ({
          sender: item.fromemail,
          message: item.messages,
          senderName: item.fromemail === "hec@rguktong.ac.in" ? "HEC Admin" : item.fromemail.split('@')[0],
          timestamp: item.created_at || new Date().toISOString(),
        })));
      }
    } catch (err) { toast.error("Failed to load HEC"); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (selectedChat === "HEC") {
      try {
        await sendHecMessage({ message: newMessage.trim() });
        // Manually push to local state for instant UI update
        const msg = { sender: currentUserId, message: newMessage, timestamp: new Date(), senderName: "You" };
        setMessages(prev => [...prev, msg]);
        setNewMessage("");
      } catch (err) { toast.error("Failed to send"); }
    } else {
      const data = { room: getRoomId(currentUserId, selectedChat.email), message: newMessage.trim(), sender: currentUserId, receiver: selectedChat.email, timestamp: new Date().toISOString() };
      socketRef.current.emit("send_message", data);
      setMessages(prev => [...prev, data]);
      setNewMessage("");
    }
  };

  const canAccessHEC = userRole === "student" || currentUserId === "hec@rguktong.ac.in";

  return (
    <div className="relative ml-1 mr-3 md:ml-69 mt-40 md:mt-30 w-[calc(screen-69px)] h-[calc(100vh-100px)] flex border border-stone-200 rounded-xl bg-stone-50 overflow-hidden shadow-sm font-sans">
      <Toaster position="top-center" />
      
      {/* SIDEBAR */}
      <div className={`fixed md:relative z-20 w-80 bg-stone-50 border-r border-stone-200 h-full flex flex-col transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 bg-amber-900 text-white flex justify-between items-center">
          <h2 className="font-bold text-lg">Messages</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X size={20}/></button>
        </div>
        
        <div className="p-3 border-b border-stone-200">
          <div className="bg-stone-200 rounded-lg flex items-center px-3 py-2">
            <Search size={16} className="text-stone-500 mr-2"/>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent w-full outline-none text-sm text-stone-800" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* HEC COMMUNITY BUTTON */}
          {canAccessHEC && (
            <div onClick={handleSelectHEC} className={`p-4 flex items-center gap-3 cursor-pointer border-b border-stone-100 ${selectedChat === "HEC" ? 'bg-stone-200 border-l-4 border-l-amber-700' : 'hover:bg-stone-100'}`}>
               <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold shadow-md"><Users size={20} /></div>
               <div><p className="font-bold text-stone-800">HEC COMMUNITY</p><p className="text-xs text-amber-700 font-medium">Official Channel</p></div>
            </div>
          )}

          {/* USER LIST (Prioritizes Unread at the top) */}
          {filteredUsers.map(user => {
            const unread = unreadCounts[user.email] || 0;
            return (
              <div key={user.email} onClick={() => handleSelectUser(user)} className={`p-4 flex items-center gap-3 cursor-pointer border-b border-stone-100 transition-all ${selectedChat?.email === user.email ? 'bg-amber-100 border-l-4 border-l-amber-700' : unread > 0 ? 'bg-stone-300' : 'hover:bg-stone-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${unread > 0 ? 'bg-amber-800 text-white' : 'bg-stone-200 text-stone-600'}`}>{(user.name || user.email)[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`truncate ${unread > 0 ? 'font-black text-stone-900' : 'font-medium text-stone-800'}`}>{user.name || user.email.split('@')[0]}</p>
                    {unread > 0 && <span className="bg-amber-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unread}</span>}
                  </div>
                  <p className={`text-xs truncate ${unread > 0 ? 'text-stone-700 font-semibold' : 'text-stone-500'}`}>{user.email}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-stone-50 min-w-0">
        {selectedChat ? (
          <>
            <div className={`flex items-center p-4 border-b shadow-sm ${selectedChat === "HEC" ? "bg-amber-800 text-white" : "bg-white border-stone-200 text-stone-800"}`}>
               <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-3"><Menu size={20}/></button>
               <div className="font-bold uppercase tracking-wide">{selectedChat === "HEC" ? "HEC Community" : selectedChat.name || selectedChat.email}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.map((msg, idx) => {
                 // CRITICAL FIX: isMe check for both DMs and HEC
                 const isMe = msg.sender === currentUserId;
                 return (
                   <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-amber-800 text-amber-50' : 'bg-white text-stone-800 border border-stone-200'}`}>
                       {!isMe && selectedChat === "HEC" && (
                         <p className="text-[9px] font-bold text-amber-700 mb-1 uppercase tracking-tighter">{msg.senderName}</p>
                       )}
                       <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                       <p className={`text-[9px] mt-1 text-right ${isMe ? 'opacity-70' : 'text-stone-400'}`}>
                         {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </p>
                     </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-stone-200 flex gap-2">
               <input type="text" className="flex-1 rounded-xl px-4 py-3 bg-stone-100 outline-none focus:ring-2 focus:ring-amber-600 text-stone-800" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
               <button type="submit" className="p-3 bg-amber-800 text-white rounded-xl hover:bg-amber-900 transition-all shadow-md"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
            <MessageSquare size={64} className="opacity-10 mb-4"/>
            <p className="text-lg font-medium opacity-60">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}