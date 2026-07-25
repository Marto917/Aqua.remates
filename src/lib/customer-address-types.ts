export const MAX_CUSTOMER_ADDRESSES = 5;

export type CustomerAddressDTO = {
  id: string;
  label: string | null;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string | null;
  isDefault: boolean;
};
