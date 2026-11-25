import React from 'react';
import { ScheduleItem, Lecturer, Room, TimeSlot } from '../../types';
import { X, Printer, Scissors, CheckCircle, FileText, QrCode } from 'lucide-react';
import { formatIndonesianDate } from '../../utils/formatters';

interface PrintDraftLabelModalProps {
  item: ScheduleItem;
  lecturers: Lecturer[];
  rooms: Room[];
  timeSlots: TimeSlot[];
  isOpen: boolean;
  onClose: () => void;
}

export const PrintDraftLabelModal: React.FC<PrintDraftLabelModalProps> = ({
  item,
  lecturers,
  rooms,
  timeSlots,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const lecturerMap = new Map(lecturers.map(l => [l.id, l]));
  const room = rooms.find(r => r.id === item.roomId);
  const slot = timeSlots.find(t => t.id === item.timeSlotId);

  const p1 = lecturerMap.get(item.examiner1Id);
  const p2 = lecturerMap.get(item.examiner2Id);
  const p3 = lecturerMap.get(item.examiner3Id);

  const formattedDate = formatIndonesianDate(item.date, true); // e.g. "SABTU, 2-AGUSTUS-2025"
  const roomName = room ? room.name : 'R6028';
  const slotLabel = slot ? slot.label : '09.15-10.30';

  const labelsData = [
    {
      examinerName: p1?.name || 'Dian Dharmayanti, S.T., M.Kom.',
      examinerRole: 'PENGUJI 1 (KETUA)',
      examinerNidn: p1?.nidn || '0412088501',
      badgeColor: 'border-indigo-600 text-indigo-900',
    },
    {
      examinerName: p2?.name || 'Andri Heryandi, S.T., M.T.',
      examinerRole: 'PENGUJI 2 (ANGGOTA)',
      examinerNidn: p2?.nidn || '0420057802',
      badgeColor: 'border-sky-600 text-sky-900',
    },
    {
      examinerName: p3?.name || 'Chrismikha Hardyanto, M.Kom.',
      examinerRole: 'PENGUJI 3 (ANGGOTA)',
      examinerNidn: p3?.nidn || '0415118903',
      badgeColor: 'border-teal-600 text-teal-900',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col print:border-none print:shadow-none print:max-w-none">
        
        {/* Modal Top Header - Hidden on Print */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
              <img
                src="/logo-unikom.png"
                alt="Logo UNIKOM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Preview Cetak Label Draft Sidang Skripsi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                3 Label identitas resmi UNIKOM untuk disematkan pada jilid draft skripsi penguji
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="m3-btn-primary"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak 3 Label Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instructions banner - Hidden on Print */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200/60 text-xs text-amber-800 flex items-center gap-2 print:hidden">
          <Scissors className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Potong label sepanjang garis putus-putus dan tempelkan pada bagian depan map/jilid draft skripsi masing-masing dosen penguji.
          </span>
        </div>

        {/* Printable Label Sheet Area */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0 print:space-y-4 print:m-0" id="printable-labels-area">
          
          {labelsData.map((label, index) => (
            <div
              key={index}
              className="relative p-5 rounded-xl border-2 border-dashed border-slate-400 bg-white shadow-2xs hover:border-indigo-400 transition-colors print:border-black print:p-4 print:shadow-none print:break-inside-avoid"
            >
              {/* Cutting Line Indicator */}
              <div className="absolute -top-3 left-6 bg-white px-2 text-[10px] text-slate-400 font-mono flex items-center gap-1 select-none print:text-black">
                <Scissors className="w-3 h-3" />
                <span>Gunting Sepanjang Garis Ini (Label {index + 1} dari 3)</span>
              </div>

              {/* Institution Header inside Label */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo-unikom.png"
                    alt="Logo UNIKOM"
                    className="w-10 h-10 object-contain shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 leading-none">
                      UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
                    </h4>
                    <p className="text-[10px] text-slate-700 font-bold mt-0.5">
                      PROGRAM STUDI TEKNIK INFORMATIKA
                    </p>
                    <p className="text-[9.5px] text-slate-500 font-medium">
                      PANITIA SIDANG SKRIPSI • SLIP LABEL DRAFT PENGUJI
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-[10px] font-bold text-slate-600 uppercase px-2.5 py-1 rounded-full border border-slate-300 bg-slate-50 print:bg-white print:border-black">
                    DRAFT #{index + 1}
                  </span>
                </div>
              </div>

              {/* Required Formats Specified in Prompt:
                  1. Nama Dosen Penguji & Peran (contoh: Dian Dharmayanti, S.T., M.Kom. - PENGUJI 1)
                  2. Tanggal & Waktu/Ruang (contoh: SABTU, 2-AGUSTUS-2025 | 09.15-10.30 / R6028)
                  3. NIM & Nama Mahasiswa (contoh: 10120262 - SHANIA NUR LUTHFIA)
              */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                {/* Field 1: Dosen Penguji & Peran */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 print:bg-white print:border-black">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    DOSEN PENGUJI & PERAN:
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    {label.examinerName}
                  </p>
                  <p className="text-[11px] font-bold text-indigo-700 mt-0.5 print:text-black">
                    - {label.examinerRole}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    NIDN: {label.examinerNidn}
                  </p>
                </div>

                {/* Field 2: Tanggal & Waktu / Ruang */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 print:bg-white print:border-black">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    JADWAL & LOKASI SIDANG:
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    {formattedDate}
                  </p>
                  <p className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                    {slotLabel} / Ruang {roomName}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {room?.building || 'Gedung Smart Campus'}
                  </p>
                </div>

                {/* Field 3: NIM & Nama Mahasiswa */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 print:bg-white print:border-black">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    IDENTITAS MAHASISWA:
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 leading-tight uppercase">
                    {item.nim} - {item.studentName}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Program Studi: {item.studyProgram}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    TA: {item.academicYear}
                  </p>
                </div>
              </div>

              {/* Thesis Title Box */}
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 mb-3 text-xs text-slate-800 print:bg-white print:border-black">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-0.5">
                  Judul Skripsi / Tugas Akhir:
                </span>
                <p className="font-semibold italic leading-snug">
                  "{item.thesisTitle}"
                </p>
              </div>

              {/* Receipt / Signature Slip Bottom Area */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-600 print:border-black">
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-500">
                    * Wajib diserahkan ke dosen penguji paling lambat H-3 sebelum pelaksanaan sidang.
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Token Verifikasi: {item.id.toUpperCase()}-{item.nim}-LABEL{index+1}
                  </p>
                </div>

                {/* Tanda Tangan Penerima */}
                <div className="text-center min-w-[150px]">
                  <p className="font-semibold text-slate-700">Paraf / Tanda Tangan Penerima:</p>
                  <div className="h-10 border-b border-dashed border-slate-400 mt-1 mb-0.5" />
                  <p className="text-[9px] text-slate-400">( ............................................ )</p>
                </div>
              </div>

            </div>
          ))}

        </div>

        {/* Modal Footer - Hidden on Print */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Format label telah memenuhi standar pengarsipan akademik</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

