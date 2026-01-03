"use client";

import { useState, useEffect } from "react";

type LotteryCode = {
  _id: string;
  code: string;
  isUsed: boolean;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  used: number;
  unused: number;
};

export default function LotteryCodesManager({ productId }: { productId: string }) {
  const [codes, setCodes] = useState<LotteryCode[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, used: 0, unused: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'paste' | 'file'>('paste');

  // Fetch codes
  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}/lottery-codes`);
      const data = await res.json();

      if (data.success) {
        setCodes(data.codes);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching lottery codes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [productId]);

  // Handle CSV file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert("File size should be less than 1MB");
      return;
    }

    try {
      const text = await file.text();
      let codes: string[] = [];

      // Split into lines
      const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length === 0) {
        alert("CSV file is empty");
        return;
      }

      const firstLine = lines[0].toUpperCase();
      
      // ✅ Check if first line is header (contains "ID" and "CODE")
      if (firstLine.includes('ID') && firstLine.includes('CODE')) {
        // Parse as structured CSV with header (ID,Code format)
        console.log("Detected CSV with header row");
        
        for (let i = 1; i < lines.length; i++) { // Skip header (start from line 1)
          const parts = lines[i].split(',');
          
          if (parts.length >= 2) {
            // Extract "Code" column (second column after comma)
            const code = parts[1].trim();
            if (code) {
              codes.push(code);
            }
          }
        }
      } else {
        // ✅ Fallback: No header detected, parse as plain codes
        console.log("No header detected, parsing as plain codes");
        
        if (text.includes(',')) {
          // Comma-separated
          codes = text.split(/[,\n\r]+/).map(c => c.trim()).filter(c => c.length > 0);
        } else {
          // Line-separated
          codes = lines;
        }
      }

      if (codes.length === 0) {
        alert("No valid codes found in CSV");
        return;
      }

      // Set codes for preview
      setCsvText(codes.join('\n'));
      alert(`Loaded ${codes.length} codes from CSV!`);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Failed to read file");
    }
  };

  // Upload CSV
  const handleUpload = async () => {
    if (!csvText.trim()) {
      alert("Please paste codes in the text area");
      return;
    }

    try {
      setUploading(true);

      // Parse CSV (one code per line)
      const codes = csvText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const res = await fetch(`/api/products/${productId}/lottery-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setCsvText("");
        setShowUpload(false);
        fetchCodes();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error uploading codes:", error);
      alert("Failed to upload codes");
    } finally {
      setUploading(false);
    }
  };

  // Delete all unused codes
  const handleDeleteUnused = async () => {
    if (!confirm("Delete all unused lottery codes? This cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/products/${productId}/lottery-codes`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        fetchCodes();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting codes:", error);
      alert("Failed to delete codes");
    } finally {
      setDeleting(false);
    }
  };

  // Download codes as CSV
  const handleDownload = () => {
    const csv = codes.map((c) => c.code).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lottery-codes-${productId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
        📋 Lottery Codes
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading codes...</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Codes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Used</p>
              <p className="text-2xl font-bold text-green-600">{stats.used}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Unused</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unused}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showUpload ? "Cancel Upload" : "+ Add Codes"}
            </button>
            {stats.total > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  📥 Download CSV
                </button>
                {stats.unused > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteUnused}
                    disabled={deleting}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : `🗑️ Delete Unused (${stats.unused})`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-4">
                {/* Tab Selection */}
                <div className="flex gap-2 border-b">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('paste')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                      uploadMethod === 'paste'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                      uploadMethod === 'file'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Upload CSV File
                  </button>
                </div>

                {/* Paste Method */}
                {uploadMethod === 'paste' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Codes (One per line)
                    </label>
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder="ABC123&#10;DEF456&#10;GHI789"
                      rows={8}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Format: One code per line. Codes must be 4-20 alphanumeric characters.
                    </p>
                  </div>
                )}

                {/* File Upload Method */}
                {uploadMethod === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      CSV format: One code per line or comma-separated. Max file size: 1MB
                    </p>
                    {csvText && (
                      <div className="mt-3 p-3 bg-white border rounded">
                        <p className="text-xs text-gray-600 mb-1">Preview (first 10 codes):</p>
                        <div className="font-mono text-xs text-gray-800 max-h-32 overflow-y-auto">
                          {csvText.split('\n').slice(0, 10).join('\n')}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Total codes detected: {csvText.split('\n').filter(l => l.trim()).length}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !csvText.trim()}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Codes"}
                </button>
              </div>
            </div>
          )}

          {/* Codes Table */}
          {stats.total > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="font-medium text-gray-900">All Codes ({stats.total})</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Used At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {codes.map((code) => (
                      <tr key={code._id} className={code.isUsed ? "bg-green-50" : ""}>
                        <td className="px-4 py-2 font-mono text-sm text-gray-900">{code.code}</td>
                        <td className="px-4 py-2">
                          {code.isUsed ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              Used
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              Unused
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {code.usedAt
                            ? new Date(code.usedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
