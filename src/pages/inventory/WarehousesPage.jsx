import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  User,
  Star,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { INDIAN_STATES } from '../../constants/units';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { formatNumber } from '../../utils/formatters';

export function WarehousesPage() {
  const {
    warehouses,
    isLoadingWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  } = useInventory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [deleteConfirmWh, setDeleteConfirmWh] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    address: '',
    capacityTons: 10000,
    isDefault: false,
  });

  const handleOpenAdd = () => {
    setEditingWh(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      address: '',
      capacityTons: 10000,
      isDefault: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (wh) => {
    setEditingWh(wh);
    setFormData({
      name: wh.name,
      contactPerson: wh.contactPerson,
      phone: wh.phone,
      city: wh.city,
      state: wh.state,
      pincode: wh.pincode,
      address: wh.address,
      capacityTons: wh.capacityTons || 10000,
      isDefault: wh.isDefault || false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingWh) {
      await updateWarehouse({ id: editingWh.id, updates: formData });
    } else {
      await createWarehouse(formData);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/inventory">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Warehouse & Logistics Yards
            </h1>
            <p className="text-xs text-slate-500">
              Manage physical distribution hubs, storage yards, and regional material depots
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={Plus}>
          Add Warehouse
        </Button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{wh.name}</h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {wh.city}, {wh.state}
                    </span>
                  </div>
                </div>

                {wh.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Default
                  </span>
                )}
              </div>

              <div className="py-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{wh.contactPerson}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{wh.phone}</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-tight text-slate-500">
                    {wh.address}, PIN: {wh.pincode}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 mt-2 flex justify-between text-[11px]">
                  <span className="text-slate-500">Capacity:</span>
                  <span className="font-bold text-slate-900">
                    {formatNumber(wh.capacityTons)} Metric Tons
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEdit(wh)}
                leftIcon={Edit2}
              >
                Edit
              </Button>

              {!wh.isDefault && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmWh(wh)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Delete Warehouse"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWh ? 'Edit Warehouse Depot' : 'Add New Warehouse Hub'}
        subtitle="Manage dispatch point address and manager contact details"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingWh ? 'Save Updates' : 'Add Warehouse Hub'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input
            label="Warehouse / Yard Name"
            placeholder="e.g. Bhiwandi Central Logistics Yard"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Manager Contact Person"
              placeholder="e.g. Suresh Patil"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              required
            />

            <Input
              label="Dispatch Phone Number"
              placeholder="+91 98201 11223"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="State"
              options={INDIAN_STATES}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />

            <Input
              label="City"
              placeholder="Bhiwandi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />

            <Input
              label="PIN Code"
              placeholder="421302"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Complete Yard Address"
            rows={2}
            placeholder="Plot / Logistics Park Road..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <Input
            label="Total Yard Storage Capacity (Metric Tons)"
            type="number"
            value={formData.capacityTons}
            onChange={(e) => setFormData({ ...formData, capacityTons: Number(e.target.value) })}
          />

          <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            Set as Default Material Dispatch Warehouse
          </label>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirmWh && (
        <ConfirmationDialog
          isOpen={Boolean(deleteConfirmWh)}
          onClose={() => setDeleteConfirmWh(null)}
          onConfirm={async () => {
            await deleteWarehouse(deleteConfirmWh.id);
            setDeleteConfirmWh(null);
          }}
          title="Delete Warehouse"
          message={`Are you sure you want to remove "${deleteConfirmWh.name}"? Products assigned to this warehouse will need to be reallocated.`}
          confirmText="Delete Warehouse"
          variant="danger"
        />
      )}
    </div>
  );
}
