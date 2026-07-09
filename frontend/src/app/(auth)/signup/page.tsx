// D:\socialadify\frontend\src\app\(auth)\signup\page.tsx
"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// Import icons for the new design
import { 
    Check, 
    X, 
    Loader2, 
    Palette, 
    ShieldCheck, 
    CalendarClock,
    Eye,      // <-- Added for password peek
    EyeOff    // <-- Added for password peek
} from "lucide-react";

// --- Helper Components (Moved for readability) ---

// SVG Icon for App Logo
const AppLogo = ({ className = "w-10 h-10 text-white" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 6C9.14344 6 6.79378 7.65981 5.64006 9.99995H8.04005C8.82681 8.78081 10.2993 8 12 8C13.7007 8 15.1732 8.78081 15.9599 9.99995H18.3599C17.2062 7.65981 14.8566 6 12 6ZM12 16C10.2993 16 8.82681 15.2191 8.04005 14H5.64006C6.79378 16.3401 9.14344 18 12 18C14.8566 18 17.2062 16.3401 18.3599 14H15.9599C15.1732 15.2191 13.7007 16 12 16ZM5 12C5 11.7181 5.01793 11.4402 5.05279 11.1667H18.9472C18.9821 11.4402 19 11.7181 19 12C19 12.2819 18.9821 12.5597 18.9472 12.8333H5.05279C5.01793 12.5597 5 12.2819 5 12Z"/>
    </svg>
);

// Password Hint and Validation Display Component
const PasswordHintAndValidationDisplay = ({ password, showDetails }: { password?: string; showDetails?: boolean }) => {
    const criteria = [
        { label: "At least 8 characters", met: (password?.length || 0) >= 8 },
        { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password || '') },
        { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password || '') },
        { label: "One digit (0-9)", met: /[0-9]/.test(password || '') },
        { label: "One special character (e.g. !@#$)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || '') }
    ];

    if (!showDetails && password && password.length > 0 && !criteria.every(c => c.met)) {
        return <p className="mt-1.5 text-xs text-slate-500">Password must meet complexity requirements.</p>;
    }
    if (!showDetails && (!password || password.length === 0)) {
         return <p className="mt-1.5 text-xs text-slate-500">Min. 8 chars, incl. uppercase, lowercase, digit, special char.</p>;
    }

    return (
        <div className="mt-2 space-y-0.5 text-xs">
            {criteria.map(criterion => (
                <p key={criterion.label} className={`flex items-center ${criterion.met ? 'text-green-600' : 'text-slate-500'}`}>
                    {criterion.met 
                        ? <Check className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> 
                        : <X className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/>
                    }
                    <span>{criterion.label}</span>
                </p>
            ))}
        </div>
    );
};


// --- Main Page Component ---

