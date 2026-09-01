// admin user deep-dive details page route
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AdminUserDetailsView } from '@/components/admin/AdminUserDetailsView';

export default function AdminUserDetailsPage() {
  const params = useParams();
  const userId = params?.id as string;

  return <AdminUserDetailsView userId={userId} />;
}
