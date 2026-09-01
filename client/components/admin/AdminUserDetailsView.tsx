// unified user details full-page view for admin console
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Bike,
  Store,
  MapPin,
  ShoppingBag,
  Package,
  CreditCard,
  Percent,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
  Edit,
} from 'lucide-react';
import { useAdminUserDetailsQuery } from '@/hooks/queries/use-admin-queries';
import { DisbursePayoutModal } from './DisbursePayoutModal';
import { EditUserModal } from './EditUserModal';
import { formatBDT } from '@/lib/utils';

interface AdminUserDetailsViewProps {
  userId: string;
}

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-700',
  PREPARING: 'bg-amber-100 text-amber-800',
  LOOKING_FOR_RIDER: 'bg-blue-100 text-blue-800',
  RIDER_ACCEPTED: 'bg-indigo-100 text-indigo-800',
  READY_FOR_PICKUP: 'bg-violet-100 text-violet-800',
  PICKED_UP: 'bg-orange-100 text-orange-800',
  PENDING_PAYMENT: 'bg-slate-100 text-slate-600',
};

const REMITTANCE_STATUS_STYLES: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function formatStatus(status: string): string {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export function AdminUserDetailsView({ userId }: AdminUserDetailsViewProps) {
  const [riderTab, setRiderTab] = useState<'trips' | 'remittances'>('trips');
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useAdminUserDetailsQuery(userId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">loading user details...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-900">User Not Found</h3>
          <p className="text-xs text-slate-500 font-medium">the requested user record could not be loaded</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Back to Users
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const customer = data.customer;
  const rider = data.rider;
  const restaurant = data.restaurant;
  const user = data.user || customer || rider?.user_id || restaurant?.owner_id;
  const role = user?.role || (customer ? 'CUSTOMER' : rider ? 'RIDER' : restaurant ? 'RESTAURANT_OWNER' : 'USER');
  const wallet = data.wallet;
  const stats = data.stats;
  const orders = data.orders || data.deliveries || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
          <span>Back to Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          {wallet && (wallet.current_balance || 0) > 0 && (
            <button
              type="button"
              onClick={() => setIsPayoutOpen(true)}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Disburse Payout ({formatBDT(wallet.current_balance)})</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-md">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-black text-slate-900">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                  {role}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${user?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {user?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{user?.phone_number} {user?.email ? `• ${user.email}` : ''}</p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-400 font-medium">
            <p>Member since {formatDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {role === 'CUSTOMER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Orders', value: stats?.total_orders || 0, color: 'text-slate-900' },
              { label: 'Total Spent', value: formatBDT(stats?.total_spent || 0), color: 'text-rose-600' },
              { label: 'Food Subtotal', value: formatBDT(stats?.total_food_subtotal || 0), color: 'text-slate-700' },
              { label: 'Delivery Fees', value: formatBDT(stats?.total_delivery_fees || 0), color: 'text-slate-700' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {data.addresses && data.addresses.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-black text-slate-900">Saved Addresses ({data.addresses.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.addresses.map((addr: any) => (
                  <div
                    key={addr._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
                  >
                    <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-700 text-[10px] font-black uppercase shrink-0 mt-0.5">
                      {addr.address_label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {addr.detailed_address}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {addr.zone_id?.name}{addr.subzone_id?.name ? `, ${addr.subzone_id.name}` : ''}
                      </p>
                    </div>
                    {addr.is_default && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-black text-slate-900">Order History ({orders.length})</h2>
            </div>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div
                    key={order._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs font-black text-slate-900">{order.order_number}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {order.restaurant_id?.name || 'Restaurant'} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {formatStatus(order.status)}
                        </span>
                        <span className="text-xs font-black text-slate-900">{formatBDT(order.grand_total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">no orders placed yet</p>
            )}
          </div>
        </div>
      )}

      {role === 'RIDER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Trips', value: stats?.total_orders_handled ?? 0, color: 'text-slate-900' },
              { label: 'Completed', value: stats?.completed_deliveries ?? 0, color: 'text-emerald-600' },
              { label: 'Fees Earned', value: formatBDT(stats?.total_delivery_fees_earned ?? 0), color: 'text-blue-600' },
              { label: 'Wallet Balance', value: formatBDT(wallet?.current_balance ?? 0), color: 'text-rose-600' },
              { label: 'Lifetime Earned', value: formatBDT(wallet?.lifetime_earnings ?? 0), color: 'text-slate-700' },
              { label: 'Total Settled', value: formatBDT(wallet?.total_settled_by_admin ?? 0), color: 'text-slate-700' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-black text-slate-900">Courier Profile</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</p>
                <p className="font-bold text-slate-900 capitalize mt-0.5">{rider?.vehicle_type?.toLowerCase() || 'N/A'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Status</p>
                <p className={`font-bold mt-0.5 ${rider?.is_online ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {rider?.is_online ? 'Online' : 'Offline'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Cash In Hand Limit</p>
                <p className="font-bold text-slate-900 mt-0.5">{formatBDT(rider?.cash_in_hand_limit || 3000)}</p>
              </div>
              {rider?.assigned_zones && rider.assigned_zones.length > 0 && (
                <div className="col-span-2 sm:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Operational Zones</p>
                  <div className="flex flex-wrap gap-2">
                    {rider.assigned_zones.map((z: any) => (
                      <span key={z._id} className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {z.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex rounded-2xl overflow-hidden border border-slate-200 max-w-xs">
              {(['trips', 'remittances'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRiderTab(tab)}
                  className={`flex-1 py-2 text-xs font-black capitalize transition cursor-pointer ${
                    riderTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {riderTab === 'trips' ? (
              orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <div key={order._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900">{order.order_number}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {order.restaurant_id?.name || 'Restaurant'} → {order.delivery_zone_id?.name || 'Zone'}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="font-black text-blue-600">+{formatBDT(order.delivery_fee)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold text-center py-6">no trips recorded yet</p>
              )
            ) : (
              data.remittances && data.remittances.length > 0 ? (
                <div className="space-y-3">
                  {data.remittances.map((rem: any) => (
                    <div key={rem._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900">{formatBDT(rem.amount)}</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${REMITTANCE_STATUS_STYLES[rem.status] || 'bg-slate-100 text-slate-600'}`}>
                          {rem.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium space-y-0.5">
                        <p>Ref: {rem.transaction_reference}</p>
                        <p>Via {rem.payment_method} • {rem.sender_account_no} • {formatDate(rem.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-semibold text-center py-6">no remittances recorded yet</p>
              )
            )}
          </div>
        </div>
      )}

      {role === 'RESTAURANT_OWNER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Orders', value: stats?.total_orders_received ?? 0, color: 'text-slate-900' },
              { label: 'Fulfilled', value: stats?.fulfilled_orders ?? 0, color: 'text-emerald-600' },
              { label: 'Gross Sales', value: formatBDT(stats?.gross_food_sales ?? 0), color: 'text-slate-700' },
              { label: 'Commission Paid', value: formatBDT(stats?.commission_deducted ?? 0), color: 'text-amber-600' },
              { label: 'Net Earnings', value: formatBDT(stats?.net_food_earnings ?? 0), color: 'text-rose-600' },
              { label: 'Wallet Balance', value: formatBDT(wallet?.current_balance ?? 0), color: 'text-blue-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-black text-slate-900">Store Profile</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Store Status</p>
                <p className={`font-bold mt-0.5 ${restaurant?.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {restaurant?.is_open ? 'Open' : 'Closed'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Commission Rate</p>
                <p className="font-bold text-amber-600 mt-0.5">{stats?.commission_rate ?? 10}%</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Zone</p>
                <p className="font-bold text-slate-900 mt-0.5">{restaurant?.zone_id?.name || 'N/A'}</p>
              </div>
              {restaurant?.address && (
                <div className="col-span-2 sm:col-span-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Physical Address</p>
                  <p className="font-bold text-slate-900 mt-0.5 leading-snug">{restaurant.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-black text-slate-900">Received Orders ({orders.length})</h2>
            </div>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-900">{order.order_number}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {order.delivery_zone_id?.name || 'Zone'} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600'}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Food Items</span>
                      <span className="font-black text-slate-900">{formatBDT(order.food_subtotal || order.grand_total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">no orders received yet</p>
            )}
          </div>
        </div>
      )}

      {isPayoutOpen && wallet && (
        <DisbursePayoutModal
          isOpen={isPayoutOpen}
          onClose={() => setIsPayoutOpen(false)}
          recipientUserId={user._id}
          recipientName={user.name}
          recipientRole={role === 'RIDER' ? 'RIDER' : 'RESTAURANT_OWNER'}
          currentBalance={wallet.current_balance || 0}
        />
      )}

      {isEditOpen && (
        <EditUserModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          userData={data}
        />
      )}
    </div>
  );
}
