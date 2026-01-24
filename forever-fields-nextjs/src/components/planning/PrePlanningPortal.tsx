"use client";

import React, { useState, useCallback } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type PlanSection =
  | "overview"
  | "personal"
  | "final_wishes"
  | "service_preferences"
  | "legacy_messages"
  | "documents"
  | "digital_assets"
  | "authorized_contacts"
  | "financial"
  | "preview";

type ServiceType =
  | "traditional_burial"
  | "cremation"
  | "green_burial"
  | "direct_cremation"
  | "direct_burial"
  | "donation_to_science"
  | "celebration_of_life"
  | "undecided";

type ReligiousPreference =
  | "none"
  | "non_denominational"
  | "catholic"
  | "protestant"
  | "jewish"
  | "muslim"
  | "hindu"
  | "buddhist"
  | "other";

type BurialLocation =
  | "family_plot"
  | "new_cemetery_plot"
  | "mausoleum"
  | "columbarium"
  | "scatter_ashes"
  | "keep_ashes_family"
  | "memorial_reef"
  | "tree_pod"
  | "undecided";

interface PersonalInfo {
  legalName: string;
  preferredName?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  currentAddress?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | "partnered";
  spouseName?: string;
  militaryService?: {
    branch: string;
    rank?: string;
    yearsOfService?: string;
    honorableDischarge: boolean;
  };
  occupation?: string;
  education?: string;
  organizationMemberships?: string[];
}

interface FinalWishes {
  organDonation: "yes" | "no" | "specific_organs" | "undecided";
  organDonationDetails?: string;
  bodyDonation: boolean;
  bodyDonationOrganization?: string;
  autopsyPreference: "yes" | "no" | "if_required";
  embalming: "yes" | "no" | "no_preference";
  viewingPreference: "open_casket" | "closed_casket" | "no_viewing" | "no_preference";
}

interface ServicePreferences {
  serviceType: ServiceType;
  religiousPreference: ReligiousPreference;
  religiousDetails?: string;
  burialLocation: BurialLocation;
  specificCemetery?: string;
  specificPlot?: string;
  preferredFuneralHome?: string;

  // Service details
  serviceLocation?: "funeral_home" | "church" | "cemetery" | "home" | "other";
  serviceLocationDetails?: string;
  serviceStyle?: "traditional" | "celebration" | "military" | "private" | "no_service";
  estimatedAttendees?: "small" | "medium" | "large";

  // Casket/urn preferences
  casketStyle?: "wood" | "metal" | "biodegradable" | "rental" | "no_preference";
  casketColor?: string;
  urnStyle?: string;

  // Personal touches
  flowers: "yes" | "no" | "donations_instead";
  charityForDonations?: string;
  specificFlowers?: string;

  // Music
  musicSelections?: Array<{
    title: string;
    artist?: string;
    when?: "processional" | "during_service" | "recessional" | "graveside";
  }>;

  // Readings
  readings?: Array<{
    text: string;
    source?: string;
    reader?: string;
  }>;

  // Photos
  photoInstructions?: string;
  favoritePhotos?: string[];

  // Attire
  burialClothing?: string;
  personalItems?: string[];

  // Special requests
  specialRequests?: string;
}

interface LegacyMessage {
  id: string;
  recipientName: string;
  recipientRelationship: string;
  recipientEmail?: string;
  message: string;
  deliveryTiming: "immediately" | "after_30_days" | "specific_date" | "specific_milestone";
  specificDate?: string;
  specificMilestone?: string;
  attachments?: Array<{ name: string; url: string }>;
  isVideo: boolean;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  type:
    | "will"
    | "trust"
    | "power_of_attorney"
    | "healthcare_directive"
    | "dnr"
    | "life_insurance"
    | "burial_insurance"
    | "prepaid_funeral"
    | "birth_certificate"
    | "marriage_certificate"
    | "military_records"
    | "other";
  name: string;
  description?: string;
  fileUrl?: string;
  location?: string; // Physical location if not uploaded
  attorney?: string;
  expirationDate?: string;
  uploadedAt: string;
  notes?: string;
}

interface DigitalAsset {
  id: string;
  category:
    | "email"
    | "social_media"
    | "financial"
    | "subscription"
    | "storage"
    | "domain"
    | "cryptocurrency"
    | "other";
  serviceName: string;
  username?: string;
  hasPassword: boolean;
  passwordHint?: string;
  twoFactorEnabled: boolean;
  recoveryEmail?: string;
  instructions: "delete" | "memorialize" | "transfer" | "archive" | "other";
  transferTo?: string;
  specialInstructions?: string;
  estimatedValue?: number;
  notes?: string;
}

interface AuthorizedContact {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone?: string;
  address?: string;
  role: "executor" | "primary_contact" | "backup_contact" | "attorney" | "financial_advisor" | "other";
  accessLevel: "full" | "documents_only" | "messages_only" | "view_only";
  canEdit: boolean;
  canUnlock: boolean; // Can unlock after death
  notifyOnUpdate: boolean;
  notes?: string;
}

interface FinancialInfo {
  hasLifeInsurance: boolean;
  lifeInsuranceDetails?: Array<{
    company: string;
    policyNumber?: string;
    beneficiary?: string;
    amount?: number;
    agentContact?: string;
  }>;
  hasBurialInsurance: boolean;
  burialInsuranceDetails?: {
    company: string;
    policyNumber?: string;
    coverageAmount?: number;
  };
  hasPrepaidFuneral: boolean;
  prepaidFuneralDetails?: {
    funeralHome: string;
    contractNumber?: string;
    services?: string[];
    contactPerson?: string;
  };
  bankAccounts?: Array<{
    institution: string;
    accountType: string;
    jointOwner?: string;
    payableOnDeath?: string;
  }>;
  investments?: Array<{
    institution: string;
    accountType: string;
    beneficiary?: string;
  }>;
  realEstate?: Array<{
    address: string;
    ownership: string;
    notes?: string;
  }>;
  debts?: Array<{
    creditor: string;
    type: string;
    approximateBalance?: number;
  }>;
  safeDepositBox?: {
    location: string;
    boxNumber?: string;
    keyLocation?: string;
  };
  additionalNotes?: string;
}

interface PrePlan {
  id: string;
  userId: string;
  status: "draft" | "complete" | "locked";
  personal: PersonalInfo;
  finalWishes: FinalWishes;
  servicePreferences: ServicePreferences;
  legacyMessages: LegacyMessage[];
  documents: Document[];
  digitalAssets: DigitalAsset[];
  authorizedContacts: AuthorizedContact[];
  financial: FinancialInfo;
  lastUpdated: string;
  createdAt: string;
  completionPercentage: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  unlockedBy?: string;
}

