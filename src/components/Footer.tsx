import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-white dark:text-white">NRGHax</h3>
            <p className="text-sm text-muted-foreground">
              Learn energy systems engineering through practical challenges.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white dark:text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/hacks" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
                  All Hacks
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white dark:text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white dark:text-white">Connect</h4>
            <div className="flex space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-black flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {currentYear} NRGHax. All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm">
            <Link href="/terms" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="text-black dark:text-muted-foreground hover:text-black/70 dark:hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}