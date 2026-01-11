import React, { useState, useEffect } from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { FiSearch, FiBell, FiUser, FiLogOut, FiHome, FiBarChart2, FiUsers, FiFileText } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { getReports } from '../utils/adminStore';

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCategory, setOpenCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bellCount, setBellCount] = useState(0);
  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const path =
      q.includes('log') || q.includes('system') ? '/admin/system-logs' :
      q.includes('analytic') || q.includes('metric') || q.includes('stat') ? '/admin/analytics' :
      q.includes('market') ? '/admin/marketplace-moderation' :
      q.includes('report') || q.includes('content') ? '/admin/reported-content' :
      '/admin/users';
    const url = `${path}?query=${encodeURIComponent(searchQuery.trim())}`;
    navigate(url);
  };
  const logout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/login', { replace: true });
  };
  useEffect(() => {
    const load = async () => {
      try {
        const reports = await getReports();
        setBellCount(reports.filter(r => r.status !== 'resolved').length);
      } catch (e) {
        setBellCount(0);
      }
    };
    load();
    window.addEventListener('reportUpdate', load);
    return () => window.removeEventListener('reportUpdate', load);
  }, []);

  const navCategories = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FiHome />, subnav: [] },
    { name: 'User Management', path: '/admin/users', icon: <FiUsers />, subnav: [] },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: <FiBarChart2 />,
      subnav: [
        { name: 'System Logs', path: '/admin/system-logs', icon: <FiFileText /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <FiBarChart2 /> },
      ],
    },
  ];

  const isActive = (path, subnav = []) => {
    if (location.pathname.startsWith(path)) return true;
    return subnav.some((s) => location.pathname.startsWith(s.path));
  };

  return (
    <header className="sticky top-0 bg-white z-50">
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
            <div
              className="flex-shrink-0 flex items-center gap-2 text-gray-900 font-bold text-xl cursor-pointer"
              onClick={() => navigate('/admin/dashboard')}
            >
              <FaShieldAlt className="text-purple-600 text-2xl" />
              <span className="text-gray-800 hidden sm:inline">PAWMATE Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
            <div className="relative hidden sm:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-1.5 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
              />
            </div>
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Notifications (Coming Soon)"
            >
              <FiBell size={20} />
              {bellCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
                  {bellCount}
                </span>
              )}
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer bg-purple-100 flex items-center justify-center text-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FiUser />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin/profile');
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser className="mr-3" /> Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* NAVIGATION BAR */}
      <div className="bg-white border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-center">
          <nav className="flex gap-8 text-sm font-medium text-gray-700">

            {navCategories.map((item, idx) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.subnav?.length && setOpenCategory(idx)}
                onMouseLeave={() => setOpenCategory(null)}
              >
                {/* MAIN NAV BUTTON */}
                <button
                  onClick={() => !item.subnav?.length && navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 ${
                    isActive(item.path, item.subnav)
                      ? 'text-purple-600 font-semibold'
                      : 'hover:text-purple-600'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </button>

                {/* DROPDOWN MENU */}
                {item.subnav?.length > 0 && openCategory === idx && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 shadow-lg rounded-md z-50"
                    onMouseEnter={() => setOpenCategory(idx)}
                    onMouseLeave={() => setOpenCategory(null)}
                  >
                    <ul className="py-2">
                      {item.subnav.map((sub) => {
                        const isActive = sub.path && location.pathname.startsWith(sub.path);
                        return (
                          <li key={sub.name}>
                            <button
                              onClick={() => {
                                if (sub.path) {
                                  navigate(sub.path);
                                }
                                setOpenCategory(null);
                              }}
                              className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? 'text-purple-600 font-semibold bg-purple-50 border-l-4 border-purple-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {sub.icon ? (
                                <span 
                                  className="mr-3 text-base flex-shrink-0"
                                  style={{ 
                                    color: isActive ? '#9333ea' : '#6b7280' 
                                  }}
                                >
                                  {sub.icon}
                                </span>
                              ) : (
                                <span className="mr-3 w-5 flex-shrink-0"></span>
                              )}
                              <span>{sub.name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}

          </nav>
        </div>
      </div>
    </header>
  );
}
