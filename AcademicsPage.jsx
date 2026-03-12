


import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  Trophy, GraduationCap, FlaskConical, Users, Calendar, 
  Brain, Bot, Cog, Calculator, Lightbulb, Leaf, Zap, 
  X, Code, Plus, Loader, Link as LinkIcon, MessageSquare, 
  FileText, Upload, CheckCircle, AlertCircle, Download 
} from "lucide-react";

import { 
  getAchievements, addAchievement, 
  getClubs, addClub, addPost, getClubPosts, 
  getAllPublications, createPublication, downloadPublication 
} from "../connection/connection.js";

/* --- CONFIGURATION --- */
const ALLOWED_POST_EMAILS = [
  "pixelro@rguktong.ac.in", "kaladharani@rguktong.ac.in",
  "artix@rguktong.ac.in", "techxcel@rguktong.ac.in",
  "icro@rguktong.ac.in", "khelsaathi@rguktong.ac.in",
  "sarvasrijana@rguktong.ac.in", "inauguration@rguktong.ac.in"
];

const ALLOWED_RD_EMAIL = "rd@rguktong.ac.in";

const getIcon = (iconName) => {
    const size = "text-2xl";
    switch (iconName?.toLowerCase()) {
        case "code": return <Code className={`text-amber-600 ${size}`} />;
        case "brain": return <Brain className={`text-stone-700 ${size}`} />;
        case "zap": return <Zap className={`text-orange-500 ${size}`} />;
        case "bot": return <Bot className={`text-stone-800 ${size}`} />;
        case "cog": return <Cog className={`text-amber-700 ${size}`} />;
        default: return <Users className={`text-stone-500 ${size}`} />;
    }
};

/* --- TOAST COMPONENT --- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed top-5 right-5 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-slide-in ${type === "success" ? "bg-stone-800 border-b-4 border-amber-500" : "bg-red-700"} text-white font-medium`}>
      {type === "success" ? <CheckCircle size={20} className="text-amber-400" /> : <AlertCircle size={20} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75"><X size={18} /></button>
    </div>
  );
};

export default function AcademicsPage() {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeClub, setActiveClub] = useState(null);
  const [clubViewMode, setClubViewMode] = useState("details");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => setToast({ show: true, message, type });

  const handleOpenClub = (club, mode = "details") => {
    setActiveClub(club);
    setClubViewMode(mode);
  };

  return (
    <div className="relative ml-1 mr-3 md:ml-69 mt-40 md:mt-30 w-[calc(screen-69px)] h-[calc(100vh-100px)] flex flex-col font-sans bg-stone-50">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

      {/* Header - RGUKT Brown & Amber Theme */}
      <div className="sticky top-0 z-10 bg-stone-800 border-b-4 border-amber-600 rounded-2xl flex flex-col items-center p-4 md:p-6 gap-1 shadow-lg overflow-hidden">
        <h2 className="text-amber-50 text-2xl md:text-4xl font-black text-center uppercase tracking-tight">ACADEMICS</h2>
        <div className="h-1 w-20 bg-amber-500 rounded-full mb-1"></div>
        <p className="text-center text-stone-300 text-xs md:text-sm max-w-full md:max-w-3xl font-medium">
          Official academic resources, university achievements, student communities, and research publications.
        </p>
      </div>

      {/* Navigation Blocks */}
      <div className="mt-6 px-2 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BlockCard title="Achievements" desc="Excellence in competitions." icon={<Trophy className="text-amber-600 w-10 h-10" />} active={selectedBlock === "achievements"} onClick={() => setSelectedBlock("achievements")} />
          <BlockCard title="Clubs" desc="University communities." icon={<GraduationCap className="text-stone-700 w-10 h-10" />} active={selectedBlock === "clubs"} onClick={() => setSelectedBlock("clubs")} />
          <BlockCard title="Research" desc="Innovations & publications." icon={<FlaskConical className="text-orange-700 w-10 h-10" />} active={selectedBlock === "research"} onClick={() => setSelectedBlock("research")} />
        </div>
      </div>

      <div className="mt-6 border-t border-stone-200" />

      {/* Main Content Area */}
      <div className="mt-2 flex-1 overflow-hidden flex flex-col md:flex-row relative">
        <div className="flex-1 overflow-y-auto p-2 md:p-4">
          {!selectedBlock && <div className="text-center text-stone-400 py-12 italic">Select a category above to view information.</div>}
          {selectedBlock === "achievements" && <AchievementsSection showToast={showToast} />}
          {selectedBlock === "clubs" && <ClubsSection onOpenClub={handleOpenClub} showToast={showToast} />}
          {selectedBlock === "research" && <ResearchSection showToast={showToast} />}
        </div>

        {/* Club Detail Sidebar */}
        {selectedBlock === "clubs" && (
          <aside className={`${activeClub ? 'fixed md:relative' : 'hidden md:block'} inset-0 md:inset-auto w-full md:w-96 bg-white border-l-2 border-stone-100 shadow-2xl z-50 md:z-auto transition-all ${activeClub ? "translate-x-0" : "translate-x-full"}`}>
            {activeClub ? <ClubDetail club={activeClub} viewMode={clubViewMode} onClose={() => setActiveClub(null)} showToast={showToast} /> : <div className="hidden md:block p-8 text-stone-300 font-bold uppercase text-center mt-20">Select a club</div>}
          </aside>
        )}
      </div>
    </div>
  );
}

