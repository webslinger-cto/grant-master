type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className = '' }: BrandLogoProps) {
  if (compact) {
    return (
      <img
        src="/branding/grantsmaster-icon.svg"
        alt="GrantsMaster"
        className={className || 'h-6 w-6'}
      />
    );
  }

  return (
    <picture>
      <source
        srcSet="/branding/grantsmaster-logo-dark.svg"
        media="(prefers-color-scheme: dark)"
      />
      <img
        src="/branding/grantsmaster-logo-light.svg"
        alt="GrantsMaster"
        className={className || 'h-7 w-auto'}
      />
    </picture>
  );
}
