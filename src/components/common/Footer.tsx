export default function Footer() {
  return (
    <footer className="w-full max-w-md mx-auto py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
      &copy; {new Date().getFullYear()} Next Holiday
    </footer>
  );
}
