import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Search, Plus, X, Briefcase, Building2, GraduationCap, User, Loader2 } from "lucide-react"; 
import { getAlumniList, addOfflineAlumni } from "../connection/connection.js"; 

const AUTHORIZED_EMAIL = "placementcell@rguktong.ac.in";

export default function AlumniPage() {
  const [alumniData, setAlumniData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    student_name: "", idno: "", hired_company: "", role: "", hired_date: "", graduation_year: ""
  });

  const user = useSelector((state) => state.auth?.userData?.user || state.auth?.userData);
  const isPlacementCell = user?.email === AUTHORIZED_EMAIL;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAlumniList();
      setAlumniData(res.result || []);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const years = useMemo(() => {
    const allYears = alumniData.map(a => a.graduation_year).filter(Boolean);
    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  }, [alumniData]);

  const filtered = useMemo(() => {
    let list = [...alumniData];
    if (selectedYear !== "All") list = list.filter(a => String(a.graduation_year) === String(selectedYear));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name?.toLowerCase().includes(q) || a.company_name?.toLowerCase().includes(q));
    }
    return list;
  }, [selectedYear, search, alumniData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await addOfflineAlumni(formData);
      setShowModal(false);
      fetchData();
      setFormData({ student_name: "", idno: "", hired_company: "", role: "", hired_date: "", graduation_year: "" });
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative ml-1 mr-3 md:ml-69 mt-40 md:mt-30 w-[calc(100vw-20px)] md:w-[calc(100vw-300px)] h-[calc(100vh-100px)] flex flex-col overflow-hidden bg-stone-50 font-sans">
      
      {/* Header - RGUKT Branding */}
      <div className="sticky top-0 z-10 bg-stone-800 border-b-4 border-amber-600 flex flex-col items-center p-6 shadow-lg">
        <h2 className="text-2xl font-black text-amber-50 tracking-tight uppercase">Alumni Directory</h2>
        <div className="h-1 w-16 bg-amber-500 rounded-full mt-1"></div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border-b border-stone-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedYear("All")} 
            className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase transition-all border-2 ${selectedYear==="All"?"bg-amber-600 border-amber-600 text-white shadow-md":"bg-white text-stone-600 border-stone-100"}`}
          >
            All Batches
          </button>
          {years.map(y => (
            <button 
                key={y} 
                onClick={() => setSelectedYear(String(y))} 
                className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase transition-all border-2 ${String(selectedYear)===String(y)?"bg-amber-600 border-amber-600 text-white shadow-md":"bg-white text-stone-600 border-stone-100"}`}
            >
                {y}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
                <input 
                    type="search" 
                    placeholder="Search by name or company..." 
                    className="w-full pl-9 pr-4 py-2 border-2 border-stone-100 rounded-xl text-sm focus:border-amber-500 outline-none bg-stone-50 font-medium" 
                    onChange={e=>setSearch(e.target.value)} 
                />
            </div>
            {isPlacementCell && (
                <button 
                    onClick={() => setShowModal(true)} 
                    className="flex items-center gap-2 bg-stone-800 text-amber-400 border border-amber-900/50 px-5 py-2 rounded-xl text-xs font-black uppercase hover:bg-black transition-all shadow-md"
                >
                    <Plus size={16}/> Add
                </button>
            )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
                <Loader2 className="animate-spin text-stone-800" size={40} />
                <p className="font-black uppercase text-xs tracking-widest text-stone-600">Accessing Records...</p>
            </div>
        ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-stone-400 uppercase font-black text-xs border-4 border-dashed rounded-3xl border-stone-100">
                No alumni records found for this batch.
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((alum, i) => (
                    <div key={i} className="bg-white border-2 border-stone-100 rounded-2xl p-5 shadow-sm flex items-center gap-5 hover:border-amber-400 hover:shadow-xl transition-all duration-300 group">
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center font-black text-xl text-stone-800 uppercase group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                            {alum.name?.[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg text-stone-800 uppercase leading-none">{alum.name}</h3>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 uppercase mt-2 tracking-tight italic">
                                <Briefcase size={12} /> {alum.role} @ {alum.company_name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-2 font-mono tracking-widest uppercase">
                                <GraduationCap size={12} className="text-stone-300" /> Class of {alum.graduation_year}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm shadow-inner" onClick={()=>setShowModal(false)}></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border-t-8 border-amber-600 animate-scale-in">
                <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
                    <h3 className="font-black text-xl text-stone-800 uppercase tracking-tighter">Add Alumni Record</h3>
                    <button onClick={()=>setShowModal(false)} className="text-stone-300 hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Full Name</label>
                        <input required className="w-full p-3 border-2 border-stone-100 rounded-xl outline-none focus:border-amber-500 font-bold bg-stone-50" onChange={e=>setFormData({...formData, student_name:e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Student ID</label>
                            <input required className="w-full p-3 border-2 border-stone-100 rounded-xl outline-none focus:border-amber-500 font-bold bg-stone-50" onChange={e=>setFormData({...formData, idno:e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Graduation Year</label>
                            <input required type="number" className="w-full p-3 border-2 border-stone-100 rounded-xl outline-none focus:border-amber-500 font-bold bg-stone-50" onChange={e=>setFormData({...formData, graduation_year:e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Hired Company</label>
                            <input required className="w-full p-3 border-2 border-stone-100 rounded-xl outline-none focus:border-amber-500 font-bold bg-stone-50" onChange={e=>setFormData({...formData, hired_company:e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Job Role</label>
                            <input required className="w-full p-3 border-2 border-stone-100 rounded-xl outline-none focus:border-amber-500 font-bold bg-stone-50" onChange={e=>setFormData({...formData, role:e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-1">Hired Date</label>
                        <input required type="date" className="w-full p-3 border-2 border-stone-100 rounded-xl outline-none focus:border-amber-500 font-bold bg-stone-50" onChange={e=>setFormData({...formData, hired_date:e.target.value})} />
                    </div>
                    
                    <button 
                        disabled={formLoading}
                        className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-amber-700 transition-all mt-4 disabled:opacity-50"
                    >
                        {formLoading ? "Recording..." : "Save Record"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}