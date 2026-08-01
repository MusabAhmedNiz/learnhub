import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
  noPad?: boolean;
}

export default function Card({
  children,
  elevated = false,
  noPad = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`card ${elevated ? "glass-elevated" : ""} ${noPad ? "" : "p-6"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