function BlockCard({ title, desc, icon, onClick, active }) {
  return (
    <button onClick={onClick} className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 transition-all hover:shadow-lg text-left group ${active ? "bg-amber-50 border-amber-500 scale-[1.02]" : "bg-white border-stone-100 hover:border-amber-200"}`}>
      <div className={`flex-shrink-0 transition-transform group-hover:scale-110`}>{icon}</div>
      <div className="flex-1">
        <div className={`font-black uppercase text-sm ${active ? "text-amber-900" : "text-stone-800"}`}>{title}</div>
        <div className="text-[11px] text-stone-500 mt-1 font-medium">{desc}</div>
      </div>
    </button>
  );
}

/* --- ACHIEVEMENTS SECTION --- */
function AchievementsSection({ showToast }) {
  const authState = useSelector((state) => state.auth);
  const userRole = (authState?.userData?.user?.role || authState?.userData?.role || "student").toLowerCase();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titleOfAchivement: "", teamName: "", AchievedDate: "", Mentor: "", descriptionOfAchivements: "", teamMembers: [] });
  const [memberInput, setMemberInput] = useState({ idNo: "", name: "", branch: "" });

  const fetchAchievements = async () => {
    setLoading(true);
    try { const res = await getAchievements(); setAchievements(res.data || []); } 
    catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAchievements(); }, []);

  const addTeamMember = () => { if (memberInput.idNo && memberInput.name) { setFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, memberInput] })); setMemberInput({ idNo: "", name: "", branch: "" }); } };
  const removeTeamMember = (index) => { setFormData(prev => ({ ...prev, teamMembers: prev.teamMembers.filter((_, i) => i !== index) })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await addAchievement(formData); showToast("Success!"); setShowForm(false); fetchAchievements(); setFormData({ titleOfAchivement: "", teamName: "", AchievedDate: "", Mentor: "", descriptionOfAchivements: "", teamMembers: [] }); } 
    catch (err) { showToast("Error", "error"); }
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-stone-800 uppercase tracking-tight">University Achievements</h3>
        {(userRole === "faculty" || userRole === "administration") && <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-md"><Plus size={14} /> Record Achievement</button>}
      </div>
      {loading ? <div className="flex justify-center p-10"><Loader className="animate-spin text-amber-600" /></div> : achievements.length === 0 ? <p className="text-center text-stone-400 py-10">Records pending.</p> : (
        <div className="grid grid-cols-1 gap-4">
          {achievements.map((a) => (
            <div key={a.achievementId || Math.random()} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:border-amber-400 transition-all group">
              <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-black text-lg text-stone-900 leading-tight uppercase group-hover:text-amber-800">{a.titleOfAchivement}</h4>
                    <p className="text-xs text-amber-700 font-bold mt-1 tracking-wider uppercase">Team: {a.teamName}</p>
                </div>
                <span className="text-[10px] font-black bg-stone-100 px-3 py-1 rounded-full text-stone-500 uppercase">{new Date(a.AchievedDate).toLocaleDateString()}</span>
              </div>
              <p className="text-stone-600 text-sm mt-4 leading-relaxed italic border-l-4 border-amber-200 pl-4">{a.descriptionOfAchivements}</p>
              <div className="mt-6 pt-4 border-t border-stone-50">
                <div className="flex flex-wrap gap-2">{a.teamMembers?.map((m, i) => (<div key={i} className="flex items-center gap-2 bg-stone-800 px-4 py-1.5 rounded-full"><span className="text-[10px] font-bold text-amber-400">{m.name}</span></div>))}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal Form remains functional with new styling */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border-t-8 border-amber-600">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase">Add Achievement</h3><button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-red-500"><X size={24} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Title of Achievement" className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 font-bold" value={formData.titleOfAchivement} onChange={e => setFormData({...formData, titleOfAchivement: e.target.value})} />
                <div className="flex gap-2"><input placeholder="ID" className="flex-1 p-3 border rounded-xl" value={memberInput.idNo} onChange={e => setMemberInput({...memberInput, idNo: e.target.value})} /><input placeholder="Member Name" className="flex-1 p-3 border rounded-xl" value={memberInput.name} onChange={e => setMemberInput({...memberInput, name: e.target.value})} /><button type="button" onClick={addTeamMember} className="bg-stone-800 text-amber-400 px-6 rounded-xl font-black uppercase text-xs">Add</button></div>
                <div className="flex flex-wrap gap-2">{formData.teamMembers.map((m, i) => (<div key={i} className="bg-amber-100 px-3 py-1 rounded text-[10px] font-bold flex gap-2 items-center">{m.name} <X size={12} className="cursor-pointer" onClick={() => removeTeamMember(i)} /></div>))}</div>
                <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-xl font-black uppercase shadow-lg hover:bg-amber-700">Submit Record</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

/* --- CLUBS SECTION --- */
function ClubsSection({ onOpenClub, showToast }) {
  const authState = useSelector((state) => state.auth);
  const userRole = (authState?.userData?.user?.role || authState?.userData?.role || "student").toLowerCase();
  const userEmail = (authState?.userData?.user?.email || authState?.userData?.email || "").toLowerCase();
  
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ club_name: "", club_description: "", date_established: "" });

  useEffect(() => { const fetch = async () => { setLoading(true); try { const res = await getClubs(); setClubs(res.data || []); } catch (err) { console.error(err); } finally { setLoading(false); } }; fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await addClub(formData); showToast("Club Created!"); setShowForm(false); setFormData({ club_name: "", club_description: "", date_established: "" }); } 
    catch (err) { showToast("Error", "error"); }
  };

  const isAuthorizedToPost = (userRole === "administration") && ALLOWED_POST_EMAILS.includes(userEmail);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h3 className="text-xl font-black text-stone-800 uppercase tracking-tight">Student Clubs</h3><p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-1">Join the community</p></div>
        {(userRole === "faculty" || userRole === "administration") && <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-md flex items-center gap-2"><Plus size={14} /> New Club</button>}
      </div>
      {loading ? <div className="flex justify-center p-10"><Loader className="animate-spin text-amber-600" /></div> : (
        <div className="grid grid-cols-1 gap-4">
          {clubs.map((club) => (
            <div key={club.club_id} className="p-5 border border-stone-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-5">
                <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center border border-stone-200">{getIcon("users")}</div>
                <div className="flex-1">
                    <h4 className="text-lg font-black text-stone-800 uppercase leading-none">{club.club_name}</h4>
                    <p className="text-[11px] text-stone-400 font-bold uppercase mt-2 tracking-tighter italic">Established: {new Date(club.date_established).getFullYear()}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => onOpenClub(club, 'details')} className="text-[10px] font-bold bg-amber-600 text-white px-4 py-1.5 rounded-lg uppercase shadow-sm">Details</button>
                        <button onClick={() => onOpenClub(club, 'posts')} className="text-[10px] font-bold bg-stone-800 text-amber-400 px-4 py-1.5 rounded-lg uppercase flex items-center gap-2"><MessageSquare size={12} /> News</button>
                        {isAuthorizedToPost && <button onClick={() => onOpenClub(club, 'add_post')} className="text-[10px] font-bold bg-orange-100 text-orange-800 px-4 py-1.5 rounded-lg uppercase flex items-center gap-2 border border-orange-200"><Plus size={12} /> Admin</button>}
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClubDetail({ club, viewMode, onClose, showToast }) {
  const authState = useSelector((state) => state.auth);
  const userRole = (authState?.userData?.user?.role || authState?.userData?.role || "student").toLowerCase();
  const userEmail = (authState?.userData?.user?.email || authState?.userData?.email || "").toLowerCase();
  const [postForm, setPostForm] = useState(false);
  const [postData, setPostData] = useState({ post_title: "", post_content: "", link_url: "" });
  const [posts, setPosts] = useState([]);

  const canAddPost = (userRole === "administration") && ALLOWED_POST_EMAILS.includes(userEmail);

  useEffect(() => {
    if (viewMode === 'add_post' && canAddPost) setPostForm(true);
    else setPostForm(false);
    if(club) { getClubPosts(club.club_id).then(res => setPosts(res.data || [])).catch(err => console.error(err)); }
  }, [club, viewMode, canAddPost]);

  const handleAddPost = async (e) => {
      e.preventDefault();
      try { await addPost({ club_id: club.club_id, ...postData }); showToast("Posted!"); setPostForm(false); setPostData({ post_title: "", post_content: "", link_url: "" }); const res = await getClubPosts(club.club_id); setPosts(res.data || []); } 
      catch (err) { showToast("Failed", "error"); }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto bg-stone-50">
      <div className="flex justify-between items-start border-b-2 border-stone-200 pb-4 mb-6">
          <div><h4 className="text-xl font-black text-stone-800 uppercase leading-none">{club.club_name}</h4><p className="text-[10px] font-bold text-amber-700 uppercase mt-2">Community Profile</p></div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-lg"><X size={20} /></button>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-stone-100 shadow-sm">{club.club_description}</p>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4"><h5 className="font-black text-xs uppercase text-stone-500 tracking-widest">Recent Announcements</h5>{canAddPost && !postForm && <button onClick={() => setPostForm(true)} className="text-[10px] font-bold text-amber-700 uppercase flex gap-1 items-center border border-amber-200 px-2 py-1 rounded-lg"><Plus size={12}/> New Post</button>}</div>
        {postForm && canAddPost && (
            <form onSubmit={handleAddPost} className="bg-white p-4 rounded-xl mb-6 border-2 border-amber-500 shadow-md">
                <input placeholder="Announcement Title" className="w-full p-2 border border-stone-200 rounded-lg mb-2 text-xs font-bold" value={postData.post_title} onChange={e => setPostData({...postData, post_title: e.target.value})} required/>
                <textarea placeholder="Message content..." className="w-full p-2 border border-stone-200 rounded-lg mb-2 text-xs h-20" value={postData.post_content} onChange={e => setPostData({...postData, post_content: e.target.value})} required></textarea>
                <button className="w-full text-xs font-black bg-stone-800 text-amber-400 py-2 rounded-lg uppercase tracking-widest">Publish Post</button>
            </form>
        )}
        <div className="space-y-3">
            {posts.map(p => (
                <div key={p.post_id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                    <div className="font-black text-xs text-stone-800 uppercase mb-1">{p.post_title}</div>
                    <div className="text-xs text-stone-500 leading-snug">{p.post_content}</div>
                    <div className="text-right text-[9px] font-black text-amber-600 mt-2 uppercase italic">{new Date(p.post_date).toLocaleDateString()}</div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* --- RESEARCH SECTION --- */
function ResearchSection({ showToast }) {
  const authState = useSelector((state) => state.auth);
  const userRole = (authState?.userData?.user?.role || authState?.userData?.role || "student").toLowerCase();
  const userEmail = (authState?.userData?.user?.email || authState?.userData?.email || "").toLowerCase();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const canAddPublication = (userRole === "administration") && (userEmail === ALLOWED_RD_EMAIL);

  const [formData, setFormData] = useState({ title: "", description: "", published_by: "", published_venue: "" });
  const [file, setFile] = useState(null);

  const fetchPublications = async () => {
    setLoading(true);
    try { const res = await getAllPublications(); setPublications(res.data || []); } catch (err) { console.error("Error"); } 
    finally { setLoading(false); }
  };
  useEffect(() => { fetchPublications(); }, []);

  const handleDownload = async (id, title) => {
    setDownloadingId(id);
    try {
      const response = await downloadPublication(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Download started!");
    } catch (err) { showToast("Failed", "error"); } 
    finally { setDownloadingId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return showToast("File required", "error");
    const data = new FormData();
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    data.append("file", file);
    setUploading(true);
    try { await createPublication(data); showToast("Success!"); setShowForm(false); fetchPublications(); } 
    catch (err) { showToast("Failed", "error"); } finally { setUploading(false); }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h3 className="text-xl font-black text-stone-800 uppercase tracking-tight">R&D Publications</h3><p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-1">Innovative findings & papers</p></div>
        {canAddPublication && <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase shadow-md flex items-center gap-2 transition-transform active:scale-95"><Plus size={14} /> Add Publication</button>}
      </div>

      {loading ? <div className="flex justify-center p-10"><Loader className="animate-spin text-amber-600" /></div> : publications.length === 0 ? <p className="text-center text-stone-400 py-10 border-2 border-dashed rounded-2xl border-stone-200">No research recorded.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publications.map((pub) => (
            <div key={pub.id || pub.publication_id} className="bg-white border-2 border-stone-100 rounded-2xl p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4 mb-3">
                    <div className="p-2 bg-amber-100 rounded-lg"><FlaskConical className="text-amber-800" size={18} /></div>
                    <div><h4 className="font-black text-stone-800 text-sm uppercase leading-tight line-clamp-2">{pub.title}</h4><p className="text-[10px] font-bold text-amber-700 mt-1 uppercase tracking-tighter italic">Author: {pub.published_by}</p></div>
                </div>
                <p className="text-xs text-stone-500 mb-4 line-clamp-3 leading-relaxed font-medium">{pub.description}</p>
                <div className="text-[9px] font-bold text-stone-400 mb-4 border-t pt-3 uppercase tracking-widest flex justify-between">
                    <span>Venue: {pub.published_venue}</span>
                    <span>{new Date(pub.published_at).getFullYear()}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(pub.id || pub.publication_id, pub.title)} 
                disabled={downloadingId === (pub.id || pub.publication_id)}
                className="w-full text-[10px] font-black bg-stone-800 text-amber-400 py-2.5 rounded-xl uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {downloadingId === (pub.id || pub.publication_id) ? <Loader className="animate-spin" size={14} /> : <Download size={14} />} 
                Access Publication
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 border-t-8 border-amber-600">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase">Publish Research</h3><button onClick={() => setShowForm(false)} className="text-stone-300 hover:text-red-500 transition-colors"><X size={24} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Publication Title" className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <div className="flex gap-3"><input required placeholder="Lead Author" className="flex-1 p-3 border rounded-xl" value={formData.published_by} onChange={e => setFormData({...formData, published_by: e.target.value})} /><input required placeholder="Journal/Venue" className="flex-1 p-3 border rounded-xl" value={formData.published_venue} onChange={e => setFormData({...formData, published_venue: e.target.value})} /></div>
              <textarea required placeholder="Brief abstract..." className="w-full p-3 border rounded-xl h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center cursor-pointer hover:bg-amber-50 relative">
                  <input type="file" required accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                  <Upload className="text-amber-600 mx-auto mb-1" size={24} /><span className="text-[10px] font-black uppercase text-stone-500">{file ? file.name : "Attach Manuscript (PDF)"}</span>
              </div>
              <button type="submit" disabled={uploading} className="w-full bg-amber-600 text-white py-4 rounded-xl font-black uppercase shadow-lg hover:bg-amber-700 disabled:opacity-50">{uploading ? <Loader className="animate-spin" /> : "Verify & Publish"}</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}