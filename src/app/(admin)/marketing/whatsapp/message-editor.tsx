"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Strikethrough, Smile, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadCampaignImage } from "./actions";

// Conjunto enxuto de emojis comuns (evita dependência externa de picker).
const EMOJIS = [
  "😀", "😁", "😊", "🥰", "😍", "😘", "😅", "😂", "🤗", "🤩",
  "👍", "👏", "🙏", "💪", "🙌", "👋", "✌️", "🤝", "❤️", "💜",
  "💖", "💕", "✨", "🎉", "🎊", "🎂", "🌸", "🌷", "🌹", "💐",
  "✅", "⭐", "🔥", "💡", "📌", "📢", "📣", "🗓️", "⏰", "📍",
  "💬", "📲", "👩", "👧", "🤱", "🩺", "💊", "🏥", "🎀", "🌟",
];

interface Props {
  value: string;
  onChange: (next: string) => void;
  imageId: string | null;
  onImageChange: (id: string | null) => void;
  placeholder?: string;
}

export function MessageEditor({
  value,
  onChange,
  imageId,
  onImageChange,
  placeholder,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Preview local imediato (objectURL) ao subir; ao editar campanha existente,
  // cai para o proxy autenticado /api/whatsapp/imagem/{id}.
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const previewSrc = localPreview || (imageId ? `/api/whatsapp/imagem/${imageId}` : null);

  // Insere texto na posição do cursor, preservando o restante.
  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Envolve a seleção com marcadores do WhatsApp (*negrito*, _itálico_, ~tachado~).
  const wrapSelection = (marker: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || "texto";
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5 MB).");
      return;
    }
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await uploadCampaignImage(form);
      if (res.success && res.id) {
        onImageChange(res.id);
        toast.success("Imagem anexada.");
      } else {
        setLocalPreview(null);
        URL.revokeObjectURL(objectUrl);
        toast.error((res as { error?: string }).error || "Falha ao enviar imagem.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    onImageChange(null);
  };

  const ToolbarBtn = ({
    onClick,
    title,
    children,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="relative flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-1 py-1">
        <ToolbarBtn onClick={() => wrapSelection("*")} title="Negrito (*texto*)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => wrapSelection("_")} title="Itálico (_texto_)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => wrapSelection("~")} title="Tachado (~texto~)">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarBtn onClick={() => setShowEmojis((v) => !v)} title="Emojis">
          <Smile className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => fileInputRef.current?.click()}
          title="Anexar imagem"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
        </ToolbarBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {showEmojis && (
          <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-10 gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 shadow-lg">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  insertAtCursor(e);
                  setShowEmojis(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        className="w-full h-36 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-slate-950"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {value.length} caractere{value.length === 1 ? "" : "s"}
        </span>
        <span className="text-[10px] text-slate-400">
          *negrito* · _itálico_ · ~tachado~
        </span>
      </div>

      {/* Preview da imagem anexada */}
      {previewSrc && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Imagem da campanha"
            className="max-h-40 rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
          />
          <button
            type="button"
            onClick={removeImage}
            title="Remover imagem"
            className={cn(
              "absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full",
              "bg-red-500 text-white shadow hover:bg-red-600",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
