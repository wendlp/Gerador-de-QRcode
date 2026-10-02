import { ChangeEvent, ReactNode, useRef, useState, useMemo } from "react";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Download,
  Globe,
  Mail,
  Palette,
  Phone,
  QrCode,
  RotateCcw,
  Smartphone,
  Sparkles,
  Undo2,
  Upload,
  UserRound,
  Github,
  Linkedin,
  Share2,
  AlertCircle
} from "lucide-react";

// --- TIPOS ---
type Profile = {
  name: string;
  role: string;
  bio: string;
  whatsapp: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  instagram: string;
  website: string;
};

type Colors = {
  primary: string;
  text: string;
  background: string;
  qrForeground: string;
  qrBackground: string;
};

type SavedState = {
  profile: Profile;
  colors: Colors;
  avatar: string;
  gradientButtons: boolean;
};

const initialProfile: Profile = {
  name: "", role: "", bio: "", whatsapp: "", email: "", phone: "", linkedin: "", github: "", instagram: "", website: "",
};

const initialColors: Colors = {
  primary: "#6366f1", text: "#16211f", background: "#fffdf8", qrForeground: "#16211f", qrBackground: "#ffffff",
};

// --- COMPONENTES AUXILIARES ---
function Section({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm" open>
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold text-slate-900">{title}</span>
          <span className="mt-0.5 block text-sm text-slate-500">{subtitle}</span>
        </span>
        <ChevronDown className="size-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-6">{children}</div>
    </details>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-slate-200 bg-[#fbfbf9] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#fbfbf9] p-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="flex items-center gap-2 font-mono text-xs uppercase text-slate-500">
        {value}
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      </span>
    </label>
  );
}

function ActionButton({ children, onClick, primary = false, disabled = false }: { children: ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all ${disabled ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-50" : primary ? "bg-[#16211f] text-white shadow-lg hover:-translate-y-0.5 hover:bg-[#22302d]" : "border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"}`}>
      {children}
    </button>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [colors, setColors] = useState<Colors>(initialColors);
  const [avatar, setAvatar] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"card" | "qr">("card");
  const [gradientButtons, setGradientButtons] = useState(true);
  const [notice, setNotice] = useState("");
  const [previous, setPrevious] = useState<SavedState | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const updateProfile = (field: keyof Profile, value: string) => setProfile((current) => ({ ...current, [field]: value }));
  const updateColor = (field: keyof Colors, value: string) => setColors((current) => ({ ...current, [field]: value }));

  const hasName = profile.name.trim().length > 0;
  const isProfileEmpty = Object.values(profile).every((val) => val.trim() === "") && !avatar;

  const qrValue = useMemo(() => {
    if (!hasName) return "";
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.name}`,
      profile.role ? `TITLE:${profile.role}` : "",
      profile.phone || profile.whatsapp ? `TEL:${profile.phone || profile.whatsapp}` : "",
      profile.email ? `EMAIL:${profile.email}` : "",
      profile.website ? `URL:https://${profile.website.replace(/^https?:\/\//, "")}` : "",
      profile.bio ? `NOTE:${profile.bio}` : ""
    ].filter(Boolean);
    lines.push("END:VCARD");
    return lines.join("\r\n");
  }, [profile, hasName]);

  const showNotice = (message: string) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setNotice(message);
    timeoutRef.current = window.setTimeout(() => setNotice(""), 3000);
  };

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showNotice("Erro: A foto deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleNewCard = () => {
    if (!isProfileEmpty) {
      if (!window.confirm("Limpar todos os campos e começar um novo cartão?")) return;
      setPrevious({ profile, colors, avatar, gradientButtons });
    }
    setProfile(initialProfile);
    setColors(initialColors);
    setAvatar("");
    setGradientButtons(true);
    setActiveTab("card");
    setFileInputKey((prev) => prev + 1);
    showNotice("Novo cartão iniciado");
  };

  const handleBack = () => {
    if (!previous) return;
    setProfile(previous.profile);
    setColors(previous.colors);
    setAvatar(previous.avatar);
    setGradientButtons(previous.gradientButtons);
    setPrevious(null);
    showNotice("Cartão anterior restaurado");
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
  };

  const downloadQr = () => {
    if (!hasName || !qrRef.current) return;
    try {
      const svg = qrRef.current.querySelector("svg");
      if (!svg) throw new Error("SVG não encontrado");
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.fillStyle = colors.qrBackground;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        triggerDownload(canvas.toDataURL("image/png"), `${profile.name || "qrcode"}-qrcode.png`);
        showNotice("QR Code baixado com sucesso");
      };
      image.src = `data:image/svg+xml;base64,${window.btoa(decodeURIComponent(encodeURIComponent(svgData)))}`;
    } catch {
      showNotice("Erro ao gerar QR Code");
    }
  };

  const downloadCardJpg = async () => {
    if (!cardRef.current || !hasName) return;
    try {
      const dataUrl = await toJpeg(cardRef.current, { quality: 0.98, cacheBust: true, pixelRatio: 2 });
      triggerDownload(dataUrl, `${profile.name || "cartao"}.jpg`);
      showNotice("Cartão JPG baixado com sucesso");
    } catch {
      showNotice("Erro ao exportar JPG. Tente imagens menores.");
    }
  };

  const downloadCardPdf = async () => {
    if (!cardRef.current || !hasName) return;
    try {
      const node = cardRef.current;
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [node.offsetWidth, node.offsetHeight] });
      pdf.addImage(dataUrl, "PNG", 0, 0, node.offsetWidth, node.offsetHeight);
      pdf.save(`${profile.name || "cartao"}.pdf`);
      showNotice("Cartão PDF baixado com sucesso");
    } catch {
      showNotice("Erro ao exportar PDF.");
    }
  };

  const buttonBackground = gradientButtons ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}cc)` : colors.primary;

  const contactLinks = [
    { icon: <Phone />, label: "WhatsApp", value: profile.whatsapp },
    { icon: <Mail />, label: "E-mail", value: profile.email },
    { icon: <Linkedin />, label: "LinkedIn", value: profile.linkedin },
    { icon: <Github />, label: "GitHub", value: profile.github },
    { icon: <Share2 />, label: "Instagram", value: profile.instagram },
    { icon: <Globe />, label: "Website", value: profile.website },
  ].filter((item) => item.value.trim() !== "");

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <QrCode className="size-5" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold leading-none tracking-tight text-slate-800">
                PorTela
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Cartão Digital
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8 lg:px-14">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(400px,0.9fr)] xl:gap-14">
          
          <div className="space-y-4">
            <Section icon={<UserRound className="size-5" />} title="Informações pessoais" subtitle="Conte um pouco sobre você">
              <div className="mb-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#16211f] font-display text-xl font-bold text-white">
                  {avatar ? (
                    <img src={avatar} alt="Preview" className="h-full w-full object-cover" />
                  ) : hasName ? (
                    profile.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
                  ) : (
                    <UserRound className="size-7 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">Foto de perfil</p>
                  <p className="mt-1 text-xs text-slate-500">JPG/PNG, até 5 MB</p>
                </div>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                  <Upload className="size-4" /> Enviar
                  <input key={fileInputKey} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Nome completo" value={profile.name} placeholder="Ex.: Maria Silva" onChange={(val) => updateProfile("name", val)} />
                <TextField label="Cargo ou profissão" value={profile.role} placeholder="Ex.: Designer UI/UX" onChange={(val) => updateProfile("role", val)} />
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Biografia curta</span>
                <textarea value={profile.bio} placeholder="Ex.: Ajudo empresas a criarem identidades..." onChange={(e) => updateProfile("bio", e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-[#fbfbf9] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
              </label>
            </Section>

            <Section icon={<BriefcaseBusiness className="size-5" />} title="Contatos & redes" subtitle="Adicione seus canais">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="WhatsApp" value={profile.whatsapp} placeholder="Ex.: +55 11 99999-9999" onChange={(val) => updateProfile("whatsapp", val)} />
                <TextField label="E-mail" type="email" value={profile.email} placeholder="Ex.: ola@email.com" onChange={(val) => updateProfile("email", val)} />
                <TextField label="LinkedIn" value={profile.linkedin} placeholder="Ex.: linkedin.com/in/perfil" onChange={(val) => updateProfile("linkedin", val)} />
                <TextField label="GitHub" value={profile.github} placeholder="Ex.: github.com/perfil" onChange={(val) => updateProfile("github", val)} />
                <TextField label="Instagram" value={profile.instagram} placeholder="Ex.: @perfil" onChange={(val) => updateProfile("instagram", val)} />
                <TextField label="Website" value={profile.website} placeholder="Ex.: seusite.com.br" onChange={(val) => updateProfile("website", val)} />
              </div>
            </Section>

            <Section icon={<Palette className="size-5" />} title="Aparência" subtitle="Personalize as cores">
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorField label="Destaque" value={colors.primary} onChange={(val) => updateColor("primary", val)} />
                <ColorField label="Texto" value={colors.text} onChange={(val) => updateColor("text", val)} />
                <ColorField label="Fundo" value={colors.background} onChange={(val) => updateColor("background", val)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mt-4">
                <ColorField label="QR Código" value={colors.qrForeground} onChange={(val) => updateColor("qrForeground", val)} />
                <ColorField label="QR Fundo" value={colors.qrBackground} onChange={(val) => updateColor("qrBackground", val)} />
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">Botões com gradiente</p>
                  <p className="mt-1 text-xs text-slate-500">Adiciona profundidade</p>
                </div>
                <button type="button" onClick={() => setGradientButtons(!gradientButtons)} className={`relative h-7 w-12 rounded-full transition ${gradientButtons ? "bg-indigo-600" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 grid size-5 place-items-center rounded-full bg-white shadow transition ${gradientButtons ? "left-6" : "left-1"}`}>
                    {gradientButtons && <Check className="size-3 text-indigo-600" />}
                  </span>
                </button>
              </div>
            </Section>
          </div>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={handleBack} disabled={previous === null}>
                <Undo2 className="size-4" /> Voltar
              </ActionButton>
              <ActionButton onClick={handleNewCard} primary>
                <RotateCcw className="size-4" /> Novo cartão
              </ActionButton>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                  <button onClick={() => setActiveTab("card")} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === "card" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                    <Smartphone className="size-4" /> Cartão digital
                  </button>
                  <button onClick={() => setActiveTab("qr")} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${activeTab === "qr" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                    <QrCode className="size-4" /> Apenas QR
                  </button>
                </div>
              </div>

              <div className="grid min-h-[680px] place-items-center bg-[#e8e8e2] p-4 sm:p-8">
                <div className={activeTab === "card" ? "block" : "hidden"}>
                  <div ref={cardRef} className="relative w-[375px] max-w-full overflow-hidden rounded-[34px] shadow-2xl" style={{ backgroundColor: colors.background, color: colors.text }}>
                    <div className="absolute inset-x-0 top-0 h-44 opacity-20" style={{ background: `radial-gradient(circle at 15% 0%, ${colors.primary}, transparent 65%)` }} />
                    <div className="relative flex min-h-[650px] flex-col px-7 pb-7 pt-9">
                      <div className="mb-6 flex items-center justify-between">
                        <span className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                          Perfil digital
                        </span>
                        <Sparkles className="size-4" style={{ color: colors.primary }} />
                      </div>
                      
                      <div className="size-24 overflow-hidden rounded-[28px] border-4 shadow-md bg-white flex items-center justify-center" style={{ borderColor: colors.background, color: colors.primary }}>
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : hasName ? (
                          <span className="font-display text-3xl font-bold">{profile.name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase()}</span>
                        ) : (
                          <UserRound className="size-10 opacity-30" />
                        )}
                      </div>

                      <h2 className={`mt-5 font-display text-3xl font-extrabold tracking-tight ${!profile.name ? "opacity-40" : ""}`}>
                        {profile.name || "Seu nome"}
                      </h2>
                      <p className={`mt-1 text-sm font-bold ${!profile.role ? "opacity-40" : ""}`} style={{ color: colors.primary }}>
                        {profile.role || "Sua profissão"}
                      </p>
                      {profile.bio && <p className="mt-4 text-sm leading-relaxed opacity-75 break-words">{profile.bio}</p>}

                      <div className="mt-6 space-y-2.5">
                        {contactLinks.map((contact) => (
                          <div key={contact.label} className="flex h-12 items-center gap-3 rounded-2xl px-4 text-white shadow-sm" style={{ background: buttonBackground }}>
                            <span className="[&>svg]:size-4">{contact.icon}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">{contact.label}</span>
                            <span className="max-w-28 truncate text-[10px] opacity-80">{contact.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex items-end justify-center pt-8">
                        {hasName && (
                          <div className="rounded-2xl border p-2 shadow-sm bg-white" style={{ borderColor: `${colors.primary}30` }}>
                            <QRCodeSVG value={qrValue} size={64} fgColor={colors.qrForeground} bgColor="transparent" level="M" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex flex-col items-center text-center ${activeTab === "qr" ? "flex" : "hidden"}`}>
                  {hasName ? (
                    <>
                      <div ref={qrRef} className="rounded-3xl bg-white p-6 shadow-xl border border-slate-100" style={{ backgroundColor: colors.qrBackground }}>
                        <QRCodeSVG value={qrValue} size={240} fgColor={colors.qrForeground} bgColor={colors.qrBackground} level="H" />
                      </div>
                      <p className="mt-6 font-display text-lg font-bold text-slate-800">Pronto para escanear</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
                      <AlertCircle className="size-12 text-slate-400 mb-3" />
                      <p className="font-bold">Preencha seus dados</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm font-bold">Exportar</p>
                    <p className="text-xs text-slate-500">Pronto para impressão ou envio</p>
                  </div>
                  <Download className="size-5 text-slate-300" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ActionButton onClick={downloadQr} disabled={!hasName}>QR · PNG</ActionButton>
                  <ActionButton onClick={downloadCardJpg} disabled={!hasName}>Cartão · JPG</ActionButton>
                  <ActionButton onClick={downloadCardPdf} primary disabled={!hasName}>Cartão · PDF</ActionButton>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-5">
          {notice.includes("Erro") ? <AlertCircle className="size-4 text-red-400" /> : <Check className="size-4 text-emerald-400" />}
          {notice}
        </div>
      )}
    </main>
  );
}
