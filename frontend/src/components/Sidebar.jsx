import React from 'react';
import { useStore } from '../store/useStore';
import { Activity, LayoutDashboard, Lightbulb, Network, ShieldAlert, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { originalFileName, resetState } = useStore();

  const menuItems = [
    { id: 'summary', icon: LayoutDashboard, label: 'Summary' },
    { id: 'insights', icon: Lightbulb, label: 'AI Insights' },
    { id: 'patterns', icon: Network, label: 'Patterns & Clusters' },
    { id: 'anomalies', icon: ShieldAlert, label: 'Anomalies' },
  ];

  const styles = {
    sidebar: {
      width: '280px',
      height: '100vh',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      paddingBottom: '2rem',
      borderBottom: '1px solid var(--border-light)',
      marginBottom: '1.5rem',
    },
    iconBox: {
      backgroundColor: 'var(--brand-primary)',
      color: 'white',
      padding: '0.5rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: 'var(--text-primary)',
      letterSpacing: '-0.5px',
    },
    menuLabel: {
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-muted)',
      fontWeight: '600',
      marginBottom: '0.75rem',
    },
    navList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      flex: 1,
    },
    navItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
      borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
      cursor: 'pointer',
      transition: 'all var(--transition-fast)',
      fontWeight: isActive ? '600' : '500',
    }),
    footer: {
      marginTop: 'auto',
      borderTop: '1px solid var(--border-light)',
      paddingTop: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    fileInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    fileName: {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    btnReset: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      color: 'var(--error)',
      backgroundColor: 'var(--tint-red)',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.9rem',
      border: 'none',
      width: '100%',
      justifyContent: 'center',
      transition: 'all 0.2s',
    }
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.iconBox}>
          <Activity size={24} strokeWidth={2.5} />
        </div>
        <div style={styles.title}>AutoPattern</div>
      </div>

      <div style={styles.menuLabel}>Analysis Dashboard</div>
      <nav style={styles.navList}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id} 
              style={styles.navItem(isActive)}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} color={isActive ? "var(--brand-primary)" : "currentColor"} />
              {item.label}
            </div>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.fileInfo}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Dataset</span>
          <span style={styles.fileName} title={originalFileName}>
            {originalFileName || 'Unknown Data'}
          </span>
        </div>
        <button 
          style={styles.btnReset}
          onClick={resetState}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--tint-red-dark)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--tint-red)'}
        >
          <LogOut size={16} /> Close Dataset
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
