import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FaBriefcase,
  FaPlus,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaSearch,
  FaCalendarAlt,
  FaTrophy,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaCodeBranch,
  FaExternalLinkAlt,
  FaFileUpload,
  FaFilePdf 
} from "react-icons/fa";

// Import API connections
import {
  addPlacement,
  getOngoingPlacements,
  getUpcomingPlacements,
  getCompletedPlacements,
  registerPlacement,
  getRegisteredStudents,
  updatePlacementStatus,
  getSelectedCandidates,
  sendMockRequest,
  userAppliedPlacements,
  getResume 
} from "../connection/connection.js";

/* --- STATIC DATA FOR MOCK TESTS --- */
const mockTestsData = [
    { id: 1, role: "General Aptitude", company: "Common", description: "Practice quantitative aptitude.", url: "https://www.indiabix.com/online-test/aptitude-test/", type: "Practice" },
    { id: 2, role: "Software Developer (DSA)", company: "Product Based", description: "Solve algorithmic challenges.", url: "https://www.hackerrank.com/domains/algorithms", type: "Coding" },
    { id: 3, role: "TCS NQT", company: "TCS", description: "TCS National Qualifier Test Mock.", url: "https://www.tcyonline.com/tests/tcs-nqt-mock-test", type: "Company Specific" },
];

