import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, Calculator, Check, ArrowRight } from 'lucide-react';
import { getProducts, convertUom } from '../api';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Bộ tính toán quy đổi nhanh ĐVT
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUom, setSelectedUom] = useState<string>('');
  const [calcQuantity, setCalcQuantity] = useState<number>(1);
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts(search, category);
      setProducts(data);
      if (data.length > 0 && !selectedProduct) {
        setSelectedProduct(data[0]);
        setSelectedUom(data[0].uoms?.[0]?.uomName || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedProduct || !selectedUom) return;
    try {
      const res = await convertUom(selectedProduct.id, selectedUom, calcQuantity);
      setCalcResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedProduct && selectedUom) {
      handleCalculate();
    }
  }, [selectedProduct, selectedUom, calcQuantity]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên bánh kẹo, mã SKU, thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Tất cả ngành hàng</option>
            <option value="Bánh tươi / Bánh phủ sô-cô-la">Bánh tươi / Phủ sô-cô-la</option>
            <option value="Bánh quy giòn">Bánh quy giòn</option>
            <option value="Bánh bông lan / Bánh tươi">Bánh bông lan</option>
            <option value="Snack / Bimbim">Snack / Bimbim</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">
            Tổng số: <strong className="text-slate-800">{products.length}</strong> sản phẩm
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách Sản phẩm (2 Cột) */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl">Đang tải danh mục...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl">Không tìm thấy sản phẩm nào.</div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p);
                  setSelectedUom(p.uoms?.[p.uoms?.length - 1]?.uomName || p.uoms?.[0]?.uomName || '');
                }}
                className={`p-4 bg-white rounded-xl border transition cursor-pointer flex flex-col md:flex-row gap-4 ${
                  selectedProduct?.id === p.id
                    ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150'}
                  alt={p.name}
                  className="w-24 h-24 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">{p.brand} • {p.category}</div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{p.name}</h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {p.code} • Barcode: {p.barcode || 'N/A'}</div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      HSD: {p.shelfLifeDays} ngày
                    </span>
                  </div>

                  {/* Bảng Quy Cách Đóng Gói (UoM Conversion) */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-1.5">Bảng giá theo cấp đơn vị tính:</div>
                    <div className="flex flex-wrap gap-2">
                      {(p.uoms || []).map((u: any) => (
                        <div
                          key={u.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center space-x-2"
                        >
                          <span className="font-bold text-slate-800">{u.uomName}</span>
                          <span className="text-slate-400">({u.conversionFactor} {p.baseUom})</span>
                          <span className="font-bold text-amber-700 font-mono">{u.price.toLocaleString('vi-VN')}đ</span>
                          {u.isDefaultSaleUom && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">Mặc định</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cột 3: Bộ Máy Quy Đổi Đơn Vị Tính Tự Động */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-20">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-900 font-bold">
              <Calculator className="w-5 h-5 text-amber-600" />
              <span>Bộ Máy Quy Đổi ĐVT Bánh Kẹo</span>
            </div>

            {selectedProduct ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Sản phẩm đang chọn</label>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800">
                    {selectedProduct.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Đơn vị cơ sở nhỏ nhất: <strong className="text-slate-700">{selectedProduct.baseUom}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Đơn vị muốn bán</label>
                    <select
                      value={selectedUom}
                      onChange={(e) => setSelectedUom(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium"
                    >
                      {(selectedProduct.uoms || []).map((u: any) => (
                        <option key={u.id} value={u.uomName}>
                          {u.uomName} ({u.conversionFactor} {selectedProduct.baseUom})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                {calcResult && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 mt-4">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Kết Quả Quy Đổi Tự Động</div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Quy đổi kho:</span>
                      <span className="font-bold text-slate-900">
                        {calcQuantity} {calcResult.uomName} = <span className="text-amber-700 font-bold">{calcResult.baseQty}</span> {selectedProduct.baseUom}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Đơn giá {calcResult.uomName}:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {calcResult.unitPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Tổng thành tiền:</span>
                      <span className="text-base font-extrabold text-amber-700 font-mono">
                        {calcResult.totalPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  💡 <strong>Quy tắc FMCG:</strong> Khách mua lẻ 2 hộp hay 10 thùng thì kho luôn tự động trừ tồn theo Base UoM (<strong className="text-slate-800">{selectedProduct.baseUom}</strong>) để không bị lệch hàng tồn kho lẻ.
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">Vui lòng chọn 1 sản phẩm bên trái</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

