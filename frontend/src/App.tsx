import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Phone, Search, User, Menu, X, ChevronRight,
  ShieldCheck, Truck, Clock, Heart, BarChart3, Trash2,
  Plus, Minus, CreditCard, CheckCircle, MapPin, Filter, Star,
  Camera, Cpu, Zap, Shield, Globe, AlertCircle, LogIn, LayoutDashboard,
  Tag, Package, Settings, TrendingUp, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- Types ---

interface Product {
  id: number;
  name: string;
  price: number;
  brand: string;
  category: string;
  image_url: string;
  isNew?: boolean;
  specs: string[];
  stock: number;
  rating: number;
  reviews: number;
  variations?: string[];
}

interface CartItem extends Product {
  quantity: number;
  selectedVariation?: string;
}

interface UserData {
  name: string;
  email: string;
  address?: string;
  isGuest?: boolean;
  isAdmin?: boolean;
}

// --- Mock Data ---

const MOCK_PRODUCTS: Product[] = [
  {
    id: 102,
    name: "FRİSBY FC-2715B 300W MINI TOWER SİYAH KASA",
    price: 4500,
    brand: "Frisby",
    category: "Aksesuar",
    image_url: "/products/frisby-2715b.jpeg",
    isNew: true,
    specs: ["300W Güç Kaynağı", "Mini Tower"],
    stock: 5,
    rating: 4.5,
    reviews: 12,
    variations: ["Siyah", "Gri"]
  },
  {
    id: 103,
    name: "O-KAM 9MP LENS 3 KAMERA ULTRA HD 4G SOLAR AKILLI GÜVENLİK KAMERASI",
    price: 6500,
    brand: "O-Kam",
    category: "Solar Sistemler",
    image_url: "/products/okam-solar.jpeg",
    isNew: true,
    specs: ["9MP Ultra HD", "4G Sim Kart"],
    stock: 0, // Out of stock to test "Notify Me"
    rating: 4.9,
    reviews: 28
  },
  {
    id: 104,
    name: "O-KAM PLUSWR 4 LENS 4 KAMERALI WİFİ GÜVENLİK KAMERASI",
    price: 6000,
    brand: "O-Kam",
    category: "IP Kameralar",
    image_url: "/products/okam-pluswr.jpeg",
    isNew: true,
    specs: ["4 Lens", "WiFi Bağlantısı"],
    stock: 15,
    rating: 4.7,
    reviews: 45
  },
  {
    id: 105,
    name: "DAHUA 3+3 MP 2.8MM 50MT WİFİ IP DOME GÜVENLİK KAMERASI",
    price: 6000,
    brand: "Dahua",
    category: "IP Kameralar",
    image_url: "/products/dahua-dome.jpeg",
    specs: ["3+3 Çift Lens", "50m Gece Görüş"],
    stock: 8,
    rating: 4.6,
    reviews: 32,
    variations: ["2.8mm", "3.6mm"]
  },
  {
    id: 110,
    name: "XIAOMİ CAMERA CW100 DUAL - AKILLI ÇİFT LENSLİ GÜVENLİK KAMERASI",
    price: 5500,
    brand: "Xiaomi",
    category: "IP Kameralar",
    image_url: "/products/xiaomi-cw100.jpeg",
    specs: ["Çift Lens", "AI Takip"],
    stock: 30,
    rating: 4.8,
    reviews: 88
  }
];

// --- Sub-Components ---

