'use client';

// Deliberately breaks from the site's flat design language — reserved for
// moments meant to feel like a trophy: League standings' top 3, and Family
// Feature's reveal screen. Gold / silver / bronze metallic gradients.
export const RANK_GRADIENTS = [
  'linear-gradient(90deg, #b8860b, #f4d576, #b8860b, #f4d576, #b8860b)',
  'linear-gradient(90deg, #8e8e8e, #eef0f1, #8e8e8e, #eef0f1, #8e8e8e)',
  'linear-gradient(90deg, #8a5a2e, #cd7f32, #8a5a2e, #cd7f32, #8a5a2e)',
];

export default function GradientRankCard({ label, gradient, children }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--color-paper)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 8, backgroundImage: gradient }} />
      <div style={{ padding: '16px 14px' }}>
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            backgroundImage: gradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}
