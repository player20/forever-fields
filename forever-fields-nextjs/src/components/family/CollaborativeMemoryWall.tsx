"use client";

import { useState, useCallback } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Textarea, Input } from "@/components/ui";

interface MemoryPost {
  id: string;
  type: "text" | "photo" | "quote" | "milestone" | "song" | "video";
  content: string;
  caption?: string;
  mediaUrl?: string;
  author: string;
  authorAvatar?: string;
  relationship?: string;
  createdAt: Date;
  reactions: {
    hearts: number;
    candles: number;
    flowers: number;
  };
  userReacted?: boolean;
  backgroundColor?: string;
  pinnedBy?: string;
}

interface CollaborativeMemoryWallProps {
  deceasedName: string;
  posts?: MemoryPost[];
  onAddPost?: (post: Omit<MemoryPost, "id" | "createdAt" | "reactions">) => void;
  onReact?: (postId: string, reactionType: keyof MemoryPost["reactions"]) => void;
  currentUser?: string;
  userRelationship?: string;
}

const postTypeInfo = {
  text: { icon: "📝", label: "Memory", color: "#F5F5DC" },
  photo: { icon: "📸", label: "Photo", color: "#E8F5E9" },
  quote: { icon: "💬", label: "Quote", color: "#FFF8E1" },
  milestone: { icon: "🎯", label: "Milestone", color: "#E3F2FD" },
  song: { icon: "🎵", label: "Song", color: "#FCE4EC" },
  video: { icon: "🎬", label: "Video", color: "#F3E5F5" },
};

const reactionInfo = {
  hearts: { icon: "❤️", label: "Love" },
  candles: { icon: "🕯️", label: "Light a candle" },
  flowers: { icon: "🌸", label: "Leave flowers" },
};

const backgroundColors = [
  { value: "#FFFFFF", label: "White" },
  { value: "#FFF8E1", label: "Cream" },
  { value: "#E8F5E9", label: "Sage" },
  { value: "#E3F2FD", label: "Sky" },
  { value: "#FCE4EC", label: "Rose" },
  { value: "#F3E5F5", label: "Lavender" },
  { value: "#FFFDE7", label: "Sunlight" },
];

// Sample posts for demo
const samplePosts: MemoryPost[] = [
  {
    id: "1",
    type: "text",
    content: "I still make her recipes every Sunday. The house fills with the same smells and for a moment, it feels like she's right there in the kitchen with me. I hope she knows how much those meals meant to us.",
    author: "Mom",
    relationship: "Daughter",
    createdAt: new Date(Date.now() - 86400000 * 2),
    reactions: { hearts: 12, candles: 5, flowers: 3 },
    backgroundColor: "#FFF8E1",
  },
  {
    id: "2",
    type: "photo",
    content: "Found this while cleaning out the attic. Summer 1987 at the lake house. Look at those smiles!",
    mediaUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400",
    author: "Uncle Jim",
    relationship: "Son",
    createdAt: new Date(Date.now() - 86400000 * 5),
    reactions: { hearts: 24, candles: 2, flowers: 8 },
    backgroundColor: "#E8F5E9",
  },
  {
    id: "3",
    type: "quote",
    content: "\"Worry is like a rocking chair. It gives you something to do, but it doesn't get you anywhere.\"",
    caption: "She said this every time I stressed about exams. I still hear her voice when I start to spiral.",
    author: "Sarah",
    relationship: "Granddaughter",
    createdAt: new Date(Date.now() - 86400000 * 1),
    reactions: { hearts: 18, candles: 7, flowers: 4 },
    backgroundColor: "#FFFDE7",
    pinnedBy: "Family",
  },
  {
    id: "4",
    type: "milestone",
    content: "Today marks what would have been her 85th birthday. We're gathering at the lake house this weekend - just like she would have wanted. Everyone's bringing her favorite dishes.",
    author: "The Family",
    createdAt: new Date(Date.now() - 86400000 * 0.5),
    reactions: { hearts: 45, candles: 32, flowers: 21 },
    backgroundColor: "#E3F2FD",
    pinnedBy: "Admin",
  },
  {
    id: "5",
    type: "song",
    content: "Moon River - this was their wedding song. Every time I hear it, I think of them slow dancing in the kitchen.",
    caption: "Henry Mancini",
    author: "Dad",
    relationship: "Son-in-law",
    createdAt: new Date(Date.now() - 86400000 * 7),
    reactions: { hearts: 15, candles: 3, flowers: 5 },
    backgroundColor: "#FCE4EC",
  },
];