const AdminPanel = () => (
  <div className="p-8 bg-gray-50 min-h-screen">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black text-[#0a192f] flex items-center gap-3"><LayoutDashboard className="text-cyan-500" /> YÖNETİM PANELİ</h1>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-bold text-sm">Hoş Geldin, Admin</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase mb-2">Toplam Satış</div>
          <div className="text-2xl font-black text-[#0a192f]">₺ 142.500</div>
          <div className="text-green-500 text-[10px] font-bold mt-2 flex items-center gap-1"><TrendingUp size={12}/> %12 Artış</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase mb-2">Siparişler</div>
          <div className="text-2xl font-black text-[#0a192f]">48</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase mb-2">Kritik Stok</div>
          <div className="text-2xl font-black text-red-500">3 Ürün</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-400 text-xs font-bold uppercase mb-2">İade Talepleri</div>
          <div className="text-2xl font-black text-orange-500">2 Yeni</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b font-bold flex justify-between items-center">
          <span>Son Siparişler</span>
          <button className="text-xs text-cyan-600">Tümünü Gör</button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black">
            <tr>
              <th className="p-4">Müşteri</th>
              <th className="p-4">Ürün</th>
              <th className="p-4">Tutar</th>
              <th className="p-4">Durum</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-4 font-bold text-[#0a192f]">Ahmet Yılmaz</td>
              <td className="p-4">Hikvision IP Kamera</td>
              <td className="p-4">3.850 ₺</td>
              <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">TAMAMLANDI</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CartDrawer = ({ isOpen, onClose, cart, updateQuantity, remove, total, onCheckout }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] overflow-hidden">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0a192f]/40 backdrop-blur-sm" />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col">
          <div className="p-6 border-b flex justify-between items-center bg-[#0a192f] text-white">
            <h2 className="text-xl font-black tracking-widest uppercase">SEPETİM</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart size={64} className="mb-4 opacity-20"/>
                <p className="font-bold">Sepetiniz boş!</p>
              </div>
            ) : (
              cart.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 object-contain bg-white rounded" />
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-[#0a192f] line-clamp-1">{item.name}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-black text-cyan-600">{item.price.toLocaleString('tr-TR')} ₺</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-white border rounded"><Minus size={12}/></button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-white border rounded"><Plus size={12}/></button>
                        <button onClick={() => remove(item.id)} className="ml-2 text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-gray-500 uppercase text-xs">TOPLAM</span>
              <span className="text-2xl font-black text-[#0a192f]">{total.toLocaleString('tr-TR')} ₺</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-[#0a192f] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-500/10">ÖDEMEYE GEÇ</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [compareList, setCompareList] = useState<number[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
    const saved = localStorage.getItem('bozdemir_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const addToCart = (product: Product, variation?: string) => {
    if (product.stock === 0) {
      setToast({ msg: "Stokta yok! Gelince haber vereceğiz.", type: 'error' });
      return;
    }
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id && p.selectedVariation === variation);
      if (existing) return prev.map(p => (p.id === product.id && p.selectedVariation === variation) ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { ...product, quantity: 1, selectedVariation: variation }];
    });
    setToast({ msg: "Ürün sepete eklendi!", type: 'success' });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const startCheckout = () => {
    setLoading(true);
    setTimeout(() => {
       setLoading(false);
       setCart([]);
       setIsCartOpen(false);
       setToast({ msg: "Siparişiniz Alındı! Teşekkürler.", type: 'success' });
    }, 2000);
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a192f]">
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-lg" />
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-white">
        
        {/* Modern Header */}
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="bg-[#0a192f] text-white/50 text-[10px] py-1.5 hidden md:block">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center font-bold">
              <div className="flex gap-6 uppercase tracking-widest">
                <Link to="/kargo-takip" className="hover:text-cyan-400 flex items-center gap-1"><Truck size={12}/> Kargo Takip</Link>
                <Link to="/destek" className="hover:text-cyan-400 flex items-center gap-1"><Clock size={12}/> 7/24 Teknik Destek</Link>
              </div>
              <div className="flex gap-6 uppercase tracking-widest">
                 {user?.isAdmin && <Link to="/admin" className="text-cyan-400">Yönetim Paneli</Link>}
                 <a href="tel:05423487412" className="hover:text-cyan-400">0542 348 7412</a>
              </div>
            </div>
          </div>
          <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0a192f] rounded flex items-center justify-center text-cyan-400 font-black text-xl">B</div>
              <div className="font-black text-lg text-[#0a192f]">BOZDEMİR <span className="text-cyan-600 block text-[9px] tracking-[0.2em] font-bold">BİLİŞİM</span></div>
            </Link>
            <div className="flex items-center gap-4">
              <div onClick={() => setIsCartOpen(true)} className="relative cursor-pointer bg-gray-50 p-3 rounded-full hover:bg-cyan-500 hover:text-white transition-all">
                <ShoppingCart size={22} />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
              </div>
              {!user ? (
                <button onClick={() => setIsAuthOpen(true)} className="bg-[#0a192f] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-cyan-600 transition-all"><User size={18}/> Giriş</button>
              ) : (
                <div className="flex items-center gap-3 font-bold text-[#0a192f] text-sm group relative">
                   {user.name} <User size={20}/>
                   <div className="absolute top-full right-0 mt-2 bg-white shadow-xl border rounded-lg p-2 hidden group-hover:block w-32">
                      <button onClick={() => setUser(null)} className="w-full text-left p-2 text-red-500 hover:bg-red-50 rounded">Çıkış Yap</button>
                   </div>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* Floating Comparison Bar */}
        <AnimatePresence>
          {compareList.length > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0a192f] text-white p-4 flex justify-center items-center gap-8 border-t border-cyan-500/30">
               <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{compareList.length} Ürün Seçildi</span>
               <button className="bg-cyan-500 text-[#0a192f] px-6 py-2 rounded font-black text-xs uppercase">Kıyasla</button>
               <button onClick={() => setCompareList([])} className="text-xs text-white/50">Temizle</button>
            </motion.div>
          )}
        </AnimatePresence>

        <CartDrawer 
          isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} 
          cart={cart} updateQuantity={updateQuantity} 
          remove={removeFromCart} total={subTotal} 
          onCheckout={startCheckout}
        />

        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={
            <main>
              {/* Hero */}
              <div className="bg-[#0a192f] py-32 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <h1 className="text-6xl font-black mb-6">GÜVENLİĞİN <span className="text-cyan-400">YENİ ADI.</span></h1>
                <p className="text-white/40 max-w-xl mx-auto mb-10">Profesyonel güvenlik sistemlerinde Erzincan'ın lider teknoloji çözüm ortağı.</p>
                <div className="flex justify-center gap-4">
                  <button className="bg-cyan-500 text-[#0a192f] px-10 py-4 rounded-xl font-black uppercase shadow-xl shadow-cyan-500/20">Ürünleri Keşfet</button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {MOCK_PRODUCTS.map(product => (
                    <div key={product.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-2xl transition-all group flex flex-col relative">
                      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => toggleFavorite(product.id)} className={`p-2 rounded-full shadow-sm bg-white ${favorites.includes(product.id) ? 'text-red-500' : 'text-gray-300'}`}><Heart size={16} fill={favorites.includes(product.id) ? "currentColor" : "none"}/></button>
                         <button onClick={() => setCompareList([...compareList, product.id])} className="p-2 rounded-full shadow-sm bg-white text-gray-300 hover:text-cyan-500"><BarChart3 size={16}/></button>
                      </div>

                      <div className="aspect-square bg-gray-50 rounded-xl mb-6 flex items-center justify-center p-6 relative">
                         {product.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-black text-red-500 text-xs uppercase backdrop-blur-[1px]">TÜKENDİ</div>}
                         <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                      </div>

                      <div className="flex items-center gap-1 mb-2 text-yellow-400"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><span className="text-gray-300 text-[10px] ml-1">({product.reviews})</span></div>
                      <h3 className="font-bold text-[#0a192f] text-sm mb-4 line-clamp-2 h-10">{product.name}</h3>
                      
                      {product.variations && (
                        <div className="flex gap-2 mb-4">
                           {product.variations.map(v => (
                             <button key={v} className="text-[10px] border px-2 py-0.5 rounded hover:border-cyan-500 font-bold text-gray-400">{v}</button>
                           ))}
                        </div>
                      )}

                      <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xl font-black text-[#0a192f]">{product.price.toLocaleString('tr-TR')} ₺</span>
                        <button onClick={() => addToCart(product)} className={`p-2 rounded-lg transition-all ${product.stock === 0 ? 'bg-gray-200 text-gray-400' : 'bg-[#0a192f] text-white hover:bg-cyan-600'}`}><Plus size={20}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          } />
        </Routes>

        <footer className="bg-[#0a192f] py-20 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest border-t border-white/5">
           <div className="max-w-7xl mx-auto px-4">
             <div className="text-white text-xl font-black mb-4 tracking-tighter">BOZDEMİR <span className="text-cyan-400 italic">BİLİŞİM</span></div>
             <p className="mb-8">© 2026 Bozdemir Bilişim Güvenlik Teknolojileri Ltd. Şti.</p>
             <div className="flex justify-center gap-8 items-center text-white/50">
                <div className="flex items-center gap-2"><ShieldCheck size={16}/> 256-Bit SSL</div>
                <div className="flex items-center gap-2"><CreditCard size={16}/> 3D Secure</div>
                <div className="flex items-center gap-2"><Truck size={16}/> Aynı Gün Kargo</div>
             </div>
           </div>
        </footer>

        {/* Global Toast */}
        <AnimatePresence>
           {toast && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 bg-[#0a192f] text-cyan-400 border border-cyan-500/30">
                <span className="font-bold text-sm">{toast.msg}</span>
             </motion.div>
           )}
        </AnimatePresence>

      </div>
    </Router>
  );
}

export default App;
