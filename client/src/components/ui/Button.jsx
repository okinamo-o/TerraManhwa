export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) {
  const isDisabled = disabled || loading;
  const base =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-terra-red/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-terra-red text-white hover:bg-red-700 active:scale-[0.97]',
    secondary: 'bg-terra-card text-terra-text border border-terra-border hover:border-terra-red hover:text-terra-red',
    ghost: 'text-terra-muted hover:text-terra-text hover:bg-terra-card',
    gold: 'bg-terra-gold text-black font-bold hover:brightness-110 active:scale-[0.97]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}
