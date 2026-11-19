import React, { useState, useEffect } from 'react';
import {
  Sprout, ShoppingCart, Package, Truck, Search, CheckCircle2,
  PlusCircle, MapPin, ShieldCheck, X, Plus, Minus, Navigation,
  Leaf, Award, User, LogIn, LogOut, Home, Wifi, WifiOff, AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const createCustomIcon = (bgColor, emoji) =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color:${bgColor};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const farmIcon = createCustomIcon('#059669', '🌾');
const hubIcon = createCustomIcon('#d97706', '🏭');
const truckIcon = createCustomIcon('#2563eb', '🚚');
const homeIcon = createCustomIcon('#dc2626', '🏡');

const FALLBACK_BATCHES = [
  {
    id: 'BATCH-20261119-TOM',
    crop: 'Heirloom Organic Tomatoes',
    category: 'Vegetables',
    farmer: 'Patil Organic Farms',
    location: 'Nashik, Maharashtra',
    coords: '19.9975° N, 73.7898° E',
    quantityKg: 140,
    pricePerKg: 48,
    harvestDate: '2026-11-19',
    qualityGrade: 'Grade A Organic',
    status: 'Dispatched',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'BATCH-20261119-MILK',
    crop: 'A2 Desi Cow Milk (1L)',
    category: 'Dairy',
    farmer: 'Gokul Dairy Hub',
    location: 'Dhule, Maharashtra',
    coords: '20.9042° N, 74.7749° E',
    quantityKg: 50,
    pricePerKg: 75,
    harvestDate: '2026-11-19',
    qualityGrade: '100% Grass-Fed',
    status: 'Packed',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'BATCH-20261119-WHEAT',
    crop: 'Lokwan Organic Wheat',
    category: 'Grains',
    farmer: 'Shirpur Agro Producers',
    location: 'Shirpur, Maharashtra',
    coords: '21.3500° N, 74.8833° E',
    quantityKg: 250,
    pricePerKg: 42,
    harvestDate: '2026-11-19',
    qualityGrade: 'Stone-Ground Certified',
    status: 'Harvested',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'BATCH-20261119-SPIC',
    crop: 'Byadagi Kashmiri Chilli Powder',
    category: 'Spices',
    farmer: 'Konkan Spice Guild',
    location: 'Kolhapur, Maharashtra',
    coords: '16.7050° N, 74.2433° E',
    quantityKg: 30,
    pricePerKg: 220,
    harvestDate: '2026-11-19',
    qualityGrade: 'Sun-Dried Pure',
    status: 'Dispatched',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80'
  }
];

export default function App() {
  const [activePortal, setActivePortal] = useState('customer');
  const [batches, setBatches] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  // Real JWT Authentication State persisted in localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('krishidirect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('krishidirect_token') || null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'Customer' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Home Delivery Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || '',
    phone: '+91 98765 43210',
    street: 'Main Road, Near RCPIT Campus',
    city: 'Shirpur, Dhule',
    pincode: '425405',
    paymentMethod: 'UPI / Google Pay'
  });

  const [orders, setOrders] = useState([
    {
      id: 'ORD-9042',
      customerName: 'Chetan Patil',
      items: 'Heirloom Organic Tomatoes (2 units)',
      total: 96,
      batchCode: 'BATCH-20261119-TOM',
      status: 'In Transit',
      address: 'Shirpur, Maharashtra (425405)'
    }
  ]);

  const [traceQuery, setTraceQuery] = useState('BATCH-20261119-TOM');
  const [tracedBatch, setTracedBatch] = useState(null);

  // Sync Batches & Orders from FastAPI Backend on Load
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/batches`);
        if (!res.ok) throw new Error('API offline');
        const data = await res.json();
        const activeList = data.length > 0 ? data : FALLBACK_BATCHES;
        setBatches(activeList);
        setTracedBatch(activeList[0]);
        setApiOnline(true);

        const ordersRes = await fetch(`${API_BASE_URL}/api/v1/orders`);
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.length > 0) setOrders(ordersData);
        }
      } catch (err) {
        setBatches(FALLBACK_BATCHES);
        setTracedBatch(FALLBACK_BATCHES[0]);
        setApiOnline(false);
      }
    };
    fetchBackendData();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setAddressForm((prev) => ({ ...prev, fullName: user.name }));
    }
  }, [user]);

  const addToCart = (batch) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === batch.id);
      if (existing) {
        return prev.map((item) => item.id === batch.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...batch, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  // Real Backend Login / Signup Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/signup';
    const payload = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : { name: authForm.name, email: authForm.email, password: authForm.password, role: authForm.role };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      setUser(data.user);
      setToken(data.access_token);
      localStorage.setItem('krishidirect_user', JSON.stringify(data.user));
      localStorage.setItem('krishidirect_token', data.access_token);
      setIsAuthOpen(false);
      setAuthForm({ name: '', email: '', password: '', role: 'Customer' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('krishidirect_user');
    localStorage.removeItem('krishidirect_token');
    setActivePortal('customer');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.pricePerKg * item.qty, 0);
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: addressForm.fullName,
      customerEmail: user?.email || 'guest@krishidirect.in',
      items: cart.map((i) => `${i.crop} (${i.qty} units)`).join(', '),
      total,
      batchCode: cart[0].id,
      status: 'Processing at Farm',
      address: `${addressForm.street}, ${addressForm.city} - ${addressForm.pincode}`,
      paymentMethod: addressForm.paymentMethod
    };

    try {
      if (apiOnline) {
        await fetch(`${API_BASE_URL}/api/v1/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
        });
      }
    } catch (err) {
      console.error('Order sync error:', err);
    }

    setOrders([newOrder, ...orders]);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    alert(`Order ${newOrder.id} confirmed! Track it live in the Delivery Tracker below.`);
  };

  const handleTraceSearch = (e) => {
    e.preventDefault();
    const found = batches.find((b) => b.id.toLowerCase() === traceQuery.trim().toLowerCase());
    setTracedBatch(found || null);
  };

  const filteredBatches = selectedCategory === 'All' 
    ? batches 
    : batches.filter(b => b.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
      <header className="sticky top-0 z-40 bg-emerald-950 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 p-2 rounded-xl text-emerald-950">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">KrishiDirect</span>
              <span className={`ml-2.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                apiOnline ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-900/80 text-amber-200'
              }`}>
                {apiOnline ? <><Wifi className="w-3 h-3 text-emerald-400" /> Backend Connected</> : <><WifiOff className="w-3 h-3 text-amber-400" /> Offline Fallback</>}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-emerald-900 p-1 rounded-xl border border-emerald-800">
            <button
              onClick={() => setActivePortal('customer')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activePortal === 'customer' ? 'bg-emerald-500 text-emerald-950 shadow' : 'text-emerald-200 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Customer Store
            </button>
            <button
              onClick={() => setActivePortal('farmer')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activePortal === 'farmer' ? 'bg-amber-400 text-stone-950 shadow' : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Farmer & Admin Portal
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activePortal === 'customer' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-emerald-800 hover:bg-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-300" />
                <span>Basket</span>
                <span className="bg-amber-400 text-stone-950 text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((sum, i) => sum + i.qty, 0)}
                </span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 px-3 py-1.5 rounded-xl text-xs">
                <User className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <p className="font-bold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-emerald-300">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="ml-1.5 p-1 hover:bg-stone-700 rounded-lg text-stone-300 hover:text-red-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthError(''); setIsAuthOpen(true); }}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <LogIn className="w-4 h-4" /> Login / Signup
              </button>
            )}
          </div>
        </div>
      </header>

      {activePortal === 'customer' ? (
        <main className="flex-1">
          <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white py-14 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-700 px-3 py-1 rounded-full text-xs text-emerald-300 font-medium">
                  <Leaf className="w-3.5 h-3.5" /> Full-Stack Farm-to-Table Supply Chain
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                  Fresh Farm Produce & Pantry Staples Delivered to Your Home.
                </h1>
                <p className="text-emerald-100 text-base max-w-xl leading-relaxed">
                  Source pure dairy, farm-ground grains, organic spices, and vegetables with real-time FastAPI database sync and batch traceability.
                </p>
              </div>

              <div className="bg-white text-stone-900 p-6 rounded-2xl shadow-xl">
                <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-900 mb-1">
                  <Search className="w-5 h-5 text-emerald-600" /> Trace Your Produce Batch
                </h2>
                <p className="text-xs text-stone-500 mb-4">
                  Enter any Batch ID to verify farm origin & quality certification.
                </p>
                <form onSubmit={handleTraceSearch} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={traceQuery}
                    onChange={(e) => setTraceQuery(e.target.value)}
                    placeholder="e.g., BATCH-20261119-MILK"
                    className="flex-1 px-3.5 py-2 border border-stone-300 rounded-xl text-sm font-mono outline-none"
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    Verify
                  </button>
                </form>

                {tracedBatch ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                        {tracedBatch.id}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> {tracedBatch.qualityGrade}
                      </span>
                    </div>
                    <p className="font-bold text-stone-900 text-base">{tracedBatch.crop}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 pt-1">
                      <p><strong>Category:</strong> {tracedBatch.category}</p>
                      <p><strong>Producer:</strong> {tracedBatch.farmer}</p>
                      <p><strong>Location:</strong> {tracedBatch.location}</p>
                      <p><strong>Harvested:</strong> {tracedBatch.harvestDate}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">Batch ID not found.</p>
                )}
              </div>
            </div>
          </section>

          {/* Catalog Filter Tabs */}
          <section className="max-w-7xl mx-auto px-4 pt-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-stone-900">Explore Store Catalog</h2>
              <div className="flex flex-wrap gap-2">
                {['All', 'Vegetables', 'Dairy', 'Grains', 'Spices'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat 
                        ? 'bg-emerald-800 text-white shadow' 
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBatches.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="relative h-44 bg-stone-200">
                    <img src={item.image} alt={item.crop} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-emerald-950/85 text-white text-[11px] font-mono px-2.5 py-1 rounded-lg">
                      {item.id}
                    </span>
                    <span className="absolute top-3 right-3 bg-white/90 text-emerald-900 text-[11px] font-bold px-2 py-0.5 rounded-md shadow">
                      {item.category}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-amber-400 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {item.quantityKg} units left
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold mb-1">
                        <Award className="w-3.5 h-3.5" /> {item.qualityGrade}
                      </div>
                      <h3 className="font-bold text-lg text-stone-900">{item.crop}</h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {item.farmer} ({item.location})
                      </p>
                    </div>
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-extrabold text-stone-900">₹{item.pricePerKg}</span>
                        <span className="text-xs text-stone-500"> / unit</span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 py-12">
            <DeliveryTrackerSection orders={orders} />
          </section>
        </main>
      ) : (
        <FarmerAdminPortal batches={batches} setBatches={setBatches} apiOnline={apiOnline} />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl">
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" /> Your Basket
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 hover:bg-stone-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-10">Your basket is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-bold text-sm">{item.crop}</p>
                        <p className="text-xs font-semibold text-emerald-700">₹{item.pricePerKg} × {item.qty} units</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQty(item.id, -1)} className="p-1 bg-stone-100 rounded"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="p-1 bg-emerald-100 text-emerald-800 rounded"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between font-bold text-base">
                  <span>Total Payable</span>
                  <span>₹{cart.reduce((sum, i) => sum + i.pricePerKg * i.qty, 0)}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    if (!user) {
                      setAuthError('Please login or create an account to place a home delivery order.');
                      setIsAuthOpen(true);
                    } else {
                      setIsCheckoutOpen(true);
                    }
                  }} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition"
                >
                  {user ? 'Proceed to Home Delivery Checkout' : 'Login to Checkout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal with Home Delivery Address Form */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" /> Enter Home Delivery Address
            </h2>
            <form onSubmit={handlePlaceOrder} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">City / District</label>
                <input
                  type="text"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Payment Method</label>
                <select
                  value={addressForm.paymentMethod}
                  onChange={(e) => setAddressForm({ ...addressForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="UPI / Google Pay">📱 UPI / Google Pay / PhonePe</option>
                  <option value="Credit / Debit Card">💳 Credit / Debit Card</option>
                  <option value="Cash on Delivery (COD)">💵 Cash on Delivery (COD)</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow transition">
                  Confirm & Place Order (₹{cart.reduce((sum, i) => sum + i.pricePerKg * i.qty, 0)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real FastAPI JWT Login / Signup Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-stone-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">
                {authMode === 'login' ? 'Login to KrishiDirect' : 'Create Account'}
              </h2>
              <p className="text-xs text-stone-500">
                {apiOnline ? 'Authenticated securely via FastAPI JWT' : 'Start FastAPI backend to authenticate'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authMode === 'login' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] p-2.5 rounded-xl flex justify-between items-center">
                <span><strong>Demo Account:</strong> chetan@krishidirect.in / demo123</span>
                <button
                  type="button"
                  onClick={() => setAuthForm({ ...authForm, email: 'chetan@krishidirect.in', password: 'demo123' })}
                  className="bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-sm pt-1">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Chetan Sudhir Patil"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="chetan@krishidirect.in"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Account Role</label>
                  <select
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Customer">🛒 Customer / Buyer</option>
                    <option value="Farmer">🌾 Farmer / Producer</option>
                    <option value="Admin">⚙️ Operations Admin</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 text-white font-bold py-2.5 rounded-xl transition"
                >
                  {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Login' : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="text-center pt-2 border-t text-xs">
              {authMode === 'login' ? (
                <p className="text-stone-600">
                  Don't have an account?{' '}
                  <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="text-emerald-700 font-bold hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-stone-600">
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-emerald-700 font-bold hover:underline">
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FarmerAdminPortal({ batches, setBatches, apiOnline }) {
  const [form, setForm] = useState({
    crop: '',
    category: 'Vegetables',
    farmer: 'Patil Organic Farms',
    location: 'Nashik, Maharashtra',
    quantityKg: '',
    pricePerKg: '',
    qualityGrade: 'Grade A Organic'
  });

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!form.crop || !form.quantityKg || !form.pricePerKg) return;

    const today = new Date().toISOString().split('T')[0];
    const prefix = form.category.toUpperCase().slice(0, 4);
    const newBatch = {
      id: `BATCH-${today.replace(/-/g, '')}-${prefix}-${Math.floor(10 + Math.random() * 89)}`,
      crop: form.crop,
      category: form.category,
      farmer: form.farmer,
      location: form.location,
      coords: '19.9975° N, 73.7898° E',
      quantityKg: parseFloat(form.quantityKg),
      pricePerKg: parseFloat(form.pricePerKg),
      harvestDate: today,
      qualityGrade: form.qualityGrade,
      status: 'Harvested',
      image: form.category === 'Dairy' 
        ? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
        : form.category === 'Grains'
        ? 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'
        : form.category === 'Spices'
        ? 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    };

    try {
      if (apiOnline) {
        const res = await fetch(`${API_BASE_URL}/api/v1/batches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBatch)
        });
        if (!res.ok) throw new Error('Failed to save batch to database');
      }
      setBatches([newBatch, ...batches]);
      setForm({
        crop: '',
        category: 'Vegetables',
        farmer: 'Patil Organic Farms',
        location: 'Nashik, Maharashtra',
        quantityKg: '',
        pricePerKg: '',
        qualityGrade: 'Grade A Organic'
      });
      alert(`Successfully saved ${newBatch.crop} (${newBatch.category})!`);
    } catch (err) {
      alert('Failed to sync with backend database.');
    }
  };

  const cycleStatus = async (id, nextStatus) => {
    try {
      if (apiOnline) {
        await fetch(`${API_BASE_URL}/api/v1/batches/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
      }
      setBatches(batches.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)));
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-8 flex-1">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Farmer & Admin Inventory Portal</h1>
        <p className="text-sm text-stone-500">Add new items across Vegetables, Dairy, Grains, and Spices synced directly with FastAPI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" /> Add New Store Item
          </h2>
          <form onSubmit={handleAddItem} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Select Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-900"
              >
                <option value="Vegetables">🥕 Vegetables</option>
                <option value="Dairy">🥛 Dairy Products</option>
                <option value="Grains">🌾 Grains & Pulses</option>
                <option value="Spices">🌶️ Spices & Condiments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Organic Turmeric Powder, Basmati Rice"
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Quantity Available</label>
                <input
                  type="number"
                  required
                  placeholder="50"
                  value={form.quantityKg}
                  onChange={(e) => setForm({ ...form, quantityKg: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Price (₹ / unit)</label>
                <input
                  type="number"
                  required
                  placeholder="120"
                  value={form.pricePerKg}
                  onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Producer / Farmer Name</label>
              <input
                type="text"
                value={form.farmer}
                onChange={(e) => setForm({ ...form, farmer: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Quality Certification</label>
              <input
                type="text"
                value={form.qualityGrade}
                onChange={(e) => setForm({ ...form, qualityGrade: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
              <CheckCircle2 className="w-4 h-4" /> Publish Item to Store
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Manage Inventory & Batches ({batches.length})</h2>
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs uppercase text-stone-600">
              <tr>
                <th className="p-3">Batch Code</th>
                <th className="p-3">Item & Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 font-mono text-xs font-bold text-emerald-800">{b.id}</td>
                  <td className="p-3">
                    <p className="font-bold text-stone-900">{b.crop}</p>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">{b.category}</span>
                  </td>
                  <td className="p-3 font-semibold">{b.quantityKg} units</td>
                  <td className="p-3"><span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">{b.status}</span></td>
                  <td className="p-3">
                    {b.status === 'Harvested' && <button onClick={() => cycleStatus(b.id, 'Packed')} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">Mark Packed</button>}
                    {b.status === 'Packed' && <button onClick={() => cycleStatus(b.id, 'Dispatched')} className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700">Dispatch Van</button>}
                    {b.status === 'Dispatched' && <span className="text-xs text-emerald-700 font-semibold">In Transit</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function DeliveryTrackerSection({ orders }) {
  const activeOrder = orders[0];
  const waypoints = [
    { name: 'Producer Farm / Dairy (Nashik)', coords: [19.9975, 73.7898], type: 'farm' },
    { name: 'Sorting Hub (Igatpuri)', coords: [19.6967, 73.5608], type: 'hub' },
    { name: 'Local Node', coords: [19.2183, 72.9781], type: 'hub' },
    { name: 'Customer Home (Delivery Destination)', coords: [19.0760, 72.8777], type: 'home' }
  ];
  const polylineCoords = waypoints.map((w) => w.coords);
  const [progress, setProgress] = useState(65);
  const [truckPos, setTruckPos] = useState(waypoints[0].coords);

  useEffect(() => {
    const totalSegments = polylineCoords.length - 1;
    const scaled = (progress / 100) * totalSegments;
    const idx = Math.min(Math.floor(scaled), totalSegments - 1);
    const factor = scaled - idx;
    const start = polylineCoords[idx];
    const end = polylineCoords[idx + 1];
    setTruckPos([start[0] + (end[0] - start[0]) * factor, start[1] + (end[1] - start[1]) * factor]);
  }, [progress]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="bg-emerald-950 text-white p-5 flex justify-between items-center flex-wrap gap-2">
        <div>
          <span className="bg-emerald-800 text-emerald-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded">{activeOrder.id}</span>
          <h2 className="text-xl font-bold mt-1 flex items-center gap-2"><Truck className="text-emerald-400" /> Live Home Delivery & GPS Tracker</h2>
        </div>
        <div className="text-right text-xs">
          <p className="text-emerald-300 font-medium">Delivery Address:</p>
          <p className="text-white font-bold">{activeOrder.address || 'Shirpur, Maharashtra'}</p>
        </div>
      </div>
      <div className="h-80 w-full relative z-0">
        <MapContainer center={[19.52, 73.32]} zoom={8} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={polylineCoords} color="#059669" weight={5} dashArray="8, 8" />
          {waypoints.map((pt, i) => (
            <Marker key={i} position={pt.coords} icon={pt.type === 'farm' ? farmIcon : pt.type === 'home' ? homeIcon : hubIcon}>
              <Popup><p className="font-bold text-xs">{pt.name}</p></Popup>
            </Marker>
          ))}
          <Marker position={truckPos} icon={truckIcon}><Popup><p className="font-bold text-xs">Cold-Chain Home Delivery Van</p></Popup></Marker>
        </MapContainer>
      </div>
      <div className="p-5 bg-stone-50 border-t">
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="flex items-center gap-1.5"><Navigation className="w-4 h-4 text-emerald-600" /> Slide to Simulate Home Delivery Progress</span>
          <span className="text-emerald-700 font-bold">{progress}%</span>
        </div>
        <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-emerald-600" />
      </div>
    </div>
  );
}
