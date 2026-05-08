'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, Loader2, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { Job } from '@/types';

interface Props {
  job: Job;
  onAnalyzed: () => void;
}

interface FileStatus {
  name: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  reason?: string;
}

export default function ResumeUpload({ job, onAnalyzed }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const pdfs = accepted.filter((f) => f.type === 'application/pdf');
      if (pdfs.length !== accepted.length) toast.error('Only PDF files are accepted');
      setFiles((prev) => {
        const names = new Set(prev.map((f) => f.name));
        const newFiles = pdfs.filter((f) => !names.has(f.name));
        return [...prev, ...newFiles];
      });
      setUploadDone(false);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setFileStatuses((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {
    if (!files.length) return toast.error('Please add at least one PDF');
    setUploading(true);
    setFileStatuses(files.map((f) => ({ name: f.name, status: 'uploading' })));

    const formData = new FormData();
    formData.append('jobId', String(job.id));
    files.forEach((f) => formData.append('resumes', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const statusMap: Record<string, FileStatus> = {};
      (data.results as FileStatus[]).forEach((r) => { statusMap[r.name] = r; });
      setFileStatuses(files.map((f) => statusMap[f.name] ?? { name: f.name, status: 'failed' }));
      setUploadDone(true);
      toast.success(`${data.uploaded}/${data.total} resumes uploaded`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setFileStatuses(files.map((f) => ({ name: f.name, status: 'failed' })));
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${data.analyzed} resumes analyzed by Groq AI!`);
      onAnalyzed();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Upload className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Upload Resumes</h2>
          <p className="text-sm text-gray-500">For: <span className="font-medium text-brand-600">{job.title}</span></p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">
          {isDragActive ? 'Drop PDFs here...' : 'Drag & drop PDF resumes here'}
        </p>
        <p className="text-sm text-gray-400 mt-1">or click to browse — multiple files supported</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-5 space-y-2">
          {files.map((file) => {
            const fs = fileStatuses.find((s) => s.name === file.name);
            return (
              <div key={file.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                {fs?.status === 'uploaded' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {fs?.status === 'uploading' && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
                {fs?.status === 'failed' && <span className="text-xs text-red-500">Failed</span>}
                {!fs && (
                  <button onClick={() => removeFile(file.name)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex gap-3">
        <button
          onClick={handleUpload}
          disabled={uploading || !files.length || uploadDone}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : `Upload ${files.length} Resume${files.length !== 1 ? 's' : ''}`}
        </button>

        {uploadDone && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {analyzing ? 'Analyzing with AI...' : 'Analyze with Groq AI'}
          </button>
        )}
      </div>
    </div>
  );
}
