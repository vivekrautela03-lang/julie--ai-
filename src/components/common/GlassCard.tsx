import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'julie' | 'pastel-pink' | 'pastel-blue' | 'pastel-mint' | 'pastel-cyan' | 'pastel-lavender';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const baseStyles = 'rounded-[20px] transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white border border-slate-100 shadow-card-soft',
    interactive: 'bg-white border border-slate-100 shadow-card-soft hover:shadow-card-hover hover:border-julie-200 cursor-pointer',
    julie: 'julie-card-gradient p-5',
    'pastel-pink': 'bg-[#FFF1F2] border border-[#FFE4E6]',
    'pastel-blue': 'bg-[#EFF6FF] border border-[#DBEAFE]',
    'pastel-mint': 'bg-[#ECFDF5] border border-[#D1FAE5]',
    'pastel-cyan': 'bg-[#F0FDFA] border border-[#CCFBF1]',
    'pastel-lavender': 'bg-[#FAF5FF] border border-[#F3E8FF]',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};
