import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaBell, FaPaw, FaUserMd, FaUsers, FaChartLine, 
  FaExclamationTriangle, FaCheckCircle, FaCog, 
  FaUserShield, FaShoppingBag, FaArrowRight
} from 'react-icons/fa'
import { getPendingUsers, updateUserStatus, getUsers } from '../../utils/userStore'
import { getListings, updateListingStatus } from '../../utils/marketplaceStore'
import { getActivities, getReports, resolveReport, getAnalytics, getQuickStats, addActivity } from '../../utils/adminStore'

// 1. Admin Navbar (Note: This is not used, AdminNavbar.jsx is the actual navbar)
export function AdminNavbar() {
  const navigate = useNavigate();
  
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <FaPaw className="text-blue-600 text-2xl" />
        <span className="text-xl font-bold text-gray-800">PetCare Pro <span className="text-xs font-normal text-gray-500 ml-1">Admin Portal</span></span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 border-b-2 border-blue-600 pb-5 -mb-5">Dashboard</button>
        <button onClick={() => navigate('/admin/users')} className="hover:text-blue-600 transition">Users</button>
        <button onClick={() => navigate('/admin/reported-content')} className="hover:text-blue-600 transition">Content</button>
        <button onClick={() => navigate('/admin/marketplace-moderation')} className="hover:text-blue-600 transition">Marketplace</button>
        <button onClick={() => navigate('/admin/analytics')} className="hover:text-blue-600 transition">Analytics</button>
        <button onClick={() => navigate('/admin/profile')} className="hover:text-blue-600 transition">Settings</button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-gray-50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none w-64"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full">
          <FaBell />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] text-white flex items-center justify-center font-bold">12</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt="Admin" className="w-full h-full object-cover" />
        </div>
      </div>
    </nav>
  )
}

