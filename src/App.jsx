import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Ruler,
  Download,
  FileCheck2,
  Filter,
  Gauge,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

const STORAGE_KEY = "ruang-mesin-prototype-v2";

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "raka", password: "siswa123", role: "student", userId: "student-1" },
  { username: "nadia", password: "siswa123", role: "student", userId: "student-2" },
  { username: "fajar", password: "siswa123", role: "student", userId: "student-3" },
];

const seedData = {
  tools: [
    { id: "tool-1", name: "Jangka Sorong Digital", category: "Alat Ukur", total: 12, available: 8, icon: "caliper", tone: "blue", code: "AM-001" },
    { id: "tool-2", name: "Mikrometer Sekrup", category: "Alat Ukur", total: 10, available: 6, icon: "micrometer", tone: "orange", code: "AM-002" },
    { id: "tool-3", name: "Kunci Momen", category: "Perkakas Tangan", total: 8, available: 5, icon: "wrench", tone: "green", code: "PT-014" },
    { id: "tool-4", name: "Bor Tangan Listrik", category: "Perkakas Tangan", total: 6, available: 2, icon: "drill", tone: "purple", code: "PT-021" },
    { id: "tool-5", name: "Gerinda Tangan", category: "Mesin Perkakas", total: 5, available: 0, icon: "grinder", tone: "red", code: "MP-008" },
    { id: "tool-6", name: "Mesin Bubut Mini", category: "Mesin Perkakas", total: 3, available: 2, icon: "lathe", tone: "slate", code: "MP-002" },
  ],
  users: [
    { id: "student-1", name: "Raka Mahendra", studentId: "231045021", className: "XI TPM 1", status: "active", email: "raka.mahendra@smkn1.sch.id" },
    { id: "student-2", name: "Nadia Putri", studentId: "231045018", className: "XI TPM 1", status: "active", email: "nadia.putri@smkn1.sch.id" },
    { id: "student-3", name: "Fajar Ramadhan", studentId: "231044006", className: "XI TPM 2", status: "suspended", email: "fajar.ramadhan@smkn1.sch.id" },
  ],
  loans: [],
};

const statusInfo = {
  pending_borrow: { label: "Menunggu verifikasi", className: "pending" },
  borrowed: { label: "Sedang dipinjam", className: "borrowed" },
  rejected: { label: "Perlu revisi foto", className: "rejected" },
  pending_return: { label: "Menunggu pengembalian", className: "pending" },
  completed: { label: "Selesai", className: "completed" },
  damaged: { label: "Bermasalah", className: "damaged" },
};

const categories = ["Semua kategori", "Alat Ukur", "Perkakas Tangan", "Mesin Perkakas"];
const formatDate = (date) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 11 ? "pagi" : hour < 15 ? "siang" : hour < 18 ? "sore" : "malam";
};

function readSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return seedData;
    const parsed = JSON.parse(saved);
    return {
      tools: Array.isArray(parsed.tools) ? parsed.tools : seedData.tools,
      users: Array.isArray(parsed.users) ? parsed.users : seedData.users,
      loans: Array.isArray(parsed.loans) ? parsed.loans : seedData.loans,
    };
  } catch (error) {
    console.error("Tidak dapat membaca data prototype dari penyimpanan lokal.", error);
    return seedData;
  }
}

function IconForTool({ type, size = 39 }) {
  const props = { size, strokeWidth: 1.65 };
  if (type === "wrench") return <Wrench {...props} />;
  if (type === "drill") return <Gauge {...props} />;
  if (type === "grinder") return <Settings2 {...props} />;
  if (type === "lathe") return <Settings2 {...props} />;
  if (type === "micrometer") return <SlidersHorizontal {...props} />;
  return <Ruler {...props} />;
}

function ToolArtwork({ tool, compact = false }) {
  return (
    <div className={`tool-art ${tool.tone} ${compact ? "compact" : ""}`}>
      <span className="art-code">{tool.code}</span>
      <div className="tool-art-icon"><IconForTool type={tool.icon} size={compact ? 30 : 43} /></div>
      <span className="art-grid" />
      <span className="art-spot" />
    </div>
  );
}

function StatusBadge({ status }) {
  const info = statusInfo[status] || statusInfo.pending_borrow;
  return <span className={`status-badge ${info.className}`}><span className="status-dot" />{info.label}</span>;
}

function PhotoUploader({ label, photo, onChange, required = true, hint }) {
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      window.alert("Ukuran foto maksimal 10 MB.");
      event.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      window.alert("Pilih file gambar (JPG, PNG, atau WEBP).");
      event.target.value = "";
      return;
    }
    try {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        onChange(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        window.alert("Foto tidak dapat dibuka. Coba pilih file gambar lain.");
      };
      image.src = objectUrl;
    } catch (error) {
      console.error("Gagal memproses foto.", error);
      window.alert("Foto gagal diproses. Silakan coba lagi.");
    }
  };

  return (
    <div className="field">
      <div className="field-label-row"><label>{label}{required && <span className="required-mark"> *</span>}</label><span className="field-helper">{hint || "JPG, PNG hingga 10 MB"}</span></div>
      <label className={`upload-box ${photo ? "has-photo" : ""}`}>
        {photo ? <><img src={photo} alt={`Pratinjau ${label.toLowerCase()}`} /><span className="photo-overlay"><ImagePlus size={16} /> Ganti foto</span></> : <><span className="upload-icon"><Camera size={19} /></span><strong>Ambil atau unggah foto</strong><small>Pastikan kondisi alat terlihat jelas</small></>}
        <input type="file" accept="image/*" onChange={handleFile} />
      </label>
    </div>
  );
}

function Modal({ title, eyebrow, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={19} /></button></header>
        {children}
      </section>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find((item) =>
      item.username === username.trim().toLowerCase() && item.password === password,
    );
    if (!account) {
      setError("Username atau password tidak sesuai. Periksa kembali lalu coba lagi.");
      return;
    }
    onLogin(account);
  };

  return (
    <main className="login-screen">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark"><Wrench size={20} strokeWidth={2.25} /></div>
          <div className="brand-copy"><strong>ruang<span>mesin</span></strong><small>LABORATORIUM MESIN</small></div>
        </div>
        <div className="login-heading">
          <span className="eyebrow">PORTAL LABORATORIUM</span>
          <h1>Selamat datang</h1>
          <p>Masuk dengan akun siswa atau admin untuk melanjutkan.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-username">Username</label>
            <input id="login-username" className="text-input" value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} placeholder="Masukkan username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" className="text-input" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Masukkan password" autoComplete="current-password" required />
          </div>
          {error && <div className="form-error" role="alert"><AlertTriangle size={15} />{error}</div>}
          <button type="submit" className="button button-primary login-submit">Masuk ke aplikasi <ArrowRight size={16} /></button>
        </form>
        <div className="demo-credentials">
          <div className="demo-credentials-heading"><CircleHelp size={15} /><strong>Akun demo untuk mencoba</strong></div>
          <div><span>Admin</span><code>admin</code><code>admin123</code></div>
          <div><span>Siswa</span><code>raka</code><code>siswa123</code></div>
          <small>Akun siswa lain: nadia atau fajar · password sama.</small>
        </div>
        <div className="login-footer"><Shield size={14} /> Sistem peminjaman alat praktik · Teknik Mesin</div>
      </section>
    </main>
  );
}