/* --- TOAST COMPONENT --- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-2 left-2 md:left-auto md:right-5 z-[100] px-4 md:px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-slide-in ${
      type === "success" ? "bg-green-700" : type === "error" ? "bg-red-700" : "bg-stone-800"
    } text-white font-medium text-sm md:text-base border-b-4 border-amber-600`}>
      {type === "success" ? <FaCheckCircle className="text-xl text-amber-400" /> : <FaTimesCircle className="text-xl" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75"><FaTimesCircle /></button>
    </div>
  );
};

export default function PlacementPage() {
  const authState = useSelector((state) => state.auth);
  const userEmail = (authState?.userData?.user?.email || authState?.userData?.email || "").toLowerCase();
  const userRole = (authState?.userData?.user?.role || authState?.userData?.role || "").toLowerCase();
  
  const isSuperAdmin = userEmail === "placementcell@rguktong.ac.in";
  const isAdmin = isSuperAdmin || userRole === "admin";
  const isFaculty = userRole === "faculty";
  const isStudent = userRole === "student" && !isAdmin;
  const isManagement = isAdmin || isFaculty; 

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  const [activeTab, setActiveTab] = useState("ongoing");
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [ongoingPlacements, setOngoingPlacements] = useState([]);
  const [upcomingPlacements, setUpcomingPlacements] = useState([]);
  const [completedPlacements, setCompletedPlacements] = useState([]);
  const [allPlacements, setAllPlacements] = useState([]);
  const [myPlacements, setMyPlacements] = useState([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [candidates, setCandidates] = useState([]); 
  const [selectedJobForCandidates, setSelectedJobForCandidates] = useState(null);
  const [viewMode, setViewMode] = useState("dashboard"); 
  const [selectedStudentsList, setSelectedStudentsList] = useState([]);

  const [createJobForm, setCreateJobForm] = useState({
    company_name: "", applicant_role: "", role_description: "",
    start_date: "", end_date: "", job_type: "Full-time", branch: "CSE", section: "1"
  });
  const [applyForm, setApplyForm] = useState({ name: "", branch: "CSE", sec: "1", grad_year: "", resume: null });
  const [statusUpdateForm, setStatusUpdateForm] = useState({ selectedIds: [], status: "Review", salary: "" });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  const showToast = (message, type = "success") => setToast({ show: true, message, type });
  const todayDate = new Date().toISOString().split('T')[0];

  const fetchAllPlacements = async () => {
    setLoading(true);
    try {
      const promises = [getOngoingPlacements(), getUpcomingPlacements(), getCompletedPlacements()];
      if (isStudent) promises.push(userAppliedPlacements());
      const results = await Promise.all(promises);
      const parse = (res) => { const body = res?.data || res; return body?.data || body?.result || body || []; };
      
      const on = parse(results[0]);
      const up = parse(results[1]);
      const comp = parse(results[2]);
      
      setOngoingPlacements(on);
      setUpcomingPlacements(up);
      setCompletedPlacements(comp);
      setAllPlacements([...on, ...up, ...comp]);

      if (isStudent) {
          const myAppsData = results[3]?.result || results[3]?.data?.result || [];
          if (Array.isArray(myAppsData)) {
            setMyPlacements(myAppsData);
            setAppliedIds(new Set(myAppsData.map(p => p.placement_id)));
          }
      }
    } catch (error) { showToast("Failed to load drives", "error"); } finally { setLoading(false); }
  };

  const fetchSelectedList = async () => {
    if(viewMode !== "selected" && viewMode !== 'mock') return;
    setLoading(true);
    try {
        const res = await getSelectedCandidates();
        const data = res?.data || res?.result || res || [];
        setSelectedStudentsList(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAllPlacements(); }, []);
  useEffect(() => { if(viewMode === "selected" || viewMode === "mock") fetchSelectedList(); }, [viewMode]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addPlacement(createJobForm);
      showToast("Job created successfully!", "success");
      setCreateJobForm({ company_name: "", applicant_role: "", role_description: "", start_date: "", end_date: "", job_type: "Full-time", branch: "CSE", section: "1" });
      setShowCreateJob(false);
      fetchAllPlacements();
    } catch (error) { showToast("Creation failed", "error"); } finally { setLoading(false); }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedPlacement || !isStudent) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("placement_id", selectedPlacement.placement_id);
      formData.append("name", applyForm.name);
      formData.append("branch", applyForm.branch);
      formData.append("sec", applyForm.sec);
      formData.append("grad_year", applyForm.grad_year);
      if(applyForm.resume) formData.append("resume", applyForm.resume);
      const res = await registerPlacement(selectedPlacement.placement_id, formData);
      if (res && res.toString().toLowerCase().includes("already")) {
        showToast("Already applied!", "error");
      } else {
        showToast("Applied successfully!", "success");
        setAppliedIds(prev => new Set([...prev, selectedPlacement.placement_id]));
        const myAppsRes = await userAppliedPlacements();
        if(Array.isArray(myAppsRes?.result)) setMyPlacements(myAppsRes.result);
      }
      setApplyForm({ name: "", branch: "CSE", sec: "1", grad_year: "", resume: null });
      setShowApplyModal(false);
    } catch (error) { showToast("Application failed", "error"); } finally { setLoading(false); }
  };

  const handleViewCandidates = async (job) => {
    setLoading(true);
    try {
      const response = await getRegisteredStudents(job.placement_id);
      const body = response?.data || response;
      const candidatesData = body?.result || body?.data || body || [];
      if(Array.isArray(candidatesData)){
        setCandidates(candidatesData);
        setSelectedJobForCandidates(job);
        setShowCandidatesModal(true);
        setStatusUpdateForm({ selectedIds: [], status: "Review", salary: "" });
      } else {
        setCandidates([]);
        showToast("No pending applicants", "info");
      }
    } catch (error) { showToast("Error loading candidates", "error"); } finally { setLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (statusUpdateForm.selectedIds.length === 0) return showToast("Select candidates", "error");
    setLoading(true);
    try {
      await updatePlacementStatus({
        ids: statusUpdateForm.selectedIds.join(","),
        status: statusUpdateForm.status,
        company_name: selectedJobForCandidates.company_name,
        role: selectedJobForCandidates.role || selectedJobForCandidates.applicant_role, 
        salary: statusUpdateForm.salary || "0 LPA",
      });
      showToast("Status updated and student removed from list", "success");
      setStatusUpdateForm({ selectedIds: [], status: "Review", salary: "" });
      // Refreshing candidates so the newly updated ones are filtered out
      handleViewCandidates(selectedJobForCandidates); 
    } catch (error) { showToast("Update failed", "error"); } finally { setLoading(false); }
  };

  const handleQuickMockRequest = async (role) => {
    setLoading(true);
    try {
        await sendMockRequest(role, { topic: `Mock: ${role}`, message: "Student request for guidance." });
        showToast(`Request sent for ${role}`, "success");
    } catch (error) { showToast("Failed to send request", "error"); } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    if (!isManagement) return null;
    const today = new Date().setHours(0,0,0,0);
    const open = allPlacements.filter(p => new Date(p.start_date) <= today && new Date(p.end_date) >= today).length;
    const expired = allPlacements.filter(p => new Date(p.end_date) < today).length;
    const pending = allPlacements.filter(p => new Date(p.start_date) > today).length;
    return { active: open, pending, expired };
  }, [allPlacements, isManagement]);

  const getJobStatus = (job) => {
    const today = new Date().setHours(0,0,0,0);
    if (new Date(job.end_date) < today) return "Expired";
    if (new Date(job.start_date) > today) return "Pending Approval"; 
    return "Open";
  };

  const filteredAdminPlacements = useMemo(() => {
    if (!isManagement) return [];
    if (activeFilter === "All") return allPlacements;
    return allPlacements.filter(job => getJobStatus(job) === activeFilter);
  }, [allPlacements, activeFilter, isManagement]);

  return (
    <div className="min-h-screen mt-10 md:mt-2 bg-stone-50">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
      {loading && !showApplyModal && <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-[70]"><FaSpinner className="animate-spin text-amber-500 text-4xl" /></div>}

      <div className="flex flex-col md:ml-[290px] pt-20 md:pt-24 px-4 md:px-10 pb-10 transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 bg-stone-800 p-6 rounded-2xl border-b-4 border-amber-600 shadow-lg">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-amber-50 tracking-tight uppercase">
                {isManagement ? "Placement Control Panel" : "Career Opportunities"}
            </h1>
            <p className="text-sm md:text-base text-stone-300 mt-1 font-medium italic">
                {isManagement ? "University Recruitment Management System" : "Apply for upcoming campus drives"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full lg:w-auto justify-start md:justify-end">
             {isManagement ? (
               <>
                    <button onClick={() => setViewMode("selected")} className={`flex-1 md:flex-none px-4 py-2 rounded-xl shadow-md text-xs font-bold transition-all flex items-center justify-center gap-2 border ${viewMode === "selected" ? "bg-amber-600 text-white border-amber-500" : "bg-stone-700 text-amber-50 border-stone-600 hover:bg-stone-600"}`}><FaTrophy className="text-amber-200" /> Selected</button>
                    <button onClick={() => setViewMode("dashboard")} className={`flex-1 md:flex-none px-4 py-2 rounded-xl shadow-md text-xs font-bold transition-all flex items-center justify-center gap-2 border ${viewMode === "dashboard" ? "bg-amber-600 text-white border-amber-500" : "bg-stone-700 text-amber-50 border-stone-600 hover:bg-stone-600"}`}><FaBriefcase /> Dashboard</button>
                    {isSuperAdmin && <button onClick={() => setShowCreateJob(true)} className="flex-1 md:flex-none bg-stone-900 hover:bg-black text-amber-400 border border-amber-900/50 px-4 py-2 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs font-black uppercase"><FaPlus /> Post Job</button>}
               </>
             ) : (
                 <>
                    <button onClick={() => setViewMode("mock")} className={`flex-1 md:flex-none px-6 py-2 rounded-xl shadow-md text-sm font-black transition-all flex items-center justify-center gap-2 border ${viewMode === "mock" ? "bg-amber-600 text-white border-amber-500" : "bg-stone-700 text-amber-50 border-stone-600"}`}><FaChalkboardTeacher /> Mock Tests</button>
                    <button onClick={() => setViewMode("dashboard")} className={`flex-1 md:flex-none px-6 py-2 rounded-xl shadow-md text-sm font-black transition-all flex items-center justify-center gap-2 border ${viewMode === "dashboard" ? "bg-amber-600 text-white border-amber-500" : "bg-stone-700 text-amber-50 border-stone-600"}`}><FaBriefcase /> Placements</button>
                 </>
             )}
          </div>
        </div>

        {viewMode === "dashboard" && (
            <>
                {isManagement ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard title="Open Positions" value={allPlacements.filter(p => new Date(p.end_date) >= new Date()).length} icon={<FaBriefcase className="text-amber-700" />} />
                            <StatCard title="Active Posts" value={stats?.active || 0} icon={<FaCheckCircle className="text-green-700" />} />
                            <StatCard title="Pending" value={stats?.pending || 0} icon={<FaSpinner className="text-orange-700" />} />
                            <StatCard title="Expired" value={stats?.expired || 0} icon={<FaTimesCircle className="text-red-700" />} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-stone-200 scrollbar-hide">
                            {["All", "Open", "Pending Approval", "Expired"].map(f => (<button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-black transition-all ${activeFilter === f ? "bg-amber-100 text-amber-800 border-b-2 border-amber-600" : "text-stone-500 hover:bg-stone-100"}`}>{f}</button>))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAdminPlacements.length === 0 ? <EmptyState text="No records found." /> : 
                                filteredAdminPlacements.map(job => (
                                    <AdminJobCard 
                                      key={job.placement_id} 
                                      job={job} 
                                      status={getJobStatus(job)} 
                                      userEmail={userEmail} 
                                      onViewCandidates={() => handleViewCandidates(job)} 
                                    />
                                ))
                            }
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-stone-800 p-1.5 rounded-xl shadow-inner border border-stone-700 flex mb-8 overflow-x-auto scrollbar-hide max-w-full">
                            {["ongoing", "upcoming", "completed", "applied", "mocktests"].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-black transition-all duration-200 whitespace-nowrap uppercase flex-1 ${activeTab === tab ? "bg-amber-600 text-white shadow-md" : "text-stone-400 hover:text-amber-50 hover:bg-stone-700"}`}>{tab.replace('_',' ')}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                            {activeTab === "ongoing" && ongoingPlacements.map(p => <StudentJobCard key={p.placement_id} placement={p} type="ongoing" isApplied={appliedIds.has(p.placement_id)} isStudent={isStudent} onApply={() => { setSelectedPlacement(p); setShowApplyModal(true); }} />)}
                            {activeTab === "upcoming" && upcomingPlacements.map(p => <StudentJobCard key={p.placement_id} placement={p} type="upcoming" />)}
                            {activeTab === "completed" && completedPlacements.map(p => <StudentJobCard key={p.placement_id} placement={p} type="completed" />)}
                            {activeTab === "applied" && myPlacements.map(p => <StudentJobCard key={p.placement_id} placement={p} type="applied" applicationStatus={p.status} salary={p.package} />)}
                            {activeTab === "mocktests" && mockTestsData.map(test => <MockTestCard key={test.id} test={test} />)}
                        </div>
                    </>
                )}
            </>
        )}
        
        {viewMode === "selected" && <SelectedStudentsSection students={selectedStudentsList} />}
        {viewMode === "mock" && <MockInterviewSection selectedStudents={selectedStudentsList} onRequest={handleQuickMockRequest} />}
      </div>

      {/* Post Job Modal */}
      {showCreateJob && isSuperAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowCreateJob(false)} />
             <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-scale-in max-h-[90vh] overflow-y-auto border-t-8 border-amber-600">
                 <h3 className="text-xl md:text-2xl font-black mb-6 text-stone-800 uppercase tracking-tighter">New Placement Drive</h3>
                 <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <InputGroup label="Company" value={createJobForm.company_name} onChange={v => setCreateJobForm({...createJobForm, company_name: v})} />
                     <InputGroup label="Role" value={createJobForm.applicant_role} onChange={v => setCreateJobForm({...createJobForm, applicant_role: v})} />
                     <div><label className="block text-xs font-black text-stone-700 mb-1 uppercase tracking-tight">Branch</label><select className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={createJobForm.branch} onChange={e => setCreateJobForm({...createJobForm, branch: e.target.value})}><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option></select></div>
                     <div><label className="block text-xs font-black text-stone-700 mb-1 uppercase tracking-tight">Section</label><select className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={createJobForm.section} onChange={e => setCreateJobForm({...createJobForm, section: e.target.value})}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
                     <InputGroup type="date" label="Start Date" min={todayDate} value={createJobForm.start_date} onChange={v => setCreateJobForm({...createJobForm, start_date: v})} />
                     <InputGroup type="date" label="End Date" min={createJobForm.start_date || todayDate} value={createJobForm.end_date} onChange={v => setCreateJobForm({...createJobForm, end_date: v})} />
                     <button className="md:col-span-2 bg-stone-800 hover:bg-stone-900 text-amber-500 py-3.5 rounded-xl mt-4 font-black shadow-lg uppercase transition-all">Submit Post</button>
                 </form>
             </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && isStudent && selectedPlacement && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => !loading && setShowApplyModal(false)} />
             <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in border-t-8 border-amber-600">
                 <h3 className="text-lg md:text-xl font-black mb-4 text-stone-800 uppercase tracking-tight">Registration: {selectedPlacement.role}</h3>
                 <form onSubmit={handleApply} className="space-y-4">
                     <InputGroup label="Full Name" value={applyForm.name} onChange={v => setApplyForm({...applyForm, name: v})} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-black text-stone-700 mb-1 uppercase tracking-tight">Branch</label><select className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={applyForm.branch} onChange={e => setApplyForm({...applyForm, branch: e.target.value})}><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option><option value="CIVIL">CIVIL</option></select></div>
                        <div><label className="block text-xs font-black text-stone-700 mb-1 uppercase tracking-tight">Sec</label><select className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={applyForm.sec} onChange={e => setApplyForm({...applyForm, sec: e.target.value})}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
                     </div>
                     <InputGroup type="number" label="Graduation Year" value={applyForm.grad_year} onChange={v => setApplyForm({...applyForm, grad_year: v})} />
                     <div><label className="block text-xs font-black text-stone-700 mb-1 uppercase tracking-tight">Resume (PDF Only)</label><div className="relative border-2 border-dashed border-stone-200 rounded-xl p-4 hover:border-amber-400 bg-stone-50 transition-colors"><input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setApplyForm({...applyForm, resume: e.target.files[0]})} /><div className="flex flex-col items-center gap-2 text-stone-500"><FaFileUpload className="text-2xl text-amber-600" /><span className="text-[10px] font-black uppercase tracking-widest">{applyForm.resume ? applyForm.resume.name : "Choose PDF"}</span></div></div></div>
                     <button type="submit" disabled={loading} className={`w-full bg-amber-600 text-white py-4 rounded-xl mt-2 font-black uppercase shadow-lg transition-all tracking-widest ${loading ? "opacity-70" : "hover:bg-amber-700"}`}>{loading ? "Submitting..." : "Apply Now"}</button>
                 </form>
             </div>
        </div>
      )}

      {showCandidatesModal && selectedJobForCandidates && (
        <CandidatesModal job={selectedJobForCandidates} candidates={candidates} onClose={() => { setShowCandidatesModal(false); setSelectedJobForCandidates(null); }} statusUpdateForm={statusUpdateForm} setStatusUpdateForm={setStatusUpdateForm} handleUpdateStatus={handleUpdateStatus} onGetResume={getResume} />
      )}
    </div>
  );
}

