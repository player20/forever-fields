"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, Check, Mail, Share2 } from "lucide-react";
import { Button, Card, Avatar, AvatarGroup, Badge } from "@/components/ui";

interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: "joined" | "pending" | "invited";
  role?: "owner" | "editor" | "viewer";
}

interface FamilyProgressProps {
  members: FamilyMember[];
  totalInvited: number;
  memorialName: string;
  onInvite?: () => void;
  className?: string;
}

export function FamilyProgress({
  members,
  totalInvited,
  memorialName,
  onInvite,
  className = "",
}: FamilyProgressProps) {
  const joinedMembers = members.filter((m) => m.status === "joined");
  const pendingMembers = members.filter((m) => m.status === "pending" || m.status === "invited");
  const joinedCount = joinedMembers.length;
  const progressPercent = totalInvited > 0 ? (joinedCount / totalInvited) * 100 : 0;

  return (
    <Card className={`p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sage-pale flex items-center justify-center">
            <Users className="w-4 h-4 text-sage" />
          </div>
          <div>
            <h3 className="font-medium text-gray-dark text-sm">Family Network</h3>
            <p className="text-xs text-gray-body">{memorialName}</p>
          </div>
        </div>
        {onInvite && (
          <Button variant="ghost" size="sm" onClick={onInvite} className="text-sage">
            <UserPlus className="w-4 h-4 mr-1" />
            Invite
          </Button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-sage-dark">
            {joinedCount} of {totalInvited} joined
          </span>
          {progressPercent >= 80 && (
            <Badge variant="secondary" size="sm" className="bg-green-50 text-green-700">
              Almost complete!
            </Badge>
          )}
        </div>
        <div className="h-2 bg-sage-pale/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sage to-sage-dark rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Member list */}
      <div className="space-y-2 mb-4">
        {joinedMembers.slice(0, 3).map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-sage-pale/20"
          >
            <div className="flex items-center gap-2">
              <Avatar name={member.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-dark">{member.name}</p>
                {member.role && (
                  <p className="text-xs text-gray-body capitalize">{member.role}</p>
                )}
              </div>
            </div>
            <Check className="w-4 h-4 text-green-500" />
          </div>
        ))}

        {pendingMembers.slice(0, 2).map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 opacity-70"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-body">{member.email || member.name}</p>
                <p className="text-xs text-gray-400">Invite sent</p>
              </div>
            </div>
            <Badge variant="outline" size="sm">Pending</Badge>
          </div>
        ))}
      </div>

      {/* Viral incentive */}
      {joinedCount < totalInvited && (
        <div className="p-3 bg-gold/5 rounded-lg border border-gold/20">
          <p className="text-xs text-gold-dark flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            <span>
              <strong>Invite {totalInvited - joinedCount} more</strong> to unlock collaborative features
            </span>
          </p>
        </div>
      )}

      {/* Growth metrics for power users */}
      {joinedCount >= 3 && (
        <div className="mt-3 pt-3 border-t border-sage-pale/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-body">Network reach</span>
            <span className="font-medium text-sage-dark">
              {Math.round(joinedCount * 2.3)} potential new members
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
