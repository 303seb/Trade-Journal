import { useState, useEffect, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { imgSave, imgLoad, imgDelete, compressImage } from '../store/imageStore'

interface ScreenshotUploadProps {
  label: string
  imageKey?: string
  onImageChange: (key: string | undefined) => void
  storageKey: string // stable unique key for IndexedDB, e.g. "2024-06-15_premkt"
}

export function ScreenshotUpload({ label, imageKey, onImageChange, storageKey }: ScreenshotUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!imageKey) { setPreview(null); return }
    imgLoad(imageKey).then(data => setPreview(data))
  }, [imageKey])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setLoading(true)
    try {
      const compressed = await compressImage(file)
      await imgSave(storageKey, compressed)
      setPreview(compressed)
      onImageChange(storageKey)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = async () => {
    if (imageKey) await imgDelete(imageKey)
    setPreview(null)
    onImageChange(undefined)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-[#2d3748] group">
          <img src={preview} alt={label} className="w-full object-contain max-h-64 bg-[#0a0d13]" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-[#2d3748] hover:border-violet-500/50 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors min-h-[100px]"
        >
          {loading ? (
            <div className="text-xs text-slate-500">Uploading…</div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-500">
                <ImageIcon size={18} />
                <Upload size={14} />
              </div>
              <span className="text-xs text-slate-500">Click or drag & drop screenshot</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}
    </div>
  )
}