function App() {
  const [data, setData] = useState(readSavedState);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);
  const [page, setPage] = useState("overview");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua kategori");
  const [availability, setAvailability] = useState("all");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Tidak dapat menyimpan data prototype.", error);
      setToast("Penyimpanan lokal penuh. Coba gunakan foto berukuran lebih kecil.");
    }
  }, [data]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleLogin = (account) => {
    setRole(account.role);
    setActiveUserId(account.userId || null);
    setPage("overview");
    setSession(account.username);
  };

  const handleLogout = () => {
    setSession(null);
    setRole(null);
    setActiveUserId(null);
    setPage("overview");
    setSearch("");
  };

  const activeUser = data.users.find((user) => user.id === activeUserId) || data.users[0];
  const isAdmin = role === "admin";
  const myLoans = data.loans.filter((loan) => loan.userId === activeUser?.id);
  const pendingCount = data.loans.filter((loan) => loan.status === "pending_borrow" || loan.status === "pending_return").length;
  const filteredTools = useMemo(() => data.tools.filter((tool) => {
    const matchesSearch = `${tool.name} ${tool.category} ${tool.code}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Semua kategori" || tool.category === category;
    const matchesAvailability = availability === "all" || (availability === "available" ? tool.available > 0 : tool.available === 0);
    return matchesSearch && matchesCategory && matchesAvailability;
  }), [data.tools, search, category, availability]);

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const updateData = (updater, message) => {
    setData((current) => typeof updater === "function" ? updater(current) : updater);
    if (message) setToast(message);
  };

  const goTo = (nextPage) => {
    setPage(nextPage);
    setMobileNavOpen(false);
    setSearch("");
  };

  const submitLoan = ({ toolId, quantity, purpose, photo }) => {
    if (!photo) return setToast("Unggah foto kondisi awal sebelum mengajukan peminjaman.");
    if (activeUser.status !== "active") return setToast("Akun ditangguhkan. Hubungi admin lab untuk mengajukan peminjaman.");
    const tool = data.tools.find((item) => item.id === toolId);
    if (!tool || tool.available < 1) return setToast("Alat sedang tidak tersedia.");
    const loan = {
      id: `RM-${String(Date.now()).slice(-6)}`,
      userId: activeUser.id,
      toolId,
      quantity,
      purpose,
      borrowDate: new Date().toISOString(),
      returnDate: null,
      beforePhoto: photo,
      afterPhoto: "",
      status: "pending_borrow",
      adminNotes: "",
    };
    updateData((current) => ({ ...current, loans: [loan, ...current.loans] }), "Pengajuan terkirim. Menunggu verifikasi admin.");
    setModal(null);
    setPage("loans");
  };

  const submitReturn = (loanId, photo) => {
    if (!photo) return setToast("Unggah foto kondisi setelah sebelum mengajukan pengembalian.");
    updateData((current) => ({
      ...current,
      loans: current.loans.map((loan) => loan.id === loanId ? { ...loan, afterPhoto: photo, status: "pending_return" } : loan),
    }), "Pengembalian diajukan. Admin akan memeriksa kondisi alat.");
    setModal(null);
  };

  const approveBorrow = (loan) => {
    const tool = data.tools.find((item) => item.id === loan.toolId);
    const user = data.users.find((item) => item.id === loan.userId);
    if (!loan.beforePhoto) return setToast("Foto kondisi awal belum tersedia. Peminjaman tidak dapat disetujui.");
    if (!tool || tool.available < loan.quantity) return setToast("Stok tidak mencukupi. Tolak pengajuan atau sesuaikan jumlah stok.");
    if (user?.status !== "active") return setToast("Akun siswa ditangguhkan. Pulihkan akun sebelum menyetujui peminjaman.");
    updateData((current) => ({
      ...current,
      tools: current.tools.map((item) => item.id === tool.id ? { ...item, available: item.available - loan.quantity } : item),
      loans: current.loans.map((item) => item.id === loan.id ? { ...item, status: "borrowed", adminNotes: "" } : item),
    }), "Peminjaman disetujui. Stok tersedia telah diperbarui.");
    setModal(null);
  };

  const rejectBorrow = (loanId, note) => {
    if (!note.trim()) return setToast("Tambahkan catatan alasan penolakan terlebih dahulu.");
    updateData((current) => ({
      ...current,
      loans: current.loans.map((loan) => loan.id === loanId ? { ...loan, status: "rejected", adminNotes: note.trim() } : loan),
    }), "Pengajuan ditolak. Catatan revisi sudah dikirim ke siswa.");
    setModal(null);
  };

  const verifyReturn = (loan, damaged, note) => {
    if (damaged && !note.trim()) return setToast("Tuliskan catatan kerusakan untuk dokumentasi.");
    if (!loan.beforePhoto || !loan.afterPhoto) return setToast("Foto kondisi sebelum dan sesudah harus tersedia untuk verifikasi.");
    const tool = data.tools.find((item) => item.id === loan.toolId);
    updateData((current) => ({
      ...current,
      tools: !damaged && tool ? current.tools.map((item) => item.id === tool.id ? { ...item, available: Math.min(item.total, item.available + loan.quantity) } : item) : current.tools,
      loans: current.loans.map((item) => item.id === loan.id ? { ...item, status: damaged ? "damaged" : "completed", returnDate: new Date().toISOString(), adminNotes: damaged ? note.trim() : "" } : item),
      users: damaged ? current.users.map((user) => user.id === loan.userId ? { ...user, status: "suspended" } : user) : current.users,
    }), damaged ? "Kerusakan dicatat. Akun siswa ditangguhkan." : "Alat dinyatakan aman dan stok sudah kembali.");
    setModal(null);
  };

  const toggleStudentStatus = (userId) => {
    const target = data.users.find((user) => user.id === userId);
    if (!target) return;
    const nextStatus = target.status === "active" ? "suspended" : "active";
    updateData((current) => ({
      ...current,
      users: current.users.map((user) => user.id === userId ? { ...user, status: nextStatus } : user),
    }), nextStatus === "active" ? `${target.name} dapat kembali meminjam alat.` : `${target.name} ditangguhkan.`);
  };

  const saveTool = (toolInput) => {
    const isNew = !toolInput.id;
    const tool = isNew
      ? { ...toolInput, id: `tool-${Date.now()}`, code: `AL-${String(data.tools.length + 1).padStart(3, "0")}`, available: toolInput.total }
      : toolInput;
    updateData((current) => ({
      ...current,
      tools: isNew ? [...current.tools, tool] : current.tools.map((item) => item.id === tool.id ? tool : item),
    }), isNew ? "Alat baru berhasil ditambahkan." : "Data alat berhasil diperbarui.");
    setModal(null);
  };

  const deleteTool = (toolId) => {
    const hasActiveLoan = data.loans.some((loan) => loan.toolId === toolId && ["pending_borrow", "borrowed", "pending_return"].includes(loan.status));
    if (hasActiveLoan) return setToast("Alat tidak dapat dihapus karena masih memiliki transaksi aktif.");
    if (!window.confirm("Hapus alat ini dari katalog?")) return;
    updateData((current) => ({ ...current, tools: current.tools.filter((tool) => tool.id !== toolId) }), "Alat dihapus dari katalog.");
  };

  const navItems = isAdmin
    ? [
      { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
      { id: "catalog", label: "Katalog alat", icon: Package },
      { id: "verification", label: "Verifikasi", icon: FileCheck2, count: pendingCount },
      { id: "students", label: "Data siswa", icon: Shield },
    ]
    : [
      { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
      { id: "catalog", label: "Katalog alat", icon: Package },
      { id: "loans", label: "Peminjaman saya", icon: BookOpen },
    ];

  const pageTitle = {
    overview: isAdmin ? "Ringkasan lab" : `Selamat ${getGreeting()}, ${activeUser?.name?.split(" ")[0] || "Siswa"}`,
    catalog: "Katalog alat",
    loans: "Peminjaman saya",
    verification: "Pusat verifikasi",
    students: "Data siswa",
  }[page];

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900">
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Wrench size={20} strokeWidth={2.25} /></div><div className="brand-copy"><strong>ruang<span>mesin</span></strong><small>LABORATORIUM MESIN</small></div><button className="mobile-close icon-btn" onClick={() => setMobileNavOpen(false)} aria-label="Tutup menu"><X size={18} /></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switch"><span className="workspace-avatar">TM</span><span className="workspace-copy"><strong>Teknik Mesin</strong><small>Lab praktik · Gedung B</small></span><ChevronDown size={16} /></button>
        <div className="nav-heading">MENU UTAMA</div>
        <nav className="main-nav" aria-label="Navigasi utama">
          {navItems.map(({ id, label, icon: NavIcon, count }) => <button key={id} className={`nav-link ${page === id ? "active" : ""}`} onClick={() => goTo(id)}><NavIcon size={18} /><span>{label}</span>{count > 0 && <span className="nav-count">{count}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="lab-status"><span className="live-indicator" /><span><strong>Lab beroperasi</strong><small>Senin – Jumat, 07.00–16.00</small></span><ChevronRight size={15} /></div>
          <button className="help-link"><CircleHelp size={17} /> Pusat bantuan</button>
          <button className="profile-link" onClick={() => setModal({ type: "profile" })}><span className="avatar">{activeUser?.name?.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><span className="profile-copy"><strong>{isAdmin ? "Admin Laboratorium" : activeUser?.name}</strong><small>{isAdmin ? "Administrator" : activeUser?.className}</small></span><MoreHorizontal size={18} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-btn" onClick={() => setMobileNavOpen(true)} aria-label="Buka menu"><Menu size={20} /></button><div className="breadcrumb"><span>Ruang Mesin</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div></div>
          <div className="topbar-right">
            <span className="signed-in-account"><span className="avatar small">{isAdmin ? "AL" : activeUser?.name?.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><span>{isAdmin ? "Admin Lab" : activeUser?.name}</span></span>
            <button className="notification-btn icon-btn" onClick={() => goTo(isAdmin ? "verification" : "loans")} aria-label="Buka notifikasi"><Bell size={19} />{pendingCount > 0 && <i />}</button>
            <button className="logout-btn" onClick={handleLogout}><LogOut size={15} /><span>Keluar</span></button>
          </div>
        </header>
        <div className="content-wrap">
          {page === "overview" && (isAdmin
            ? <AdminOverview data={data} onNavigate={goTo} onVerify={(loan) => setModal({ type: loan.status === "pending_return" ? "verify-return" : "verify-borrow", loan })} />
            : <StudentOverview data={data} user={activeUser} myLoans={myLoans} onNavigate={goTo} onBorrow={(tool) => setModal({ type: "borrow", tool })} />)}
          {page === "catalog" && <CatalogPage tools={filteredTools} role={role} user={activeUser} search={search} setSearch={setSearch} category={category} setCategory={setCategory} availability={availability} setAvailability={setAvailability} onBorrow={(tool) => setModal({ type: "borrow", tool })} onAdd={() => setModal({ type: "tool", tool: null })} onEdit={(tool) => setModal({ type: "tool", tool })} onDelete={deleteTool} />}
          {page === "loans" && <LoansPage loans={myLoans} tools={data.tools} onReturn={(loan) => setModal({ type: "return", loan })} onBorrow={() => goTo("catalog")} />}
          {page === "verification" && <VerificationPage data={data} onVerifyBorrow={(loan) => setModal({ type: "verify-borrow", loan })} onVerifyReturn={(loan) => setModal({ type: "verify-return", loan })} />}
          {page === "students" && <StudentsPage data={data} onToggle={toggleStudentStatus} />}
        </div>
      </main>

      {modal?.type === "borrow" && <BorrowModal tool={modal.tool} user={activeUser} onClose={() => setModal(null)} onSubmit={submitLoan} />}
      {modal?.type === "return" && <ReturnModal loan={modal.loan} tool={data.tools.find((tool) => tool.id === modal.loan.toolId)} onClose={() => setModal(null)} onSubmit={(photo) => submitReturn(modal.loan.id, photo)} />}
      {modal?.type === "verify-borrow" && <VerifyBorrowModal loan={modal.loan} data={data} onClose={() => setModal(null)} onApprove={() => approveBorrow(modal.loan)} onReject={(note) => rejectBorrow(modal.loan.id, note)} />}
      {modal?.type === "verify-return" && <VerifyReturnModal loan={modal.loan} data={data} onClose={() => setModal(null)} onVerify={(damaged, note) => verifyReturn(modal.loan, damaged, note)} />}
      {modal?.type === "tool" && <ToolModal tool={modal.tool} onClose={() => setModal(null)} onSave={saveTool} />}
      {modal?.type === "profile" && <ProfileModal user={activeUser} isAdmin={isAdmin} onClose={() => setModal(null)} />}
      {toast && <div className="toast"><span className="toast-check"><Check size={15} /></span>{toast}<button onClick={() => setToast("")} aria-label="Tutup notifikasi"><X size={15} /></button></div>}
    </div>
  );
}

function PageIntro({ eyebrow, title, description, action }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function StudentOverview({ data, user, myLoans, onNavigate, onBorrow }) {
  const borrowed = myLoans.filter((loan) => ["borrowed", "pending_return"].includes(loan.status));
  const activeCount = myLoans.filter((loan) => loan.status === "borrowed").length;
  const availableCount = data.tools.reduce((sum, tool) => sum + tool.available, 0);
  const featuredTools = data.tools.filter((tool) => tool.available > 0).slice(0, 3);
  const latestLoans = [...myLoans].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)).slice(0, 3);
  return (
    <div className="page-content">
      <div className="welcome-banner"><div className="welcome-copy"><span className="welcome-kicker"><Sparkles size={14} /> SEMANGAT PRAKTIK HARI INI</span><h1>Selamat {getGreeting()}, {user?.name?.split(" ")[0] || "Siswa"} <span>✦</span></h1><p>Siap praktik hari ini? Pastikan alat yang kamu gunakan selalu dalam kondisi terbaik.</p><button className="button button-light" onClick={() => onNavigate("catalog")}>Jelajahi katalog <ArrowRight size={16} /></button></div><div className="welcome-graphic"><div className="graphic-orbit orbit-one" /><div className="graphic-orbit orbit-two" /><div className="graphic-core"><Wrench size={54} strokeWidth={1.4} /></div><div className="graphic-tag"><span className="live-indicator" /> {availableCount} alat siap digunakan</div><div className="graphic-spark spark-one">✦</div><div className="graphic-spark spark-two">+</div></div><div className="banner-grid" /></div>
      <div className="stats-grid student-stats">
        <StatCard label="Alat tersedia" value={availableCount} meta="Siap dipinjam hari ini" icon={Package} color="blue" />
        <StatCard label="Peminjaman aktif" value={activeCount} meta={activeCount > 0 ? "Jangan lupa dikembalikan" : "Tidak ada alat dipinjam"} icon={Activity} color="orange" />
        <StatCard label="Total transaksi" value={myLoans.length} meta="Sejak menggunakan lab" icon={FileCheck2} color="green" />
        <StatCard label="Status akun" value={user?.status === "active" ? "Aktif" : "Ditangguhkan"} meta={user?.status === "active" ? "Akun siap untuk meminjam" : "Hubungi admin laboratorium"} icon={Shield} color={user?.status === "active" ? "purple" : "red"} isText />
      </div>
      {borrowed.length > 0 && <section className="section-block"><div className="section-heading"><div><span className="eyebrow">JANGAN LUPA DIKEMBALIKAN</span><h2>Peminjaman aktif <span className="inline-count">{borrowed.length}</span></h2></div><button className="text-button" onClick={() => onNavigate("loans")}>Lihat semua <ArrowRight size={15} /></button></div><div className="active-loan-row">{borrowed.slice(0, 2).map((loan) => <ActiveLoanCard key={loan.id} loan={loan} tool={data.tools.find((tool) => tool.id === loan.toolId)} onNavigate={onNavigate} />)}</div></section>}
      <section className="section-block"><div className="section-heading"><div><span className="eyebrow">PILIHAN HARI INI</span><h2>Alat yang tersedia</h2></div><button className="text-button" onClick={() => onNavigate("catalog")}>Lihat katalog <ArrowRight size={15} /></button></div><div className="tool-grid">{featuredTools.map((tool) => <ToolCard key={tool.id} tool={tool} onBorrow={() => onBorrow(tool)} />)}</div></section>
      <section className="section-block activity-section"><div className="section-heading"><div><span className="eyebrow">AKTIVITAS TERBARU</span><h2>Riwayat peminjaman</h2></div><button className="text-button" onClick={() => onNavigate("loans")}>Lihat riwayat <ArrowRight size={15} /></button></div>{latestLoans.length > 0 ? <div className="table-card"><LoanTable loans={latestLoans} tools={data.tools} compact /> </div> : <EmptyState icon={BookOpen} title="Belum ada riwayat" text="Ajukan peminjaman alat pertamamu dari katalog." />}</section>
    </div>
  );
}

function AdminOverview({ data, onNavigate, onVerify }) {
  const totalStock = data.tools.reduce((sum, tool) => sum + tool.total, 0);
  const available = data.tools.reduce((sum, tool) => sum + tool.available, 0);
  const activeLoans = data.loans.filter((loan) => ["borrowed", "pending_return"].includes(loan.status));
  const queue = data.loans.filter((loan) => ["pending_borrow", "pending_return"].includes(loan.status)).slice(0, 4);
  const activeStudents = data.users.filter((user) => user.status === "active").length;
  return (
    <div className="page-content">
      <PageIntro eyebrow={new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()).toUpperCase()} title="Ringkasan lab" description="Pantau aktivitas peminjaman dan kondisi inventaris laboratorium." action={<button className="button button-primary" onClick={() => onNavigate("catalog")}><Plus size={16} /> Tambah alat</button>} />
      <div className="stats-grid admin-stats">
        <StatCard label="Total inventaris" value={totalStock} meta={`${data.tools.length} jenis alat terdaftar`} icon={Package} color="blue" />
        <StatCard label="Alat tersedia" value={available} meta={`${totalStock - available} sedang dipinjam / dicek`} icon={CheckCircle2} color="green" />
        <StatCard label="Sedang dipinjam" value={activeLoans.length} meta="Termasuk antrean pengembalian" icon={Activity} color="orange" />
        <StatCard label="Siswa aktif" value={activeStudents} meta={`${data.users.length - activeStudents} akun ditangguhkan`} icon={Shield} color="purple" />
      </div>
      <div className="admin-dashboard-grid">
        <section className="panel queue-panel"><div className="panel-heading"><div><span className="eyebrow">PERLU TINDAKAN</span><h2>Antrean verifikasi <span className="inline-count">{data.loans.filter((loan) => ["pending_borrow", "pending_return"].includes(loan.status)).length}</span></h2></div><button className="icon-btn" onClick={() => onNavigate("verification")} aria-label="Lihat semua verifikasi"><ArrowRight size={18} /></button></div>{queue.length ? <div className="queue-list">{queue.map((loan) => <QueueRow key={loan.id} loan={loan} data={data} onClick={() => onVerify(loan)} />)}</div> : <EmptyState icon={CheckCheck} title="Antrean kosong" text="Semua pengajuan sudah ditinjau." compact />}<button className="panel-footer-link" onClick={() => onNavigate("verification")}>Buka pusat verifikasi <ArrowRight size={15} /></button></section>
        <section className="panel inventory-panel"><div className="panel-heading"><div><span className="eyebrow">STOK LABORATORIUM</span><h2>Ketersediaan alat</h2></div><button className="icon-btn" onClick={() => onNavigate("catalog")} aria-label="Buka katalog"><ArrowRight size={18} /></button></div><div className="inventory-list">{data.tools.slice(0, 5).map((tool) => <div className="inventory-row" key={tool.id}><ToolArtwork tool={tool} compact /><div className="inventory-info"><strong>{tool.name}</strong><small>{tool.category}</small></div><div className="inventory-count"><strong>{tool.available}<span> / {tool.total}</span></strong><div className="mini-progress"><i style={{ width: `${(tool.available / tool.total) * 100}%` }} /></div></div></div>)}</div><button className="panel-footer-link" onClick={() => onNavigate("catalog")}>Kelola semua inventaris <ArrowRight size={15} /></button></section>
      </div>
      <section className="section-block admin-recent"><div className="section-heading"><div><span className="eyebrow">TRANSAKSI TERBARU</span><h2>Aktivitas peminjaman</h2></div><button className="text-button" onClick={() => onNavigate("verification")}>Lihat semua <ArrowRight size={15} /></button></div><div className="table-card"><LoanTable loans={[...data.loans].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)).slice(0, 5)} tools={data.tools} users={data.users} admin /></div></section>
    </div>
  );
}

function StatCard({ label, value, meta, icon: StatIcon, color, isText }) {
  return <article className="stat-card"><div className={`stat-icon ${color}`}><StatIcon size={19} strokeWidth={1.8} /></div><div className="stat-label">{label}</div><div className={`stat-value ${isText ? "text-value" : ""}`}>{value}</div><div className="stat-meta">{meta}</div><span className={`stat-decoration ${color}`} /></article>;
}

function ActiveLoanCard({ loan, tool, onNavigate }) {
  return <article className="active-loan-card"><ToolArtwork tool={tool} compact /><div className="active-loan-info"><span className="eyebrow">{loan.id}</span><strong>{tool?.name || "Alat dihapus"}</strong><small>{loan.status === "pending_return" ? "Menunggu pengecekan admin" : `Dipinjam · ${formatDate(loan.borrowDate)}`}</small></div><StatusBadge status={loan.status} /><button className="icon-btn" onClick={() => onNavigate("loans")} aria-label="Lihat detail"><ChevronRight size={17} /></button></article>;
}

function CatalogPage({ tools, role, user, search, setSearch, category, setCategory, availability, setAvailability, onBorrow, onAdd, onEdit, onDelete }) {
  const isAdmin = role === "admin";
  return <div className="page-content"><PageIntro eyebrow={isAdmin ? "MANAJEMEN INVENTARIS" : "SIAP UNTUK PRAKTIK?"} title="Katalog alat" description={isAdmin ? "Kelola inventaris dan pantau jumlah alat yang tersedia." : "Temukan alat praktik yang kamu butuhkan untuk kegiatan di lab."} action={isAdmin ? <button className="button button-primary" onClick={onAdd}><Plus size={16} /> Tambah alat</button> : <span className={`account-chip ${user?.status}`}><span className="status-dot" />{user?.status === "active" ? "Akun aktif" : "Akun ditangguhkan"}</span>} />
    {!isAdmin && user?.status !== "active" && <div className="suspension-notice"><AlertTriangle size={18} /><div><strong>Akun sedang ditangguhkan</strong><p>Kamu belum dapat mengajukan peminjaman baru. Hubungi admin laboratorium untuk informasi lebih lanjut.</p></div></div>}
    <div className="catalog-toolbar"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama alat atau kategori..." /><kbd>⌘ K</kbd></label><div className="toolbar-filters"><label className="select-field"><Filter size={15} /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label><label className="select-field"><SlidersHorizontal size={15} /><select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Semua stok</option><option value="available">Tersedia</option><option value="empty">Stok habis</option></select><ChevronDown size={15} /></label></div></div>
    <div className="catalog-result-row"><span><strong>{tools.length}</strong> alat ditemukan</span><span className="sort-hint">Urutkan: <strong>Nama alat</strong> <ChevronDown size={14} /></span></div>
    {tools.length ? <div className="tool-grid catalog-grid">{tools.map((tool) => <ToolCard key={tool.id} tool={tool} admin={isAdmin} disabled={user?.status !== "active"} onBorrow={() => onBorrow(tool)} onEdit={() => onEdit(tool)} onDelete={() => onDelete(tool.id)} />)}</div> : <EmptyState icon={Search} title="Alat tidak ditemukan" text="Coba ubah kata kunci atau filter pencarian." />}
  </div>;
}

function ToolCard({ tool, onBorrow, admin = false, disabled = false, onEdit, onDelete }) {
  const available = tool.available > 0;
  return <article className="tool-card"><div className="tool-card-art"><ToolArtwork tool={tool} /><span className={`stock-pill ${available ? "in-stock" : "out-stock"}`}><span className="status-dot" />{available ? "Tersedia" : "Stok habis"}</span>{admin && <button className="card-edit-btn" onClick={onEdit} aria-label={`Edit ${tool.name}`}><MoreHorizontal size={18} /></button>}</div><div className="tool-card-body"><div className="tool-category">{tool.category}<span>{tool.code}</span></div><h3>{tool.name}</h3><div className="tool-stock"><div><Package size={15} /><span>Stok tersedia</span></div><strong className={available ? "" : "stock-zero"}>{tool.available}<span> / {tool.total} unit</span></strong></div><div className="stock-bar"><span style={{ width: `${Math.min(100, (tool.available / tool.total) * 100)}%` }} /></div>{admin ? <div className="tool-admin-actions"><button className="button button-outline" onClick={onEdit}>Edit alat</button><button className="delete-tool-btn" onClick={onDelete} aria-label={`Hapus ${tool.name}`}><X size={17} /></button></div> : <button className={`button ${available && !disabled ? "button-primary" : "button-disabled"}`} disabled={!available || disabled} onClick={onBorrow}>{disabled ? <><LockKeyhole size={15} /> Akun ditangguhkan</> : available ? <>Ajukan pinjam <ArrowRight size={15} /></> : "Stok sedang habis"}</button>}</div></article>;
}

function LoansPage({ loans, tools, onReturn, onBorrow }) {
  const [filter, setFilter] = useState("all");
  const shown = [...loans].filter((loan) => filter === "all" || (filter === "active" ? ["borrowed", "pending_return", "pending_borrow"].includes(loan.status) : ["completed", "rejected", "damaged"].includes(loan.status))).sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
  return <div className="page-content"><PageIntro eyebrow="AKTIVITASMU DI LAB" title="Peminjaman saya" description="Lacak status pengajuan, pengembalian, dan riwayat transaksi alatmu." action={<button className="button button-primary" onClick={onBorrow}><Plus size={16} /> Pinjam alat</button>} />
    <div className="loan-summary-strip"><div><span className="strip-icon active"><Activity size={17} /></span><span><strong>{loans.filter((loan) => loan.status === "borrowed").length}</strong><small>Sedang dipinjam</small></span></div><i /><div><span className="strip-icon waiting"><Clock3 size={17} /></span><span><strong>{loans.filter((loan) => ["pending_borrow", "pending_return"].includes(loan.status)).length}</strong><small>Menunggu verifikasi</small></span></div><i /><div><span className="strip-icon done"><CheckCircle2 size={17} /></span><span><strong>{loans.filter((loan) => loan.status === "completed").length}</strong><small>Selesai dikembalikan</small></span></div></div>
    <div className="tabs-row"><div className="tab-buttons">{[{ id: "all", text: "Semua" }, { id: "active", text: "Aktif" }, { id: "history", text: "Riwayat" }].map((tab) => <button key={tab.id} className={filter === tab.id ? "selected" : ""} onClick={() => setFilter(tab.id)}>{tab.text}<span>{tab.id === "all" ? loans.length : tab.id === "active" ? loans.filter((loan) => ["borrowed", "pending_return", "pending_borrow"].includes(loan.status)).length : loans.filter((loan) => ["completed", "rejected", "damaged"].includes(loan.status)).length}</span></button>)}</div><button className="button button-outline export-button" onClick={() => window.print()}><Download size={15} /> Cetak riwayat</button></div>
    {shown.length ? <div className="loans-list">{shown.map((loan) => <LoanDetailCard key={loan.id} loan={loan} tool={tools.find((item) => item.id === loan.toolId)} onReturn={() => onReturn(loan)} />)}</div> : <EmptyState icon={BookOpen} title="Belum ada peminjaman" text="Mulai dengan memilih alat yang tersedia di katalog." action={<button className="button button-primary" onClick={onBorrow}>Buka katalog <ArrowRight size={15} /></button>} />}
  </div>;
}

function LoanDetailCard({ loan, tool, onReturn }) {
  return <article className="loan-detail-card"><ToolArtwork tool={tool} compact /><div className="loan-detail-main"><div className="loan-detail-title"><div><span className="eyebrow">{loan.id} · DIAJUKAN {formatDate(loan.borrowDate)}</span><h3>{tool?.name || "Alat dihapus"} <span className="quantity-tag">{loan.quantity} unit</span></h3></div><StatusBadge status={loan.status} /></div><p>{loan.purpose}</p>{loan.adminNotes && <div className={`admin-note ${loan.status === "damaged" ? "warning" : ""}`}><AlertTriangle size={15} /><span><strong>Catatan admin</strong>{loan.adminNotes}</span></div>}<div className="loan-card-footer"><div className="photo-indicators"><span className={loan.beforePhoto ? "uploaded" : ""}><Camera size={14} /> Foto awal {loan.beforePhoto ? <Check size={12} /> : <span>—</span>}</span><ArrowRight size={14} /><span className={loan.afterPhoto ? "uploaded" : ""}><Camera size={14} /> Foto akhir {loan.afterPhoto ? <Check size={12} /> : <span>—</span>}</span></div>{loan.status === "borrowed" && <button className="button button-primary button-small" onClick={onReturn}><Camera size={14} /> Kembalikan alat</button>}{loan.status === "pending_return" && <span className="waiting-copy"><Clock3 size={14} /> Foto pengembalian terkirim</span>}{loan.status === "rejected" && <span className="waiting-copy"><AlertTriangle size={14} /> Ajukan ulang dari katalog</span>}</div></div></article>;
}

function VerificationPage({ data, onVerifyBorrow, onVerifyReturn }) {
  const [tab, setTab] = useState("pending_borrow");
  const items = data.loans.filter((loan) => loan.status === tab);
  return <div className="page-content"><PageIntro eyebrow="PENGELOLAAN TRANSAKSI" title="Pusat verifikasi" description="Periksa kondisi alat dari foto sebelum menyetujui peminjaman atau pengembalian." />
    <div className="verification-note"><div className="verification-note-icon"><Shield size={20} /></div><div><strong>Verifikasi dengan teliti</strong><p>Pastikan kondisi pada foto jelas. Stok inventaris hanya berubah setelah pengajuan disetujui.</p></div><span className="live-indicator" /> <small>Data real-time</small></div>
    <div className="tabs-row verification-tabs"><div className="tab-buttons">{[{ id: "pending_borrow", text: "Pengajuan pinjam" }, { id: "pending_return", text: "Pengajuan kembali" }].map((item) => <button key={item.id} className={tab === item.id ? "selected" : ""} onClick={() => setTab(item.id)}>{item.text}<span>{data.loans.filter((loan) => loan.status === item.id).length}</span></button>)}</div></div>
    {items.length ? <div className="verification-list">{items.map((loan) => {const user = data.users.find((item) => item.id === loan.userId); const tool = data.tools.find((item) => item.id === loan.toolId); return <article className="verification-card" key={loan.id}><div className="verification-card-head"><div className="student-mini"><span className="avatar">{user?.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{user?.name || "Siswa"}</strong><small>{user?.studentId} · {user?.className}</small></div></div><span className="eyebrow">{loan.id} · {formatDate(loan.borrowDate)}</span></div><div className="verification-card-body"><div className="verification-tool"><ToolArtwork tool={tool} compact /><div><span className="eyebrow">{tool?.category} · {tool?.code}</span><strong>{tool?.name || "Alat dihapus"}</strong><small>{loan.quantity} unit · {loan.purpose}</small></div></div><div className="verification-photo-preview"><div><span>FOTO KONDISI SEBELUM</span>{loan.beforePhoto ? <img src={loan.beforePhoto} alt="Foto kondisi alat sebelum dipinjam" /> : <div className="missing-photo"><Camera size={20} /><span>Foto contoh belum diunggah</span></div>}</div>{tab === "pending_return" && <><ArrowRight size={18} /><div><span>FOTO KONDISI SESUDAH</span>{loan.afterPhoto ? <img src={loan.afterPhoto} alt="Foto kondisi alat setelah dikembalikan" /> : <div className="missing-photo"><Camera size={20} /><span>Foto belum diunggah</span></div>}</div></>}</div></div><div className="verification-card-footer"><div className="verification-date"><Clock3 size={14} /> {tab === "pending_return" ? "Menunggu pengecekan pengembalian" : "Menunggu persetujuan peminjaman"}</div><button className="button button-primary button-small" onClick={() => tab === "pending_return" ? onVerifyReturn(loan) : onVerifyBorrow(loan)}>{tab === "pending_return" ? "Periksa pengembalian" : "Tinjau foto awal"} <ArrowRight size={15} /></button></div></article>;})}</div> : <EmptyState icon={CheckCheck} title="Tidak ada antrean" text={tab === "pending_borrow" ? "Semua pengajuan pinjam sudah ditinjau." : "Belum ada pengajuan pengembalian alat."} />}
  </div>;
}

function StudentsPage({ data, onToggle }) {
  const [search, setSearch] = useState("");
  const students = data.users.filter((user) => `${user.name} ${user.studentId} ${user.className}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-content"><PageIntro eyebrow="MANAJEMEN PENGGUNA" title="Data siswa" description="Pantau aktivitas peminjaman dan kelola akses akun siswa." action={<div className="student-count-chip"><Shield size={16} /> {data.users.filter((user) => user.status === "active").length} akun aktif</div>} />
    <div className="student-page-stats"><StatCard label="Total siswa" value={data.users.length} meta="Akun terdaftar" icon={Shield} color="blue" /><StatCard label="Akun aktif" value={data.users.filter((user) => user.status === "active").length} meta="Dapat meminjam alat" icon={CheckCircle2} color="green" /><StatCard label="Ditangguhkan" value={data.users.filter((user) => user.status === "suspended").length} meta="Perlu tindak lanjut" icon={AlertTriangle} color="red" /></div>
    <div className="students-panel panel"><div className="panel-heading"><div><span className="eyebrow">DAFTAR AKUN</span><h2>Siswa laboratorium</h2></div><label className="search-field compact-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau NIS..." /></label></div><div className="table-wrap"><table className="data-table"><thead><tr><th>NAMA SISWA</th><th>NIS / NIM</th><th>KELAS</th><th>ALAT DIPINJAM</th><th>STATUS AKUN</th><th></th></tr></thead><tbody>{students.map((user) => {const count = data.loans.filter((loan) => loan.userId === user.id && ["borrowed", "pending_return"].includes(loan.status)).length;return <tr key={user.id}><td><div className="student-cell"><span className="avatar">{user.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td><td>{user.studentId}</td><td><span className="class-tag">{user.className}</span></td><td><span className="borrow-count">{count}<small> alat</small></span></td><td><span className={`account-badge ${user.status}`}><span className="status-dot" />{user.status === "active" ? "Aktif" : "Ditangguhkan"}</span></td><td><button className={`button ${user.status === "active" ? "button-soft-danger" : "button-soft-success"} action-small`} onClick={() => onToggle(user.id)}>{user.status === "active" ? "Tangguhkan" : "Pulihkan"}</button></td></tr>;})}</tbody></table>{students.length === 0 && <EmptyState icon={Search} title="Siswa tidak ditemukan" text="Periksa kembali nama atau nomor induk." compact />}</div></div>
  </div>;
}

function LoanTable({ loans, tools, users, admin = false, compact = false }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr>{admin && <th>SISWA</th>}<th>ALAT</th><th>TANGGAL PINJAM</th><th>JUMLAH</th><th>STATUS</th></tr></thead><tbody>{loans.map((loan) => <tr key={loan.id}>{admin && <td><div className="student-cell small-cell"><span className="avatar">{users?.find((user) => user.id === loan.userId)?.name.split(" ").map((word) => word[0]).slice(0, 2).join("") || "?"}</span><span><strong>{users?.find((user) => user.id === loan.userId)?.name || "Siswa"}</strong><small>{loan.id}</small></span></div></td>}<td><div className="tool-cell"><span className={`tool-cell-dot ${tools.find((tool) => tool.id === loan.toolId)?.tone || "blue"}`} /><span><strong>{tools.find((tool) => tool.id === loan.toolId)?.name || "Alat dihapus"}</strong><small>{tools.find((tool) => tool.id === loan.toolId)?.category || "—"}</small></span></div></td><td>{formatDate(loan.borrowDate)}</td><td>{loan.quantity} unit</td><td><StatusBadge status={loan.status} /></td></tr>)}</tbody></table></div>;
}

function QueueRow({ loan, data, onClick }) {
  const user = data.users.find((item) => item.id === loan.userId);
  const tool = data.tools.find((item) => item.id === loan.toolId);
  const returning = loan.status === "pending_return";
  return <button className="queue-row" onClick={onClick}><span className={`queue-icon ${returning ? "returning" : ""}`}>{returning ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</span><span className="queue-copy"><strong>{user?.name || "Siswa"} <span>{returning ? "mengembalikan" : "meminjam"}</span></strong><small>{tool?.name || "Alat"} · {loan.id}</small></span><span className="queue-time">{returning ? "Pengembalian" : "Peminjaman"}<ChevronRight size={15} /></span></button>;
}

function EmptyState({ icon: EmptyIcon, title, text, action, compact = false }) {
  return <div className={`empty-state ${compact ? "compact" : ""}`}><span className="empty-icon"><EmptyIcon size={22} /></span><strong>{title}</strong><p>{text}</p>{action}</div>;
}

function BorrowModal({ tool, user, onClose, onSubmit }) {
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!photo) return setError("Foto kondisi awal wajib diunggah.");
    if (!purpose.trim()) return setError("Isi keperluan atau mata praktik terlebih dahulu.");
    onSubmit({ toolId: tool.id, quantity, purpose: purpose.trim(), photo });
  };
  return <Modal eyebrow="FORMULIR PEMINJAMAN" title="Ajukan peminjaman" onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="selected-tool"><ToolArtwork tool={tool} compact /><div><span className="eyebrow">{tool.code} · {tool.category}</span><strong>{tool.name}</strong><small>{tool.available} unit tersedia</small></div></div><div className="form-grid"><div className="field"><label htmlFor="borrow-quantity">Jumlah alat</label><div className="quantity-control"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kurangi jumlah">−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(Math.min(tool.available, quantity + 1))} aria-label="Tambah jumlah">+</button></div><small className="field-helper">Maksimal {tool.available} unit</small></div><div className="field"><label htmlFor="borrow-purpose">Keperluan / mata praktik <span className="required-mark">*</span></label><input id="borrow-purpose" className="text-input" value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Contoh: Praktik pengukuran poros" required /></div></div><PhotoUploader label="Foto kondisi sebelum" photo={photo} onChange={(value) => { setPhoto(value); setError(""); }} hint="Wajib · Tampilkan kondisi alat dengan jelas" /><div className="photo-policy"><Shield size={15} /><span>Foto ini menjadi bukti kondisi alat sebelum dipinjam dan akan dibandingkan saat pengembalian.</span></div>{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Batal</button><button type="submit" className="button button-primary" disabled={!photo || user?.status !== "active"}>Kirim pengajuan <ArrowRight size={16} /></button></div></form></Modal>;
}

function ReturnModal({ loan, tool, onClose, onSubmit }) {
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  return <Modal eyebrow="PENGEMBALIAN ALAT" title="Kembalikan alat" onClose={onClose}><form className="modal-form" onSubmit={(event) => {event.preventDefault(); if (!photo) return setError("Foto kondisi akhir wajib diunggah."); onSubmit(photo);}}><div className="selected-tool"><ToolArtwork tool={tool} compact /><div><span className="eyebrow">{loan.id} · {loan.quantity} unit</span><strong>{tool?.name || "Alat dihapus"}</strong><small>{loan.purpose}</small></div></div><div className="comparison-note"><span className="comparison-thumb">{loan.beforePhoto ? <img src={loan.beforePhoto} alt="Foto sebelum" /> : <Camera size={18} />}</span><div><strong>Foto kondisi awal tersimpan</strong><small>Admin akan membandingkan dengan foto pengembalianmu.</small></div><CheckCircle2 size={17} /></div><PhotoUploader label="Foto kondisi setelah" photo={photo} onChange={(value) => {setPhoto(value); setError("");}} hint="Wajib · Foto seluruh bagian alat" />{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Batal</button><button type="submit" className="button button-primary" disabled={!photo}>Kirim pengembalian <ArrowRight size={16} /></button></div></form></Modal>;
}

function VerifyBorrowModal({ loan, data, onClose, onApprove, onReject }) {
  const user = data.users.find((item) => item.id === loan.userId);
  const tool = data.tools.find((item) => item.id === loan.toolId);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  return <Modal eyebrow="VERIFIKASI PEMINJAMAN" title="Tinjau kondisi alat" onClose={onClose} wide><div className="modal-form"><div className="verification-modal-meta"><div className="student-mini"><span className="avatar">{user?.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{user?.name}</strong><small>{user?.studentId} · {user?.className}</small></div></div><span className="eyebrow">{loan.id} · {formatDate(loan.borrowDate)}</span></div><div className="selected-tool slim"><ToolArtwork tool={tool} compact /><div><span className="eyebrow">{tool?.category} · {loan.quantity} unit</span><strong>{tool?.name || "Alat dihapus"}</strong><small>{loan.purpose}</small></div></div><div className="photo-review"><span className="eyebrow">FOTO KONDISI SEBELUM DIPINJAM</span>{loan.beforePhoto ? <img src={loan.beforePhoto} alt="Foto kondisi sebelum dipinjam" /> : <div className="missing-photo large"><Camera size={26} /><span>Foto belum diunggah untuk contoh transaksi</span></div>}</div>{rejecting && <div className="field"><label htmlFor="reject-note">Catatan revisi foto <span className="required-mark">*</span></label><textarea id="reject-note" className="text-input" rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Foto kurang jelas, silakan unggah ulang dengan pencahayaan lebih baik." /></div>}{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions spread"><button type="button" className="button button-soft-danger" onClick={() => {if (!rejecting) {setRejecting(true);return;} if (!note.trim()) {setError("Tambahkan alasan penolakan.");return;} onReject(note);}}>Tolak pengajuan</button><button type="button" className="button button-primary" disabled={user?.status !== "active" || !loan.beforePhoto} onClick={onApprove}><Check size={16} /> Setujui peminjaman</button></div>{(!loan.beforePhoto || user?.status !== "active") && <div className="form-error"><AlertTriangle size={15} />{!loan.beforePhoto ? "Tidak dapat disetujui karena foto kondisi awal belum tersedia." : "Akun siswa sedang ditangguhkan. Pulihkan akun sebelum menyetujui."}</div>}</div></Modal>;
}

function VerifyReturnModal({ loan, data, onClose, onVerify }) {
  const user = data.users.find((item) => item.id === loan.userId);
  const tool = data.tools.find((item) => item.id === loan.toolId);
  const [damaged, setDamaged] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  return <Modal eyebrow="VERIFIKASI PENGEMBALIAN" title="Bandingkan kondisi alat" onClose={onClose} wide><div className="modal-form"><div className="verification-modal-meta"><div className="student-mini"><span className="avatar">{user?.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{user?.name}</strong><small>{user?.studentId} · {user?.className}</small></div></div><span className="eyebrow">{loan.id} · {tool?.name}</span></div><div className="compare-photos"><div><span className="compare-label before"><Camera size={14} /> KONDISI SEBELUM</span>{loan.beforePhoto ? <img src={loan.beforePhoto} alt="Kondisi alat sebelum dipinjam" /> : <div className="missing-photo large"><Camera size={25} /><span>Foto awal contoh transaksi</span></div>}</div><div><span className="compare-label after"><Camera size={14} /> KONDISI SESUDAH</span>{loan.afterPhoto ? <img src={loan.afterPhoto} alt="Kondisi alat setelah dikembalikan" /> : <div className="missing-photo large"><Camera size={25} /><span>Foto akhir contoh transaksi</span></div>}</div></div>{(!loan.beforePhoto || !loan.afterPhoto) && <div className="form-error"><AlertTriangle size={15} />Transaksi contoh tidak memiliki kedua foto. Verifikasi membutuhkan foto sebelum dan sesudah.</div>}<label className={`damage-toggle ${damaged ? "selected" : ""}`}><input type="checkbox" checked={damaged} onChange={(event) => {setDamaged(event.target.checked);setError("");}} /><span className="toggle-check">{damaged && <Check size={13} />}</span><span><strong>Ada kerusakan atau masalah pada alat</strong><small>Catat kerusakan dan tangguhkan akun siswa</small></span></label>{damaged && <div className="field"><label htmlFor="damage-note">Catatan kerusakan <span className="required-mark">*</span></label><textarea id="damage-note" className="text-input" rows="3" value={note} onChange={(event) => {setNote(event.target.value);setError("");}} placeholder="Jelaskan bagian yang rusak atau masalah yang ditemukan." /></div>}{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Batal</button><button type="button" className={damaged ? "button button-danger" : "button button-primary"} disabled={!loan.beforePhoto || !loan.afterPhoto} onClick={() => {if (damaged && !note.trim()) {setError("Tuliskan catatan kerusakan.");return;}onVerify(damaged,note);}}>{damaged ? <><AlertTriangle size={16} /> Catat kerusakan</> : <><Check size={16} /> Tandai aman & selesai</>}</button></div></div></Modal>;
}

function ToolModal({ tool, onClose, onSave }) {
  const [name, setName] = useState(tool?.name || "");
  const [category, setCategory] = useState(tool?.category || "Alat Ukur");
  const [total, setTotal] = useState(tool?.total ?? 1);
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return setError("Nama alat wajib diisi.");
    if (total < 1) return setError("Stok minimal 1 unit.");
    if (tool && total < tool.total - tool.available) return setError("Stok total tidak boleh lebih sedikit dari jumlah alat yang sedang dipinjam.");
    onSave({ ...(tool || {}), name: name.trim(), category, total, available: tool ? Math.min(total, tool.available + Math.max(0, total - tool.total)) : total, icon: tool?.icon || (category === "Alat Ukur" ? "caliper" : category === "Mesin Perkakas" ? "lathe" : "wrench"), tone: tool?.tone || "blue" });
  };
  return <Modal eyebrow="MANAJEMEN INVENTARIS" title={tool ? "Edit data alat" : "Tambah alat baru"} onClose={onClose}><form className="modal-form" onSubmit={submit}><div className="field"><label htmlFor="tool-name">Nama alat <span className="required-mark">*</span></label><input id="tool-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Jangka Sorong Digital" /></div><div className="field"><label htmlFor="tool-category">Kategori</label><select id="tool-category" className="text-input" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="tool-stock">Jumlah stok total</label><input id="tool-stock" className="text-input" type="number" min="1" value={total} onChange={(event) => setTotal(Number(event.target.value))} /><small className="field-helper">{tool ? `${tool.total - tool.available} unit sedang dipinjam atau menunggu pemeriksaan.` : "Semua unit akan tercatat tersedia."}</small></div>{error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Batal</button><button type="submit" className="button button-primary">{tool ? "Simpan perubahan" : "Tambah alat"} <Check size={15} /></button></div></form></Modal>;
}

function ProfileModal({ user, isAdmin, onClose }) {
  return <Modal eyebrow="PROFIL AKUN" title={isAdmin ? "Admin Laboratorium" : user?.name || "Profil siswa"} onClose={onClose}><div className="modal-form"><div className="profile-summary"><span className="avatar large">{isAdmin ? "AL" : user?.name?.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{isAdmin ? "Administrator Lab Mesin" : user?.className}</strong><small>{isAdmin ? "Akses penuh pengelolaan lab" : `NIS ${user?.studentId}`}</small><span className={`account-badge ${isAdmin ? "active" : user?.status}`}><span className="status-dot" />{isAdmin ? "Admin" : user?.status === "active" ? "Akun aktif" : "Ditangguhkan"}</span></div></div><div className="profile-info-row"><span>Email</span><strong>{isAdmin ? "lab.mesin@smkn1.sch.id" : user?.email}</strong></div><div className="profile-info-row"><span>Unit</span><strong>Laboratorium Teknik Mesin</strong></div><button className="button button-outline full-width" onClick={onClose}><LogOut size={15} /> Tutup profil</button></div></Modal>;
}

export default App;
