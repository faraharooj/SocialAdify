// D:/socialadify/frontend/src/app/page.tsx
'use client'; // This directive must be at the very top of the file

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// --- HEROCIONS IMPORTS (RELIABLE NAMES, CONSOLIDATED) ---
import {
    RocketLaunchIcon,
    UsersIcon,
    TrophyIcon,
    Cog8ToothIcon,
    ChartPieIcon,
    ChartBarIcon, 
    CurrencyDollarIcon,
    SparklesIcon,
    ChatBubbleBottomCenterTextIcon,
    CalendarDaysIcon,
    LifebuoyIcon,// Use TargetIcon for 'Targeting'
    ArrowTrendingUpIcon,
} from '@heroicons/react/24/solid';
// --- END HEROCIONS IMPORTS ---

// --- SVG Icons (Only AppLogo remains as a custom SVG) ---
const AppLogo = ({ className = "w-10 h-10 text-white" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 6C9.14344 6 6.79378 7.65981 5.64006 9.99995H8.04005C8.82681 8.78081 10.2993 8 12 8C13.7007 8 15.1732 8.78081 15.9599 9.99995H18.3599C17.2062 7.65981 14.8566 6 12 6ZM12 16C10.2993 16 8.82681 15.2191 8.04005 14H5.64006C6.79378 16.3401 9.14344 18 12 18C14.8566 18 17.2062 16.3401 18.3599 14H15.9599C15.1732 15.2191 13.7007 16 12 16ZM5 12C5 11.7181 5.01793 11.4402 5.05279 11.1667H18.9472C18.9821 11.4402 19 11.7181 19 12C19 12.2819 18.9821 12.5597 18.9472 12.8333H5.05279C5.01793 12.5597 5 12.2819 5 12Z"/>
    </svg>
);

// Abstract Social Media Network Graphic component for the Hero section
const AbstractSocialMediaGraphic = () => (
    <div className="relative w-full max-w-2xl mx-auto h-auto min-h-64 md:min-h-80 lg:min-h-96 flex items-center justify-center p-4">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'repeating-radial-gradient(circle at center, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 20px)', backgroundSize: '40px 40px' }}></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 w-full">
            <div className="bg-gradient-to-br from-white to-slate-100 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200 w-full max-w-xs md:max-w-sm flex flex-col items-center justify-center text-center transform -rotate-3 scale-95 transition-transform duration-500 ease-out hover:rotate-0 hover:scale-100">
                <div className="flex flex-col flex-wrap justify-center items-center gap-6 md:gap-8">
                    <div className="flex flex-col items-center">
                        <RocketLaunchIcon className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Boost Visibility</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <UsersIcon className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Target Audiences</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <TrophyIcon className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Achieve Growth</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-100 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-200 w-full max-w-xs md:max-w-sm flex flex-col items-center justify-center text-center transform rotate-3 scale-95 transition-transform duration-500 ease-out hover:rotate-0 hover:scale-100">
                <div className="flex flex-col flex-wrap justify-center items-center gap-6 md:gap-8">
                    <div className="flex flex-col items-center">
                        <CurrencyDollarIcon className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Maximize ROI</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Cog8ToothIcon className="w-12 h-12 text-slate-500 mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Automate Campaigns</p>
                    </div>

                    {/* ✅ FIXED: Only updated THIS LINE */}
                    <ChartBarIcon className="w-12 h-12 text-slate-500 mb-2" />

                    <p className="text-sm font-semibold text-slate-700">Data Insights</p>
                </div>
            </div>
        </div>
    </div>
);

// Feature Card Component (Re-usable for both sections)
interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ElementType; // Now accepts an icon component
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => {
    return (
        <div className="flex flex-col items-center text-center p-6 rounded-lg shadow-lg bg-slate-900/10 border border-slate-200 w-full max-w-md transition-all duration-300 hover:shadow-xl hover:scale-105">
            <Icon className="w-16 h-16 text-slate-600 mb-4" /> {/* Render the passed Icon component */}
            <h3 className="text-xl font-semibold mb-2 text-slate-800">{title}</h3>
            <p className="text-sm text-slate-700">{description}</p> {/* Displaying the bio */}
        </div>
    );
};

// Team Member Card Component
interface TeamMemberCardProps {
    name: string;
    bio: string; // Added bio prop
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ name, bio }) => {
    return (
        // FIX: Added the necessary JSX structure for the card, ensuring it works without the photo.
        <div className="flex flex-col items-center text-center p-6 rounded-lg shadow-lg bg-white border border-gray-100 w-full max-w-md transition-transform transform hover:scale-105 hover:shadow-xl">
            {/* Note: The Image tag was removed in the previous step */}
            <h3 className="text-xl font-semibold mb-1 text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600 mt-2">{bio}</p>
        </div>
    );
};

