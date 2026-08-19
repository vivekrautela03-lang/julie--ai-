import React from 'react';
import {
  X,
  FileText,
  Image,
  FileCode,
  Table,
  Presentation,
  ChevronRight,
  File,
} from 'lucide-react';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
  summary?: string[];
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: UploadedFileItem) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  if (!isOpen) return null;

  const fileCategories = [
    { label: 'Document', sub: 'PDF, DOC, DOCX', icon: FileText, color: 'from-blue-500/20 to-blue-600/30 text-blue-400 border-blue-500/30' },
    { label: 'Image', sub: 'PNG, JPG, JPEG', icon: Image, color: 'from-teal-500/20 to-teal-600/30 text-teal-400 border-teal-500/30' },
    { label: 'PDF File', sub: 'Upload PDF', icon: File, color: 'from-rose-500/20 to-rose-600/30 text-rose-400 border-rose-500/30' },
    { label: 'Text File', sub: 'TXT, MD', icon: FileCode, color: 'from-indigo-500/20 to-indigo-600/30 text-indigo-400 border-indigo-500/30' },
    { label: 'Spreadsheet', sub: 'XLS, XLSX', icon: Table, color: 'from-emerald-500/20 to-emerald-600/30 text-emerald-400 border-emerald-500/30' },
    { label: 'Presentation', sub: 'PPT, PPTX', icon: Presentation, color: 'from-amber-500/20 to-amber-600/30 text-amber-400 border-amber-500/30' },
  ];

  const recentFiles: UploadedFileItem[] = [
    {
      id: 'f-1',
      name: 'Marketing_Notes.pdf',
      size: '2.4 MB',
      type: 'PDF',
      date: '17 Aug',
      summary: [
        '5 major topics covered in Unit 4 & 5',
        'Important theories explained: 4Ps, STP Model, Porter 5 Forces',
        'Examples with Harvard Case Studies',
        'Exam-critical short & long essay questions',
      ],
    },
    {
      id: 'f-2',
      name: 'Business_Law_Notes.pdf',
      size: '1.8 MB',
      type: 'PDF',
      date: '12 Aug',
      summary: [
        'Contract Act 1872 clauses & statutory remedies',
        'Corporate governance regulations and compliance framework',
      ],
    },
    {
      id: 'f-3',
      name: 'Project_Proposal.docx',
      size: '806 KB',
      type: 'DOCX',
      date: '10 Aug',
      summary: [
        'Executive project brief, timeline milestones, and budget forecast',
      ],
    },
  ];

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const item: UploadedFileItem = {
        id: `f-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        date: 'Today',
        summary: [
          'File parsed and attached to Julie context',
          'Document structure & key highlights indexed',
        ],
      };
      onSelectFile(item);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in text-white select-none">
      <div className="bg-[#0A0B14] rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-sm font-bold text-white tracking-tight">Upload File</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-2xl liquid-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Category Grid Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {fileCategories.map((cat, i) => {
            const Icon = cat.icon;

            return (
              <label
                key={i}
                className={`p-3 rounded-2xl bg-gradient-to-b ${cat.color} border flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm`}
              >
                <input type="file" onChange={handleCustomUpload} className="hidden" />
                <Icon className="w-6 h-6 mb-1.5" />
                <span className="text-[11px] font-bold leading-tight">{cat.label}</span>
                <span className="text-[9px] opacity-75 mt-0.5">{cat.sub}</span>
              </label>
            );
          })}
        </div>

        {/* Recent Files List */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <h3 className="text-xs font-semibold text-slate-400">Recent Files</h3>

          <div className="space-y-1.5">
            {recentFiles.map(file => (
              <button
                key={file.id}
                onClick={() => {
                  onSelectFile(file);
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-[10px]">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-sky-400 transition-colors">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {file.size} • {file.date}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
