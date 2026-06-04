'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Plus, Compass, Home } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  userEmail?: string;
  userPhoto?: string;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  userEmail = 'user@example.com',
  userPhoto = '',
  onLogout
}) => {
  const pathname = usePathname();

  const isActive = (path: string): boolean => pathname === path;

  const getPageLogo = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard',
          gradient: 'from-blue-500 to-blue-600',
          icon: <BarChart3 className="w-6 h-6" />
        };
      case '/create':
        return {
          title: 'Create',
          gradient: 'from-green-500 to-green-600',
          icon: <Plus className="w-6 h-6" />
        };
      case '/explore':
        return {
          title: 'Explore',
          gradient: 'from-purple-500 to-purple-600',
          icon: <Compass className="w-6 h-6" />
        };
      default:
        return {
          title: 'App',
          gradient: 'from-gray-500 to-gray-600',
          icon: <Home className="w-6 h-6" />
        };
    }
  };

  const currentPage = getPageLogo();

  const handleLogoutClick = () => {
    console.log('Logout button clicked');
    if (onLogout) onLogout();
  };

  return (
    <motion.nav
      className="w-full px-8 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm fixed top-0 left-0 right-0 z-50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center w-full">

        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentPage.gradient} flex items-center justify-center text-white shadow-lg`}>
            {currentPage.icon}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">{currentPage.title}</h1>
            <p className="text-xs text-gray-400">
              {pathname === '/dashboard' ? 'Overview & Analytics' :
                pathname === '/create' ? 'Build Something New' :
                pathname === '/explore' ? 'Discover Content' :
                'Welcome Back'}
            </p>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex items-center space-x-6">
          {[
            { path: '/dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            { path: '/create', label: 'Create', icon: <Plus className="w-4 h-4" /> },
            { path: '/explore', label: 'Explore', icon: <Compass className="w-4 h-4" /> }
          ].map(({ path, label, icon }) => {
            return (
              <Link
                key={path}
                href={path}
                className="block"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
                    isActive(path)
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Right: User Info and Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-white font-medium">{userEmail}</p>
            <p className="text-xs text-gray-400">Online</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="cursor-pointer"
          >
            {userPhoto ? (
              <Image
                src={userPhoto}
                alt="avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full ring-2 ring-white/20 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20">
                {userEmail.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoutClick}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 cursor-pointer"
          >
            Logout
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;