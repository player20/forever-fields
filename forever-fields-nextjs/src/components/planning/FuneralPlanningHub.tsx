"use client";

import { useState, useCallback, useMemo } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea } from "@/components/ui";

// ============================================
// TYPES & INTERFACES
// ============================================

type ServiceType =
  | "traditional_burial"
  | "cremation"
  | "green_burial"
  | "memorial_service"
  | "celebration_of_life"
  | "military_honors"
  | "religious_ceremony"
  | "direct_cremation"
  | "direct_burial";

type ReligiousAffiliation =
  | "none"
  | "catholic"
  | "protestant"
  | "jewish"
  | "muslim"
  | "hindu"
  | "buddhist"
  | "orthodox"
  | "lds"
  | "other";

type ChecklistCategory =
  | "immediate"
  | "within_days"
  | "before_service"
  | "day_of"
  | "after_service";

interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: "critical" | "high" | "medium" | "low";
  notes?: string;
  isCustom?: boolean;
  conditionalOn?: {
    serviceType?: ServiceType[];
    religion?: ReligiousAffiliation[];
    hasCondition?: string;
  };
}

interface Vendor {
  id: string;
  type: "funeral_home" | "florist" | "caterer" | "musician" | "officiant" | "transport" | "venue" | "other";
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  quote?: number;
  paid?: number;
  notes?: string;
  confirmed: boolean;
  contractUploaded?: boolean;
}

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  estimated: number;
  actual?: number;
  paid: boolean;
  vendorId?: string;
  notes?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  role?: string; // "Primary contact", "Pallbearer", etc.
  notified: boolean;
}

interface ServiceDetails {
  type: ServiceType;
  religion?: ReligiousAffiliation;
  date?: string;
  time?: string;
  venue?: string;
  venueAddress?: string;
  officiant?: string;
  expectedAttendees?: number;
  livestreamEnabled?: boolean;
  livestreamUrl?: string;
  receptionVenue?: string;
  receptionTime?: string;
  musicSelections?: string[];
  readings?: string[];
  eulogists?: string[];
  pallbearers?: string[];
  specialRequests?: string;
}

interface FuneralPlan {
  id: string;
  deceasedName: string;
  dateOfDeath?: string;
  dateOfBirth?: string;
  serviceDetails: ServiceDetails;
  checklist: ChecklistItem[];
  vendors: Vendor[];
  budget: BudgetItem[];
  familyMembers: FamilyMember[];
  documents: Array<{
    id: string;
    type: string;
    name: string;
    uploadedAt: Date;
    url?: string;
  }>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FuneralPlanningHubProps {
  deceasedName: string;
  initialPlan?: Partial<FuneralPlan>;
  onSave?: (plan: FuneralPlan) => void;
  currentUser?: string;
}

// ============================================
// CONSTANTS
// ============================================

const SERVICE_TYPES: Record<ServiceType, { label: string; icon: string; description: string }> = {
  traditional_burial: { label: "Traditional Burial", icon: "⚱️", description: "Full service with viewing, funeral, and burial" },
  cremation: { label: "Cremation with Service", icon: "🕯️", description: "Memorial service followed by cremation" },
  green_burial: { label: "Green/Natural Burial", icon: "🌿", description: "Eco-friendly burial without embalming" },
  memorial_service: { label: "Memorial Service", icon: "🙏", description: "Service without the body present" },
  celebration_of_life: { label: "Celebration of Life", icon: "🎉", description: "Uplifting tribute focusing on their life" },
  military_honors: { label: "Military Honors", icon: "🎖️", description: "Service with military funeral honors" },
  religious_ceremony: { label: "Religious Ceremony", icon: "⛪", description: "Traditional religious funeral rites" },
  direct_cremation: { label: "Direct Cremation", icon: "🔥", description: "Cremation without prior viewing or service" },
  direct_burial: { label: "Direct Burial", icon: "🪦", description: "Burial without prior viewing or service" },
};

const RELIGIONS: Record<ReligiousAffiliation, { label: string; specialNotes?: string }> = {
  none: { label: "No religious affiliation" },
  catholic: { label: "Catholic", specialNotes: "Mass, rosary vigil, specific prayers required" },
  protestant: { label: "Protestant/Christian", specialNotes: "Service style varies by denomination" },
  jewish: { label: "Jewish", specialNotes: "Burial typically within 24 hours, shiva period" },
  muslim: { label: "Muslim/Islamic", specialNotes: "Burial within 24 hours, body faces Mecca" },
  hindu: { label: "Hindu", specialNotes: "Cremation preferred, specific rituals required" },
  buddhist: { label: "Buddhist", specialNotes: "Cremation common, monks may lead chanting" },
  orthodox: { label: "Eastern Orthodox", specialNotes: "Open casket tradition, specific prayers" },
  lds: { label: "LDS/Mormon", specialNotes: "Temple clothing, family-led service" },
  other: { label: "Other" },
};

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id" | "completed">[] = [
  // Immediate (within hours)
  { category: "immediate", title: "Pronouncement of death", description: "Obtain official pronouncement from doctor or coroner", priority: "critical" },
  { category: "immediate", title: "Contact funeral home", description: "Arrange for body transportation", priority: "critical" },
  { category: "immediate", title: "Notify immediate family", description: "Call closest family members", priority: "critical" },
  { category: "immediate", title: "Locate important documents", description: "Will, insurance policies, pre-paid funeral plans", priority: "high" },
  { category: "immediate", title: "Secure the home", description: "If deceased lived alone, secure property and pets", priority: "high" },
  { category: "immediate", title: "Organ/tissue donation", description: "Contact organ donation organization if applicable", priority: "critical", conditionalOn: { hasCondition: "organDonor" } },

