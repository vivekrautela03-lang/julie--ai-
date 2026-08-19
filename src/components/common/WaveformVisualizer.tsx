import React from 'react';

interface WaveformVisualizerProps {
  isActive: boolean;
  color?: string;
  barsCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
  color = '#38BDF8',
  barsCount = 12,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2">
      {Array.from({ length: barsCount }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${
            isActive ? 'animate-wave-bar' : 'h-1.5 opacity-30'
          }`}
          style={{
            backgroundColor: color,
            height: isActive ? `${Math.max(20, (Math.sin(i * 0.8) + 1) * 16 + 8)}px` : '4px',
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
};
