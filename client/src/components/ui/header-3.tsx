'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { MovingBorder } from '@/components/ui/moving-border';
import { createPortal } from 'react-dom';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon } from 'lucide-react';
import {
    CodeIcon,
    GlobeIcon,
    LayersIcon,
    UserPlusIcon,
    Users,
    Star,
    FileText,
    Shield,
    RotateCcw,
    Handshake,
    Leaf,
    HelpCircle,
    BarChart,
    PlugIcon,
    Layout,
    UserCircle,
    LogOut,
    FileStack,
    LifeBuoy,
    MessageSquare,
    Briefcase,
    Zap
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { supabase } from '../../supabase';

type LinkItem = {
    title: string;
    href: string;
    icon: LucideIcon;
    description?: string;
    isExternal?: boolean;
};

export function Header() {
    const [open, setOpen] = React.useState(false);
    const scrolled = useScroll(10);
    const { user, clearUser } = useStore();
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    const isAdminPage = location.pathname.startsWith('/admin');
    const isStudentPage = location.pathname.startsWith('/student') ||
        location.pathname === '/master-profile' ||
        location.pathname === '/job-board' ||
        location.pathname === '/templates' ||
        location.pathname === '/build' ||
        location.pathname === '/upload-resume';
    const isStudentChoice = location.pathname === '/student/choice';
    const isBuildPage = location.pathname === '/build' || location.pathname === '/build-demo';
    const isStandaloneFlowPage = location.pathname === '/upload-resume' || location.pathname === '/master-profile';

    // Hide header on student choice and build pages
    if (isStudentChoice || isBuildPage || isStandaloneFlowPage) return null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        clearUser();
        navigate('/signin?logout=1', { replace: true, state: { clearLogin: true } });
        setOpen(false);
    };

    const handleHashLink = (e, href) => {
        if (href.startsWith('/#')) {
            const id = href.replace('/#', '');
            if (location.pathname === '/') {
                e.preventDefault();
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', href);
                }
            }
            setOpen(false);
        }
    };

    return (
        <header
            className={cn('fixed top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
                'bg-white/80 supports-[backdrop-filter]:bg-white/50 border-slate-200/50 backdrop-blur-lg shadow-sm py-2':
                    scrolled,
                'bg-transparent py-2': !scrolled
            })}
        >
            <nav className="flex h-20 w-full items-center justify-between px-6 lg:px-8">
                {/* 1. Logo */}
                <div className="flex-shrink-0">
                    <Link to="/" className="flex items-center no-underline">
                        <img
                            src="/logo.png"
                            alt="Persevex"
                            className="h-20 md:h-24 w-auto object-contain scale-125 origin-left transition-transform"
                        />
                    </Link>
                </div>

                {/* 2. Main Navigation Island */}
                {!isAdminPage && (
                    <div className="hidden lg:flex items-center mx-10 bg-white/90 border border-slate-200/60 backdrop-blur-xl rounded-full px-2 py-2 gap-1 shadow-lg shadow-blue-500/5 ring-1 ring-black/5">
                        {user ? (
                            <>
                                <Link
                                    to="/student"
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    Dashboard
                                </Link>

                                <Link
                                    to="/templates"
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    Templates
                                </Link>

                                <Link
                                    to="/student/choice"
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    Master Profile
                                </Link>

                                <a
                                    href="https://www.persevex.com/job-portal"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 flex items-center gap-2 px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Briefcase size={16} />
                                    Job Portal
                                </a>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/#features"
                                    onClick={(e) => handleHashLink(e, '/#features')}
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    Features
                                </Link>
                                <Link
                                    to="/#why-us"
                                    onClick={(e) => handleHashLink(e, '/#why-us')}
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all whitespace-nowrap"
                                >
                                    Why Persevex?
                                </Link>
                                <Link
                                    to="/#faq"
                                    onClick={(e) => handleHashLink(e, '/#faq')}
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    FAQ
                                </Link>
                                <Link
                                    to="/#support"
                                    onClick={(e) => handleHashLink(e, '/#support')}
                                    className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                >
                                    Support
                                </Link>

                                {location.pathname !== '/' && (
                                    <>
                                        <Link
                                            to="/signin"
                                            className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                        >
                                            Build
                                        </Link>

                                        <Link
                                            to="/templates"
                                            className="px-5 h-10 flex items-center font-bold text-sm text-slate-700 hover:bg-white/50 rounded-full transition-all"
                                        >
                                            Templates
                                        </Link>
                                    </>
                                )}

                                {/* Job Portal Highlight inside the island */}
                                <a
                                    href="https://www.persevex.com/job-portal"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 flex items-center gap-2 px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Briefcase size={16} />
                                    Job Portal
                                </a>
                            </>
                        )}
                    </div>
                )}

                {/* 3. Far Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3">
                        {!user ? (
                            <>
                                <MovingBorder
                                    borderRadius="0.75rem"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 text-sm font-bold shadow-xl shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
                                    borderClassName="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400"
                                    containerClassName="rounded-xl"
                                    onClick={() => navigate('/signin')}
                                >
                                    <span className="relative block">
                                        Get Started
                                    </span>
                                </MovingBorder>
                            </>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="px-6 h-10 flex items-center font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-all shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-95"
                            >
                                Sign Out
                            </button>
                        )}
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setOpen(!open)}
                        className="lg:hidden text-slate-600"
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        aria-label="Toggle menu"
                    >
                        <MenuToggleIcon open={open} className="size-6" duration={300} />
                    </Button>
                </div>
            </nav>

            <MobileMenu open={open} className="flex flex-col justify-between gap-6 overflow-y-auto">
                <div className="flex w-full flex-col gap-y-4">
                    {user && !isAdminPage ? (
                        <div className="flex flex-col gap-2">
                            <Link to="/student" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold transition-colors hover:bg-blue-50">
                                <FileStack className="size-5 text-blue-600" />
                                Dashboard
                            </Link>
                            <Link to="/templates" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold transition-colors hover:bg-indigo-50">
                                <Layout className="size-5 text-indigo-600" />
                                Templates
                            </Link>
                            <Link to="/student/choice" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold transition-colors hover:bg-violet-50">
                                <UserCircle className="size-5 text-violet-600" />
                                Master Profile
                            </Link>
                            <a href="https://www.persevex.com/job-portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform">
                                <Briefcase className="size-5" />
                                Job Portal
                            </a>
                        </div>
                    ) : !user ? (
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Explore Persevex</span>
                            <Link to="/#features" onClick={(e) => { handleHashLink(e, '/#features'); setOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold">
                                <Zap className="size-5 text-amber-500" />
                                Features
                            </Link>
                            <Link to="/#faq" onClick={(e) => { handleHashLink(e, '/#faq'); setOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold">
                                <MessageSquare className="size-5 text-blue-500" />
                                FAQ
                            </Link>
                            <Link to="/#support" onClick={(e) => { handleHashLink(e, '/#support'); setOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold">
                                <LifeBuoy className="size-5 text-emerald-500" />
                                Support
                            </Link>
                            {location.pathname !== '/' && (
                                <>
                                    <Link to="/build" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold">
                                        <Zap className="size-5 text-blue-600" />
                                        Build
                                    </Link>
                                    <Link to="/templates" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold">
                                        <Layout className="size-5 text-indigo-600" />
                                        Templates
                                    </Link>
                                </>
                            )}
                            <a href="https://www.persevex.com/job-portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform">
                                <Briefcase className="size-5" />
                                Job Portal
                            </a>
                        </div>
                    ) : (
                        null
                    )}
                </div>

                <div className="flex flex-col gap-3 pb-8">
                    {user ? (
                        <Button variant="outline" className="w-full border-rose-100 text-rose-600 font-bold h-12 rounded-2xl" onClick={handleLogout}>
                            Sign Out
                        </Button>
                    ) : (
                        <>
                            <MovingBorder
                                borderRadius="1rem"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-12 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/10"
                                borderClassName="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400"
                                containerClassName="w-full rounded-2xl"
                                onClick={() => { setOpen(false); navigate('/signin'); }}
                            >
                                <span className="w-full h-full flex items-center justify-center">
                                    Sign In
                                </span>
                            </MovingBorder>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-12 rounded-2xl shadow-xl shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5" asChild>
                                <Link to="/signin" onClick={() => setOpen(false)}>Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </MobileMenu>
        </header >
    );
}

function MobileMenu({ open, children, className, ...props }: { open: boolean; children: React.ReactNode; className?: string }) {
    if (!open || typeof window === 'undefined') return null;

    return createPortal(
        <div
            id="mobile-menu"
            className={cn(
                'bg-white/95 backdrop-blur-xl',
                'fixed top-20 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-slate-100 md:hidden',
            )}
        >
            {/* The following div and button elements appear to be misplaced or incomplete JSX. */}
            {/* They are commented out to maintain syntactic correctness of the file. */}
            <div
                data-slot={open ? 'open' : 'closed'}
                className={cn(
                    'data-[slot=open]:animate-in data-[slot=open]:slide-in-from-top-4 ease-out duration-300',
                    'size-full p-6',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}

function ListItem({
    title,
    description,
    icon: Icon,
    className,
    href,
    isExternal,
    onClick,
    ...props
}: any) {
    const handleLinkClick = (e: any) => {
        if (onClick) onClick(e);
    };

    const content = (
        <div className="flex flex-row gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors w-full group">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Icon className="size-5" />
            </div>
            <div className="flex flex-col items-start justify-center">
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</span>
                {description && <span className="text-xs text-slate-500">{description}</span>}
            </div>
        </div>
    );

    if (isExternal) {
        return (
            <NavigationMenuLink asChild>
                <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className={cn('block select-none no-underline', className)} {...props}>
                    {content}
                </a>
            </NavigationMenuLink>
        )
    }

    return (
        <NavigationMenuLink asChild>
            <Link to={href} onClick={handleLinkClick} className={cn('block select-none no-underline', className)} {...props}>
                {content}
            </Link>
        </NavigationMenuLink>
    );
}

function MobileListItem({ title, href, icon: Icon, setOpen, isExternal, onClick }: any) {
    const handleLinkClick = (e: any) => {
        if (onClick) onClick(e, href);
        setOpen(false);
    };

    const content = (
        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="size-5" />
            </div>
            <span className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">{title}</span>
        </div>
    );

    if (isExternal) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
                {content}
            </a>
        )
    }

    return (
        <Link to={href} onClick={handleLinkClick}>
            {content}
        </Link>
    )
}

