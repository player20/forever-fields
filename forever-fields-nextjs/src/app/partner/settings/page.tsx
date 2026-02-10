"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Save, Key, Mail, Building, Globe, AlertCircle } from "lucide-react";

export default function PartnerSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Demo partner data
  const partner = {
    name: "FlowerCo",
    email: "orders@flowerco.com",
    contactName: "John Smith",
    phone: "+1 (555) 123-4567",
    website: "https://flowerco.com",
    address: "123 Flower Lane, Garden City, CA 90210",
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your partner account settings</p>
      </div>

      {/* Business Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-sage-pale flex items-center justify-center">
            <Building className="w-5 h-5 text-sage" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Business Information</h2>
            <p className="text-sm text-gray-500">Your company details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <Input defaultValue={partner.name} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <Input defaultValue={partner.contactName} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input defaultValue={partner.email} type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input defaultValue={partner.phone} type="tel" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input defaultValue={partner.website} className="pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Address
            </label>
            <Input defaultValue={partner.address} />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gold-pale flex items-center justify-center">
            <Mail className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">How you receive order notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
            <span className="text-gray-700">Email notifications for new orders</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
            <span className="text-gray-700">Daily order summary</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
            <span className="text-gray-700">SMS notifications for urgent orders</span>
          </label>
        </div>
      </Card>

      {/* API Key */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-coral-pale flex items-center justify-center">
            <Key className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">API Integration</h2>
            <p className="text-sm text-gray-500">Your API key for webhook integrations</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="flex gap-2">
              <Input
                defaultValue="ff_partner_test_flowerco_******"
                readOnly
                className="font-mono bg-gray-50"
              />
              <Button variant="outline">Reveal</Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use this key to authenticate API requests
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL (optional)
            </label>
            <Input
              placeholder="https://your-server.com/api/orders"
              defaultValue=""
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send order notifications to this URL
            </p>
          </div>
        </div>
      </Card>

      {/* Demo Mode Notice */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Demo Mode</p>
            <p className="text-sm text-yellow-700">
              This is a demo partner portal. Changes will not be saved in demo mode.
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {saved && (
          <p className="text-green-600 text-sm self-center">Changes saved!</p>
        )}
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
