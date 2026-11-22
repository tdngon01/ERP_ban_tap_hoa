'use client';
import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  Lock,
  Smartphone,
  Layers,
  Store,
  ShoppingCart,
  QrCode,
  FileSpreadsheet,
  Settings,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import {
  getUsers,
  getUserRoles,
  createUser,
  updateUser,
  deleteUser,
} from '../api';

interface UsersPermissionsPageProps {
  currentUser?: any;
  onSwitchUser?: (user: any) => void;
}

export const UsersPermissionsPage: React.FC<UsersPermissionsPageProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [rolesData, setRolesData] = useState<{ roles: any[]; permissionsList: any[] }>({
    roles: [],
    permissionsList: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState({
    username: '',
    fullName: '',
    role: 'SALES_REP',
    phone: '',
    email: '',
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, rData] = await Promise.all([getUsers(), getUserRoles()]);
      setUsers(uList);
      setRolesData(rData);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setModalForm({
      username: '',
      fullName: '',
      role: 'SALES_REP',
      phone: '',
      email: '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (u: any) => {
    setEditingUser(u);
    setModalForm({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      phone: u.phone || '',
      email: u.email || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalForm.fullName.trim()) {
      setModalError('Vui lòng nhập họ và tên');
      return;
    }
    if (!editingUser && !modalForm.username.trim()) {
      setModalError('Vui lòng nhập tên đăng nhập');
      return;
    }

    try {
      setSubmitting(true);
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName: modalForm.fullName,
          role: modalForm.role,
          phone: modalForm.phone,
          email: modalForm.email,
        });
      } else {
        await createUser({
          username: modalForm.username,
          fullName: modalForm.fullName,
          role: modalForm.role,
          phone: modalForm.phone,
          email: modalForm.email,
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Lỗi khi lưu tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.username === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên tối cao (admin)');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.fullName}" (${u.username})?`)) {
      return;
    }
    try {
      await deleteUser(u.id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa người dùng');
    }
  };

  const getUserAvatar = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80';
      case 'ACCOUNTANT':
        return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80';
      case 'WAREHOUSE':
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80';
      case 'SUPERVISOR':
        return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80';
      case 'SALES_REP':
        return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80';
      default:
        return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80';
    }
  };

  const getRoleBadge = (roleKey: string) => {
    const roleDef = rolesData.roles.find((r) => r.key === roleKey);
    if (!roleDef) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {roleKey}
        </span>
      );
    }

    const colorClasses: Record<string, string> = {
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      teal: 'bg-teal-100 text-teal-800 border-teal-300',
    };

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
          colorClasses[roleDef.color] || 'bg-slate-100 text-slate-800 border-slate-300'
        }`}
      >
        {roleDef.badge}
      </span>
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{users.length}</div>
            <div className="text-xs text-slate-500 font-medium">Tài khoản người dùng</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{rolesData.roles.length}</div>
            <div className="text-xs text-slate-500 font-medium">Vai trò chuẩn FMCG</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-800 truncate">
              {currentUser?.fullName || 'Quản trị viên'}
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
              <span>Đang hoạt động:</span>
              <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px]">
                {currentUser?.role || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Bảo Mật Hệ Thống
            </div>
            <div className="text-base font-bold mt-1">RBAC FMCG 100%</div>
            <div className="text-xs text-slate-300">Phân quyền đa cấp tự động</div>
          </div>
          <KeyRound className="w-8 h-8 text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                activeSubTab === 'users'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Danh Sách Người Dùng ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                activeSubTab === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ma Trận Phân Quyền (RBAC Matrix)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition flex items-center space-x-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>+ Thêm Tài Khoản</span>
            </button>
          </div>
        </div>

        {/* View 1: Danh sách Người Dùng */}
        {activeSubTab === 'users' && (
          <div className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên nhân viên, username hoặc số điện thoại..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Tất cả vai trò ({users.length})</option>
                {rolesData.roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name} ({r.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tài Khoản / Họ Tên</th>
                    <th className="py-3 px-4">Vai Trò Phân Quyền</th>
                    <th className="py-3 px-4">Liên Hệ</th>
                    <th className="py-3 px-4">Phân Hệ Cho Phép</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Không tìm thấy tài khoản người dùng phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleDef = rolesData.roles.find((r) => r.key === u.role);
                      const isCurrent = currentUser?.username === u.username;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isCurrent ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={getUserAvatar(u.role)}
                                alt={u.fullName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0 shadow-xs"
                              />
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                                  <span>{u.fullName}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                                      Hiện tại
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div>{getRoleBadge(u.role)}</div>
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 max-w-[200px]">
                              {roleDef?.name}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-xs">
                            <div className="text-slate-800 font-medium">{u.phone || '—'}</div>
                            <div className="text-slate-400">{u.email || '—'}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {roleDef?.allowedTabs?.slice(0, 4).map((tab: string) => (
                                <span
                                  key={tab}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {tab}
                                </span>
                              ))}
                              {roleDef?.allowedTabs && roleDef.allowedTabs.length > 4 && (
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                                  +{roleDef.allowedTabs.length - 4} tab
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Hoạt động</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {onSwitchUser && !isCurrent && (
                                <button
                                  onClick={() => onSwitchUser(u)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded border border-amber-300 transition"
                                  title="Đổi nhanh sang tài khoản này để trải nghiệm quyền tương ứng"
                                >
                                  Đổi vai trò
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditModal(u)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {u.username !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Ma Trận Phân Quyền (RBAC Matrix) */}
        {activeSubTab === 'matrix' && (
          <div className="p-6 space-y-6">
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Quy chuẩn phân quyền FMCG:</span> Hệ thống định nghĩa 5
                vai trò cốt lõi cho một Nhà Phân Phối bánh kẹo: <strong>Chủ NPP (ADMIN)</strong>,{' '}
                <strong>Kế Toán (ACCOUNTANT)</strong>, <strong>Thủ Kho (WAREHOUSE)</strong>,{' '}
                <strong>Giám Sát (SUPERVISOR)</strong>, và <strong>Sales Thị Trường (SALES_REP)</strong>.
                Khi bạn chuyển vai trò ở góc trên thanh công cụ, menu và quyền truy cập sẽ tự động khóa
                hoặc hiển thị đúng các chức năng được giao.
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-1/3">Quyền Hạn / Tính Năng Nghiệp Vụ</th>
                    {rolesData.roles.map((r) => (
                      <th key={r.key} className="py-3 px-3 text-center border-l border-slate-800">
                        <div className="text-xs font-bold text-amber-400">{r.badge}</div>
                        <div className="text-[11px] text-slate-300 font-normal">{r.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rolesData.permissionsList.map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-medium text-slate-800 text-xs flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{perm.label}</span>
                      </td>

                      {rolesData.roles.map((r) => {
                        const isAllowed = r.permissions && r.permissions[perm.id];
                        return (
                          <td
                            key={r.key}
                            className={`py-3 px-3 text-center border-l border-slate-200 ${
                              isAllowed ? 'bg-emerald-50/40' : 'bg-slate-50/20'
                            }`}
                          >
                            {isAllowed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Role Responsibility Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {rolesData.roles.map((r) => (
                <div
                  key={r.key}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{r.name}</span>
                    {getRoleBadge(r.key)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">
                      Menu truy cập ({r.allowedTabs?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.allowedTabs?.map((t: string) => (
                        <span
                          key={t}
                          className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Tài Khoản */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingUser ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Đăng Nhập (Username) *
                </label>
                <input
                  type="text"
                  disabled={!!editingUser}
                  placeholder="Ví dụ: nam.sales, lan.ketoan..."
                  value={modalForm.username}
                  onChange={(e) => setModalForm({ ...modalForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-500"
                  required
                />
                {editingUser && (
                  <p className="text-[11px] text-slate-400 mt-1">Username không thể thay đổi sau khi tạo</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và Tên Nhân Viên *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={modalForm.fullName}
                  onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai Trò & Phân Quyền FMCG *
                </label>
                <select
                  value={modalForm.role}
                  onChange={(e) => setModalForm({ ...modalForm, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {rolesData.roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.badge} — {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {rolesData.roles.find((r) => r.key === modalForm.role)?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="09xx..."
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@anphat.vn"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-lg transition shadow-sm"
                >
                  {submitting ? 'Đang lưu...' : editingUser ? 'Cập Nhật' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersPermissionsPage;
