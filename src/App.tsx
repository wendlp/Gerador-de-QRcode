import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import {
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronDown,
  Code2,
  Download,
  Globe2,
  Mail,
  Network,
  Palette,
  Phone,
  QrCode,
  RotateCcw,
  Smartphone,
  Sparkles,
  Undo2,
  Upload,
  UserRound,
} from "lucide-react";

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
  name: "",
  role: "",
  bio: "",
  whatsapp: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  instagram: "",
  website: "",
};

const initialColors: Colors = {
  primary: "#ff6647",
  text: "#16211f",
  background: "#fffdf8",
  qrForeground: "#16211f",
  qrBackground: "#ffffff",
};

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <details className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white" open>
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff0eb] text-[#ee5439]">
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-[#fbfbf9] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ff6647] focus:bg-white focus:ring-4 focus:ring-[#ff6647]/10"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#fbfbf9] p-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="flex items-center gap-2 font-mono text-xs uppercase text-slate-500">
        {value}
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={`Selecionar ${label.toLowerCase()}`}
        />
      </span>
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all ${
        disabled
          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-50"
          : primary
          ? "bg-[#16211f] text-white shadow-lg shadow-slate-900/15 hover:-translate-y-0.5 hover:bg-[#22302d] active:translate-y-0"
          : "border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
      }`}
    >
      {children}
    </button>
  );
}

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

  useEffect(() => {
    document.title = "PorTela — Cartão Digital";
  }, []);

  const updateProfile = (field: keyof Profile, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));
  const updateColor = (field: keyof Colors, value: string) =>
    setColors((current) => ({ ...current, [field]: value }));

  const hasName = profile.name.trim().length > 0;

  const isProfileEmpty = useMemo(() => {
    const hasText = Object.values(profile).some((val) => val.trim() !== "");
    return !hasText && !avatar;
  }, [profile, avatar]);

  const qrValue = useMemo(() => {
    if (!hasName) return "";
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.name}`,
      `TITLE:${profile.role}`,
      `TEL:${profile.phone || profile.whatsapp}`,
      `EMAIL:${profile.email}`,
      `URL:${profile.website ? `https://${profile.website.replace(/^https?:\/\//, "")}` : ""}`,
      "END:VCARD",
    ].join("\n");
  }, [profile, hasName]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleNewCard = () => {
    if (!isProfileEmpty) {
      const confirmClear = window.confirm("Limpar todos os campos e começar um novo cartão?");
      if (!confirmClear) return;

      setPrevious({
        profile,
        colors,
        avatar,
        gradientButtons,
      });
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
    if (!hasName) return;
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
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
    image.src = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const downloadCardJpg = async () => {
    if (!cardRef.current || !hasName) return;
    const dataUrl = await toJpeg(cardRef.current, {
      quality: 0.98,
      cacheBust: true,
      pixelRatio: 2,
    });
    triggerDownload(dataUrl, `${profile.name || "cartao"}-digital.jpg`);
    showNotice("Cartão JPG baixado com sucesso");
  };

  const downloadCardPdf = async () => {
    if (!cardRef.current || !hasName) return;
    const node = cardRef.current;
    const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [node.offsetWidth, node.offsetHeight],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, node.offsetWidth, node.offsetHeight);
    pdf.save(`${profile.name || "cartao"}-digital.pdf`);
    showNotice("Cartão PDF baixado com sucesso");
  };

  const buttonBackground = gradientButtons
    ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}cc)`
    : colors.primary;

  const contactLinks = [
    { icon: <Phone />, label: "WhatsApp", value: profile.whatsapp },
    { icon: <Mail />, label: "E-mail", value: profile.email },
    { icon: <Globe2 />, label: "Website", value: profile.website },
  ].filter((item) => item.value.trim() !== "");

  return (
    <main className="min-h-screen bg-[#f5f4ef] text-slate-900">
      <header className="border-b border-slate-200/80 bg-[#f5f4ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#16211f] text-white shadow-lg shadow-slate-900/10">
              <QrCode className="size-5" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold leading-none tracking-tight">
                PorTela — Cartão Digital
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Digital identity studio
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            Pré-visualização em tempo real
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-10 sm:px-8 lg:px-14 lg:pt-14">
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff6647]/20 bg-[#fff0eb] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#d94c33]">
            <Sparkles className="size-3.5" />
            Seu cartão. Sua presença.
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-[#16211f] sm:text-5xl">
            Crie conexões que ficam.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
            Personalize seu cartão digital, gere seu QR Code e compartilhe sua identidade em
            segundos.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:gap-14">
          <div className="space-y-4">
            <Section
              icon={<UserRound className="size-5" />}
              title="Informações pessoais"
              subtitle="Conte um pouco sobre você"
            >
              <div className="mb-5 flex items-center gap-4 rounded-2xl bg-[#f8f7f3] p-4">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#16211f] font-display text-xl font-bold text-white">
                  {avatar ? (
                    <img src={avatar} alt="Preview do perfil" className="h-full w-full object-cover" />
                  ) : hasName ? (
                    profile.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  ) : (
                    <UserRound className="size-8 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">Foto de perfil</p>
                  <p className="mt-1 text-xs text-slate-500">PNG ou JPG, até 5 MB</p>
                </div>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-slate-300">
                  <Upload className="size-4" />
                  Enviar
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatar}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nome completo"
                  value={profile.name}
                  placeholder="Ex.: Maria Silva"
                  onChange={(value) => updateProfile("name", value)}
                />
                <TextField
                  label="Cargo ou profissão"
                  value={profile.role}
                  placeholder="Ex.: Designer UI/UX"
                  onChange={(value) => updateProfile("role", value)}
                />
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Biografia curta</span>
                <textarea
                  value={profile.bio}
                  placeholder="Ex.: Especialista em criar produtos digitais simples e elegantes."
                  onChange={(event) => updateProfile("bio", event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-[#fbfbf9] px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ff6647] focus:bg-white focus:ring-4 focus:ring-[#ff6647]/10"
                />
              </label>
            </Section>

            <Section
              icon={<BriefcaseBusiness className="size-5" />}
              title="Contatos & redes"
              subtitle="Adicione seus melhores canais"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="WhatsApp"
                  value={profile.whatsapp}
                  placeholder="Ex.: +55 79 99999-9999"
                  onChange={(value) => updateProfile("whatsapp", value)}
                />
                <TextField
                  label="E-mail"
                  type="email"
                  value={profile.email}
                  placeholder="Ex.: nome@email.com"
                  onChange={(value) => updateProfile("email", value)}
                />
                <TextField
                  label="Telefone"
                  value={profile.phone}
                  placeholder="Ex.: (79) 3333-2222"
                  onChange={(value) => updateProfile("phone", value)}
                />
                <TextField
                  label="LinkedIn"
                  value={profile.linkedin}
                  placeholder="Ex.: linkedin.com/in/seuperfil"
                  onChange={(value) => updateProfile("linkedin", value)}
                />
                <TextField
                  label="GitHub"
                  value={profile.github}
                  placeholder="Ex.: github.com/seuusuario"
                  onChange={(value) => updateProfile("github", value)}
                />
                <TextField
                  label="Instagram"
                  value={profile.instagram}
                  placeholder="Ex.: @seuusuario"
                  onChange={(value) => updateProfile("instagram", value)}
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Website"
                    value={profile.website}
                    placeholder="Ex.: seusite.com.br"
                    onChange={(value) => updateProfile("website", value)}
                  />
                </div>
              </div>
            </Section>

            <Section
              icon={<Palette className="size-5" />}
              title="Aparência"
              subtitle="Deixe tudo com a sua cara"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Cores do cartão
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorField
                  label="Destaque"
                  value={colors.primary}
                  onChange={(value) => updateColor("primary", value)}
                />
                <ColorField
                  label="Texto"
                  value={colors.text}
                  onChange={(value) => updateColor("text", value)}
                />
                <ColorField
                  label="Fundo"
                  value={colors.background}
                  onChange={(value) => updateColor("background", value)}
                />
              </div>
              <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                Cores do QR Code
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField
                  label="Código"
                  value={colors.qrForeground}
                  onChange={(value) => updateColor("qrForeground", value)}
                />
                <ColorField
                  label="Fundo"
                  value={colors.qrBackground}
                  onChange={(value) => updateColor("qrBackground", value)}
                />
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f8f7f3] p-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">Botões com gradiente</p>
                  <p className="mt-1 text-xs text-slate-500">Adiciona mais profundidade ao cartão</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={gradientButtons}
                  onClick={() => setGradientButtons((current) => !current)}
                  className={`relative h-7 w-12 rounded-full transition ${
                    gradientButtons ? "bg-[#ff6647]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 grid size-5 place-items-center rounded-full bg-white shadow transition ${
                      gradientButtons ? "left-6" : "left-1"
                    }`}
                  >
                    {gradientButtons && <Check className="size-3 text-[#ff6647]" />}
                  </span>
                </button>
              </div>
            </Section>
          </div>

          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={handleBack} disabled={previous === null}>
                <Undo2 className="size-4" />
                Voltar
              </ActionButton>
              <ActionButton onClick={handleNewCard} primary>
                <RotateCcw className="size-4" />
                Gerar novo cartão
              </ActionButton>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(27,36,34,0.12)]">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="grid grid-cols-2 rounded-xl bg-[#f2f2ee] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("card")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                      activeTab === "card"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Smartphone className="size-4" />
                    Cartão digital
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                      activeTab === "qr"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <QrCode className="size-4" />
                    Apenas QR
                  </button>
                </div>
              </div>

              <div className="grid min-h-[680px] place-items-center overflow-hidden bg-[#e8e8e2] p-4 sm:p-8">
                <div
                  className={
                    activeTab === "card" ? "block" : "pointer-events-none fixed -left-[9999px] top-0"
                  }
                  aria-hidden={activeTab !== "card"}
                >
                  <div
                    ref={cardRef}
                    className="relative w-[375px] max-w-full overflow-hidden rounded-[34px] shadow-2xl"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-44 opacity-20"
                      style={{
                        background: `radial-gradient(circle at 15% 0%, ${colors.primary}, transparent 65%)`,
                      }}
                    />
                    <div className="relative flex min-h-[650px] flex-col px-7 pb-7 pt-9">
                      <div className="mb-6 flex items-center justify-between">
                        <span
                          className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em]"
                          style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                        >
                          Perfil digital
                        </span>
                        <span className="grid size-8 place-items-center rounded-full border border-current/10">
                          <Sparkles className="size-3.5" style={{ color: colors.primary }} />
                        </span>
                      </div>
                      <div
                        className="size-24 overflow-hidden rounded-[28px] border-4 shadow-xl"
                        style={{
                          borderColor: colors.background,
                          backgroundColor: colors.text,
                          color: colors.background,
                        }}
                      >
                        {avatar ? (
                          <img src={avatar} alt="" className="h-full w-full object-cover" />
                        ) : hasName ? (
                          <span className="grid h-full w-full place-items-center font-display text-3xl font-bold">
                            {profile.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        ) : (
                          <span className="grid h-full w-full place-items-center">
                            <UserRound className="size-10 text-slate-400" />
                          </span>
                        )}
                      </div>
                      <h2
                        className={`mt-5 font-display text-3xl font-extrabold tracking-[-0.04em] ${
                          !profile.name && "opacity-40"
                        }`}
                      >
                        {profile.name || "Seu nome"}
                      </h2>
                      <p
                        className={`mt-1 text-sm font-bold ${!profile.role && "opacity-40"}`}
                        style={{ color: colors.primary }}
                      >
                        {profile.role || "Sua profissão"}
                      </p>
                      {profile.bio && (
                        <p className="mt-4 text-sm leading-relaxed opacity-70 break-words">
                          {profile.bio}
                        </p>
                      )}

                      <div className="mt-6 space-y-2.5">
                        {contactLinks.map((contact) => (
                          <div
                            key={contact.label}
                            className="flex h-12 items-center gap-3 rounded-2xl px-4 text-white shadow-sm"
                            style={{ background: buttonBackground }}
                          >
                            <span className="[&>svg]:size-4">{contact.icon}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">
                              {contact.label}
                            </span>
                            <span className="max-w-36 truncate text-[10px] opacity-80">
                              {contact.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex items-end justify-between pt-7">
                        <div className="flex gap-2">
                          {[Network, Code2, Camera].map((Icon, index) => (
                            <span
                              key={index}
                              className="grid size-9 place-items-center rounded-xl border border-current/10"
                            >
                              <Icon className="size-4" />
                            </span>
                          ))}
                        </div>
                        {hasName && (
                          <div
                            className="rounded-xl border p-1.5"
                            style={{
                              backgroundColor: colors.qrBackground,
                              borderColor: `${colors.qrForeground}20`,
                            }}
                          >
                            <QRCodeSVG
                              value={qrValue}
                              size={52}
                              fgColor={colors.qrForeground}
                              bgColor={colors.qrBackground}
                              level="M"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex flex-col items-center text-center ${
                    activeTab === "qr" ? "flex" : "hidden"
                  }`}
                >
                  {hasName ? (
                    <>
                      <div
                        ref={qrRef}
                        className="rounded-[2rem] bg-white p-7 shadow-xl"
                        style={{ backgroundColor: colors.qrBackground }}
                      >
                        <QRCodeSVG
                          value={qrValue}
                          size={260}
                          fgColor={colors.qrForeground}
                          bgColor={colors.qrBackground}
                          level="H"
                          includeMargin
                        />
                      </div>
                      <p className="mt-5 font-display text-lg font-bold text-slate-800">
                        Pronto para compartilhar
                      </p>
                      <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
                        Ao escanear, seus contatos serão adicionados automaticamente.
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/50 p-10 text-center">
                      <QrCode className="size-12 text-slate-400" />
                      <p className="mt-4 text-sm font-bold text-slate-700">
                        Preencha seus dados para gerar o QR Code
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Insira pelo menos o seu nome no formulário.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm font-bold text-slate-900">Exportar criação</p>
                    <p className="mt-0.5 text-xs text-slate-500">Alta qualidade, pronto para usar</p>
                  </div>
                  <Download className="size-5 text-slate-400" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <ActionButton onClick={downloadQr} disabled={!hasName}>
                    QR · PNG
                  </ActionButton>
                  <ActionButton onClick={downloadCardJpg} disabled={!hasName}>
                    Cartão · JPG
                  </ActionButton>
                  <ActionButton onClick={downloadCardPdf} primary disabled={!hasName}>
                    Cartão · PDF
                  </ActionButton>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#16211f] px-5 py-3 text-sm font-bold text-white shadow-xl">
          <Check className="size-4 text-emerald-400" />
          {notice}
        </div>
      )}
    </main>
  );
}