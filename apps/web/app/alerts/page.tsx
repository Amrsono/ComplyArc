'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Filter, CheckCircle, ShieldAlert, AlertTriangle, TrendingUp, Activity, Eye, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const typeIcons: Record<string, any> = {
  sanctions_match: ShieldAlert, adverse_media: AlertTriangle,
  risk_change: TrendingUp, pep_match: Eye, monitoring: Activity,
};
const typeLabels: Record<string, string> = {
  sanctions_match: 'Sanctions Match', adverse_media: 'Adverse Media',
  risk_change: 'Risk Change', pep_match: 'PEP Match', monitoring: 'Monitoring',
};

export default function AlertsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterSeverity !== 'all') params.severity = filterSeverity;
      if (filterType !== 'all') params.alert_type = filterType;
      const [data, s] = await Promise.all([
        api.listAlerts(params),
        api.getAlertStats(),
      ]);
      setAlerts(data.items || []);
      setStats(s || {});
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterType]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      success('All alerts marked as read');
      fetchAlerts();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleCreateCase = async (alert: any) => {
    try {
      await api.createCase({
        title: alert.description || `Alert: ${alert.type}`,
        case_type: alert.type,
        priority: alert.severity === 'high' ? 'high' : 'medium',
        client_id: alert.client_id,
        client_name: alert.client,
      });
      success('Case created from alert');
      router.push('/cases');
    } catch (err: any) {
      showError(err.message);
    }
  };

  const timeSince = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="page-header animate-in">
        <div className="page-header-row">
          <div>
            <h2>Alerts Center</h2>
            <p>Real-time compliance alerts and notifications</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filter
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              <CheckCircle size={14} /> Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="glass-card glass-card-sm animate-in" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <select className="input" style={{ width: 'auto' }} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="sanctions_match">Sanctions</option>
            <option value="adverse_media">Adverse Media</option>
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="kpi-grid animate-in animate-in-delay-1" style={{ marginBottom: '20px' }}>
        <div className="kpi-card danger" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Critical</span><div className="kpi-icon"><AlertTriangle size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-high)' }}>{stats.high || 0}</div>
        </div>
        <div className="kpi-card warning" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Medium</span><div className="kpi-icon"><Bell size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-medium)' }}>{stats.medium || 0}</div>
        </div>
        <div className="kpi-card success" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Low</span><div className="kpi-icon"><Activity size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px', color: 'var(--risk-low)' }}>{stats.low || 0}</div>
        </div>
        <div className="kpi-card info" style={{ padding: '14px 18px' }}>
          <div className="kpi-header"><span className="kpi-label">Total</span><div className="kpi-icon"><Eye size={18} /></div></div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{stats.total || 0}</div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        </div>
      ) : (
        <div className="glass-card animate-in animate-in-delay-2" style={{ padding: '8px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No alerts found</div>
          ) : alerts.map((alert) => {
            const Icon = typeIcons[alert.type] || Bell;
            return (
              <div key={alert.id} style={{
                display: 'flex', gap: '14px', padding: '16px 14px',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                transition: 'all 0.2s', background: alert.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                borderLeft: `3px solid ${alert.severity === 'high' ? 'var(--risk-high)' : alert.severity === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)'}`,
                marginBottom: '4px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: alert.severity === 'high' ? 'var(--risk-high-bg)' : alert.severity === 'medium' ? 'var(--risk-medium-bg)' : 'var(--risk-low-bg)',
                }}>
                  <Icon size={18} color={alert.severity === 'high' ? 'var(--risk-high)' : alert.severity === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${alert.severity}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {typeLabels[alert.type] || alert.type}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{alert.client}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{timeSince(alert.created_at)}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.description}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {alert.client_id && (
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/clients/${alert.client_id}`)}>View Client</button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCreateCase(alert)}>
                      <ShieldAlert size={12} /> Create Case
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
