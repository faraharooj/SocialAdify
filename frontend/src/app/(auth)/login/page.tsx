"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
// Import icons: marketing, loading, and password peek
import { 
    Loader2, 
    PieChart, 
    Sparkles, 
    LayoutList,
    Eye,
    EyeOff
} from "lucide-react";

// SVG Icon for App Logo
const AppLogo = ({ className = "w-10 h-10 text-white" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 6C9.14344 6 6.79378 7.65981 5.64006 9.99995H8.04005C8.82681 8.78081 10.2993 8 12 8C13.7007 8 15.1732 8.78081 15.9599 9.99995H18.3599C17.2062 7.65981 14.8566 6 12 6ZM12 16C10.2993 16 8.82681 15.2191 8.04005 14H5.64006C6.79378 16.3401 9.14344 18 12 18C14.8566 18 17.2062 16.3401 18.3599 14H15.9599C15.1732 15.2191 13.7007 16 12 16ZM5 12C5 11.7181 5.01793 11.4402 5.05279 11.1667H18.9472C18.9821 11.4402 19 11.7181 19 12C19 12.2819 18.9821 12.5597 18.9472 12.8333H5.05279C5.01793 12.5597 5 12.2819 5 12Z"/>
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login, error: authErrorFromContext, isLoading: authIsLoading, isAuthenticated, isAuthReady, clearError } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
    
    // State for password visibility
    const [showPassword, setShowPassword] = useState(false);

    // --- Logic Hooks (Unchanged) ---
    useEffect(() => {
        if (isAuthReady && isAuthenticated) {
            router.push('/maindashboard');
        }
    }, [isAuthReady, isAuthenticated, router]);

    useEffect(() => {
        const signupSuccess = searchParams.get('signupSuccess');
        const passwordResetSuccess = searchParams.get('passwordResetSuccess');

        if (signupSuccess === 'true') {
            setFormSuccessMessage('Signup successful! Please log in.');
            router.replace('/login', { scroll: false }); 
        }
        if (passwordResetSuccess === 'true') {
            setFormSuccessMessage('Password reset successfully! Please log in with your new password.');
            router.replace('/login', { scroll: false });
        }
    }, [searchParams, router]);

    useEffect(() => {
        setFormError(authErrorFromContext);
    }, [authErrorFromContext]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccessMessage(null);
        if (clearError) clearError();

        try {
            await login({ email, password });
        } catch (err: unknown) {
            console.error("LoginPage: Error during login attempt", err);
        }
    };

    // --- Loading State (Reverted to blueish dark bg) ---
    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <p className="text-slate-300 text-lg">Loading SocialAdify...</p>
            </div>
        );
    }

    // --- Dynamic Styling (Reverted to INDIGO) ---
    const baseInputClasses = "w-full px-4 py-2.5 text-sm border rounded-lg shadow-sm outline-none transition duration-200 text-slate-900 placeholder-slate-500 bg-white";
    const defaultBorderClasses = "border-slate-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";
    const labelClasses = "block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide";

    return (
        // Root div layout updated as requested
        <div className="min-h-screen flex flex-col lg:flex-row lg:overflow-hidden">
            
            {/* --- Left "Form" Panel (Form is now on the left) --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 py-10 sm:p-10 md:p-16 order-first lg:order-first overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo Header (Updated to Indigo) */}
                    <Link href="/" className="flex items-center justify-center gap-2 mb-6 lg:hidden">
                        <AppLogo className="w-8 h-8 text-indigo-600" />
                        <span className="text-2xl font-bold text-slate-800">SocialAdify</span>
                    </Link>
                    
                    {/* The New Form Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-6">
                        <div className="text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                                Welcome Back!
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Don&apos;t have an account?{' '}
                                {/* Link updated to Indigo */}
                                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                                    Create one now
                                </Link>
                            </p>
                        </div>

                        {/* Success/Error messages */}
                        {formSuccessMessage && (
                            <div className="p-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg shadow-sm">
                                {formSuccessMessage}
                            </div>
                        )}
                        {formError && (
                            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg shadow-sm">
                                {formError}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email-address" className={labelClasses}>
                                    Email Address
                                </label>
                                <input
                                    id="email-address" name="email" type="email" autoComplete="email" required
                                    className={`${baseInputClasses} ${defaultBorderClasses}`}
                                    placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={authIsLoading}
                                />
                            </div>

                            {/* --- Password Input with Peek --- */}
                            <div>
                                <label htmlFor="password" className={labelClasses}>Password</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"} // Dynamic type
                                        autoComplete="current-password"
                                        required
                                        className={`${baseInputClasses} ${defaultBorderClasses} pr-10`} // Added pr-10
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={authIsLoading}
                                    />
                                    {/* Peek Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-slate-500 hover:text-indigo-600 transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs mt-3">
                                <div className="flex items-center">
                                    {/* Checkbox updated to Indigo */}
                                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-1" />
                                    <label htmlFor="remember-me" className="ml-2 block text-slate-600">Remember me</label>
                                </div>
                                {/* Link updated to Indigo */}
                                <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={authIsLoading}
                                // Button updated to Indigo and to show spinner
                                className="w-full py-3 mt-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                            >
                                {authIsLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    "Log In"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- Right "Marketing" Panel (Marketing is now on the right) --- */}
            <div className="w-full lg:w-1/2 bg-slate-900 text-white p-8 sm:p-12 md:p-20 flex-col justify-center items-center lg:items-start text-center lg:text-left order-last lg:order-last relative overflow-hidden hidden lg:flex">
                {/* Blurs updated to use indigo and purple */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500 opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2 filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 opacity-20 rounded-full translate-x-1/2 translate-y-1/2 filter blur-3xl"></div>

                <div className="relative z-10 max-w-md xl:max-w-lg">
                    {/* Logo color changed back to indigo */}
                    <Link href="/" className="inline-flex items-center gap-3 mb-10 lg:mb-12">
                        <AppLogo className="w-12 h-12 text-indigo-400"/>
                        <span className="text-3xl lg:text-4xl font-bold tracking-tighter">SocialAdify</span>
                    </Link>
                    {/* Gradient updated to original */}
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                        Unlock Your Ad Potential.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 opacity-90 mb-12 leading-relaxed">
                        Log in to access AI-powered insights, streamline campaign management, and achieve remarkable results.
                    </p>
                    
                    {/* Updated Feature List with new icons and original colors */}
                    <div className="space-y-6 text-slate-300">
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-600/30 p-2.5 rounded-full flex-shrink-0">
                                <PieChart className="w-5 h-5 text-indigo-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Smart Analytics</h3>
                                <p className="text-sm text-slate-400">Visualize your campaign performance with rich dashboards.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-600/30 p-2.5 rounded-full flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-purple-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">AI-Driven Suggestions</h3>
                                <p className="text-sm text-slate-400">Receive actionable insights to improve ad performance.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-pink-600/30 p-2.5 rounded-full flex-shrink-0">
                                <LayoutList className="w-5 h-5 text-pink-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Campaign Management</h3>
                                <p className="text-sm text-slate-400">Manage all your ad campaigns from one unified platform.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}