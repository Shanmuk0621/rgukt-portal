import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa"; 
import { sendMention, getMentions } from "../connection/connection.js";

/* --- 1. TOAST COMPONENT --- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-slide-in ${
      type === "success" ? "bg-green-700" : type === "error" ? "bg-red-700" : "bg-[#5D4037]"
    } text-white font-medium`}>
      {type === "success" ? <FaCheckCircle className="text-xl" /> : <FaTimesCircle className="text-xl" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75"><FaTimesCircle /></button>
    </div>
  );
};

function Mentions() {
  const [message, setMessage] = useState("");
  const [mentionsList, setMentionsList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  /* --- HELPER: DOMAIN FORMATTER --- */
  // Replaces the internal domains with @rguktong.ac.in for display
  const formatDisplayEmail = (text) => {
    if (!text) return "Unknown";
    return text.replace(/@(rguktinfosnity\.ac\.in|rguktinfosinity\.ac\.in)/g, "@rguktong.ac.in");
  };

  const fetchMentions = async () => {
    setLoading(true);
    try {
      const response = await getMentions();
      const data = response.result?.rows || response.result || response.data || [];
      setMentionsList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch mentions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentions();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendMention({ message: message });
      setMessage("");
      showToast("Mentioned successfully!", "success");
      fetchMentions(); 
    } catch (error) {
      console.error("Failed to send mention:", error);
      showToast("Failed to mention.", "error");
    }
  };

  return (
    /* OUTER LAYOUT UNCHANGED */
    <div className="relative ml-1 mr-3 md:ml-69 mt-40 md:mt-30 w-[calc(screen-69px)] h-[calc(100vh-100px)] flex flex-col">
      
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}

      {/* Header - RGUKT Brownish Theme */}
      <div className="sticky top-0 z-10 bg-[#d7ccc8] border border-[#bcaaa4] rounded-2xl flex flex-col items-center justify-center p-3 md:p-4 gap-1">
        <h2 className="text-[#3e2723] text-2xl md:text-4xl text-center font-bold">MENTIONS</h2>
        <p className="text-xs md:text-sm text-[#5d4037] text-center max-w-3xl">
          This section displays all messages where you have been mentioned.
        </p>
        <p className="text-xs md:text-sm text-red-700 font-medium text-center">
          Note: Use <span className="font-semibold text-[#3e2723]">#username@rguktong.ac.in</span> to mention someone.
        </p>
      </div>

      {/* Mentions List */}
      <div className="flex-1 overflow-y-auto mt-4 pb-40 px-2 md:px-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center mt-10"><span className="text-[#8d6e63]">Loading...</span></div>
        ) : mentionsList.length === 0 ? (
          <p className="text-center text-[#8d6e63] mt-10">No mentions yet.</p>
        ) : (
          mentionsList.map((item, index) => (
            <div key={index} className="bg-white border border-[#d7ccc8] rounded-xl p-4 shadow-sm max-w-3xl">
              <p className="text-sm text-[#8d6e63] mb-1">
                {/* Formatted fromemail for display */}
                From: <span className="font-medium text-[#5d4037]">{formatDisplayEmail(item.fromemail)}</span>
              </p>
              <p className="text-[#3e2723] text-sm md:text-base whitespace-pre-wrap">
                {/* Formatted message content to show @rguktong.ac.in instead of internal domains */}
                {formatDisplayEmail(item.message)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-[#efebe9] p-4 border-t border-[#d7ccc8] md:px-16 flex flex-col gap-2">
        <div className="flex w-full md:w-3/4 gap-2">
          <textarea
            rows={3}
            placeholder="Write a message... e.g. #UserName@rguktong.ac.in"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-4 bg-white border border-[#bcaaa4] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#8d6e63] text-[#3e2723]"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-[#5d4037] text-white py-3 px-6 rounded-xl hover:bg-[#3e2723] transition-colors flex-shrink-0 disabled:bg-[#d7ccc8] disabled:text-[#a1887f]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Mentions;