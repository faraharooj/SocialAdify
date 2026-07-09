// D:\socialadify\frontend\src\lib\hooks\auth\useLogin.ts
import { useState } from "react"; // Removed unused FormEvent
import { useAuth } from "@/context/AuthContext"; // Import global AuthContext
// import { useRouter } from "next/navigation"; // Removed unused useRouter

export function useLogin() {
  const { login: contextLogin, isLoading: authContextIsLoading } = useAuth(); // Get login function and loading state from AuthContext
  // const router = useRouter(); // Removed as it's not used in this hook's logic

  // Local state for this hook specifically for form feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // You might not need this if redirecting

  const login = async (email: string, password: string) => {
    setError(null);
    setSuccessMessage(null);
    // isPending will now be controlled by authContextIsLoading from useAuth

    try {
      // Call the login function from AuthContext
      // This function handles the API call, token storage, global state update, and redirection
      await contextLogin({ email, password });
      
      // If contextLogin is successful, it will navigate.
      // setSuccessMessage("Login successful! Redirecting..."); // Optional: AuthContext handles navigation

    } catch (err: unknown) {
      console.error("useLogin hook: Error during contextLogin call", err);
      if (err instanceof Error) {
        setError(err.message); // Display backend error message
      } else {
        setError("An unexpected error occurred during login.");
      }
    }
    // No finally or setIsPending(false) needed here, as isPending is derived from authContextIsLoading
  };

  return { 
    login, 
    error, 
    successMessage, 
    isPending: authContextIsLoading // Use isLoading from AuthContext
  };
}
