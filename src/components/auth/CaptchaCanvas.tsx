import React, { useRef, useEffect, useCallback } from 'react';
import { RotateCw, Volume2 } from 'lucide-react';

interface CaptchaCanvasProps {
  captchaText: string;
  onRefresh: () => void;
  width?: number;
  height?: number;
}

export const CaptchaCanvas: React.FC<CaptchaCanvasProps> = ({
  captchaText,
  onRefresh,
  width = 160,
  height = 46,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Latar Belakang Bertekstur Lembut
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f1f5f9');
    gradient.addColorStop(0.5, '#e2e8f0');
    gradient.addColorStop(1, '#ede9fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Garis Gangguan (Noise Lines)
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 60%, 75%)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 3. Titik-titik Gangguan (Noise Dots)
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 116, 139, ${Math.random() * 0.5 + 0.2})`;
      ctx.fill();
    }

    // 4. Gambar Karakter dengan Variasi Rotasi & Warna
    const charCount = captchaText.length;
    const charSpacing = (width - 24) / charCount;

    const colors = ['#312e81', '#1e3a8a', '#065f46', '#831843', '#4c1d95', '#0f766e'];

    for (let i = 0; i < charCount; i++) {
      const char = captchaText[i];
      ctx.save();

      const x = 16 + i * charSpacing + (Math.random() * 4 - 2);
      const y = height / 2 + (Math.random() * 6 - 3);

      ctx.translate(x, y);
      // Rotasi acak antara -18 sampai +18 derajat
      const angle = (Math.random() * 36 - 18) * (Math.PI / 180);
      ctx.rotate(angle);

      // Font bervariasi
      const fontSize = Math.floor(Math.random() * 6) + 22; // 22-28px
      ctx.font = `bold ${fontSize}px 'Courier New', Courier, monospace`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, [captchaText, width, height]);

  useEffect(() => {
    drawCaptcha();
  }, [drawCaptcha]);

  // Text to Speech untuk aksesibilitas
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Bacakan huruf satu per satu
      const spelledText = captchaText.split('').join(' ');
      const utterance = new SpeechSynthesisUtterance(spelledText);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-300 shadow-inner bg-slate-100 select-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block cursor-pointer"
          onClick={onRefresh}
          title="Klik gambar untuk memperbarui kode captcha"
        />
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
          title="Ganti Kode Captcha Baru"
          aria-label="Refresh Captcha"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleSpeak}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
          title="Dengarkan Kode Captcha (Audio)"
          aria-label="Audio Captcha"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

