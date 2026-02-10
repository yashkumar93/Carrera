'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    Clock,
    ShieldCheck,
    BarChart3,
    BookOpen,
    Code2,
    GraduationCap,
    Briefcase,
    MessageCircle,
    TrendingUp,
    Map,
    ArrowRight,
    Zap,
    Star,
    Globe,
    Trophy,
    Users,
    User,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { BentoCard } from './BentoCard';
import { CareerChat } from './CareerChat';
import { SectionHeader } from './SectionHeader';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { FlipWords } from './ui/flip-words';
import { AnimatedShinyText } from './ui/animated-shiny-text';
import { cn } from '../lib/utils';

const LandingPage = ({ onSignIn }) => {
    const [activeStep, setActiveStep] = useState(0);
    const flipWords = ["clarity", "direction", "confidence", "purpose"];

    // Initialize scroll reveal animations
    useScrollReveal();

    // Auto-cycle timeline for demo purposes
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen selection:bg-blue-100 overflow-x-hidden bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-theme">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">C</div>
                            <span className="text-xl font-bold text-[#0F172A] tracking-tight">Careerra</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">How it Works</a>
                            <button
                                onClick={onSignIn}
                                className="bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all transform hover:scale-105 active:scale-95"
                            >
                                Start Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-12 overflow-hidden">
                <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-12">
                    {/* Main Hero Split */}
                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-24 items-center mb-20">
                        {/* Left: Content */}
                        <div className="lg:col-span-8 reveal" data-reveal-delay="0">
                            <div className="mb-6">
                                <div
                                    className={cn(
                                        "group rounded-full border border-black/5 bg-neutral-100 text-base transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800 inline-flex"
                                    )}
                                >
                                    <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                                        <span>✨ Careerra — From confusion to direction</span>
                                    </AnimatedShinyText>
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F172A] leading-tight tracking-tight mb-6">
                                Get career <FlipWords words={flipWords} className="text-primary" />—<br className="hidden sm:block" />and a plan you can follow.
                            </h1>
                            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl">
                                Answer a few questions and get a personalized roadmap with courses, projects, and certifications.
                            </p>
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                <button
                                    onClick={onSignIn}
                                    className="bg-primary hover:opacity-90 text-white px-8 py-4 rounded-xl text-base font-semibold transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                                >
                                    Get My Career Direction
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="mt-6 text-sm text-slate-400 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Free to start · Takes under 5 minutes
                            </p>
                        </div>

                        {/* Right: Interactive Chat */}
                        <div className="lg:col-span-4 reveal flex justify-end" data-reveal-delay="200">
                            <div className="w-full max-w-[420px] rounded-[2.5rem] bg-white border border-theme shadow-2xl overflow-hidden min-h-[480px] max-h-[480px]">
                                <CareerChat />
                            </div>
                        </div>
                    </div>

                    {/* Secondary Bento Grid - Quick Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal" data-reveal-delay="400">
                        <BentoCard className="bg-blue-50 border border-blue-100 p-8 flex items-center justify-between group">
                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">AI Architect</h3>
                                    <p className="text-[10px] text-primary uppercase tracking-wider font-extrabold">Top Match Alert</p>
                                </div>
                                <div className="mt-4">
                                    <div className="h-2 w-32 bg-blue-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[92%] transition-all duration-1000"></div>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-2 font-bold">98% Capability Match</div>
                                </div>
                            </div>
                            <TrendingUp className="w-16 h-16 text-primary/10 -rotate-12 group-hover:rotate-0 transition-transform" />
                        </BentoCard>

                        <BentoCard className="bg-white border border-theme p-8">
                            <div className="flex flex-col gap-4">
                                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Map className="w-3 h-3" /> Personalized Roadmap
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { label: 'LLM Foundations', status: 'done' },
                                        { label: 'Vector Databases', status: 'active' },
                                        { label: 'Production RAG', status: 'pending' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.status === 'done' ? 'bg-emerald-500 border-emerald-500' : item.status === 'active' ? 'border-primary animate-pulse' : 'border-slate-200'}`}>
                                                {item.status === 'done' && <Star className="w-2 h-2 text-white fill-current" />}
                                            </div>
                                            <span className={`text-sm font-bold ${item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </BentoCard>

                        <BentoCard className="bg-[#0F172A] text-white p-8 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                                <Clock className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-extrabold">&lt; 3 mins</div>
                                <div className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mt-2">To get your first roadmap</div>
                            </div>
                        </BentoCard>
                    </div>
                </div>
            </section>

            {/* Features Section - Refined Bento Grid */}
            <section id="features" className="py-32 bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    <SectionHeader
                        badge="Advanced Analysis"
                        title="The Engine for Your Future"
                        description="Our AI doesn't just suggest jobs; it maps your entire professional trajectory using live labor market intelligence."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 mt-20 h-auto md:h-[750px]">
                        {/* Main Feature: Skill Gap Analysis (Tall 1x2) */}
                        <BentoCard className="md:col-span-1 md:row-span-2 bg-[#0F172A] text-white p-10 flex flex-col justify-between overflow-hidden relative reveal" data-reveal-delay="0">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-blue-400 border border-white/10">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold mb-6 tracking-tight leading-tight">Skill Gap Analysis</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">We benchmark your current profile against thousands of hiring bars at top-tier tech firms.</p>
                            </div>

                            <div className="space-y-8 relative z-10">
                                {[
                                    { label: 'Technical depth', val: 85, color: 'bg-blue-500' },
                                    { label: 'System Design', val: 42, color: 'bg-emerald-400' },
                                    { label: 'Leadership', val: 68, color: 'bg-amber-400' },
                                    { label: 'Product Thinking', val: 25, color: 'bg-slate-600' }
                                ].map((item, i) => (
                                    <div key={i} className="group/item">
                                        <div className="flex justify-between text-[10px] mb-2 font-extrabold tracking-widest text-slate-500 uppercase">
                                            <span>{item.label}</span>
                                            <span className="text-white">{item.val}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full ${item.color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                                                style={{ width: `${item.val}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-white/10 mt-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3" /> Priority Improvement Found
                                    </div>
                                </div>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                        </BentoCard>

                        {/* Personalized Career Matches (Wide 2x1) */}
                        <BentoCard className="md:col-span-2 md:row-span-1 bg-white border border-theme p-10 flex flex-col justify-between group overflow-hidden reveal" data-reveal-delay="100">
                            <div className="flex justify-between items-start z-10">
                                <div className="max-w-md">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 border border-emerald-100">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Personalized Career Matches</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed">Identify roles with high salary floors and 300% growth potential in the next decade.</p>
                                </div>
                                <div className="hidden lg:flex flex-col items-end">
                                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Live Demand</div>
                                    <div className="flex items-center gap-1 text-emerald-500 font-bold">
                                        <TrendingUp className="w-4 h-4" /> +12.4% MoM
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-8 z-10">
                                {[
                                    { name: 'AI Solutions Architect', growth: 'High' },
                                    { name: 'Data Product Manager', growth: 'Stable' },
                                    { name: 'ML Ops Engineer', growth: 'Explosive' },
                                    { name: 'Growth Strategist', growth: 'Med' }
                                ].map((role) => (
                                    <div key={role.name} className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-default">
                                        <span className="text-sm font-bold text-slate-700">{role.name}</span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${role.growth === 'Explosive' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>{role.growth}</span>
                                    </div>
                                ))}
                            </div>
                            <ArrowRight className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 group-hover:text-blue-50 group-hover:-rotate-12 transition-all duration-700" />
                        </BentoCard>

                        {/* Clarity Rating (Small 1x1) */}
                        <BentoCard className="md:col-span-1 md:row-span-1 bg-primary text-white p-10 flex flex-col items-center justify-center text-center reveal" data-reveal-delay="200">
                            <Trophy className="w-12 h-12 mb-6 text-blue-200" />
                            <div className="text-5xl font-extrabold mb-2 tracking-tighter">4.9/5</div>
                            <div className="text-[11px] font-extrabold text-blue-100 uppercase tracking-widest mb-6">User Clarity Rating</div>
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i + 60}`} className="w-10 h-10 rounded-full border-4 border-primary shadow-xl" alt="Testimonial" />)}
                            </div>
                        </BentoCard>

                        {/* High-Paying Course Tracks (Wide 2x1) */}
                        <BentoCard className="md:col-span-2 md:row-span-1 bg-white border border-theme p-10 flex items-center justify-between group reveal" data-reveal-delay="300">
                            <div className="flex-1 pr-8">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary border border-blue-100">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">High-Paying Course Tracks</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">No more infinite scrolling. We curate the exact learning paths from MIT, Stanford, and industry leaders.</p>
                                <button className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary transition-all group/btn">
                                    View My Tracks <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="hidden lg:grid grid-cols-2 gap-4">
                                {[
                                    { icon: <GraduationCap />, label: 'MIT Professional' },
                                    { icon: <Star />, label: 'Google Elite' },
                                    { icon: <ShieldCheck />, label: 'DeepLearning.AI' },
                                    { icon: <Briefcase />, label: 'IBM Strategic' }
                                ].map((inst, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-2 w-28 group-hover:scale-105 transition-all duration-300">
                                        <div className="text-slate-400 group-hover:text-primary transition-colors">{inst.icon}</div>
                                        <span className="text-[10px] font-extrabold text-slate-500 text-center uppercase tracking-tight">{inst.label}</span>
                                    </div>
                                ))}
                            </div>
                        </BentoCard>

                        {/* Industry Portfolios (Small 1x1) */}
                        <BentoCard className="md:col-span-1 md:row-span-1 bg-emerald-50 border border-emerald-100 p-10 flex flex-col justify-center reveal" data-reveal-delay="400">
                            <div className="text-emerald-700 font-extrabold text-[11px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> Project Factory
                            </div>
                            <h4 className="font-bold text-slate-900 text-2xl tracking-tight mb-4">Industry Portfolios</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">Receive real-world project prompts verified by actual hiring managers.</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                <Star className="w-4 h-4 fill-current" /> 15+ New Prompts Weekly
                            </div>
                        </BentoCard>
                    </div>
                </div>
            </section>

            {/* How It Works - Interactive Timeline */}
            <section id="how-it-works" className="py-32 bg-white">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div className="reveal">
                            <SectionHeader
                                badge="The Framework"
                                title="How It Works"
                                description="Our proprietary AI pipeline transforms raw profile data into strategic career roadmaps."
                                align="left"
                            />
                            <div className="mt-16 space-y-8">
                                {[
                                    { title: "Personal Discovery", desc: "Our AI starts by understanding your unique cognitive patterns, interests, and professional history." },
                                    { title: "Market Alignment", desc: "We cross-reference your profile with 5,000+ growing roles across the global tech economy." },
                                    { title: "Gap Verification", desc: "Identifying the exact skills you're missing to command a 30% higher salary today." },
                                    { title: "Strategic Roadmap", desc: "An actionable, week-by-week plan to acquire those skills and land the interview." }
                                ].map((step, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-6 p-6 rounded-[2rem] transition-all cursor-default group border-2 ${activeStep === i ? 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/5' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-slate-50'}`}
                                        onMouseEnter={() => setActiveStep(i)}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl flex-shrink-0 transition-all ${activeStep === i ? 'bg-primary text-white scale-110' : 'bg-slate-200 text-slate-500'}`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xl mb-2">{step.title}</h4>
                                            <p className="text-slate-600 font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative reveal" data-reveal-delay="200">
                            {/* Visual Mock of Step Progress */}
                            <div className="bg-[#0F172A] rounded-[3rem] p-6 shadow-3xl overflow-hidden relative border-[12px] border-white/5">
                                <div className="absolute top-6 right-8 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="bg-slate-900 rounded-[2rem] p-10 min-h-[480px] flex flex-col justify-center gap-12 border border-white/10">
                                    {activeStep === 0 && <div className="animate-fade-in space-y-6">
                                        <div className="h-4 bg-blue-500/20 rounded-full w-1/3"></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 gap-3">
                                                <User className="text-blue-400 w-5 h-5" />
                                                <div className="h-2 bg-white/10 rounded-full w-1/2"></div>
                                            </div>
                                            <div className="h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 gap-3">
                                                <Star className="text-amber-400 w-5 h-5" />
                                                <div className="h-2 bg-white/10 rounded-full w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="h-14 bg-white/5 rounded-2xl border border-white/10"></div>
                                        <div className="h-14 bg-white/5 rounded-2xl border border-white/10"></div>
                                    </div>}
                                    {activeStep === 1 && <div className="animate-fade-in flex flex-col items-center gap-8">
                                        <div className="relative w-32 h-32">
                                            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                            <div className="absolute inset-4 rounded-full border-4 border-emerald-500 border-b-transparent animate-spin duration-[3s]"></div>
                                            <Globe className="absolute inset-0 m-auto text-blue-400 w-10 h-10" />
                                        </div>
                                        <div className="text-center font-bold text-blue-400 uppercase tracking-[0.2em] text-[10px]">Processing global market trends...</div>
                                    </div>}
                                    {activeStep === 2 && <div className="animate-fade-in space-y-6">
                                        <div className="p-5 bg-emerald-500/10 rounded-[1.5rem] border border-emerald-500/20 flex items-center gap-4">
                                            <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                                            <div className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Profile Validated</div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Market Fit</span>
                                                <span className="text-blue-400 font-bold">92%</span>
                                            </div>
                                            <div className="h-3 bg-white/10 rounded-full w-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-[92%]"></div>
                                            </div>
                                        </div>
                                    </div>}
                                    {activeStep === 3 && <div className="animate-fade-in flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40">
                                            <MessageCircle className="w-10 h-10" />
                                        </div>
                                        <div className="text-white font-bold text-xl text-center">Your Strategic Advisor is ready.</div>
                                        <div className="flex gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce"></div>
                                            <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-3 h-3 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
                    <div className="bg-[#0F172A] rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden reveal border-[10px] border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]"></div>

                        <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter leading-tight">Your Career, <br /><span className="text-blue-400">Re-Engineered.</span></h2>
                        <p className="text-2xl text-slate-400 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">
                            Join 12,400+ professionals who stopped guessing and started growing with Careerra.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <button
                                onClick={onSignIn}
                                className="w-full sm:w-auto bg-primary hover:opacity-90 text-white px-12 py-6 rounded-[2rem] text-2xl font-bold transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/20 flex items-center gap-4 group"
                            >
                                Start Free Assessment <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none mb-1">Privacy First</div>
                                    <div className="text-xs font-bold text-slate-300">No CC Required</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-theme py-24">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/10">C</div>
                                <span className="text-2xl font-bold text-[#0F172A] tracking-tight">Careerra</span>
                            </div>
                            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">Clarity for your next move</p>
                            <p className="text-slate-500 text-base max-w-sm leading-relaxed font-medium">
                                AI-powered career intelligence that helps you make confident decisions about your professional future.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-[0.2em] mb-8">Product</h5>
                            <ul className="space-y-5 text-slate-600 font-bold text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">Career Assessment</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Skill Gap Maps</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Course Curations</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Enterprise Tracks</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-[0.2em] mb-8">Company</h5>
                            <ul className="space-y-5 text-slate-600 font-bold text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">About Mission</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy Ethics</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-[0.2em] mb-8">Ecosystem</h5>
                            <ul className="space-y-5 text-slate-600 font-bold text-sm">
                                <li><a href="#" className="hover:text-primary transition-colors">Open Data</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">University Partners</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Labor API</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-24 pt-10 border-t border-theme flex flex-col md:flex-row justify-between items-center gap-8">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">© 2025 Careerra. Built for the future of work.</p>
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-4 border-white shadow-sm"></div>)}
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                Trusted by 12,400+ Pioneers
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
