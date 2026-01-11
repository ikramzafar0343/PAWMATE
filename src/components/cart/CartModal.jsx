import React, { useEffect, useState } from 'react';
import { FiX, FiShoppingCart, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { getCart, removeFromCart, clearCart, updateQuantity } from '../../utils/cartStore';

const CartModal = ({ onClose, onCheckout }) => {
  const [items, setItems] = useState(getCart());

  useEffect(() => {
    const handleUpdate = () => setItems(getCart());
    window.addEventListener('cartUpdate', handleUpdate);
    return () => window.removeEventListener('cartUpdate', handleUpdate);
  }, []);

  const total = items.reduce((sum, i) => {
    const priceNum = parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0;
    return sum + priceNum * (i.quantity || 1);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-end">
      <div className="bg-white w-full max-w-md h-full md:h-[90vh] md:mt-4 md:mb-4 md:mr-4 rounded-none md:rounded-xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiShoppingCart className="text-gray-700" />
            <h3 className="font-bold text-gray-900">Your Cart</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <FiX className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-12">Your cart is empty</div>
          )}
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3 flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.price}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                    >
                      <FiMinus />
                    </button>
                    <span className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm">
                      {item.quantity || 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {(() => {
                      const priceNum = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                      return `$${(priceNum * (item.quantity || 1)).toFixed(2)}`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => clearCart()}
              className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={onCheckout}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
              disabled={items.length === 0}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
