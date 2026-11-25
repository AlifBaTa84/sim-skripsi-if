import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';
import { ScheduleContext } from '../../context/ScheduleContext';

export interface CalendarDatePickerProps {
  value: string; // 'YYYY-MM-DD' or 'all'
  onChange: (date: string) => void;
  label?: string;
  allowAll?: boolean;
  allLabel?: string;
  highlightedDates?: string[];
  dateCounts?: Record<string, number>; // Jumlah card sidang per tanggal
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
  disableFutureDates?: boolean; // Default false
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  value,
  onChange,
  label,
  allowAll = false,
  allLabel = 'Semua Tanggal Pelaksanaan',
  highlightedDates,
  dateCounts,
  placeholder = 'Pilih Tanggal',
  align = 'left',
  className = '',
  disableFutureDates = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scheduleContext = useContext(ScheduleContext);

  // Dynamic determine highlighted dates from props or ScheduleContext (cards entered in matrix)
  const activeHighlightedDates = useMemo(() => {
    if (highlightedDates !== undefined) {
      return highlightedDates;
    }
    if (scheduleContext) {
      return scheduleContext.scheduledDates;
    }
    return [];
  }, [highlightedDates, scheduleContext]);

  // Dynamic determine card counts per date
  const activeDateCounts = useMemo(() => {
    if (dateCounts !== undefined) {
      return dateCounts;
    }
    if (scheduleContext) {
      return scheduleContext.matrixCardCountsByDate;
    }
    return {};
  }, [dateCounts, scheduleContext]);

