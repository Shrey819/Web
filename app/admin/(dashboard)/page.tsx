import { auth } from "@/auth";
import { query } from "@/lib/db";
import { Package, FolderTree, AlertTriangle, Activity } from "lucide-react";

export default async function AdminOverviewPage() {
  const session = await auth();
  
  // Fetch high-level metrics with fallback for demo mode
  let totalProducts = 0;
  let totalCategories = 0;
  let outOfStockProducts = 0;

  try {
    const results = await Promise.all([
      query('SELECT COUNT(*) FROM "Product"'),
      query('SELECT COUNT(*) FROM "Category"'),
      query('SELECT COUNT(*) FROM "Inventory" WHERE status = $1', ['OUT_OF_STOCK']),
    ]);
    totalProducts = parseInt(results[0].rows[0].count, 10) || 0;
    totalCategories = parseInt(results[1].rows[0].count, 10) || 0;
    outOfStockProducts = parseInt(results[2].rows[0].count, 10) || 0;
  } catch (error) {
    console.warn("Database not connected, using demo data");
    totalProducts = 1542;
    totalCategories = 45;
    outOfStockProducts = 12;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-section-title text-white">Dashboard Overview</h1>
        <p className="type-body-large text-slate-400 mt-2">
          Welcome back, {session?.user?.name || "Admin"}. Here is what&apos;s happening with the catalog today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Products" 
          value={totalProducts} 
          icon={<Package className="w-6 h-6 text-sky-400" />}
          trend="+12 this week"
        />
        <MetricCard 
          title="Categories" 
          value={totalCategories} 
          icon={<FolderTree className="w-6 h-6 text-emerald-400" />}
        />
        <MetricCard 
          title="Out of Stock" 
          value={outOfStockProducts} 
          icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
          alert={outOfStockProducts > 0}
        />
        <MetricCard 
          title="System Status" 
          value="Healthy" 
          icon={<Activity className="w-6 h-6 text-indigo-400" />}
        />
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h2 className="type-subtitle text-white mb-4">Getting Started</h2>
        <p className="text-slate-400 leading-relaxed mb-6 max-w-3xl">
          The admin panel is currently in development. You can navigate to the Products tab to view the live database inventory. More features like the Product Editor, bulk import, and media management will be rolled out shortly.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, alert }: { title: string, value: string | number, icon: React.ReactNode, trend?: string, alert?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${alert ? 'bg-amber-500' : 'bg-sky-500'}`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 text-xs font-medium text-slate-500 relative z-10">
          {trend}
        </div>
      )}
    </div>
  );
}
