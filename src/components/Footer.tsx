import { Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/30 py-6 px-4 mt-12">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Made by{" "}
          <a
            href="https://www.linkedin.com/in/vaibhav-tadakamadla/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Vaibhav
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        </p>
      </div>
    </footer>
  );
}
