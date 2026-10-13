import React, { useState, useEffect } from 'react';
import { INDIAN_STATES } from '../../constants/units';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';

export function CustomerFormModal({ isOpen, onClose, customer, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    mobile: '',
    email: '',
    gstin: '',
    billingAddress: '',
    deliveryAddress: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    status: 'Active',
    creditLimit: 5000000,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        companyName: customer.companyName || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        gstin: customer.gstin || '',
        billingAddress: customer.billingAddress || '',
        deliveryAddress: customer.deliveryAddress || '',
        city: customer.city || '',
        district: customer.district || '',
        state: customer.state || 'Maharashtra',
        pincode: customer.pincode || '',
        status: customer.status || 'Active',
        creditLimit: customer.creditLimit || 5000000,
      });
    } else {
      setFormData({
        name: '',
        companyName: '',
        mobile: '',
        email: '',
        gstin: '',
        billingAddress: '',
        deliveryAddress: '',
        city: '',
        district: '',
        state: 'Maharashtra',
        pincode: '',
        status: 'Active',
        creditLimit: 5000000,
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? `Edit Customer: ${customer.companyName}` : 'Enroll New Customer / Client Entity'}
      subtitle="Customer credentials and delivery sites for official label issuance and order booking"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {customer ? 'Save Changes' : 'Enroll Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Company / Enterprise Name"
            placeholder="e.g. Shapoorji Pallonji Infra Ltd"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />

          <Input
            label="Authorized Representative / Contact Person"
            placeholder="e.g. Rajesh Khosla"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            label="Mobile Phone Number"
            placeholder="+91 98200 11223"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            required
          />

          <Input
            label="Official Business Email"
            type="email"
            placeholder="purchase@spinfra.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="GSTIN (15-character Tax ID)"
            placeholder="e.g. 27AABCS1234F1Z9"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <Select
            label="State"
            options={INDIAN_STATES}
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />

          <Input
            label="District"
            placeholder="e.g. Thane"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            required
          />

          <Input
            label="City"
            placeholder="e.g. Navi Mumbai"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />

          <Input
            label="PIN Code"
            placeholder="e.g. 400705"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            required
          />
        </div>

        <Textarea
          label="Registered Billing Address"
          rows={2}
          placeholder="Corporate Office Building, Floor, Street..."
          value={formData.billingAddress}
          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
          required
        />

        <Textarea
          label="Primary Project Site Delivery Address (Appears on Product Labels)"
          rows={2}
          placeholder="Project Site Gate, Bay, Construction Plot Location..."
          value={formData.deliveryAddress}
          onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <Select
            label="Customer Account Status"
            options={[
              { value: 'Active', label: 'Active (Permitted for Label Generation & POs)' },
              { value: 'Inactive', label: 'Inactive (Temporarily Suspended)' },
              { value: 'Blocked', label: 'Blocked (Credit / Compliance Hold)' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          />

          <Input
            label="Credit Limit (₹)"
            type="number"
            value={formData.creditLimit}
            onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
          />
        </div>
      </form>
    </Modal>
  );
}
