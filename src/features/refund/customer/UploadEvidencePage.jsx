import React, { useState } from 'react';
import { FileImage, Upload, ExternalLink, AlertTriangle } from 'lucide-react';
import { uploadRefundFile, uploadEvidence } from '../api/refundApi';
import { BASE_URL } from '../../../shared/api/apiClient';

const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function UploadEvidencePage({
  detail,
  onRefresh,
  setActionError
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <FileImage size={14} className="text-[#10B981]" />
          Evidence Photos ({detail.evidence?.length || 0})
        </h3>
        <span className="text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-505 border border-red-200 px-2 py-1 rounded-full text-red-500">
          Additional proof required
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {detail.evidence?.map(e => (
          <div key={e.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square bg-gray-50 shadow-sm">
            <img 
              src={getImgUrl(e.fileUrl)} 
              alt="Evidence file"
              className="w-full h-full object-cover"
            />
            <a 
              href={getImgUrl(e.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        ))}

        <label className="border-2 border-dashed border-gray-200 hover:border-[#10B981] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#16A34A]/10/50 transition-all aspect-square text-center">
          <Upload size={20} className="text-[#10B981] mb-2" />
          <span className="text-xs font-black text-gray-800 block mb-0.5">
            {uploading ? 'Uploading...' : 'Upload More'}
          </span>
          <span className="text-[9px] text-gray-400 font-bold block uppercase">JPG, PNG &bull; Max 5MB</span>
          <input
            type="file"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              setUploading(true);
              setActionError('');
              try {
                const uploadRes = await uploadRefundFile(file);
                const fileUrl = uploadRes.data?.fileUrl;
                if (!fileUrl) throw new Error('File URL not returned');
                await uploadEvidence(detail.id, { fileUrl, note: 'Uploaded additional evidence' });
                onRefresh();
              } catch (err) {
                console.error(err);
                setActionError(err.response?.data?.message || 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="bg-red-50/50 border border-red-200 rounded-xl p-3 text-[11px] text-red-700 font-semibold leading-relaxed flex items-start gap-2">
        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
        <span>
          The {detail.auditLogs?.some(log => log.newStatus === 'MORE_EVIDENCE_REQUESTED' && log.actorRole === 'ADMIN') ? 'Admin' : 'Seller'} has requested additional pictures. Please upload clear photos of the damaged area using the upload box above.
        </span>
      </div>
    </div>
  );
}
