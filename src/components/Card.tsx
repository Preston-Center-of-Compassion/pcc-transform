import { h, ComponentChild } from "preact";

interface CardProps {
  className?: string;
  children: ComponentChild;
}

export default function Card({ className, children }: CardProps) {
  return (
    <div className={`rounded border bg-gray-50 p-5 ${className}`}>
      {children}
    </div>
  );
}
