type BadgeVariant = "accent" | "success" | "warning";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({ children, variant = "accent" }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
