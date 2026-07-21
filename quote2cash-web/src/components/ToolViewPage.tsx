import React from 'react';
import { getToolImageUrl } from '../api';
import type { Tool } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  tool: Tool;
  imagePreviewUrl?: string;
  onBack: () => void;
}

export default function ToolViewPage({ tool, imagePreviewUrl, onBack }: Props) {
  const formattedDate = tool.inspectionDate
    ? new Date(tool.inspectionDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : '—';

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Tool Details</h2>
          <p>Viewing inventory tool: <strong>{tool.code}</strong></p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
      </div>

      <div className="management-container" style={{ maxWidth: '860px' }}>
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(15,23,42,0.07)',
            overflow: 'hidden'
          }}
        >
          {/* Details grid */}
          <div style={{ padding: '32px' }}>
            <h3
              style={{
                margin: '0 0 6px',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#0f172a'
              }}
            >
              {tool.description}
            </h3>
            <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '0.9rem' }}>
              Tool Inventory Record
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}
            >
              {/* Quantity */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px 20px'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Quantity
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  {tool.quantity}
                </div>
              </div>

              {/* Location */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px 20px'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Location
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  {tool.location || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Not specified</span>}
                </div>
              </div>

              {/* Value */}
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '18px 20px'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Unit Value
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46' }}>
                  {formatAmount(tool.value)}
                </div>
              </div>

              {/* Total stock value */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '18px 20px'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Total Stock Value
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af' }}>
                  {formatAmount(tool.value * tool.quantity)}
                </div>
              </div>

              {/* Inspection Date */}
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  gridColumn: 'span 2'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Next Inspection Date
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#78350f' }}>
                  {formattedDate}
                </div>
              </div>
            </div>

            {/* ID footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                ID: {tool.id}
              </span>
            </div>
          </div>

          {/* Image Banner */}
          <div
            style={{
              background: imagePreviewUrl ? 'transparent' : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              minHeight: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={tool.code}
                style={{
                  width: '100%',
                  maxHeight: '360px',
                  objectFit: 'contain',
                  display: 'block',
                  background: '#f8fafc'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '4rem', marginBottom: '8px' }}>🔧</div>
                <div style={{ fontSize: '0.9rem' }}>No image available</div>
              </div>
            )}
            {/* Code badge overlay */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(15,23,42,0.85)',
                color: '#f8fafc',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                backdropFilter: 'blur(6px)'
              }}
            >
              {tool.code}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