export default function SignupPage() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  
  const { signup, isLoading: authIsLoading, error: authError, isAuthenticated, isAuthReady, clearError } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Logic Hooks (Unchanged) ---
  useEffect(() => {
    if (isAuthReady && isAuthenticated) { router.push('/maindashboard'); }
  }, [isAuthReady, isAuthenticated, router]);

  useEffect(() => { 
    if (authError) { setFormError(authError); }
    return () => { if(authError) clearError(); }
  }, [authError, clearError]);

  useEffect(() => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    };
    setIsPasswordValid(Object.values(validations).every(Boolean));
  }, [password]);

  useEffect(() => {
    setIsConfirmPasswordValid(password.length > 0 && password === confirmPassword && isPasswordValid);
  }, [password, confirmPassword, isPasswordValid]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null); clearError(); 
    if (!termsAgreed) { setFormError("You must agree to the Terms & Conditions."); return; }
    if (password !== confirmPassword) { setFormError("Passwords do not match!"); setShowPasswordHints(true); return; }
    if (!firstname || !lastname || !email || !password) { setFormError("All fields are required."); return; }
    
    // --- NEW VALIDATION: Check if First Name starts with a number ---
    if (/^\d/.test(firstname)) {
        setFormError("First Name cannot start with a number.");
        return;
    }

    if (!isPasswordValid) {
        setFormError("Password does not meet all requirements.");
        setShowPasswordHints(true);
        return;
    }

    try {
      await signup({ firstname, lastname, email, password });
      router.push('/login?signupSuccess=true');
    } catch (err: unknown) {
      console.error("SignupPage: Error during signup:", err);
      if (err instanceof Error && !authError) { setFormError(err.message); } 
      else if (!authError) { setFormError('An unexpected error occurred.'); }
      setShowPasswordHints(true); 
    }
  };
  
  // --- Loading States (Reverted to blueish dark bg) ---
  if (!isAuthReady) {
    return ( <div className="flex items-center justify-center min-h-screen bg-slate-900"><p className="text-slate-300 text-lg">Loading SocialAdify...</p></div> );
  }
  if (isAuthReady && isAuthenticated) {
    return ( <div className="flex items-center justify-center min-h-screen bg-slate-900"><p className="text-slate-300 text-lg">Already logged in. Redirecting...</p></div> );
  }

  // --- Dynamic Styling (Reverted to INDIGO) ---
  const baseInputClasses = "w-full px-4 py-2.5 text-sm border rounded-lg shadow-sm outline-none transition duration-200 text-slate-900 placeholder-slate-500 bg-white";
  const defaultBorderClasses = "border-slate-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500";
  const validInputClasses = "border-green-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500";
  const errorBorderClasses = "border-red-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500";

  const passwordInputDynamicClasses = `${baseInputClasses} ${
    password.length > 0 && !isPasswordValid && showPasswordHints ? errorBorderClasses : (isPasswordValid ? validInputClasses : defaultBorderClasses)
  }`;
  const confirmPasswordInputDynamicClasses = `${baseInputClasses} ${
    confirmPassword.length > 0 && password !== confirmPassword && showPasswordHints ? errorBorderClasses : (isConfirmPasswordValid && confirmPassword.length > 0 ? validInputClasses : defaultBorderClasses)
  }`;

  const labelClasses = "block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide";

  return (
    // Background color removed, now handled by layout.tsx
    <div className="min-h-screen flex flex-col lg:flex-row lg:overflow-hidden">
      
      {/* --- Left "Marketing" Panel (Reverted to INDIGO) --- */}
      <div className="w-full lg:w-1/2 bg-slate-900 text-white p-8 sm:p-12 md:p-20 flex flex-col justify-center items-center lg:items-start text-center lg:text-left order-last lg:order-first relative overflow-hidden">
        {/* Blurs updated to use indigo and purple */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500 opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2 filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 opacity-20 rounded-full translate-x-1/2 translate-y-1/2 filter blur-3xl"></div>
        
        <div className="relative z-10 max-w-md xl:max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 mb-10 lg:mb-12">
            {/* Logo color changed back to indigo */}
            <AppLogo className="w-12 h-12 text-indigo-400"/>
            <span className="text-3xl lg:text-4xl font-bold tracking-tighter">SocialAdify</span>
          </Link>
          {/* Gradient updated to original */}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
            Join the Future of Ad Management.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 opacity-90 mb-12 leading-relaxed">
            Sign up to harness AI for smarter ad creation, deeper insights, and streamlined campaign scheduling.
          </p>
          
          {/* Updated Feature List with original colors */}
          <div className="space-y-6 text-slate-300">
            <div className="flex items-start gap-4">
                <div className="bg-indigo-600/30 p-2.5 rounded-full flex-shrink-0">
                    <Palette className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">AI-Powered Creation</h3>
                    <p className="text-sm text-slate-400">Generate compelling ad copy and images in seconds.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-purple-600/30 p-2.5 rounded-full flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Optimize with AI Suggestions</h3>
                    <p className="text-sm text-slate-400">Receive actionable insights to improve campaign performance.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-pink-600/30 p-2.5 rounded-full flex-shrink-0">
                    <CalendarClock className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Schedule with Ease</h3>
                    <p className="text-sm text-slate-400">Plan and automate your social media and ad posts.</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right "Form" Panel (Reverted to INDIGO) --- */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 py-10 sm:p-10 md:p-16 order-first lg:order-last overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <AppLogo className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-slate-800">SocialAdify</span>
          </Link>
          
          {/* The New Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-6">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                Create your Account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                  Log In
                </Link>
              </p>
            </div>

            {formError && (
              <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg shadow-sm">
                {formError}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="flex-1 mb-4 sm:mb-0">
                      <label htmlFor="firstname" className={labelClasses}>First Name</label>
                      <input id="firstname" name="firstname" type="text" required
                          className={`${baseInputClasses} ${defaultBorderClasses}`}
                          placeholder="E.g., Jane" value={firstname} onChange={(e) => setFirstname(e.target.value)} disabled={authIsLoading} />
                  </div>
                  <div className="flex-1">
                      <label htmlFor="lastname" className={labelClasses}>Last Name</label>
                      <input id="lastname" name="lastname" type="text" required
                          className={`${baseInputClasses} ${defaultBorderClasses}`}
                          placeholder="E.g., Doe" value={lastname} onChange={(e) => setLastname(e.target.value)} disabled={authIsLoading} />
                  </div>
              </div>
              <div>
                <label htmlFor="email" className={labelClasses}>Email Address</label>
                <input id="email" name="email" type="email" autoComplete="email" required
                  className={`${baseInputClasses} ${defaultBorderClasses}`}
                  placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={authIsLoading} />
              </div>

              {/* --- Password Input with Peek --- */}
              <div>
                <label htmlFor="password" className={labelClasses}>Password</label>
                <div className="relative">
                    <input 
                        id="password" 
                        name="password" 
                        type={showPassword ? "text" : "password"} // Dynamic type
                        autoComplete="new-password" required
                        className={`${passwordInputDynamicClasses} pr-10`} // Added pr-10
                        placeholder="Enter your password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        onFocus={() => setShowPasswordHints(true)}
                        disabled={authIsLoading} />
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
                <PasswordHintAndValidationDisplay password={password} showDetails={showPasswordHints || (password.length > 0 && !isPasswordValid)} />
              </div>

              {/* --- Confirm Password Input with Peek --- */}
              <div>
                <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password</label>
                <div className="relative">
                    <input 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} // Dynamic type
                        autoComplete="new-password" required
                        className={`${confirmPasswordInputDynamicClasses} pr-10`} // Added pr-10
                        placeholder="Re-enter password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setShowPasswordHints(true)} 
                        disabled={authIsLoading} />
                    {/* Peek Button */}
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-slate-500 hover:text-indigo-600 transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
              </div>

              <div className="flex items-center pt-1">
                  <input id="terms" name="terms" type="checkbox" required 
                          checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-offset-2" />
                  <label htmlFor="terms" className="ml-2.5 block text-xs text-slate-600">
                      I agree to the{' '}
                      <a href="#" className="font-medium text-indigo-600 hover:underline">Terms & Privacy Policy</a>
                  </label>
              </div>

              <button
                type="submit"
                disabled={authIsLoading || !termsAgreed || !isPasswordValid || password !== confirmPassword}
                className="w-full py-3 mt-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center"
              >
                {authIsLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                    </>
                ) : (
                    "Create Free Account"
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}