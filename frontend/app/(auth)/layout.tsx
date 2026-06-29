import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper dark:bg-navy-950">
      {/* Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy-800 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/10" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-gold-400/5" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 font-display font-bold text-navy-900">
            V
          </div>
          <span className="font-display text-lg font-semibold">Vendor MGMT</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            Procurement, organized like a ledger — not a spreadsheet.
          </h1>
          <p className="mt-4 text-sm text-navy-200">
            Manage vendors, route quotation requests, and compare bids side-by-side with automatic
            best-value detection — all from one centralized platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-navy-300">
          <ShieldCheck className="h-4 w-4 text-gold-400" />
          Enterprise-grade security · JWT auth · Role-based access control
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
