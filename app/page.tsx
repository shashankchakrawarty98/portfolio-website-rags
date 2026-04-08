"use client";

import { motion, AnimatePresence } from "framer-motion";
import Splash from "@/components/Splash";
import { Download, ChevronDown, CheckCircle, Database, Server, Code, MapPin, User, Target, BookOpen } from "lucide-react";
import resumeData from "@/data/resume.json";
import { useState } from "react";
import RecruiterAssistant from "@/components/RecruiterAssistant";

export default function Portfolio() {
  return (
    <main className="min-h-screen pb-24 px-4 sm:px-8 max-w-5xl mx-auto flex flex-col gap-24 relative z-10">
      <AnimatePresence>
        <Splash />
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="min-h-[90vh] flex flex-col justify-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 text-sm font-medium backdrop-blur-md">
            <MapPin className="inline w-4 h-4 mr-1 pb-0.5" /> 
            {resumeData.basics.location}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight text-white">
            {resumeData.basics.name}
          </h1>
          <h2 className="text-lg md:text-2xl text-cyan-400 font-medium mb-8 max-w-4xl leading-relaxed">
            {resumeData.basics.title}
          </h2>
          <p className="text-slate-300 text-base md:text-lg mb-10 max-w-4xl leading-relaxed">
            {resumeData.basics.intro}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a href="#experience" className="px-8 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              View Experience
            </a>
            <a href={resumeData.basics.links.linkedin} target="_blank" rel="noreferrer" className="px-8 py-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium border border-slate-700 backdrop-blur-sm flex items-center transition-all">
              Connect on LinkedIn
            </a>
          </div>
        </motion.div>
      </section>


      <RecruiterAssistant />

      {/* PROFILE SUMMARY SECTION */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="summary"
        className="scroll-mt-24"
      >
        <h3 className="text-2xl font-semibold mb-8 text-white flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-400" /> Career Objectives & Summary
        </h3>
        <div className="flex flex-col gap-4">
          {resumeData.basics.profileSummary.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-start p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-sm transition-colors"
            >
              <Target className="w-6 h-6 text-cyan-500 mr-4 mt-0.5 shrink-0" />
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {item}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* HIGHLIGHTS SECTION */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h3 className="text-2xl font-semibold mb-8 text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" /> Notable Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumeData.achievements.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 backdrop-blur-sm transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
              <h4 className="text-3xl font-bold text-cyan-400 mb-3 group-hover:scale-105 transform origin-left transition-transform relative z-10">
                {item.metric}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10">{item.context}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* EXPERIENCE SECTION */}
      <section id="experience" className="scroll-mt-24">
        <h3 className="text-2xl font-semibold mb-8 text-white flex items-center gap-2">
          <Server className="w-6 h-6 text-cyan-400" /> Work Experience
        </h3>
        <div className="space-y-6">
          {resumeData.experience.map((job, i) => (
            <ExperienceCard key={i} job={job} index={i} />
          ))}
        </div>
      </section>

      {/* SKILLS SECTION */}
      <section>
        <h3 className="text-2xl font-semibold mb-8 text-white flex items-center gap-2">
          <Code className="w-6 h-6 text-cyan-400" /> Technical Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {resumeData.skills.technical.map((skillGroup, i) => (
            <div key={i} className="space-y-3">
              <h4 className="text-slate-300 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
                {skillGroup.category}
                {skillGroup.category.includes("Artificial Intelligence") && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse">NEW</span>
                )}
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillGroup.items.map((skill, j) => (
                  <span key={j} className="px-3 py-1.5 text-sm rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-default shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EDUCATION & EXTRA SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-white">Education</h3>
          <div className="space-y-6">
            {resumeData.education.map((edu, i) => (
              <div key={i} className="pl-5 border-l-2 border-slate-800 relative">
                <div className="absolute w-3 h-3 bg-cyan-500 rounded-full -left-[7px] top-1 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                <h4 className="text-lg font-medium text-slate-200">{edu.degree}</h4>
                <p className="text-cyan-400 text-sm mb-1">{edu.institution}</p>
                <p className="text-slate-500 text-sm">{edu.dates}</p>
              </div>
            ))}
          </div>

          <h3 className="text-2xl font-semibold mb-6 mt-10 text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" /> Publications
          </h3>
          <ul className="space-y-3">
            {resumeData.extra.publications.map((pub, i) => (
              <li key={i} className="flex items-start text-slate-300 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-3 mt-1.5 shrink-0" /> {pub}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-6 text-white">Certifications & Tools</h3>
          <ul className="space-y-4">
            {resumeData.extra.certifications.map((cert, i) => (
              <li key={i} className="flex items-start text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-cyan-500 mr-3 shrink-0" /> {cert}
              </li>
            ))}
          </ul>
          <div className="mt-8 p-5 bg-slate-900/40 rounded-xl border border-slate-800/80">
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Languages</h4>
            <div className="flex flex-wrap gap-2">
              {resumeData.extra.languages.map((lang, i) => (
                <span key={i} className="text-sm px-3 py-1 bg-slate-800 rounded-full text-cyan-100 border border-slate-700">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ExperienceCard({ job, index }: { job: any, index: number }) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:border-slate-700"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div>
          <h4 className="text-xl font-semibold text-slate-100">{job.role}</h4>
          <p className="text-cyan-400 text-sm mt-1">{job.company} <span className="text-slate-500 ml-2 hidden sm:inline-block">• {job.dates}</span></p>
          <p className="text-slate-500 text-xs mt-1 sm:hidden">{job.dates}</p>
        </div>
        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-slate-800/50 mt-2">
              {job.description && (
                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6 italic border-l-2 border-cyan-500/30 pl-4">
                  {job.description}
                </p>
              )}
              <h5 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Key Achievements:</h5>
              <ul className="space-y-4">
                {job.bullets.map((bullet: string, j: number) => (
                  <li key={j} className="flex items-start text-slate-300 text-sm md:text-base leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-4 mt-2.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}