'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, Pencil, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { SystemSetting } from '@/lib/types';
import api from '@/lib/api';

export function ApiKeysSettings() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
      const initialForm: Record<string, string> = {};
      data.forEach((s) => {
        initialForm[s.key] = s.value || '';
      });
      setFormValues(initialForm);
    } catch {
      showError('Failed to load integration settings');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleStartEdit = (key: string) => {
    setFormValues((prev) => ({ ...prev, [key]: '' }));
    setEditingKey((prev) => ({ ...prev, [key]: true }));
    setShowKey((prev) => ({ ...prev, [key]: false }));
  };

  const handleCancelEdit = (key: string, originalMasked: string) => {
    setFormValues((prev) => ({ ...prev, [key]: originalMasked }));
    setEditingKey((prev) => ({ ...prev, [key]: false }));
    setShowKey((prev) => ({ ...prev, [key]: false }));
  };

  const handleSaveKey = async (key: string) => {
    const newVal = formValues[key] || '';
    if (!newVal.trim()) {
      showError('Please enter a valid API key before saving.');
      return;
    }
    setSaving(true);
    try {
      await api.updateSystemSetting(key, newVal);
      success('API key updated successfully');
      setEditingKey((prev) => ({ ...prev, [key]: false }));
      setShowKey((prev) => ({ ...prev, [key]: false }));
      await loadSettings();
    } catch {
      showError('Failed to update API key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Service API Keys</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Manage API keys and connections for external services powering ComplyArc.
      </p>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2
            size={24}
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: 'var(--accent-primary)' }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {settings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No API keys configured.</p>
          ) : (
            settings.map((setting) => {
              const isEditing = editingKey[setting.key] || false;
              const isVisible = showKey[setting.key] || false;
              const label =
                setting.key === 'news_api_key'
                  ? 'News API'
                  : setting.key === 'openai_api_key'
                  ? 'OpenAI API'
                  : setting.key;
              const hasValue = setting.value && setting.value !== '';

              return (
                <div
                  key={setting.key}
                  style={{
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: isEditing ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Key size={14} style={{ color: 'var(--accent-primary)' }} />
                        <h4 style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{label}</h4>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            letterSpacing: '0.05em',
                            background: hasValue ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: hasValue ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {hasValue ? '● CONFIGURED' : '● NOT SET'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        {setting.description || `System setting for ${setting.key}`}
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        className="btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          padding: '6px 14px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-color)',
                        }}
                        onClick={() => handleStartEdit(setting.key)}
                      >
                        <Pencil size={12} />
                        {hasValue ? 'Edit Key' : 'Set Key'}
                      </button>
                    )}
                  </div>

                  {!isEditing && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        background: 'var(--bg-base)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: hasValue ? 'var(--text-secondary)' : 'var(--text-muted)',
                          flex: 1,
                        }}
                      >
                        {hasValue ? '••••••••••••••••••••••••' : 'Not configured'}
                      </span>
                    </div>
                  )}

                  {isEditing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={isVisible ? 'text' : 'password'}
                            className="input"
                            autoFocus
                            style={{
                              width: '100%',
                              fontFamily: 'monospace',
                              fontSize: '13px',
                              paddingRight: '40px',
                              boxSizing: 'border-box',
                            }}
                            value={formValues[setting.key] || ''}
                            placeholder="Paste new API key here..."
                            onChange={(e) =>
                              setFormValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((prev) => ({ ...prev, [setting.key]: !isVisible }))}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={isVisible ? 'Hide key' : 'Show key'}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                          onClick={() => handleSaveKey(setting.key)}
                          disabled={saving || !formValues[setting.key]?.trim()}
                        >
                          {saving ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Check size={13} />
                          )}
                          Save Key
                        </button>
                        <button
                          className="btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border-color)',
                          }}
                          onClick={() => handleCancelEdit(setting.key, '********')}
                          disabled={saving}
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