/* --- RE-STYLED SUB-COMPONENTS --- */

function CandidatesModal({ job, candidates, onClose, statusUpdateForm, setStatusUpdateForm, handleUpdateStatus }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // LOGIC: Filter out candidates who already have a status other than "Applied"
  const filteredCandidates = useMemo(() => {
    if(!Array.isArray(candidates)) return [];
    return candidates.filter(c => {
        const currentStatus = (c.status || "Applied").toLowerCase();
        const matchesSearch = (c.name || c.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (c.idno || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        // Only show if status is "Applied" AND it matches the search query
        return currentStatus === "applied" && matchesSearch;
    });
  }, [candidates, searchTerm]);

  const allIds = filteredCandidates.map(c => c.idno);
  const isAllSelected = filteredCandidates.length > 0 && allIds.every(id => statusUpdateForm.selectedIds.includes(id));
  const toggleSelectAll = () => { setStatusUpdateForm(prev => ({ ...prev, selectedIds: isAllSelected ? [] : allIds })); };
  const toggleSelection = (idno) => { setStatusUpdateForm(prev => { const exists = prev.selectedIds.includes(idno); return { ...prev, selectedIds: exists ? prev.selectedIds.filter(id => id !== idno) : [...prev.selectedIds, idno] }; }); };
  const openResumeDirectly = (idno) => { const url = `http://localhost:5000/api/v1/placements/getResume/${idno}/${job.placement_id}`; window.open(url, '_blank'); };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-scale-in border-t-8 border-amber-600">
         <div className={`px-4 py-4 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-stone-50`}>
            <div><h3 className={`text-lg font-black text-stone-800 uppercase`}>Process Pending Applicants</h3><p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">{job.company_name} — {job.role}</p></div>
            <div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input type="text" placeholder="ID or Name..." className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm outline-none bg-stone-50 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
         </div>
         <div className="p-4 bg-white border-b flex flex-col sm:flex-row gap-4 items-end">
             <div className="flex-1"><label className="text-[9px] font-black text-stone-500 uppercase block mb-1">Set Decision</label><select className="w-full p-2 border border-stone-200 rounded-lg bg-stone-50 text-xs font-bold uppercase" value={statusUpdateForm.status} onChange={e => setStatusUpdateForm({...statusUpdateForm, status: e.target.value, salary: ""})}><option value="Review">Under Review</option><option value="Interviewed">Interviewed</option><option value="Offered">Offered</option><option value="Hired">Hired</option><option value="Rejected">Rejected</option></select></div>
             {["Offered", "Hired"].includes(statusUpdateForm.status) && (<div className="flex-1"><label className="text-[9px] font-black text-stone-500 uppercase block mb-1">CTC (LPA)</label><input type="text" className="w-full p-2 border border-stone-200 rounded-lg bg-stone-50 text-xs" placeholder="e.g. 8.5" value={statusUpdateForm.salary} onChange={e => setStatusUpdateForm({...statusUpdateForm, salary: e.target.value})} /></div>)}
             <button onClick={handleUpdateStatus} disabled={statusUpdateForm.selectedIds.length === 0} className="bg-amber-600 text-white px-8 py-2 rounded-lg font-black text-xs shadow-md transition disabled:opacity-50 uppercase tracking-widest">Submit Update</button>
         </div>
         <div className="flex-1 overflow-auto">
            {filteredCandidates.length === 0 ? (
                <div className="py-20 text-center text-stone-400 uppercase font-black text-sm opacity-50">No pending applicants found.</div>
            ) : (
                <table className="w-full text-left border-collapse min-w-[700px]"><thead className="bg-stone-100 sticky top-0 text-[10px] font-black text-stone-600 uppercase"><tr><th className="p-4 w-12 border-b"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="accent-amber-600" /></th><th className="p-4 border-b">ID</th><th className="p-4 border-b">Name</th><th className="p-4 border-b">Current</th><th className="p-4 border-b text-center">Resume</th></tr></thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-700">{filteredCandidates.map(c => (
                    <tr key={c.idno} className={`hover:bg-stone-50 transition-colors ${statusUpdateForm.selectedIds.includes(c.idno) ? 'bg-amber-50/50' : ''}`}><td className="p-4"><input type="checkbox" checked={statusUpdateForm.selectedIds.includes(c.idno)} onChange={() => toggleSelection(c.idno)} className="accent-amber-600" /></td><td className="p-4 font-mono font-bold text-stone-900">{c.idno}</td><td className="p-4 font-bold uppercase">{c.name || c.student_name}</td><td className="p-4"><span className="px-2 py-1 bg-stone-200 rounded text-[9px] font-black uppercase">{c.status || "Applied"}</span></td><td className="p-4 text-center"><button onClick={() => openResumeDirectly(c.idno)} className="mx-auto flex items-center justify-center gap-2 bg-stone-800 text-amber-500 px-3 py-2 rounded-lg hover:bg-black text-[10px] font-black uppercase shadow-md"><FaFilePdf /> CV</button></td></tr>
                ))}</tbody></table>
            )}
         </div>
      </div>
    </div>
  );
}

