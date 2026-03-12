
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { 
  FaFilePdf, FaCloudUploadAlt, FaSearch, FaDownload, 
  FaSpinner, FaCheckCircle, FaTimesCircle, FaBan, FaFolder, FaChevronLeft 
} from "react-icons/fa";
import { uploadFile, getUserFiles, downloadFile } from "../connection/connection.js";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 transition-all transform ${type === "success" ? "bg-green-700" : type === "error" ? "bg-red-700" : "bg-stone-700"} text-white text-sm font-medium`}>
      {type === "success" ? <FaCheckCircle /> : type === "error" ? <FaTimesCircle /> : <FaBan />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75"><FaTimesCircle /></button>
    </div>
  );
};

export default function FilePage() {
  const authState = useSelector((state) => state.auth);
  const userRole = (authState?.userData?.user?.role || authState?.userData?.role || "student").toLowerCase();

  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  const [currentFolder, setCurrentFolder] = useState(null); 
  const departments = ["ECE", "CSE", "EEE", "MECH", "CIVIL"];

  const abortControllerRef = useRef(null);
  const showToast = (message, type = "success") => setToast({ show: true, message, type });

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await getUserFiles();
      // Ensure we are setting an array even if response.files is undefined
      setFiles(response.files || []);
    } catch (error) { 
      showToast("Failed to load files", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { if (userRole !== "administration") fetchFiles(); }, [userRole]);

  const handleUpload = async () => {
    if (!selectedFile) return showToast("Please select a file first", "error");
    if (!currentFolder) return showToast("Please select a folder first", "error");
    
    const formData = new FormData();
    // We prefix the filename with the department so the filter works even without DB changes
    const newFileName = `${currentFolder}_${selectedFile.name}`;
    formData.append("file", selectedFile, newFileName); 
    formData.append("department", currentFolder); 

    setUploading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      await uploadFile(formData, { signal: controller.signal });
      showToast("Uploaded successfully!", "success");
      setSelectedFile(null);
      fetchFiles(); 
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
         showToast("Upload failed", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  // --- THE FIX IS HERE ---
  const filteredFiles = files.filter((file) => {
    const fileName = file.filename || "";
    const matchesSearch = fileName.toLowerCase().includes(search.toLowerCase());
    
    if (!currentFolder) return matchesSearch;

    // Check 1: If your backend supports a department field
    const matchesDeptField = file.department === currentFolder;
    
    // Check 2: Fallback - Check if filename starts with "DEPT_" (e.g., "CSE_notes.pdf")
    const matchesNamingConvention = fileName.startsWith(`${currentFolder}_`);

    return matchesSearch && (matchesDeptField || matchesNamingConvention);
  });

  const handleDownload = async (public_id, filename) => {
    try {
      const response = await downloadFile(public_id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { showToast("Download failed", "error"); }
  };

  if (userRole === "administration") return <div className="h-screen flex items-center justify-center text-stone-500 font-serif">Access Denied</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full md:w-[calc(100%-290px)] md:ml-[290px] mt-20 md:mt-24 px-2 md:px-0 relative font-sans bg-stone-50">
      
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}

      {/* Header */}
      <div className="shrink-0 bg-stone-800 border-b-4 border-amber-600 rounded-xl px-4 py-4 shadow-md mx-1">
        <div className="flex items-center justify-between mb-2">
            {currentFolder && (
                <button onClick={() => setCurrentFolder(null)} className="text-amber-400 hover:text-white flex items-center gap-1 text-sm">
                    <FaChevronLeft /> Back
                </button>
            )}
            <h2 className="text-xl md:text-2xl font-bold text-center flex-1 text-amber-50">
                {currentFolder ? `${currentFolder} FILES` : "RGUKT REPOSITORY"}
            </h2>
        </div>
        <div className="relative mt-1 w-full md:w-2/3 mx-auto">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 pl-9 text-sm rounded-lg bg-stone-700 text-white outline-none focus:ring-2 focus:ring-amber-500"
            />
        </div>
      </div>

      {/* Folder/Files Display */}
      <div className="flex-1 overflow-y-auto mt-4 px-2 pb-32">
        {loading ? (
            <div className="flex justify-center mt-10"><FaSpinner className="animate-spin text-2xl text-amber-700" /></div>
        ) : !currentFolder ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {departments.map((dept) => (
                    <div key={dept} onClick={() => setCurrentFolder(dept)} className="cursor-pointer group flex flex-col items-center p-6 bg-white border-2 border-stone-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition-all">
                        <FaFolder className="text-5xl text-amber-600 group-hover:text-amber-500 mb-2" />
                        <span className="font-bold text-stone-700">{dept}</span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredFiles.map((file) => (
                    <div key={file.id || file.public_id} className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm flex flex-col justify-between h-[120px]">
                        <div className="flex items-start gap-2">
                            <FaFilePdf className="text-orange-700 text-lg flex-shrink-0 mt-1" />
                            <div className="overflow-hidden min-w-0">
                                <p className="text-xs font-semibold text-stone-800 truncate">{file.filename.replace(`${currentFolder}_`, "")}</p>
                                <p className="text-[10px] text-stone-500 truncate">By: {file.user_email?.split('@')[0] || 'Unknown'}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDownload(file.public_id, file.filename)} className="w-full mt-2 py-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200 hover:bg-amber-600 hover:text-white transition-all">
                            <FaDownload className="inline mr-1" /> Download
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Upload Bar */}
      <div className={`absolute bottom-0 left-0 w-full bg-stone-100 border-t-2 p-3 md:p-4 flex flex-col md:flex-row gap-3 items-center shadow-2xl rounded-t-2xl z-20 ${!currentFolder && 'hidden'}`}>
        <div className="w-full md:flex-1">
            <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Upload to {currentFolder}</p>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full border border-stone-300 rounded-lg p-2 text-xs bg-white"
              disabled={uploading}
            />
        </div>
        <button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full md:w-auto bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-amber-800 disabled:bg-stone-400 h-10 transition-colors">
            {uploading ? <FaSpinner className="animate-spin" /> : "Upload File"}
        </button>
      </div>
    </div>
  );
}