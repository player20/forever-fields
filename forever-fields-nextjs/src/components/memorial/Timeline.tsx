"use client";

import { motion } from "framer-motion";
import {
  Baby,
  GraduationCap,
  Heart,
  FileText,
  Building,
  Globe,
  Briefcase,
  Flag,
  Star,
  School,
  Flame,
  Calendar,
  MapPin,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  icon?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  baby: Baby,
  graduation: GraduationCap,
  heart: Heart,
  document: FileText,
  building: Building,
  globe: Globe,
  briefcase: Briefcase,
  flag: Flag,
  star: Star,
  school: School,
  candle: Flame,
  calendar: Calendar,
  location: MapPin,
};

export function Timeline({ events, className = "" }: TimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sage via-sage-dark to-sage" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const IconComponent = ICON_MAP[event.icon || "calendar"] || Calendar;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative flex items-start gap-4 pl-4"
            >
              {/* Icon circle */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white border-4 border-sage flex items-center justify-center shadow-md">
                  <IconComponent className="w-4 h-4 text-sage-dark" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-sage-pale hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-sage-dark bg-sage-pale/50 px-2 py-0.5 rounded">
                      {event.year}
                    </span>
                  </div>
                  <h3 className="font-serif font-semibold text-gray-900 text-lg">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* End marker */}
      <div className="absolute left-6 bottom-0 transform -translate-x-1/2">
        <div className="w-3 h-3 rounded-full bg-sage-dark" />
      </div>
    </div>
  );
}

export default Timeline;