  // Today's actual date components
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 11 = Des)
  const currentDay = today.getDate();
  const todayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  // Start year for the year dropdown (e.g. 2020)
  const startYear = 2020;
  const maxYear = disableFutureDates ? currentYear : currentYear + 5;

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = startYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [maxYear]);

  // Determine initial calendar view month & year based on value or highlighted dates
  const getInitialView = () => {
    if (value && value !== 'all' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    if (activeHighlightedDates.length > 0) {
      const [y, m] = activeHighlightedDates[0].split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    return { year: Math.min(2025, currentYear), month: 7 }; // Default: Agustus 2025
  };

  const [viewDate, setViewDate] = useState(getInitialView);

  // Sync viewed month if value changes to a valid date
  useEffect(() => {
    if (value && value !== 'all' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewDate({ year: y, month: m - 1 });
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // ── Month & Year Change Handlers ──────────────────────────────────────────
  const handleYearSelect = (newYear: number) => {
    setViewDate(prev => {
      let newMonth = prev.month;
      // If changing to current year and month is past currentMonth, clamp to currentMonth
      if (disableFutureDates && newYear >= currentYear && newMonth > currentMonth) {
        newMonth = currentMonth;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const handleMonthSelect = (newMonth: number) => {
    // Prevent selecting month beyond current month in the current year
    if (disableFutureDates && viewDate.year >= currentYear && newMonth > currentMonth) {
      return;
    }
    setViewDate(prev => ({ ...prev, month: newMonth }));
  };

  const isNextMonthDisabled = disableFutureDates && (
    viewDate.year > currentYear || (viewDate.year === currentYear && viewDate.month >= currentMonth)
  );

  const isPrevMonthDisabled = viewDate.year <= startYear && viewDate.month <= 0;

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    setViewDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    setViewDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleSelectDate = (dateStr: string) => {
    // Prevent selecting any future date
    if (disableFutureDates && dateStr > todayDateStr) {
      return;
    }
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    onChange('all');
    setIsOpen(false);
  };

  // Jump to today
  const handleJumpToToday = () => {
    setViewDate({ year: currentYear, month: currentMonth });
    handleSelectDate(todayDateStr);
  };

  // Days in current view month
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDayIndex = new Date(viewDate.year, viewDate.month, 1).getDay(); // 0 = Minggu

  // Display label on the trigger button
  const getDisplayLabel = () => {
    if (value === 'all') {
      return allLabel;
    }
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatIndonesianDate(value);
    }
    return placeholder;
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-20'} ${className}`}>
      {/* Label above input (optional) */}
      {label && (
        <label className="block text-[11px] font-bold text-slate-600 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button (Shows Calendar Icon + Selected Date + Chevron) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 select-none ${
          isOpen
            ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 ring-2 ring-indigo-500/20'
            : value !== 'all' && value
            ? 'bg-white border-slate-300 text-slate-900 shadow-2xs hover:border-indigo-400 hover:bg-slate-50'
            : 'bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50'
        }`}
        title="Klik untuk memilih tanggal pada kalender"
      >
        <CalendarDays className={`w-4 h-4 shrink-0 ${isOpen || value !== 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
        
        <span className="truncate max-w-[200px] sm:max-w-[260px] text-left">
          {getDisplayLabel()}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* Calendar Popover Dialog */}
      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-76 sm:w-84 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 animate-in fade-in zoom-in-95 duration-150 select-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ filter: 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.15))' }}
        >
          {/* Option: "Tampilkan Semua Tanggal" (for filter mode) */}
          {allowAll && (
            <div className="mb-3 pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  value === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{allLabel}</span>
                </div>
                {value === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Month & Year Navigation Header with Selectable Dropdowns */}
          <div className="flex items-center justify-between mb-3 px-1 gap-2">
            
            {/* Interactive Month & Year Selectors */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Month Dropdown */}
              <select
                value={viewDate.month}
                onChange={(e) => handleMonthSelect(Number(e.target.value))}
                className="text-xs font-extrabold text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors shrink-0"
                title="Pilih Bulan"
              >
                {MONTH_NAMES.map((name, idx) => {
                  const isFutureMonth = disableFutureDates && viewDate.year >= currentYear && idx > currentMonth;
                  return (
                    <option key={name} value={idx} disabled={isFutureMonth}>
                      {name} {isFutureMonth ? '(Masa Depan)' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewDate.year}
                onChange={(e) => handleYearSelect(Number(e.target.value))}
                className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-1.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors shrink-0"
                title="Pilih Tahun"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Previous / Next Month Arrows */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isPrevMonthDisabled}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPrevMonthDisabled
                    ? 'text-slate-300 cursor-not-allowed opacity-40'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={isPrevMonthDisabled ? 'Batas tahun minimum' : 'Bulan Sebelumnya'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled}
                className={`p-1.5 rounded-lg transition-colors ${
                  isNextMonthDisabled
                    ? 'text-slate-300 cursor-not-allowed opacity-40'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={isNextMonthDisabled ? 'Tidak dapat melewati bulan aktual saat ini' : 'Bulan Berikutnya'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((day, idx) => (
              <div 
                key={day} 
                className={`text-[10px] font-bold uppercase tracking-wider py-1 ${
                  idx === 0 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty padding cells for days before the 1st of the month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 sm:h-9" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const sessionCount = activeDateCounts[dateStr] ?? (activeHighlightedDates.includes(dateStr) ? 1 : 0);
              const hasAgenda = sessionCount > 0;
              const dayOfWeek = (firstDayIndex + i) % 7;
              const isSunday = dayOfWeek === 0;
              const isToday = dateStr === todayDateStr;
              const isFuture = disableFutureDates && dateStr > todayDateStr && !hasAgenda;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleSelectDate(dateStr)}
                  className={`h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center relative text-xs font-semibold transition-all ${
                    isFuture
                      ? 'text-slate-300/80 cursor-not-allowed bg-slate-50/40 select-none'
                      : isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : hasAgenda
                      ? 'bg-indigo-50/90 text-indigo-900 font-bold border border-indigo-200/80 hover:bg-indigo-100 hover:border-indigo-300'
                      : isSunday
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  } ${isToday && !isSelected ? 'ring-1.5 ring-indigo-500 font-bold' : ''}`}
                  title={
                    isFuture
                      ? `${formatIndonesianDate(dateStr)} (Melewati batas tanggal)`
                      : `${formatIndonesianDate(dateStr)}${hasAgenda ? ` (${sessionCount} Sidang di Matriks)` : ''}${isToday ? ' (Hari Ini)' : ''}`
                  }
                >
                  <span className={isFuture ? 'opacity-40' : ''}>{day}</span>

                  {/* Indicator Dot for Days with Sidang Agenda in Matrix */}
                  {hasAgenda && (
                    <span 
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-indigo-600 animate-pulse'
                      }`} 
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend & Agenda Summary */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[10.5px] px-1">
            {activeHighlightedDates.length > 0 ? (
              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 animate-pulse" />
                  <span className="font-medium text-slate-700">Tanggal dengan Agenda Sidang</span>
                </div>
                <span className="font-bold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {activeHighlightedDates.length} Hari Aktif
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                  <span>Tidak ada agenda sidang di matriks</span>
                </div>
                <span className="font-mono text-slate-400">0 Hari</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-50">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Hari ini: {formatIndonesianDate(todayDateStr)}</span>
              </span>

              <button
                type="button"
                onClick={handleJumpToToday}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                title="Pilih Hari Ini"
              >
                Hari Ini
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