  // Within days
  { category: "within_days", title: "Obtain death certificates", description: "Order 10-15 certified copies from vital records", priority: "critical" },
  { category: "within_days", title: "Meet with funeral director", description: "Discuss service options, costs, and timeline", priority: "critical" },
  { category: "within_days", title: "Write obituary", description: "Prepare obituary for newspaper and online", priority: "high" },
  { category: "within_days", title: "Choose casket or urn", description: "Select from funeral home or third-party options", priority: "high" },
  { category: "within_days", title: "Select burial plot/niche", description: "If not pre-purchased, select cemetery location", priority: "high", conditionalOn: { serviceType: ["traditional_burial", "green_burial"] } },
  { category: "within_days", title: "Notify employer", description: "Contact HR about final paycheck, benefits, pension", priority: "high" },
  { category: "within_days", title: "Contact Social Security", description: "Report death, inquire about survivor benefits", priority: "high" },
  { category: "within_days", title: "Notify insurance companies", description: "Life insurance, health insurance, auto insurance", priority: "high" },
  { category: "within_days", title: "Contact VA for military honors", description: "Arrange honor guard, flag, bugler", priority: "high", conditionalOn: { serviceType: ["military_honors"] } },
  { category: "within_days", title: "Contact rabbi for arrangements", description: "Jewish burial customs require quick coordination", priority: "critical", conditionalOn: { religion: ["jewish"] } },
  { category: "within_days", title: "Contact imam for arrangements", description: "Islamic burial customs require quick coordination", priority: "critical", conditionalOn: { religion: ["muslim"] } },

