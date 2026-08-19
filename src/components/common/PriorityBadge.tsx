import React from 'react';
import type { TaskPriority } from '@/core/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const styles: Record<TaskPriority, string> = {
    Urgent: 'bg-[#FFF1F2] text-[#E11D48] border border-[#FFE4E6]',
    High: 'bg-[#FFF1F2] text-[#E11D48] border border-[#FFE4E6]',
    Medium: 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]',
    Low: 'bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]',
  };

  const sizeStyles = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${styles[priority]} ${sizeStyles}`}>
      {priority}
    </span>
  );
};
