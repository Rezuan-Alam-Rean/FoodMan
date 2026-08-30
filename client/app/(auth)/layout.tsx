// dedicated authentication layout
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="px-4 py-4 max-w-md mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to FoodMan</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>
    </div>
  );
}
