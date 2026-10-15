interface PdfPreviewProps {
  src: string;
  fileName: string;
}

export function PdfPreview({ src, fileName }: PdfPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
      <iframe
        src={src}
        title={fileName}
        className="w-full h-full max-w-5xl rounded-2xl shadow-xl border border-slate-200 bg-white"
      />
    </div>
  );
}
