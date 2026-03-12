import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; 
import toast, { Toaster } from 'react-hot-toast';
import { sendGrievance, getMyGrievances, getGrievanceInbox } from "../connection/connection";

const Grievance = () => {
  // --- REDUX STATE ---
  const currentUser = useSelector((state) => state.auth); 

  // --- COMPONENT STATE ---
  const [allMessages, setAllMessages] = useState([]); 
  const [filteredMessages, setFilteredMessages] = useState([]); 
  const [activeTab, setActiveTab] = useState("ALL");
  
  // Role State
  const [isAuthority, setIsAuthority] = useState(false); 
  const [isStudent, setIsStudent] = useState(false);
  const [isUnauthorizedUser, setIsUnauthorizedUser] = useState(false);

  // Input State
  const [toInput, setToInput] = useState(""); 
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- CONFIGURATION (public domain only) ---
  const wardenEmails = ["boyswarden@rguktong.ac.in", "girlswarden@rguktong.ac.in"];
  const hodEmails = [
    "hodcse@rguktong.ac.in",
    "hodece@rguktong.ac.in",
    "hodeee@rguktong.ac.in",
    "hodmech@rguktong.ac.in",
    "hodcivil@rguktong.ac.in"
  ];
  
  const authoritiesDropdown = [
    { label: "HOD CSE", email: "hodcse@rguktong.ac.in", type: "hod" },
    { label: "HOD ECE", email: "hodece@rguktong.ac.in", type: "hod" },
    { label: "HOD EEE", email: "hodeee@rguktong.ac.in", type: "hod" },
    { label: "HOD MECH", email: "hodmech@rguktong.ac.in", type: "hod" },
    { label: "HOD CIVIL", email: "hodcivil@rguktong.ac.in", type: "hod" },
    { label: "Boys Warden", email: "boyswarden@rguktong.ac.in", type: "warden" },
    { label: "Girls Warden", email: "girlswarden@rguktong.ac.in", type: "warden" },
  ];

  // --- INITIALIZATION ---
  useEffect(() => {
    if (currentUser) {
      const userObj = currentUser?.userData?.user || currentUser?.user || currentUser || {};
      const email = (userObj.email || "").toLowerCase().trim();
      const role = (userObj.role || "").toLowerCase().trim();

      // 1. Check if email belongs to the specific allowed lists
      const isOfficialEmail = [...hodEmails, ...wardenEmails].includes(email);
      
      // 2. Check for keywords specifically for HOD/Warden
      const isOfficialKeyword = email.includes("hod") || email.includes("warden"); 

      // 3. Define Authority: Must have the email or the keyword
      const authStatus = isOfficialEmail || isOfficialKeyword;

      // 4. Define Student: Usually defined by 'student' role
      const studentStatus = role === "student";

      // 5. Unauthorized: If you are an admin/user but NOT a warden/hod email
      // This will catch placementcell@rguktong.ac.in
      const unauthorized = !authStatus && !studentStatus;

      setIsAuthority(authStatus);
      setIsStudent(studentStatus);
      setIsUnauthorizedUser(unauthorized);

      if (authStatus) {
        setToInput(""); 
      } else if (studentStatus) {
        setToInput(authoritiesDropdown[0].email);
      }
    }
    fetchAllData();
  }, [currentUser]);

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    try {
      const sentRes = await getMyGrievances();
      const sent = (sentRes?.result || []).map(msg => ({ ...msg, direction: 'sent' }));

      const inboxRes = await getGrievanceInbox();
      const received = (inboxRes?.result || []).map(msg => ({ ...msg, direction: 'received' }));

      const merged = [...sent, ...received].sort((a, b) => (a.id || 0) - (b.id || 0));
      setAllMessages(merged);
      filterData(merged, activeTab); 
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  const filterData = (data, tab) => {
    setActiveTab(tab);
    let filtered = [];
    if (tab === "ALL") {
      filtered = data;
    } else if (tab === "WARDEN") {
      filtered = data.filter(msg => 
        wardenEmails.includes(msg.toemail) || wardenEmails.includes(msg.fromemail)
      );
    } else if (tab === "HOD") {
      filtered = data.filter(msg => 
        hodEmails.includes(msg.toemail) || hodEmails.includes(msg.fromemail)
      );
    }
    setFilteredMessages(filtered);
    if (isStudent) {
      if (tab === "WARDEN") setToInput(wardenEmails[0]);
      else if (tab === "HOD") setToInput(hodEmails[0]);
    }
  };

  const getVisibleOptions = () => {
    if (activeTab === "WARDEN") return authoritiesDropdown.filter(a => a.type === "warden");
    if (activeTab === "HOD") return authoritiesDropdown.filter(a => a.type === "hod");
    return authoritiesDropdown;
  };

  const handleReply = (senderEmail) => {
    if (!isAuthority) return;
    setToInput(senderEmail); 
    toast.success(`Replying to ${senderEmail}`, { icon: '↩️' });
    document.getElementById("grievance-input")?.focus();
  };

  const handleSend = async () => {
    if (!message.trim() || !toInput.trim()) return toast.error("All fields required");
    setLoading(true);
    const response = await sendGrievance(toInput, message);
    if (response?.message) {
      toast.success(response.sucessMessage || "Sent successfully!");
      setMessage("");
      if(isAuthority) setToInput(""); 
      fetchAllData(); 
    } else {
      toast.error(response?.error || "Failed to send");
    }
    setLoading(false);
  };

  // --- UNAUTHORIZED VIEW (Placement Cell, etc.) ---
  if (isUnauthorizedUser) {
    return (
      <div className="md:ml-64 mt-24 md:mt-28 flex flex-col items-center justify-center h-[60vh] px-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-serif tracking-widest uppercase text-gray-800">Access Restricted</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            The Grievance portal is strictly for Students, HODs, and Wardens. 
            Your account (<strong>{currentUser?.email || 'Placement Cell'}</strong>) does not have permission to view these messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:ml-64 mt-24 md:mt-28 px-2 md:px-4 h-[calc(100vh-120px)] flex flex-col transition-all duration-300">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="bg-[#8cf0b0] border rounded-2xl flex flex-col items-center p-3 md:p-4 shadow-sm shrink-0">
        <h2 className="text-black text-xl md:text-3xl font-serif tracking-widest uppercase">
            Grievance
        </h2>
        <p className="text-center text-gray-700 text-[10px] md:text-sm">
            {isAuthority ? "INBOX & REPLIES" : "Official channel for HODs and Wardens."}
        </p>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden mt-2 gap-1 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => filterData(allMessages, "ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeTab === 'ALL' ? 'bg-[#dcd6f7] border-purple-400' : 'bg-white border-gray-200 text-gray-500'}`}
          >
            My Requests
          </button>
          {isStudent && (
              <>
                <button 
                    onClick={() => filterData(allMessages, "HOD")}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeTab === 'HOD' ? 'bg-[#dcd6f7] border-purple-400' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                    Academic
                </button>
                <button 
                    onClick={() => filterData(allMessages, "WARDEN")}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeTab === 'WARDEN' ? 'bg-[#dcd6f7] border-purple-400' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                    Outpass
                </button>
              </>
          )}
      </div>

      {/* Main Layout */}
      <div className="mt-2 flex-1 flex overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm mb-2">
        <div className="flex-[3] flex flex-col relative bg-[#fdfdfd]">
            <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-4 pb-44"> 
                {filteredMessages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20 text-sm italic">No messages found here.</div>
                ) : (
                    filteredMessages.map((msg, index) => {
                        const isSentByMe = msg.direction === 'sent';
                        return (
                            <div key={index} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`relative p-3 rounded-2xl max-w-[90%] md:max-w-[70%] shadow-sm text-sm border
                                    ${isSentByMe ? 'bg-gray-100 border-gray-200 rounded-br-none text-gray-800' 
                                                 : 'bg-blue-50 border-blue-100 rounded-bl-none text-gray-800'} 
                                `}>
                                    <div className="flex justify-between items-center mb-1 gap-2">
                                      <div className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${isSentByMe ? 'text-gray-500' : 'text-blue-500'}`}>
                                          {isSentByMe ? `To: ${msg.toemail}` : `From: ${msg.fromemail}`}
                                      </div>
                                      {isAuthority && !isSentByMe && (
                                        <button 
                                          onClick={() => handleReply(msg.fromemail)}
                                          className="text-[9px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded shadow-sm font-bold transition-colors"
                                        >
                                          REPLY
                                        </button>
                                      )}
                                    </div>
                                    <p className="whitespace-pre-line leading-relaxed text-xs md:text-sm">{msg.message}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 w-full bg-white md:bg-gray-50 p-2 md:p-3 border-t border-gray-200 flex flex-col gap-2 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">TO:</span>
                    {isAuthority ? (
                        <input 
                            id="grievance-input"
                            type="text"
                            className="flex-1 border border-gray-200 p-2 rounded bg-white text-xs md:text-sm focus:ring-1 focus:ring-green-300 outline-none font-medium"
                            placeholder="Type student email..."
                            value={toInput}
                            onChange={(e) => setToInput(e.target.value)}
                        />
                    ) : (
                        <select 
                            className="flex-1 border border-gray-200 p-2 rounded bg-white text-xs md:text-sm focus:ring-1 focus:ring-green-300 outline-none"
                            value={toInput}
                            onChange={(e) => setToInput(e.target.value)}
                        >
                            {getVisibleOptions().map(auth => (
                                <option key={auth.email} value={auth.email}>{auth.label}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex gap-2">
                    <textarea 
                        className="flex-1 border border-gray-300 rounded-xl p-2 md:p-3 focus:outline-none focus:ring-1 focus:ring-green-300 resize-none h-12 md:h-16 bg-white text-xs md:text-sm"
                        placeholder={isAuthority ? "Type reply..." : "Explain your concern..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 md:px-6 rounded-xl h-12 md:h-16 transition-all active:scale-95 text-xs md:text-sm"
                    >
                        {loading ? "..." : "SEND"}
                    </button>
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:flex flex-1 bg-gray-50 p-4 flex-col gap-4 min-w-[200px] border-l border-gray-200 justify-start pt-10">
            <button 
                onClick={() => filterData(allMessages, "ALL")}
                className={`text-gray-700 text-sm font-medium py-4 rounded-xl shadow-sm transition-all active:scale-95 w-full uppercase tracking-wider border
                ${activeTab === 'ALL' ? 'bg-[#c9c0f0] border-purple-300 ring-2 ring-purple-200' : 'bg-[#dcd6f7] border-transparent hover:bg-[#c9c0f0]'}
                `}
            >
                My Requests
            </button>
            {isStudent && (
                <>
                    <button 
                        onClick={() => filterData(allMessages, "HOD")}
                        className={`text-gray-700 text-sm font-medium py-4 rounded-xl shadow-sm transition-all active:scale-95 w-full uppercase tracking-wider border
                        ${activeTab === 'HOD' ? 'bg-[#c9c0f0] border-purple-300 ring-2 ring-purple-200' : 'bg-[#dcd6f7] border-transparent hover:bg-[#c9c0f0]'}
                        `}
                    >
                        Academic (HOD)
                    </button>
                    <button 
                        onClick={() => filterData(allMessages, "WARDEN")}
                        className={`text-gray-700 text-sm font-medium py-4 rounded-xl shadow-sm transition-all active:scale-95 w-full uppercase tracking-wider border
                        ${activeTab === 'WARDEN' ? 'bg-[#c9c0f0] border-purple-300 ring-2 ring-purple-200' : 'bg-[#dcd6f7] border-transparent hover:bg-[#c9c0f0]'}
                        `}
                    >
                        Outpass / Outing
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
}

export default Grievance;