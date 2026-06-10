

export const Badge = ({ text }: { text: string }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'rgba(230,57,80,0.09)', border: '1px solid rgba(230,57,80,0.32)',
    borderRadius: '6px', padding: '6px 14px', width: 'fit-content',
  }}>
    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e63950', boxShadow: '0 0 6px #e63950' }} />
    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#e63950', fontFamily: 'var(--font-cyber)', letterSpacing: '0.8px' }}>{text}</span>
  </div>
)
