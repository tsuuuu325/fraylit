import Image from 'next/image';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizes = {
  sm: 32,
  md: 40,
  lg: 96
} as const;

export default function Avatar({
  name,
  url,
  size = 'md',
  isPaid = false
}: {
  name: string;
  url?: string | null;
  size?: keyof typeof sizes;
  isPaid?: boolean;
}) {
  const px = sizes[size];
  const frameClass = isPaid
    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-ink-950'
    : 'ring-1 ring-ink-700';

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover ${frameClass}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink-700 font-sans font-semibold text-parchment-muted ${frameClass}`}
      style={{ width: px, height: px, fontSize: px * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
