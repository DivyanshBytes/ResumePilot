import api from './api';

// When a file request fails, the error message arrives as JSON *inside a blob*.
// This unpacks it so getErrorMessage() can show something useful.
const unpackBlobError = async (err) => {
  const blob = err?.response?.data;
  if (blob instanceof Blob) {
    try {
      err.response.data = JSON.parse(await blob.text());
    } catch { /* not JSON, leave it */ }
  }
  return err;
};

// Downloads a file from our API and saves it using the server's suggested filename
export async function downloadFile(path, fallbackName) {
  try {
    const res = await api.get(path, { responseType: 'blob' });
    const disposition = res.headers['content-disposition'] || '';
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    const filename = match ? match[1] : fallbackName;

    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { filename };
  } catch (err) {
    throw await unpackBlobError(err);
  }
}