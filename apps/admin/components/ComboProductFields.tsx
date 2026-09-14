"use client";

type ProductOption = {
  _id: string;
  name: string;
};

type ComboProductFieldsProps = {
  isCombo: boolean;
  comboUnitCount: string;
  comboProductIds: string[];
  /** Other products available for optional component selection */
  productOptions: ProductOption[];
  errors?: Record<string, string>;
  onIsComboChange: (checked: boolean) => void;
  onComboUnitCountChange: (value: string) => void;
  onComboProductIdsChange: (ids: string[]) => void;
};

export default function ComboProductFields({
  isCombo,
  comboUnitCount,
  comboProductIds,
  productOptions,
  errors = {},
  onIsComboChange,
  onComboUnitCountChange,
  onComboProductIdsChange,
}: ComboProductFieldsProps) {
  const toggleProduct = (id: string) => {
    if (comboProductIds.includes(id)) {
      onComboProductIdsChange(comboProductIds.filter((x) => x !== id));
    } else {
      onComboProductIdsChange([...comboProductIds, id]);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isCombo}
          onChange={(e) => onIsComboChange(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-700">
          Combo product (ships multiple physical units)
        </span>
      </label>

      {isCombo && (
        <div className="pl-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Units per combo *
            </label>
            <input
              type="number"
              min={2}
              step={1}
              value={comboUnitCount}
              onChange={(e) => onComboUnitCountChange(e.target.value)}
              placeholder="2"
              className={`w-40 border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.comboUnitCount ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-400 mt-1">
              Analytics counts this many units per combo sold (stock stays 1 pack).
            </p>
            {errors.comboUnitCount && (
              <p className="text-red-500 text-xs mt-1">{errors.comboUnitCount}</p>
            )}
          </div>

          {productOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component products{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto divide-y divide-gray-100">
                {productOptions.map((p) => (
                  <label
                    key={p._id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={comboProductIds.includes(p._id)}
                      onChange={() => toggleProduct(p._id)}
                      className="w-4 h-4"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