// ============================================================================
// HELPER DATA
// ============================================================================

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  traditional_burial: "Traditional Burial",
  cremation: "Cremation with Service",
  green_burial: "Green/Natural Burial",
  direct_cremation: "Direct Cremation",
  direct_burial: "Direct Burial",
  donation_to_science: "Donation to Science",
  celebration_of_life: "Celebration of Life",
  undecided: "I Haven't Decided Yet"
};

const BURIAL_LOCATION_LABELS: Record<BurialLocation, string> = {
  family_plot: "Family Cemetery Plot",
  new_cemetery_plot: "New Cemetery Plot",
  mausoleum: "Mausoleum",
  columbarium: "Columbarium (Ashes)",
  scatter_ashes: "Scatter My Ashes",
  keep_ashes_family: "Keep Ashes with Family",
  memorial_reef: "Memorial Reef",
  tree_pod: "Tree Pod / Living Memorial",
  undecided: "Undecided"
};

const DOCUMENT_TYPE_LABELS: Record<Document["type"], string> = {
  will: "Last Will & Testament",
  trust: "Living Trust",
  power_of_attorney: "Power of Attorney",
  healthcare_directive: "Healthcare Directive / Living Will",
  dnr: "Do Not Resuscitate (DNR)",
  life_insurance: "Life Insurance Policy",
  burial_insurance: "Burial/Final Expense Insurance",
  prepaid_funeral: "Prepaid Funeral Contract",
  birth_certificate: "Birth Certificate",
  marriage_certificate: "Marriage Certificate",
  military_records: "Military Records (DD-214)",
  other: "Other Document"
};

const DIGITAL_ASSET_CATEGORIES: Record<DigitalAsset["category"], string> = {
  email: "Email Accounts",
  social_media: "Social Media",
  financial: "Financial / Banking",
  subscription: "Subscriptions",
  storage: "Cloud Storage",
  domain: "Domains / Websites",
  cryptocurrency: "Cryptocurrency",
  other: "Other"
};

// ============================================================================
// COMPONENT
// ============================================================================

interface PrePlanningPortalProps {
  userId?: string;
  existingPlan?: PrePlan;
  onSave?: (plan: PrePlan) => void;
  onComplete?: (plan: PrePlan) => void;
}

