"use client";

import { useState } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface MilestoneMessage {
  id: string;
  title: string;
  occasion: string; // "18th birthday", "graduation", "wedding", "first child", etc.
  unlockDate?: string; // ISO date when it unlocks
  unlockAge?: number; // Alternative: unlock when person reaches this age
  content: string;
  audioUrl?: string;
  videoUrl?: string;
  fromName: string;
  fromRelationship: string;
  writtenInSpiritOf?: string; // "Written in the spirit of Grandma" if posthumous
  isUnlocked: boolean;
  photos?: string[];
}

interface MilestoneMessagesProps {
  recipientName: string;
  recipientBirthDate?: string;
  ancestorName: string;
  ancestorPhoto?: string;
  messages: MilestoneMessage[];
  onCreateMessage?: () => void;
}

export function MilestoneMessages({
  recipientName,
  recipientBirthDate,
  ancestorName,
  ancestorPhoto: _ancestorPhoto,
  messages,
  onCreateMessage,
}: MilestoneMessagesProps) {
  const [selectedMessage, setSelectedMessage] = useState<MilestoneMessage | null>(null);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = recipientBirthDate ? calculateAge(recipientBirthDate) : null;

  const sortedMessages = [...messages].sort((a, b) => {
    // Unlocked messages first, then by date/age
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
    if (a.unlockAge && b.unlockAge) return a.unlockAge - b.unlockAge;
    if (a.unlockDate && b.unlockDate) return new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime();
    return 0;
  });

  const unlockedCount = messages.filter((m) => m.isUnlocked).length;
  const lockedCount = messages.length - unlockedCount;

  // Message detail view
  if (selectedMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gold/10 to-cream p-4">
        <div className="max-w-lg mx-auto pt-8">
          {/* Back button */}
          <button
            onClick={() => setSelectedMessage(null)}
            className="text-gray-500 hover:text-sage mb-6 flex items-center gap-2"
          >
            ← Back to messages
          </button>

          {/* Unlock animation overlay */}
          {showUnlockAnimation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 animate-bounce">
                <span className="text-6xl block mb-4">🎁</span>
                <h2 className="font-display text-2xl text-sage-dark mb-2">
                  A Message Just For You
                </h2>
                <p className="text-gray-600 mb-4">
                  From {selectedMessage.fromName}
                </p>
                <Button onClick={() => setShowUnlockAnimation(false)}>
                  Open Message
                </Button>
              </div>
            </div>
          )}

          <Card className="overflow-hidden">
            {/* Header image */}
            <div className="h-32 bg-gradient-to-r from-gold/30 to-sage/30 flex items-center justify-center relative">
              <span className="text-5xl">💌</span>
              {selectedMessage.occasion && (
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-sage-dark">
                  {selectedMessage.occasion}
                </div>
              )}
            </div>

            <CardContent className="py-6">
              <h2 className="font-display text-2xl text-sage-dark mb-1">
                {selectedMessage.title}
              </h2>
              <p className="text-gray-500 mb-6">
                From {selectedMessage.fromName}
                {selectedMessage.writtenInSpiritOf && (
                  <span className="block text-sm italic mt-1">
                    Written in the spirit of {selectedMessage.writtenInSpiritOf}
                  </span>
                )}
              </p>

              {/* Video if available */}
              {selectedMessage.videoUrl && (
                <div className="mb-6 rounded-lg overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full"
                    poster={selectedMessage.photos?.[0]}
                  >
                    <source src={selectedMessage.videoUrl} type="video/mp4" />
                  </video>
                </div>
              )}

              {/* Audio if available */}
              {selectedMessage.audioUrl && !selectedMessage.videoUrl && (
                <div className="mb-6 p-4 bg-sage-pale rounded-lg">
                  <audio controls className="w-full">
                    <source src={selectedMessage.audioUrl} type="audio/mpeg" />
                  </audio>
                </div>
              )}

              {/* Message content */}
              <div className="prose prose-sage max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Photos */}
              {selectedMessage.photos && selectedMessage.photos.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {selectedMessage.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt=""
                      className="rounded-lg w-full h-32 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Signature */}
              <div className="mt-8 pt-6 border-t text-center">
                <p className="text-gray-500 italic">
                  With all my love,
                </p>
                <p className="font-display text-xl text-sage-dark mt-1">
                  {selectedMessage.fromName}
                </p>
                <p className="text-sm text-gray-400">
                  Your {selectedMessage.fromRelationship}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Messages list view
  return (
    <div className="min-h-screen bg-gradient-to-b from-gold/10 to-cream p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">💌</span>
          <h1 className="font-display text-3xl text-sage-dark">
            Messages for {recipientName}
          </h1>
          <p className="text-gray-600 mt-2">
            Special messages from {ancestorName} and family
          </p>
          {currentAge && (
            <p className="text-sm text-gray-500 mt-1">
              You are {currentAge} years old
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-display text-sage">{unlockedCount}</p>
            <p className="text-sm text-gray-500">Opened</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display text-gray-400">{lockedCount}</p>
            <p className="text-sm text-gray-500">Waiting</p>
          </div>
        </div>

        {/* Messages list */}
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-5xl block mb-4">📬</span>
              <p className="text-gray-600 mb-4">
                No milestone messages yet.
              </p>
              {onCreateMessage && (
                <Button onClick={onCreateMessage}>
                  Create First Message
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedMessages.map((message) => (
              <Card
                key={message.id}
                className={`overflow-hidden transition-all ${
                  message.isUnlocked
                    ? "cursor-pointer hover:shadow-lg"
                    : "opacity-75"
                }`}
                onClick={() => message.isUnlocked && setSelectedMessage(message)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        message.isUnlocked
                          ? "bg-gold/20"
                          : "bg-gray-100"
                      }`}
                    >
                      {message.isUnlocked ? (
                        <span className="text-2xl">💌</span>
                      ) : (
                        <span className="text-2xl">🔒</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          message.isUnlocked ? "text-sage-dark" : "text-gray-400"
                        }`}
                      >
                        {message.isUnlocked ? message.title : "A Special Message"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {message.occasion}
                      </p>
                      {!message.isUnlocked && (
                        <p className="text-xs text-gray-400 mt-1">
                          {message.unlockAge
                            ? `Unlocks when you turn ${message.unlockAge}`
                            : message.unlockDate
                            ? `Unlocks ${formatDate(message.unlockDate)}`
                            : "Coming soon"}
                        </p>
                      )}
                    </div>

                    {/* Arrow or lock */}
                    {message.isUnlocked ? (
                      <span className="text-sage">→</span>
                    ) : (
                      <span className="text-gray-300">🔐</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create message button */}
        {onCreateMessage && messages.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={onCreateMessage}>
              ✍️ Write a Message for Someone
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              Write in {ancestorName}'s spirit for future milestones
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
