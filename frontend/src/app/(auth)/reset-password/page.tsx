// D:\socialadify\frontend\src\app\(auth)\reset-password\page.tsx
'use client';

import { FormEvent, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/services/authService';

// Define AppLogo directly in the file as a placeholder (kept local as per request)
const AppLogo = ({ className = "w-10 h-10 text-indigo-600 dark:text-indigo-400" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
    </svg>
);


// Password validation states for UI feedback (kept local as per request)
const PasswordValidationDisplay = ({ password, showDetails }: { password?: string; showDetails?: boolean }) => {
    const criteria = [
        { label: "At least 8 characters", met: (password?.length || 0) >= 8 },
        { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password || '') },
        { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password || '') },
        { label: "One digit (0-9)", met: /[0-9]/.test(password || '') },
        { label: "One special character (e.g. !@#$)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || '') }
    ];

    const CheckIcon = ({ additionalClassName="" }: {additionalClassName?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 text-green-600 dark:text-green-400 ${additionalClassName}`}><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>;
    const CrossIcon = ({additionalClassName=""}: {additionalClassName?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ${additionalClassName}`}><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>;

    if (!showDetails && password && password.length > 0 && !criteria.every(c => c.met)) {
        return <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Password must meet complexity requirements.</p>;
    }
    if (!showDetails && (!password || password.length === 0)) {
            return <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Min. 8 chars, incl. uppercase, lowercase, digit, special char.</p>;
    }

    return (
        <div className="mt-2 space-y-0.5 text-xs">
            {criteria.map(criterion => (
                <p key={criterion.label} className={`flex items-center ${criterion.met ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {criterion.met ? <CheckIcon additionalClassName="mr-1 flex-shrink-0"/> : <CrossIcon additionalClassName="mr-1 flex-shrink-0"/>}
                    <span>{criterion.label}</span>
                </p>
            ))}
        </div>
    );
};


function ResetPasswordPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [showPasswordHints, setShowPasswordHints] = useState(false); // State to control hint visibility


    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new password reset link.');
        }
    }, [token]);

    useEffect(() => {
        const validations = {
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            lowercase: /[a-z]/.test(newPassword),
            digit: /[0-9]/.test(newPassword),
            specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
        };
        setIsPasswordValid(Object.values(validations).every(Boolean));
    }, [newPassword]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        if (!token) {
            setError('Reset token is missing. Please use the link from your email.');
            setIsLoading(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setShowPasswordHints(true); // Show hints on error
            setIsLoading(false);
            return;
        }
        if (!isPasswordValid) {
            setError('Password does not meet all requirements.');
            setShowPasswordHints(true); // Show hints on error
            setIsLoading(false);
            return;
        }

        try {
            const response = await resetPassword({ token, new_password: newPassword });
            setMessage(response.message + " You can now log in.");
            setTimeout(() => router.push('/login?passwordResetSuccess=true'), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setShowPasswordHints(true); // Show hints on error
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 text-sm border rounded-lg shadow-sm outline-none transition text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-slate-700";
    const defaultBorderClasses = "border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400";
    const validInputClasses = "border-green-500 dark:border-green-400 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400";
    const errorBorderClasses = "border-red-500 dark:border-red-400 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400";


    const passwordInputDynamicClasses = `${inputClasses} ${
        newPassword.length > 0 && !isPasswordValid && showPasswordHints ? errorBorderClasses : (isPasswordValid ? validInputClasses : defaultBorderClasses)
    }`;
    const confirmPasswordInputDynamicClasses = `${inputClasses} ${
        confirmPassword.length > 0 && newPassword !== confirmPassword && showPasswordHints ? errorBorderClasses : (newPassword === confirmPassword && newPassword.length > 0 && isPasswordValid ? validInputClasses : defaultBorderClasses)
    }`;


    if (!token && !isLoading) {
        return (
            <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-slate-800 shadow-xl rounded-2xl text-center">
                <Link href="/" className="inline-block mb-6">
                    <AppLogo className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto" />
                </Link>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Invalid Link
                </h2>
                <p className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/30 border border-red-200 dark:border-red-700 rounded-lg shadow-sm">
                    {error || 'The password reset link is invalid or has expired. Please request a new one.'}
                </p>
                <Link href="/forgot-password" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                    Request a new link
                </Link>
            </div>
        );
    }


    return (
        <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
            <div className="text-center">
                <Link href="/" className="inline-block mb-6">
                    <AppLogo className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto" />
                </Link>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Reset Your Password
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Enter your new password below.
                </p>
            </div>

            {message && (
                <div className="p-3 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 border border-green-200 dark:border-green-700 rounded-lg shadow-sm">
                    {message}
                </div>
            )}
            {error && !message && (
                <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/30 border border-red-200 dark:border-red-700 rounded-lg shadow-sm">
                    {error}
                </div>
            )}

            {!message && (
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="new-password" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 tracking-wide">
                            New Password
                        </label>
                        <input
                            id="new-password"
                            name="newPassword"
                            type="password"
                            required
                            className={passwordInputDynamicClasses}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onFocus={() => setShowPasswordHints(true)} // Show hints on focus
                            disabled={isLoading}
                        />
                        <PasswordValidationDisplay password={newPassword} showDetails={showPasswordHints || (newPassword.length > 0 && !isPasswordValid)} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 tracking-wide">
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            className={confirmPasswordInputDynamicClasses}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setShowPasswordHints(true)} // Show hints on focus
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed text-base"
                    >
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>
            )}
            <div className="text-sm text-center mt-4">
                <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
                    Back to Log In
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen dark:bg-slate-900 dark:text-slate-300">Loading...</div>}>
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
                <ResetPasswordPageContent />
            </div>
        </Suspense>
    );
}