  // Before service
  { category: "before_service", title: "Finalize service details", description: "Confirm date, time, venue, officiant", priority: "critical" },
  { category: "before_service", title: "Select readings and music", description: "Choose meaningful passages and songs", priority: "medium" },
  { category: "before_service", title: "Prepare eulogy", description: "Write or coordinate who will speak", priority: "high" },
  { category: "before_service", title: "Select pallbearers", description: "Ask 6-8 people to serve as pallbearers", priority: "medium", conditionalOn: { serviceType: ["traditional_burial"] } },
  { category: "before_service", title: "Order flowers", description: "Coordinate family flowers and arrangements", priority: "medium" },
  { category: "before_service", title: "Arrange catering", description: "Plan reception food and beverages", priority: "medium" },
  { category: "before_service", title: "Create memorial display", description: "Photo boards, slideshow, memory table", priority: "low" },
  { category: "before_service", title: "Print programs", description: "Order of service, photos, obituary", priority: "medium" },
  { category: "before_service", title: "Set up livestream", description: "Test equipment and share link with remote attendees", priority: "medium", conditionalOn: { hasCondition: "livestream" } },
  { category: "before_service", title: "Coordinate transportation", description: "Arrange limos, shuttles for family", priority: "low" },
  { category: "before_service", title: "Select burial clothing", description: "Choose outfit for the deceased", priority: "medium" },
  { category: "before_service", title: "Provide photo for casket", description: "Give funeral home a recent photo", priority: "low" },

  // Day of service
  { category: "day_of", title: "Arrive early to venue", description: "Be there 30-60 minutes before guests", priority: "high" },
  { category: "day_of", title: "Greet guests", description: "Welcome attendees, direct to sign-in book", priority: "medium" },
  { category: "day_of", title: "Coordinate with funeral director", description: "Confirm all arrangements are in place", priority: "high" },
  { category: "day_of", title: "Collect memorial cards/gifts", description: "Designate someone to gather items", priority: "low" },

  // After service
  { category: "after_service", title: "Send thank you notes", description: "Thank attendees, flower senders, helpers", priority: "medium" },
  { category: "after_service", title: "Pay final bills", description: "Settle accounts with all vendors", priority: "high" },
  { category: "after_service", title: "Close financial accounts", description: "Bank accounts, credit cards, investments", priority: "high" },
  { category: "after_service", title: "Cancel subscriptions", description: "Magazines, streaming services, memberships", priority: "low" },
  { category: "after_service", title: "Update property titles", description: "Car, house, other titled property", priority: "high" },
  { category: "after_service", title: "File for probate", description: "If required, begin probate process", priority: "high" },
  { category: "after_service", title: "Claim life insurance", description: "Submit death certificate and claim forms", priority: "high" },
  { category: "after_service", title: "File final tax return", description: "Due by April 15 of following year", priority: "medium" },
  { category: "after_service", title: "Order headstone/marker", description: "Design and order grave marker", priority: "low", conditionalOn: { serviceType: ["traditional_burial", "green_burial"] } },
];

const BUDGET_CATEGORIES = [
  { id: "funeral_home", label: "Funeral Home Services", typical: "2000-5000" },
  { id: "casket_urn", label: "Casket/Urn", typical: "500-10000" },
  { id: "cemetery", label: "Cemetery/Plot", typical: "1000-5000" },
  { id: "headstone", label: "Headstone/Marker", typical: "500-3000" },
  { id: "flowers", label: "Flowers", typical: "200-1000" },
  { id: "catering", label: "Catering/Reception", typical: "500-2000" },
  { id: "transportation", label: "Transportation", typical: "200-500" },
  { id: "officiant", label: "Officiant/Clergy", typical: "100-500" },
  { id: "music", label: "Music/Musicians", typical: "100-500" },
  { id: "programs", label: "Programs/Printing", typical: "50-200" },
  { id: "death_certificates", label: "Death Certificates", typical: "100-300" },
  { id: "obituary", label: "Obituary Publication", typical: "100-500" },
  { id: "other", label: "Other Expenses", typical: "varies" },
];

// ============================================
// COMPONENT
// ============================================

