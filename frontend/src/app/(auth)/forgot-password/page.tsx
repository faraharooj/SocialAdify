// D:\socialadify\frontend\src\app\(auth)\forgot-password\page.tsx
'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/services/authService';
// import { AppLogo } from '@/components/ui/icons'; // Assuming you have a shared AppLogo

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response.message); // Display success/info message from backend
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            {/* <AppLogo className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto" /> */}
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No worries! Enter your email address below and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {message && (
          <div className="p-3 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 border border-green-200 dark:border-green-700 rounded-lg shadow-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/30 border border-red-200 dark:border-red-700 rounded-lg shadow-sm">
            {error}
          </div>
        )}

        {!message && ( // Only show form if no success message yet
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 tracking-wide">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-slate-700"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-sm text-center">
          <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline">
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
