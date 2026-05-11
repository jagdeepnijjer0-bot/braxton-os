"use client";

import { useState, type ReactElement } from "react";

const tabs = ["Profile", "Workspace", "Integrations", "Notifications", "Billing"];

function ProfileSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
            JB
          </div>
          <div>
            <button className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
              Change Photo
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "First Name", value: "John" },
            { label: "Last Name", value: "Braxton" },
            { label: "Email", value: "john@braxton.co" },
            { label: "Phone", value: "+1 555-0100" },
            { label: "Job Title", value: "Founder & CEO" },
            { label: "Location", value: "San Francisco, CA" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
              <input
                type="text"
                defaultValue={field.value}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-3 max-w-sm">
          {["Current Password", "New Password", "Confirm New Password"].map((f) => (
            <div key={f}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f}</label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors mt-2">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Workspace Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Workspace Name", value: "Braxton HQ" },
            { label: "Workspace URL", value: "braxton.os.app" },
            { label: "Industry", value: "SaaS / Technology" },
            { label: "Company Size", value: "1–10 employees" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
              <input
                type="text"
                defaultValue={field.value}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Team Members</h3>
        <p className="text-sm text-gray-500 mb-4">Manage who has access to your workspace.</p>
        <div className="space-y-3">
          {[
            { name: "John Braxton", email: "john@braxton.co", role: "Admin" },
            { name: "Sarah Kim", email: "sarah@braxton.co", role: "Member" },
            { name: "Mike Reynolds", email: "mike@braxton.co", role: "Member" },
          ].map((m) => (
            <div key={m.email} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600">
                  <option>Admin</option>
                  <option>Member</option>
                  <option>Viewer</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Invite Team Member
        </button>
      </div>
    </div>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: "Gmail", desc: "Sync your emails and send from Braxton OS", connected: true, icon: "G" },
    { name: "Google Calendar", desc: "Sync meetings and schedule from deals", connected: true, icon: "C" },
    { name: "Slack", desc: "Get notifications and updates in Slack", connected: false, icon: "S" },
    { name: "HubSpot", desc: "Import and sync contacts from HubSpot", connected: false, icon: "H" },
    { name: "Stripe", desc: "Track payments and invoices", connected: false, icon: "St" },
    { name: "Zapier", desc: "Connect thousands of apps via Zapier", connected: false, icon: "Z" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Integrations</h3>
        <p className="text-sm text-gray-500 mt-0.5">Connect your tools to Braxton OS</p>
      </div>
      <div className="divide-y divide-gray-50">
        {integrations.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
                {integration.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                <p className="text-xs text-gray-500">{integration.desc}</p>
              </div>
            </div>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                integration.connected
                  ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {integration.connected ? "Connected" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const notifGroups = [
    {
      group: "Deals",
      items: [
        { label: "New deal created", email: true, push: true },
        { label: "Deal stage changed", email: true, push: false },
        { label: "Deal closed (won or lost)", email: true, push: true },
      ],
    },
    {
      group: "Inbox",
      items: [
        { label: "New email received", email: false, push: true },
        { label: "Reply received", email: true, push: true },
      ],
    },
    {
      group: "Outreach",
      items: [
        { label: "Campaign completed", email: true, push: false },
        { label: "High open rate alert", email: false, push: false },
      ],
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-end gap-8 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pr-1">
          <span>Email</span>
          <span>Push</span>
        </div>
        <div className="space-y-6">
          {notifGroups.map((g) => (
            <div key={g.group}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{g.group}</p>
              <div className="space-y-3">
                {g.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-8">
                      <input type="checkbox" defaultChecked={item.email} className="w-4 h-4 accent-indigo-600" />
                      <input type="checkbox" defaultChecked={item.push} className="w-4 h-4 accent-indigo-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Current Plan</h3>
            <p className="text-sm text-gray-500 mt-0.5">You are on the Pro plan</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">Pro</span>
        </div>
        <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-900">Pro — $49/month</span>
            <span className="text-xs text-indigo-600">Renews Jun 1, 2026</span>
          </div>
          <ul className="space-y-1">
            {["Up to 10 team members", "Unlimited contacts", "5 active campaigns", "CRM + Deal Tracker + Inbox"].map((f) => (
              <li key={f} className="text-sm text-indigo-700 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Upgrade to Business
          </button>
          <button className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancel Plan
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
        <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl">
          <div className="w-10 h-7 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
            VISA
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
            <p className="text-xs text-gray-500">Expires 12/27</p>
          </div>
          <button className="ml-auto text-sm text-indigo-600 font-medium hover:underline">Update</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Billing History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { date: "May 1, 2026", amount: "$49.00", status: "Paid" },
            { date: "Apr 1, 2026", amount: "$49.00", status: "Paid" },
            { date: "Mar 1, 2026", amount: "$49.00", status: "Paid" },
          ].map((inv) => (
            <div key={inv.date} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{inv.date}</p>
                <p className="text-xs text-gray-500">Pro plan — monthly</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">{inv.amount}</span>
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {inv.status}
                </span>
                <button className="text-xs text-indigo-600 hover:underline">PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sectionComponents: Record<string, ReactElement> = {
  Profile: <ProfileSection />,
  Workspace: <WorkspaceSection />,
  Integrations: <IntegrationsSection />,
  Notifications: <NotificationsSection />,
  Billing: <BillingSection />,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="max-w-3xl">
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {sectionComponents[activeTab]}
    </div>
  );
}