// --- Main Landing Page Component ---
// This is the default export for the page.
export default function LandingPage() {
    // Destructure authentication state and router hook
    const { isAuthenticated, isAuthReady, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    // State to control content visibility, initially false to show loading
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
    // Check for a specific query parameter that signals intent to view the landing page
    const viewLandingParam = searchParams.get('view_landing');

    if (isAuthReady && !isLoading) {
        // If authenticated AND the 'view_landing' parameter is NOT 'true', then redirect to /home
        if (isAuthenticated && viewLandingParam !== 'true') {
            console.log("LandingPage: Authenticated, redirecting to /maindashboard");
            router.replace('/maindashboard');
        } else {
            // Otherwise (either not authenticated, or authenticated but explicitly wanting to view landing), show content
            setShowContent(true);
        }
    } else if (!isAuthReady) {
        // Keep content hidden while authentication state is still being determined
        setShowContent(false);
    }
}, [isAuthenticated, isAuthReady, isLoading, router, searchParams]); // IMPORTANT: Add searchParams to dependencies

    // Define the shared bio for both team members
    const sharedBio = "As co-founders, we are dedicated to building innovative solutions that empower your digital presence.";

    // Render a loading state if content is not yet ready to be shown
    if (!showContent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans text-slate-300">
                <p className="text-lg">Loading SocialAdify...</p>
            </div>
        );
    }

    // Define the common pattern style for dark backgrounds
    const darkPatternStyle = {
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px)',
        backgroundSize: '40px 40px',
    };

    // Define a subtle pattern style for light backgrounds (transparent light gray)
    const lightPatternStyle = {
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 20px)',
        backgroundSize: '40px 40px',
    };


    // Main landing page content when authentication is resolved and user is not authenticated
    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Header / Navigation Bar */}
            <header className="top-0 left-0 right-0 z-50 p-4 md:p-6 lg:p-8 bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-slate-700/50 relative overflow-hidden">
                {/* Pattern layer for the header */}
                <div className="absolute inset-0 z-0 opacity-20" style={darkPatternStyle}></div>
                <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
                    {/* Logo and App Name */}
                    <Link href="#home" className="flex items-center space-x-2 group">
                        <AppLogo className="w-8 h-8 text-slate-400 transition-transform duration-300 group-hover:rotate-12" /> {/* Changed logo color */}
                        <span className="text-2xl font-bold text-white group-hover:text-slate-400 transition-colors">SOCIALADIFY</span> {/* Changed hover color */}
                    </Link>
                    {/* Navigation Links and Get Started Button */}
                    <div className="flex items-center space-x-6 md:space-x-8">
                        <Link href="#home" className="font-medium text-slate-300 hover:text-white transition-colors text-base md:text-lg hidden md:block">Home</Link>
                        <Link href="#services" className="font-medium text-slate-300 hover:text-white transition-colors text-base md:text-lg hidden md:block">Services</Link>
                        <Link href="#about" className="font-medium text-slate-300 hover:text-white transition-colors text-base md:text-lg hidden md:block">About Us</Link>
                        <Link href="#contact" className="font-medium text-slate-300 hover:text-white transition-colors text-base md:text-lg hidden md:block">Contact</Link>
                        <Link href="/signup" className="px-5 py-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-md">Get Started</Link> {/* Changed button colors */}
                    </div>
                </nav>
            </header>

            {/* Section 1: Home (Hero) Section - Dark Blue Background */}
            <section id="home" className="relative flex-grow flex flex-col items-center justify-center bg-slate-900 text-slate-300 px-4 py-12 md:py-0 overflow-hidden min-h-screen pt-16">
                {/* Hero Content */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-12 py-10 md:py-20">
                    {/* Left Content Area (Text and Call to Action) */}
                    <div className="flex-1 text-center lg:text-left">
                        <p className="text-slate-400 text-lg md:text-xl font-semibold mb-4 tracking-wide uppercase">Unlock Your Brand's Full Potential</p> {/* Changed text color */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-white">
                            Social<span className="text-slate-500">Adify</span> {/* "SocialAdify" cut in half, changed color */}
                        </h1>
                        <p className="text-base md:text-lg text-slate-300 opacity-90 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8">
                            Tired of the social media grind? SocialAdify leverages cutting-edge AI to automate content creation, optimize ad placement, and deliver actionable insights. Transform your online presence, engage your audience, and drive unparalleled growth with intelligent automation.
                        </p>
                        <Link href="/signup" className="inline-block px-8 py-3 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"> {/* Changed button colors */}
                            Get Started for Free
                        </Link>
                    </div>

                    {/* Right Graphic Area - Abstract Social Media Graphic */}
                    <div className="flex-1 flex justify-center lg:justify-end mt-12 lg:mt-0">
                        <AbstractSocialMediaGraphic />
                    </div>
                </div>
                {/* Background patterns (subtle diagonal lines and gradient overlay) */}
                <div className="absolute inset-0 z-0 opacity-20" style={darkPatternStyle}></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900/20 via-transparent to-slate-900/20"></div>
            </section>

            {/* Section 2: Services - White Background with Feature Cards */}
            <section id="services" className="bg-white text-gray-800 py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Pattern layer for the Services section */}
                <div className="absolute inset-0 z-0 opacity-50" style={lightPatternStyle}></div>
                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">Unlock Your Potential with SocialAdify</h2>
                    <p className="text-lg max-w-3xl mx-auto mb-12">
                        Discover the powerful capabilities that streamline your workflow and amplify your online presence.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Using FeatureCard component for each service - updated to transparent dark blue background */}
                        <FeatureCard
                            title="AI-Powered Post/Ad Generation"
                            icon={SparklesIcon}
                            description="Generate stunning ad creatives and compelling text tailored to your audience and brand. Modify templates and integrate branding elements."
                        />
                        <FeatureCard
                            title="Smart Caption & Hashtag Generation"
                            icon={ChatBubbleBottomCenterTextIcon}
                            description="Craft engaging captions and get relevant hashtag suggestions to maximize your social media engagement. View, edit, and reuse your caption history."
                        />
                        <FeatureCard
                            title="Automated Post Scheduling"
                            icon={CalendarDaysIcon}
                            description="Schedule posts for optimal times, automate publishing, and track your scheduled content with ease. Get notifications for successful posts."
                        />
                        <FeatureCard
                            title="Social Media Insights & Metrics"
                            icon={ChartPieIcon} // Using ChartPieIcon here
                            description="Gain deep understanding of your performance with overall and post-specific analytics. Display graphical representations and export reports in various formats."
                        />
                        <FeatureCard
                            title="AI-Powered Ad Placement"
                            icon={LifebuoyIcon}
                            description="Create and preview ads before publishing. Get intelligent recommendations for optimal platform selection and audience targeting."
                        />
                        <FeatureCard
                            title="Real-time Performance Tracking"
                            icon={ArrowTrendingUpIcon}
                            description="View real-time and historical ad performances. Compare ad performance across different platforms and receive AI-based optimization suggestions."
                        />
                    </div>
                    <div className="mt-12">
                        <Link href="/signup" className="inline-block px-10 py-4 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"> {/* Changed button colors */}
                            Join SocialAdify Today!
                        </Link>
                    </div>
                </div>
            </section>

            {/* Section 3: About Us (Team) - Dark Background */}
            <section id="about" className="bg-slate-800 text-slate-200 py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Pattern layer for the About Us section */}
                <div className="absolute inset-0 z-0 opacity-20" style={darkPatternStyle}></div>
                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-white">Meet Our Visionary Team</h2>
                    <p className="text-lg max-w-3xl mx-auto mb-12 opacity-90">
                        We are a passionate group of innovators and strategists dedicated to empowering businesses with intelligent social media solutions.
                    </p>
                    {/* Updated grid for 2 team members */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
                        <TeamMemberCard
                            name="Muhammad Uzair Hassan"
                            bio={sharedBio} // Using the shared bio
                            imageAlt="Muhammad Uzair Hassan"
                        />
                        <TeamMemberCard
                            name="Farah Arooj"
                            imageAlt="Farah Arooj"
                            bio={sharedBio} // Using the shared bio
                                                />
                    </div>
                </div>
            </section>

            {/* Section 4: Contact - White Background */}
            <section id="contact" className="bg-white text-gray-800 py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Pattern layer for the Contact section */}
                <div className="absolute inset-0 z-0 opacity-50" style={lightPatternStyle}></div>
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">Get in Touch with Us</h2>
                    <p className="text-lg max-w-2xl mx-auto mb-12">
                        Have questions, feedback, or ready to start your journey with SocialAdify? Reach out to us!
                    </p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-lg">
                        <div className="flex items-center space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <span className="text-gray-700">support@socialadify.com</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7  text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.106l-1.412-.353a1.125 1.125 0 01-.924-.924L19.5 8.4c0-.447-.18-.88-.491-1.191l-4.69-4.69a1.125 1.125 0 00-1.191-.491L9.52 2.25M12 12.75h.008v.008H12v-.008z" />
                            </svg>
                            <span className="text-gray-700">+92 300 1234567</span> {/* Updated to Pakistani number */}
                        </div>
                    </div>
                    {/* Removed the "Start Your Free Trial" button */}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-500 text-center py-6 relative overflow-hidden">
                {/* Pattern layer for the footer */}
                <div className="absolute inset-0 z-0 opacity-20" style={darkPatternStyle}></div>
                <p className="relative z-10 text-xs">&copy; {new Date().getFullYear()} SocialAdify. All rights reserved.</p>
            </footer>
        </div>
    );
}