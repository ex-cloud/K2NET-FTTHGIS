import * as React from "react";
import { Activity, Layers, Zap } from "lucide-react";
import type { Message, ChatSession, QuickIdea } from "./types";

const STORAGE_KEY = "k2net_tenant_ai_sessions";

export function useTenantAiChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [sessions, setSessions] = React.useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning.";
    if (h < 18) return "Good afternoon.";
    return "Good evening.";
  })();

  const quickIdeas: QuickIdea[] = [
    {
      id: "idea-1",
      title: "Diagnosa OLT & Redaman Optik",
      desc: "Troubleshooting OLT ZTE C320/Huawei, status LOS & redaman nominal",
      icon: Activity,
      prompt: "Bagaimana langkah investigasi teknis jika redaman pada ODP-JKT-018 mencapai -27.8 dBm?",
    },
    {
      id: "idea-2",
      title: "Analisis Jaringan Spasial GIS & ODP",
      desc: "Standar koordinat PostGIS EPSG:4326, kapasitas splitter 1:8 / 1:16",
      icon: Layers,
      prompt: "Berapa total estimasi loss gabungan splitter 1:8 di ODC dan 1:8 di FAT ODP untuk kabel 4.5 km?",
    },
    {
      id: "idea-3",
      title: "Health Check 12 Microservices",
      desc: "Verifikasi status poller, kong, postgres, keycloak, minio, audit",
      icon: Zap,
      prompt: "Bagaimana status kesehatan koneksi microservice poller ke Redis dan database Postgres?",
    },
  ];

  const handleSend = (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "";
      const lower = content.toLowerCase();

      if (lower.includes("redaman") || lower.includes("dbm") || lower.includes("odp")) {
        replyText = `📡 **Analisis Redaman Optik (ITU-T G.652D / G.671):**\n\nBerdasarkan standar telekomunikasi GPON kelas C+:\n- **Batas Normal ONU Rx:** \`-8 dBm\` s/d \`-27 dBm\`\n- **Status Kritis:** Jika redaman melampaui \`-27.5 dBm\`, periksa potensi bending pada drop core, kotoran konektor SC/UPC pada port FAT, atau rasio splitter bertingkat (1:8 ODC + 1:8 ODP total insertion loss ~21 dB).\n\n💡 *Saran Teknisi:* Gunakan VFL (Visual Fault Locator) dan bersihkan adaptor menggunakan One-Click Cleaner sebelum mengganti port.`;
      } else if (lower.includes("olt") || lower.includes("pon") || lower.includes("vlan")) {
        replyText = `⚙️ **Rekomendasi Konfigurasi OLT:**\n\n1. **Service Port:** Pastikan VLAN QinQ atau translate mode sesuai profile tenant ISP.\n2. **DBA Profile:** Gunakan Type 4 (Best Effort) untuk paket home broadband atau Type 1 (Fixed Bandwidth) untuk koneksi korporat dedicated.\n3. **Optical Transceiver:** Pantau temperatur modul SFP S-PON agar tidak melebihi 70°C.`;
      } else if (lower.includes("health") || lower.includes("service") || lower.includes("poller")) {
        replyText = `🩺 **Kesehatan Sistem & Microservices Tenant:**\n\n- **Database PostGIS:** Active Pool Connection 100% OK\n- **Map & Spatial Gateway:** Latency 14ms (Healthy)\n- **Redis Cache & Poller:** Connected (Buffer OK)\n- **Storage S3 Gateway:** Operational (Bucket MinIO Synced)\n\nSemua gateway beroperasi normal tanpa bottleneck antrean.`;
      } else {
        replyText = `✅ **Jawaban AI Copilot:**\n\nUntuk konfigurasi operasional **${content}** pada portal tenant:\n- Seluruh perubahan tercatat pada audit log gateway.\n- Anda dapat memverifikasi visualisasi rute penarikan secara real-time pada modul **Peta Spasial GIS**.`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      setIsTyping(false);

      if (activeSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: finalMessages, updatedAt: new Date().toISOString() }
              : s
          )
        );
      } else {
        const newSessionId = `session-${Date.now()}`;
        const newSession: ChatSession = {
          id: newSessionId,
          title: content.slice(0, 36) + (content.length > 36 ? "..." : ""),
          messages: finalMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSessionId);
      }
    }, 900);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setInput("");
  };

  const handleLoadSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setMessages(target.messages);
      setActiveSessionId(target.id);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  return {
    messages,
    input,
    setInput,
    isTyping,
    copiedId,
    greeting,
    quickIdeas,
    sessions,
    activeSessionId,
    handleSend,
    handleCopy,
    handleNewChat,
    handleLoadSession,
    handleDeleteSession,
  };
}
