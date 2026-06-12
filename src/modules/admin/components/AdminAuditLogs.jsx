import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { getAdminAuditLogs } from '../services/adminService';

const nice = (value) => String(value || 'N/A').replaceAll('_', ' ');
const dateTime = (value) => value ? new Date(value).toLocaleString() : 'N/A';

export default function AdminAuditLogs() {
  const { themeClasses } = useAdminTheme();
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, number: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      setError('');
      const res = await getAdminAuditLogs(query, page, 50);
      const body = res.data || {};
      setLogs(Array.isArray(body.content) ? body.content : Array.isArray(body) ? body : []);
      setPageInfo({
        totalElements: body.totalElements || 0,
        number: body.number || 0,
        totalPages: body.totalPages || 0,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load admin audit logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <AdminLayout
      pageTitle="Admin Audit Logs"
      pageSubtitle="Immutable record of sensitive admin actions across users, sellers, products, orders, refunds, and finance."
      headerActions={
        <button
          onClick={() => loadLogs(pageInfo.number)}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black uppercase transition-colors ${themeClasses.button.outline} disabled:opacity-60`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
        <div className={`rounded-lg border shadow-sm p-5 transition-colors ${themeClasses.card}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${themeClasses.status.success}`}>
                <ShieldCheck size={21} />
              </span>
              <div>
                <p className={`text-sm font-black transition-colors ${themeClasses.text.primary}`}>Action Traceability</p>
                <p className={`text-xs font-semibold transition-colors ${themeClasses.text.tertiary}`}>{pageInfo.totalElements} audit entries recorded</p>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                loadLogs(0);
              }}
              className="flex min-w-0 gap-2 md:w-[420px]"
            >
              <div className="relative flex-1">
                <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${themeClasses.text.tertiary}`} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search action, target, or admin..."
                  className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-300 transition-colors ${themeClasses.bg.secondary} ${themeClasses.border.primary} ${themeClasses.text.primary}`}
                />
              </div>
              <button className={`rounded-lg px-4 py-2 text-xs font-black uppercase transition-colors ${themeClasses.button.primary}`}>
                Search
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${themeClasses.status.danger}`}>
            {error}
          </div>
        )}

        <div className={`overflow-hidden rounded-lg border shadow-sm transition-colors ${themeClasses.card}`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y transition-colors ${themeClasses.border.primary}`}>
              <thead className={`transition-colors ${themeClasses.bg.secondary}`}>
                <tr>
                  {['Time', 'Admin', 'Action', 'Target', 'Summary', 'Metadata'].map((head) => (
                    <th key={head} className={`px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors ${themeClasses.text.tertiary}`}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${themeClasses.border.primary}`}>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`px-4 py-10 text-center text-sm font-semibold transition-colors ${themeClasses.text.tertiary}`}>
                      {loading ? 'Loading audit logs...' : 'No audit logs found.'}
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className={`transition-colors hover:${themeClasses.bg.secondary}`}>
                    <td className={`whitespace-nowrap px-4 py-3 text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>{dateTime(log.createdAt)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-xs font-black transition-colors ${themeClasses.text.primary}`}>{log.actorUsername || 'SYSTEM'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${themeClasses.status.success}`}>
                        {nice(log.action)}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>
                      {nice(log.targetType)} #{log.targetId || 'N/A'}
                    </td>
                    <td className={`min-w-[260px] px-4 py-3 text-xs font-semibold transition-colors ${themeClasses.text.secondary}`}>{log.summary}</td>
                    <td className={`max-w-[320px] truncate px-4 py-3 font-mono text-[10px] transition-colors ${themeClasses.text.tertiary}`}>{log.metadata || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`flex items-center justify-between border-t px-4 py-3 text-xs font-bold transition-colors ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}>
            <span>Page {pageInfo.number + 1} of {Math.max(pageInfo.totalPages, 1)}</span>
            <div className="flex gap-2">
              <button
                disabled={loading || pageInfo.number <= 0}
                onClick={() => loadLogs(pageInfo.number - 1)}
                className={`rounded-md border px-3 py-1.5 transition-colors disabled:opacity-50 ${themeClasses.button.outline}`}
              >
                Previous
              </button>
              <button
                disabled={loading || pageInfo.number + 1 >= pageInfo.totalPages}
                onClick={() => loadLogs(pageInfo.number + 1)}
                className={`rounded-md border px-3 py-1.5 transition-colors disabled:opacity-50 ${themeClasses.button.outline}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
