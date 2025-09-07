import React, { useState, useEffect } from 'react';
import { Plus, Users, Package, BarChart3, Settings, Upload } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  featuredProducts: number;
  productsByCategory: { _id: string; count: number; }[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const TabButton: React.FC<{ id: string; icon: React.ReactNode; label: string; }> = ({ id, icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      data-testid={`tab-${id}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = 
    ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900" data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>
            {value}
          </p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">KAMIO Admin Panel</h1>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <TabButton id="dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <TabButton id="products" icon={<Package size={18} />} label="Products" />
          <TabButton id="users" icon={<Users size={18} />} label="Users" />
          <TabButton id="payments" icon={<Settings size={18} />} label="Payments" />
        </div>

        {activeTab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Products"
                value={stats.totalProducts}
                icon={<Package size={24} />}
                color="border-blue-500"
              />
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={<Users size={24} />}
                color="border-green-500"
              />
              <StatCard
                title="Featured Products"
                value={stats.featuredProducts}
                icon={<BarChart3 size={24} />}
                color="border-yellow-500"
              />
              <StatCard
                title="Categories"
                value={stats.productsByCategory.length}
                icon={<Package size={24} />}
                color="border-purple-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
              <div className="space-y-3">
                {stats.productsByCategory.map((category) => (
                  <div key={category._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 capitalize">{category._id}</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {category.count} products
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <ProductManagement />
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}

        {activeTab === 'payments' && (
          <PaymentManagement />
        )}
      </div>
    </div>
  );
};

// Placeholder components - will be filled in next
const ProductManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        data-testid="add-product-button"
      >
        <Plus size={18} />
        Add Product
      </button>
    </div>
    <div className="text-center py-12 text-gray-500">
      <Package size={48} className="mx-auto mb-4 opacity-50" />
      <p>Product management interface will be loaded here</p>
    </div>
  </div>
);

const UserManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management</h2>
    <div className="text-center py-12 text-gray-500">
      <Users size={48} className="mx-auto mb-4 opacity-50" />
      <p>User management interface will be loaded here</p>
    </div>
  </div>
);

const PaymentManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Gateway Configuration</h2>
    <div className="text-center py-12 text-gray-500">
      <Settings size={48} className="mx-auto mb-4 opacity-50" />
      <p>Payment configuration interface will be loaded here</p>
    </div>
  </div>
);

export default AdminDashboard;