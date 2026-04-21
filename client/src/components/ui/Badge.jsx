export default function Badge({ type = 'default', children, className = '' }) {
  const styles = {
    new: 'badge-new',
    hot: 'badge-hot',
    completed: 'badge-completed',
    ongoing: 'badge-ongoing',
    hiatus: 'badge-hiatus',
    dropped: 'badge-dropped',
    default: 'bg-terra-card text-terra-muted border border-terra-border',
    genre: 'bg-terra-card/60 text-terra-gold border border-terra-gold/20 hover:border-terra-gold/50 cursor-pointer transition-colors',
  };

  return (
    <span className={`badge ${styles[type] || styles.default} ${className}`}>
      {children}
    </span>
  );
}
