export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout now only provides the base background for auth pages.
  // The 'flex', 'justify-center', and 'items-center' classes were removed
  // to stop them from conflicting with the full-page layouts
  // on your signup and login pages.
  
  // I've changed the background from gray-100 to slate-50 for a cleaner look.
  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </section>
  );
}