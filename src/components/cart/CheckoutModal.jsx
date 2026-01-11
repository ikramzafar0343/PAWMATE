import React, { useState } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import { clearCart } from '../../utils/cartStore';

const CheckoutModal = ({ onClose }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    payment: 'cod',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [confirmed, setConfirmed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.payment === 'card') {
      const ok =
        form.cardName.trim() &&
        /^[0-9]{13,19}$/.test(form.cardNumber.replace(/\s+/g, '')) &&
        /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.cardExpiry) &&
        /^\d{3,4}$/.test(form.cardCvv);
      if (!ok) return;
    }
    setConfirmed(true);
    clearCart();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Checkout</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <FiX className="text-gray-600" />
          </button>
        </div>

        {!confirmed ? (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="px-3 py-2 border border-gray-200 rounded-lg" required />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="px-3 py-2 border border-gray-200 rounded-lg" required />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="px-3 py-2 border border-gray-200 rounded-lg" required />
              <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="px-3 py-2 border border-gray-200 rounded-lg md:col-span-2" required />
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="px-3 py-2 border border-gray-200 rounded-lg" required />
              <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="px-3 py-2 border border-gray-200 rounded-lg" required />
              <input name="zip" value={form.zip} onChange={handleChange} placeholder="ZIP" className="px-3 py-2 border border-gray-200 rounded-lg" required />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payment: 'cod' }))}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium ${form.payment === 'cod' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-700'}`}
              >
                Cash on Delivery
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payment: 'card' }))}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium ${form.payment === 'card' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-700'}`}
              >
                Card
              </button>
            </div>
            {form.payment === 'card' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="cardName"
                    value={form.cardName}
                    onChange={handleChange}
                    placeholder="Name on Card"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                  <input
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    placeholder="Card Number"
                    inputMode="numeric"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                  <input
                    name="cardExpiry"
                    value={form.cardExpiry}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                  <input
                    name="cardCvv"
                    value={form.cardCvv}
                    onChange={handleChange}
                    placeholder="CVV"
                    inputMode="numeric"
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
              Confirm Order
            </button>
          </form>
        ) : (
          <div className="p-8 flex flex-col items-center gap-2">
            <FiCheckCircle className="text-green-600 text-4xl" />
            <div className="font-bold text-gray-900">Order Confirmed</div>
            <div className="text-sm text-gray-500">You will receive a confirmation email shortly.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