const productLinks: LinkItem[] = [
    {
        title: 'Templates',
        href: '/templates',
        description: 'Professional ATS-friendly resume templates',
        icon: Layout,
    },
    {
        title: 'AI Resume Builder',
        href: '/build',
        description: 'Create your perfect resume in minutes',
        icon: FileStack,
    },
    {
        title: 'Smart Tools',
        href: '/#features',
        description: 'Learn how to maximize your job search',
        icon: BarChart,
    }
];

const resourceLinks: LinkItem[] = [
    {
        title: 'Job Portal',
        href: 'https://www.persevex.com/job-portal',
        description: 'Explore opportunities with top employers',
        icon: Briefcase,
        isExternal: true
    },
    {
        title: 'Support',
        href: '/#support',
        description: 'Get help and answers',
        icon: LifeBuoy,
    },
    {
        title: 'FAQ',
        href: '/#faq',
        description: 'Frequently asked questions',
        icon: MessageSquare,
    }
];

function useScroll(threshold: number) {
    const [scrolled, setScrolled] = React.useState(false);

    const onScroll = React.useCallback(() => {
        setScrolled(window.scrollY > threshold);
    }, [threshold]);

    React.useEffect(() => {
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [onScroll]);

    React.useEffect(() => {
        onScroll();
    }, [onScroll]);

    return scrolled;
}
