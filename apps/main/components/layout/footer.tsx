import { ThemeSwitcher } from "@/components/theme-switcher";

export function Footer() {
  return (
    <footer className="w-full flex items-center justify-between border-t px-4 py-4 text-center text-xs gap-4 flex-wrap">
      <p>
        Powered by{" "}
        <a
          href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
          target="_blank"
          rel="noreferrer"
          className="font-bold hover:underline"
        >
          Supabase
        </a>
      </p>

      <ThemeSwitcher />
    </footer>
  );
}