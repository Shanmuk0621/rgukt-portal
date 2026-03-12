import React from "react";
import { 
  FaLinkedin, 
  FaGithub, 
  FaBriefcase, 
  FaCode,
  FaHackerrank 
} from "react-icons/fa";
import { MdRocketLaunch } from "react-icons/md";
import { GiGraduateCap } from "react-icons/gi";
import { SiLeetcode } from "react-icons/si";

const apps = [
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com",
    icon: <FaLinkedin className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "unstop",
    name: "Unstop",
    url: "https://unstop.com",
    icon: <MdRocketLaunch className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "internshala",
    name: "Internshala",
    url: "https://internshala.com",
    icon: <FaBriefcase className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    icon: <FaGithub className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "nptel",
    name: "NPTEL / SWAYAM",
    url: "https://swayam.gov.in",
    icon: <GiGraduateCap className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "hackerearth",
    name: "HackerEarth",
    url: "https://www.hackerearth.com",
    icon: <FaCode className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "leetcode",
    name: "LeetCode",
    url: "https://leetcode.com",
    icon: <SiLeetcode className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
  {
    id: "hackerrank",
    name: "HackerRank",
    url: "https://www.hackerrank.com",
    icon: <FaHackerrank className="text-amber-700 text-5xl group-hover:text-amber-500 transition-colors" />,
  },
];

function AppsPage() {
  return (
    // Matching the spacing and responsive layout of your Files page
    <div className="relative w-full md:w-[calc(100%-290px)] md:ml-[290px] mt-20 md:mt-24 px-4 md:px-6 h-[calc(100vh-100px)] flex flex-col font-sans">

      {/* Header - RGUKT Brown & Amber Theme */}
      <div className="shrink-0 bg-stone-800 border-b-4 border-amber-600 rounded-2xl flex flex-col items-center p-6 gap-2 shadow-lg overflow-hidden">
        <h2 className="text-amber-50 text-2xl md:text-4xl font-bold tracking-tight text-center">
          ACADEMIC & CAREER HUB
        </h2>
        <div className="h-1 w-24 bg-amber-500 rounded-full"></div>
        <p className="text-center text-stone-300 text-xs md:text-sm max-w-2xl leading-relaxed">
          Access essential platforms for networking, placements, coding practice, 
          and professional growth. Click any platform to launch in a new tab.
        </p>
      </div>

      {/* Content Area */}
      <div className="mt-6 flex-1 overflow-y-auto pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => window.open(app.url, "_blank")}
              className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-stone-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="mb-4">
                {app.icon}
              </div>
              <p className="text-lg font-bold text-stone-700 group-hover:text-amber-900 transition-colors">
                {app.name}
              </p>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-stone-400 font-semibold group-hover:text-amber-600">
                Launch App
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default AppsPage;