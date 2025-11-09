
import React, { useState, useCallback, FormEvent, useEffect } from 'react';
import type { ShortenedLink } from './types';
import { createShortUrl } from './services/geminiService';


// --- Icon Components ---
const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- UI Components (defined outside App to prevent re-creation on re-renders) ---

interface ShortenFormProps {
    longUrl: string;
    setLongUrl: (url: string) => void;
    handleSubmit: (e: FormEvent) => void;
    isLoading: boolean;
    error: string | null;
}

const ShortenForm: React.FC<ShortenFormProps> = ({ longUrl, setLongUrl, handleSubmit, isLoading, error }) => {
    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
                <label htmlFor="longUrl" className="sr-only">Long URL</label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="url"
                        name="longUrl"
                        id="longUrl"
                        value={longUrl}
                        onChange={(e) => setLongUrl(e.target.value)}
                        className="w-full rounded-md border-gray-600 bg-gray-700/50 p-4 pl-10 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter your long URL here..."
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:bg-indigo-500/50 transition-colors"
            >
                {isLoading ? <><LoadingSpinner /> Shortening...</> : "Create Short Link"}
            </button>
            {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
        </form>
    );
};

interface ResultCardProps {
    link: ShortenedLink;
}

const ResultCard: React.FC<ResultCardProps> = ({ link }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(link.shortUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, [link.shortUrl]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-lg ring-1 ring-white/10 animate-fade-in-down">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 truncate">{link.originalUrl}</p>
                    <a href={`//${link.shortUrl}`} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                        {link.shortUrl}
                    </a>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <button
                        onClick={handleCopy}
                        className="flex w-full sm:w-auto items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
                    >
                        {isCopied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ClipboardIcon className="h-5 w-5" />}
                        <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

interface HistoryListProps {
    links: ShortenedLink[];
}

const HistoryList: React.FC<HistoryListProps> = ({ links }) => {
    if (links.length === 0) {
        return null;
    }
    return (
        <div className="w-full space-y-4 mt-8">
             <h2 className="text-xl font-semibold text-center text-gray-300">Your recent links</h2>
            {links.map((link) => (
                <ResultCard key={link.id} link={link} />
            ))}
        </div>
    );
};

const Header: React.FC = () => (
    <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Link Shortener
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Create short, memorable links from any long URL.
        </p>
    </header>
);


// --- Main App Component ---

export default function App() {
    const [longUrl, setLongUrl] = useState('');
    const [shortenedLinks, setShortenedLinks] = useState<ShortenedLink[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (event: FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
             // Basic client-side URL validation
            if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
                throw new Error('Please enter a valid URL including http:// or https://');
            }
            new URL(longUrl);

            const shortUrl = await createShortUrl(longUrl);
            const newLink: ShortenedLink = {
                id: crypto.randomUUID(),
                originalUrl: longUrl,
                shortUrl: shortUrl,
                createdAt: new Date().toISOString(),
            };
            setShortenedLinks(prevLinks => [newLink, ...prevLinks]);
            setLongUrl('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [longUrl]);
    
    useEffect(() => {
      // Add a simple keyframe animation for new items
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-gray-900 to-gray-900"></div>
            <div className="relative isolate min-h-screen flex items-center justify-center p-4">
                 <div className="w-full max-w-2xl mx-auto space-y-8 py-12">
                    <Header />
                    <main className="bg-gray-800/30 backdrop-blur-md rounded-xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/10">
                        <ShortenForm
                            longUrl={longUrl}
                            setLongUrl={setLongUrl}
                            handleSubmit={handleSubmit}
                            isLoading={isLoading}
                            error={error}
                        />
                    </main>
                    <HistoryList links={shortenedLinks} />
                </div>
            </div>
        </div>
    );
}
