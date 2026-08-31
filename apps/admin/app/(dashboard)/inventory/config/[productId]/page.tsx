"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Save, AlertCircle } from "lucide-react";

export default function ProductConfigPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, itemsRes] = await Promise.all([
          fetch(`/api/inventory/config/${productId}`),
          fetch(`/api/inventory?stockStatus=all`)
        ]);
        
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProduct(prodData.product);
          if (prodData.config?.components) {
            setComponents(prodData.config.components.map((c: any) => ({
              inventoryItemId: c.inventoryItemId,
              quantity: c.quantity
            })));
          }
        }
        
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setInventoryItems(itemsData.items || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [productId]);

  const handleAddComponent = () => {
    setComponents([...components, { inventoryItemId: "", quantity: 1 }]);
  };

  const handleRemoveComponent = (index: number) => {
    const newComps = [...components];
    newComps.splice(index, 1);
    setComponents(newComps);
  };

  const handleComponentChange = (index: number, field: string, value: string | number) => {
    const newComps = [...components];
    if (field === "inventoryItemId") {
      newComps[index].inventoryItemId = value;
    } else {
      newComps[index].quantity = Number(value);
    }
    setComponents(newComps);
  };

  const handleSave = async () => {
    const validComponents = components.filter((c: any) => c.inventoryItemId && c.quantity > 0);
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/config/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components: validComponents }),
      });
      if (res.ok) {
        alert("Configuration saved successfully!");
        router.push("/inventory/config");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 py-24"><div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div><p>Loading configuration...</p></div>;
  }

  if (!product) return <div className="p-6 text-center text-red-500">Product not found</div>;

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <Link href="/inventory/config" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Configurations
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 flex flex-col md:flex-row items-center p-6 gap-6">
        {product.images && product.images[0] ? (
          <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="128px" />
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-gray-400">No Image</span>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight max-w-full break-words">{product.name}</h2>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Price: ₹{product.price}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
              E-commerce Stock: {product.stock}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bill of Materials</h3>
            <p className="text-sm text-gray-500 mt-0.5">Raw materials deducted when this product is sold.</p>
          </div>
          <button
            onClick={handleAddComponent}
            className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2 text-indigo-600" /> Add Component
          </button>
        </div>

        <div className="p-6">
          {components.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No components added yet.</p>
              <p className="text-sm text-gray-400 mt-1">This product currently does not deduct any inventory.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {components.map((comp: any, index: number) => (
                <div key={index} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Inventory Item</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white shadow-sm"
                      value={comp.inventoryItemId}
                      onChange={(e) => handleComponentChange(index, "inventoryItemId", e.target.value)}
                    >
                      <option value="">-- Select an item --</option>
                      {inventoryItems.map((item: any) => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.currentStock} {item.unit} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
                      value={comp.quantity}
                      onChange={(e) => handleComponentChange(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="pt-6">
                    <button
                      onClick={() => handleRemoveComponent(index)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Component"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving Changes..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
