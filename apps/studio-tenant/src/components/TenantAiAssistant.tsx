import * as React from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  X,
  Radio,
  Zap,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  Button,
  Badge,
} from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface TenantAiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantAiAssistant({ open, onOpenChange }: TenantAiAssistantProps) {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Halo ${user?.name || "Rekan Teknisi"}! Saya K2NET AI Network Copilot. Saya dapat membantu menganalisa redaman serat optik, rekomendasi topologi OLT/ODP FAT, penanganan komplain pelanggan, dan simulasi penarikan kabel fiber. Apa yang ingin Anda diskusikan hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+J / Cmd+J
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    const handleCustomEvent = () => {
      onOpenChange(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("k2net-toggle-ai-assistant", handleCustomEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("k2net-toggle-ai-assistant", handleCustomEvent);
    };
  }, [open, onOpenChange]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // AI Response generation (telecom-focused)
    setTimeout(() => {
      let replyText = "";
      const lower = content.toLowerCase();

      if (lower.includes("redaman") || lower.includes("dbm") || lower.includes("odp")) {
        replyText = `📡 **Analisis Redaman Optik (ITU-T G.652D / G.671):**\n\nBerdasarkan standar telekomunikasi GPON kelas C+:\n- **Batas Normal ONU Rx:** \`-8 dBm\` s/d \`-27 dBm\`\n- **Status Kritis:** Jika redaman melampaui \`-27.5 dBm\`, periksa potensi bending pada drop core, kotoran konektor SC/UPC pada port FAT, atau rasio splitter bertingkat (1:8 ODC + 1:8 ODP total insertion loss ~21 dB).\n\n💡 *Saran Teknisi:* Gunakan VFL (Visual Fault Locator) dan bersihkan adaptor menggunakan One-Click Cleaner sebelum mengganti port.`;
      } else if (lower.includes("olt") || lower.includes("pon") || lower.includes("vlan")) {
        replyText = `⚙️ **Rekomendasi Konfigurasi OLT:**\n\n1. **Service Port:** Pastikan VLAN QinQ atau translate mode sesuai profile tenant ISP.\n2. **DBA Profile:** Gunakan Type 4 (Best Effort) untuk paket home broadband atau Type 1 (Fixed Bandwidth) untuk koneksi korporat dedicated.\n3. **Optical Transceiver:** Pantau temperatur modul SFP S-PON agar tidak melebihi 70°C.`;
      } else {
        replyText = `✅ **Jawaban AI Copilot:**\n\nUntuk konfigurasi operasional **${content}** pada portal tenant ${user?.tenantSlug?.toUpperCase() || "ISP"}:\n- Seluruh perubahan tercatat pada audit log gateway.\n- Anda dapat memverifikasi visualisasi rute penarikan secara real-time pada modul **Peta Spasial GIS**.`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: "Diagnosa redaman ODP > -27dBm", prompt: "Bagaimana langkah investigasi teknis jika redaman pada ODP-JKT-018 mencapai -27.8 dBm?" },
    { label: "Hitung insertion loss splitter 1:8 + 1:8", prompt: "Berapa total estimasi loss gabungan splitter 1:8 di ODC dan 1:8 di FAT ODP untuk kabel 4.5 km?" },
    { label: "Standar PPPoE profile & MTU", prompt: "Berapa nilai rekomendasi MTU/MRU untuk router ONT pelanggan GPON agar tidak fragmentasi?" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border/40 px-4 bg-background shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-foreground">AI Network Copilot</span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono px-1 py-0">
                  FTTH PRO
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {user?.tenantSlug?.toUpperCase() || "TENANT"} ASSISTANT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Bersihkan Percakapan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div className={`space-y-1 max-w-[85%]`}>
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border shadow-2xs whitespace-pre-line"
                  }`}
                >
                  {msg.text}
                </div>

                <div className={`flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <span>{msg.timestamp}</span>
                  {msg.sender === "ai" && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-foreground cursor-pointer flex items-center gap-0.5"
                    >
                      {copiedId === msg.id ? <Check className="h-2.5 w-2.5 text-primary" /> : <Copy className="h-2.5 w-2.5" />}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground mt-0.5 font-bold text-[10px]">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-muted-foreground text-xs pl-8">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>AI sedang menganalisis topologi...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts */}
        <div className="border-t border-border/40 p-2.5 bg-muted/20 space-y-1.5 shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" />
            Saran Diagnosa Teknis:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.prompt)}
                className="text-[11px] px-2 py-1 rounded-md border border-border/70 bg-card hover:bg-muted/60 text-foreground text-left cursor-pointer transition-colors line-clamp-1"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-border/40 p-3 bg-background shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan analisis jaringan, redaman, atau konfigurasi OLT..."
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isTyping}
              className="h-8 px-3 text-xs font-medium cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
