'use client';

import { useState } from 'react';

interface Props {
  inviteLink: string;
  onClose: () => void;
}

export default function InviteModal({ inviteLink, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🔗 Invite Member</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Share this link to invite a new member to your organization. The link will expire in 7 days.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="form-input"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button className="btn btn-primary" onClick={handleCopy} style={{ minWidth: 100, justifyContent: 'center' }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