export function PrePlanningPortal({
  userId = "demo-user",
  existingPlan,
  onSave,
  onComplete
}: PrePlanningPortalProps) {
  // Current section
  const [currentSection, setCurrentSection] = useState<PlanSection>("overview");

  // Plan state
  const [plan, setPlan] = useState<PrePlan>(existingPlan || {
    id: `plan-${Date.now()}`,
    userId,
    status: "draft",
    personal: {
      legalName: "",
      dateOfBirth: ""
    },
    finalWishes: {
      organDonation: "undecided",
      bodyDonation: false,
      autopsyPreference: "if_required",
      embalming: "no_preference",
      viewingPreference: "no_preference"
    },
    servicePreferences: {
      serviceType: "undecided",
      religiousPreference: "none",
      burialLocation: "undecided",
      flowers: "yes"
    },
    legacyMessages: [],
    documents: [],
    digitalAssets: [],
    authorizedContacts: [],
    financial: {
      hasLifeInsurance: false,
      hasBurialInsurance: false,
      hasPrepaidFuneral: false
    },
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    completionPercentage: 0,
    isUnlocked: false
  });

  // UI state
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingMessage, setEditingMessage] = useState<LegacyMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate completion percentage
  const calculateCompletion = useCallback((): number => {
    let completed = 0;
    const total = 8;

    // Personal info
    if (plan.personal.legalName && plan.personal.dateOfBirth) completed++;

    // Final wishes
    if (plan.finalWishes.organDonation !== "undecided") completed++;

    // Service preferences
    if (plan.servicePreferences.serviceType !== "undecided") completed++;

    // At least one legacy message
    if (plan.legacyMessages.length > 0) completed++;

    // At least one document
    if (plan.documents.length > 0) completed++;

    // At least one authorized contact
    if (plan.authorizedContacts.length > 0) completed++;

    // Financial info reviewed
    if (plan.financial.hasLifeInsurance !== undefined) completed++;

    // Digital assets considered
    if (plan.digitalAssets.length > 0) completed++;

    return Math.round((completed / total) * 100);
  }, [plan]);

  // Update handler
  const updatePlan = useCallback(<K extends keyof PrePlan>(
    section: K,
    value: PrePlan[K]
  ) => {
    setPlan(prev => ({
      ...prev,
      [section]: value,
      lastUpdated: new Date().toISOString(),
      completionPercentage: calculateCompletion()
    }));
  }, [calculateCompletion]);

  // Save handler
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    const updatedPlan = {
      ...plan,
      completionPercentage: calculateCompletion()
    };
    onSave?.(updatedPlan);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [plan, calculateCompletion, onSave]);

  // Complete handler
  const handleComplete = useCallback(() => {
    const completedPlan: PrePlan = {
      ...plan,
      status: "complete",
      completionPercentage: 100
    };
    onComplete?.(completedPlan);
  }, [plan, onComplete]);

  // Section navigation
  const sections: Array<{ id: PlanSection; label: string; icon: string }> = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "final_wishes", label: "Final Wishes", icon: "🕊️" },
    { id: "service_preferences", label: "Service Preferences", icon: "⛪" },
    { id: "legacy_messages", label: "Legacy Messages", icon: "💌" },
    { id: "documents", label: "Important Documents", icon: "📄" },
    { id: "digital_assets", label: "Digital Assets", icon: "💻" },
    { id: "authorized_contacts", label: "Authorized Contacts", icon: "👥" },
    { id: "financial", label: "Financial Information", icon: "💰" },
    { id: "preview", label: "Preview & Complete", icon: "✓" }
  ];

  // ============================================================================
  // RENDER SECTIONS
  // ============================================================================

  const renderOverview = () => (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Your Pre-Planning Portal
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Plan ahead and give your loved ones peace of mind. Your wishes will be
          securely stored and shared only with those you authorize.
        </p>
      </div>

      {/* Completion progress */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
          <span className="text-2xl font-bold text-primary-600">
            {calculateCompletion()}%
          </span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${calculateCompletion()}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Complete each section to ensure your wishes are fully documented.
        </p>
      </Card>

      {/* Section cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.slice(1, -1).map(section => {
          const isComplete = getSectionStatus(section.id);
          return (
            <Card
              key={section.id}
              className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                isComplete ? "border-green-200 bg-green-50" : ""
              }`}
              onClick={() => setCurrentSection(section.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="font-semibold text-gray-900">{section.label}</h3>
                {isComplete && (
                  <span className="ml-auto text-green-600">✓</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {getSectionDescription(section.id)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Important notice */}
      <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">About Your Privacy</h3>
        <ul className="text-blue-800 text-sm space-y-2">
          <li>• Your information is encrypted and secure</li>
          <li>• Only authorized contacts can access your plan</li>
          <li>• You can update or change anything at any time</li>
          <li>• Your legacy messages remain sealed until you specify</li>
          <li>• We will never share your information without your consent</li>
        </ul>
      </Card>

      <div className="mt-8 text-center">
        <Button onClick={() => setCurrentSection("personal")} className="px-8">
          Get Started
        </Button>
      </div>
    </div>
  );

  const getSectionStatus = (sectionId: PlanSection): boolean => {
    switch (sectionId) {
      case "personal":
        return !!(plan.personal.legalName && plan.personal.dateOfBirth);
      case "final_wishes":
        return plan.finalWishes.organDonation !== "undecided";
      case "service_preferences":
        return plan.servicePreferences.serviceType !== "undecided";
      case "legacy_messages":
        return plan.legacyMessages.length > 0;
      case "documents":
        return plan.documents.length > 0;
      case "digital_assets":
        return plan.digitalAssets.length > 0;
      case "authorized_contacts":
        return plan.authorizedContacts.length > 0;
      case "financial":
        return plan.financial.hasLifeInsurance !== undefined;
      default:
        return false;
    }
  };

  const getSectionDescription = (sectionId: PlanSection): string => {
    switch (sectionId) {
      case "personal":
        return "Basic information about you and your background";
      case "final_wishes":
        return "Organ donation, body disposition, and medical directives";
      case "service_preferences":
        return "Type of service, music, readings, and personal touches";
      case "legacy_messages":
        return "Personal messages and videos for your loved ones";
      case "documents":
        return "Will, insurance policies, and important papers";
      case "digital_assets":
        return "Online accounts, social media, and digital property";
      case "authorized_contacts":
        return "Who should have access to this information";
      case "financial":
        return "Insurance, accounts, and financial arrangements";
      default:
        return "";
    }
  };

  const renderPersonalInfo = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
      <p className="text-gray-600 mb-8">
        This information will be used for official documents and your memorial.
      </p>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Full Name *
              </label>
              <Input
                value={plan.personal.legalName}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  legalName: e.target.value
                })}
                placeholder="As it appears on legal documents"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Name / Nickname
              </label>
              <Input
                value={plan.personal.preferredName || ""}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  preferredName: e.target.value
                })}
                placeholder="What loved ones call you"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <Input
                type="date"
                value={plan.personal.dateOfBirth}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  dateOfBirth: e.target.value
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Place of Birth
              </label>
              <Input
                value={plan.personal.placeOfBirth || ""}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  placeOfBirth: e.target.value
                })}
                placeholder="City, State/Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Address
            </label>
            <Textarea
              value={plan.personal.currentAddress || ""}
              onChange={(e) => updatePlan("personal", {
                ...plan.personal,
                currentAddress: e.target.value
              })}
              rows={2}
              placeholder="Full mailing address"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                value={plan.personal.maritalStatus || ""}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  maritalStatus: e.target.value as PersonalInfo["maritalStatus"]
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select...</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="partnered">Domestic Partnership</option>
              </select>
            </div>
            {(plan.personal.maritalStatus === "married" || plan.personal.maritalStatus === "partnered") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spouse/Partner Name
                </label>
                <Input
                  value={plan.personal.spouseName || ""}
                  onChange={(e) => updatePlan("personal", {
                    ...plan.personal,
                    spouseName: e.target.value
                  })}
                />
              </div>
            )}
          </div>

          {/* Military Service */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-4">Military Service</h3>
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={!!plan.personal.militaryService}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  militaryService: e.target.checked ? {
                    branch: "",
                    honorableDischarge: false
                  } : undefined
                })}
                className="w-5 h-5 rounded text-primary-600"
              />
              <span>I served in the military</span>
            </label>

            {plan.personal.militaryService && (
              <div className="grid md:grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch of Service
                  </label>
                  <select
                    value={plan.personal.militaryService.branch}
                    onChange={(e) => updatePlan("personal", {
                      ...plan.personal,
                      militaryService: {
                        ...plan.personal.militaryService!,
                        branch: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select...</option>
                    <option value="Army">U.S. Army</option>
                    <option value="Navy">U.S. Navy</option>
                    <option value="Air Force">U.S. Air Force</option>
                    <option value="Marines">U.S. Marine Corps</option>
                    <option value="Coast Guard">U.S. Coast Guard</option>
                    <option value="Space Force">U.S. Space Force</option>
                    <option value="National Guard">National Guard</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rank at Discharge
                  </label>
                  <Input
                    value={plan.personal.militaryService.rank || ""}
                    onChange={(e) => updatePlan("personal", {
                      ...plan.personal,
                      militaryService: {
                        ...plan.personal.militaryService!,
                        rank: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Service
                  </label>
                  <Input
                    value={plan.personal.militaryService.yearsOfService || ""}
                    onChange={(e) => updatePlan("personal", {
                      ...plan.personal,
                      militaryService: {
                        ...plan.personal.militaryService!,
                        yearsOfService: e.target.value
                      }
                    })}
                    placeholder="e.g., 1985-1989"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={plan.personal.militaryService.honorableDischarge}
                      onChange={(e) => updatePlan("personal", {
                        ...plan.personal,
                        militaryService: {
                          ...plan.personal.militaryService!,
                          honorableDischarge: e.target.checked
                        }
                      })}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <span className="text-sm">Honorable Discharge</span>
                  </label>
                </div>
              </div>
            )}
            {plan.personal.militaryService && (
              <p className="text-sm text-gray-600 mt-4 ml-8">
                Veterans may be eligible for military honors at their service, including flag folding,
                honor guard, and bugle taps.
              </p>
            )}
          </div>

          {/* Other info */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation / Profession
              </label>
              <Input
                value={plan.personal.occupation || ""}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  occupation: e.target.value
                })}
                placeholder="Your career or profession"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Education
              </label>
              <Input
                value={plan.personal.education || ""}
                onChange={(e) => updatePlan("personal", {
                  ...plan.personal,
                  education: e.target.value
                })}
                placeholder="Highest degree or schools attended"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderFinalWishes = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Wishes</h2>
      <p className="text-gray-600 mb-8">
        These important decisions will guide your family during a difficult time.
      </p>

      {/* Organ Donation */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Organ & Tissue Donation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you wish to be an organ/tissue donor?
            </label>
            <div className="space-y-2">
              {[
                { value: "yes", label: "Yes, I want to donate any organs and tissues that can help others" },
                { value: "specific_organs", label: "Yes, but only specific organs/tissues" },
                { value: "no", label: "No, I do not wish to donate" },
                { value: "undecided", label: "I haven't decided yet" }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="organDonation"
                    checked={plan.finalWishes.organDonation === option.value}
                    onChange={() => updatePlan("finalWishes", {
                      ...plan.finalWishes,
                      organDonation: option.value as FinalWishes["organDonation"]
                    })}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {plan.finalWishes.organDonation === "specific_organs" && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specify which organs/tissues:
              </label>
              <Textarea
                value={plan.finalWishes.organDonationDetails || ""}
                onChange={(e) => updatePlan("finalWishes", {
                  ...plan.finalWishes,
                  organDonationDetails: e.target.value
                })}
                rows={2}
                placeholder="e.g., Eyes/corneas, heart, kidneys..."
              />
            </div>
          )}
        </div>
      </Card>

      {/* Body Donation */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Donation to Medical Science</h3>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={plan.finalWishes.bodyDonation}
            onChange={(e) => updatePlan("finalWishes", {
              ...plan.finalWishes,
              bodyDonation: e.target.checked
            })}
            className="w-5 h-5 rounded text-primary-600 mt-0.5"
          />
          <div>
            <span className="font-medium">I wish to donate my body to medical science</span>
            <p className="text-sm text-gray-600 mt-1">
              Body donation programs use remains for medical research and education.
              This typically replaces traditional burial or cremation.
            </p>
          </div>
        </label>

        {plan.finalWishes.bodyDonation && (
          <div className="mt-4 ml-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Organization (if any):
            </label>
            <Input
              value={plan.finalWishes.bodyDonationOrganization || ""}
              onChange={(e) => updatePlan("finalWishes", {
                ...plan.finalWishes,
                bodyDonationOrganization: e.target.value
              })}
              placeholder="e.g., Local medical school, specific research program"
            />
          </div>
        )}
      </Card>

      {/* Other Preferences */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Other Preferences</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autopsy Preference
            </label>
            <select
              value={plan.finalWishes.autopsyPreference}
              onChange={(e) => updatePlan("finalWishes", {
                ...plan.finalWishes,
                autopsyPreference: e.target.value as FinalWishes["autopsyPreference"]
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="yes">Yes, I consent to an autopsy</option>
              <option value="no">No, I do not want an autopsy</option>
              <option value="if_required">Only if legally required</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Note: Autopsies may be legally required in certain circumstances regardless of preference.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Embalming Preference
            </label>
            <select
              value={plan.finalWishes.embalming}
              onChange={(e) => updatePlan("finalWishes", {
                ...plan.finalWishes,
                embalming: e.target.value as FinalWishes["embalming"]
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="yes">Yes, embalm my body</option>
              <option value="no">No, do not embalm (may limit viewing options)</option>
              <option value="no_preference">No strong preference</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Viewing Preference
            </label>
            <select
              value={plan.finalWishes.viewingPreference}
              onChange={(e) => updatePlan("finalWishes", {
                ...plan.finalWishes,
                viewingPreference: e.target.value as FinalWishes["viewingPreference"]
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="open_casket">Open casket viewing</option>
              <option value="closed_casket">Closed casket</option>
              <option value="no_viewing">No viewing</option>
              <option value="no_preference">No strong preference</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderServicePreferences = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Preferences</h2>
      <p className="text-gray-600 mb-8">
        Tell us how you&apos;d like to be remembered. These preferences will guide your family in planning.
      </p>

      {/* Service Type */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Type of Service</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map(type => (
            <label
              key={type}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                plan.servicePreferences.serviceType === type
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                checked={plan.servicePreferences.serviceType === type}
                onChange={() => updatePlan("servicePreferences", {
                  ...plan.servicePreferences,
                  serviceType: type
                })}
                className="w-5 h-5 text-primary-600"
              />
              <span>{SERVICE_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Religious Preference */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Religious/Spiritual Preference</h3>
        <div className="space-y-4">
          <select
            value={plan.servicePreferences.religiousPreference}
            onChange={(e) => updatePlan("servicePreferences", {
              ...plan.servicePreferences,
              religiousPreference: e.target.value as ReligiousPreference
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="none">No religious elements</option>
            <option value="non_denominational">Non-denominational / Spiritual</option>
            <option value="catholic">Catholic</option>
            <option value="protestant">Protestant Christian</option>
            <option value="jewish">Jewish</option>
            <option value="muslim">Muslim</option>
            <option value="hindu">Hindu</option>
            <option value="buddhist">Buddhist</option>
            <option value="other">Other</option>
          </select>

          {plan.servicePreferences.religiousPreference === "other" && (
            <Input
              value={plan.servicePreferences.religiousDetails || ""}
              onChange={(e) => updatePlan("servicePreferences", {
                ...plan.servicePreferences,
                religiousDetails: e.target.value
              })}
              placeholder="Please specify your religious or spiritual tradition"
            />
          )}
        </div>
      </Card>

      {/* Burial Location */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Final Resting Place</h3>
        <div className="space-y-4">
          <select
            value={plan.servicePreferences.burialLocation}
            onChange={(e) => updatePlan("servicePreferences", {
              ...plan.servicePreferences,
              burialLocation: e.target.value as BurialLocation
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {(Object.keys(BURIAL_LOCATION_LABELS) as BurialLocation[]).map(loc => (
              <option key={loc} value={loc}>{BURIAL_LOCATION_LABELS[loc]}</option>
            ))}
          </select>

          {(plan.servicePreferences.burialLocation === "family_plot" ||
            plan.servicePreferences.burialLocation === "new_cemetery_plot" ||
            plan.servicePreferences.burialLocation === "mausoleum") && (
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                value={plan.servicePreferences.specificCemetery || ""}
                onChange={(e) => updatePlan("servicePreferences", {
                  ...plan.servicePreferences,
                  specificCemetery: e.target.value
                })}
                placeholder="Cemetery name"
              />
              <Input
                value={plan.servicePreferences.specificPlot || ""}
                onChange={(e) => updatePlan("servicePreferences", {
                  ...plan.servicePreferences,
                  specificPlot: e.target.value
                })}
                placeholder="Section/Lot/Plot number (if known)"
              />
            </div>
          )}

          {plan.servicePreferences.burialLocation === "scatter_ashes" && (
            <Textarea
              value={plan.servicePreferences.specificCemetery || ""}
              onChange={(e) => updatePlan("servicePreferences", {
                ...plan.servicePreferences,
                specificCemetery: e.target.value
              })}
              placeholder="Where would you like your ashes scattered? Be as specific as possible."
              rows={2}
            />
          )}
        </div>
      </Card>

      {/* Music */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Music Selections</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add songs you&apos;d like played at your service.
        </p>

        {plan.servicePreferences.musicSelections && plan.servicePreferences.musicSelections.length > 0 && (
          <div className="space-y-2 mb-4">
            {plan.servicePreferences.musicSelections.map((song, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{song.title}</span>
                  {song.artist && <span className="text-gray-600 ml-2">by {song.artist}</span>}
                  {song.when && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({song.when.replace("_", " ")})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const newSongs = [...(plan.servicePreferences.musicSelections || [])];
                    newSongs.splice(idx, 1);
                    updatePlan("servicePreferences", {
                      ...plan.servicePreferences,
                      musicSelections: newSongs
                    });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          onClick={() => {
            const title = prompt("Song title:");
            if (title) {
              const artist = prompt("Artist (optional):");
              updatePlan("servicePreferences", {
                ...plan.servicePreferences,
                musicSelections: [
                  ...(plan.servicePreferences.musicSelections || []),
                  { title, artist: artist || undefined }
                ]
              });
            }
          }}
        >
          + Add Song
        </Button>
      </Card>

      {/* Special Requests */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Special Requests & Notes</h3>
        <Textarea
          value={plan.servicePreferences.specialRequests || ""}
          onChange={(e) => updatePlan("servicePreferences", {
            ...plan.servicePreferences,
            specialRequests: e.target.value
          })}
          rows={4}
          placeholder="Any other wishes for your service? Special readings, dress code, specific requests..."
        />
      </Card>
    </div>
  );

  const renderLegacyMessages = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Legacy Messages</h2>
      <p className="text-gray-600 mb-8">
        Write personal messages to your loved ones. These will be delivered according to your instructions.
      </p>

      {plan.legacyMessages.length > 0 ? (
        <div className="space-y-4 mb-6">
          {plan.legacyMessages.map(msg => (
            <Card key={msg.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    To: {msg.recipientName}
                  </h4>
                  <p className="text-sm text-gray-600">{msg.recipientRelationship}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Delivery: {msg.deliveryTiming === "immediately"
                      ? "Immediately after passing"
                      : msg.deliveryTiming === "after_30_days"
                      ? "30 days after passing"
                      : msg.deliveryTiming === "specific_date"
                      ? `On ${msg.specificDate}`
                      : `On milestone: ${msg.specificMilestone}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMessage(msg)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      updatePlan("legacyMessages",
                        plan.legacyMessages.filter(m => m.id !== msg.id)
                      );
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {msg.message.substring(0, 200)}
                  {msg.message.length > 200 && "..."}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center mb-6">
          <p className="text-gray-600 mb-4">
            You haven&apos;t created any legacy messages yet.
          </p>
          <p className="text-sm text-gray-500">
            Legacy messages are personal letters or videos for your loved ones,
            delivered when and how you choose.
          </p>
        </Card>
      )}

      <Button onClick={() => setShowAddMessage(true)}>
        + Add Legacy Message
      </Button>

      {/* Add/Edit Message Modal */}
      {(showAddMessage || editingMessage) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingMessage ? "Edit Message" : "Create Legacy Message"}
            </h3>

            <LegacyMessageForm
              message={editingMessage}
              onSave={(msg) => {
                if (editingMessage) {
                  updatePlan("legacyMessages",
                    plan.legacyMessages.map(m => m.id === msg.id ? msg : m)
                  );
                } else {
                  updatePlan("legacyMessages", [...plan.legacyMessages, msg]);
                }
                setShowAddMessage(false);
                setEditingMessage(null);
              }}
              onCancel={() => {
                setShowAddMessage(false);
                setEditingMessage(null);
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Documents</h2>
      <p className="text-gray-600 mb-8">
        Store or reference important documents your family will need.
      </p>

      {plan.documents.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {plan.documents.map(doc => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-2">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                  <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                  {doc.location && (
                    <p className="text-sm text-gray-600 mt-1">Location: {doc.location}</p>
                  )}
                  {doc.attorney && (
                    <p className="text-sm text-gray-600">Attorney: {doc.attorney}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    updatePlan("documents", plan.documents.filter(d => d.id !== doc.id));
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center mb-6">
          <p className="text-gray-600">
            No documents added yet. Consider adding your will, life insurance policy,
            and other important papers.
          </p>
        </Card>
      )}

      <Button onClick={() => setShowAddDocument(true)}>
        + Add Document
      </Button>

      {/* Document types checklist */}
      <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">Recommended Documents</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {(Object.keys(DOCUMENT_TYPE_LABELS) as Document["type"][]).map(type => {
            const hasDoc = plan.documents.some(d => d.type === type);
            return (
              <div key={type} className="flex items-center gap-2">
                <span className={hasDoc ? "text-green-600" : "text-gray-400"}>
                  {hasDoc ? "✓" : "○"}
                </span>
                <span className={hasDoc ? "text-blue-900" : "text-blue-700"}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Document Modal */}
      {showAddDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add Document</h3>

            <DocumentForm
              onSave={(doc) => {
                updatePlan("documents", [...plan.documents, doc]);
                setShowAddDocument(false);
              }}
              onCancel={() => setShowAddDocument(false)}
            />
          </Card>
        </div>
      )}
    </div>
  );

  const renderDigitalAssets = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Digital Assets</h2>
      <p className="text-gray-600 mb-8">
        Document your online accounts and what should happen to them.
        Passwords are not stored - just instructions and hints.
      </p>

      {plan.digitalAssets.length > 0 ? (
        <div className="space-y-4 mb-6">
          {plan.digitalAssets.map(asset => (
            <Card key={asset.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-2">
                    {DIGITAL_ASSET_CATEGORIES[asset.category]}
                  </span>
                  <h4 className="font-semibold text-gray-900">{asset.serviceName}</h4>
                  {asset.username && (
                    <p className="text-sm text-gray-600">Username: {asset.username}</p>
                  )}
                  <p className="text-sm text-primary-600 mt-1">
                    Action: {asset.instructions === "transfer"
                      ? `Transfer to ${asset.transferTo}`
                      : asset.instructions.charAt(0).toUpperCase() + asset.instructions.slice(1)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    updatePlan("digitalAssets", plan.digitalAssets.filter(a => a.id !== asset.id));
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center mb-6">
          <p className="text-gray-600">
            No digital assets documented yet. Consider documenting important
            accounts like email, social media, and financial accounts.
          </p>
        </Card>
      )}

      <Button onClick={() => setShowAddAsset(true)}>
        + Add Digital Asset
      </Button>

      {/* Add Asset Modal */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add Digital Asset</h3>

            <DigitalAssetForm
              onSave={(asset) => {
                updatePlan("digitalAssets", [...plan.digitalAssets, asset]);
                setShowAddAsset(false);
              }}
              onCancel={() => setShowAddAsset(false)}
            />
          </Card>
        </div>
      )}
    </div>
  );

  const renderAuthorizedContacts = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Authorized Contacts</h2>
      <p className="text-gray-600 mb-8">
        Designate who can access your pre-planning information after you pass.
      </p>

      {plan.authorizedContacts.length > 0 ? (
        <div className="space-y-4 mb-6">
          {plan.authorizedContacts.map(contact => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                  <p className="text-sm text-gray-600">{contact.relationship}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                      {contact.role.replace("_", " ")}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {contact.accessLevel.replace("_", " ")}
                    </span>
                    {contact.canUnlock && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        Can unlock plan
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    updatePlan("authorizedContacts",
                      plan.authorizedContacts.filter(c => c.id !== contact.id)
                    );
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center mb-6 bg-amber-50 border-amber-200">
          <p className="text-amber-800 font-medium mb-2">
            No authorized contacts yet
          </p>
          <p className="text-amber-700 text-sm">
            You need at least one authorized contact to ensure your wishes
            can be accessed when needed.
          </p>
        </Card>
      )}

      <Button onClick={() => setShowAddContact(true)}>
        + Add Authorized Contact
      </Button>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add Authorized Contact</h3>

            <AuthorizedContactForm
              onSave={(contact) => {
                updatePlan("authorizedContacts", [...plan.authorizedContacts, contact]);
                setShowAddContact(false);
              }}
              onCancel={() => setShowAddContact(false)}
            />
          </Card>
        </div>
      )}
    </div>
  );

  const renderFinancial = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Information</h2>
      <p className="text-gray-600 mb-8">
        Help your family understand your financial situation.
        This information is kept private and only shared with authorized contacts.
      </p>

      {/* Life Insurance */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Life Insurance</h3>
        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={plan.financial.hasLifeInsurance}
            onChange={(e) => updatePlan("financial", {
              ...plan.financial,
              hasLifeInsurance: e.target.checked,
              lifeInsuranceDetails: e.target.checked ? [] : undefined
            })}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span>I have life insurance</span>
        </label>

        {plan.financial.hasLifeInsurance && (
          <div className="ml-8 space-y-4">
            {(plan.financial.lifeInsuranceDetails || []).map((policy, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid md:grid-cols-2 gap-3">
                  <Input
                    value={policy.company}
                    onChange={(e) => {
                      const newPolicies = [...(plan.financial.lifeInsuranceDetails || [])];
                      newPolicies[idx] = { ...policy, company: e.target.value };
                      updatePlan("financial", {
                        ...plan.financial,
                        lifeInsuranceDetails: newPolicies
                      });
                    }}
                    placeholder="Insurance Company"
                  />
                  <Input
                    value={policy.policyNumber || ""}
                    onChange={(e) => {
                      const newPolicies = [...(plan.financial.lifeInsuranceDetails || [])];
                      newPolicies[idx] = { ...policy, policyNumber: e.target.value };
                      updatePlan("financial", {
                        ...plan.financial,
                        lifeInsuranceDetails: newPolicies
                      });
                    }}
                    placeholder="Policy Number"
                  />
                  <Input
                    value={policy.beneficiary || ""}
                    onChange={(e) => {
                      const newPolicies = [...(plan.financial.lifeInsuranceDetails || [])];
                      newPolicies[idx] = { ...policy, beneficiary: e.target.value };
                      updatePlan("financial", {
                        ...plan.financial,
                        lifeInsuranceDetails: newPolicies
                      });
                    }}
                    placeholder="Beneficiary"
                  />
                  <Input
                    type="number"
                    value={policy.amount || ""}
                    onChange={(e) => {
                      const newPolicies = [...(plan.financial.lifeInsuranceDetails || [])];
                      newPolicies[idx] = { ...policy, amount: parseFloat(e.target.value) };
                      updatePlan("financial", {
                        ...plan.financial,
                        lifeInsuranceDetails: newPolicies
                      });
                    }}
                    placeholder="Face Value ($)"
                  />
                </div>
                <button
                  onClick={() => {
                    const newPolicies = [...(plan.financial.lifeInsuranceDetails || [])];
                    newPolicies.splice(idx, 1);
                    updatePlan("financial", {
                      ...plan.financial,
                      lifeInsuranceDetails: newPolicies
                    });
                  }}
                  className="text-red-500 hover:text-red-700 text-sm mt-2"
                >
                  Remove Policy
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() => {
                updatePlan("financial", {
                  ...plan.financial,
                  lifeInsuranceDetails: [
                    ...(plan.financial.lifeInsuranceDetails || []),
                    { company: "" }
                  ]
                });
              }}
            >
              + Add Policy
            </Button>
          </div>
        )}
      </Card>

      {/* Prepaid Funeral */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Prepaid Funeral Arrangement</h3>
        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={plan.financial.hasPrepaidFuneral}
            onChange={(e) => updatePlan("financial", {
              ...plan.financial,
              hasPrepaidFuneral: e.target.checked
            })}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span>I have a prepaid funeral arrangement</span>
        </label>

        {plan.financial.hasPrepaidFuneral && (
          <div className="ml-8 grid md:grid-cols-2 gap-4">
            <Input
              value={plan.financial.prepaidFuneralDetails?.funeralHome || ""}
              onChange={(e) => updatePlan("financial", {
                ...plan.financial,
                prepaidFuneralDetails: {
                  ...plan.financial.prepaidFuneralDetails,
                  funeralHome: e.target.value
                }
              })}
              placeholder="Funeral Home Name"
            />
            <Input
              value={plan.financial.prepaidFuneralDetails?.contractNumber || ""}
              onChange={(e) => updatePlan("financial", {
                ...plan.financial,
                prepaidFuneralDetails: {
                  ...plan.financial.prepaidFuneralDetails,
                  funeralHome: plan.financial.prepaidFuneralDetails?.funeralHome || "",
                  contractNumber: e.target.value
                }
              })}
              placeholder="Contract Number"
            />
            <Input
              value={plan.financial.prepaidFuneralDetails?.contactPerson || ""}
              onChange={(e) => updatePlan("financial", {
                ...plan.financial,
                prepaidFuneralDetails: {
                  ...plan.financial.prepaidFuneralDetails,
                  funeralHome: plan.financial.prepaidFuneralDetails?.funeralHome || "",
                  contactPerson: e.target.value
                }
              })}
              placeholder="Contact Person"
            />
          </div>
        )}
      </Card>

      {/* Safe Deposit Box */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Safe Deposit Box</h3>
        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={!!plan.financial.safeDepositBox}
            onChange={(e) => updatePlan("financial", {
              ...plan.financial,
              safeDepositBox: e.target.checked ? { location: "" } : undefined
            })}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span>I have a safe deposit box</span>
        </label>

        {plan.financial.safeDepositBox && (
          <div className="ml-8 grid md:grid-cols-2 gap-4">
            <Input
              value={plan.financial.safeDepositBox.location}
              onChange={(e) => updatePlan("financial", {
                ...plan.financial,
                safeDepositBox: {
                  ...plan.financial.safeDepositBox!,
                  location: e.target.value
                }
              })}
              placeholder="Bank/Institution & Branch"
            />
            <Input
              value={plan.financial.safeDepositBox.boxNumber || ""}
              onChange={(e) => updatePlan("financial", {
                ...plan.financial,
                safeDepositBox: {
                  ...plan.financial.safeDepositBox!,
                  boxNumber: e.target.value
                }
              })}
              placeholder="Box Number"
            />
            <div className="md:col-span-2">
              <Input
                value={plan.financial.safeDepositBox.keyLocation || ""}
                onChange={(e) => updatePlan("financial", {
                  ...plan.financial,
                  safeDepositBox: {
                    ...plan.financial.safeDepositBox!,
                    keyLocation: e.target.value
                  }
                })}
                placeholder="Where is the key kept?"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Additional Notes */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Financial Notes</h3>
        <Textarea
          value={plan.financial.additionalNotes || ""}
          onChange={(e) => updatePlan("financial", {
            ...plan.financial,
            additionalNotes: e.target.value
          })}
          rows={4}
          placeholder="Any other financial information your family should know about..."
        />
      </Card>
    </div>
  );

  const renderPreview = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview Your Plan</h2>

      {/* Completion summary */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Completion Status</h3>
          <span className={`text-2xl font-bold ${
            calculateCompletion() === 100 ? "text-green-600" : "text-amber-600"
          }`}>
            {calculateCompletion()}%
          </span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              calculateCompletion() === 100 ? "bg-green-600" : "bg-amber-500"
            }`}
            style={{ width: `${calculateCompletion()}%` }}
          />
        </div>

        {/* Section status */}
        <div className="grid md:grid-cols-2 gap-2">
          {sections.slice(1, -1).map(section => {
            const isComplete = getSectionStatus(section.id);
            return (
              <div key={section.id} className="flex items-center gap-2">
                <span className={isComplete ? "text-green-600" : "text-gray-400"}>
                  {isComplete ? "✓" : "○"}
                </span>
                <span className={isComplete ? "text-gray-900" : "text-gray-500"}>
                  {section.label}
                </span>
                {!isComplete && (
                  <button
                    onClick={() => setCurrentSection(section.id)}
                    className="text-primary-600 text-sm ml-auto"
                  >
                    Complete →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Summary cards */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{plan.personal.legalName || "Not provided"}</span>
            </div>
            <div>
              <span className="text-gray-600">Date of Birth:</span>
              <span className="ml-2 font-medium">
                {plan.personal.dateOfBirth
                  ? new Date(plan.personal.dateOfBirth).toLocaleDateString()
                  : "Not provided"}
              </span>
            </div>
            {plan.personal.militaryService && (
              <div className="md:col-span-2">
                <span className="text-gray-600">Military Service:</span>
                <span className="ml-2 font-medium">
                  {plan.personal.militaryService.branch}
                  {plan.personal.militaryService.rank && `, ${plan.personal.militaryService.rank}`}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Service Preferences</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Service Type:</span>
              <span className="ml-2 font-medium">
                {SERVICE_TYPE_LABELS[plan.servicePreferences.serviceType]}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Final Resting Place:</span>
              <span className="ml-2 font-medium">
                {BURIAL_LOCATION_LABELS[plan.servicePreferences.burialLocation]}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">What You&apos;ve Added</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">
                {plan.legacyMessages.length}
              </p>
              <p className="text-sm text-gray-600">Legacy Messages</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">
                {plan.documents.length}
              </p>
              <p className="text-sm text-gray-600">Documents</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">
                {plan.authorizedContacts.length}
              </p>
              <p className="text-sm text-gray-600">Authorized Contacts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSave} variant="secondary" className="flex-1">
          {isSaving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Progress"}
        </Button>
        <Button
          onClick={handleComplete}
          disabled={calculateCompletion() < 50}
          className="flex-1"
        >
          {calculateCompletion() === 100
            ? "Mark as Complete"
            : `Complete at least 50% (${calculateCompletion()}%)`}
        </Button>
      </div>

      {/* Warning */}
      <Card className="p-6 mt-8 bg-amber-50 border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-2">Important Reminder</h3>
        <p className="text-amber-800 text-sm">
          This pre-plan is not a legal document. For legally binding instructions,
          please work with an attorney to create a will, healthcare directive,
          and other legal documents.
        </p>
      </Card>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Pre-Planning Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Last saved: {new Date(plan.lastUpdated).toLocaleDateString()}
              </span>
              <Button onClick={handleSave} variant="secondary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar navigation */}
          <div className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentSection === section.id
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{section.icon}</span>
                  <span className="flex-1">{section.label}</span>
                  {getSectionStatus(section.id) && section.id !== "overview" && section.id !== "preview" && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 max-w-3xl">
            {/* Mobile section nav */}
            <div className="lg:hidden mb-6">
              <select
                value={currentSection}
                onChange={(e) => setCurrentSection(e.target.value as PlanSection)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.icon} {section.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Section content */}
            {currentSection === "overview" && renderOverview()}
            {currentSection === "personal" && renderPersonalInfo()}
            {currentSection === "final_wishes" && renderFinalWishes()}
            {currentSection === "service_preferences" && renderServicePreferences()}
            {currentSection === "legacy_messages" && renderLegacyMessages()}
            {currentSection === "documents" && renderDocuments()}
            {currentSection === "digital_assets" && renderDigitalAssets()}
            {currentSection === "authorized_contacts" && renderAuthorizedContacts()}
            {currentSection === "financial" && renderFinancial()}
            {currentSection === "preview" && renderPreview()}

            {/* Navigation buttons */}
            {currentSection !== "overview" && (
              <div className="flex justify-between mt-8 pt-8 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const idx = sections.findIndex(s => s.id === currentSection);
                    if (idx > 0) setCurrentSection(sections[idx - 1].id);
                  }}
                >
                  ← Previous
                </Button>
                <Button
                  onClick={() => {
                    const idx = sections.findIndex(s => s.id === currentSection);
                    if (idx < sections.length - 1) setCurrentSection(sections[idx + 1].id);
                  }}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LegacyMessageForm({
  message,
  onSave,
  onCancel
}: {
  message?: LegacyMessage | null;
  onSave: (msg: LegacyMessage) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<LegacyMessage>>(message || {
    id: `msg-${Date.now()}`,
    recipientName: "",
    recipientRelationship: "",
    message: "",
    deliveryTiming: "immediately",
    isVideo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Name *
          </label>
          <Input
            value={form.recipientName || ""}
            onChange={(e) => setForm(prev => ({ ...prev, recipientName: e.target.value }))}
            placeholder="Who is this message for?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship *
          </label>
          <Input
            value={form.recipientRelationship || ""}
            onChange={(e) => setForm(prev => ({ ...prev, recipientRelationship: e.target.value }))}
            placeholder="e.g., Daughter, Best Friend"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (for delivery)
        </label>
        <Input
          type="email"
          value={form.recipientEmail || ""}
          onChange={(e) => setForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
          placeholder="recipient@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Message *
        </label>
        <Textarea
          value={form.message || ""}
          onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
          rows={6}
          placeholder="Write your message here..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          When should this be delivered?
        </label>
        <select
          value={form.deliveryTiming}
          onChange={(e) => setForm(prev => ({
            ...prev,
            deliveryTiming: e.target.value as LegacyMessage["deliveryTiming"]
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="immediately">Immediately after my passing</option>
          <option value="after_30_days">30 days after my passing</option>
          <option value="specific_date">On a specific date</option>
          <option value="specific_milestone">On a specific milestone</option>
        </select>

        {form.deliveryTiming === "specific_date" && (
          <Input
            type="date"
            value={form.specificDate || ""}
            onChange={(e) => setForm(prev => ({ ...prev, specificDate: e.target.value }))}
            className="mt-2"
          />
        )}

        {form.deliveryTiming === "specific_milestone" && (
          <Input
            value={form.specificMilestone || ""}
            onChange={(e) => setForm(prev => ({ ...prev, specificMilestone: e.target.value }))}
            placeholder="e.g., 18th birthday, graduation, wedding day"
            className="mt-2"
          />
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (form.recipientName && form.recipientRelationship && form.message) {
              onSave({
                ...form,
                id: form.id || `msg-${Date.now()}`,
                recipientName: form.recipientName,
                recipientRelationship: form.recipientRelationship,
                message: form.message,
                deliveryTiming: form.deliveryTiming || "immediately",
                isVideo: form.isVideo || false,
                createdAt: form.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as LegacyMessage);
            }
          }}
          disabled={!form.recipientName || !form.recipientRelationship || !form.message}
          className="flex-1"
        >
          Save Message
        </Button>
      </div>
    </div>
  );
}

function DocumentForm({
  onSave,
  onCancel
}: {
  onSave: (doc: Document) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Document>>({
    id: `doc-${Date.now()}`,
    type: "will",
    name: "",
    uploadedAt: new Date().toISOString()
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <select
          value={form.type}
          onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as Document["type"] }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {(Object.keys(DOCUMENT_TYPE_LABELS) as Document["type"][]).map(type => (
            <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Name *
        </label>
        <Input
          value={form.name || ""}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Last Will and Testament"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Physical Location
        </label>
        <Input
          value={form.location || ""}
          onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
          placeholder="e.g., Safe deposit box at First National Bank"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attorney / Prepared By
        </label>
        <Input
          value={form.attorney || ""}
          onChange={(e) => setForm(prev => ({ ...prev, attorney: e.target.value }))}
          placeholder="Attorney name and contact info"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <Textarea
          value={form.notes || ""}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          placeholder="Any additional notes about this document"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (form.name && form.type) {
              onSave(form as Document);
            }
          }}
          disabled={!form.name}
          className="flex-1"
        >
          Add Document
        </Button>
      </div>
    </div>
  );
}

function DigitalAssetForm({
  onSave,
  onCancel
}: {
  onSave: (asset: DigitalAsset) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<DigitalAsset>>({
    id: `asset-${Date.now()}`,
    category: "email",
    serviceName: "",
    hasPassword: true,
    twoFactorEnabled: false,
    instructions: "delete"
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          value={form.category}
          onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as DigitalAsset["category"] }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {(Object.keys(DIGITAL_ASSET_CATEGORIES) as DigitalAsset["category"][]).map(cat => (
            <option key={cat} value={cat}>{DIGITAL_ASSET_CATEGORIES[cat]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service/Platform Name *
        </label>
        <Input
          value={form.serviceName || ""}
          onChange={(e) => setForm(prev => ({ ...prev, serviceName: e.target.value }))}
          placeholder="e.g., Gmail, Facebook, Chase Bank"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username/Email
        </label>
        <Input
          value={form.username || ""}
          onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
          placeholder="Your login username or email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What should happen to this account?
        </label>
        <select
          value={form.instructions}
          onChange={(e) => setForm(prev => ({
            ...prev,
            instructions: e.target.value as DigitalAsset["instructions"]
          }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="delete">Delete the account</option>
          <option value="memorialize">Memorialize (if supported)</option>
          <option value="transfer">Transfer to someone</option>
          <option value="archive">Archive/download data</option>
          <option value="other">Other instructions</option>
        </select>

        {form.instructions === "transfer" && (
          <Input
            value={form.transferTo || ""}
            onChange={(e) => setForm(prev => ({ ...prev, transferTo: e.target.value }))}
            placeholder="Transfer to whom?"
            className="mt-2"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password Hint (optional)
        </label>
        <Input
          value={form.passwordHint || ""}
          onChange={(e) => setForm(prev => ({ ...prev, passwordHint: e.target.value }))}
          placeholder="A hint to help family find the password"
        />
        <p className="text-xs text-gray-500 mt-1">
          Never store the actual password here. Just a hint.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Special Instructions
        </label>
        <Textarea
          value={form.specialInstructions || ""}
          onChange={(e) => setForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
          rows={2}
          placeholder="Any other important information"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (form.serviceName && form.category && form.instructions) {
              onSave(form as DigitalAsset);
            }
          }}
          disabled={!form.serviceName}
          className="flex-1"
        >
          Add Asset
        </Button>
      </div>
    </div>
  );
}

function AuthorizedContactForm({
  onSave,
  onCancel
}: {
  onSave: (contact: AuthorizedContact) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<AuthorizedContact>>({
    id: `contact-${Date.now()}`,
    name: "",
    relationship: "",
    email: "",
    role: "primary_contact",
    accessLevel: "full",
    canEdit: false,
    canUnlock: true,
    notifyOnUpdate: true
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <Input
            value={form.name || ""}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship *
          </label>
          <Input
            value={form.relationship || ""}
            onChange={(e) => setForm(prev => ({ ...prev, relationship: e.target.value }))}
            placeholder="e.g., Spouse, Daughter, Attorney"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <Input
            type="tel"
            value={form.phone || ""}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm(prev => ({
              ...prev,
              role: e.target.value as AuthorizedContact["role"]
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="executor">Executor of Estate</option>
            <option value="primary_contact">Primary Contact</option>
            <option value="backup_contact">Backup Contact</option>
            <option value="attorney">Attorney</option>
            <option value="financial_advisor">Financial Advisor</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Level
          </label>
          <select
            value={form.accessLevel}
            onChange={(e) => setForm(prev => ({
              ...prev,
              accessLevel: e.target.value as AuthorizedContact["accessLevel"]
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="full">Full Access</option>
            <option value="documents_only">Documents Only</option>
            <option value="messages_only">Messages Only</option>
            <option value="view_only">View Only</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.canUnlock}
            onChange={(e) => setForm(prev => ({ ...prev, canUnlock: e.target.checked }))}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span>Can unlock my plan after my passing</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.notifyOnUpdate}
            onChange={(e) => setForm(prev => ({ ...prev, notifyOnUpdate: e.target.checked }))}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span>Notify when I update my plan</span>
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (form.name && form.email && form.relationship) {
              onSave(form as AuthorizedContact);
            }
          }}
          disabled={!form.name || !form.email || !form.relationship}
          className="flex-1"
        >
          Add Contact
        </Button>
      </div>
    </div>
  );
}

export default PrePlanningPortal;
