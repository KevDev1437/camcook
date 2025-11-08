import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

const STORAGE_KEY = 'cart_items_v1';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // { key, id, name, price, quantity, image, options, pricing }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch (e) {
        console.log('Cart load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const normalizeOptionsForKey = (options) => {
    try {
      if (!options || typeof options !== 'object') return {};
      const out = {};
      // Toujours sérialiser dans un ordre de clés déterministe
      const acc = Array.isArray(options.accompagnements) ? [...options.accompagnements] : [];
      acc.sort((a, b) => String(a).localeCompare(String(b)));
      // Boisson peut venir en string, bool ou array (sécurise)
      let drink = null;
      if (Array.isArray(options.boisson)) {
        drink = options.boisson.includes('Bissap') ? 'Bissap' : options.boisson[0] || null;
      } else if (options.boisson === true) {
        drink = 'Bissap';
      } else if (typeof options.boisson === 'string') {
        drink = options.boisson;
      }
      // Construire un objet avec un ordre fixe de propriétés
      out.accompagnements = acc;
      out.boisson = drink || null;
      return out;
    } catch (_) {
      return {};
    }
  };

  const makeKey = (id, options) => {
    try {
      const norm = normalizeOptionsForKey(options);
      return `${id}::${JSON.stringify(norm)}`;
    } catch (_) {
      return String(id);
    }
  };

  const addItem = (item, quantity = 1) => {
    const { id, name, price, image, options, pricing } = item;
    const key = item.key || makeKey(id, options);
    setItems(prev => {
      const existing = prev.find(x => x.key === key);
      if (existing) {
        return prev.map(x => x.key === key ? { ...x, quantity: x.quantity + quantity } : x);
      }
      return [...prev, { key, id, name, price, image, options, pricing, quantity }];
    });
  };

  const increment = (key) => {
    setItems(prev => prev.map(x => x.key === key ? { ...x, quantity: x.quantity + 1 } : x));
  };

  const decrement = (key) => {
    setItems(prev => prev.flatMap(x => {
      if (x.key !== key) return [x];
      const q = x.quantity - 1;
      return q <= 0 ? [] : [{ ...x, quantity: q }];
    }));
  };

  const remove = (key) => setItems(prev => prev.filter(x => x.key !== key));
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((sum, x) => sum + x.quantity, 0), [items]);
  const total = useMemo(() => {
    return items.reduce((sum, x) => {
      const itemPrice = Number(x.price) || 0;
      const itemTotal = itemPrice * (x.quantity || 1);
      return sum + itemTotal;
    }, 0);
  }, [items]);

  const value = { items, loading, addItem, increment, decrement, remove, clear, count, total };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider');
  return ctx;
};

export { CartContext };
