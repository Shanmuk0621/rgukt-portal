import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { PenBox, X, Send } from "lucide-react"; 
import Mailbox from "../components/Mailbox";
import { sendMail as connectionSendMail } from "../connection/connection";

function Mail() {
  const [selectedMail, setSelectedMail] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- THE DOMAIN FIXERS ---
  const DISPLAY_DOMAIN = "@rguktong.ac.in";
  const INTERNAL_DOMAIN = "@rguktinfosnity.ac.in"; // What the DB uses

  // 1. Convert to DB domain for sending/fetching
  const toInternal = (email) => {
    if (!email) return "";
    return email.toLowerCase().replace(DISPLAY_DOMAIN, INTERNAL_DOMAIN);
  };

  // 2. Convert to UI domain for the user to see
  const toDisplay = (email) => {
    if (!email) return "System";
    return email.toLowerCase()
      .replace("@rguktinfosnity.ac.in", DISPLAY_DOMAIN)
      .replace("@rguktinfosinity.ac.in", DISPLAY_DOMAIN)
      .replace("@infosinity.ac.in", DISPLAY_DOMAIN);
  };

  const handleSendMail = async () => {
    if (!toEmail || !subject || !message) {
      toast.error("All fields are required!");
      return;
    }

    if (!toEmail.toLowerCase().endsWith(DISPLAY_DOMAIN)) {
      toast.error(`Recipient must be ${DISPLAY_DOMAIN}`);
      return;
    }

    setLoading(true);
    try {
      // Transformation happens HERE before sending
      const dbEmail = toInternal(toEmail);
      const response = await connectionSendMail({ toEmail: dbEmail, subject, message });
      
      if (response) {
        toast.success("Mail sent successfully!");
        setIsComposeOpen(false);
        setToEmail(""); setSubject(""); setMessage("");
      }
    } catch (err) {
      toast.error("Failed to send mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full md:w-[calc(100%-256px)] md:ml-[256px] pt-24 md:pt-28 px-4 pb-6 transition-all duration-300">
      <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />

      {!selectedMail && (
        <div className="shrink-0 bg-gradient-to-r from-[#4a3728] to-[#78350f] rounded-2xl flex flex-col items-center p-5 mb-4 shadow-lg border border-white/10">
          <h2 className="text-white text-xl md:text-2xl font-bold uppercase tracking-[0.2em]">University Inbox</h2>
        </div>
      )}

      <div className="flex-1 bg-white/70 backdrop-blur-md rounded-2xl border border-orange-100/30 shadow-sm overflow-hidden relative">
        {!selectedMail ? (
          <div className="h-full overflow-y-auto">
             {/* CRITICAL: If Mailbox takes an 'email' prop, pass the INTERNAL one.
                Example: <Mailbox userEmail={toInternal(currentUserEmail)} />
             */}
             <Mailbox onSelectMail={setSelectedMail} />
          </div>
        ) : (
          <div className="absolute inset-0 z-20 p-6 bg-white flex flex-col h-full overflow-y-auto">
            <div className="border-b border-orange-100 pb-5">
              <h3 className="text-xl font-bold text-[#4a3728] mb-3">{selectedMail.subject}</h3>
              {/* Transform FROM for display */}
              <p className="text-xs text-gray-500">From: {toDisplay(selectedMail.fromemail)}</p>
              {/* Transform TO for display */}
              <p className="text-xs text-gray-400">To: {toDisplay(selectedMail.toemail)}</p>
            </div>
            <div className="py-8 text-gray-700 flex-1 whitespace-pre-wrap">{selectedMail.message}</div>
            <button onClick={() => setSelectedMail(null)} className="w-full bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-semibold transition-colors">Back</button>
          </div>
        )}
      </div>

      {/* Compose Button and Modal remain the same... */}
      {!selectedMail && !isComposeOpen && (
        <button onClick={() => setIsComposeOpen(true)} className="fixed bottom-10 right-10 bg-[#78350f] text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2">
          <PenBox size={24} />
          <span className="hidden md:inline font-bold uppercase text-xs">Compose</span>
        </button>
      )}

      {isComposeOpen && (
        <div className="fixed inset-0 bg-[#2d1e16]/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-[#4a3728] p-5 text-white flex justify-between items-center">
              <h3 className="font-bold">NEW MESSAGE</h3>
              <button onClick={() => setIsComposeOpen(false)}><X size={24}/></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <input 
                type="email" placeholder={`Recipient ${DISPLAY_DOMAIN}`} value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-[#78350f]"
              />
              <input 
                type="text" placeholder="Subject" value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-[#78350f]"
              />
              <textarea 
                rows={5} placeholder="Message body..." value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-[#78350f] resize-none"
              />
              <button onClick={handleSendMail} disabled={loading} className="bg-[#78350f] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3">
                {loading ? "Sending..." : "SEND MESSAGE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mail;