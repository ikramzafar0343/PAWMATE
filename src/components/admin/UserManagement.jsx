import React, { useState, useEffect } from 'react';
import { FiMoreVertical, FiCheck, FiX, FiShield } from 'react-icons/fi';
import { getUsers, updateUserStatus } from '../../utils/userStore';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Users');

  const fetchUsers = async (currentFilter = filter) => {
    try {
      const params = {};
      if (currentFilter === 'Veterinarians') params.role = 'vet';
      else if (currentFilter === 'Pet Owners') params.role = 'pet-owner';
      else if (currentFilter === 'Suspended') params.status = 'suspended';
      const data = await getUsers(params);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(filter);
    const handleUserUpdate = () => fetchUsers(filter);
    window.addEventListener('userUpdate', handleUserUpdate);
    return () => window.removeEventListener('userUpdate', handleUserUpdate);
  }, [filter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
        await updateUserStatus(id, newStatus);
        fetchUsers(filter);
    } catch (error) {
        console.error(error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'All Users') return true;
    if (filter === 'Veterinarians') return user.role === 'vet';
    if (filter === 'Pet Owners') return user.role === 'pet-owner';
    if (filter === 'Suspended') return user.status === 'suspended';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {['All Users', 'Veterinarians', 'Pet Owners', 'Suspended'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-gray-900 text-white' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* User List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
        ) : (
            users.map((user) => (
            <div key={user._id || user.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {user.role === 'vet' ? <FiShield className="text-blue-600" /> : <span className="font-bold text-gray-500">{(user.name || 'U')[0]}</span>}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">{user.name || 'Unknown User'}</h4>
                    <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      user.role === 'vet' ? 'bg-blue-100 text-blue-700' : 
                      user.role === 'pet-owner' ? 'bg-green-100 text-green-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role === 'vet' ? 'Veterinarian' : user.role === 'pet-owner' ? 'Pet Owner' : user.role || 'User'}
                    </span>
                    <span className="text-gray-400">• {user.email || 'No email'}</span>
                    {user.status === 'suspended' && <span className="text-red-600 font-bold uppercase text-[10px]">Suspended</span>}
                    {user.status === 'pending' && <span className="text-orange-600 font-bold uppercase text-[10px]">Pending</span>}
                    </div>
                </div>
                </div>
                
                <div className="flex items-center gap-2">
                {user.status === 'pending' && user.role !== 'admin' && (
                    <button 
                        onClick={() => handleStatusChange(user._id || user.id, 'active')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                        title="Approve User"
                    >
                    <FiCheck /> Approve
                    </button>
                )}
                {user.status === 'active' && user.role !== 'admin' ? (
                    <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to suspend ${user.name}?`)) {
                            handleStatusChange(user._id || user.id, 'suspended');
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Suspend User"
                    >
                    <FiX />
                    </button>
                ) : user.status === 'suspended' && user.role !== 'admin' && (
                    <button 
                        onClick={() => handleStatusChange(user._id || user.id, 'active')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                        title="Activate User"
                    >
                    <FiCheck />
                    </button>
                )}
                {user.role !== 'admin' && (
                <button 
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete ${user.name || 'this user'}? This action cannot be undone.`)) {
                      try {
                        const { deleteUser } = await import('../../utils/userStore');
                        await deleteUser(user._id || user.id);
                        fetchUsers(filter);
                      } catch (e) {
                        console.error('Error deleting user:', e);
                        alert('Failed to delete user');
                      }
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete User"
                >
                    <FiMoreVertical />
                </button>
                )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default UserManagement;
