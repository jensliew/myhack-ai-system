"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "@/hooks/useAuth";
import { sendMessage, subscribeToMessages, markMessagesRead } from "@/services/messaging/message.service";
import { relationshipsCollection, mentorsCollection, startupsCollection } from "@/firebase/collections";
import type { MessageDocument, RelationshipRecord } from "@/types/matching.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function formatTime(timestamp: any): string {
  if (!timestamp?.seconds) return "";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp: any): string {
  if (!timestamp?.seconds) return "";
  const date = new Date(timestamp.seconds * 1000);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [relationship, setRelationship] = useState<RelationshipRecord | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load relationship and other party name
  useEffect(() => {
    async function load() {
      if (!user || !relationshipId) return;
      const relSnap = await getDoc(doc(relationshipsCollection, relationshipId));
      if (!relSnap.exists()) return;
      const rel = { ...relSnap.data(), id: relSnap.id } as RelationshipRecord;
      setRelationship(rel);

      if (user.role === "startup") {
        const mentorSnap = await getDoc(doc(mentorsCollection, rel.mentorId));
        if (mentorSnap.exists()) setOtherName(mentorSnap.data()?.name ?? "Mentor");
      } else {
        const startupSnap = await getDoc(doc(startupsCollection, rel.startupId));
        if (startupSnap.exists()) setOtherName(startupSnap.data()?.name ?? "Startup");
      }
    }
    load();
  }, [user, relationshipId]);

  // Subscribe to messages
  useEffect(() => {
    if (!relationshipId) return;
    const unsub = subscribeToMessages(relationshipId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [relationshipId]);

  // Mark messages as read
  useEffect(() => {
    if (user && relationshipId) {
      markMessagesRead(relationshipId, user.id);
    }
  }, [messages, user, relationshipId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user || !relationship) return;
    setSending(true);
    try {
      const senderName = user.role === "startup"
        ? (await getDoc(doc(startupsCollection, user.entityId))).data()?.name ?? user.email
        : (await getDoc(doc(mentorsCollection, user.entityId))).data()?.name ?? user.email;

      await sendMessage(relationshipId, user.id, user.role as "startup" | "mentor", senderName, content);
      setContent("");
    } catch {
      // Silently fail
    }
    setSending(false);
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageDocument[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="font-semibold">{otherName || "Loading..."}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {user?.role === "startup" ? "Your Mentor" : "Your Startup"}
            {relationship?.status === "active" && <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Active</Badge>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Send className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start the conversation with {otherName}.</p>
          </div>
        )}

        {groupedMessages.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground px-2">{date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {dayMsgs.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      {!isMe && <span className="text-xs text-muted-foreground px-1">{msg.senderName}</span>}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-muted-foreground px-1">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t bg-card shrink-0">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message ${otherName}...`}
          className="flex-1"
          disabled={sending}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!content.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
