import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { downloadFile } from '../lib/download';
import { getErrorMessage } from '../lib/api';
import Button from './Button';

// kind: "resume" or "cover-letter"
export default function DownloadButtons({ appId, kind, disabled = false, hint }) {
  const [busy, setBusy] = useState(null);

  const go = async (format) => {
    setBusy(format);
    try {
      const { filename } = await downloadFile(`/applications/${appId}/export/${kind}?format=${format}`, `${kind}.${format}`);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2" title={disabled ? hint : undefined}>
      <Button variant="outline" className="!px-4 !py-2.5" onClick={() => go('pdf')} loading={busy === 'pdf'} disabled={disabled || busy === 'docx'}>
        <Download className="h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" className="!px-4 !py-2.5" onClick={() => go('docx')} loading={busy === 'docx'} disabled={disabled || busy === 'pdf'}>
        <Download className="h-4 w-4" /> Word
      </Button>
    </div>
  );
}