const AdminJobCard = ({ job, status, onViewCandidates, userEmail }) => {
  const isSuperAdmin = userEmail === "placementcell@rguktong.ac.in";
  const getStatusColor = (s) => s === "Open" ? "bg-green-50 text-green-700 border-green-200" : s === "Expired" ? "bg-red-50 text-red-700 border-red-200" : "bg-orange-50 text-orange-700 border-orange-200"; 
  return (
    <div className="bg-white border-2 border-stone-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-amber-400 hover:shadow-xl transition-all duration-300">
        <div><div className="flex justify-between items-start mb-4"><div><h4 className="font-black text-lg text-stone-800 uppercase tracking-tighter leading-none">{job.applicant_role || job.role}</h4><p className="text-[10px] font-bold text-amber-700 uppercase mt-1 tracking-widest leading-none">@{job.company_name}</p></div><span className={`px-2 py-1 text-[9px] font-black rounded border uppercase ${getStatusColor(status)}`}>{status}</span></div>
            <div className="grid grid-cols-3 gap-2 py-4 mb-4 border-y border-stone-50 text-center"><div className="border-r border-stone-100"><div><span className="block text-2xl font-black text-stone-800">{job.applied_count || 0}</span><span className="text-[9px] font-black uppercase text-stone-400">Total</span></div></div><div className="border-r border-stone-100"><span className="block text-2xl font-black text-amber-600">{job.interviewed_count || 0}</span><span className="text-[9px] font-black uppercase text-stone-400">Intrvw</span></div><div><span className="block text-2xl font-black text-green-700">{job.hired_count || 0}</span><span className="text-[9px] font-black uppercase text-stone-400">Placed</span></div></div>
        </div>
        {isSuperAdmin && (
            <button onClick={onViewCandidates} className="w-full py-3 bg-stone-800 text-amber-400 rounded-lg font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md"><FaUsers /> Selection Panel</button>
        )}
    </div>
  );
};