export function CollaborativeMemoryWall({
  deceasedName,
  posts = samplePosts,
  onAddPost,
  onReact,
  currentUser = "You",
  userRelationship = "Family",
}: CollaborativeMemoryWallProps) {
  const [viewMode, setViewMode] = useState<"wall" | "timeline">("wall");
  const [isComposing, setIsComposing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const [newPost, setNewPost] = useState<Partial<MemoryPost>>({
    type: "text",
    content: "",
    caption: "",
    backgroundColor: "#FFFFFF",
  });

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (!filter) return true;
    return post.type === filter;
  });

  // Sort by pinned first, then by date
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.pinnedBy && !b.pinnedBy) return -1;
    if (!a.pinnedBy && b.pinnedBy) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Format relative time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return "Just now";
  };

  // Handle photo upload
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewPost((prev) => ({
          ...prev,
          type: "photo",
          mediaUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Submit new post
  const handleSubmit = useCallback(() => {
    if (!newPost.content?.trim()) return;

    onAddPost?.({
      type: newPost.type || "text",
      content: newPost.content,
      caption: newPost.caption,
      mediaUrl: newPost.mediaUrl,
      author: currentUser,
      relationship: userRelationship,
      backgroundColor: newPost.backgroundColor,
    });

    setNewPost({
      type: "text",
      content: "",
      caption: "",
      backgroundColor: "#FFFFFF",
    });
    setIsComposing(false);
  }, [newPost, currentUser, userRelationship, onAddPost]);

  // Handle reaction
  const handleReaction = useCallback((postId: string, type: keyof MemoryPost["reactions"]) => {
    onReact?.(postId, type);
  }, [onReact]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Memory Wall</CardTitle>
            <CardDescription>
              A shared space to remember {deceasedName} together
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("wall")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "wall" ? "bg-sage text-white" : "bg-sage-pale text-sage-dark"
              }`}
              title="Wall view"
            >
              <span>⊞</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "timeline" ? "bg-sage text-white" : "bg-sage-pale text-sage-dark"
              }`}
              title="Timeline view"
            >
              <span>☰</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !filter ? "bg-sage text-white" : "bg-sage-pale text-sage-dark hover:bg-sage-light"
            }`}
          >
            All
          </button>
          {Object.entries(postTypeInfo).map(([key, { icon, label }]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                filter === key ? "bg-sage text-white" : "bg-sage-pale text-sage-dark hover:bg-sage-light"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Compose Button */}
        {!isComposing && (
          <button
            onClick={() => setIsComposing(true)}
            className="w-full p-4 mb-6 bg-sage-pale/30 rounded-lg border-2 border-dashed border-sage-light hover:border-sage hover:bg-sage-pale/50 transition-colors text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center">
              <span className="text-sage-dark text-xl">+</span>
            </div>
            <span className="text-sage-dark">Share a memory of {deceasedName}...</span>
          </button>
        )}

        {/* Compose Form */}
        {isComposing && (
          <div className="mb-6 p-4 bg-white border border-sage-light rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sage-dark">{currentUser}</span>
              {userRelationship && (
                <span className="text-sm text-gray-500">({userRelationship})</span>
              )}
            </div>

            {/* Post Type Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(postTypeInfo).map(([key, { icon, label }]) => (
                <button
                  key={key}
                  onClick={() => setNewPost({ ...newPost, type: key as MemoryPost["type"] })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    newPost.type === key
                      ? "bg-sage text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Content Input */}
            {newPost.type === "photo" ? (
              <div className="space-y-3">
                {newPost.mediaUrl ? (
                  <div className="relative">
                    <img
                      src={newPost.mediaUrl}
                      alt="Upload preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setNewPost({ ...newPost, mediaUrl: undefined })}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-sage transition-colors">
                    <span className="text-4xl mb-2 block">📷</span>
                    <span className="text-gray-500">Click to upload a photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share the story behind this photo..."
                  rows={2}
                />
              </div>
            ) : newPost.type === "quote" ? (
              <div className="space-y-3">
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={`"Something ${deceasedName} used to say..."`}
                  rows={3}
                  className="text-lg italic"
                />
                <Input
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  placeholder="When did they say this? What does it mean to you?"
                />
              </div>
            ) : newPost.type === "song" ? (
              <div className="space-y-3">
                <Input
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Song title"
                />
                <Input
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  placeholder="Artist name"
                />
                <Textarea
                  value={newPost.mediaUrl}
                  onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                  placeholder="Why is this song meaningful? (optional)"
                  rows={2}
                />
              </div>
            ) : (
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder={
                  newPost.type === "milestone"
                    ? "Share a special date or anniversary..."
                    : `Share a memory of ${deceasedName}...`
                }
                rows={4}
              />
            )}

            {/* Background Color */}
            <div className="mt-4">
              <label className="text-sm text-gray-500 mb-2 block">Background color:</label>
              <div className="flex gap-2">
                {backgroundColors.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setNewPost({ ...newPost, backgroundColor: value })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      newPost.backgroundColor === value
                        ? "border-sage scale-110"
                        : "border-gray-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsComposing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!newPost.content?.trim()}>
                Share Memory
              </Button>
            </div>
          </div>
        )}

        {/* Wall View */}
        {viewMode === "wall" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPosts.map((post) => {
              const typeInfo = postTypeInfo[post.type];
              return (
                <div
                  key={post.id}
                  className={`rounded-lg p-4 shadow-sm border border-gray-100 transition-transform hover:scale-[1.02] ${
                    post.pinnedBy ? "ring-2 ring-gold ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: post.backgroundColor || "#FFFFFF" }}
                >
                  {/* Pinned indicator */}
                  {post.pinnedBy && (
                    <div className="flex items-center gap-1 text-xs text-gold mb-2">
                      <span>📌</span> Pinned by {post.pinnedBy}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center text-sm">
                      {post.authorAvatar || post.author[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sage-dark text-sm truncate">{post.author}</p>
                      {post.relationship && (
                        <p className="text-xs text-gray-500">{post.relationship}</p>
                      )}
                    </div>
                    <span className="text-lg">{typeInfo.icon}</span>
                  </div>

                  {/* Content */}
                  {post.type === "photo" && post.mediaUrl && (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}

                  <p
                    className={`text-gray-700 ${
                      post.type === "quote" ? "text-lg italic" : ""
                    } ${post.type === "song" ? "font-medium" : ""}`}
                  >
                    {post.type === "quote" && "\""}
                    {post.content}
                    {post.type === "quote" && "\""}
                  </p>

                  {post.caption && (
                    <p className="text-sm text-gray-500 mt-2">{post.caption}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      {Object.entries(reactionInfo).map(([key, { icon }]) => {
                        const count = post.reactions[key as keyof typeof post.reactions];
                        return (
                          <button
                            key={key}
                            onClick={() => handleReaction(post.id, key as keyof MemoryPost["reactions"])}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-sage transition-colors"
                          >
                            <span className="text-base">{icon}</span>
                            {count > 0 && <span>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="relative pl-8 space-y-6">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-sage-light" />

            {sortedPosts.map((post) => {
              const typeInfo = postTypeInfo[post.type];
              return (
                <div key={post.id} className="relative">
                  <div
                    className="absolute left-[-1.35rem] w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white"
                    style={{ backgroundColor: typeInfo.color }}
                  >
                    {typeInfo.icon}
                  </div>

                  <div
                    className={`rounded-lg p-4 shadow-sm border border-gray-100 ${
                      post.pinnedBy ? "ring-2 ring-gold ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: post.backgroundColor || "#FFFFFF" }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sage-dark">{post.author}</span>
                        {post.relationship && (
                          <span className="text-sm text-gray-500">({post.relationship})</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                    </div>

                    {/* Content */}
                    {post.type === "photo" && post.mediaUrl && (
                      <img
                        src={post.mediaUrl}
                        alt=""
                        className="w-full max-h-48 object-cover rounded-lg mb-3"
                      />
                    )}

                    <p className={`text-gray-700 ${post.type === "quote" ? "text-lg italic" : ""}`}>
                      {post.type === "quote" && "\""}
                      {post.content}
                      {post.type === "quote" && "\""}
                    </p>

                    {post.caption && (
                      <p className="text-sm text-gray-500 mt-2">{post.caption}</p>
                    )}

                    {/* Reactions */}
                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                      {Object.entries(reactionInfo).map(([key, { icon }]) => {
                        const count = post.reactions[key as keyof typeof post.reactions];
                        return (
                          <button
                            key={key}
                            onClick={() => handleReaction(post.id, key as keyof MemoryPost["reactions"])}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-sage transition-colors"
                          >
                            <span>{icon}</span>
                            {count > 0 && <span>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-sm text-gray-500">
            {posts.length} memories shared by {new Set(posts.map((p) => p.author)).size} family members
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {posts.reduce((sum, p) => sum + p.reactions.hearts + p.reactions.candles + p.reactions.flowers, 0)} reactions of love
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
