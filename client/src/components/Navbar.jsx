import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FileText, LogOut } from 'lucide-react';
import useStore from '../store/useStore';
import { cn } from '../lib/utils';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser } = useStore();
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('/');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (location.pathname !== '/') {
            setActiveSection(location.pathname);
            return;
        }

        const sections = ['home', 'features', 'faq', 'support'];

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (entry.target.id === 'home') {
                        setActiveSection('/');
                    } else {
                        setActiveSection(`/#${entry.target.id}`);
                    }
                }
            });
        };

        const observerOptions = {
            root: null,
            rootMargin: '-30% 0px -50% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        if (window.scrollY === 0) setActiveSection('/');

        return () => observer.disconnect();
    }, [location.pathname]);

    const handleLogout = () => {
        setUser(null);
        navigate('/signin');
    };

    const isAdminPage = location.pathname.startsWith('/admin');
    const isStudentChoice = location.pathname === '/student/choice';
    const isStudentPage = location.pathname.startsWith('/student') ||
        location.pathname === '/job-board' ||
        location.pathname === '/templates' ||
        location.pathname === '/build' ||
        location.pathname === '/upload-resume';
    const isPublicPage = !isAdminPage && !isStudentPage;
    const showStudentNavLinks = isStudentPage && location.pathname !== '/build';

    // Hide navbar on student choice page
    if (isStudentChoice) return null;

    const NavLink = ({ to, children }) => {
        const isActive = activeSection === to;

        const handleClick = (e) => {
            if (location.pathname === '/') {
                if (to.startsWith('/#')) {
                    e.preventDefault();
                    const id = to.replace('/#', '');
                    const element = document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        window.history.pushState(null, '', to);
                        setActiveSection(to);
                    }
                } else if (to === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.history.pushState(null, '', '/');
                    setActiveSection('/');
                }
            }
        };

        return (
            <Link
                to={to}
                onClick={handleClick}
                className={cn(
                    "px-4 py-1.5 rounded-full font-bold text-sm transition-all",
                    isActive
                        ? "bg-indigo-600/10 text-indigo-600"
                        : "text-slate-600 hover:text-indigo-600"
                )}
            >
                {children}
            </Link>
        );
    };

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
            scrolled
                ? "bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-lg py-0"
                : "bg-white border-b border-slate-100 py-0"
        )}>
            <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-4">
                <div className="flex items-center justify-between gap-8">
                    <Link to="/" className="flex items-center no-underline p-0 m-0 flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Persevex"
                            className="h-32 md:h-40 w-auto object-contain"
                        />
                    </Link>

                    <div className="hidden xl:flex items-center gap-2">
                        {isPublicPage ? (
                            <>
                                <NavLink to="/">Home</NavLink>
                                <NavLink to="/#features">Workflow</NavLink>
                                <NavLink to="/#faq">FAQ</NavLink>
                                <NavLink to="/#support">Support</NavLink>
                                <a
                                    href="https://www.persevex.com/job-portal"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-full font-bold text-sm text-slate-600 hover:text-emerald-600 transition-all"
                                >
                                    Job Portal
                                </a>
                            </>
                        ) : isAdminPage ? (
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                                <span className="px-4 py-1 text-[11px] font-black text-indigo-600 uppercase tracking-widest">Admin Control Center</span>
                            </div>
                        ) : showStudentNavLinks ? (
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                <Link
                                    to="/student/choice"
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-sm font-black transition-all",
                                        location.pathname === '/student/choice' || location.pathname === '/student'
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-indigo-600"
                                    )}
                                >
                                    Dashboard
                                </Link>
                                <a
                                    href="https://www.persevex.com/job-portal"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2 rounded-lg text-sm font-black text-slate-600 hover:text-emerald-600 hover:bg-white transition-all"
                                >
                                    Job Board
                                </a>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-black text-slate-900 leading-none">{user?.name || 'User'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{user.role === 'admin' ? 'Administrator' : 'Premium Student'}</p>
                                </div>
                                <div className="relative group">
                                    <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg cursor-pointer hover:shadow-xl transition-all">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="absolute right-0 top-full pt-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
                                        <div className="bg-white border border-slate-200 rounded-2xl p-2 w-48 shadow-2xl">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-rose-50 text-sm font-bold text-rose-600 transition-all"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/signin"
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-xl hover:-translate-y-1 transition-all no-underline"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
