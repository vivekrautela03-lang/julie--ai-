import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { erpService } from '@/services/integrations/MockUniversityAdapter';

interface DemoModeBarProps {
  onSimulatedShift?: (msg: string) => void;
}

export const DemoModeBar: React.FC<DemoModeBarProps> = ({ onSimulatedShift }) => {
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleTriggerShift = async () => {
    setIsSimulating(true);
    try {
      const res = await erpService.simulateTimetableShift();
      if (onSimulatedShift) onSimulatedShift(res.message);
    } catch (e) {
      console.error('Failed to simulate shift', e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-brand-950/70 border-b border-brand-500/20 px-3 py-1.5 text-xs text-brand-300 flex items-center justify-between">
      <div className="flex items-center gap-1.5 font-medium">
        <Activity className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
        <span className="font-mono text-[11px]">DEMO SANDBOX ACTIVE</span>
      </div>
      <button
        onClick={handleTriggerShift}
        disabled={isSimulating}
        className="flex items-center gap-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-200 px-2 py-0.5 rounded border border-brand-400/30 transition-all text-[10px] font-medium active:scale-95"
      >
        <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
        Simulate ERP Timetable Shift (2PM &rarr; 3PM)
      </button>
    </div>
  );
};