// 2. System Overview Header
export function SystemOverview() {
  const [stats, setStats] = useState({
    active: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const allUsers = await getUsers();
        const activeUsersCount = allUsers.filter(u => u.status === 'active').length;
        setStats({
          active: activeUsersCount
        });
      } catch (error) {
        console.error("Error fetching admin stats", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-6 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Monday, December 16, 2024 • 9:45 AM</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-gray-400 text-xs">Active Users</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="font-bold text-gray-800 text-lg">{stats.active}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. Pending Approvals List
export function PendingApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('All');

  const fetchApprovals = async () => {
    try {
        const data = await getPendingUsers();
        setApprovals(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (user) => {
    try {
        await updateUserStatus(user._id || user.id, 'active');
        fetchApprovals();
    } catch (e) { console.error(e); }
  };

  const filteredApprovals = filter === 'All' 
    ? approvals 
    : approvals.filter(u => u.role === (filter === 'Veterinarians' ? 'Veterinarian' : 'Pet Owner'));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Pending Approvals</h3>
        <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
          <button 
            onClick={() => setFilter('All')}
            className={`${filter === 'All' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'} px-3 py-1 rounded-md transition-all`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('Veterinarians')}
            className={`${filter === 'Veterinarians' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'} px-3 py-1 rounded-md transition-all`}
          >
            Veterinarians
          </button>
          <button 
            onClick={() => setFilter('Pet Owners')}
            className={`${filter === 'Pet Owners' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'} px-3 py-1 rounded-md transition-all`}
          >
            Pet Owners
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {filteredApprovals.length === 0 && <p className="text-center text-gray-400 py-4">No pending approvals.</p>}
        {filteredApprovals.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.role}</p>
                <p className="text-[10px] text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleApprove(item)}
                className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition"
              >
                Approve
              </button>
              <button className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Review</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 4. System Analytics Chart Placeholder
export function SystemAnalytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    getAnalytics().then(setData).catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg text-gray-800 mb-6">System Analytics</h3>
      <div className="h-48 flex items-end justify-between gap-2 px-4 border-b border-gray-100 pb-4">
        {(() => {
          const maxTotal = Math.max(1, ...data.map(d => d.total || 0));
          return data.map((d, i) => {
            const hTotal = Math.round(((d.total || 0) / maxTotal) * 100);
            const hOwners = Math.round(((d.owners || 0) / maxTotal) * 100);
            const hVets = Math.round(((d.vets || 0) / maxTotal) * 100);
            return (
              <div key={i} className="w-full flex flex-col justify-end gap-1 h-full">
                <div className="w-full bg-purple-200 rounded-t-sm" style={{ height: `${hTotal}%` }}></div>
                <div className="w-full bg-blue-200 rounded-t-sm" style={{ height: `${hOwners}%` }}></div>
                <div className="w-full bg-green-200 rounded-t-sm" style={{ height: `${hVets}%` }}></div>
              </div>
            );
          });
        })()}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
        {data.map((d, i) => (
          <span key={i}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
        ))}
      </div>
      <div className="flex justify-center gap-6 mt-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span> Pet Owners
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span> Veterinarians
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span> Total
        </div>
      </div>
    </div>
  )
}

// 5. Real-time Activity Feed
export function RealTimeActivity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetch = async () => {
        try {
            const data = await getActivities();
            setActivities(data);
        } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  const getIcon = (type) => {
    switch(type) {
        case 'user': return FaUserShield;
        case 'report': return FaExclamationTriangle;
        case 'market': return FaShoppingBag;
        default: return FaCheckCircle;
    }
  };

  return (
    <div className="bg-blue-50 rounded-2xl p-6">
      <h3 className="font-bold text-gray-800 mb-4">Real-time Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 && <p className="text-sm text-gray-500">No recent activity.</p>}
        {activities.slice(0, 5).map((item, idx) => (
          <div key={idx} className="bg-white p-3 rounded-xl shadow-sm flex items-start gap-3">
            <div className={`mt-1 text-${item.color}-500`}>
              {React.createElement(getIcon(item.type))}
            </div>
            <div>
              <p className="text-sm text-gray-800 font-medium leading-tight">{item.text}</p>
              <p className="text-xs text-gray-400 mt-1">{item.time}</p>
            </div>
            <div className={`ml-auto w-2 h-2 rounded-full bg-${item.color}-400 mt-2`}></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 6. Content Moderation
export function ContentModeration() {
  const [flags, setFlags] = useState([]);

  const fetchFlags = async () => {
    try {
        const data = await getReports();
        setFlags(data.filter(r => r.status !== 'resolved'));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleReview = async (id) => {
    try {
        await resolveReport(id);
        fetchFlags();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4 bg-orange-50 p-3 rounded-xl text-orange-700 font-bold">
        <FaExclamationTriangle />
        <h3>Content Moderation Required</h3>
      </div>
      <div className="space-y-4">
        {flags.length === 0 && <p className="text-center text-gray-400 py-4">No content flags.</p>}
        {flags.map((item, idx) => (
          <div key={idx} className="bg-gray-50 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                <img src={item.img} alt="Content" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.reports}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-${item.color}-100 text-${item.color}-600 mt-1 inline-block`}>
                  {item.priority}
                </span>
              </div>
            </div>
            <button 
                onClick={() => handleReview(item.id)}
                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition"
            >
              Review
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// 7. Marketplace Moderation
export function MarketplaceModeration() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = async () => {
        try {
            const listingsData = await getListings();
            const listings = Array.isArray(listingsData) ? listingsData : (listingsData.listings || []);
            setItems(listings.filter(l => l.status === 'pending'));
        } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
        const listingsData = await getListings();
        const listings = Array.isArray(listingsData) ? listingsData : (listingsData.listings || []);
        setItems(listings.filter(l => l.status === 'pending'));
    };
    window.addEventListener('marketplaceUpdate', fetchPending);
    return () => window.removeEventListener('marketplaceUpdate', fetchPending);
  }, []);

  const handleAction = async (id, status) => {
    try {
        await updateListingStatus(id, status);
        const listingsData = await getListings();
        const listings = Array.isArray(listingsData) ? listingsData : (listingsData.listings || []);
        setItems(listings.filter(l => l.status === 'pending'));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">Marketplace Moderation</h3>
        {items.length > 0 && <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>}
      </div>
      {items.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No pending items.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
            {items.map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition">
                <div className="h-24 rounded-lg overflow-hidden mb-3 bg-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                <p className="text-xs text-gray-500 mb-1">{item.seller.name}</p>
                <div className="flex justify-between items-center mb-3">
                <span className="text-blue-600 font-bold text-xs">{item.price}</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{item.category || 'Product'}</span>
                </div>
                <div className="flex gap-2">
                <button 
                    onClick={() => handleAction(item.id, 'active')}
                    className="flex-1 bg-green-500 text-white py-1 rounded-md text-[10px] font-bold hover:bg-green-600"
                >
                    Approve
                </button>
                <button 
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="flex-1 bg-gray-100 text-gray-600 py-1 rounded-md text-[10px] font-bold hover:bg-gray-200"
                >
                    Reject
                </button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  )
}

// 8. Quick Stats & Actions
export function QuickStatsAndActions() {
  const [stats, setStats] = useState({ totalUsers: 0, activeVets: 0, health: 0 });
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      try {
        const s = await getQuickStats();
        setStats({
          totalUsers: s.totalUsers || 0,
          activeVets: s.activeVets || 0,
          health: s.health || 0
        });
      } catch (e) { console.error(e); }
    };
    load();
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-50">
          <FaUsers className="text-blue-500 text-2xl mx-auto mb-2" />
          <h4 className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</h4>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-50">
          <FaUserMd className="text-green-500 text-2xl mx-auto mb-2" />
          <h4 className="text-2xl font-bold text-gray-800">{stats.activeVets}</h4>
          <p className="text-xs text-gray-500">Active Vets</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-gray-50">
          <FaCheckCircle className="text-purple-500 text-2xl mx-auto mb-2" />
          <h4 className="text-2xl font-bold text-gray-800">{stats.health}%</h4>
          <p className="text-xs text-gray-500">System Health</p>
        </div>
      </div>

      {/* Quick Actions List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/admin/profile')}
            className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-lg">
              <FaCog />
            </div>
            <span className="text-xs font-medium text-gray-600">System Settings</span>
          </button>
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 rounded-xl border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
              <FaUsers />
            </div>
            <span className="text-xs font-medium text-gray-600">User Management</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// 9. Admin Footer Stats
export function AdminFooter() {
  const [metrics, setMetrics] = useState({
    approvalRate: 0,
    avgResponseMins: 0,
    pendingReviews: 0,
    resolvedToday: 0,
    uptime: '99.9%'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [stats, reports] = await Promise.all([getQuickStats(), getReports()]);
        const totalReports = reports.length;
        const resolved = reports.filter(r => r.status === 'resolved');
        const today = new Date().toISOString().split('T')[0];
        const resolvedToday = resolved.filter(r => (r.updatedAt || '').split('T')[0] === today).length;
        const approvalRate = totalReports ? Math.round((resolved.length / totalReports) * 100) : 100;
        const pendingReviews = reports.filter(r => r.status !== 'resolved').length;
        const avgResponseMins = Math.min(60, Math.max(5, Math.round(approvalRate / 2)));
        setMetrics({
          approvalRate,
          avgResponseMins,
          pendingReviews,
          resolvedToday,
          uptime: '99.9%'
        });
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white border-t border-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8 text-center md:text-left">
          <div>
            <h4 className="text-xl font-bold text-gray-800">{metrics.approvalRate}%</h4>
            <p className="text-xs text-gray-500">Approval Rate</p>
            <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
              <div className="bg-green-500 h-full rounded-full" style={{ width: `${metrics.approvalRate}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <FaClock className="text-gray-400" />
              <h4 className="font-bold text-gray-800">{metrics.avgResponseMins} mins</h4>
            </div>
            <p className="text-xs text-gray-500">Avg Response Time</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <FaExclamationTriangle className="text-gray-400" />
              <h4 className="font-bold text-gray-800">{metrics.pendingReviews}</h4>
            </div>
            <p className="text-xs text-gray-500">Pending Reviews</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <FaCheckCircle className="text-gray-400" />
              <h4 className="font-bold text-gray-800">{metrics.resolvedToday}</h4>
            </div>
            <p className="text-xs text-gray-500">Resolved Today</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <FaShieldAlt className="text-gray-400" />
              <h4 className="font-bold text-gray-800">{metrics.uptime}</h4>
            </div>
            <p className="text-xs text-gray-500">System Uptime</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-50 text-xs text-gray-400">
          <p>© 2024 PetCare Pro. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <button onClick={() => window.open('/admin/guide', '_blank')} className="hover:text-gray-600">Admin Guide</button>
            <a href="#" className="hover:text-gray-600">System Status</a>
            <a href="#" className="hover:text-gray-600">Security</a>
            <a href="#" className="hover:text-gray-600">Support Portal</a>
          </div>
        </div>
      </div>
    </div>
  )
}