const MockTestCard = ({ test }) => (<div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"><div><div className="flex justify-between items-start mb-4"><div><h3 className="text-lg font-black text-stone-800 uppercase leading-none">{test.role}</h3><div className="text-[10px] font-bold text-amber-700 uppercase mt-1">{test.company}</div></div><span className="px-2 py-1 bg-stone-100 text-stone-700 text-[9px] font-black rounded-full uppercase border border-stone-200">{test.type}</span></div><p className="text-stone-600 text-xs mb-6 line-clamp-3 italic leading-relaxed">{test.description}</p></div><button onClick={() => window.open(test.url, '_blank')} className="w-full py-3 bg-stone-800 text-amber-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg">Begin Session <FaExternalLinkAlt className="text-[10px]" /></button></div>);

const MockInterviewSection = ({ selectedStudents, onRequest }) => {
    const rolesData = useMemo(() => {
        if (!Array.isArray(selectedStudents)) return [];
        const rolesMap = {};
        selectedStudents.forEach(s => {
            const status = s.status?.toLowerCase() || "";
            if (s.role && (status === 'hired' || status === 'offered')) {
                if (!rolesMap[s.role]) rolesMap[s.role] = { name: s.role, companies: new Set() };
                if (s.company_name) rolesMap[s.role].companies.add(s.company_name);
            }
        });
        return Object.values(rolesMap).map(r => ({ ...r, companies: Array.from(r.companies).slice(0, 2).join(", ") }));
    }, [selectedStudents]);

    if (rolesData.length === 0) return <EmptyState text="No qualified student records for guidance." />;

    return (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{rolesData.map((r, i) => (<div key={i} className="bg-white border-2 border-stone-100 rounded-xl p-8 shadow-sm text-center hover:border-amber-400 transition-all group"><div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-50 shadow-inner"><FaCodeBranch className="text-3xl text-amber-600" /></div><h4 className="text-lg font-black text-stone-800 uppercase leading-none tracking-tighter">{r.name}</h4><p className="text-[10px] font-bold text-stone-400 mt-3 mb-6 uppercase italic leading-tight">{r.companies}</p><button onClick={() => onRequest(r.name)} className="w-full bg-amber-600 text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-amber-700 active:scale-95 transition-all">Request Mock</button></div>))}</div>);
};

const SelectedStudentsSection = ({ students }) => {
    const stats = useMemo(() => { const drives = students.filter(s => (s.job_type || "").toLowerCase() !== 'internship').length; const interns = students.filter(s => (s.job_type || "").toLowerCase() === 'internship').length; let highest = 0; students.forEach(s => { const val = parseFloat((s.package || "0").toString().replace(/[^0-9.]/g, '')); if(val > highest) highest = val; }); return { drives, interns, highest: highest ? `${highest} LPA` : "0 LPA", total: students.length }; }, [students]);
    return (
      <div className="space-y-8"><h2 className="text-2xl font-black text-stone-800 uppercase tracking-tighter">Campus Hall of Fame</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><SelectedStatCard label="Direct Offers" value={stats.drives} /><SelectedStatCard label="Internships" value={stats.interns} /><SelectedStatCard label="Peak Package" value={stats.highest} isAmber /><SelectedStatCard label="Total Selects" value={stats.total} /></div>
        <div className="flex flex-col gap-4">{students.map((s, i) => (<div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 hover:shadow-xl transition-all duration-300 group"><div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors"><FaUserGraduate className="text-2xl text-stone-400 group-hover:text-amber-700" /></div><div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4"><div><h4 className="font-black text-stone-800 uppercase text-lg leading-none">{s.name || s.student_name}</h4><p className="text-[10px] font-bold text-amber-700 uppercase mt-2 tracking-widest leading-none">{s.role}</p><p className="text-[10px] text-stone-400 font-mono tracking-widest mt-1 uppercase">{s.idno}</p></div><div className="flex flex-col items-center justify-center bg-stone-50 rounded-xl p-2"><span className="px-3 py-1 bg-amber-600 text-white text-[9px] font-black uppercase rounded mb-1">{s.job_type || "OFFER"}</span><span className="font-black text-stone-900 text-xl">{s.package || "N/A"}</span></div><div className="bg-stone-800 px-4 py-2 rounded-xl text-[11px] font-black text-amber-500 uppercase flex items-center justify-center shadow-lg">{s.company_name}</div></div></div>))}</div></div>
    );
};

const SelectedStatCard = ({ label, value, isAmber }) => (<div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-stone-200 flex flex-col items-center text-center"><p className="text-[10px] text-stone-400 font-black uppercase mb-1 tracking-widest">{label}</p><p className={`text-3xl font-black ${isAmber ? "text-amber-600" : "text-stone-800"}`}>{value}</p></div>);

const StudentJobCard = ({ placement, type, isApplied, onApply, applicationStatus, salary, isStudent }) => (
  <div className="bg-white border-2 border-stone-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-amber-400 transition-all duration-300 group">
    <div><div className="flex justify-between items-start mb-4"><div className="max-w-[70%]"><h3 className="text-lg font-black text-stone-800 uppercase leading-none group-hover:text-amber-800 transition-colors">{placement.role}</h3><p className="text-[10px] font-bold text-amber-700 uppercase mt-2 tracking-widest">@{placement.company_name}</p></div><span className="px-2 py-1 bg-stone-800 text-amber-500 text-[10px] font-black rounded uppercase border border-amber-900/50">{placement.job_type}</span></div><p className="text-stone-500 text-xs mb-5 line-clamp-2 italic leading-relaxed">{placement.role_description}</p><div className="text-[10px] text-stone-400 font-black uppercase tracking-widest flex items-center gap-2 mb-5"><FaCalendarAlt className="text-amber-600" /> Closes: {new Date(placement.end_date).toLocaleDateString()}</div></div>
    {type === "applied" ? (<div className={`w-full py-4 rounded-xl font-black text-center border-2 uppercase text-[10px] flex flex-col items-center justify-center gap-1 shadow-inner tracking-widest ${['Hired', 'Offered'].includes(applicationStatus) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}><span>{applicationStatus || "PROCESSING"}</span>{salary && <span className="text-[9px] bg-white px-2 py-0.5 rounded text-green-800 border border-green-200 shadow-sm">{salary}</span>}</div>) : (type === "ongoing" && isStudent && (<button onClick={!isApplied ? onApply : undefined} disabled={isApplied} className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${isApplied ? "bg-stone-100 text-stone-400 border border-stone-200" : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95"}`}>{isApplied ? <FaCheckCircle className="inline mr-1"/> : "REGISTER"}</button>))}
  </div>
);

const InputGroup = ({ label, type = "text", value, onChange, min }) => (<div><label className="block text-[10px] font-black text-stone-700 mb-1 uppercase tracking-widest">{label}</label><input type={type} min={min} className="w-full p-2.5 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 text-sm font-bold text-stone-800 shadow-inner" value={value} onChange={e => onChange(e.target.value)} /></div>);
const StatCard = ({ title, value, icon }) => (<div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-md flex items-center justify-between group hover:border-amber-500 transition-all"><div className="flex flex-col"><p className="text-stone-400 text-[10px] font-black uppercase tracking-widest leading-none">{title}</p><p className="text-3xl font-black text-stone-800 mt-2">{value || 0}</p></div><div className="p-3 bg-stone-50 rounded-xl group-hover:bg-amber-100 transition-colors shadow-sm">{icon}</div></div>);
const EmptyState = ({ text }) => (<div className="col-span-full py-16 flex flex-col items-center justify-center bg-stone-50 rounded-2xl border-4 border-dashed border-stone-200 text-stone-400 uppercase font-black tracking-widest opacity-50"><FaCalendarAlt className="text-5xl mb-4" /><p className="text-sm">{text}</p></div>);