export function FuneralPlanningHub({
  deceasedName,
  initialPlan,
  onSave,
  currentUser = "You",
}: FuneralPlanningHubProps) {
  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState<"overview" | "checklist" | "vendors" | "budget" | "family" | "documents">("overview");
  const [showSetup, setShowSetup] = useState(!initialPlan?.serviceDetails?.type);

  const [plan, setPlan] = useState<FuneralPlan>(() => ({
    id: initialPlan?.id || `plan-${Date.now()}`,
    deceasedName,
    dateOfDeath: initialPlan?.dateOfDeath,
    dateOfBirth: initialPlan?.dateOfBirth,
    serviceDetails: initialPlan?.serviceDetails || {
      type: "traditional_burial",
    },
    checklist: initialPlan?.checklist || DEFAULT_CHECKLIST.map((item, i) => ({
      ...item,
      id: `item-${i}`,
      completed: false,
    })),
    vendors: initialPlan?.vendors || [],
    budget: initialPlan?.budget || BUDGET_CATEGORIES.map((cat, i) => ({
      id: `budget-${i}`,
      category: cat.id,
      description: cat.label,
      estimated: 0,
      paid: false,
    })),
    familyMembers: initialPlan?.familyMembers || [],
    documents: initialPlan?.documents || [],
    notes: initialPlan?.notes || "",
    createdAt: initialPlan?.createdAt || new Date(),
    updatedAt: new Date(),
  }));

  // Filter checklist based on service type and religion
  const filteredChecklist = useMemo(() => {
    return plan.checklist.filter((item) => {
      if (!item.conditionalOn) return true;

      const { serviceType, religion, hasCondition } = item.conditionalOn;

      if (serviceType && !serviceType.includes(plan.serviceDetails.type)) {
        return false;
      }

      if (religion && plan.serviceDetails.religion && !religion.includes(plan.serviceDetails.religion)) {
        return false;
      }

      if (hasCondition === "livestream" && !plan.serviceDetails.livestreamEnabled) {
        return false;
      }

      if (hasCondition === "organDonor") {
        // Always show organ donation reminder
        return true;
      }

      return true;
    });
  }, [plan.checklist, plan.serviceDetails]);

  // Calculate progress
  const checklistProgress = useMemo(() => {
    const completed = filteredChecklist.filter((item) => item.completed).length;
    const total = filteredChecklist.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [filteredChecklist]);

  // Calculate budget totals
  const budgetTotals = useMemo(() => {
    const estimated = plan.budget.reduce((sum, item) => sum + (item.estimated || 0), 0);
    const actual = plan.budget.reduce((sum, item) => sum + (item.actual || 0), 0);
    const paid = plan.budget.filter((item) => item.paid).reduce((sum, item) => sum + (item.actual || item.estimated || 0), 0);
    return { estimated, actual, paid, remaining: actual - paid };
  }, [plan.budget]);

  // Days until service
  const daysUntilService = useMemo(() => {
    if (!plan.serviceDetails.date) return null;
    const serviceDate = new Date(plan.serviceDetails.date);
    const today = new Date();
    const diff = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [plan.serviceDetails.date]);

  // ============================================
  // HANDLERS
  // ============================================

  const updateServiceDetails = useCallback((updates: Partial<ServiceDetails>) => {
    setPlan((prev) => ({
      ...prev,
      serviceDetails: { ...prev.serviceDetails, ...updates },
      updatedAt: new Date(),
    }));
  }, []);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setPlan((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date() : undefined,
              completedBy: !item.completed ? currentUser : undefined,
            }
          : item
      ),
      updatedAt: new Date(),
    }));
  }, [currentUser]);

  const _addCustomChecklistItem = useCallback((category: ChecklistCategory, title: string) => {
    setPlan((prev) => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        {
          id: `custom-${Date.now()}`,
          category,
          title,
          completed: false,
          priority: "medium" as const,
          isCustom: true,
        },
      ],
      updatedAt: new Date(),
    }));
  }, []);

  const assignChecklistItem = useCallback((itemId: string, assignedTo: string) => {
    setPlan((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === itemId ? { ...item, assignedTo } : item
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const addVendor = useCallback((vendor: Omit<Vendor, "id" | "confirmed">) => {
    setPlan((prev) => ({
      ...prev,
      vendors: [
        ...prev.vendors,
        { ...vendor, id: `vendor-${Date.now()}`, confirmed: false },
      ],
      updatedAt: new Date(),
    }));
  }, []);

  const updateVendor = useCallback((vendorId: string, updates: Partial<Vendor>) => {
    setPlan((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) =>
        v.id === vendorId ? { ...v, ...updates } : v
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const updateBudgetItem = useCallback((itemId: string, updates: Partial<BudgetItem>) => {
    setPlan((prev) => ({
      ...prev,
      budget: prev.budget.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const addFamilyMember = useCallback((member: Omit<FamilyMember, "id" | "notified">) => {
    setPlan((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { ...member, id: `family-${Date.now()}`, notified: false },
      ],
      updatedAt: new Date(),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(plan);
  }, [plan, onSave]);

  // ============================================
  // RENDER: SETUP WIZARD
  // ============================================

  if (showSetup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funeral Planning for {deceasedName}</CardTitle>
          <CardDescription>
            Let's set up the basic details to create your planning checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Service Type Selection */}
            <div>
              <h3 className="font-medium text-sage-dark mb-3">What type of service are you planning?</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(SERVICE_TYPES).map(([key, { label, icon, description }]) => (
                  <button
                    key={key}
                    onClick={() => updateServiceDetails({ type: key as ServiceType })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      plan.serviceDetails.type === key
                        ? "border-sage bg-sage-pale ring-2 ring-sage"
                        : "border-gray-200 hover:border-sage-light"
                    }`}
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-medium text-sage-dark">{label}</div>
                    <div className="text-xs text-gray-500 mt-1">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Religious Affiliation */}
            <div>
              <h3 className="font-medium text-sage-dark mb-3">Religious or cultural traditions?</h3>
              <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(RELIGIONS).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => updateServiceDetails({ religion: key as ReligiousAffiliation })}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      plan.serviceDetails.religion === key
                        ? "border-sage bg-sage-pale"
                        : "border-gray-200 hover:border-sage-light"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {plan.serviceDetails.religion && RELIGIONS[plan.serviceDetails.religion].specialNotes && (
                <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  Note: {RELIGIONS[plan.serviceDetails.religion].specialNotes}
                </p>
              )}
            </div>

            {/* Service Date */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date of Death</label>
                <Input
                  type="date"
                  value={plan.dateOfDeath || ""}
                  onChange={(e) => setPlan((prev) => ({ ...prev, dateOfDeath: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Planned Service Date</label>
                <Input
                  type="date"
                  value={plan.serviceDetails.date || ""}
                  onChange={(e) => updateServiceDetails({ date: e.target.value })}
                />
              </div>
            </div>

            {/* Special Circumstances */}
            <div>
              <h3 className="font-medium text-sage-dark mb-3">Any special circumstances?</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.serviceDetails.livestreamEnabled || false}
                    onChange={(e) => updateServiceDetails({ livestreamEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-sage focus:ring-sage"
                  />
                  <span className="text-sm">Will livestream for remote attendees</span>
                </label>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowSetup(false)}>
                Continue to Planning Hub →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER: MAIN HUB
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header with Overview */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl text-sage-dark">
                Planning for {deceasedName}
              </h1>
              <p className="text-gray-500">
                {SERVICE_TYPES[plan.serviceDetails.type].label}
                {plan.serviceDetails.religion && plan.serviceDetails.religion !== "none" &&
                  ` • ${RELIGIONS[plan.serviceDetails.religion].label}`}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Days until service */}
              {daysUntilService !== null && (
                <div className="text-center">
                  <div className={`text-3xl font-display ${daysUntilService <= 3 ? "text-red-500" : "text-sage-dark"}`}>
                    {daysUntilService}
                  </div>
                  <div className="text-xs text-gray-500">days until service</div>
                </div>
              )}

              {/* Progress */}
              <div className="text-center">
                <div className="text-3xl font-display text-sage-dark">
                  {checklistProgress.percentage}%
                </div>
                <div className="text-xs text-gray-500">tasks complete</div>
              </div>

              {/* Budget */}
              <div className="text-center">
                <div className="text-3xl font-display text-sage-dark">
                  ${budgetTotals.actual.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">total cost</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage transition-all duration-500"
              style={{ width: `${checklistProgress.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview", icon: "📋" },
          { id: "checklist", label: "Checklist", icon: "✓" },
          { id: "vendors", label: "Vendors", icon: "🏪" },
          { id: "budget", label: "Budget", icon: "💰" },
          { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
          { id: "documents", label: "Documents", icon: "📄" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-sage text-white"
                : "bg-sage-pale/50 text-sage-dark hover:bg-sage-pale"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="py-6">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Service Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sage-dark flex items-center gap-2">
                    <span>🗓️</span> Service Details
                  </h3>
                  <div className="bg-sage-pale/30 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium">{plan.serviceDetails.date || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <Input
                          type="time"
                          value={plan.serviceDetails.time || ""}
                          onChange={(e) => updateServiceDetails({ time: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Venue:</span>
                        <Input
                          value={plan.serviceDetails.venue || ""}
                          onChange={(e) => updateServiceDetails({ venue: e.target.value })}
                          placeholder="Church, funeral home, etc."
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Expected Attendees:</span>
                        <Input
                          type="number"
                          value={plan.serviceDetails.expectedAttendees || ""}
                          onChange={(e) => updateServiceDetails({ expectedAttendees: parseInt(e.target.value) })}
                          placeholder="Approximate number"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Urgent Items */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sage-dark flex items-center gap-2">
                    <span>⚠️</span> Urgent Tasks
                  </h3>
                  <div className="space-y-2">
                    {filteredChecklist
                      .filter((item) => !item.completed && item.priority === "critical")
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
                        >
                          <button
                            onClick={() => toggleChecklistItem(item.id)}
                            className="w-5 h-5 rounded border-2 border-red-300 flex-shrink-0 hover:bg-red-100"
                          />
                          <span className="text-sm text-red-800">{item.title}</span>
                        </div>
                      ))}
                    {filteredChecklist.filter((item) => !item.completed && item.priority === "critical").length === 0 && (
                      <p className="text-sm text-gray-500 italic">No urgent tasks remaining</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t">
                <button
                  onClick={() => setActiveTab("checklist")}
                  className="p-4 bg-sage-pale/30 rounded-lg text-center hover:bg-sage-pale transition-colors"
                >
                  <div className="text-2xl mb-1">✓</div>
                  <div className="font-medium text-sage-dark">View Full Checklist</div>
                  <div className="text-xs text-gray-500">{checklistProgress.completed}/{checklistProgress.total} complete</div>
                </button>
                <button
                  onClick={() => setActiveTab("vendors")}
                  className="p-4 bg-sage-pale/30 rounded-lg text-center hover:bg-sage-pale transition-colors"
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <div className="font-medium text-sage-dark">Manage Vendors</div>
                  <div className="text-xs text-gray-500">{plan.vendors.length} vendors added</div>
                </button>
                <button
                  onClick={() => setActiveTab("budget")}
                  className="p-4 bg-sage-pale/30 rounded-lg text-center hover:bg-sage-pale transition-colors"
                >
                  <div className="text-2xl mb-1">💰</div>
                  <div className="font-medium text-sage-dark">Track Expenses</div>
                  <div className="text-xs text-gray-500">${budgetTotals.remaining.toLocaleString()} remaining</div>
                </button>
              </div>
            </div>
          )}

          {/* CHECKLIST TAB */}
          {activeTab === "checklist" && (
            <div className="space-y-6">
              {(["immediate", "within_days", "before_service", "day_of", "after_service"] as ChecklistCategory[]).map((category) => {
                const items = filteredChecklist.filter((item) => item.category === category);
                const categoryLabels: Record<ChecklistCategory, { label: string; icon: string }> = {
                  immediate: { label: "Immediate (within hours)", icon: "🚨" },
                  within_days: { label: "Within the First Few Days", icon: "📅" },
                  before_service: { label: "Before the Service", icon: "📝" },
                  day_of: { label: "Day of Service", icon: "🌹" },
                  after_service: { label: "After the Service", icon: "📋" },
                };
                const { label, icon } = categoryLabels[category];
                const completed = items.filter((i) => i.completed).length;

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sage-dark flex items-center gap-2">
                        <span>{icon}</span> {label}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {completed}/{items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            item.completed
                              ? "bg-green-50 border-green-100"
                              : item.priority === "critical"
                              ? "bg-red-50 border-red-100"
                              : "bg-white border-gray-100 hover:border-sage-light"
                          }`}
                        >
                          <button
                            onClick={() => toggleChecklistItem(item.id)}
                            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                              item.completed
                                ? "bg-green-500 border-green-500 text-white"
                                : item.priority === "critical"
                                ? "border-red-300 hover:bg-red-100"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {item.completed && "✓"}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${item.completed ? "line-through text-gray-400" : "text-sage-dark"}`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                            {item.assignedTo && (
                              <p className="text-xs text-sage mt-1">Assigned to: {item.assignedTo}</p>
                            )}
                            {item.completedBy && (
                              <p className="text-xs text-green-600 mt-1">
                                Completed by {item.completedBy}
                              </p>
                            )}
                          </div>
                          {!item.completed && plan.familyMembers.length > 0 && (
                            <select
                              value={item.assignedTo || ""}
                              onChange={(e) => assignChecklistItem(item.id, e.target.value)}
                              className="text-xs border rounded p-1"
                            >
                              <option value="">Assign to...</option>
                              {plan.familyMembers.map((member) => (
                                <option key={member.id} value={member.name}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VENDORS TAB */}
          {activeTab === "vendors" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sage-dark">Vendors & Service Providers</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    const name = prompt("Vendor name:");
                    if (name) {
                      addVendor({
                        type: "other",
                        name,
                      });
                    }
                  }}
                >
                  + Add Vendor
                </Button>
              </div>

              {plan.vendors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏪</div>
                  <p>No vendors added yet</p>
                  <p className="text-sm">Add funeral homes, florists, caterers, etc.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plan.vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className={`p-4 rounded-lg border ${
                        vendor.confirmed ? "border-green-200 bg-green-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sage-dark">{vendor.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{vendor.type.replace("_", " ")}</p>
                          {vendor.phone && <p className="text-sm text-gray-600">{vendor.phone}</p>}
                          {vendor.email && <p className="text-sm text-gray-600">{vendor.email}</p>}
                        </div>
                        <div className="text-right">
                          {vendor.quote && (
                            <p className="font-medium text-sage-dark">${vendor.quote.toLocaleString()}</p>
                          )}
                          <label className="flex items-center gap-2 text-sm mt-2">
                            <input
                              type="checkbox"
                              checked={vendor.confirmed}
                              onChange={(e) => updateVendor(vendor.id, { confirmed: e.target.checked })}
                              className="rounded border-gray-300 text-sage focus:ring-sage"
                            />
                            Confirmed
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BUDGET TAB */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              {/* Budget Summary */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="bg-sage-pale/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-display text-sage-dark">
                    ${budgetTotals.estimated.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Estimated</div>
                </div>
                <div className="bg-sage-pale/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-display text-sage-dark">
                    ${budgetTotals.actual.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Actual</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-display text-green-600">
                    ${budgetTotals.paid.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Paid</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-display text-amber-600">
                    ${budgetTotals.remaining.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
              </div>

              {/* Budget Items */}
              <div className="space-y-3">
                {plan.budget.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sage-dark">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block">Estimated</label>
                        <Input
                          type="number"
                          value={item.estimated || ""}
                          onChange={(e) => updateBudgetItem(item.id, { estimated: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-sm"
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block">Actual</label>
                        <Input
                          type="number"
                          value={item.actual || ""}
                          onChange={(e) => updateBudgetItem(item.id, { actual: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-sm"
                          placeholder="$0"
                        />
                      </div>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.paid}
                          onChange={(e) => updateBudgetItem(item.id, { paid: e.target.checked })}
                          className="rounded border-gray-300 text-sage focus:ring-sage"
                        />
                        <span className="text-xs text-gray-500">Paid</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAMILY TAB */}
          {activeTab === "family" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sage-dark">Family Members & Roles</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    const name = prompt("Family member name:");
                    const relationship = prompt("Relationship (e.g., Son, Daughter, Sibling):");
                    if (name && relationship) {
                      addFamilyMember({ name, relationship });
                    }
                  }}
                >
                  + Add Family Member
                </Button>
              </div>

              {plan.familyMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
                  <p>No family members added yet</p>
                  <p className="text-sm">Add family to assign tasks and coordinate</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {plan.familyMembers.map((member) => (
                    <div key={member.id} className="p-4 bg-sage-pale/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sage-dark">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.relationship}</p>
                          {member.role && (
                            <p className="text-xs text-sage mt-1">{member.role}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${member.notified ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="text-xs text-gray-500">
                            {member.notified ? "Notified" : "Not notified"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-sage-light">
                        <Input
                          value={member.email || ""}
                          onChange={(e) => {
                            setPlan((prev) => ({
                              ...prev,
                              familyMembers: prev.familyMembers.map((m) =>
                                m.id === member.id ? { ...m, email: e.target.value } : m
                              ),
                            }));
                          }}
                          placeholder="Email address"
                          className="text-sm mb-2"
                        />
                        <Input
                          value={member.phone || ""}
                          onChange={(e) => {
                            setPlan((prev) => ({
                              ...prev,
                              familyMembers: prev.familyMembers.map((m) =>
                                m.id === member.id ? { ...m, phone: e.target.value } : m
                              ),
                            }));
                          }}
                          placeholder="Phone number"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Role Assignments */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sage-dark mb-3">Service Roles</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Pallbearers</label>
                    <Textarea
                      value={plan.serviceDetails.pallbearers?.join("\n") || ""}
                      onChange={(e) => updateServiceDetails({ pallbearers: e.target.value.split("\n").filter(Boolean) })}
                      placeholder="Enter names, one per line"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Eulogists</label>
                    <Textarea
                      value={plan.serviceDetails.eulogists?.join("\n") || ""}
                      onChange={(e) => updateServiceDetails({ eulogists: e.target.value.split("\n").filter(Boolean) })}
                      placeholder="Enter names, one per line"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="bg-sage-pale/30 rounded-lg p-4">
                <h3 className="font-medium text-sage-dark mb-2">Important Documents</h3>
                <p className="text-sm text-gray-500">
                  Upload death certificates, insurance policies, and other important documents.
                  Files are securely stored and only accessible to family members.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { type: "death_certificate", label: "Death Certificate", required: true },
                  { type: "will", label: "Will/Trust", required: false },
                  { type: "insurance", label: "Life Insurance Policy", required: false },
                  { type: "prepaid_plan", label: "Pre-paid Funeral Plan", required: false },
                  { type: "military_records", label: "Military Records (DD214)", required: false },
                  { type: "other", label: "Other Documents", required: false },
                ].map((docType) => {
                  const uploaded = plan.documents.find((d) => d.type === docType.type);
                  return (
                    <div
                      key={docType.type}
                      className={`p-4 rounded-lg border-2 border-dashed ${
                        uploaded ? "border-green-300 bg-green-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sage-dark">
                            {docType.label}
                            {docType.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {uploaded ? (
                            <p className="text-sm text-green-600">✓ Uploaded</p>
                          ) : (
                            <p className="text-sm text-gray-500">Not uploaded</p>
                          )}
                        </div>
                        <label className="cursor-pointer">
                          <span className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">
                            {uploaded ? "Replace" : "Upload"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // In production, would upload to storage
                                setPlan((prev) => ({
                                  ...prev,
                                  documents: [
                                    ...prev.documents.filter((d) => d.type !== docType.type),
                                    {
                                      id: `doc-${Date.now()}`,
                                      type: docType.type,
                                      name: file.name,
                                      uploadedAt: new Date(),
                                    },
                                  ],
                                }));
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Planning Progress
        </Button>
      </div>
    </div>
  );
}
