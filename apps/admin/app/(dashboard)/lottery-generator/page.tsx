"use client";

import { useState, useEffect } from "react";

// Character set: A-Z excluding I, L, O and numbers 2-9 (no 0, 1)
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

type Product = {
  _id: string;
  name: string;
  shortForms: string[];
};

type GeneratedCode = {
  id: number;
  code: string;
};

export default function LotteryGeneratorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Short Form Management
  const [shortForms, setShortForms] = useState<string[]>([]);
  const [newShortForm, setNewShortForm] = useState("");
  const [addingShortForm, setAddingShortForm] = useState(false);
  const [selectedShortForm, setSelectedShortForm] = useState("");
  
  // Code Generation
  const [quantity, setQuantity] = useState("");
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [existingSuffixes, setExistingSuffixes] = useState<Set<string>>(new Set());

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        if (data.success) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle product selection
  const handleProductSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    setSelectedShortForm("");
    setCodes([]);

    if (productId) {
      const product = products.find((p) => p._id === productId);
      if (product) {
        setSelectedProduct(product);
        
        // Fetch short forms for this product
        try {
          const res = await fetch(`/api/products/${productId}/short-forms`);
          const data = await res.json();
          
          if (data.success) {
            setShortForms(data.shortForms || []);
          }
        } catch (error) {
          console.error("Error fetching short forms:", error);
        }
      }
    } else {
      setSelectedProduct(null);
      setShortForms([]);
    }
  };

  // Add new short form
  const handleAddShortForm = async () => {
    if (!selectedProductId) {
      alert("Please select a product first");
      return;
    }

    const trimmed = newShortForm.trim().toUpperCase();
    
    if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
      alert("Short form must be 2-10 alphanumeric characters");
      return;
    }

    setAddingShortForm(true);

    try {
      const res = await fetch(`/api/products/${selectedProductId}/short-forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortForm: trimmed }),
      });

      const data = await res.json();

      if (data.success) {
        setShortForms(data.shortForms);
        setNewShortForm("");
        alert(`Short form "${trimmed}" added successfully!`);
      } else {
        alert(data.error || "Failed to add short form");
      }
    } catch (error) {
      console.error("Error adding short form:", error);
      alert("Failed to add short form");
    } finally {
      setAddingShortForm(false);
    }
  };

  // Remove short form
  const handleRemoveShortForm = async (shortForm: string) => {
    if (!confirm(`Remove short form "${shortForm}"?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/products/${selectedProductId}/short-forms?shortForm=${shortForm}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {
        setShortForms(data.shortForms);
        if (selectedShortForm === shortForm) {
          setSelectedShortForm("");
        }
        alert(`Short form "${shortForm}" removed successfully!`);
      } else {
        alert(data.error || "Failed to remove short form");
      }
    } catch (error) {
      console.error("Error removing short form:", error);
      alert("Failed to remove short form");
    }
  };

  // Fetch existing suffixes when short form is selected
  const handleShortFormSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shortForm = e.target.value;
    setSelectedShortForm(shortForm);
    setCodes([]);

    if (shortForm) {
      try {
        const res = await fetch("/api/lottery-generator/check-suffixes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortForm }),
        });

        const data = await res.json();

        if (data.success) {
          setExistingSuffixes(new Set(data.suffixes));
        }
      } catch (error) {
        console.error("Error fetching suffixes:", error);
      }
    } else {
      setExistingSuffixes(new Set());
    }
  };

  // Generate random 6-character suffix (globally unique)
  const generateUniqueSuffix = (usedSuffixes: Set<string>): string => {
    let suffix = "";
    let attempts = 0;
    const maxAttempts = 100;

    do {
      suffix = "";
      for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * CHARSET.length);
        suffix += CHARSET[randomIndex];
      }
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error("Unable to generate unique suffix after 100 attempts");
      }
    } while (usedSuffixes.has(suffix));

    return suffix;
  };

  // Generate codes
  const handleGenerate = () => {
    if (!selectedProductId) {
      alert("Please select a product");
      return;
    }

    if (!selectedShortForm) {
      alert("Please select a short form");
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty < 1 || qty > 10000) {
      alert("Please enter quantity between 1 and 10,000");
      return;
    }

    setGenerating(true);

    try {
      const generatedCodes: GeneratedCode[] = [];
      const allUsedSuffixes = new Set([...existingSuffixes]);

      // Generate unique codes
      for (let i = 0; i < qty; i++) {
        const suffix = generateUniqueSuffix(allUsedSuffixes);
        allUsedSuffixes.add(suffix);

        const code = `SWAGO-${selectedShortForm}-${suffix}`;
        generatedCodes.push({
          id: i + 1,
          code: code,
        });
      }

      setCodes(generatedCodes);
      alert(`Successfully generated ${qty} unique codes!`);
    } catch (error) {
      console.error("Error generating codes:", error);
      alert("Failed to generate codes: " + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  // Download as CSV
  const handleDownload = () => {
    if (codes.length === 0) {
      alert("No codes to download");
      return;
    }

    // Create CSV content with header
    const csvContent = "ID,Code\n" + codes.map((c) => `${c.id},${c.code}`).join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lottery-codes-${selectedShortForm}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Copy all codes to clipboard
  const handleCopy = () => {
    if (codes.length === 0) {
      alert("No codes to copy");
      return;
    }

    const codeList = codes.map((c) => c.code).join("\n");
    navigator.clipboard.writeText(codeList);
    alert("Codes copied to clipboard!");
  };

  // Reset
  const handleReset = () => {
    setSelectedProductId("");
    setSelectedProduct(null);
    setShortForms([]);
    setSelectedShortForm("");
    setQuantity("");
    setCodes([]);
    setExistingSuffixes(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lottery Code Generator</h1>
        <p className="text-gray-600 mt-1">Generate unique lottery codes for products</p>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Product Selection Section */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              1. Select Product
            </h2>

            {loadingProducts ? (
              <p className="text-gray-500">Loading products...</p>
            ) : (
              <div>
                <select
                  value={selectedProductId}
                  onChange={handleProductSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a Product --</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                {selectedProduct && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Selected: <span className="font-medium">{selectedProduct.name}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Short Form Management */}
          {selectedProductId && (
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                2. Manage Short Forms
              </h2>

              {/* Existing Short Forms */}
              {shortForms.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Existing Short Forms for this Product:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {shortForms.map((sf) => (
                      <div
                        key={sf}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md flex items-center gap-2"
                      >
                        <span className="font-mono font-semibold">{sf}</span>
                        <button
                          onClick={() => handleRemoveShortForm(sf)}
                          className="text-red-600 hover:text-red-800 font-bold"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Short Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add New Short Form:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newShortForm}
                    onChange={(e) => setNewShortForm(e.target.value.toUpperCase())}
                    placeholder="e.g., SDC, SR, COMBO"
                    maxLength={10}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddShortForm}
                    disabled={addingShortForm || !newShortForm.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {addingShortForm ? "Adding..." : "Add"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  2-10 alphanumeric characters. Must be unique across all products.
                </p>
              </div>
            </div>
          )}

          {/* Code Generation Settings */}
          {shortForms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                3. Generate Codes
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Select Short Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Short Form *
                  </label>
                  <select
                    value={selectedShortForm}
                    onChange={handleShortFormSelect}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Select Short Form --</option>
                    {shortForms.map((sf) => (
                      <option key={sf} value={sf}>
                        {sf}
                      </option>
                    ))}
                  </select>
                  {selectedShortForm && existingSuffixes.size > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ {existingSuffixes.size} existing codes found (will avoid duplicates)
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Codes *
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    min="1"
                    max="10000"
                    disabled={!selectedShortForm}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 10,000 codes</p>
                </div>
              </div>

              {selectedShortForm && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">Code Format Preview:</p>
                  <p className="text-lg font-mono font-bold text-blue-700 mt-1">
                    SWAGO-{selectedShortForm}-XXXXXX
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Character Set: {CHARSET}
                  </p>
                  <p className="text-xs text-blue-600">
                    Letters A-Z (excluding I, L, O) + Numbers 2-9 (excluding 0, 1)
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !selectedShortForm || !quantity}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {generating ? "Generating..." : "Generate Codes"}
                </button>

                {codes.length > 0 && (
                  <>
                    <button
                      onClick={handleDownload}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      📥 Download CSV
                    </button>
                    <button
                      onClick={handleCopy}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      📋 Copy All
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      🔄 Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Codes Table */}
      {codes.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h2 className="font-semibold text-gray-900">
              Generated Codes ({codes.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Product: <span className="font-medium">{selectedProduct?.name}</span> • 
              Short Form: <span className="font-mono font-semibold">{selectedShortForm}</span> • 
              Format: <span className="font-mono font-semibold">SWAGO-{selectedShortForm}-XXXXXX</span>
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">
                    Code
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-500">{code.id}</td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-900">
                      {code.code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
