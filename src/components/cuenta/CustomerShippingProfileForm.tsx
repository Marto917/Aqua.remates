"use client";

import { useState } from "react";

type Initial = {
  phone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingNotes: string;
};

type Props = {
  initial: Initial;
  action: (formData: FormData) => Promise<void>;
};

export function CustomerShippingProfileForm({ initial, action }: Props) {
  const [phone, setPhone] = useState(initial.phone);
  const [shippingAddress, setShippingAddress] = useState(initial.shippingAddress);
  const [shippingCity, setShippingCity] = useState(initial.shippingCity);
  const [shippingProvince, setShippingProvince] = useState(initial.shippingProvince);
  const [shippingPostalCode, setShippingPostalCode] = useState(initial.shippingPostalCode);
  const [shippingNotes, setShippingNotes] = useState(initial.shippingNotes);

  return (
    <form action={action} className="mt-6 space-y-3">
      <p className="text-sm font-medium text-slate-800">Datos de envío (se autocompletan al comprar)</p>
      <input
        name="phone"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Teléfono / WhatsApp"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <input
        name="shippingAddress"
        value={shippingAddress}
        onChange={(e) => setShippingAddress(e.target.value)}
        placeholder="Calle y número"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="shippingCity"
          value={shippingCity}
          onChange={(e) => setShippingCity(e.target.value)}
          placeholder="Ciudad"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          name="shippingProvince"
          value={shippingProvince}
          onChange={(e) => setShippingProvince(e.target.value)}
          placeholder="Provincia"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <input
        name="shippingPostalCode"
        value={shippingPostalCode}
        onChange={(e) => setShippingPostalCode(e.target.value)}
        placeholder="Código postal"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <textarea
        name="shippingNotes"
        value={shippingNotes}
        onChange={(e) => setShippingNotes(e.target.value)}
        placeholder="Referencias (piso, timbre, entre calles…)"
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="w-full rounded-full border border-brand py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand/5"
      >
        Guardar datos de envío
      </button>
    </form>
  );
}
