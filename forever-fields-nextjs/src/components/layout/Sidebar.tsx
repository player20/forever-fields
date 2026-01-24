"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  LayoutDashboard,
  Heart,
  Image,
    MessageSquare,
  Calendar,
  Settings,
  HelpCircle,
  ChevronRight,
  Flower2,
  FileText,
  ShoppingBag,
  MapPin,
  Book,
  Mic,
  Video,
  TreeDeciduous,
  Crown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: Omit<SidebarItem, "children">[];
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Memorials", href: "/memorials", icon: Heart, badge: 3 },
    ],
  },
  {
    title: "Memorial",
    items: [
      { name: "Photos & Albums", href: "/photos", icon: Image },
      { name: "Stories", href: "/stories", icon: Book },
      { name: "Family Tree", href: "/family-tree", icon: TreeDeciduous },
      { name: "Timeline", href: "/timeline", icon: Calendar },
      { name: "Guestbook", href: "/guestbook", icon: MessageSquare, badge: "New" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { name: "Voice Memories", href: "/voice", icon: Mic },
      { name: "Video Messages", href: "/video", icon: Video },
      { name: "Grave Locator", href: "/grave-locator", icon: MapPin },
    ],
  },
  {
    title: "Planning & Shop",
    items: [
      { name: "Funeral Planning", href: "/planning", icon: FileText },
      { name: "Memorial Shop", href: "/shop", icon: ShoppingBag },
      { name: "Pre-Planning", href: "/pre-planning", icon: Calendar },
    ],
  },
];

const bottomItems: SidebarItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
];

interface SidebarProps {
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function Sidebar({
  className,
  collapsible = true,
  defaultCollapsed = false,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const renderItem = (item: SidebarItem, depth = 0) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);

    return (
      <div key={item.name}>
        <Link
          href={hasChildren ? "#" : item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.name);
            }
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            "group hover:bg-sage-pale/50",
            isActive && "bg-sage-pale text-sage-dark",
            !isActive && "text-gray-body hover:text-sage-dark",
            depth > 0 && "ml-6 text-sm"
          )}
        >
          <item.icon
            className={cn(
              "w-5 h-5 shrink-0 transition-colors",
              isActive ? "text-sage" : "text-gray-body group-hover:text-sage"
            )}
          />

          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.name}</span>

              {item.badge && (
                <Badge
                  size="sm"
                  variant={typeof item.badge === "string" ? "default" : "secondary"}
                  pill
                >
                  {item.badge}
                </Badge>
              )}

              {hasChildren && (
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-gray-body transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
              )}
            </>
          )}
        </Link>

        {/* Children */}
        {hasChildren && !collapsed && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-1">
                  {item.children!.map((child) => renderItem(child, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-sage-pale/50 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sage-pale/50">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg font-semibold text-sage-dark">
              Forever Fields
            </span>
          </Link>
        )}

        {collapsible && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-2 rounded-lg text-gray-body hover:text-sage-dark hover:bg-sage-pale/50 transition-colors",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Premium Banner */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-gold-dark">
              Upgrade to Premium
            </span>
          </div>
          <p className="text-xs text-gray-body">
            Unlock voice cloning, unlimited photos, and more.
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sidebarSections.map((section, index) => (
          <div key={index}>
            {section.title && !collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-body uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">{section.items.map((item) => renderItem(item))}</div>
          </div>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="py-4 px-3 border-t border-sage-pale/50 space-y-1">
        {bottomItems.map((item) => renderItem(item))}
      </div>
    </aside>
  );
}
