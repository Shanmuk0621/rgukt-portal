import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  PenTool, Calendar, User, Trash2, Edit2, Plus, X, 
  Loader, CheckCircle, AlertCircle, FileText, BookOpen
} from "lucide-react";

import { 
  getAllBlogs, 
  postBlog, 
  editBlog, 
  deleteBlog 
} from "../connection/connection.js";

/* =================================================================================
   1. TOAST COMPONENT
   ================================================================================= */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 z-[150] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-slide-in ${
      type === "success" ? "bg-stone-800 border-b-4 border-amber-500" : "bg-red-700"
    } text-white font-medium`}>
      {type === "success" ? <CheckCircle size={20} className="text-amber-400" /> : <AlertCircle size={20} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-75"><X size={18} /></button>
    </div>
  );
};

/* =================================================================================
   2. MAIN COMPONENT
   ================================================================================= */
export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Reading Mode State
  const [readingBlog, setReadingBlog] = useState(null);

  const [viewFilter, setViewFilter] = useState("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBlogId, setCurrentBlogId] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", author_name: "" });

  const authState = useSelector((state) => state.auth);
  const currentUserEmail = (authState?.userData?.user?.email || authState?.userData?.email || "").toLowerCase();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await getAllBlogs();
      setBlogs(res.data || []);
    } catch (err) {
      showToast("Failed to load blogs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ title: "", content: "", author_name: "" });
    setIsEditMode(false);
    setShowForm(true);
  };

  const handleOpenEdit = (blog) => {
    setFormData({ 
      title: blog.title, 
      content: blog.content, 
      author_name: blog.author_name 
    });
    setCurrentBlogId(blog.blog_id);
    setIsEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (blogId) => {
    if(!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
        await deleteBlog(blogId);
        showToast("Blog Deleted Successfully!");
        setBlogs(prev => prev.filter(b => b.blog_id !== blogId));
        if (readingBlog?.blog_id === blogId) setReadingBlog(null);
    } catch (err) {
        showToast("Failed to delete blog", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await editBlog(currentBlogId, formData);
        showToast("Blog Updated Successfully!");
      } else {
        await postBlog(formData);
        showToast("Blog Posted Successfully!");
      }
      setShowForm(false);
      fetchBlogs();
    } catch (err) {
      showToast("Operation Failed", "error");
    }
  };

  const displayedBlogs = viewFilter === "my"
    ? blogs.filter(b => b.is_owner === true || b.author_email === currentUserEmail)
    : blogs;

  return (
    <div className="relative ml-1 mr-3 md:ml-69 mt-40 md:mt-30 w-[calc(screen-69px)] h-[calc(100vh-100px)] flex flex-col font-sans bg-stone-50">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-stone-800 border-b-4 border-amber-600 rounded-2xl flex flex-col items-center p-4 md:p-6 gap-1 shadow-lg">
        <h2 className="text-amber-50 text-2xl md:text-4xl font-black text-center uppercase tracking-tight">Campus Voices</h2>
        <div className="h-1 w-16 bg-amber-500 rounded-full mt-1"></div>
        <p className="text-center text-stone-300 text-xs md:text-sm max-w-full md:max-w-3xl font-medium mt-2 leading-relaxed">
          Express your ideas, share campus stories, and engage with the RGUKT community.
        </p>
      </div>

      {/* Action Bar */}
      <div className="mt-6 px-2 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="flex bg-stone-200 p-1 rounded-xl shadow-inner">
            <button 
                onClick={() => setViewFilter("all")}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewFilter === "all" ? "bg-stone-800 text-amber-500 shadow-md" : "text-stone-500 hover:text-stone-700"}`}
            >
                Public Feed
            </button>
            <button 
                onClick={() => setViewFilter("my")}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewFilter === "my" ? "bg-stone-800 text-amber-500 shadow-md" : "text-stone-500 hover:text-stone-700"}`}
            >
                My Entries
            </button>
        </div>

        <button 
            onClick={handleOpenCreate} 
            className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-700 transition-all shadow-md w-full sm:w-auto justify-center"
        >
            <PenTool size={16} /> Write Blog
        </button>
      </div>

      <div className="mt-6 border-t border-stone-200" />

      {/* Blog List Area */}
      <div className="mt-2 flex-1 overflow-y-auto p-2 md:p-4 pb-10">
        {loading ? (
            <div className="flex justify-center p-20"><Loader className="animate-spin text-amber-600" size={40} /></div>
        ) : displayedBlogs.length === 0 ? (
            <div className="text-center py-24 text-stone-400 border-4 border-dashed rounded-3xl border-stone-100 bg-white flex flex-col items-center gap-3 mx-4">
                <FileText size={64} className="opacity-20 text-stone-800" />
                <p className="font-black uppercase text-xs tracking-widest">No entries found.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedBlogs.map((blog) => (
                    <BlogCard 
                        key={blog.blog_id} 
                        blog={blog} 
                        currentUserEmail={currentUserEmail}
                        onEdit={() => handleOpenEdit(blog)}
                        onDelete={() => handleDelete(blog.blog_id)}
                        onRead={() => setReadingBlog(blog)}
                    />
                ))}
            </div>
        )}
      </div>

      {/* --- FEATURE: READ FULL MODAL --- */}
      {readingBlog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border-t-8 border-amber-600">
                {/* Modal Navigation */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-stone-100 bg-stone-50">
                    <div className="flex items-center gap-3">
                        <BookOpen className="text-amber-600" size={24} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Campus Reader</span>
                    </div>
                    <button onClick={() => setReadingBlog(null)} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"><X size={28} /></button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-stone-900 uppercase tracking-tight mb-6 leading-tight">
                        {readingBlog.title}
                    </h1>

                    <div className="flex items-center gap-6 text-xs font-black text-amber-700 uppercase tracking-widest mb-10 pb-6 border-b-2 border-stone-100">
                        <div className="flex items-center gap-2">
                            <User size={16} strokeWidth={3} className="text-stone-800" /> 
                            By {readingBlog.author_name}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} strokeWidth={3} className="text-stone-400" /> 
                            {new Date(readingBlog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    <div className="text-stone-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                        {readingBlog.content}
                    </div>
                </div>

                {/* Footer Actions */}
                {readingBlog.is_owner && (
                  <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
                      <button onClick={() => { handleOpenEdit(readingBlog); setReadingBlog(null); }} className="px-6 py-2 bg-stone-800 text-amber-400 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-black transition-all shadow-md"><Edit2 size={14}/> Edit Story</button>
                      <button onClick={() => { handleDelete(readingBlog.blog_id); setReadingBlog(null); }} className="px-6 py-2 bg-red-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-red-800 transition-all shadow-md"><Trash2 size={14}/> Delete</button>
                  </div>
                )}
            </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border-t-8 border-amber-600">
            <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
                <h3 className="text-xl font-black text-stone-800 uppercase tracking-tighter">{isEditMode ? "Update Story" : "New Publication"}</h3>
                <button onClick={() => setShowForm(false)} className="text-stone-300 hover:text-red-500"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <input required className="w-full p-4 border-2 border-stone-100 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none bg-stone-50" placeholder="Publication Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <input required className="w-full p-4 border-2 border-stone-100 rounded-2xl text-sm font-bold focus:border-amber-500 outline-none bg-stone-50" placeholder="Display Author Name" value={formData.author_name} onChange={e => setFormData({...formData, author_name: e.target.value})} />
                <textarea required className="w-full p-4 border-2 border-stone-100 rounded-2xl text-sm h-64 focus:border-amber-500 outline-none bg-stone-50 resize-none leading-relaxed" placeholder="Write your campus story here..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} ></textarea>
                <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-amber-700">Publish Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =================================================================================
   3. BLOG CARD COMPONENT
   ================================================================================= */
function BlogCard({ blog, currentUserEmail, onEdit, onDelete, onRead }) {
    const isOwner = blog.is_owner === true || (currentUserEmail && blog.author_email === currentUserEmail);

    return (
        <div 
            onClick={onRead}
            className="bg-white border-2 border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col h-full relative group cursor-pointer"
        >
            {isOwner && (
                <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/95 p-1.5 rounded-xl shadow-sm border border-stone-100">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-stone-700 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-stone-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
            )}

            <div className="flex-1">
                <h4 className="font-black text-lg text-stone-900 mb-3 line-clamp-2 pr-16 uppercase tracking-tight group-hover:text-amber-800 transition-colors">
                  {blog.title}
                </h4>
                
                <div className="flex items-center gap-4 text-[10px] font-black text-stone-400 uppercase tracking-widest mb-5 border-b border-stone-50 pb-4">
                    <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-md text-amber-700">
                        <User size={12} strokeWidth={3} /> {blog.author_name}
                    </div>
                </div>

                <p className="text-sm text-stone-500 line-clamp-6 whitespace-pre-wrap leading-relaxed font-medium">
                    {blog.content}
                </p>
            </div>

            <div className="mt-6 pt-5 border-t border-stone-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-stone-300 uppercase tracking-tighter">
                  {new Date(blog.created_at).toLocaleDateString()}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRead(); }}
                  className="text-[10px] font-black text-amber-700 uppercase tracking-widest group-hover:underline"
                >
                  Read Full &rarr;
                </button>
            </div>
        </div>
    );
}