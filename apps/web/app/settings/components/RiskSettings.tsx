'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function RiskSettings() {
  const { success } = useToast();
  const [saving, setSaving] = useState(false);
  const [riskForm, setRiskForm] = useState({
    highThreshold: '4.0',
    medThreshold: '2.5',
    highConfidence: '85',
    medConfidence: '70',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      success('Risk scoring configuration saved successfully');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Risk Scoring Configuration</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="input-group">
          <label>High Risk Threshold (≥)</label>
          <input
            className="input"
            type="number"
            value={riskForm.highThreshold}
            onChange={(e) => setRiskForm((f) => ({ ...f, highThreshold: e.target.value }))}
            step="0.1"
            min="1"
            max="5"
          />
        </div>
        <div className="input-group">
          <label>Medium Risk Threshold (≥)</label>
          <input
            className="input"
            type="number"
            value={riskForm.medThreshold}
            onChange={(e) => setRiskForm((f) => ({ ...f, medThreshold: e.target.value }))}
            step="0.1"
            min="1"
            max="5"
          />
        </div>
        <div className="input-group">
          <label>Match Confidence — High (≥%)</label>
          <input
            className="input"
            type="number"
            value={riskForm.highConfidence}
            onChange={(e) => setRiskForm((f) => ({ ...f, highConfidence: e.target.value }))}
            min="50"
            max="100"
          />
        </div>
        <div className="input-group">
          <label>Match Confidence — Medium (≥%)</label>
          <input
            className="input"
            type="number"
            value={riskForm.medConfidence}
            onChange={(e) => setRiskForm((f) => ({ ...f, medConfidence: e.target.value }))}
            min="30"
            max="100"
          />
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
          Risk Weight Distribution
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Client Risk (CRR)', weight: 40 },
            { label: 'Geography Risk (GRR)', weight: 20 },
            { label: 'Product Risk (PRR)', weight: 20 },
            { label: 'Interface Risk (IRR)', weight: 20 },
          ].map((w) => (
            <div
              key={w.label}
              style={{
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{w.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-primary)' }}>{w.weight}%</div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
          </>
        ) : (
          'Save Configuration'
        )}
      </button>
    </div>
  );
}
