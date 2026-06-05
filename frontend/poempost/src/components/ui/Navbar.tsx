'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Plus, Compass, Home, LogOut } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  userEmail?: string;
  userPhoto?: string;
  onLogout?: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/create', label: 'Create', icon: Plus },
  { path: '/explore', label: 'Explore', icon: Compass },
];

const pageMeta: Record<string, { title: string; subtitle: string; gradient: string; icon: React.ElementType }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview & Analytics',
    gradient: 'from-blue-500 to-blue-600',
    icon: BarChart3,
  },
  '/create': {
    title: 'Create',
    subtitle: 'Build Something New',
    gradient: 'from-green-500 to-green-600',
    icon: Plus,
  },
  '/explore': {
    title: 'Explore',
    subtitle: 'Discover Content',
    gradient: 'from-purple-500 to-purple-600',
    icon: Compass,
  },
};

const Navbar: React.FC<NavbarProps> = ({
  userEmail = 'user@example.com',
  userPhoto = '',
  onLogout,
}) => {
  const pathname = usePathname();
  const currentPage = pageMeta[pathname] ?? {
    title: 'App',
    subtitle: 'Welcome Back',
    gradient: 'from-gray-500 to-gray-600',
    icon: Home,
  };
  const CurrentIcon = currentPage.icon;
  const avatarInitial = (userEmail || 'U').charAt(0).toUpperCase();

  const isActive = (path: string): boolean => pathname === path;

  return (
    <>
      <motion.nav
        className="fixed left-0 right-0 top-0 z-50 w-full border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur-md md:px-8 md:py-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentPage.gradient} text-white shadow-lg md:h-12 md:w-12`}>
              <CurrentIcon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-white md:text-xl">{currentPage.title}</h1>
              <p className="truncate text-xs text-gray-400">{currentPage.subtitle}</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path} className="block">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                    isActive(path)
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden max-w-48 text-right lg:block">
              <p className="truncate text-sm font-medium text-white">{userEmail}</p>
              <p className="text-xs text-gray-400">Online</p>
            </div>

            {userPhoto ? (
              <Image
                src={userPhoto}
                alt="avatar"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-sm font-bold text-white ring-2 ring-white/20">
                {avatarInitial}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="hidden cursor-pointer rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-all duration-300 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 md:block"
            >
              Logout
            </motion.button>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/85 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-1 text-xs font-medium transition-colors ${
                isActive(path)
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              aria-current={isActive(path) ? 'page' : undefined}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
