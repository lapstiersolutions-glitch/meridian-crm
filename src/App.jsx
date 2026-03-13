import { useState } from "react";

// ─── Auth Users & Roles ────────────────────────────────────────────────────────
// Roles: admin = full access | developer = read + limited edit, no delete | user = read-only
const USERS = [
  { id:"u1", name:"Alice Admin",  email:"admin@meridian.co",  password:"admin123", role:"admin",     avatar:"AA", title:"Administrator", passwordHint:"Your name + 123",    securityQuestion:"What city were you born in?",      securityAnswer:"london"   },
  { id:"u2", name:"Dev Dana",     email:"dev@meridian.co",    password:"dev123",   role:"developer", avatar:"DD", title:"Developer",     passwordHint:"Role + 123",         securityQuestion:"What is your mother's maiden name?", securityAnswer:"smith"    },
  { id:"u3", name:"User Uma",     email:"user@meridian.co",   password:"user123",  role:"user",      avatar:"UU", title:"Sales Rep",     passwordHint:"Role + 123",         securityQuestion:"What was the name of your first pet?", securityAnswer:"fluffy" },
  { id:"u4", name:"View Victor",  email:"viewer@meridian.co", password:"view123",  role:"viewer",    avatar:"VV", title:"Read Only",     passwordHint:"Role + 123",         securityQuestion:"What is your favorite color?",         securityAnswer:"blue"   },
];

const ROLE_CONFIG = {
  //                                     ── Companies ──────────────────────  ── Contacts ──────────────  ── Tasks ──────────────────  ── System ───────────────────────────────
  //                                     add    editOwn  manageAll  reassign   add     editOwn           addTask  editTask  deleteTask  viewAll  export   impersonate
  admin:     { label:"Admin",     color:"#7c3aed", bg:"rgba(124,58,237,0.1)",
    canAddCompany:true,  canEditOwnCompany:true,  canManageAllCompanies:true,  canReassign:true,
    canAddContact:true,  canEditContact:true,
    canAddTask:true,     canEditTask:true,  canDeleteTask:true,
    canViewAll:true,     canExport:true,    canImpersonate:true,
    // legacy aliases
    canAdd:true, canEdit:true, canDelete:true, canManageCompanies:true,
  },
  developer: { label:"Developer", color:"#2d6a8a", bg:"rgba(45,106,138,0.1)",
    canAddCompany:true,  canEditOwnCompany:true,  canManageAllCompanies:false, canReassign:false,
    canAddContact:true,  canEditContact:true,
    canAddTask:true,     canEditTask:true,  canDeleteTask:false,
    canViewAll:true,     canExport:true,    canImpersonate:false,
    // legacy aliases
    canAdd:true, canEdit:true, canDelete:false, canManageCompanies:true,
  },
  user:      { label:"User",      color:"#059669", bg:"rgba(5,150,105,0.1)",
    canAddCompany:false, canEditOwnCompany:true,  canManageAllCompanies:false, canReassign:false,
    canAddContact:true,  canEditContact:true,
    canAddTask:true,     canEditTask:true,  canDeleteTask:false,
    canViewAll:false,    canExport:false,   canImpersonate:false,
    // legacy aliases
    canAdd:true, canEdit:true, canDelete:false, canManageCompanies:false,
  },
  viewer:    { label:"Viewer",    color:"#9298a4", bg:"rgba(146,152,164,0.1)",
    canAddCompany:false, canEditOwnCompany:false, canManageAllCompanies:false, canReassign:false,
    canAddContact:false, canEditContact:false,
    canAddTask:false,    canEditTask:false, canDeleteTask:false,
    canViewAll:true,     canExport:false,   canImpersonate:false,
    // legacy aliases
    canAdd:false, canEdit:false, canDelete:false, canManageCompanies:false,
  },
};

const PERMISSION_KEYS = [
  { key:"canAddCompany",          icon:"🏢", label:"Add Companies",        desc:"Create new company records" },
  { key:"canEditOwnCompany",      icon:"✏️",  label:"Edit Own Companies",   desc:"Edit & delete companies they own" },
  { key:"canManageAllCompanies",  icon:"🔓", label:"Manage All Companies", desc:"Edit & delete any company regardless of owner" },
  { key:"canReassign",            icon:"🔁", label:"Reassign Ownership",   desc:"Transfer company/contact ownership to others" },
  { key:"canAddContact",          icon:"👤", label:"Add Contacts",         desc:"Add contacts to owned companies" },
  { key:"canEditContact",         icon:"✍️",  label:"Edit Contacts",        desc:"Edit & delete contacts on owned companies" },
  { key:"canAddTask",             icon:"➕", label:"Add Tasks",            desc:"Create tasks on owned companies" },
  { key:"canEditTask",            icon:"✅", label:"Edit & Complete Tasks", desc:"Edit, complete, reopen tasks on owned companies" },
  { key:"canDeleteTask",          icon:"🗑",  label:"Delete Tasks",         desc:"Permanently remove tasks" },
  { key:"canViewAll",             icon:"👁",  label:"View All Records",     desc:"See companies, contacts & tasks owned by others" },
  { key:"canExport",              icon:"📤", label:"Export Data",          desc:"Download CSV reports" },
  { key:"canImpersonate",         icon:"🎭", label:"Impersonate / Admin",  desc:"Act as any user; bypass all ownership rules" },
];

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, roleConfig=ROLE_CONFIG, users=USERS }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password flow: "idle" | "enterEmail" | "securityQ" | "resetPass" | "done"
  const [fpStep, setFpStep]   = useState("idle");
  const [fpEmail, setFpEmail] = useState("");
  const [fpUser, setFpUser]   = useState(null);
  const [fpAnswer, setFpAnswer] = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpError, setFpError] = useState("");
  const [showHint, setShowHint] = useState(false);

  const handle = () => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      const u = users.find(u => u.email === email.trim() && u.password === password);
      if (u) { onLogin(u); }
      else { setError("Invalid email or password."); setLoading(false); }
    }, 600);
  };

  const quickLogin = (u) => { setEmail(u.email); setPassword(u.password); setError(""); setFpStep("idle"); };

  const fpLookup = () => {
    const u = users.find(u => u.email === fpEmail.trim().toLowerCase());
    if (!u) { setFpError("No account found with that email."); return; }
    setFpUser(u); setFpError(""); setFpStep("securityQ");
  };

  const fpVerify = () => {
    if (fpAnswer.trim().toLowerCase() !== fpUser.securityAnswer.toLowerCase()) {
      setFpError("Incorrect answer. Please try again."); return;
    }
    setFpError(""); setFpStep("resetPass");
  };

  const fpReset = () => {
    if (fpNewPass.length < 4) { setFpError("Password must be at least 4 characters."); return; }
    if (fpNewPass !== fpConfirm) { setFpError("Passwords do not match."); return; }
    // Update password in the users array (mutate for in-memory demo)
    fpUser.password = fpNewPass;
    setFpStep("done");
  };

  const inp = { width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", fontSize:14, color:"#fff", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box", marginBottom:14 };
  const fpInp = { width:"100%", padding:"10px 13px", borderRadius:9, border:"1.5px solid #e2e4e8", background:"#fff", fontSize:14, color:"#18191b", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box", marginBottom:12 };
  const fpLbl = { fontSize:11, fontWeight:700, color:"#5a5e68", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:5 };

  // ── Forgot Password modal overlay ──────────────────────────────────────────
  const ForgotModal = () => (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#fff",borderRadius:18,padding:"28px 28px",width:"100%",maxWidth:400,boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"'DM Sans',sans-serif" }}>
        {fpStep==="enterEmail" && <>
          <div style={{ fontSize:24,marginBottom:4 }}>🔑</div>
          <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>Forgot Password</h3>
          <p style={{ margin:"0 0 18px",fontSize:13,color:"#5a5e68" }}>Enter your account email and we'll verify your identity.</p>
          <label style={fpLbl}>Email address</label>
          <input style={fpInp} type="email" value={fpEmail} placeholder="you@company.com" onChange={e=>{setFpEmail(e.target.value);setFpError("");}} onKeyDown={e=>e.key==="Enter"&&fpLookup()}/>
          {fpError&&<div style={{ fontSize:12,color:"#dc2626",marginBottom:10,fontWeight:600 }}>⚠ {fpError}</div>}
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={()=>{setFpStep("idle");setFpEmail("");setFpError("");}} style={{ padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",color:"#5a5e68",fontWeight:600,fontSize:13 }}>Cancel</button>
            <button onClick={fpLookup} disabled={!fpEmail.trim()} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:fpEmail.trim()?"linear-gradient(135deg,#3a6ea8,#4a84c0)":"#e2e4e8",color:fpEmail.trim()?"#fff":"#9298a4",cursor:fpEmail.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:13 }}>Continue →</button>
          </div>
        </>}

        {fpStep==="securityQ" && fpUser && <>
          <div style={{ fontSize:24,marginBottom:4 }}>🛡️</div>
          <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>Security Question</h3>
          <p style={{ margin:"0 0 6px",fontSize:13,color:"#5a5e68" }}>Answer the security question for <strong style={{ color:"#18191b" }}>{fpUser.name}</strong></p>
          <div style={{ background:"rgba(58,110,168,0.06)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#3a6ea8",fontWeight:600,border:"1px solid rgba(58,110,168,0.15)" }}>
            {fpUser.securityQuestion}
          </div>
          <label style={fpLbl}>Your answer</label>
          <input style={fpInp} type="text" value={fpAnswer} placeholder="Answer (not case-sensitive)" onChange={e=>{setFpAnswer(e.target.value);setFpError("");}} onKeyDown={e=>e.key==="Enter"&&fpVerify()}/>

          {/* Password hint */}
          <div style={{ marginBottom:14 }}>
            <button onClick={()=>setShowHint(h=>!h)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#9298a4",fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0 }}>
              💡 {showHint?"Hide":"Show"} password hint
            </button>
            {showHint&&<div style={{ marginTop:6,fontSize:13,color:"#5a5e68",background:"#f7f8fa",padding:"7px 12px",borderRadius:8,border:"1px solid #e2e4e8" }}>Hint: <em>{fpUser.passwordHint}</em></div>}
          </div>

          {fpError&&<div style={{ fontSize:12,color:"#dc2626",marginBottom:10,fontWeight:600 }}>⚠ {fpError}</div>}
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={()=>{setFpStep("enterEmail");setFpAnswer("");setFpError("");setShowHint(false);}} style={{ padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",color:"#5a5e68",fontWeight:600,fontSize:13 }}>← Back</button>
            <button onClick={fpVerify} disabled={!fpAnswer.trim()} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:fpAnswer.trim()?"linear-gradient(135deg,#3a6ea8,#4a84c0)":"#e2e4e8",color:fpAnswer.trim()?"#fff":"#9298a4",cursor:fpAnswer.trim()?"pointer":"not-allowed",fontWeight:700,fontSize:13 }}>Verify →</button>
          </div>
        </>}

        {fpStep==="resetPass" && <>
          <div style={{ fontSize:24,marginBottom:4 }}>🔓</div>
          <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>Set New Password</h3>
          <p style={{ margin:"0 0 18px",fontSize:13,color:"#5a5e68" }}>Choose a new password for <strong style={{ color:"#18191b" }}>{fpUser?.name}</strong></p>
          <label style={fpLbl}>New password</label>
          <input style={fpInp} type="password" value={fpNewPass} placeholder="Min 4 characters" onChange={e=>{setFpNewPass(e.target.value);setFpError("");}}/>
          <label style={fpLbl}>Confirm password</label>
          <input style={fpInp} type="password" value={fpConfirm} placeholder="Repeat new password" onChange={e=>{setFpConfirm(e.target.value);setFpError("");}} onKeyDown={e=>e.key==="Enter"&&fpReset()}/>
          {fpError&&<div style={{ fontSize:12,color:"#dc2626",marginBottom:10,fontWeight:600 }}>⚠ {fpError}</div>}
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={()=>{setFpStep("securityQ");setFpNewPass("");setFpConfirm("");setFpError("");}} style={{ padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",color:"#5a5e68",fontWeight:600,fontSize:13 }}>← Back</button>
            <button onClick={fpReset} disabled={!fpNewPass||!fpConfirm} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:(fpNewPass&&fpConfirm)?"linear-gradient(135deg,#27924a,#34a85a)":"#e2e4e8",color:(fpNewPass&&fpConfirm)?"#fff":"#9298a4",cursor:(fpNewPass&&fpConfirm)?"pointer":"not-allowed",fontWeight:700,fontSize:13 }}>Reset Password ✓</button>
          </div>
        </>}

        {fpStep==="done" && <>
          <div style={{ textAlign:"center",padding:"12px 0 4px" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
            <h3 style={{ margin:"0 0 8px",fontSize:18,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>Password Reset!</h3>
            <p style={{ margin:"0 0 20px",fontSize:13,color:"#5a5e68" }}>Your password has been updated. You can now sign in with your new password.</p>
            <button onClick={()=>{ setFpStep("idle"); setEmail(fpUser?.email||""); setPassword(""); setFpUser(null); setFpAnswer(""); setFpNewPass(""); setFpConfirm(""); setShowHint(false); }}
              style={{ padding:"11px 28px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif" }}>
              Back to Login →
            </button>
          </div>
        </>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1c1e22 0%,#2a2d35 50%,#363a45 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      {(fpStep!=="idle") && <ForgotModal/>}
      <div style={{ width:"100%", maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,#4a84c0,#3a6ea8)", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>◈</div>
          <h1 style={{ margin:0, fontFamily:"'Playfair Display',serif", fontSize:26, color:"#ffffff", fontWeight:700, letterSpacing:"-0.5px" }}>Meridian CRM</h1>
          <p style={{ margin:"6px 0 0", fontSize:13, color:"rgba(255,255,255,0.45)" }}>Sign in to continue</p>
        </div>

        {/* Login card */}
        <div style={{ background:"rgba(255,255,255,0.06)", backdropFilter:"blur(16px)", borderRadius:20, padding:"32px 28px", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
          <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:7 }}>Email</label>
          <input style={inp} type="email" value={email} placeholder="you@company.com" onChange={e=>{setEmail(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handle()} autoFocus/>

          <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", letterSpacing:"0.09em", textTransform:"uppercase", display:"block", marginBottom:7 }}>Password</label>
          <div style={{ position:"relative", marginBottom:6 }}>
            <input style={{ ...inp, paddingRight:44, marginBottom:0 }} type={showPass?"text":"password"} value={password} placeholder="••••••••" onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handle()} />
            <button onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"rgba(255,255,255,0.4)",padding:0 }}>{showPass?"🙈":"👁"}</button>
          </div>

          {/* Forgot password link */}
          <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:16 }}>
            <button onClick={()=>{setFpStep("enterEmail");setFpEmail(email);setFpError("");}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"rgba(148,184,255,0.75)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0 }}>
              Forgot password?
            </button>
          </div>

          {error&&<div style={{ background:"rgba(220,38,38,0.15)",border:"1px solid rgba(220,38,38,0.3)",borderRadius:9,padding:"10px 14px",marginBottom:14,color:"#fca5a5",fontSize:13,fontWeight:600 }}>⚠ {error}</div>}

          <button onClick={handle} disabled={loading||!email||!password} style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:(!email||!password||loading)?"#e2e4e8":"linear-gradient(135deg,#3a6ea8,#4a84c0)", color:(!email||!password||loading)?"#c0c8d4":"#fff", fontWeight:700, fontSize:15, cursor:(!email||!password||loading)?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:(!email||!password||loading)?"none":"0 4px 16px rgba(0,0,0,0.12)", transition:"all 0.2s" }}>
            {loading?"Signing in…":"Sign In →"}
          </button>

          {/* Quick login */}
          <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ margin:"0 0 10px", fontSize:11, color:"rgba(255,255,255,0.3)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", textAlign:"center" }}>Quick login (demo)</p>
            <div style={{ display:"flex", gap:8 }}>
              {users.map(u => {
                const rc = roleConfig[u.role] || ROLE_CONFIG[u.role];
                return (
                  <button key={u.id} onClick={()=>quickLogin(u)} style={{ flex:1, padding:"8px 6px", borderRadius:10, border:`1.5px solid ${rc.color}22`, background:rc.bg, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    <div style={{ fontSize:11, fontWeight:800, color:rc.color, letterSpacing:"0.05em" }}>{rc.label}</div>
                    <div style={{ fontSize:10, color:"#5a5e68", marginTop:1 }}>{u.name.split(" ")[0]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credentials hint — shows password hints not plain passwords */}
          <div style={{ marginTop:14, background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 14px" }}>
            <p style={{ margin:0, fontSize:11, color:"rgba(219,234,254,0.45)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.9 }}>
              {users.map((u,i) => {
                const rc = roleConfig[u.role] || ROLE_CONFIG[u.role];
                return <span key={u.id}>{i>0&&" · "}<strong style={{ color:`${rc.color}cc` }}>{rc.label}:</strong> {u.email} <span style={{ opacity:0.6 }}>(hint: {u.passwordHint})</span></span>;
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Country Data ──────────────────────────────────────────────────────────────
const COUNTRIES = [
  { name: "Afghanistan",    code: "AF", dial: "+93",  flag: "🇦🇫", tz: "Asia/Kabul" },
  { name: "Algeria",        code: "DZ", dial: "+213", flag: "🇩🇿", tz: "Africa/Algiers" },
  { name: "Argentina",      code: "AR", dial: "+54",  flag: "🇦🇷", tz: "America/Argentina/Buenos_Aires" },
  { name: "Australia",      code: "AU", dial: "+61",  flag: "🇦🇺", tz: "Australia/Sydney" },
  { name: "Austria",        code: "AT", dial: "+43",  flag: "🇦🇹", tz: "Europe/Vienna" },
  { name: "Bangladesh",     code: "BD", dial: "+880", flag: "🇧🇩", tz: "Asia/Dhaka" },
  { name: "Belgium",        code: "BE", dial: "+32",  flag: "🇧🇪", tz: "Europe/Brussels" },
  { name: "Brazil",         code: "BR", dial: "+55",  flag: "🇧🇷", tz: "America/Sao_Paulo" },
  { name: "Canada",         code: "CA", dial: "+1",   flag: "🇨🇦", tz: "America/Toronto" },
  { name: "Chile",          code: "CL", dial: "+56",  flag: "🇨🇱", tz: "America/Santiago" },
  { name: "China",          code: "CN", dial: "+86",  flag: "🇨🇳", tz: "Asia/Shanghai" },
  { name: "Denmark",        code: "DK", dial: "+45",  flag: "🇩🇰", tz: "Europe/Copenhagen" },
  { name: "Egypt",          code: "EG", dial: "+20",  flag: "🇪🇬", tz: "Africa/Cairo" },
  { name: "Finland",        code: "FI", dial: "+358", flag: "🇫🇮", tz: "Europe/Helsinki" },
  { name: "France",         code: "FR", dial: "+33",  flag: "🇫🇷", tz: "Europe/Paris" },
  { name: "Germany",        code: "DE", dial: "+49",  flag: "🇩🇪", tz: "Europe/Berlin" },
  { name: "Ghana",          code: "GH", dial: "+233", flag: "🇬🇭", tz: "Africa/Accra" },
  { name: "Greece",         code: "GR", dial: "+30",  flag: "🇬🇷", tz: "Europe/Athens" },
  { name: "Hong Kong",      code: "HK", dial: "+852", flag: "🇭🇰", tz: "Asia/Hong_Kong" },
  { name: "India",          code: "IN", dial: "+91",  flag: "🇮🇳", tz: "Asia/Kolkata" },
  { name: "Indonesia",      code: "ID", dial: "+62",  flag: "🇮🇩", tz: "Asia/Jakarta" },
  { name: "Ireland",        code: "IE", dial: "+353", flag: "🇮🇪", tz: "Europe/Dublin" },
  { name: "Israel",         code: "IL", dial: "+972", flag: "🇮🇱", tz: "Asia/Jerusalem" },
  { name: "Italy",          code: "IT", dial: "+39",  flag: "🇮🇹", tz: "Europe/Rome" },
  { name: "Japan",          code: "JP", dial: "+81",  flag: "🇯🇵", tz: "Asia/Tokyo" },
  { name: "Kenya",          code: "KE", dial: "+254", flag: "🇰🇪", tz: "Africa/Nairobi" },
  { name: "Malaysia",       code: "MY", dial: "+60",  flag: "🇲🇾", tz: "Asia/Kuala_Lumpur" },
  { name: "Mexico",         code: "MX", dial: "+52",  flag: "🇲🇽", tz: "America/Mexico_City" },
  { name: "Netherlands",    code: "NL", dial: "+31",  flag: "🇳🇱", tz: "Europe/Amsterdam" },
  { name: "New Zealand",    code: "NZ", dial: "+64",  flag: "🇳🇿", tz: "Pacific/Auckland" },
  { name: "Nigeria",        code: "NG", dial: "+234", flag: "🇳🇬", tz: "Africa/Lagos" },
  { name: "Norway",         code: "NO", dial: "+47",  flag: "🇳🇴", tz: "Europe/Oslo" },
  { name: "Pakistan",       code: "PK", dial: "+92",  flag: "🇵🇰", tz: "Asia/Karachi" },
  { name: "Philippines",    code: "PH", dial: "+63",  flag: "🇵🇭", tz: "Asia/Manila" },
  { name: "Poland",         code: "PL", dial: "+48",  flag: "🇵🇱", tz: "Europe/Warsaw" },
  { name: "Portugal",       code: "PT", dial: "+351", flag: "🇵🇹", tz: "Europe/Lisbon" },
  { name: "Qatar",          code: "QA", dial: "+974", flag: "🇶🇦", tz: "Asia/Qatar" },
  { name: "Russia",         code: "RU", dial: "+7",   flag: "🇷🇺", tz: "Europe/Moscow" },
  { name: "Saudi Arabia",   code: "SA", dial: "+966", flag: "🇸🇦", tz: "Asia/Riyadh" },
  { name: "Singapore",      code: "SG", dial: "+65",  flag: "🇸🇬", tz: "Asia/Singapore" },
  { name: "South Africa",   code: "ZA", dial: "+27",  flag: "🇿🇦", tz: "Africa/Johannesburg" },
  { name: "South Korea",    code: "KR", dial: "+82",  flag: "🇰🇷", tz: "Asia/Seoul" },
  { name: "Spain",          code: "ES", dial: "+34",  flag: "🇪🇸", tz: "Europe/Madrid" },
  { name: "Sri Lanka",      code: "LK", dial: "+94",  flag: "🇱🇰", tz: "Asia/Colombo" },
  { name: "Sweden",         code: "SE", dial: "+46",  flag: "🇸🇪", tz: "Europe/Stockholm" },
  { name: "Switzerland",    code: "CH", dial: "+41",  flag: "🇨🇭", tz: "Europe/Zurich" },
  { name: "Taiwan",         code: "TW", dial: "+886", flag: "🇹🇼", tz: "Asia/Taipei" },
  { name: "Thailand",       code: "TH", dial: "+66",  flag: "🇹🇭", tz: "Asia/Bangkok" },
  { name: "Turkey",         code: "TR", dial: "+90",  flag: "🇹🇷", tz: "Europe/Istanbul" },
  { name: "UAE",            code: "AE", dial: "+971", flag: "🇦🇪", tz: "Asia/Dubai" },
  { name: "Ukraine",        code: "UA", dial: "+380", flag: "🇺🇦", tz: "Europe/Kiev" },
  { name: "United Kingdom", code: "GB", dial: "+44",  flag: "🇬🇧", tz: "Europe/London" },
  { name: "United States",  code: "US", dial: "+1",   flag: "🇺🇸", tz: "America/New_York" },
  { name: "Venezuela",      code: "VE", dial: "+58",  flag: "🇻🇪", tz: "America/Caracas" },
  { name: "Vietnam",        code: "VN", dial: "+84",  flag: "🇻🇳", tz: "Asia/Ho_Chi_Minh" },
];

const INDUSTRIES = ["Finance","Legal","Technology","Healthcare","Real Estate","Consulting","Retail","Manufacturing","Media","Education","Other"];
const TASK_TYPES = ["Follow-up Call","Reminder","Meeting","Email","Proposal","Other"];
const TAGS = ["Decision Maker","Champion","Influencer","End User","Technical","Finance","Legal","Other"];
const TASK_PRIORITIES = ["High","Medium","Low"];
const STATUS_COLORS = {
  active:   { dot:"#4ade80", bg:"rgba(74,222,128,0.12)",  text:"#16a34a" },
  lead:     { dot:"#6b9fd4", bg:"rgba(96,165,250,0.12)",  text:"#3a6ea8" },
  inactive: { dot:"#9298a4", bg:"rgba(148,163,184,0.12)", text:"#5a5e68" },
};
const PRIORITY_COLORS = {
  High:   { bg:"rgba(239,68,68,0.1)",   text:"#dc2626", dot:"#ef4444" },
  Medium: { bg:"rgba(96,165,250,0.12)", text:"#3a6ea8", dot:"#6b9fd4" },
  Low:    { bg:"rgba(148,163,184,0.12)",text:"#5a5e68", dot:"#9298a4" },
};

// ─── Initial Data ──────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0,10);

function formatDate(dateStr, fmt="YYYY-MM-DD") {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const mon = d.toLocaleString("default",{month:"short"});
  if (fmt==="DD/MM/YYYY")  return `${day}/${m}/${y}`;
  if (fmt==="MM/DD/YYYY")  return `${m}/${day}/${y}`;
  if (fmt==="DD MMM YYYY") return `${day} ${mon} ${y}`;
  return `${y}-${m}-${day}`; // default YYYY-MM-DD
}
const daysFromNow = (d) => { const dt = new Date(); dt.setDate(dt.getDate()+d); return dt.toISOString().slice(0,10); };

// Returns { stamp:"YYYY-MM-DD HH:MM", label:"Company edit"|"Task"|"Note" } for the most recent activity
function getLastActivity(co, coTasks, coContacts) {
  const entries = [];
  if (co.modifiedAt) entries.push({ stamp:co.modifiedAt, label:"Company edit" });
  coTasks.forEach(t => {
    if (t.updatedAt) entries.push({ stamp:t.updatedAt, label:"Task updated" });
    else if (t.createdAt) entries.push({ stamp:t.createdAt, label:"Task added" });
  });
  coContacts.forEach(ct => {
    if (ct.modifiedAt && ct.modifiedAt !== ct.createdAt)
      entries.push({ stamp:ct.modifiedAt, label:"Contact edited \u00b7 "+ct.name });
    if (ct.createdAt)
      entries.push({ stamp:ct.createdAt, label:"Contact added \u00b7 "+ct.name });
    (ct.notes||[]).forEach(n => {
      const s = n.time ? `${n.date} ${n.time}` : n.date;
      entries.push({ stamp:s, label:"Note \u00b7 "+ct.name });
    });
  });
  (co.notesList||[]).forEach(n => {
    const s = n.time ? `${n.date} ${n.time}` : n.date;
    entries.push({ stamp:s, label:"Company note" });
  });
  if (!entries.length) return null;
  return entries.reduce((best, e) => e.stamp > best.stamp ? e : best);
}


const initialCompanies = [
  { id:"c1", name:"Apple",          industry:"Technology",   website:"apple.com",        country:"US", notes:"Key technology partner. Active since 2021.",         ownerId:"u1", createdBy:"u1", createdAt:"2025-06-12 09:14", modifiedBy:"u1", modifiedAt:"2026-01-20 11:32" },
  { id:"c2", name:"Google",         industry:"Technology",   website:"google.com",       country:"US", notes:"Strategic advertising & cloud partner.",              ownerId:"u1", createdBy:"u2", createdAt:"2025-07-03 14:22", modifiedBy:"u2", modifiedAt:"2026-02-14 16:05" },
  { id:"c3", name:"Microsoft",      industry:"Technology",   website:"microsoft.com",    country:"US", notes:"Enterprise software vendor.",                         ownerId:"u2", createdBy:"u2", createdAt:"2025-08-18 10:00", modifiedBy:"u2", modifiedAt:"2026-01-09 09:47" },
  { id:"c4", name:"Stripe",         industry:"Finance",      website:"stripe.com",       country:"US", notes:"Payment infrastructure provider.",                    ownerId:"u2", createdBy:"u1", createdAt:"2025-09-01 15:33", modifiedBy:"u1", modifiedAt:"2026-02-28 13:21" },
  { id:"c5", name:"Salesforce",     industry:"Technology",   website:"salesforce.com",   country:"US", notes:"CRM platform. Renewal due Q3.",                       ownerId:"u1", createdBy:"u1", createdAt:"2025-10-15 08:55", modifiedBy:"u1", modifiedAt:"2026-03-01 10:44" },
  { id:"c6", name:"Amazon",         industry:"Retail",       website:"amazon.com",       country:"US", notes:"Cloud & logistics partner.",                          ownerId:"u2", createdBy:"u2", createdAt:"2025-11-22 17:08", modifiedBy:"u1", modifiedAt:"2026-02-10 14:30" },
  { id:"c7", name:"HubSpot",        industry:"Technology",   website:"hubspot.com",      country:"US", notes:"Marketing automation prospect. Initial demo done.",   ownerId:"u1", createdBy:"u1", createdAt:"2024-09-10 10:00", modifiedBy:"u1", modifiedAt:"2024-10-01 11:00" },
  { id:"c8", name:"Zendesk",        industry:"Technology",   website:"zendesk.com",      country:"US", notes:"Support tooling evaluation stalled.",                 ownerId:"u2", createdBy:"u2", createdAt:"2024-07-05 09:30", modifiedBy:"u2", modifiedAt:"2024-08-15 14:00" },
  { id:"c9", name:"Intercom",       industry:"Technology",   website:"intercom.com",     country:"GB", notes:"Chat platform. Went cold after pricing call.",        ownerId:"u1", createdBy:"u1", createdAt:"2024-11-20 13:00", modifiedBy:"u1", modifiedAt:"2024-12-05 10:30" },
  { id:"c10",name:"Notion",         industry:"Technology",   website:"notion.so",        country:"US", notes:"Productivity suite. Procurement delay.",              ownerId:"u3", createdBy:"u3", createdAt:"2025-01-15 08:00", modifiedBy:"u3", modifiedAt:"2025-02-20 09:00" },
  { id:"c11",name:"Figma",          industry:"Technology",   website:"figma.com",        country:"US", notes:"Design tool for product team. POC in progress.",      ownerId:"u1", createdBy:"u1", createdAt:"2025-03-01 11:00", modifiedBy:"u1", modifiedAt:"2025-04-10 15:00" },
  { id:"c12",name:"Twilio",         industry:"Technology",   website:"twilio.com",       country:"US", notes:"SMS & comms API. Budget freeze paused deal.",         ownerId:"u2", createdBy:"u2", createdAt:"2024-06-01 10:00", modifiedBy:"u2", modifiedAt:"2024-07-01 10:00" },
];
const initialContacts = [
  // Active contacts
  { id:1,  name:"Sophia Laurent",    companyId:"c1",  email:"s.laurent@apple.com",       phoneLocal:"415 882-0031", country:"US", status:"active",   tag:"Client",   avatar:"SL", ownerId:"u1", createdBy:"u1", createdAt:"2025-11-10 09:05", modifiedBy:"u1", modifiedAt:"2026-02-28 15:17", notes:[{ id:1, text:"Discussed Q4 partnership deal.", date:"2026-02-18" },{ id:2, text:"Follow up on term sheet.", date:"2026-02-28" }] },
  { id:2,  name:"Marcus Okonkwo",    companyId:"c2",  email:"marcus@google.com",          phoneLocal:"212 554-7700", country:"US", status:"active",   tag:"Partner",  avatar:"MO", ownerId:"u1", createdBy:"u2", createdAt:"2025-12-01 11:40", modifiedBy:"u1", modifiedAt:"2026-01-30 10:22", notes:[{ id:1, text:"Met at Tech Summit. Cloud integration.", date:"2026-01-30" }] },
  { id:4,  name:"James Patel",       companyId:"c4",  email:"j.patel@stripe.com",         phoneLocal:"415 200-9000", country:"US", status:"active",   tag:"Client",   avatar:"JP", ownerId:"u2", createdBy:"u1", createdAt:"2026-01-20 08:30", modifiedBy:"u2", modifiedAt:"2026-02-10 16:48", notes:[{ id:1, text:"Payment API integration in progress.", date:"2026-02-10" }] },
  { id:6,  name:"David Kim",         companyId:"c6",  email:"d.kim@amazon.com",            phoneLocal:"206 266-1000", country:"US", status:"inactive", tag:"Vendor",   avatar:"DK", ownerId:"u2", createdBy:"u2", createdAt:"2025-10-15 09:20", modifiedBy:"u1", modifiedAt:"2026-01-15 11:55", notes:[{ id:1, text:"AWS contract up for renewal.", date:"2026-01-15" }] },
  // Recent leads (< 3 months — won't show as dormant)
  { id:3,  name:"Ingrid Halvorsen",  companyId:"c3",  email:"i.halvorsen@microsoft.com",  phoneLocal:"425 882-8080", country:"US", status:"lead",     tag:"Lead",     avatar:"IH", ownerId:"u2", createdBy:"u2", createdAt:"2026-01-05 14:15", modifiedBy:"u2", modifiedAt:"2026-01-05 14:15", notes:[] },
  { id:5,  name:"Clara Nguyen",      companyId:"c5",  email:"c.nguyen@salesforce.com",    phoneLocal:"650 900-1234", country:"US", status:"lead",     tag:"Prospect", avatar:"CN", ownerId:"u3", createdBy:"u1", createdAt:"2026-02-01 13:00", modifiedBy:"u1", modifiedAt:"2026-02-01 13:00", notes:[] },
  // ── Dormant leads (~3–5 months old) ──
  { id:10, name:"Priya Sharma",      companyId:"c9",  email:"p.sharma@intercom.com",      phoneLocal:"353 1 900 0000", country:"GB", status:"lead",    tag:"Prospect", avatar:"PS", ownerId:"u1", createdBy:"u1", createdAt:"2024-11-20 13:00", modifiedBy:"u1", modifiedAt:"2024-12-05 10:30", notes:[{ id:1, text:"Pricing call went well but no follow-up.", date:"2024-12-05" }] },
  { id:11, name:"Tom Eriksson",      companyId:"c10", email:"t.eriksson@notion.so",       phoneLocal:"",             country:"US", status:"lead",     tag:"Lead",     avatar:"TE", ownerId:"u3", createdBy:"u3", createdAt:"2025-01-15 08:00", modifiedBy:"u3", modifiedAt:"2025-02-20 09:00", notes:[{ id:1, text:"Procurement team reviewing contract.", date:"2025-02-20" }] },
  // ── Dormant leads (~6–9 months old) ──
  { id:12, name:"Aiko Tanaka",       companyId:"c7",  email:"a.tanaka@hubspot.com",       phoneLocal:"617 555-0191", country:"US", status:"lead",     tag:"Prospect", avatar:"AT", ownerId:"u1", createdBy:"u1", createdAt:"2024-09-10 10:00", modifiedBy:"u1", modifiedAt:"2024-10-01 11:00", notes:[{ id:1, text:"Demo completed. Waiting on budget approval.", date:"2024-10-01" }] },
  { id:13, name:"Carlos Mendez",     companyId:"c8",  email:"c.mendez@zendesk.com",       phoneLocal:"415 418-7506", country:"US", status:"lead",     tag:"Lead",     avatar:"CM", ownerId:"u2", createdBy:"u2", createdAt:"2024-07-05 09:30", modifiedBy:"u2", modifiedAt:"2024-08-15 14:00", notes:[{ id:1, text:"Evaluation stalled — champion left company.", date:"2024-08-15" }] },
  { id:14, name:"Nina Kowalski",     companyId:"c11", email:"n.kowalski@figma.com",       phoneLocal:"",             country:"US", status:"lead",     tag:"Prospect", avatar:"NK", ownerId:"u1", createdBy:"u1", createdAt:"2025-03-01 11:00", modifiedBy:"u1", modifiedAt:"2025-04-10 15:00", notes:[{ id:1, text:"POC ran well. Design lead interested.", date:"2025-04-10" }] },
  // ── Dormant leads (>9 months old — critical) ──
  { id:15, name:"Ben Adeyemi",       companyId:"c12", email:"b.adeyemi@twilio.com",       phoneLocal:"415 390-2337", country:"US", status:"lead",     tag:"Lead",     avatar:"BA", ownerId:"u2", createdBy:"u2", createdAt:"2024-06-01 10:00", modifiedBy:"u2", modifiedAt:"2024-07-01 10:00", notes:[{ id:1, text:"Budget freeze. Said to follow up in Q4 2024.", date:"2024-07-01" }] },
  { id:16, name:"Lena Fischer",      companyId:"c7",  email:"l.fischer@hubspot.com",      phoneLocal:"617 555-0192", country:"US", status:"lead",     tag:"Prospect", avatar:"LF", ownerId:"u1", createdBy:"u1", createdAt:"2024-08-12 14:00", modifiedBy:"u1", modifiedAt:"2024-09-03 09:00", notes:[{ id:1, text:"Initial interest — went quiet after intro call.", date:"2024-09-03" }] },
  { id:17, name:"Omar Al-Rashid",    companyId:"c8",  email:"o.alrashid@zendesk.com",     phoneLocal:"415 418-7507", country:"US", status:"lead",     tag:"Lead",     avatar:"OR", ownerId:"u2", createdBy:"u2", createdAt:"2024-05-20 10:00", modifiedBy:"u2", modifiedAt:"2024-06-10 11:00", notes:[{ id:1, text:"Strong fit but procurement blocked.", date:"2024-06-10" }] },
];
const initialTasks = [
  { id:"t1",  title:"Follow-up call — Sophia re: deal",     type:"Follow-up Call", priority:"High",   contactId:1,  companyId:"c1",  dueDate:TODAY,           dueTime:"10:00", notes:"Discuss partnership terms before end of week.", done:false },
  { id:"t2",  title:"Send cloud proposal to Marcus",         type:"Proposal",       priority:"High",   contactId:2,  companyId:"c2",  dueDate:daysFromNow(1),  dueTime:"14:00", notes:"Include GCP migration timeline.",               done:false },
  { id:"t3",  title:"Quarterly check-in — Ingrid",          type:"Reminder",       priority:"Medium", contactId:3,  companyId:"c3",  dueDate:daysFromNow(3),  dueTime:"09:30", notes:"Discuss Enterprise licence renewal.",           done:false },
  { id:"t4",  title:"Stripe API review meeting",             type:"Meeting",        priority:"High",   contactId:4,  companyId:"c4",  dueDate:daysFromNow(2),  dueTime:"11:00", notes:"Review payment integration status.",            done:false },
  { id:"t5",  title:"Salesforce renewal follow-up",          type:"Follow-up Call", priority:"Medium", contactId:5,  companyId:"c5",  dueDate:daysFromNow(5),  dueTime:"15:00", notes:"CRM contract renewal due Q3.",                  done:false },
  { id:"t6",  title:"AWS contract negotiation",              type:"Meeting",        priority:"Low",    contactId:6,  companyId:"c6",  dueDate:daysFromNow(7),  dueTime:"13:00", notes:"Prepare cost comparison doc.",                  done:false },
  { id:"t7",  title:"Onboarding call completed",             type:"Follow-up Call", priority:"Medium", contactId:1,  companyId:"c1",  dueDate:daysFromNow(-2), dueTime:"15:00", notes:"Completed onboarding successfully.",            done:true  },
  { id:"t8",  title:"Re-engage Priya — pricing update",     type:"Email",          priority:"High",   contactId:10, companyId:"c9",  dueDate:daysFromNow(2),  dueTime:"10:00", notes:"New pricing tier may unlock the deal.",         done:false },
  { id:"t9",  title:"Chase Tom re: Notion procurement",     type:"Follow-up Call", priority:"Medium", contactId:11, companyId:"c10", dueDate:daysFromNow(4),  dueTime:"11:00", notes:"Check if procurement freeze lifted.",           done:false },
  { id:"t10", title:"Win-back call — Ben Adeyemi",          type:"Follow-up Call", priority:"High",   contactId:15, companyId:"c12", dueDate:daysFromNow(1),  dueTime:"09:00", notes:"18 months since last contact. High-value lead.", done:false },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getCountry   = (code) => COUNTRIES.find(c => c.code === code) || COUNTRIES[50];
const companyInitials = (n) => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

function hashColor(str) {
  const p = [["#6b9fd4","#18191b"],["#3a6ea8","#1c2228"],["#7c6fb0","#2a2d35"],["#6cc895","#1c2228"],["#6b9fd4","#2a2d35"],["#9298a4","#2a2d35"]];
  if (!str) return p[0];
  let h = 0; for (let i=0;i<str.length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  return p[Math.abs(h)%p.length];
}

function taskDueLabel(dueDate) {
  if (!dueDate) return { label:"No date", color:"#9298a4" };
  const diff = Math.round((new Date(dueDate) - new Date(TODAY)) / 86400000);
  if (diff < 0)  return { label:`${Math.abs(diff)}d overdue`, color:"#dc2626" };
  if (diff === 0) return { label:"Due today",  color:"#b84c20" };
  if (diff === 1) return { label:"Due tomorrow",color:"#b84c20" };
  return { label:`Due in ${diff}d`, color:"#5a5e68" };
}

// ─── UI Atoms ──────────────────────────────────────────────────────────────────
function Avatar({ initials, size=44, shape="circle" }) {
  const [bg,fg] = hashColor(initials);
  return <div style={{ width:size, height:size, borderRadius:shape==="circle"?"50%":10, background:bg, color:fg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:size*0.36, flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>{initials}</div>;
}

function CompanyLogo({ name, website, size=44 }) {
  const [bg] = hashColor(name);
  const initials = companyInitials(name);
  const radius = size <= 24 ? 6 : 10;
  const domain = website ? website.replace(/^https?:\/\//,"").replace(/\/.*/,"").trim() : null;

  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!domain);
  const [srcIndex, setSrcIndex] = useState(0);

  const sources = domain ? [
    `https://logo.clearbit.com/${domain}`,
    `https://unavatar.io/${domain}`,
    `https://www.google.com/s2/favicons?sz=128&domain_url=https://${domain}`,
  ] : [];

  const src = sources[srcIndex];

  if (failed || !src) {
    return (
      <div style={{ width:size, height:size, borderRadius:radius, background:bg, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:size*0.36, flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        {initials}
      </div>
    );
  }

  return (
    <div style={{ width:size, height:size, borderRadius:radius, overflow:"hidden", flexShrink:0, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e2e4e8", position:"relative", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ position:"absolute", inset:0, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:size*0.36, color:"#fff", opacity: loaded ? 0 : 1, transition:"opacity 0.2s" }}>{initials}</div>
      <img
        key={src}
        src={src}
        alt={name}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          if (srcIndex + 1 < sources.length) setSrcIndex(i => i + 1);
          else setFailed(true);
        }}
        style={{ width:"80%", height:"80%", objectFit:"contain", position:"relative", zIndex:1 }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status];
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:c.bg, color:c.text, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}><span style={{ width:6,height:6,borderRadius:"50%",background:c.dot,display:"inline-block" }}/>{STATUS_LABELS[status]}</span>;
}

function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:c.bg, color:c.text, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}><span style={{ width:5,height:5,borderRadius:"50%",background:c.dot,display:"inline-block" }}/>{priority}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(18,14,10,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", animation:"fadeIn 0.18s ease" }}>
      <div style={{ background:"#ffffff", borderRadius:20, boxShadow:"0 24px 80px rgba(0,0,0,0.12)", width:"100%", maxWidth:wide?680:540, maxHeight:"90vh", overflow:"auto", padding:"36px 36px 32px", position:"relative", animation:"slideUp 0.22s cubic-bezier(.16,1,.3,1)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:18, right:18, background:"rgba(0,0,0,0.05)", border:"none", borderRadius:"50%", width:30, height:30, cursor:"pointer", fontSize:16, color:"#5a5e68", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#18191b", marginBottom:24, marginTop:0 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}


function DetailRow({ icon, label, value, action }) {
  return (
    <div style={{ display:"flex",alignItems:"center",padding:"13px 0",borderBottom:"1px solid #f7f8fa" }}>
      <span style={{ width:30,fontSize:16 }}>{icon}</span>
      <span style={{ width:90,fontSize:12,fontWeight:700,color:"#5a5e68",letterSpacing:"0.07em",textTransform:"uppercase" }}>{label}</span>
      <span style={{ flex:1,fontSize:14,color:"#18191b" }}>{value||<span style={{ color:"#9298a4",fontStyle:"italic" }}>Not set</span>}</span>
      {action&&value&&<span>{action}</span>}
    </div>
  );
}

// ─── Task Form ─────────────────────────────────────────────────────────────────
function TaskForm({ initial, contacts, companies, onSave, onClose, prefs={}, currentUser=null, isAdmin=false }) {
  const empty = { title:"", type:prefs.defaultTaskType||"Follow-up Call", priority:"Medium", contactId:"", companyId:"", dueDate:TODAY, dueTime:"09:00", notes:"" };
  const [form, setForm] = useState({...empty, ...(initial||{})});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const lbl = { fontSize:11,fontWeight:700,letterSpacing:"0.09em",color:"#5a5e68",textTransform:"uppercase",marginBottom:5,display:"block",fontFamily:"'DM Sans',sans-serif" };
  const inp = { width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"#ffffff",fontSize:14,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:16 };

  // Only show companies owned by current user (admins see all)
  const allowedCompanies = isAdmin ? companies : companies.filter(c => c.ownerId === currentUser?.id);

  // Contacts filtered to the selected company (or all if no company chosen)
  const filteredContacts = form.companyId
    ? contacts.filter(c => c.companyId === form.companyId)
    : contacts;

  // When company changes: keep contact only if they belong to new company, else clear
  const handleCompanyChange = (cid) => {
    const contactStillValid = cid === "" || contacts.find(c => String(c.id) === String(form.contactId) && c.companyId === cid);
    setForm(f => ({ ...f, companyId: cid, contactId: contactStillValid ? f.contactId : "" }));
  };

  // When contact changes: auto-fill their company
  const handleContactChange = (cid) => {
    const ct = contacts.find(c => String(c.id) === String(cid));
    setForm(f => ({ ...f, contactId: cid, companyId: ct?.companyId || f.companyId }));
  };

  return (
    <div>
      <label style={lbl}>Task Title</label>
      <input style={inp} value={form.title} placeholder="e.g. Follow-up call with Sophia" onChange={e=>set("title",e.target.value)} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:0 }}>
        <div>
          <label style={lbl}>Type</label>
          <select style={{ ...inp }} value={form.type} onChange={e=>set("type",e.target.value)}>
            {TASK_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Priority</label>
          <select style={{ ...inp }} value={form.priority} onChange={e=>set("priority",e.target.value)}>
            {TASK_PRIORITIES.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div>
          <label style={lbl}>Due Date</label>
          <input type="date" style={{ ...inp }} value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Time</label>
          <input type="time" style={{ ...inp }} value={form.dueTime} onChange={e=>set("dueTime",e.target.value)} />
        </div>
      </div>

      <label style={lbl}>Company (optional)</label>
      <select style={inp} value={form.companyId} onChange={e=>handleCompanyChange(e.target.value)}>
        <option value="">— Select Company —</option>
        {allowedCompanies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <label style={lbl}>
        Contact (optional)
        {form.companyId && filteredContacts.length === 0 && (
          <span style={{ marginLeft:8, fontSize:11, color:"#9298a4", fontWeight:400, textTransform:"none", letterSpacing:0 }}>
            — no contacts in this company
          </span>
        )}
      </label>
      <select style={inp} value={form.contactId} onChange={e=>handleContactChange(e.target.value)}>
        <option value="">— No Contact —</option>
        {filteredContacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <label style={lbl}>Notes</label>
      <textarea style={{ ...inp, resize:"vertical", minHeight:64 }} value={form.notes} placeholder="Additional context..." onChange={e=>set("notes",e.target.value)} />
      <div style={{ display:"flex",gap:10,marginTop:8,justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button>
        <button onClick={()=>onSave(form)} disabled={!form.title.trim()} style={{ padding:"10px 26px",borderRadius:10,border:"none",background:form.title.trim()?"linear-gradient(135deg,#3a6ea8,#4a84c0)":"#e2e4e8",color:form.title.trim()?"#fff":"#c0c8d4",cursor:form.title.trim()?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14 }}>Save Task</button>
      </div>
    </div>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────
const TYPE_ICONS = { "Follow-up Call":"📞", "Reminder":"🔔", "Meeting":"📅", "Email":"✉️", "Proposal":"📄", "Other":"📌" };

function ContactQuickView({ contact, company, onClose, prefs={} }) {
  if (!contact) return null;
  const ctry = COUNTRIES.find(c=>c.code===contact.country);
  const dial = contact.phoneDialCode||(ctry?.dial||"");
  const ph   = contact.phoneLocal||contact.phone||"";
  const fullPh = dial&&ph?`${dial} ${ph}`.trim():ph;
  const sc   = STATUS_COLORS[contact.status]||STATUS_COLORS.inactive;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:18,padding:"28px 32px",minWidth:340,maxWidth:420,width:"90%",boxShadow:"0 16px 56px rgba(0,0,0,0.18)",position:"relative" }}
        onClick={e=>e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute",top:14,right:16,background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9298a4",lineHeight:1 }}>✕</button>
        {/* Avatar + name */}
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:20 }}>
          <Avatar initials={contact.avatar} size={52}/>
          <div>
            <div style={{ fontSize:17,fontWeight:800,color:"#18191b",fontFamily:"'Playfair Display',serif",marginBottom:4 }}>{contact.name}</div>
            <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
              {contact.title&&<span style={{ fontSize:12,color:"#5a5e68" }}>{contact.title}</span>}
              <span style={{ fontSize:11,fontWeight:700,color:sc.text,background:sc.bg,borderRadius:5,padding:"2px 8px",textTransform:"capitalize" }}>{contact.status}</span>
            </div>
            {company&&<div style={{ fontSize:11,color:"#9298a4",marginTop:3 }}>🏢 {company.name}</div>}
          </div>
        </div>
        {/* Contact actions */}
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {fullPh&&(
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:11,border:"1.5px solid #e2e4e8",background:"#f7f8fa" }}>
              <span style={{ fontSize:18 }}>📞</span>
              <a href={`tel:${fullPh.replace(/\s/g,"")}`} style={{ flex:1,fontSize:14,fontWeight:700,color:"#18191b",textDecoration:"none" }}>{fullPh}</a>
              <CopyBtn value={fullPh}/>
            </div>
          )}
          {contact.email&&(
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:11,border:"1.5px solid #e2e4e8",background:"#f7f8fa" }}>
              <span style={{ fontSize:18 }}>✉️</span>
              <a href={`mailto:${contact.email}`} style={{ flex:1,fontSize:14,fontWeight:700,color:"#3a6ea8",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{contact.email}</a>
              <CopyBtn value={contact.email}/>
            </div>
          )}
          {ctry&&(
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:11,border:"1px solid #f2f3f5" }}>
              <span style={{ fontSize:16 }}>{ctry.flag}</span>
              <span style={{ fontSize:13,color:"#5a5e68",flex:1 }}>{ctry.name}</span>
              <LocalClock tz={ctry.tz} timeFormat={prefs?.timeFormat}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, contacts, companies, onToggle, onEdit, onDelete, rc={canEdit:true,canDelete:true}, onViewContact, onViewCompany, canWrite=true }) {
  const contact = contacts.find(c=>String(c.id)===String(task.contactId));
  const company = companies.find(c=>c.id===task.companyId);
  const due = taskDueLabel(task.dueDate);
  const overdue = !task.done && task.dueDate < TODAY;

  const linkStyle = { color:"#3a6ea8", fontWeight:600, cursor:"pointer", textDecoration:"none", borderBottom:"1px solid rgba(58,110,168,0.25)", paddingBottom:1, transition:"color 0.15s" };

  return (
    <div style={{
      background: task.done ? "#f7f8fa" : "#fff",
      borderRadius:14, border:"1.5px solid",
      borderColor: overdue ? "rgba(220,38,38,0.25)" : task.done ? "#f2f3f5" : "#e2e4e8",
      padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:12,
      opacity: task.done ? 0.7 : 1,
      boxShadow: overdue && !task.done ? "0 2px 12px rgba(220,38,38,0.08)" : "0 1px 6px rgba(0,0,0,0.05)",
      transition:"all 0.15s",
    }}>
      <div onClick={canWrite?()=>onToggle(task.id):undefined} style={{
        width:22,height:22,borderRadius:"50%",border:"2px solid",flexShrink:0,marginTop:2,
        borderColor:task.done?"#4ade80":"#e2e4e8",
        background:task.done?"#4ade80":"transparent",
        cursor:canWrite?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all 0.15s",opacity:canWrite?1:0.4,
      }}>{task.done&&<span style={{ fontSize:12,color:"#fff",fontWeight:900 }}>✓</span>}</div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5 }}>
          <span style={{ fontSize:15 }}>{TYPE_ICONS[task.type]||"📌"}</span>
          <span style={{ fontSize:14,fontWeight:700,color:task.done?"#9298a4":"#18191b",fontFamily:"'Playfair Display',serif",textDecoration:task.done?"line-through":"none" }}>{task.title}</span>
          <PriorityBadge priority={task.priority} />
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",fontSize:12,color:"#5a5e68" }}>
          <span style={{ fontWeight:600,color:due.color }}>{due.label}</span>
          {task.dueTime&&<span>· {task.dueTime}</span>}
          {contact&&(
            <span style={{ display:"inline-flex",alignItems:"center",gap:3 }}>
              · 👤{" "}
              {onViewContact
                ? <span style={linkStyle} onClick={()=>onViewContact(contact.id)} title="Open contact">{contact.name}</span>
                : <span>{contact.name}</span>
              }
            </span>
          )}
          {company&&(
            <span style={{ display:"inline-flex",alignItems:"center",gap:3 }}>
              · 🏢{" "}
              {onViewCompany
                ? <span style={linkStyle} onClick={()=>onViewCompany(company.id)} title="Open company">{company.name}</span>
                : <span>{company.name}</span>
              }
            </span>
          )}
        </div>
        {task.notes&&<p style={{ margin:"6px 0 0",fontSize:12,color:"#5a5e68",fontStyle:"italic",fontFamily:"'DM Sans',sans-serif" }}>{task.notes}</p>}
      </div>
      <div style={{ display:"flex",gap:4,flexShrink:0 }}>
        {rc?.canEditTask&&canWrite&&<button onClick={()=>onEdit(task)} style={{ padding:"4px 10px",borderRadius:7,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:12,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif" }}>Edit</button>}
        {rc?.canDeleteTask&&canWrite&&<button onClick={()=>onDelete(task.id)} style={{ padding:"4px 10px",borderRadius:7,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",fontSize:12,color:"#dc2626",fontFamily:"'DM Sans',sans-serif" }}>✕</button>}
      </div>
    </div>
  );
}

// ─── Dashboard View ────────────────────────────────────────────────────────────
function DashboardView({ tasks, contacts, companies, setTasks, showToast, triggerAdd, rc={canAdd:true,canEdit:true,canDelete:true}, onViewContact, onViewCompany, users=[], currentUser, prefs={} }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [quickContact, setQuickContact] = useState(null);
  const [quickAddCompany, setQuickAddCompany] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterUser, setFilterUser] = useState(currentUser?.id || "all");
  const [showDone, setShowDone] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [calMonth, setCalMonth] = useState(() => { const d=new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });
  const [calSelected, setCalSelected] = useState(null);
  const [dashPeriod, setDashPeriod] = useState(30);
  const [_prevTrigger, _setPrevTrigger] = useState(triggerAdd);
  if (triggerAdd !== _prevTrigger) { setShowAdd(true); _setPrevTrigger(triggerAdd); }

  // ── User filter applied to all data ─────────────────────────────────────────
  const filteredUser = filterUser === "all" ? null : filterUser;
  // Tasks filtered by owner (task.contactId → contact.ownerId) OR task created by user
  // We use contact's ownerId as the proxy for task ownership
  const userTasks = filteredUser
    ? tasks.filter(t => {
        const contact = contacts.find(c => String(c.id) === String(t.contactId));
        return contact?.ownerId === filteredUser || t.contactId === "" && filteredUser === currentUser?.id;
      })
    : tasks;
  const userContacts = filteredUser ? contacts.filter(c => c.ownerId === filteredUser) : contacts;

  const addTask = (form) => {
    setTasks(prev=>[{ ...form, id:"t_"+Date.now(), done:false }, ...prev]);
    setShowAdd(false); showToast("Task created");
  };
  const saveEdit = (form) => {
    setTasks(prev=>prev.map(t=>t.id===editTask.id?{...t,...form,updatedAt:(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})()}:t));
    setEditTask(null); showToast("Task updated");
  };
  const toggleDone = (id) => setTasks(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
  const deleteTask = (id) => { setTasks(prev=>prev.filter(t=>t.id!==id)); showToast("Task deleted"); };

  // Per-task write permission: user owns the task's company, or is admin/impersonator
  const taskCanWrite = (t) => {
    if (rc.canImpersonate || rc.canManageAllCompanies) return true;
    const co = companies.find(c=>c.id===t.companyId);
    if (!co) return true; // no company linked — allow
    return co.ownerId === currentUser?.id;
  };

  const allPending = userTasks.filter(t=>!t.done);
  const overdue    = allPending.filter(t=>t.dueDate<TODAY).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const todayTasks = allPending.filter(t=>t.dueDate===TODAY).sort((a,b)=>a.dueTime?.localeCompare(b.dueTime||""));
  const upcoming   = allPending.filter(t=>t.dueDate>TODAY).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.dueTime?.localeCompare(b.dueTime||""));
  const doneTasks  = userTasks.filter(t=>t.done).sort((a,b)=>b.dueDate.localeCompare(a.dueDate));
  const dashNotes  = userContacts.reduce((s,c)=>s+(c.notes||[]).length,0)
                   + (filteredUser ? companies.filter(co=>co.ownerId===filteredUser) : companies).reduce((s,co)=>s+(co.notesList||[]).length,0);

  const dashPStart = (() => { const d=new Date(); d.setDate(d.getDate()-dashPeriod); return d.toISOString().slice(0,10); })();
  const kpiTasks    = userTasks.filter(t=>t.dueDate>=dashPStart&&t.dueDate<=TODAY);
  const kpiDone     = kpiTasks.filter(t=>t.done).length;
  const kpiOverdue  = userTasks.filter(t=>!t.done&&t.dueDate>=dashPStart&&t.dueDate<TODAY).length;
  const kpiNotes    = userContacts.reduce((s,c)=>s+(c.notes||[]).filter(n=>(n.date||"")>=dashPStart).length,0)
                    + (filteredUser?companies.filter(co=>co.ownerId===filteredUser):companies).reduce((s,co)=>s+(co.notesList||[]).filter(n=>(n.date||"")>=dashPStart).length,0);

  const applyTypeFilter = (list) => filterType==="all"?list:list.filter(t=>t.type===filterType);

  const sectionHdr = (label, count, color="#18191b") => (
    <div style={{ display:"flex",alignItems:"center",gap:10,margin:"22px 0 10px" }}>
      <span style={{ fontSize:13,fontWeight:800,color,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
      <span style={{ fontSize:12,background:color==="#dc2626"?"rgba(220,38,38,0.1)":"#f2f3f5",color,borderRadius:20,padding:"1px 9px",fontWeight:700 }}>{count}</span>
      <div style={{ flex:1,height:1,background:"#e2e4e8" }}/>
    </div>
  );

  // ── Analytics data ───────────────────────────────────────────────────────────
  const today = new Date();
  const d30 = new Date(today); d30.setDate(d30.getDate()-30);
  const d30str = d30.toISOString().slice(0,10);

  // Task type breakdown
  const typeBreakdown = TASK_TYPES.map(type => ({
    type, count: userTasks.filter(t=>t.type===type).length,
    done: userTasks.filter(t=>t.type===type&&t.done).length,
  })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);

  // Task priority distribution
  const priorityData = ["High","Medium","Low"].map(p=>({
    p, count: allPending.filter(t=>t.priority===p).length,
    color: p==="High"?"#dc2626":p==="Medium"?"#b84c20":"#5a5e68",
    bg: p==="High"?"rgba(220,38,38,0.1)":p==="Medium"?"rgba(184,76,32,0.1)":"rgba(90,94,104,0.08)",
  }));

  // Tasks created/due per week (last 4 weeks)
  const weekLabels = ["3w ago","2w ago","Last wk","This wk"];
  const weekTasks = weekLabels.map((label,i) => {
    const wStart = new Date(today); wStart.setDate(wStart.getDate() - (3-i)*7 - wStart.getDay());
    const wEnd   = new Date(wStart); wEnd.setDate(wEnd.getDate()+6);
    const ws = wStart.toISOString().slice(0,10), we = wEnd.toISOString().slice(0,10);
    return { label, total: userTasks.filter(t=>t.dueDate>=ws&&t.dueDate<=we).length,
             done: userTasks.filter(t=>t.dueDate>=ws&&t.dueDate<=we&&t.done).length };
  });
  const maxWeek = Math.max(...weekTasks.map(w=>w.total), 1);

  // Contact status mix
  const statusCounts = ["active","lead","inactive"].map(s=>({
    s, count: userContacts.filter(c=>c.status===s).length,
    color: s==="active"?"#27924a":s==="lead"?"#3a6ea8":"#9298a4",
    label: s.charAt(0).toUpperCase()+s.slice(1),
  }));

  // Frequent companies (last 30 days — tasks linked to company in last 30d)
  const recentTasks30 = userTasks.filter(t=>t.dueDate>=d30str);
  const companyTaskMap = {};
  recentTasks30.forEach(t=>{ if(t.companyId){ companyTaskMap[t.companyId]=(companyTaskMap[t.companyId]||0)+1; }});
  const frequentCompanies = companies
    .filter(c=>companyTaskMap[c.id])
    .map(c=>({ ...c, taskCount: companyTaskMap[c.id], contactCount: userContacts.filter(ct=>ct.companyId===c.id).length }))
    .sort((a,b)=>b.taskCount-a.taskCount).slice(0,6);

  // Yet-to-process: owned by current user, no contacts added AND no tasks of any kind
  const myCompanies = companies.filter(c => c.ownerId === currentUser?.id);
  const yetToProcess = myCompanies.filter(c => {
    const hasContacts = contacts.some(ct => ct.companyId === c.id);
    const hasTasks    = tasks.some(t => t.companyId === c.id);
    return !hasContacts && !hasTasks;
  }).map(c => ({ ...c, contactCount: 0, lastTask: null }))
    .sort((a,b) => a.name.localeCompare(b.name));

  // Donut helper
  const Donut = ({ segments, size=80, stroke=13 }) => {
    const r = (size-stroke)/2, cx=size/2, cy=size/2, circ=2*Math.PI*r;
    let offset = 0;
    const total = segments.reduce((s,x)=>s+x.value,0)||1;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f2f3f5" strokeWidth={stroke}/>
        {segments.map((seg,i)=>{
          const dash = (seg.value/total)*circ;
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${circ-dash}`}
            strokeDashoffset={-offset*circ/total+(circ*0.25)}
            style={{ transform:`rotate(-90deg)`, transformOrigin:`${cx}px ${cy}px` }}
            strokeLinecap="round"/>;
          offset += seg.value/total*circ/circ*total; // accumulate
          return el;
        })}
      </svg>
    );
  };

  // Recompute donut with correct offset accumulation
  const DonutChart = ({ segments, size=84, stroke=12 }) => {
    const r = (size-stroke)/2, cx=size/2, cy=size/2, circ=2*Math.PI*r;
    const total = segments.reduce((s,x)=>s+x.value,0)||1;
    let cumulative = 0;
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f2f3f5" strokeWidth={stroke}/>
        {segments.map((seg,i)=>{
          const frac = seg.value/total;
          const dash = frac*circ;
          const dashOffset = circ*0.25 - cumulative*circ;
          cumulative += frac;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={dashOffset} strokeLinecap="butt"/>;
        })}
      </svg>
    );
  };

  const cardStyle = { background:"#fff", borderRadius:16, border:"1.5px solid #e2e4e8", padding:"18px 20px", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" };
  const secTitle = (t) => <div style={{ fontSize:12,fontWeight:800,color:"#9298a4",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,fontFamily:"'DM Sans',sans-serif" }}>{t}</div>;

  return (
    <div>
      {/* User context banner when filtered */}
      {filterUser!=="all" && (
        <div style={{ background:"rgba(58,110,168,0.06)",border:"1.5px solid rgba(58,110,168,0.2)",borderRadius:12,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10 }}>
          {(() => { const u=users.find(x=>x.id===filterUser); const rc2=ROLE_CONFIG[u?.role]; return (
            <>
              <span style={{ width:28,height:28,borderRadius:"50%",background:rc2?.color||"#94a3b8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0 }}>
                {u?.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
              </span>
              <span style={{ fontSize:13,fontWeight:700,color:"#3a6ea8" }}>Showing data for {u?.name}</span>
              <span style={{ fontSize:12,color:"#9298a4" }}>· {rc2?.label}</span>
              <button onClick={()=>setFilterUser("all")} style={{ marginLeft:"auto",fontSize:12,color:"#9298a4",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>✕ Clear filter</button>
            </>
          ); })()}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.08em" }}>KPI Summary</div>
        <div style={{ display:"flex",gap:4 }}>
          {[7,30,90].map(d=>(
            <button key={d} onClick={()=>setDashPeriod(d)}
              style={{ padding:"4px 12px",borderRadius:20,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                borderColor:dashPeriod===d?"#3a6ea8":"#e2e4e8",
                background:dashPeriod===d?"#3a6ea8":"transparent",
                color:dashPeriod===d?"#fff":"#9298a4" }}>{d}d</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:20 }}>
        {[
          { label:"Overdue",   value:kpiOverdue,        icon:"🚨", bg:"rgba(220,38,38,0.07)",  border:"rgba(220,38,38,0.18)",  text:"#dc2626" },
          { label:"Today",     value:todayTasks.length, icon:"📅", bg:"rgba(184,76,32,0.07)",  border:"rgba(184,76,32,0.18)",  text:"#b84c20" },
          { label:"Upcoming",  value:upcoming.length,   icon:"🔮", bg:"rgba(58,110,168,0.06)", border:"#e2e4e8",               text:"#3a6ea8" },
          { label:"Completed", value:kpiDone,           icon:"✅", bg:"rgba(39,146,74,0.07)",  border:"rgba(39,146,74,0.18)",  text:"#27924a" },
          { label:"Notes",     value:kpiNotes,          icon:"📝", bg:"rgba(8,145,178,0.07)",  border:"rgba(8,145,178,0.18)",  text:"#0891b2" },
        ].map(s=>(
          <div key={s.label} style={{ background:s.bg,borderRadius:14,padding:"16px 18px",border:`1.5px solid ${s.border}` }}>
            <div style={{ fontSize:22,marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:28,fontWeight:700,color:s.text,fontFamily:"'Playfair Display',serif",lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11,color:s.text,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Analytics Row 1: Charts ─────────────────────────────────────────── */}
      {<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14 }}>

        {/* Task Type Breakdown — horizontal bar */}
        <div style={cardStyle}>
          {secTitle("Tasks by Type")}
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {typeBreakdown.length===0 && <p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic" }}>No tasks yet.</p>}
            {typeBreakdown.map((x,i)=>{
              const pct = Math.round((x.count/(tasks.length||1))*100);
              const colors=["#3a6ea8","#4a9b8e","#7c6fb0","#27924a","#b84c20","#64748b"];
              return (
                <div key={x.type}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                    <span style={{ fontSize:12,color:"#5a5e68",fontWeight:600 }}>{TYPE_ICONS[x.type]} {x.type}</span>
                    <span style={{ fontSize:12,color:"#9298a4" }}>{x.count}</span>
                  </div>
                  <div style={{ height:7,borderRadius:4,background:"#f2f3f5",overflow:"hidden" }}>
                    <div style={{ height:"100%",borderRadius:4,background:colors[i%colors.length],width:`${pct}%`,transition:"width 0.4s ease" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly task volume — bar chart */}
        <div style={cardStyle}>
          {secTitle("Weekly Task Volume")}
          <div style={{ display:"flex",alignItems:"flex-end",gap:10,height:110,paddingBottom:4 }}>
            {weekTasks.map((w,i)=>(
              <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                <span style={{ fontSize:11,color:"#9298a4",fontWeight:700 }}>{w.total||""}</span>
                <div style={{ width:"100%",display:"flex",flexDirection:"column-reverse",borderRadius:6,overflow:"hidden",minHeight:4 }}>
                  <div style={{ background:"#e2e4e8",height:`${Math.round((w.total/maxWeek)*80)}px`,width:"100%",borderRadius:6,position:"relative" }}>
                    <div style={{ position:"absolute",bottom:0,left:0,right:0,height:`${w.total>0?Math.round((w.done/w.total)*100):0}%`,background:"#3a6ea8",borderRadius:6,transition:"height 0.4s" }}/>
                  </div>
                </div>
                <span style={{ fontSize:10,color:"#9298a4",textAlign:"center",lineHeight:1.2 }}>{w.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:14,marginTop:6 }}>
            <span style={{ fontSize:11,color:"#9298a4",display:"flex",alignItems:"center",gap:4 }}><span style={{ width:10,height:10,borderRadius:2,background:"#3a6ea8",display:"inline-block" }}/> Done</span>
            <span style={{ fontSize:11,color:"#9298a4",display:"flex",alignItems:"center",gap:4 }}><span style={{ width:10,height:10,borderRadius:2,background:"#e2e4e8",display:"inline-block" }}/> Total</span>
          </div>
        </div>

        {/* Contact status donut */}
        <div style={cardStyle}>
          {secTitle("Contact Status Mix")}
          <div style={{ display:"flex",alignItems:"center",gap:20 }}>
            <DonutChart size={88} stroke={13} segments={statusCounts.map(s=>({ value:s.count, color:s.color }))}/>
            <div style={{ flex:1 }}>
              {statusCounts.map(s=>(
                <div key={s.s} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                  <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5a5e68",fontWeight:600 }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:s.color,display:"inline-block" }}/>
                    {s.label}
                  </span>
                  <span style={{ fontSize:13,fontWeight:700,color:"#18191b" }}>{s.count}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid #f2f3f5",paddingTop:8,marginTop:2 }}>
                <span style={{ fontSize:12,color:"#9298a4" }}>Total: <strong style={{ color:"#18191b" }}>{contacts.length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* ── Analytics Row 2: Active Contacts + Company lists ───────────────────────── */}
      {<div style={{ display:"grid",gridTemplateColumns:"220px 1fr 1fr",gap:14,marginBottom:20 }}>

        {/* Active Contacts list */}
        <div style={cardStyle}>
          {secTitle("Active Contacts")}
          {(()=>{
            const activeContacts = userContacts.filter(c=>c.status==="active").sort((a,b)=>b.modifiedAt?.localeCompare(a.modifiedAt||"")||0);
            if (activeContacts.length===0) return <p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"16px 0" }}>No active contacts.</p>;
            return (
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {activeContacts.slice(0,6).map(ct=>{
                  const co = companies.find(c=>c.id===ct.companyId);
                  const sc = STATUS_COLORS["active"];
                  return (
                    <div key={ct.id} onClick={()=>onViewContact&&onViewContact(ct.id)}
                      style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,cursor:"pointer",transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f4f6fb"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ width:30,height:30,borderRadius:"50%",background:sc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:sc.text,flexShrink:0 }}>{ct.avatar}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#3a6ea8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ct.name}</div>
                        <div style={{ fontSize:10,color:"#9298a4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{co?.name||"—"}</div>
                      </div>
                      {ct.tag&&null}
                    </div>
                  );
                })}
                {activeContacts.length>6&&<div style={{ fontSize:11,color:"#9298a4",textAlign:"center",paddingTop:4,borderTop:"1px solid #f2f3f5" }}>+{activeContacts.length-6} more</div>}
                <div style={{ paddingTop:6,borderTop:"1px solid #f2f3f5",fontSize:12,color:"#9298a4" }}>{activeContacts.length} active contact{activeContacts.length!==1?"s":""}</div>
              </div>
            );
          })()}
        </div>

        {/* Frequent companies — last 30 days */}
        <div style={cardStyle}>
          {secTitle("🔥 Most Active Companies · Last 30 Days")}
          {frequentCompanies.length===0
            ? <p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"16px 0" }}>No company activity in last 30 days.</p>
            : (
              <div style={{ display:"flex",flexDirection:"column",gap:1 }}>
                {frequentCompanies.map((c,i)=>{
                  const maxTasks = frequentCompanies[0].taskCount||1;
                  return (
                    <div key={c.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<frequentCompanies.length-1?"1px solid #f2f3f5":"none" }}>
                      <span style={{ fontSize:12,fontWeight:700,color:"#c0c8d4",width:18,textAlign:"right" }}>#{i+1}</span>
                      <CompanyLogo name={c.name} website={c.website} size={28}/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                          <span onClick={()=>onViewCompany&&onViewCompany(c.id)}
                            style={{ fontSize:13,fontWeight:700,color:"#18191b",cursor:onViewCompany?"pointer":"default",
                              textDecoration:onViewCompany?"underline":"none",textDecorationColor:"#c0c8d4" }}>
                            {c.name}
                          </span>
                          <span style={{ fontSize:11,color:"#9298a4" }}>{c.contactCount} contact{c.contactCount!==1?"s":""}</span>
                        </div>
                        <div style={{ height:5,borderRadius:3,background:"#f2f3f5" }}>
                          <div style={{ height:"100%",borderRadius:3,background:"#3a6ea8",width:`${Math.round((c.taskCount/maxTasks)*100)}%`,transition:"width 0.4s" }}/>
                        </div>
                      </div>
                      <span style={{ fontSize:13,fontWeight:700,color:"#3a6ea8",whiteSpace:"nowrap",minWidth:32,textAlign:"right" }}>{c.taskCount} task{c.taskCount!==1?"s":""}</span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Yet-to-process companies */}
        <div style={cardStyle}>
          {secTitle("⏳ Yet to Process")}
          {yetToProcess.length===0
            ? <p style={{ color:"#27924a",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"16px 0" }}>✅ All your companies have contacts or tasks!</p>
            : (
              <div style={{ display:"flex",flexDirection:"column",gap:1 }}>
                {yetToProcess.map((c,i)=>(
                    <div key={c.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<yetToProcess.length-1?"1px solid #f2f3f5":"none" }}>
                      <CompanyLogo name={c.name} website={c.website} size={28}/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                          <span onClick={()=>onViewCompany&&onViewCompany(c.id)}
                            style={{ fontSize:13,fontWeight:700,color:"#3a6ea8",cursor:"pointer",
                              borderBottom:"1px solid rgba(58,110,168,0.25)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                            {c.name}
                          </span>
                        </div>
                        <span style={{ fontSize:11,color:"#9298a4" }}>No contacts · No tasks</span>
                      </div>
                      <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,
                        background:"rgba(220,38,38,0.08)",color:"#dc2626",whiteSpace:"nowrap" }}>
                        Not started
                      </span>
                      {rc.canAddTask&&<button onClick={()=>setQuickAddCompany(c)} title="Add task for this company"
                        style={{ padding:"3px 10px",borderRadius:7,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:11,color:"#3a6ea8",fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap" }}>
                        + Task
                      </button>}
                    </div>
                  ))}
              </div>
            )
          }
        </div>
      </div>}

      {/* Filters bar */}
      <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e2e4e8",padding:"12px 16px",marginBottom:16,display:"flex",flexWrap:"wrap",gap:12,alignItems:"center" }}>
        {/* User filter pills */}
        <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
          <span style={{ fontSize:11,fontWeight:800,color:"#9298a4",letterSpacing:"0.07em",textTransform:"uppercase",marginRight:4 }}>View:</span>
          {(rc.canImpersonate ? [{id:"all",name:"Everyone",role:""},...users] : [{id:"all",name:"Everyone",role:""},{id:currentUser?.id,name:currentUser?.name||"Me",role:currentUser?.role}]).map(u=>{
            const active = filterUser === u.id;
            const rc2 = ROLE_CONFIG[u.role];
            return (
              <button key={u.id} onClick={()=>setFilterUser(u.id)}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${active?"#3a6ea8":"#e2e4e8"}`,background:active?"rgba(58,110,168,0.08)":"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,color:active?"#3a6ea8":"#5a5e68",transition:"all 0.15s" }}>
                {u.id!=="all" && (
                  <span style={{ width:20,height:20,borderRadius:"50%",background:rc2?.color||"#94a3b8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,flexShrink:0 }}>
                    {u.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </span>
                )}
                {u.id==="all" ? "👥 Everyone" : u.name.split(" ")[0]}
                {u.id===currentUser?.id && <span style={{ fontSize:10,color:active?"#3a6ea8":"#9298a4" }}>(me)</span>}
              </button>
            );
          })}
        </div>
        <div style={{ width:1,height:24,background:"#e2e4e8",flexShrink:0 }}/>
        {/* Type filter — only in list mode */}
        {viewMode==="list" && <>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:"6px 12px",borderRadius:8,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer" }}>
            <option value="all">All Types</option>
            {TASK_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
          <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",fontWeight:600 }}>
            <input type="checkbox" checked={showDone} onChange={e=>setShowDone(e.target.checked)} style={{ cursor:"pointer" }}/> Show completed
          </label>
        </>}
        <span style={{ flex:1 }}/>
        {filterUser!=="all" && (
          <span style={{ fontSize:12,color:"#3a6ea8",fontWeight:600,background:"rgba(58,110,168,0.08)",padding:"4px 12px",borderRadius:20 }}>
            Showing: {users.find(u=>u.id===filterUser)?.name||""}
          </span>
        )}
        {/* View mode toggle */}
        <div style={{ display:"flex",borderRadius:8,border:"1.5px solid #e2e4e8",overflow:"hidden" }}>
          {[{id:"list",icon:"☰",label:"List"},{id:"calendar",icon:"📅",label:"Calendar"}].map(v=>(
            <button key={v.id} onClick={()=>setViewMode(v.id)}
              style={{ padding:"6px 14px",border:"none",background:viewMode===v.id?"#3a6ea8":"transparent",color:viewMode===v.id?"#fff":"#5a5e68",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5,transition:"all 0.15s" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        {rc.canAddTask&&<button onClick={()=>setShowAdd(true)} style={{ padding:"7px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13 }}>+ New Task</button>}
      </div>

      {/* ── CALENDAR VIEW ──────────────────────────────────────────────────────── */}
      {viewMode==="calendar" && (() => {
        const { y, m } = calMonth;
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m+1, 0).getDate();
        const monthName = new Date(y, m, 1).toLocaleString("default",{month:"long"});
        const prevMonth = () => setCalMonth(({y,m})=>m===0?{y:y-1,m:11}:{y,m:m-1});
        const nextMonth = () => setCalMonth(({y,m})=>m===11?{y:y+1,m:0}:{y,m:m+1});
        const toKey = (d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const todayKey = TODAY;
        const PRIO_COLOR = { High:"#dc2626", Medium:"#b84c20", Low:"#3a6ea8" };
        const TYPE_DOT_COLOR = { "Follow-up Call":"#3a6ea8","Reminder":"#7c6fb0","Meeting":"#27924a","Email":"#5a5e68","Proposal":"#b84c20","Other":"#9298a4" };

        // Build day→tasks map
        const dayMap = {};
        userTasks.forEach(t=>{ if(!dayMap[t.dueDate]) dayMap[t.dueDate]=[]; dayMap[t.dueDate].push(t); });

        // Selected day detail
        const selKey = calSelected;
        const selTasks = selKey ? (dayMap[selKey]||[]).sort((a,b)=>(a.dueTime||"").localeCompare(b.dueTime||"")) : [];

        // Grid: blank cells + day cells
        const cells = [];
        for(let i=0;i<firstDay;i++) cells.push(null);
        for(let d=1;d<=daysInMonth;d++) cells.push(d);

        return (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            {/* Calendar grid */}
            <div style={{ background:"#fff",borderRadius:16,border:"1.5px solid #e2e4e8",overflow:"hidden" }}>
              {/* Month nav */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #e2e4e8",background:"#f7f8fa" }}>
                <button onClick={prevMonth} style={{ width:32,height:32,borderRadius:8,border:"1.5px solid #e2e4e8",background:"#fff",cursor:"pointer",fontSize:16,color:"#5a5e68",display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:17,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>{monthName} {y}</div>
                </div>
                <button onClick={nextMonth} style={{ width:32,height:32,borderRadius:8,border:"1.5px solid #e2e4e8",background:"#fff",cursor:"pointer",fontSize:16,color:"#5a5e68",display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
              </div>
              {/* Day-of-week headers */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#f7f8fa",borderBottom:"1px solid #e2e4e8" }}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                  <div key={d} style={{ padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:800,color:"#9298a4",letterSpacing:"0.07em",textTransform:"uppercase" }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)" }}>
                {cells.map((d,i)=>{
                  if(!d) return <div key={`e${i}`} style={{ borderRight:"1px solid #f2f3f5",borderBottom:"1px solid #f2f3f5",minHeight:110,background:"#fafafa" }}/>;
                  const key = toKey(d);
                  const dayTasks = dayMap[key]||[];
                  const isToday = key===todayKey;
                  const isSel = key===selKey;
                  const hasOverdue = dayTasks.some(t=>!t.done&&key<todayKey);
                  const col = (i+1)%7;
                  return (
                    <div key={d} onClick={()=>setCalSelected(isSel?null:key)}
                      style={{ borderRight:col!==0?"1px solid #f2f3f5":"none",borderBottom:"1px solid #f2f3f5",minHeight:110,padding:"8px 8px",cursor:"pointer",
                        background:isSel?"rgba(58,110,168,0.07)":isToday?"rgba(58,110,168,0.03)":"#fff",
                        transition:"background 0.12s",position:"relative" }}>
                      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ fontSize:14,fontWeight:isToday?800:600,
                          color:isToday?"#fff":"#18191b",
                          background:isToday?"#3a6ea8":"transparent",
                          width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          {d}
                        </span>
                        {dayTasks.length>0&&<span style={{ fontSize:10,fontWeight:700,color:isSel?"#3a6ea8":hasOverdue?"#dc2626":"#9298a4",background:isSel?"rgba(58,110,168,0.12)":hasOverdue?"rgba(220,38,38,0.08)":"#f2f3f5",borderRadius:10,padding:"1px 6px",lineHeight:"16px" }}>{dayTasks.length}</span>}
                      </div>
                      {/* Task pills — show up to 3 */}
                      <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
                        {dayTasks.slice(0,3).map(t=>{
                          const contact = contacts.find(c=>String(c.id)===String(t.contactId));
                          return (
                            <div key={t.id} style={{ fontSize:11,borderRadius:4,padding:"2px 6px",background:t.done?"#f2f3f5":`${TYPE_DOT_COLOR[t.type]||"#3a6ea8"}18`,
                              color:t.done?"#9298a4":TYPE_DOT_COLOR[t.type]||"#3a6ea8",
                              fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                              textDecoration:t.done?"line-through":"none",fontFamily:"'DM Sans',sans-serif",lineHeight:"14px" }}>
                              {t.dueTime&&<span style={{ opacity:0.7,marginRight:3 }}>{t.dueTime}</span>}{t.title}
                            </div>
                          );
                        })}
                        {dayTasks.length>3&&<div style={{ fontSize:10,color:"#9298a4",fontWeight:600,paddingLeft:4 }}>+{dayTasks.length-3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day detail panel */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
              {/* Legend */}
              <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e2e4e8",padding:"14px 16px" }}>
                <div style={{ fontSize:11,fontWeight:800,color:"#9298a4",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10 }}>Task Types</div>
                {Object.entries(TYPE_DOT_COLOR).map(([type,color])=>(
                  <div key={type} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                    <span style={{ width:10,height:10,borderRadius:3,background:color,flexShrink:0 }}/>
                    <span style={{ fontSize:12,color:"#5a5e68",fontWeight:600 }}>{TYPE_ICONS[type]} {type}</span>
                  </div>
                ))}
              </div>

              {/* Selected day tasks */}
              <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e2e4e8",padding:"14px 16px" }}>
                {!selKey ? (
                  <div style={{ textAlign:"center",padding:"30px 0",color:"#9298a4" }}>
                    <div style={{ fontSize:28,marginBottom:8 }}>📅</div>
                    <div style={{ fontSize:13,fontWeight:600 }}>Click a day to see tasks</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:15,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>
                          {new Date(selKey+"T12:00:00").toLocaleDateString("default",{weekday:"long",month:"long",day:"numeric"})}
                        </div>
                        <div style={{ fontSize:12,color:"#9298a4",marginTop:2 }}>{selTasks.length} task{selTasks.length!==1?"s":""}</div>
                      </div>
                      {rc.canAddTask&&<button onClick={()=>{ setShowAdd(true); }} title="Add task on this day"
                        style={{ width:28,height:28,borderRadius:8,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",color:"#3a6ea8",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>}
                    </div>
                    {selTasks.length===0
                      ? <p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"12px 0" }}>No tasks on this day.</p>
                      : <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:320,overflowY:"auto" }}>
                          {selTasks.map(t=>{
                            const contact = contacts.find(c=>String(c.id)===String(t.contactId));
                            const company = companies.find(c=>c.id===t.companyId);
                            const isOverdue = !t.done && selKey<todayKey;
                            const tw = taskCanWrite(t);
                            return (
                              <div key={t.id} style={{ borderRadius:10,border:`1.5px solid ${isOverdue?"rgba(220,38,38,0.25)":t.done?"#f2f3f5":"#e2e4e8"}`,padding:"10px 12px",background:t.done?"#f7f8fa":"#fff",opacity:t.done?0.75:1 }}>
                                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                                  <div onClick={tw?()=>toggleDone(t.id):undefined} style={{ width:18,height:18,borderRadius:"50%",border:`2px solid ${t.done?"#4ade80":"#e2e4e8"}`,background:t.done?"#4ade80":"transparent",cursor:tw?"pointer":"default",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:tw?1:0.4 }}>
                                    {t.done&&<span style={{ fontSize:9,color:"#fff",fontWeight:900 }}>✓</span>}
                                  </div>
                                  <span style={{ fontSize:12,fontWeight:700,color:t.done?"#9298a4":"#18191b",textDecoration:t.done?"line-through":"none",flex:1,lineHeight:1.3 }}>{t.title}</span>
                                  <PriorityBadge priority={t.priority}/>
                                </div>
                                <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginLeft:26 }}>
                                  <span style={{ fontSize:11,color:TYPE_DOT_COLOR[t.type]||"#5a5e68",fontWeight:600 }}>{TYPE_ICONS[t.type]} {t.type}</span>
                                  {t.dueTime&&<span style={{ fontSize:11,color:"#9298a4" }}>· {t.dueTime}</span>}
                                </div>
                                {(contact||company)&&(
                                  <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginLeft:26,marginTop:4 }}>
                                    {contact&&<span onClick={()=>setQuickContact(contact)} style={{ fontSize:11,color:"#3a6ea8",cursor:"pointer",fontWeight:600 }}>👤 {contact.name}</span>}
                                    {company&&<span onClick={()=>onViewCompany&&onViewCompany(company.id)} style={{ fontSize:11,color:onViewCompany?"#3a6ea8":"#5a5e68",cursor:onViewCompany?"pointer":"default",fontWeight:600 }}>🏢 {company.name}</span>}
                                  </div>
                                )}
                                <div style={{ display:"flex",gap:6,marginLeft:26,marginTop:6 }}>
                                  {rc.canEditTask&&tw&&<button onClick={()=>setEditTask(t)} style={{ fontSize:11,padding:"2px 8px",borderRadius:5,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",color:"#5a5e68",fontFamily:"'DM Sans',sans-serif" }}>Edit</button>}
                                  {rc.canDeleteTask&&tw&&<button onClick={()=>deleteTask(t.id)} style={{ fontSize:11,padding:"2px 8px",borderRadius:5,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",color:"#dc2626",fontFamily:"'DM Sans',sans-serif" }}>✕</button>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    }
                  </>
                )}
              </div>

              {/* Mini month summary */}
              <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #e2e4e8",padding:"14px 16px" }}>
                <div style={{ fontSize:11,fontWeight:800,color:"#9298a4",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10 }}>This Month</div>
                {[
                  { label:"Total tasks", value: Object.entries(dayMap).filter(([dk])=>dk.startsWith(`${y}-${String(m+1).padStart(2,"0")}`)).reduce((s,[,v])=>s+v.length,0), color:"#18191b" },
                  { label:"Completed",   value: Object.entries(dayMap).filter(([dk])=>dk.startsWith(`${y}-${String(m+1).padStart(2,"0")}`)).reduce((s,[,v])=>s+v.filter(t=>t.done).length,0), color:"#27924a" },
                  { label:"Overdue",     value: Object.entries(dayMap).filter(([dk])=>dk.startsWith(`${y}-${String(m+1).padStart(2,"0")}`)).reduce((s,[dk,v])=>s+v.filter(t=>!t.done&&dk<todayKey).length,0), color:"#dc2626" },
                ].map(r=>(
                  <div key={r.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                    <span style={{ fontSize:12,color:"#5a5e68",fontWeight:600 }}>{r.label}</span>
                    <span style={{ fontSize:14,fontWeight:800,color:r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {viewMode==="list" && <>
        {applyTypeFilter(overdue).length>0&&<>{sectionHdr("Overdue",applyTypeFilter(overdue).length,"#dc2626")}<div style={{ display:"flex",flexDirection:"column",gap:8 }}>{applyTypeFilter(overdue).map(t=><TaskCard key={t.id} task={t} contacts={contacts} companies={companies} onToggle={toggleDone} onEdit={setEditTask} onDelete={deleteTask} rc={rc} onViewContact={id=>{const ct=contacts.find(c=>String(c.id)===String(id));setQuickContact(ct||null);}} onViewCompany={onViewCompany} canWrite={taskCanWrite(t)}/>)}</div></>}

        {sectionHdr("Today",applyTypeFilter(todayTasks).length,"#b84c20")}
        {applyTypeFilter(todayTasks).length===0
          ? <p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"16px 0" }}>No tasks scheduled for today.</p>
          : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>{applyTypeFilter(todayTasks).map(t=><TaskCard key={t.id} task={t} contacts={contacts} companies={companies} onToggle={toggleDone} onEdit={setEditTask} onDelete={deleteTask} rc={rc} onViewContact={id=>{const ct=contacts.find(c=>String(c.id)===String(id));setQuickContact(ct||null);}} onViewCompany={onViewCompany} canWrite={taskCanWrite(t)}/>)}</div>
        }

        {applyTypeFilter(upcoming).length>0&&<>{sectionHdr("Upcoming",applyTypeFilter(upcoming).length)}<div style={{ display:"flex",flexDirection:"column",gap:8 }}>{applyTypeFilter(upcoming).map(t=><TaskCard key={t.id} task={t} contacts={contacts} companies={companies} onToggle={toggleDone} onEdit={setEditTask} onDelete={deleteTask} rc={rc} onViewContact={id=>{const ct=contacts.find(c=>String(c.id)===String(id));setQuickContact(ct||null);}} onViewCompany={onViewCompany} canWrite={taskCanWrite(t)}/>)}</div></>}

        {showDone&&doneTasks.length>0&&<>{sectionHdr("Completed",doneTasks.length,"#16a34a")}<div style={{ display:"flex",flexDirection:"column",gap:8 }}>{applyTypeFilter(doneTasks).map(t=><TaskCard key={t.id} task={t} contacts={contacts} companies={companies} onToggle={toggleDone} onEdit={setEditTask} onDelete={deleteTask} rc={rc} onViewContact={id=>{const ct=contacts.find(c=>String(c.id)===String(id));setQuickContact(ct||null);}} onViewCompany={onViewCompany} canWrite={taskCanWrite(t)}/>)}</div></>}

        {tasks.length===0&&<div style={{ textAlign:"center",padding:"60px 0" }}><div style={{ fontSize:40,marginBottom:12 }}>📋</div><p style={{ color:"#9298a4",fontSize:14 }}>No tasks yet. Create one to get started.</p></div>}
      </>}

      {quickContact&&<ContactQuickView contact={quickContact} company={companies.find(c=>c.id===quickContact.companyId)} onClose={()=>setQuickContact(null)} prefs={prefs}/>}
      {showAdd&&<Modal title="New Task" onClose={()=>setShowAdd(false)}><TaskForm contacts={contacts} companies={companies} prefs={prefs} currentUser={currentUser} isAdmin={rc.canImpersonate||rc.canManageAllCompanies} onSave={addTask} onClose={()=>setShowAdd(false)}/></Modal>}
      {editTask&&<Modal title="Edit Task" onClose={()=>setEditTask(null)}><TaskForm initial={editTask} contacts={contacts} companies={companies} prefs={prefs} currentUser={currentUser} isAdmin={rc.canImpersonate||rc.canManageAllCompanies} onSave={saveEdit} onClose={()=>setEditTask(null)}/></Modal>}
      {quickAddCompany&&<Modal title={`New Task · ${quickAddCompany.name}`} onClose={()=>setQuickAddCompany(null)}><TaskForm initial={{ title:"", type:"Follow-up Call", priority:"Medium", contactId:"", companyId:quickAddCompany.id, dueDate:TODAY, dueTime:"09:00", notes:"" }} contacts={contacts} companies={companies} prefs={prefs} currentUser={currentUser} isAdmin={rc.canImpersonate||rc.canManageAllCompanies} onSave={(form)=>{ addTask(form); setQuickAddCompany(null); }} onClose={()=>setQuickAddCompany(null)}/></Modal>}
    </div>
  );
}

// ─── Company Form ──────────────────────────────────────────────────────────────
function CountrySelect({ value, onChange, style={}, showDial=false }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);

  const filtered = q.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.dial.includes(q) || c.code.toLowerCase().includes(q.toLowerCase()))
    : COUNTRIES;

  const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES.find(c=>c.code==="US");

  React.useEffect(() => {
    if (!open) { setQ(""); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const baseStyle = { width:"100%", padding:"7px 10px", borderRadius:7, border:"1.5px solid #e2e4e8", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", boxSizing:"border-box", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, ...style };

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      {/* Trigger */}
      <div onClick={()=>setOpen(o=>!o)} style={baseStyle}>
        <span>{selected.flag} {selected.name}{showDial ? " ("+selected.dial+")" : ""}</span>
        <span style={{ color:"#9298a4", fontSize:10, flexShrink:0 }}>{open?"▲":"▼"}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:999, background:"#fff", borderRadius:10, border:"1.5px solid #e2e4e8", boxShadow:"0 8px 32px rgba(0,0,0,0.13)", overflow:"hidden" }}>
          {/* Search input */}
          <div style={{ padding:"8px 10px", borderBottom:"1px solid #f2f3f5" }}>
            <input
              ref={inputRef}
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Search country..."
              style={{ width:"100%", padding:"6px 10px", borderRadius:7, border:"1.5px solid #e2e4e8", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#f7f8fa", boxSizing:"border-box" }}
            />
          </div>
          {/* Options list */}
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            {filtered.length === 0
              ? <div style={{ padding:"14px 12px", fontSize:12, color:"#9298a4", textAlign:"center" }}>No results</div>
              : filtered.map(c => (
                <div key={c.code}
                  onMouseDown={e=>{ e.preventDefault(); onChange(c.code); setOpen(false); }}
                  style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:8, background: c.code===value ? "rgba(58,110,168,0.08)" : "transparent", fontWeight: c.code===value ? 700 : 400, color: c.code===value ? "#3a6ea8" : "#18191b" }}
                  onMouseEnter={e=>{ if(c.code!==value) e.currentTarget.style.background="#f7f8fa"; }}
                  onMouseLeave={e=>{ if(c.code!==value) e.currentTarget.style.background="transparent"; }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{c.flag}</span>
                  <span style={{ flex:1 }}>{c.name}</span>
                  {showDial && <span style={{ fontSize:11, color:"#9298a4", flexShrink:0 }}>{c.dial}</span>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}


function CompanyForm({ initial, onSave, onClose, companies=[] }) {
  const empty = { name:"", industry:"Finance", website:"", country:"US", notes:"" };
  const [form,setForm] = useState(initial||empty);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const lbl = { fontSize:11,fontWeight:700,letterSpacing:"0.09em",color:"#5a5e68",textTransform:"uppercase",marginBottom:5,display:"block",fontFamily:"'DM Sans',sans-serif" };
  const inp = { width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"#ffffff",fontSize:14,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:16 };

  // Duplicate detection — case-insensitive, exclude self when editing
  const nameVal = form.name.trim().toLowerCase();
  const duplicate = nameVal
    ? companies.find(c => c.name.trim().toLowerCase() === nameVal && c.id !== initial?.id)
    : null;

  const canSave = form.name.trim() && !duplicate;

  return (
    <div>
      <label style={lbl}>Company Name</label>
      <input
        style={{ ...inp, borderColor: duplicate ? "#dc2626" : "#e2e4e8", marginBottom: duplicate ? 6 : 16 }}
        value={form.name}
        placeholder="Acme Corp"
        onChange={e=>set("name",e.target.value)}
      />
      {duplicate && (
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(220,38,38,0.07)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#dc2626",fontWeight:600 }}>
          <span>⚠️</span>
          <span>A company named <strong>"{duplicate.name}"</strong> already exists. Please use a different name or find the existing record.</span>
        </div>
      )}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        <div><label style={lbl}>Industry</label><select style={{ ...inp,marginBottom:0 }} value={form.industry} onChange={e=>set("industry",e.target.value)}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
        <div><label style={lbl}>Country</label><CountrySelect value={form.country} onChange={v=>set("country",v)} style={{ padding:"9px 10px",borderRadius:8,border:"1.5px solid #e2e4e8",fontSize:13,marginBottom:0 }}/></div>
      </div>
      <div style={{ marginTop:16 }}>
        <label style={lbl}>Website <span style={{ fontWeight:400, textTransform:"none", fontSize:10, color:"#9298a4", letterSpacing:0 }}>— used to fetch company logo</span></label>
        <input style={inp} value={form.website} placeholder="e.g. apple.com or stripe.com" onChange={e=>set("website",e.target.value)}/>
      </div>
      <label style={lbl}>Notes</label>
      <textarea style={{ ...inp,resize:"vertical",minHeight:72 }} value={form.notes} placeholder="Brief description..." onChange={e=>set("notes",e.target.value)}/>
      <div style={{ display:"flex",gap:10,marginTop:8,justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button>
        <button onClick={()=>canSave&&onSave(form)} disabled={!canSave} style={{ padding:"10px 26px",borderRadius:10,border:"none",background:canSave?"linear-gradient(135deg,#3a6ea8,#4a84c0)":"#e2e4e8",color:canSave?"#fff":"#c0c8d4",cursor:canSave?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14 }}>Save Company</button>
      </div>
    </div>
  );
}

// ─── Contact Form ──────────────────────────────────────────────────────────────
function NotesPanel({ notes, onUpdate, readOnly=false }) {
  const [text,setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    const _nd = new Date();
    const date = _nd.getFullYear()+"-"+String(_nd.getMonth()+1).padStart(2,"0")+"-"+String(_nd.getDate()).padStart(2,"0");
    const time = String(_nd.getHours()).padStart(2,"0")+":"+String(_nd.getMinutes()).padStart(2,"0");
    onUpdate([...notes, { id:Date.now(), text:text.trim(), date, time }]);
    setText("");
  };
  const del = (id) => onUpdate(notes.filter(n=>n.id!==id));
  return (
    <div>
      {!readOnly&&<div style={{ display:"flex",gap:8,marginBottom:18 }}>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Add a note..." onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)add();}}
          style={{ flex:1,padding:"10px 13px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"#ffffff",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",resize:"none",minHeight:64,outline:"none" }}/>
        <button onClick={add} style={{ alignSelf:"flex-end",padding:"10px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>Add</button>
      </div>}
      {notes.length===0&&<p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic",textAlign:"center",padding:"20px 0" }}>{readOnly?"No notes.":"No notes yet."}</p>}
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {[...notes].reverse().map(n=>(
          <div key={n.id} style={{ background:"#f7f8fa",borderRadius:12,padding:"12px 14px",borderLeft:"3px solid #3a6ea8" }}>
            <p style={{ margin:0,fontSize:13,color:"#18191b",lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>{n.text}</p>
            <div style={{ display:"flex",justifyContent:"space-between",marginTop:8 }}>
              <span style={{ fontSize:11,color:"#9298a4" }}>{n.date}{n.time ? " · " + n.time : ""}</span>
              {!readOnly&&<button onClick={()=>del(n.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#9298a4",fontSize:12,fontFamily:"'DM Sans',sans-serif" }}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Companies View ────────────────────────────────────────────────────────────
function LocalClock({ tz, timeFormat="12h" }) {
  const fmt = (tz) => {
    try {
      return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: timeFormat!=="24h" });
    } catch(e) { return ""; }
  };
  const [time, setTime] = React.useState(() => fmt(tz));
  React.useEffect(() => {
    setTime(fmt(tz));
    const id = setInterval(() => setTime(fmt(tz)), 30000);
    return () => clearInterval(id);
  }, [tz]);
  if (!tz || !time) return null;
  return (
    <span style={{ fontSize:14, color:"#3a6ea8", fontWeight:700, fontVariantNumeric:"tabular-nums", display:"inline-flex", alignItems:"center", gap:5 }}>
      🕐 {time}
    </span>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    if (!value) return;
    (navigator.clipboard?.writeText(value) || Promise.reject())
      .catch(() => { const ta=document.createElement("textarea"); ta.value=value; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); })
      .finally ? (navigator.clipboard?.writeText(value)||Promise.resolve()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)}).catch(()=>{}) : null;
    navigator.clipboard?.writeText(value).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)}).catch(()=>{const ta=document.createElement("textarea");ta.value=value;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);setCopied(true);setTimeout(()=>setCopied(false),1500);});
  };
  return (
    <button onClick={e=>{e.stopPropagation();e.preventDefault();copy();}}
      title={copied?"Copied!":"Copy"}
      style={{ flexShrink:0,padding:"1px 6px",borderRadius:4,border:"1px solid",borderColor:copied?"#4ade80":"#e2e4e8",background:copied?"rgba(74,222,128,0.1)":"transparent",color:copied?"#16a34a":"#b0b6c0",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif",lineHeight:"16px",transition:"all 0.15s" }}>
      {copied?"✓":"⎘"}
    </button>
  );
}

function PeopleSection({ coContacts, currentCo, setContacts, setTasks, showToast, rc, currentUser, prefs={}, readOnly=false, flashContactId=null }) {
  const [addRows, setAddRows] = React.useState([]);
  const [editPerson, setEditPerson] = React.useState(null);
  const [deletePerson, setDeletePerson] = React.useState(null);

  const defaultCountry = COUNTRIES.find(c=>c.code===(prefs?.defaultCountry||currentCo.country||"US"))||COUNTRIES.find(c=>c.code==="US")||COUNTRIES[0];
  const blankRow = () => ({ _id:Date.now()+Math.random(), name:"", title:"", email:"", phone:"", country:defaultCountry.code, status:"lead" });

  const startAdding = () => { if (addRows.length===0) setAddRows([blankRow(), blankRow()]); };
  const updateRow = (id, field, val) => setAddRows(prev=>prev.map(r=>r._id===id?{...r,[field]:val}:r));

  const saveRows = () => {
    const valid = addRows.filter(r=>r.name.trim());
    if (!valid.length) { setAddRows([]); return; }
    const now = (()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})();
    const newContacts = valid.map(r => {
      const ctry = COUNTRIES.find(c=>c.code===r.country)||defaultCountry;
      return {
        id: "c_"+Date.now()+"_"+Math.floor(Math.random()*99999),
        name:r.name.trim(), title:r.title.trim(), email:r.email.trim(),
        phoneLocal:r.phone.trim(), phoneDialCode:ctry.dial,
        companyId:currentCo.id, status:r.status||"lead", tag:"",
        avatar:r.name.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
        country:r.country||currentCo.country||"", notes:[],
        ownerId:currentUser?.id||"", createdBy:currentUser?.id||"", createdAt:now,
        modifiedBy:currentUser?.id||"", modifiedAt:now
      };
    });
    setContacts(prev=>[...newContacts,...prev]);
    // Auto-create 3 tasks per new contact
    const taskDays = prefs.autoTaskDays || [5, 7, 10];
    const autoTasks = newContacts.flatMap(ct=>[
      { type:"Follow-up Call", days:taskDays[0], priority:"High",   notes:"Initial follow-up call." },
      { type:"Meeting",        days:taskDays[1], priority:"Medium", notes:"Introductory meeting." },
      { type:"Proposal",       days:taskDays[2], priority:"Medium", notes:"Send proposal." },
    ].map(({type,days,priority,notes})=>({
      id:"t_"+Date.now()+"_"+Math.floor(Math.random()*99999),
      title:`${type} · ${ct.name}`,
      type, priority, done:false,
      contactId:ct.id, companyId:ct.companyId,
      dueDate:daysFromNow(days), dueTime:"09:00", notes,
    })));
    if(autoTasks.length) setTasks(prev=>[...autoTasks,...prev]);
    showToast(`${newContacts.length} contact${newContacts.length>1?"s":""} added · ${autoTasks.length} tasks created`);
    setAddRows([]);
  };

  const saveEdit = () => {
    const now = (()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})();
    const ctry = COUNTRIES.find(c=>c.code===editPerson.country)||defaultCountry;
    setContacts(prev=>prev.map(c=>String(c.id)===String(editPerson.id)?{...c,
      name:editPerson.name, title:editPerson.title, email:editPerson.email,
      phoneLocal:editPerson.phone||editPerson.phoneLocal||"", phoneDialCode:ctry.dial,
      country:editPerson.country, status:editPerson.status,
      avatar:editPerson.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
      modifiedBy:currentUser?.id||"", modifiedAt:now
    }:c));
    setEditPerson(null); showToast("Contact updated");
  };

  const confirmDelete = (ct) => {
    setContacts(prev=>prev.filter(c=>String(c.id)!==String(ct.id)));
    setDeletePerson(null); showToast("Contact removed");
  };

  const inpStyle = { padding:"7px 10px",borderRadius:7,border:"1.5px solid #e2e4e8",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",background:"#fff",boxSizing:"border-box",width:"100%" };
  const STATUS_OPTS = ["active","lead","inactive"];

  return (
    <div style={{ marginTop:22 }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:13,fontWeight:800,color:"#18191b" }}>👥 People</span>
          <span style={{ fontSize:11,background:"#e8eaed",color:"#5a5e68",borderRadius:20,padding:"2px 9px",fontWeight:700 }}>{coContacts.length}</span>
        </div>
        {rc.canAddContact&&!readOnly&&addRows.length===0&&(
          <button onClick={startAdding} style={{ padding:"6px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:12 }}>+ Add People</button>
        )}
      </div>

      {/* Existing contacts grid */}
      {coContacts.length>0&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:addRows.length?16:0 }}>
          {coContacts.map(ct=>{
            const ctry = COUNTRIES.find(c=>c.code===ct.country);
            const dial = ct.phoneDialCode||(ctry?.dial||"");
            const ph = ct.phoneLocal||ct.phone||"";
            const fullPh = dial&&ph ? `${dial} ${ph}` : ph;
            const isEditing = editPerson?.id===ct.id;

            return isEditing?(
              <div key={ct.id} style={{ gridColumn:"1/-1",background:"#f7f8fa",borderRadius:14,border:"1.5px solid #3a6ea8",padding:"20px",boxShadow:"0 4px 20px rgba(58,110,168,0.08)" }}>
                {/* Header */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:12,fontWeight:800,color:"#3a6ea8",letterSpacing:"0.07em",textTransform:"uppercase" }}>Edit Person</div>
                    <div style={{ fontSize:11,color:"#9298a4",marginTop:2 }}>{ct.name}</div>
                  </div>
                  <button onClick={()=>setEditPerson(null)} style={{ padding:"4px 10px",borderRadius:6,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:12,color:"#9298a4" }}>✕ Cancel</button>
                </div>
                {/* Row 1: Name · Title · Email */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Name *</div>
                    <input value={editPerson.name||""} onChange={e=>setEditPerson(p=>({...p,name:e.target.value}))} style={inpStyle} placeholder="Full name"/>
                  </div>
                  <div>
                    <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Title</div>
                    <input value={editPerson.title||""} onChange={e=>setEditPerson(p=>({...p,title:e.target.value}))} style={inpStyle} placeholder="e.g. CEO"/>
                  </div>
                  <div>
                    <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Email</div>
                    <input value={editPerson.email||""} onChange={e=>setEditPerson(p=>({...p,email:e.target.value}))} style={inpStyle} placeholder="email@co.com"/>
                  </div>
                </div>
                {/* Row 2: Country · Phone · Status */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Country</div>
                    <CountrySelect value={editPerson.country||""} onChange={v=>setEditPerson(p=>({...p,country:v}))} showDial={true}/>
                  </div>
                  <div>
                    <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>
                      Phone <span style={{ color:"#3a6ea8",fontWeight:700 }}>({COUNTRIES.find(c=>c.code===editPerson.country)?.dial||""})</span>
                    </div>
                    <input value={editPerson.phone||editPerson.phoneLocal||""} onChange={e=>setEditPerson(p=>({...p,phone:e.target.value}))} style={inpStyle} placeholder="local number"/>
                  </div>
                  <div>
                    <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Status</div>
                    <select value={editPerson.status||"lead"} onChange={e=>setEditPerson(p=>({...p,status:e.target.value}))} style={{...inpStyle,padding:"7px 10px",color:(STATUS_COLORS[editPerson.status||"lead"]||STATUS_COLORS.inactive).text,fontWeight:700}}>
                      {STATUS_OPTS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                {/* Footer */}
                <div style={{ display:"flex",justifyContent:"flex-end" }}>
                  <button onClick={saveEdit} disabled={!editPerson.name?.trim()}
                    style={{ padding:"9px 26px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:700,opacity:editPerson.name?.trim()?1:0.45,boxShadow:"0 3px 12px rgba(58,110,168,0.25)" }}>Save Changes</button>
                </div>
              </div>
            ):(
              <div key={ct.id} style={{ background:"#fff",borderRadius:12,border:"1.5px solid #e2e4e8",padding:"13px 15px",display:"flex",gap:11,alignItems:"flex-start",transition:"border-color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#3a6ea8"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e4e8"}>
                <Avatar initials={ct.avatar} size={38}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap" }}>
                    <span style={{ fontSize:13,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ct.name}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:(STATUS_COLORS[ct.status]||STATUS_COLORS.inactive).text||"#5a5e68",background:(STATUS_COLORS[ct.status]||STATUS_COLORS.inactive).bg||"#f2f3f5",borderRadius:5,padding:"2px 7px",textTransform:"capitalize",flexShrink:0 }}>{ct.status}</span>
                  </div>
                  {ct.title&&<div style={{ fontSize:11,color:"#9298a4",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ct.title}</div>}
                  <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
                    {ct.email&&<div style={{ display:"flex",alignItems:"center",gap:5,minWidth:0 }}><a href={`mailto:${ct.email}`} style={{ fontSize:11,color:"#3a6ea8",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>✉ {ct.email}</a><CopyBtn value={ct.email}/></div>}
                    {fullPh&&<div style={{ display:"flex",alignItems:"center",gap:5 }}><a href={`tel:${fullPh.replace(/\s/g,"")}`} style={{ fontSize:11,color:"#5a5e68",textDecoration:"none" }}>📞 {fullPh}</a><CopyBtn value={fullPh}/></div>}
                    {ctry&&<span style={{ fontSize:10,color:"#9298a4" }}>{ctry.flag} {ctry.name}</span>}
                  </div>
                </div>
                {rc.canEditContact&&!readOnly&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:4,flexShrink:0 }}>
                    <button onClick={()=>setEditPerson({...ct,phone:ct.phoneLocal||ct.phone||"",country:ct.country||defaultCountry.code,status:ct.status||"lead"})}
                      style={{ padding:"3px 9px",borderRadius:5,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:11,color:"#5a5e68",fontWeight:600 }}>✏️</button>
                    {rc.canEditContact&&<button onClick={()=>setDeletePerson(ct)}
                      style={{ padding:"3px 9px",borderRadius:5,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",fontSize:11,color:"#dc2626" }}>🗑</button>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inline add rows */}
      {addRows.length>0&&(
        <div style={{ background:"#f7f8fa",borderRadius:14,border:"1.5px solid #3a6ea8",padding:"20px",marginBottom:4,boxShadow:"0 4px 20px rgba(58,110,168,0.08)" }}>
          {/* Header */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
            <div>
              <div style={{ fontSize:12,fontWeight:800,color:"#3a6ea8",letterSpacing:"0.07em",textTransform:"uppercase" }}>Add People</div>
              <div style={{ fontSize:11,color:"#9298a4",marginTop:2 }}>{currentCo.name} · {addRows.length} row{addRows.length!==1?"s":""}</div>
            </div>
            <button onClick={()=>setAddRows([])} style={{ padding:"4px 10px",borderRadius:6,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:12,color:"#9298a4" }}>✕ Cancel</button>
          </div>

          {/* Person cards */}
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {addRows.map((row,idx)=>{
              const rowCtry = COUNTRIES.find(c=>c.code===row.country)||defaultCountry;
              return (
                <div key={row._id} style={{ background:"#fff",borderRadius:11,border:`1.5px solid ${row.name?"#e2e4e8":"rgba(58,110,168,0.3)"}`,padding:"16px",position:"relative" }}>
                  {/* Row number + remove */}
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                    <span style={{ fontSize:10,fontWeight:800,color:"#9298a4",letterSpacing:"0.07em",textTransform:"uppercase" }}>Person {idx+1}</span>
                    {addRows.length>1&&<button onClick={()=>setAddRows(prev=>prev.filter(r=>r._id!==row._id))}
                      style={{ padding:"2px 8px",borderRadius:5,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",fontSize:11,color:"#dc2626",fontWeight:600 }}>Remove</button>}
                  </div>
                  {/* Fields: 3 + 3 grid */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Name *</div>
                      <input value={row.name} onChange={e=>updateRow(row._id,"name",e.target.value)} placeholder="Full name"
                        style={{...inpStyle,borderColor:row.name?"#e2e4e8":"rgba(58,110,168,0.4)"}}/>
                    </div>
                    <div>
                      <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Title</div>
                      <input value={row.title} onChange={e=>updateRow(row._id,"title",e.target.value)} placeholder="e.g. CEO" style={inpStyle}/>
                    </div>
                    <div>
                      <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Email</div>
                      <input value={row.email} onChange={e=>updateRow(row._id,"email",e.target.value)} placeholder="email@co.com" style={inpStyle}/>
                    </div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
                    <div>
                      <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Country</div>
                      <CountrySelect value={row.country} onChange={v=>updateRow(row._id,"country",v)} showDial={true}/>
                    </div>
                    <div>
                      <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>
                        Phone <span style={{ color:"#3a6ea8",fontWeight:700 }}>({rowCtry.dial})</span>
                      </div>
                      <input value={row.phone} onChange={e=>updateRow(row._id,"phone",e.target.value)} placeholder="local number" style={inpStyle}/>
                    </div>
                    <div>
                      <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>Status</div>
                      <select value={row.status} onChange={e=>updateRow(row._id,"status",e.target.value)}
                        style={{...inpStyle,padding:"7px 10px",color:(STATUS_COLORS[row.status]||STATUS_COLORS.inactive).text,fontWeight:700}}>
                        {STATUS_OPTS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16 }}>
            <button onClick={()=>setAddRows(prev=>[...prev,blankRow()])}
              style={{ padding:"8px 16px",borderRadius:8,border:"1.5px dashed #c0c8d4",background:"transparent",cursor:"pointer",fontSize:12,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>+ Add another person</button>
            <button onClick={saveRows} style={{ padding:"9px 26px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:700,boxShadow:"0 3px 12px rgba(58,110,168,0.25)" }}>
              Save{addRows.filter(r=>r.name.trim()).length>0?` (${addRows.filter(r=>r.name.trim()).length})` : ""}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {coContacts.length===0&&addRows.length===0&&(
        <div style={{ textAlign:"center",padding:"28px 0",color:"#9298a4" }}>
          <div style={{ fontSize:32,marginBottom:8,opacity:0.35 }}>👥</div>
          <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>No people yet</div>
          <div style={{ fontSize:12,marginBottom:14 }}>Add contacts for this company</div>
          {rc.canAddContact&&!readOnly&&<button onClick={startAdding} style={{ padding:"8px 20px",borderRadius:9,border:"1.5px dashed #c0c8d4",background:"transparent",cursor:"pointer",fontSize:12,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>+ Add People</button>}
        </div>
      )}

      {/* Delete confirm */}
      {deletePerson&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setDeletePerson(null)}>
          <div style={{ background:"#fff",borderRadius:16,padding:"28px 32px",maxWidth:380,width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:16,fontWeight:700,color:"#18191b",marginBottom:8,fontFamily:"'Playfair Display',serif" }}>Remove contact?</div>
            <p style={{ color:"#5a5e68",fontSize:14,margin:"0 0 20px" }}>Remove <strong>{deletePerson.name}</strong> from {currentCo.name}?</p>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button onClick={()=>setDeletePerson(null)} style={{ padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#5a5e68" }}>Cancel</button>
              <button onClick={()=>confirmDelete(deletePerson)} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#c0392b,#e74c3c)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13 }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function CompaniesView({ companies, contacts, setCompanies, setContacts, tasks, setTasks, showToast, onViewContacts, triggerAdd, rc={canAdd:true,canEdit:true,canDelete:true}, highlightId, clearHighlight, highlightContactId, clearHighlightContact, currentUser, users=[], prefs={} }) {
  const [search,setSearch] = useState("");
  const [showAdd,setShowAdd] = useState(false);
  const [editCo,setEditCo] = useState(null);
  const [deleteCo,setDeleteCo] = useState(null);
  const [selected,setSelected] = useState(highlightId?companies.find(c=>c.id===highlightId)||null:null);
  const [coTab,setCoTab] = useState("overview");
  const [showAddCoTask,setShowAddCoTask] = useState(false);
  const [editCoTask,setEditCoTask] = useState(null);
  const [coQuickContact,setCoQuickContact] = useState(null);
  const [deleteCoTaskConfirm,setDeleteCoTaskConfirm] = useState(null);
  const [noteFilter,setNoteFilter] = useState("");
  const [ownerFilter,setOwnerFilter] = useState("");
  const [prevTrigger,setPrevTrigger] = useState(triggerAdd);
  const [flashContactId,setFlashContactId] = useState(null);
  if (triggerAdd!==prevTrigger){setShowAdd(true);setPrevTrigger(triggerAdd);}

  // When highlightContactId arrives, navigate to the company and flash the contact
  React.useEffect(() => {
    if (!highlightId) return;
    const co = companies.find(c => c.id === highlightId);
    if (co) { setSelected(co); setCoTab("overview"); }
  }, [highlightId]);

  React.useEffect(() => {
    if (!highlightContactId) return;
    const ct = contacts.find(c => String(c.id) === String(highlightContactId));
    if (ct) {
      const co = companies.find(c => c.id === ct.companyId);
      if (co) { setSelected(co); setCoTab("overview"); }
      if (clearHighlightContact) clearHighlightContact();
    }
  }, [highlightContactId]);

  // If user can't view all, restrict list to their own companies
  const visibleCompanies = rc.canViewAll ? companies : companies.filter(c => c.ownerId === currentUser?.id);
  const filtered = visibleCompanies.filter(c=>(!search||c.name.toLowerCase().includes(search.toLowerCase())||c.industry.toLowerCase().includes(search.toLowerCase()))&&(!ownerFilter||(ownerFilter==="__none__"?!c.ownerId:c.ownerId===ownerFilter)));
  const currentCo = selected?companies.find(c=>c.id===selected.id):null;
  const coContacts = currentCo?contacts.filter(c=>c.companyId===currentCo.id):[];
  const coTasks = currentCo?(tasks||[]).filter(t=>t.companyId===currentCo.id):[];
  const coOpenTasks = coTasks.filter(t=>!t.done);
  const coDoneTasks = coTasks.filter(t=>t.done);

  // Ownership gate: only the company owner (or admin/impersonator) can add/edit/delete contacts, tasks, notes
  const isOwner = !currentCo || currentCo.ownerId === currentUser?.id || rc.canImpersonate || rc.canManageAllCompanies;
  const canWrite = isOwner; // shorthand used in JSX below

  const addCompany = (form) => { const now=(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})(); setCompanies(prev=>[{...form,id:"co_"+Date.now(),ownerId:currentUser?.id||"",createdBy:currentUser?.id||"",createdAt:now,modifiedBy:currentUser?.id||"",modifiedAt:now},...prev]); setShowAdd(false); showToast("Company added"); };
  const saveEdit = (form) => { const now=(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})(); setCompanies(prev=>prev.map(c=>c.id===editCo.id?{...c,...form,modifiedBy:currentUser?.id||"",modifiedAt:now}:c)); setSelected(prev=>({...prev,...form,modifiedBy:currentUser?.id||"",modifiedAt:now})); setEditCo(null); showToast("Company updated"); };


  const doDelete = () => { setContacts(prev=>prev.map(c=>c.companyId===deleteCo.id?{...c,companyId:""}:c)); setCompanies(prev=>prev.filter(c=>c.id!==deleteCo.id)); if(selected?.id===deleteCo.id)setSelected(null); setDeleteCo(null); showToast("Company deleted"); };
  const updateCoNotes = (notes) => { const now=(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})(); setCompanies(prev=>prev.map(c=>c.id===currentCo.id?{...c,notesList:notes,modifiedBy:currentUser?.id||"",modifiedAt:now}:c)); setSelected(prev=>({...prev,notesList:notes,modifiedBy:currentUser?.id||"",modifiedAt:now})); };


  const btnStyle = (active) => ({ padding:"14px 18px",border:"none",background:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:active?"#3a6ea8":"#5a5e68",borderBottom:active?"2px solid #3a6ea8":"2px solid transparent",letterSpacing:"0.04em",transition:"color 0.15s" });

  return (
    <div style={{ display:"flex",gap:20 }}>
      <div style={{ flex:currentCo?"0 0 380px":1,maxWidth:currentCo?380:"100%" }}>
        {/* Search + Add */}
        <div style={{ display:"flex",gap:10,marginBottom:10 }}>
          <div style={{ position:"relative",flex:1 }}>
            <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#9298a4" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies..." style={{ width:"100%",padding:"10px 12px 10px 36px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:14,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none" }}/>
          </div>
          {rc.canAddCompany&&<button onClick={()=>setShowAdd(true)} style={{ padding:"10px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13 }}>+ Add</button>}
        </div>
        {/* Owner filter pills */}
        {users.length>0&&(()=>{
          const unassignedCount = companies.filter(c=>!c.ownerId).length;
          const allOpts = [
            {id:"",label:"All",count:companies.length},
            ...users.map(u=>({id:u.id,label:u.name.split(" ")[0],fullName:u.name,count:companies.filter(c=>c.ownerId===u.id).length,isMe:u.id===currentUser?.id})),
            ...(unassignedCount>0?[{id:"__none__",label:"Unassigned",count:unassignedCount}]:[])
          ];
          return (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
                <span style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",flexShrink:0,marginRight:2 }}>Owner</span>
                {allOpts.map(opt=>{
                  const active = ownerFilter===opt.id;
                  return (
                    <button key={opt.id} onClick={()=>setOwnerFilter(ownerFilter===opt.id?"":opt.id)}
                      style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:20,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                        borderColor:active?"#3a6ea8":opt.isMe?"rgba(58,110,168,0.3)":"#e2e4e8",
                        background:active?"#3a6ea8":opt.isMe&&!active?"rgba(58,110,168,0.06)":"transparent",
                        color:active?"#fff":opt.isMe?"#3a6ea8":"#5a5e68" }}>
                      {opt.isMe&&<span>👤</span>}
                      {opt.id==="__none__"&&<span>—</span>}
                      {opt.label}
                      <span style={{ fontSize:10,fontWeight:600,opacity:active?0.8:0.55,background:active?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.06)",borderRadius:10,padding:"1px 6px" }}>{opt.count}</span>
                    </button>
                  );
                })}
                {ownerFilter&&<button onClick={()=>setOwnerFilter("")} style={{ padding:"4px 10px",borderRadius:20,border:"1px solid #e2e4e8",background:"transparent",color:"#9298a4",cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif",marginLeft:2 }}>✕ Clear</button>}
              </div>
              {ownerFilter&&ownerFilter!=="__none__"&&(()=>{const u=users.find(x=>x.id===ownerFilter);return u?<div style={{ fontSize:11,color:"#3a6ea8",marginTop:6,fontWeight:600 }}>Showing companies owned by {u.name}</div>:null;})()}
            </div>
          );
        })()}
        <div style={{ background:"#fff",borderRadius:16,boxShadow:"0 2px 16px rgba(58,31,0,0.08)",border:"1px solid #e2e4e8",overflow:"hidden" }}>
          {filtered.length===0?<div style={{ padding:"48px 24px",textAlign:"center" }}><div style={{ fontSize:36 }}>🏢</div><p style={{ color:"#9298a4" }}>No companies found.</p></div>
            :filtered.map((co,i)=>{
              const coC=contacts.filter(c=>c.companyId===co.id);
              const ctry=getCountry(co.country);
              return <div key={co.id} onClick={()=>{setSelected(co);setCoTab("overview");setNoteFilter("");}}
                style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 18px",cursor:"pointer",borderBottom:i<filtered.length-1?"1px solid #f2f3f5":"none",background:currentCo?.id===co.id?"#f7f8fa":"#fff",transition:"background 0.15s",borderLeft:currentCo?.id===co.id?"3px solid #3a6ea8":"3px solid transparent" }}
                onMouseEnter={e=>{if(currentCo?.id!==co.id)e.currentTarget.style.background="#f7f8fa";}}
                onMouseLeave={e=>{if(currentCo?.id!==co.id)e.currentTarget.style.background="#fff";}}>
                <CompanyLogo name={co.name} website={co.website} size={44}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:2 }}>
                    <span style={{ fontWeight:700,fontSize:14,color:"#18191b",fontFamily:"'Playfair Display',serif",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{co.name}</span>
                    {co.ownerId&&(()=>{const owner=users.find(u=>u.id===co.ownerId);return owner?<span style={{ fontSize:9,fontWeight:700,color:co.ownerId===currentUser?.id?"#3a6ea8":"#9298a4",background:co.ownerId===currentUser?.id?"rgba(58,110,168,0.1)":"#f2f3f5",borderRadius:8,padding:"2px 7px",flexShrink:0,whiteSpace:"nowrap" }}>{co.ownerId===currentUser?.id?"👤 ":""}{owner.name.split(" ")[0]}</span>:null;})()}
                  </div>
                  <div style={{ fontSize:12,color:"#5a5e68",display:"flex",gap:6,flexWrap:"wrap" }}><span>{co.industry}</span><span>·</span><span>{ctry.flag} {ctry.name}</span><span>·</span><span style={{ color:"#9298a4" }}>{coC.length} contact{coC.length!==1?"s":""}</span></div>
                  {(()=>{ const coT=tasks.filter(t=>t.companyId===co.id); const la=getLastActivity(co,coT,coC); return la?<div style={{ fontSize:10,color:"#b0b6c0",marginTop:3 }}>🕐 {la.stamp.slice(0,10)}{la.stamp.length>10?" "+la.stamp.slice(11,16):""} · {la.label}</div>:null; })()}
                </div>
              </div>;
            })}
        </div>
        <p style={{ fontSize:12,color:"#9298a4",margin:"10px 0 0 4px" }}>{filtered.length} of {companies.length} companies</p>
      </div>

      {currentCo&&(
        <div style={{ flex:1,background:"#fff",borderRadius:16,boxShadow:"0 2px 16px rgba(58,31,0,0.08)",border:"1px solid #e2e4e8",animation:"slideIn 0.25s cubic-bezier(.16,1,.3,1)",overflow:"hidden",display:"flex",flexDirection:"column" }}>
          <div style={{ background:"linear-gradient(180deg,#1c1e22,#23262e)",padding:"28px 28px 24px",position:"relative" }}>
            <button onClick={()=>setSelected(null)} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.12)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#f2f3f5",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
            <div style={{ display:"flex",alignItems:"flex-end",gap:16 }}>
              <CompanyLogo name={currentCo.name} website={currentCo.website} size={56}/>
              <div>
                <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:22,color:"#f2f3f5",fontWeight:700 }}>{currentCo.name}</h2>
                <p style={{ margin:"3px 0 0",color:"rgba(255,245,234,0.65)",fontSize:14 }}>{currentCo.industry} · {getCountry(currentCo.country).flag} {getCountry(currentCo.country).name}</p>
              </div>
            </div>
            {!isOwner&&(
              <div style={{ margin:"12px 0 0",background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontSize:13 }}>🔒</span>
                <span style={{ fontSize:12,color:"rgba(255,245,234,0.75)",fontWeight:600 }}>
                  View only — owned by {users.find(u=>u.id===currentCo.ownerId)?.name||"another user"}
                </span>
              </div>
            )}
            <div style={{ display:"flex",gap:8,marginTop:18 }}>
              {rc.canEditOwnCompany&&isOwner&&<button onClick={()=>setEditCo(currentCo)} style={{ padding:"7px 18px",borderRadius:8,border:"none",background:"rgba(255,255,255,0.14)",color:"#f2f3f5",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13 }}>✏️ Edit</button>}
              {rc.canEditOwnCompany&&isOwner&&<button onClick={()=>setDeleteCo(currentCo)} style={{ padding:"7px 18px",borderRadius:8,border:"none",background:"rgba(220,60,30,0.2)",color:"#fca5a5",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13 }}>🗑 Delete</button>}
            </div>
          </div>
          <div style={{ display:"flex",borderBottom:"1px solid #e2e4e8",padding:"0 28px",alignItems:"center" }}>
            <button style={btnStyle(coTab==="overview")} onClick={()=>setCoTab("overview")}>📋 Overview</button>
            <button style={btnStyle(coTab==="tasks")} onClick={()=>setCoTab("tasks")}>✅ Tasks ({coOpenTasks.length}{coDoneTasks.length>0?` · ${coDoneTasks.length} done`:""})</button>
            <button style={btnStyle(coTab==="notes")} onClick={()=>setCoTab("notes")}>📝 Notes ({(currentCo.notesList||[]).length + coContacts.reduce((s,ct)=>s+(ct.notes||[]).length,0)})</button>
            <span style={{ flex:1 }}/>
          </div>
          <div style={{ flex:1,overflow:"auto",padding:"24px 28px" }}>
            {coTab==="overview"&&(
              <div style={{ padding:"24px 28px" }}>
                {/* Company info */}
                <DetailRow icon="🏭" label="Industry" value={currentCo.industry}/>
                <DetailRow icon="🌍" label="Country"  value={<span style={{ display:"flex",alignItems:"center",gap:10 }}><span>{getCountry(currentCo.country).flag} {getCountry(currentCo.country).name}</span><LocalClock tz={getCountry(currentCo.country).tz} timeFormat={prefs?.timeFormat}/></span>}/>
                <DetailRow icon="🌐" label="Website"  value={currentCo.website?<a href={`https://${currentCo.website}`} target="_blank" rel="noreferrer" style={{ color:"#5a5e68",textDecoration:"none" }}>{currentCo.website}</a>:null}/>
                <DetailRow icon="📝" label="About"    value={currentCo.notes}/>

                {/* Company-level Owner + Audit Trail */}
                <div style={{ marginTop:22,borderRadius:12,border:"1.5px solid #e2e4e8",overflow:"hidden" }}>
                  {/* Owner row - editable only if canReassign */}
                  <div style={{ padding:"13px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e2e4e8",background:"#fff" }}>
                    <span style={{ fontSize:16 }}>👤</span>
                    <span style={{ fontSize:10,fontWeight:800,color:"#9298a4",width:72,letterSpacing:"0.07em",textTransform:"uppercase",flexShrink:0 }}>Owner</span>
                    {rc.canReassign
                      ? <select
                          value={currentCo.ownerId||""}
                          onChange={e=>{
                            const now=(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})();
                            setCompanies(prev=>prev.map(co=>co.id===currentCo.id?{...co,ownerId:e.target.value,modifiedBy:currentUser?.id||"",modifiedAt:now}:co));
                            showToast("Owner updated");
                          }}
                          style={{ flex:1,fontSize:13,fontWeight:700,color:"#18191b",border:"none",background:"transparent",cursor:"pointer",outline:"none",fontFamily:"'DM Sans',sans-serif",padding:"0 4px" }}>
                          <option value="">— Unassigned —</option>
                          {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      : <span style={{ flex:1,fontSize:13,fontWeight:700,color:"#18191b",padding:"0 4px" }}>
                          {users.find(u=>u.id===currentCo.ownerId)?.name||"— Unassigned —"}
                        </span>
                    }
                    {currentCo.ownerId&&<span style={{ fontSize:11,background:"rgba(58,110,168,0.08)",color:"#3a6ea8",borderRadius:6,padding:"3px 10px",fontWeight:700,flexShrink:0 }}>Responsible</span>}
                  </div>
                  {/* Audit Trail */}
                  <div style={{ background:"#fafbfc",padding:"12px 16px" }}>
                    <div style={{ fontSize:9,fontWeight:800,color:"#5a5e68",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10 }}>Audit Trail</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                      {(()=>{
                        const lastAct = getLastActivity(currentCo, coTasks, coContacts);
                        return [
                          { label:"Created",  icon:"📅", name:users.find(u=>u.id===currentCo.createdBy)?.name||"—",  date:currentCo.createdAt||"",  sub:null },
                          { label:"Last Activity", icon:"🕐", name:lastAct?lastAct.label:"—", date:lastAct?lastAct.stamp:"", sub:null },
                        ].map(r=>(
                          <div key={r.label} style={{ background:"#fff",borderRadius:9,padding:"10px 13px",border:"1px solid #e2e4e8" }}>
                            <div style={{ fontSize:9,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4 }}>{r.icon} {r.label}</div>
                            <div style={{ fontSize:12,fontWeight:700,color:"#18191b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.name}</div>
                            <div style={{ fontSize:10,color:"#9298a4",marginTop:2 }}>{r.date.slice(0,10)||"—"}</div>
                            {r.date.length>10&&<div style={{ fontSize:10,color:"#b0b6c0",marginTop:1 }}>🕐 {r.date.slice(11,16)}</div>}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <PeopleSection coContacts={coContacts} currentCo={currentCo} setContacts={setContacts} setTasks={setTasks} showToast={showToast} rc={rc} currentUser={currentUser} prefs={prefs} readOnly={!canWrite} flashContactId={flashContactId}/>
              </div>
            )}
            {coTab==="tasks"&&(
              <div style={{ padding:"24px 28px" }}>
                {/* Tasks header with add button */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
                  <span style={{ fontSize:13,fontWeight:800,color:"#18191b",letterSpacing:"0.04em" }}>Tasks for {currentCo.name}</span>
                  {rc.canAddTask&&canWrite&&<button onClick={()=>{
                    setShowAddCoTask(true);
                  }} style={{ padding:"7px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:12,boxShadow:"0 3px 10px rgba(58,110,168,0.15)" }}>+ New Task</button>}
                </div>
                {coTasks.length===0
                  ? <div style={{ textAlign:"center",padding:"36px 0" }}>
                      <div style={{ fontSize:36,marginBottom:10 }}>✅</div>
                      <p style={{ color:"#9298a4",fontSize:13,fontStyle:"italic",margin:0 }}>No tasks yet — add one above.</p>
                    </div>
                  : <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {/* Open tasks */}
                      {coOpenTasks.length>0&&(
                        <>
                          <div style={{ display:"flex",alignItems:"center",gap:8,margin:"4px 0 8px" }}>
                            <span style={{ fontSize:11,fontWeight:800,color:"#5a5e68",textTransform:"uppercase",letterSpacing:"0.07em" }}>Open ({coOpenTasks.length})</span>
                            <div style={{ flex:1,height:1,background:"#e2e4e8" }}/>
                          </div>
                          {coOpenTasks.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(t=>{
                            const contact = contacts.find(c=>String(c.id)===String(t.contactId));
                            const isOverdue = t.dueDate<TODAY;
                            return (
                              <div key={t.id} style={{ background:"#f7f8fa",borderRadius:12,padding:"12px 14px",border:`1.5px solid ${isOverdue?"rgba(220,38,38,0.25)":"#e2e4e8"}`,display:"flex",alignItems:"flex-start",gap:10 }}>
                                {canWrite
                                  ? <button onClick={()=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:true,updatedAt:(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})()}:x))}
                                      style={{ width:20,height:20,borderRadius:"50%",border:"2px solid #e2e4e8",background:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center" }}
                                      title="Mark complete"/>
                                  : <span style={{ width:20,height:20,borderRadius:"50%",border:"2px solid #e2e4e8",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center" }}/>
                                }
                                <div style={{ flex:1,minWidth:0 }}>
                                  <div style={{ fontWeight:700,fontSize:13,color:"#18191b",fontFamily:"'Playfair Display',serif",marginBottom:3 }}>{t.title}</div>
                                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                                    <span style={{ fontSize:11,color:"#9298a4",fontWeight:600 }}>{TYPE_ICONS[t.type]||"📌"} {t.type}</span>
                                    <PriorityBadge priority={t.priority}/>
                                    <span style={{ fontSize:11,fontWeight:600,color:isOverdue?"#dc2626":t.dueDate===TODAY?"#b84c20":"#5a5e68" }}>
                                      {isOverdue?"⚠ Overdue":t.dueDate===TODAY?"Today":formatDate(t.dueDate,prefs.dateFormat)}
                                    </span>
                                    {t.dueTime&&<span style={{ fontSize:11,color:"#9298a4" }}>· {t.dueTime}</span>}
                                    {contact&&<span onClick={()=>setCoQuickContact(contact)} style={{ fontSize:11,color:"#3a6ea8",cursor:"pointer",fontWeight:600,borderBottom:"1px solid rgba(58,110,168,0.25)" }}>👤 {contact.name}</span>}
                                  </div>
                                  {t.notes&&<div style={{ fontSize:11,color:"#9298a4",marginTop:3,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.notes}</div>}
                                </div>
                                <div style={{ display:"flex",gap:4,flexShrink:0,marginTop:2 }}>
                                  {rc.canEditTask&&canWrite&&<button onClick={()=>setEditCoTask(t)} style={{ padding:"3px 9px",borderRadius:6,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:11,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>Edit</button>}
                                  {rc.canDeleteTask&&canWrite&&<button onClick={()=>setDeleteCoTaskConfirm(t)} style={{ padding:"3px 9px",borderRadius:6,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",fontSize:11,color:"#dc2626",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>✕</button>}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                      {/* Completed tasks */}
                      {coDoneTasks.length>0&&(
                        <>
                          <div style={{ display:"flex",alignItems:"center",gap:8,margin:"12px 0 8px" }}>
                            <div style={{ flex:1,height:1,background:"#f2f3f5" }}/>
                            <span style={{ fontSize:11,fontWeight:800,color:"#16a34a",textTransform:"uppercase",letterSpacing:"0.07em" }}>✅ Completed ({coDoneTasks.length})</span>
                            <div style={{ flex:1,height:1,background:"#f2f3f5" }}/>
                          </div>
                          {coDoneTasks.sort((a,b)=>b.dueDate.localeCompare(a.dueDate)).map(t=>{
                            const contact = contacts.find(c=>String(c.id)===String(t.contactId));
                            return (
                              <div key={t.id} style={{ background:"#f7f8fa",borderRadius:10,padding:"10px 14px",border:"1px solid #d1f0d8",display:"flex",alignItems:"center",gap:10,opacity:0.85 }}>
                                <span style={{ fontSize:14,flexShrink:0 }}>✅</span>
                                <div style={{ flex:1,minWidth:0 }}>
                                  <div style={{ fontWeight:600,fontSize:13,color:"#27924a",textDecoration:"line-through",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
                                  <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginTop:2 }}>
                                    <span style={{ fontSize:11,color:"#5a9a68",fontWeight:600 }}>{TYPE_ICONS[t.type]} {t.type}</span>
                                    <span style={{ fontSize:11,color:"#6aaa78" }}>· {formatDate(t.dueDate,prefs?.dateFormat)}</span>
                                    {contact&&<span onClick={()=>setCoQuickContact(contact)} style={{ fontSize:11,color:"#3a6ea8",cursor:"pointer",fontWeight:600,borderBottom:"1px solid rgba(58,110,168,0.25)" }}>👤 {contact.name}</span>}
                                  </div>
                                  {t.notes&&<div style={{ fontSize:11,color:"#5a9a68",marginTop:3,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.notes}</div>}
                                </div>
                                <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                                  {rc.canEditTask&&canWrite&&<button onClick={()=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:false,updatedAt:(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})()}:x))} style={{ padding:"3px 9px",borderRadius:6,border:"1px solid #a5d6a7",background:"transparent",cursor:"pointer",fontSize:11,color:"#27924a",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>Reopen</button>}
                                  {rc.canEditTask&&canWrite&&<button onClick={()=>setEditCoTask(t)} style={{ padding:"3px 9px",borderRadius:6,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:11,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>Edit</button>}
                                  {rc.canDeleteTask&&canWrite&&<button onClick={()=>setDeleteCoTaskConfirm(t)} style={{ padding:"3px 9px",borderRadius:6,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",fontSize:11,color:"#dc2626",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>✕</button>}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                }
              </div>
            )}
            {coTab==="notes"&&(()=>{
              // Build note pools
              const coNotes   = (currentCo.notesList||[]).map(n=>({...n,source:"company",  sourceName:currentCo.name,  ownerId:"__company__"}));
              const ctNotes   = coContacts.flatMap(ct=>(ct.notes||[]).map(n=>({...n,source:"contact", sourceName:ct.name, contactId:ct.id, ownerId:ct.id})));
              const allNotes  = [...coNotes,...ctNotes].sort((a,b)=>{
                const da=a.time?`${a.date} ${a.time}`:a.date;
                const db=b.time?`${b.date} ${b.time}`:b.date;
                return db.localeCompare(da);
              });

              // Filter pills state lives outside — use a window variable trick via ref pattern
              // We'll use an IIFE-local variable via React state hoisted in CompaniesView
              // Since we can't add state here in an IIFE, we use noteFilter from CompaniesView state
              const filtered = noteFilter==="__company__"
                ? allNotes.filter(n=>n.ownerId==="__company__")
                : noteFilter
                  ? allNotes.filter(n=>n.ownerId===noteFilter)
                  : allNotes;

              const activePerson = noteFilter && noteFilter!=="__company__"
                ? coContacts.find(c=>c.id===noteFilter)
                : null;

              const pillBase = { fontSize:12,fontWeight:700,borderRadius:20,padding:"5px 14px",cursor:"pointer",border:"1.5px solid",transition:"all 0.15s",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap" };
              const pill = (id,label,color,bg) => {
                const active = noteFilter===id||(id===""&&!noteFilter);
                return <button key={id} onClick={()=>setNoteFilter(active?"":id)}
                  style={{...pillBase, background:active?bg:"transparent", color:active?color:"#9298a4", borderColor:active?color:"#e2e4e8" }}>{label}</button>;
              };

              return (
                <div style={{ padding:"24px 28px" }}>

                  {/* ── Person filter pills ── */}
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f2f3f5" }}>
                    {pill("","📋 All","#3a6ea8","rgba(58,110,168,0.1)")}
                    {pill("__company__","🏢 "+currentCo.name,"#3a6ea8","rgba(58,110,168,0.08)")}
                    {coContacts.map(ct=>pill(ct.id,"👤 "+ct.name.split(" ")[0],"#7c6fb0","rgba(124,111,176,0.1)"))}
                  </div>

                  {/* ── Note input for selected scope ── */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11,fontWeight:800,color:"#5a5e68",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8 }}>
                      {activePerson ? `Add note for ${activePerson.name}` : noteFilter==="__company__" ? `Add note for ${currentCo.name}` : "Add Company Note"}
                    </div>
                    {activePerson
                      ? <NotesPanel notes={activePerson.notes||[]} readOnly={!canWrite} onUpdate={updNotes=>{
                          setContacts(prev=>prev.map(c=>String(c.id)===String(activePerson.id)?{...c,notes:updNotes}:c));
                        }}/>
                      : <NotesPanel notes={currentCo.notesList||[]} readOnly={!canWrite} onUpdate={updateCoNotes}/>
                    }
                  </div>

                  {/* ── Timeline ── */}
                  {filtered.length>0 ? (
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                        <div style={{ flex:1,height:1,background:"#e2e4e8" }}/>
                        <span style={{ fontSize:10,fontWeight:800,color:"#9298a4",letterSpacing:"0.08em",textTransform:"uppercase" }}>
                          {filtered.length} note{filtered.length!==1?"s":""}
                          {noteFilter&&noteFilter!=="__company__"&&activePerson?" · "+activePerson.name:noteFilter==="__company__"?" · "+currentCo.name:""}
                        </span>
                        <div style={{ flex:1,height:1,background:"#e2e4e8" }}/>
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                        {filtered.map(n=>(
                          <div key={`${n.source}-${n.id}`} style={{ background:"#fff",borderRadius:12,padding:"13px 16px",border:"1.5px solid #e2e4e8",borderLeft:`3px solid ${n.source==="company"?"#3a6ea8":"#7c6fb0"}` }}>
                            {/* Header — only show in "All" view */}
                            {!noteFilter&&(
                              <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                                <span style={{ fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",
                                  color:n.source==="company"?"#3a6ea8":"#7c6fb0",
                                  background:n.source==="company"?"rgba(58,110,168,0.08)":"rgba(124,111,176,0.08)",
                                  borderRadius:6,padding:"2px 8px" }}>
                                  {n.source==="company"?"🏢 "+currentCo.name:"👤 "+n.sourceName}
                                </span>
                              </div>
                            )}
                            <p style={{ margin:0,fontSize:13,color:"#18191b",lineHeight:1.65,fontFamily:"'DM Sans',sans-serif" }}>{n.text}</p>
                            <div style={{ marginTop:7,fontSize:11,color:"#9298a4" }}>{n.date}{n.time?" · "+n.time:""}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ):(
                    <div style={{ textAlign:"center",padding:"28px 0",color:"#9298a4" }}>
                      <div style={{ fontSize:28,marginBottom:8,opacity:0.4 }}>📝</div>
                      <div style={{ fontSize:13,fontWeight:600 }}>No notes yet</div>
                      <div style={{ fontSize:12,marginTop:4 }}>Add the first note above</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {showAdd&&<Modal title="Add New Company" onClose={()=>setShowAdd(false)}><CompanyForm onSave={addCompany} onClose={()=>setShowAdd(false)} companies={companies}/></Modal>}
      {editCo&&<Modal title="Edit Company" onClose={()=>setEditCo(null)}><CompanyForm initial={editCo} onSave={saveEdit} onClose={()=>setEditCo(null)} companies={companies}/></Modal>}
      {deleteCo&&<Modal title="Delete Company" onClose={()=>setDeleteCo(null)}><p style={{ color:"#18191b",fontSize:15,marginTop:0 }}>Delete <strong>{deleteCo.name}</strong>? Contacts will be unlinked.</p><div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}><button onClick={()=>setDeleteCo(null)} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button><button onClick={doDelete} style={{ padding:"10px 22px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#c0392b,#e74c3c)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700 }}>Delete</button></div></Modal>}
      {showAddCoTask&&<Modal title="New Task" onClose={()=>setShowAddCoTask(false)}><TaskForm contacts={contacts} companies={companies} initial={{companyId:currentCo?.id||""}} currentUser={currentUser} isAdmin={rc.canImpersonate||rc.canManageAllCompanies} onSave={(form)=>{ const now=(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})(); setTasks(prev=>[{...form,id:"t_"+Date.now(),done:false,createdAt:now},...prev]); setShowAddCoTask(false); showToast("Task created"); }} onClose={()=>setShowAddCoTask(false)}/></Modal>}
      {editCoTask&&<Modal title="Edit Task" onClose={()=>setEditCoTask(null)}><TaskForm initial={editCoTask} contacts={contacts} companies={companies} prefs={prefs} currentUser={currentUser} isAdmin={rc.canImpersonate||rc.canManageAllCompanies} onSave={(form)=>{ setTasks(prev=>prev.map(t=>t.id===editCoTask.id?{...t,...form,updatedAt:(()=>{const _d=new Date();return _d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0")+" "+String(_d.getHours()).padStart(2,"0")+":"+String(_d.getMinutes()).padStart(2,"0");})()}:t)); setEditCoTask(null); showToast("Task updated"); }} onClose={()=>setEditCoTask(null)}/></Modal>}
      {deleteCoTaskConfirm&&<Modal title="Delete Task" onClose={()=>setDeleteCoTaskConfirm(null)}><p style={{ color:"#18191b",fontSize:15,marginTop:0 }}>Delete task <strong>"{deleteCoTaskConfirm.title}"</strong>? This cannot be undone.</p><div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}><button onClick={()=>setDeleteCoTaskConfirm(null)} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button><button onClick={()=>{ setTasks(prev=>prev.filter(t=>t.id!==deleteCoTaskConfirm.id)); setDeleteCoTaskConfirm(null); showToast("Task deleted"); }} style={{ padding:"10px 22px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#c0392b,#e74c3c)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700 }}>Delete</button></div></Modal>}
      {coQuickContact&&<ContactQuickView contact={coQuickContact} company={companies.find(c=>c.id===coQuickContact.companyId)} onClose={()=>setCoQuickContact(null)} prefs={prefs}/>}
    </div>
  );
}

// ─── Contacts View ─────────────────────────────────────────────────────────────

function ReportsView({ contacts, companies, tasks, users, currentUser, rc, onViewContact, onViewCompany }) {
  const [period, setPeriod] = React.useState("30");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo]     = React.useState("");
  const [useCustom, setUseCustom]   = React.useState(false);
  const [reportTab, setReportTab] = React.useState("overview");
  const [dormantMonths, setDormantMonths] = React.useState(6);
  const [dormantSort, setDormantSort] = React.useState("longest");
  const [dormantSearch, setDormantSearch] = React.useState("");
  const [dormantCompany, setDormantCompany] = React.useState("all");
  const [selectedOwner, setSelectedOwner] = React.useState(currentUser?.id || "all");
  const [selectedTaskType, setSelectedTaskType] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  const todayStr = TODAY;
  const todayMs  = new Date(todayStr).getTime();
  const msPerDay = 86400000;

  const daysSince = (dateStr) => {
    if (!dateStr) return Infinity;
    return Math.floor((todayMs - new Date(dateStr).getTime()) / msPerDay);
  };

  const lastContactDate = (contact) => {
    const dates = [];
    if (contact.modifiedAt) dates.push(contact.modifiedAt.slice(0,10));
    // Only count tasks that are in the past or today (not future scheduled tasks)
    tasks.filter(t => String(t.contactId) === String(contact.id) && t.dueDate <= TODAY).forEach(t => { if (t.dueDate) dates.push(t.dueDate); });
    (contact.notes||[]).forEach(n => { if (n.date) dates.push(n.date); });
    if (!dates.length) return contact.createdAt ? contact.createdAt.slice(0,10) : null;
    return dates.sort().reverse()[0];
  };

  const dormantLabel = (days) => {
    if (days === Infinity) return "Never contacted";
    const months = Math.floor(days/30);
    if (months >= 12) return `${Math.floor(months/12)}y ${months%12}m ago`;
    return `${months}m ${days%30}d ago`;
  };

  const dormantSeverity = (days) => {
    if (days >= 365) return { color:"#dc2626", bg:"rgba(220,38,38,0.08)", label:"Critical" };
    if (days >= 180) return { color:"#b84c20", bg:"rgba(184,76,32,0.08)", label:"High" };
    if (days >= 90)  return { color:"#b45309", bg:"rgba(180,83,9,0.08)",  label:"Medium" };
    return { color:"#9298a4", bg:"rgba(146,152,164,0.08)", label:"Low" };
  };

  // ── Period-scoped data ───────────────────────────────────────────────────────
  const today = new Date();
  const days = parseInt(period);
  const periodStart = new Date(today); periodStart.setDate(periodStart.getDate() - days);
  const pStr = (useCustom && customFrom) ? customFrom : periodStart.toISOString().slice(0,10);
  const pEnd = (useCustom && customTo)   ? customTo   : todayStr;
  const periodLabel = useCustom && customFrom ? `${customFrom} → ${pEnd}` : `Last ${period} days`;

  // owner-scoped helpers
  const ownerContacts  = selectedOwner === "all" ? contacts : contacts.filter(c => c.ownerId === selectedOwner);
  const ownerCompanies = selectedOwner === "all" ? companies : companies.filter(c => c.ownerId === selectedOwner);
  const ownerContactIds = new Set(ownerContacts.map(c => String(c.id)));
  const ownerTasks     = selectedOwner === "all" ? tasks : tasks.filter(t => ownerContactIds.has(String(t.contactId)) || (selectedOwner !== "all" && companies.find(co=>co.id===t.companyId)?.ownerId===selectedOwner));

  const periodTasks   = ownerTasks.filter(t => t.dueDate >= pStr && t.dueDate <= pEnd);
  const completedInP  = periodTasks.filter(t => t.done);
  const completionPct = periodTasks.length ? Math.round((completedInP.length / periodTasks.length) * 100) : 0;
  const overdueCount  = ownerTasks.filter(t => !t.done && t.dueDate < todayStr).length;
  const pendingCount  = ownerTasks.filter(t => !t.done && t.dueDate >= todayStr).length;
  const totalNotes    = ownerContacts.reduce((s,c) => s + (c.notes||[]).length, 0)
                      + ownerCompanies.reduce((s,c) => s + (c.notesList||[]).length, 0);

  // ── Dormant leads ────────────────────────────────────────────────────────────
  const leads = ownerContacts.filter(c => c.status === "lead");
  const thresholdDays = dormantMonths * 30;
  const dormantLeads = leads.filter(c => daysSince(lastContactDate(c)) >= thresholdDays);
  const filteredDormant = dormantLeads
    .filter(c => {
      const co = companies.find(x => x.id === c.companyId);
      const matchSearch = !dormantSearch || c.name.toLowerCase().includes(dormantSearch.toLowerCase()) || (co?.name||"").toLowerCase().includes(dormantSearch.toLowerCase());
      const matchCompany = dormantCompany === "all" || c.companyId === dormantCompany;
      return matchSearch && matchCompany;
    })
    .sort((a, b) => {
      if (dormantSort === "longest") return daysSince(lastContactDate(a)) > daysSince(lastContactDate(b)) ? -1 : 1;
      if (dormantSort === "name")    return a.name.localeCompare(b.name);
      if (dormantSort === "company") return (companies.find(x=>x.id===a.companyId)?.name||"").localeCompare(companies.find(x=>x.id===b.companyId)?.name||"");
      return 0;
    });

  // ── Team stats ───────────────────────────────────────────────────────────────
  const userStats = users.map(u => {
    const uContacts  = contacts.filter(c => c.ownerId === u.id);
    const uTasks     = periodTasks.filter(t => { const ct = contacts.find(c => String(c.id) === String(t.contactId)); return ct?.ownerId === u.id; });
    const uCompleted = uTasks.filter(t => t.done);
    const allUTasks = tasks.filter(t => { const ct = contacts.find(c => String(c.id) === String(t.contactId)); return ct?.ownerId === u.id; });
    const uTypeBreakdown = TASK_TYPES.map(type => ({
      type,
      total:     allUTasks.filter(t=>t.type===type).length,
      completed: allUTasks.filter(t=>t.type===type&&t.done).length,
    }));
    return { ...u, contacts: uContacts.length, companies: companies.filter(c=>c.ownerId===u.id).length,
      tasks: uTasks.length, completed: uCompleted.length,
      pct: uTasks.length ? Math.round((uCompleted.length/uTasks.length)*100) : 0,
      dormant: uContacts.filter(c=>c.status==="lead"&&daysSince(lastContactDate(c))>=90).length,
      typeBreakdown: uTypeBreakdown, totalTasks: allUTasks.length };
  }).sort((a,b)=>b.completed-a.completed);

  // ── Type breakdown ───────────────────────────────────────────────────────────
  const typeStats = TASK_TYPES.map(type => ({
    type, total:ownerTasks.filter(t=>t.type===type).length, done:ownerTasks.filter(t=>t.type===type&&t.done).length,
  })).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);

  // ── Company stats ────────────────────────────────────────────────────────────
  const companyStats = ownerCompanies.map(c => {
    const cTasks = tasks.filter(t=>t.companyId===c.id);
    const cContacts = contacts.filter(ct=>ct.companyId===c.id);
    const lastTouch = cContacts.reduce((best,ct)=>{ const d=lastContactDate(ct); return d&&d>best?d:best; },"");
    return { ...c, taskCount:cTasks.length, completed:cTasks.filter(t=>t.done).length, open:cTasks.filter(t=>!t.done).length,
      contactCount:cContacts.length, owner:users.find(u=>u.id===c.ownerId), lastTouch,
      dormant:cContacts.filter(ct=>ct.status==="lead"&&daysSince(lastContactDate(ct))>=90).length };
  }).sort((a,b)=>b.taskCount-a.taskCount).slice(0,8);

  // ── Monthly trend ────────────────────────────────────────────────────────────
  const monthlyData = Array.from({length:6},(_,i)=>{
    const d=new Date(today); d.setMonth(d.getMonth()-(5-i));
    const mStr=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const mTasks=ownerTasks.filter(t=>t.dueDate.startsWith(mStr));
    return { label:d.toLocaleString("default",{month:"short"}), total:mTasks.length, done:mTasks.filter(t=>t.done).length };
  });
  const maxMonthly = Math.max(...monthlyData.map(m=>m.total),1);

  const activeC=ownerContacts.filter(c=>c.status==="active").length;
  const leadC=ownerContacts.filter(c=>c.status==="lead").length;
  const inactiveC=ownerContacts.filter(c=>c.status==="inactive").length;
  const totalC=ownerContacts.length||1;

  const card = { background:"#fff",borderRadius:16,border:"1.5px solid #e2e4e8",padding:"20px 24px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)" };
  const secTitle = (t) => <div style={{ fontSize:11,fontWeight:800,color:"#9298a4",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14 }}>{t}</div>;
  const tabBtn = (id,label) => (
    <button onClick={()=>setReportTab(id)} style={{ padding:"8px 18px",border:"none",background:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:reportTab===id?"#3a6ea8":"#5a5e68",borderBottom:reportTab===id?"2.5px solid #3a6ea8":"2.5px solid transparent",transition:"color 0.15s" }}>{label}</button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:22,color:"#18191b",fontWeight:700 }}>Reports & Analytics</h2>
          <p style={{ margin:"4px 0 0",fontSize:13,color:"#9298a4" }}>Performance overview across your CRM data</p>
        </div>
        {reportTab!=="dormant"&&(
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <span style={{ fontSize:12,fontWeight:700,color:"#5a5e68",flexShrink:0 }}>Period:</span>
            {[["7","7d"],["30","30d"],["90","90d"]].map(([v,l])=>(
              <button key={v} onClick={()=>{ setPeriod(v); setUseCustom(false); }}
                style={{ padding:"6px 14px",borderRadius:20,border:"1.5px solid",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                  borderColor:(!useCustom&&period===v)?"#3a6ea8":"#e2e4e8",
                  background:(!useCustom&&period===v)?"rgba(58,110,168,0.1)":"transparent",
                  color:(!useCustom&&period===v)?"#3a6ea8":"#5a5e68" }}>{l}</button>
            ))}
            <div style={{ display:"flex",alignItems:"center",gap:6,marginLeft:4,padding:"4px 10px",borderRadius:20,border:`1.5px solid ${useCustom?"#3a6ea8":"#e2e4e8"}`,background:useCustom?"rgba(58,110,168,0.06)":"transparent" }}>
              <span style={{ fontSize:11,fontWeight:700,color:useCustom?"#3a6ea8":"#9298a4",flexShrink:0 }}>Custom:</span>
              <input type="date" value={customFrom} max={customTo||todayStr}
                onChange={e=>{ setCustomFrom(e.target.value); setUseCustom(true); }}
                style={{ border:"none",background:"transparent",fontSize:12,color:"#18191b",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",outline:"none",width:130 }}/>
              <span style={{ fontSize:11,color:"#9298a4" }}>→</span>
              <input type="date" value={customTo} min={customFrom} max={todayStr}
                onChange={e=>{ setCustomTo(e.target.value); setUseCustom(true); }}
                style={{ border:"none",background:"transparent",fontSize:12,color:"#18191b",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",outline:"none",width:130 }}/>
              {useCustom&&<button onClick={()=>{ setUseCustom(false); setCustomFrom(""); setCustomTo(""); }}
                style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#9298a4",padding:"0 2px",lineHeight:1 }}>✕</button>}
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ borderBottom:"1.5px solid #e2e4e8",marginBottom:20,display:"flex",gap:2 }}>
        {tabBtn("overview","Overview")}
        {tabBtn("dormant","🕐 Dormant Leads")}
        {tabBtn("team","Team Performance")}
      </div>

      {/* ── Owner filter (shared across all tabs) ── */}
      <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:18,padding:"10px 14px",background:"#f7f8fa",borderRadius:12,border:"1px solid #e2e4e8" }}>
        <span style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",flexShrink:0,marginRight:4 }}>Owner:</span>
        {[{id:"all",label:"All"},...users.map(u=>({id:u.id,label:u.name.split(" ")[0],avatar:u.avatar,isMe:u.id===currentUser?.id,role:u.role}))].map(opt=>{
          const active = selectedOwner===opt.id;
          const rc2 = opt.role ? ROLE_CONFIG[opt.role] : null;
          return (
            <button key={opt.id} onClick={()=>setSelectedOwner(opt.id)}
              style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"5px 14px",borderRadius:20,border:"1.5px solid",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                borderColor:active?"#3a6ea8":"#e2e4e8",
                background:active?"#3a6ea8":"#fff",
                color:active?"#fff":opt.isMe?"#3a6ea8":"#5a5e68",
                boxShadow:active?"0 2px 8px rgba(58,110,168,0.2)":"none" }}>
              {opt.avatar&&!active&&<span style={{ fontSize:11 }}>{opt.avatar}</span>}
              {opt.label}
              {opt.isMe&&!active&&<span style={{ fontSize:10,color:"#3a6ea8",fontWeight:600 }}> (you)</span>}
            </button>
          );
        })}
        {selectedOwner!=="all"&&(
          <button onClick={()=>setSelectedOwner("all")} style={{ marginLeft:"auto",fontSize:11,color:"#9298a4",background:"none",border:"none",cursor:"pointer",fontWeight:700,padding:"4px 8px" }}>✕ Clear</button>
        )}
        {selectedOwner!=="all"&&(
          <span style={{ fontSize:11,color:"#5a5e68",fontStyle:"italic" }}>
            Showing data for <strong style={{ color:"#3a6ea8" }}>{users.find(u=>u.id===selectedOwner)?.name}</strong>
          </span>
        )}
      </div>

      {/* ── OVERVIEW ── */}
      {reportTab==="overview"&&(
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18 }}>
            {[
              { label:"Total Companies", value:ownerCompanies.length,  icon:"🏢", color:"#3a6ea8", bg:"rgba(58,110,168,0.07)"  },
              { label:"Total Contacts",  value:ownerContacts.length,   icon:"👤", color:"#27924a", bg:"rgba(39,146,74,0.07)"   },
              { label:"All Tasks",       value:ownerTasks.length,      icon:"✅", color:"#7c6fb0", bg:"rgba(124,111,176,0.07)" },
              { label:"Total Notes",     value:totalNotes,             icon:"📝", color:"#0891b2", bg:"rgba(8,145,178,0.07)"   },
              { label:"Overdue",         value:overdueCount,           icon:"🚨", color:"#dc2626", bg:"rgba(220,38,38,0.07)"   },
            ].map(s=>(
              <div key={s.label} style={{ background:s.bg,borderRadius:14,padding:"16px 18px",border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:22,marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:26,fontWeight:800,color:s.color,fontFamily:"'Playfair Display',serif",lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11,color:s.color,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginTop:5,opacity:0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
            <div style={card}>
              {secTitle("Monthly Task Volume")}
              <div style={{ display:"flex",alignItems:"flex-end",gap:8,height:130,paddingBottom:4 }}>
                {monthlyData.map((m,i)=>(
                  <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                    <span style={{ fontSize:11,color:"#9298a4",fontWeight:700 }}>{m.total||""}</span>
                    <div style={{ width:"100%",background:"#e2e4e8",borderRadius:8,position:"relative" }}>
                      <div style={{ height:`${Math.round((m.total/maxMonthly)*110)}px`,minHeight:4,background:"#e2e4e8",borderRadius:8,position:"relative" }}>
                        <div style={{ position:"absolute",bottom:0,left:0,right:0,height:m.total>0?`${Math.round((m.done/m.total)*100)}%`:"0%",background:"linear-gradient(180deg,#4a84c0,#3a6ea8)",borderRadius:8 }}/>
                      </div>
                    </div>
                    <span style={{ fontSize:11,color:"#9298a4",fontWeight:600 }}>{m.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",gap:16,marginTop:8,paddingTop:10,borderTop:"1px solid #f2f3f5" }}>
                <span style={{ fontSize:11,color:"#9298a4",display:"flex",alignItems:"center",gap:4 }}><span style={{ width:10,height:10,borderRadius:2,background:"#3a6ea8",display:"inline-block" }}/> Completed</span>
                <span style={{ fontSize:11,color:"#9298a4",display:"flex",alignItems:"center",gap:4 }}><span style={{ width:10,height:10,borderRadius:2,background:"#e2e4e8",display:"inline-block" }}/> Total</span>
              </div>
            </div>
            <div style={card}>
              {secTitle(`Completion Rate · ${periodLabel}`)}
              <div style={{ display:"flex",alignItems:"center",gap:24,marginBottom:20 }}>
                <div style={{ position:"relative",width:100,height:100,flexShrink:0 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f2f3f5" strokeWidth="12"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={completionPct>=80?"#27924a":completionPct>=50?"#3a6ea8":"#dc2626"} strokeWidth="12"
                      strokeDasharray={`${completionPct*2.513} 251.3`} strokeDashoffset="62.83" strokeLinecap="round"
                      style={{ transform:"rotate(-90deg)",transformOrigin:"50px 50px" }}/>
                  </svg>
                  <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                    <span style={{ fontSize:20,fontWeight:800,color:"#18191b",lineHeight:1 }}>{completionPct}%</span>
                    <span style={{ fontSize:9,color:"#9298a4",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>done</span>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,color:"#5a5e68",marginBottom:4 }}><strong style={{ color:"#18191b" }}>{completedInP.length}</strong> of <strong style={{ color:"#18191b" }}>{periodTasks.length}</strong> tasks completed</div>
                  <div style={{ fontSize:12,color:"#9298a4" }}>in last {period} days</div>
                  {overdueCount>0&&<div style={{ marginTop:8,fontSize:12,color:"#dc2626",fontWeight:700 }}>⚠ {overdueCount} overdue</div>}
                </div>
              </div>
              {secTitle("Tasks by Type")}
              <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                {typeStats.slice(0,5).map((x,i)=>{
                  const colors=["#3a6ea8","#4a9b8e","#7c6fb0","#27924a","#b84c20"];
                  return (
                    <div key={x.type} style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:11,color:"#5a5e68",width:100,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{TYPE_ICONS[x.type]} {x.type}</span>
                      <div style={{ flex:1,height:7,borderRadius:4,background:"#f2f3f5",overflow:"hidden" }}>
                        <div style={{ height:"100%",borderRadius:4,background:colors[i],width:`${Math.round((x.total/tasks.length||1)*100)}%`,transition:"width 0.4s" }}/>
                      </div>
                      <span style={{ fontSize:12,fontWeight:700,color:"#9298a4",minWidth:24,textAlign:"right" }}>{x.total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Companies by Task Category ── */}
          {(()=>{
            const typeColors = {"Follow-up Call":"#3a6ea8","Reminder":"#4a9b8e","Meeting":"#7c6fb0","Email":"#27924a","Proposal":"#b84c20","Other":"#64748b"};

            // Build per-company task data
            const coRows = ownerCompanies.map(co => {
              const coContactIds = new Set(ownerContacts.filter(c=>c.companyId===co.id).map(c=>String(c.id)));
              const coTasks = ownerTasks.filter(t => t.companyId===co.id || coContactIds.has(String(t.contactId)));
              const byType = TASK_TYPES.reduce((acc,type)=>{ acc[type]=coTasks.filter(t=>t.type===type).length; return acc; },{});
              return { co, byType, total:coTasks.length, done:coTasks.filter(t=>t.done).length };
            }).filter(r => selectedTaskType==="all" ? r.total>0 : r.byType[selectedTaskType]>0)
              .sort((a,b) => selectedTaskType==="all" ? b.total-a.total : b.byType[selectedTaskType]-a.byType[selectedTaskType]);

            const activeColor = selectedTaskType!=="all" ? typeColors[selectedTaskType] : "#3a6ea8";
            const maxVal = Math.max(...coRows.map(r => selectedTaskType==="all" ? r.total : r.byType[selectedTaskType]), 1);

            return (
              <div style={{ ...card, padding:0, overflow:"hidden" }}>
                {/* Header + type filter pills */}
                <div style={{ padding:"14px 20px", borderBottom:"1px solid #e2e4e8" }}>
                  <div style={{ fontSize:11,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12 }}>Companies by Task Type</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {["all",...TASK_TYPES].map(type=>{
                      const active = selectedTaskType===type;
                      const color  = type==="all" ? "#5a5e68" : typeColors[type];
                      const count  = type==="all"
                        ? ownerCompanies.filter(co=>{ const ids=new Set(ownerContacts.filter(c=>c.companyId===co.id).map(c=>String(c.id))); return ownerTasks.some(t=>t.companyId===co.id||ids.has(String(t.contactId))); }).length
                        : ownerCompanies.filter(co=>{ const ids=new Set(ownerContacts.filter(c=>c.companyId===co.id).map(c=>String(c.id))); return ownerTasks.some(t=>(t.companyId===co.id||ids.has(String(t.contactId)))&&t.type===type); }).length;
                      return (
                        <button key={type} onClick={()=>setSelectedTaskType(type)}
                          style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:20,border:`1.5px solid ${active?color:"#e2e4e8"}`,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                            background:active?color:"#fff", color:active?"#fff":color,
                            boxShadow:active?`0 2px 8px ${color}40`:"none" }}>
                          {type!=="all"&&<span>{TYPE_ICONS[type]}</span>}
                          {type==="all"?"All":type}
                          <span style={{ fontSize:10,opacity:0.8,fontWeight:600 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 200px 64px 64px",gap:0,padding:"8px 20px",background:"#f7f8fa",borderBottom:"1px solid #e2e4e8" }}>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em" }}>Company</div>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em" }}>{selectedTaskType==="all"?"All Tasks":selectedTaskType}</div>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"center" }}>Total</div>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"center" }}>Done</div>
                </div>

                {/* Rows */}
                {coRows.length===0
                  ? <div style={{ padding:"28px",textAlign:"center",color:"#9298a4",fontSize:13,fontStyle:"italic" }}>No companies with {selectedTaskType} tasks</div>
                  : coRows.map((r,ri)=>{
                    const val     = selectedTaskType==="all" ? r.total : r.byType[selectedTaskType];
                    const doneVal = selectedTaskType==="all" ? r.done  : ownerTasks.filter(t=>(t.companyId===r.co.id||new Set(ownerContacts.filter(c=>c.companyId===r.co.id).map(c=>String(c.id))).has(String(t.contactId)))&&t.type===selectedTaskType&&t.done).length;
                    const donePct = val>0 ? Math.round((doneVal/val)*100) : 0;
                    return (
                      <div key={r.co.id} style={{ display:"grid",gridTemplateColumns:"1fr 200px 64px 64px",gap:0,padding:"10px 20px",borderBottom:ri<coRows.length-1?"1px solid #f2f3f5":"none",alignItems:"center",background:"#fff",transition:"background 0.1s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
                          <CompanyLogo name={r.co.name} website={r.co.website} size={26}/>
                          <span onClick={()=>onViewCompany&&onViewCompany(r.co.id)} style={{ fontSize:12,fontWeight:700,color:"#3a6ea8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",borderBottom:"1px solid rgba(58,110,168,0.25)" }}>{r.co.name}</span>
                        </div>
                        <div style={{ display:"flex",alignItems:"center",gap:8,paddingRight:12 }}>
                          <div style={{ flex:1,height:8,borderRadius:4,background:"#e2e4e8",overflow:"hidden" }}>
                            <div style={{ height:"100%",borderRadius:4,background:activeColor,width:`${donePct}%`,transition:"width 0.4s" }}/>
                          </div>
                          <span style={{ fontSize:11,color:"#9298a4",minWidth:32,textAlign:"right" }}>{doneVal}/{val}</span>
                        </div>
                        <div style={{ fontSize:13,fontWeight:800,color:"#18191b",textAlign:"center" }}>{r.total}</div>
                        <div style={{ fontSize:13,fontWeight:700,color:"#27924a",textAlign:"center" }}>{r.done}</div>
                      </div>
                    );
                  })
                }
              </div>
            );
          })()}

          {/* ── Contacts by Status ── */}
          {(()=>{
            const STATUSES = [
              { key:"active",   label:"Active",   color:"#27924a", bg:"rgba(39,146,74,0.08)"   },
              { key:"lead",     label:"Lead",     color:"#3a6ea8", bg:"rgba(58,110,168,0.08)"  },
              { key:"inactive", label:"Inactive", color:"#9298a4", bg:"rgba(146,152,164,0.08)" },
            ];

            const filtered = selectedStatus==="all"
              ? ownerContacts
              : ownerContacts.filter(c=>c.status===selectedStatus);
            const sorted = [...filtered].sort((a,b)=>a.name.localeCompare(b.name));
            const maxCount = Math.max(...STATUSES.map(s=>ownerContacts.filter(c=>c.status===s.key).length),1);

            return (
              <div style={{ ...card, padding:0, overflow:"hidden", marginTop:14 }}>
                {/* Header + status filter pills */}
                <div style={{ padding:"14px 20px", borderBottom:"1px solid #e2e4e8" }}>
                  <div style={{ fontSize:11,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12 }}>Contacts by Status</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {[{key:"all",label:"All",color:"#5a5e68"},...STATUSES].map(s=>{
                      const cnt = s.key==="all" ? ownerContacts.length : ownerContacts.filter(c=>c.status===s.key).length;
                      const active = selectedStatus===s.key;
                      return (
                        <button key={s.key} onClick={()=>setSelectedStatus(s.key)}
                          style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:20,border:`1.5px solid ${active?s.color:"#e2e4e8"}`,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",
                            background:active?s.color:"#fff", color:active?"#fff":s.color,
                            boxShadow:active?`0 2px 8px ${s.color}40`:"none" }}>
                          {s.label}
                          <span style={{ fontSize:10,opacity:0.8,fontWeight:600 }}>({cnt})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 160px 200px 64px",gap:0,padding:"8px 20px",background:"#f7f8fa",borderBottom:"1px solid #e2e4e8" }}>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em" }}>Contact</div>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em" }}>Company</div>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em" }}>
                    {selectedStatus==="all" ? "Status distribution" : selectedStatus.charAt(0).toUpperCase()+selectedStatus.slice(1)+" volume"}
                  </div>
                  <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"center" }}>Tasks</div>
                </div>

                {/* Rows */}
                {sorted.length===0
                  ? <div style={{ padding:"28px",textAlign:"center",color:"#9298a4",fontSize:13,fontStyle:"italic" }}>No contacts with {selectedStatus} status</div>
                  : sorted.map((c,ci)=>{
                    const co = companies.find(x=>x.id===c.companyId);
                    const st = STATUSES.find(s=>s.key===c.status)||STATUSES[2];
                    const cTasks = ownerTasks.filter(t=>String(t.contactId)===String(c.id));
                    const doneTasks = cTasks.filter(t=>t.done).length;
                    const donePct = cTasks.length>0 ? Math.round((doneTasks/cTasks.length)*100) : 0;
                    // bar: for "all" mode show bar sized by count-of-same-status; for filtered show task completion
                    const barColor = selectedStatus==="all" ? st.color : st.color;
                    return (
                      <div key={c.id} style={{ display:"grid",gridTemplateColumns:"1fr 160px 200px 64px",gap:0,padding:"10px 20px",borderBottom:ci<sorted.length-1?"1px solid #f2f3f5":"none",alignItems:"center",background:"#fff",transition:"background 0.1s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        {/* Contact */}
                        <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
                          <Avatar initials={c.avatar} size={28}/>
                          <div style={{ minWidth:0 }}>
                            <div onClick={()=>onViewCompany&&c.companyId&&onViewCompany(c.companyId)} style={{ fontSize:12,fontWeight:700,color:"#3a6ea8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:c.companyId?"pointer":"default",borderBottom:c.companyId?"1px solid rgba(58,110,168,0.25)":"none" }}>{c.name}</div>
                            {c.title&&<div style={{ fontSize:10,color:"#9298a4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.title}</div>}
                          </div>
                        </div>
                        {/* Company */}
                        <div style={{ minWidth:0 }}>
                          {co
                            ? <span onClick={()=>onViewCompany&&onViewCompany(co.id)} style={{ fontSize:12,fontWeight:600,color:"#3a6ea8",cursor:"pointer",borderBottom:"1px solid rgba(58,110,168,0.2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block",maxWidth:140 }}>🏢 {co.name}</span>
                            : <span style={{ fontSize:11,color:"#9298a4",fontStyle:"italic" }}>—</span>}
                        </div>
                        {/* Bar: task completion progress */}
                        <div style={{ display:"flex",alignItems:"center",gap:8,paddingRight:12 }}>
                          <span style={{ fontSize:10,fontWeight:700,color:st.color,background:st.bg,borderRadius:20,padding:"2px 8px",flexShrink:0 }}>{st.label}</span>
                          <div style={{ flex:1,height:7,borderRadius:4,background:"#e2e4e8",overflow:"hidden" }}>
                            <div style={{ height:"100%",borderRadius:4,background:barColor,width:`${donePct}%`,transition:"width 0.4s" }}/>
                          </div>
                          <span style={{ fontSize:10,color:"#9298a4",minWidth:28,textAlign:"right",flexShrink:0 }}>{doneTasks}/{cTasks.length}</span>
                        </div>
                        {/* Task count */}
                        <div style={{ fontSize:13,fontWeight:700,color:cTasks.filter(t=>!t.done).length>0?"#b84c20":"#9298a4",textAlign:"center" }}>
                          {cTasks.filter(t=>!t.done).length>0?cTasks.filter(t=>!t.done).length:"—"}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            );
          })()}
        </div>
      )}

      {/* ── DORMANT LEADS ── */}
      {reportTab==="dormant"&&(
        <div>
          {/* Threshold pills */}
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap" }}>
            <span style={{ fontSize:13,fontWeight:700,color:"#5a5e68" }}>Show leads not contacted for:</span>
            <div style={{ display:"flex",gap:6 }}>
              {[3,6,9,12].map(m=>(
                <button key={m} onClick={()=>setDormantMonths(m)}
                  style={{ padding:"7px 18px",borderRadius:8,border:`1.5px solid ${dormantMonths===m?"#3a6ea8":"#e2e4e8"}`,background:dormantMonths===m?"#3a6ea8":"#fff",color:dormantMonths===m?"#fff":"#5a5e68",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,transition:"all 0.15s" }}>
                  {m}m+
                </button>
              ))}
            </div>
            <span style={{ marginLeft:"auto",fontSize:12,color:"#9298a4",fontWeight:600 }}>{filteredDormant.length} of {leads.length} leads match</span>
          </div>

          {/* Summary cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24 }}>
            {[3,6,9,12].map(m=>{
              const cnt=leads.filter(c=>daysSince(lastContactDate(c))>=m*30).length;
              const sev=m>=9?{color:"#dc2626",bg:"rgba(220,38,38,0.07)"}:m>=6?{color:"#b84c20",bg:"rgba(184,76,32,0.07)"}:{color:"#b45309",bg:"rgba(180,83,9,0.07)"};
              return (
                <div key={m} onClick={()=>setDormantMonths(m)} style={{ background:dormantMonths===m?"#3a6ea8":sev.bg,borderRadius:12,padding:"14px 18px",border:`1.5px solid ${dormantMonths===m?"#3a6ea8":"transparent"}`,cursor:"pointer",transition:"all 0.15s" }}>
                  <div style={{ fontSize:24,fontWeight:800,color:dormantMonths===m?"#fff":sev.color,fontFamily:"'Playfair Display',serif" }}>{cnt}</div>
                  <div style={{ fontSize:12,fontWeight:700,color:dormantMonths===m?"rgba(255,255,255,0.85)":sev.color,marginTop:2 }}>{m}+ months dormant</div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap" }}>
            <div style={{ position:"relative",flex:1,minWidth:180 }}>
              <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#9298a4",fontSize:13 }}>🔍</span>
              <input value={dormantSearch} onChange={e=>setDormantSearch(e.target.value)} placeholder="Search name or company..."
                style={{ width:"100%",padding:"9px 12px 9px 32px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" }}/>
            </div>
            <select value={dormantCompany} onChange={e=>setDormantCompany(e.target.value)}
              style={{ padding:"9px 14px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer" }}>
              <option value="all">All Companies</option>
              {companies.map(co=><option key={co.id} value={co.id}>{co.name}</option>)}
            </select>
            <select value={dormantSort} onChange={e=>setDormantSort(e.target.value)}
              style={{ padding:"9px 14px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer" }}>
              <option value="longest">Sort: Longest dormant</option>
              <option value="name">Sort: Name</option>
              <option value="company">Sort: Company</option>
            </select>
          </div>

          {/* Lead list */}
          {filteredDormant.length===0
            ? <div style={{ textAlign:"center",padding:"52px 0",background:"#fff",borderRadius:16,border:"1px solid #e2e4e8" }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🌿</div>
                <div style={{ fontWeight:700,color:"#18191b",fontSize:15,marginBottom:4 }}>No dormant leads found</div>
                <div style={{ fontSize:13,color:"#9298a4" }}>All leads contacted within {dormantMonths} months</div>
              </div>
            : <div style={{ background:"#fff",borderRadius:16,border:"1px solid #e2e4e8",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 160px 120px 110px 100px",gap:0,padding:"10px 18px",background:"#f7f8fa",borderBottom:"1px solid #e2e4e8" }}>
                  {["Contact","Company","Last Contact","Dormant","Severity"].map(h=>(
                    <div key={h} style={{ fontSize:11,fontWeight:800,color:"#5a5e68",textTransform:"uppercase",letterSpacing:"0.07em" }}>{h}</div>
                  ))}
                </div>
                {filteredDormant.map((c,i)=>{
                  const co=companies.find(x=>x.id===c.companyId);
                  const lcd=lastContactDate(c);
                  const ds=daysSince(lcd);
                  const sev=dormantSeverity(ds);
                  return (
                    <div key={c.id} style={{ display:"grid",gridTemplateColumns:"1fr 160px 120px 110px 100px",gap:0,padding:"13px 18px",borderBottom:i<filteredDormant.length-1?"1px solid #f2f3f5":"none",alignItems:"center",cursor:"default",background:"#fff",transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f7f8fa"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <Avatar initials={c.avatar} size={36}/>
                        <div>
                          <div style={{ fontWeight:700,fontSize:13,color:"#3a6ea8",cursor:"pointer",fontFamily:"'Playfair Display',serif",borderBottom:"1px solid rgba(58,110,168,0.25)" }}
                            onClick={()=>onViewContact&&onViewContact(c.id)}>{c.name}</div>
                          <div style={{ fontSize:11,color:"#9298a4",marginTop:1 }}>{c.title||""}</div>
                        </div>
                      </div>
                      <div>{co?<span onClick={()=>onViewCompany&&onViewCompany(co.id)} style={{ fontSize:12,fontWeight:600,color:"#3a6ea8",cursor:"pointer",borderBottom:"1px solid rgba(58,110,168,0.2)" }}>🏢 {co.name}</span>:<span style={{ fontSize:12,color:"#9298a4",fontStyle:"italic" }}>No company</span>}</div>
                      <div style={{ fontSize:12,color:"#5a5e68",fontWeight:500 }}>{lcd?formatDate(lcd):"—"}</div>
                      <div style={{ fontSize:12,fontWeight:700,color:sev.color }}>{dormantLabel(ds)}</div>
                      <div><span style={{ fontSize:11,fontWeight:700,color:sev.color,background:sev.bg,borderRadius:6,padding:"3px 10px" }}>{sev.label}</span></div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ── TEAM ── */}
      {reportTab==="team"&&(
        <div>

          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {userStats.filter(u=>selectedOwner==="all"||u.id===selectedOwner).map((u,i)=>{
              const rc2=ROLE_CONFIG[u.role];
              return (
                <div key={u.id} style={{ ...card,padding:"18px 22px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:16 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,minWidth:200 }}>
                      <div style={{ width:40,height:40,borderRadius:"50%",background:rc2?.color||"#94a3b8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0 }}>{u.avatar}</div>
                      <div>
                        <div style={{ fontSize:14,fontWeight:700,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>{u.name}</div>
                        <div style={{ fontSize:11,color:rc2?.color||"#9298a4",fontWeight:700,background:rc2?.bg,borderRadius:20,padding:"2px 8px",display:"inline-block",marginTop:2 }}>{rc2?.label||u.role}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:24,flex:1,flexWrap:"wrap" }}>
                      {[{label:"Companies",value:u.companies,color:"#3a6ea8"},{label:"Contacts",value:u.contacts,color:"#27924a"},{label:"Tasks",value:u.tasks,color:"#7c6fb0"},{label:"Completed",value:u.completed,color:"#27924a"},{label:"Dormant",value:u.dormant,color:u.dormant>0?"#dc2626":"#9298a4"}].map(s=>(
                        <div key={s.label} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:18,fontWeight:800,color:s.color,fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                          <div style={{ fontSize:10,color:"#9298a4",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ minWidth:140 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                        <span style={{ fontSize:11,color:"#5a5e68",fontWeight:700 }}>Completion</span>
                        <span style={{ fontSize:12,fontWeight:800,color:u.pct>=80?"#27924a":u.pct>=50?"#3a6ea8":"#dc2626" }}>{u.pct}%</span>
                      </div>
                      <div style={{ height:8,borderRadius:4,background:"#f2f3f5" }}>
                        <div style={{ height:"100%",borderRadius:4,background:u.pct>=80?"#27924a":u.pct>=50?"#3a6ea8":"#dc2626",width:`${u.pct}%`,transition:"width 0.5s" }}/>
                      </div>
                    </div>
                    {i<3&&<span style={{ fontSize:22,flexShrink:0 }}>{i===0?"🥇":i===1?"🥈":"🥉"}</span>}
                  </div>
                  {/* Task type breakdown — all types */}
                  <div style={{ marginTop:14,paddingTop:14,borderTop:"1px solid #f2f3f5" }}>
                    <div style={{ fontSize:10,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Tasks by Type (all time)</div>
                    {/* Header row */}
                    <div style={{ display:"grid",gridTemplateColumns:"24px 1fr 80px 80px 60px 120px",gap:8,padding:"0 4px 6px",borderBottom:"1px solid #f2f3f5",marginBottom:6 }}>
                      {["","Type","Total","Done","%","Progress"].map((h,i)=>(
                        <div key={i} style={{ fontSize:10,fontWeight:800,color:"#c0c8d4",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:i>=2?"center":"left" }}>{h}</div>
                      ))}
                    </div>
                    {(()=>{
                      const maxTotal = Math.max(...u.typeBreakdown.map(x=>x.total), 1);
                      const colors   = ["#3a6ea8","#4a9b8e","#7c6fb0","#27924a","#b84c20","#64748b"];
                      return u.typeBreakdown.map((x,ti)=>{
                        const pct = x.total>0 ? Math.round((x.completed/x.total)*100) : 0;
                        const donePx = pct;
                        const color  = colors[ti%colors.length];
                        return (
                          <div key={x.type} style={{ display:"grid",gridTemplateColumns:"24px 1fr 80px 80px 60px 120px",gap:8,padding:"6px 4px",borderBottom:"1px solid #f7f8fa",alignItems:"center",opacity:x.total===0?0.35:1 }}>
                            <span style={{ fontSize:13 }}>{TYPE_ICONS[x.type]||"📌"}</span>
                            <span style={{ fontSize:12,color:"#18191b",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{x.type}</span>
                            <span style={{ fontSize:13,fontWeight:700,color:"#18191b",textAlign:"center" }}>{x.total}</span>
                            <span style={{ fontSize:13,fontWeight:700,color:"#27924a",textAlign:"center" }}>{x.completed}</span>
                            <span style={{ fontSize:12,fontWeight:800,textAlign:"center",color:pct>=80?"#27924a":pct>=50?"#3a6ea8":x.total>0?"#dc2626":"#c0c8d4" }}>{x.total>0?`${pct}%`:"—"}</span>
                            {/* Progress: filled=done%, greyed=remaining% */}
                            <div style={{ height:7,borderRadius:4,background:"#e2e4e8",overflow:"hidden" }}>
                              <div style={{ height:"100%",borderRadius:4,background:color,width:`${donePx}%`,transition:"width 0.4s" }}/>
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div style={{ marginTop:8,paddingTop:8,borderTop:"1px solid #f2f3f5",display:"flex",justifyContent:"flex-end",gap:20 }}>
                      <span style={{ fontSize:11,color:"#9298a4" }}>Total: <strong style={{ color:"#18191b" }}>{u.totalTasks}</strong></span>
                      <span style={{ fontSize:11,color:"#9298a4" }}>Completed: <strong style={{ color:"#27924a" }}>{u.typeBreakdown.reduce((s,x)=>s+x.completed,0)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}

function SettingsView({ currentUser, users, setUsers, roleConfig, setRoleConfig, showToast, prefs, setPrefs, companies=[], contacts=[], tasks=[], setCompanies, setContacts, setTasks }) {
  const [activeSection, setActiveSection] = useState("users");
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [resetNewPass, setResetNewPass] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  // Role panel state (hoisted from IIFE to avoid hook-in-callback error)
  const [newRole, setNewRole] = useState({ key:"", label:"", color:"#3a6ea8", perms:{} });
  const [creating, setCreating] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [resetConfirm, setResetConfirm] = useState("");

  const lbl = { fontSize:11,fontWeight:700,letterSpacing:"0.09em",color:"#5a5e68",textTransform:"uppercase",marginBottom:5,display:"block",fontFamily:"'DM Sans',sans-serif" };
  const inp = { width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"#ffffff",fontSize:14,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:14 };

  const sideBtn = (id, icon, label) => (
    <button onClick={()=>setActiveSection(id)} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",borderRadius:10,border:"none",background:activeSection===id?"linear-gradient(135deg,rgba(63,126,202,0.15),rgba(232,162,96,0.1))":"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:activeSection===id?700:600,fontSize:14,color:activeSection===id?"#3a6ea8":"#5a5e68",borderLeft:activeSection===id?"3px solid #3a6ea8":"3px solid transparent",textAlign:"left",transition:"all 0.15s" }}>
      <span style={{ fontSize:17 }}>{icon}</span>{label}
    </button>
  );

  const downloadCSV = (filename, rows) => {
    if (!rows.length) return showToast("No data to export");
    const headers = Object.keys(rows[0]);
    const escape = v => { const s = v==null?"":String(v); return s.includes(",")||s.includes("\n")||s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s; };
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename} downloaded`);
  };

  const exportCompanies = () => downloadCSV("companies.csv", companies.map(c => ({
    Name: c.name, Industry: c.industry, Country: c.country, Website: c.website||"",
    Owner: users.find(u=>u.id===c.ownerId)?.name||"",
    Contacts: contacts.filter(ct=>ct.companyId===c.id).length,
    CreatedAt: c.createdAt||"", ModifiedAt: c.modifiedAt||"",
  })));

  const exportContacts = () => downloadCSV("contacts.csv", contacts.map(c => ({
    Name: c.name, Email: c.email||"", Phone: c.phoneLocal||"",
    Company: companies.find(co=>co.id===c.companyId)?.name||"",
    Status: c.status||"", Tag: c.tag||"", Country: c.country||"",
    Owner: users.find(u=>u.id===c.ownerId)?.name||"",
    CreatedAt: c.createdAt||"", ModifiedAt: c.modifiedAt||"",
  })));

  const exportTasks = () => downloadCSV("tasks.csv", tasks.map(t => ({
    Title: t.title, Type: t.type, Priority: t.priority,
    DueDate: t.dueDate||"", DueTime: t.dueTime||"",
    Done: t.done?"Yes":"No",
    Contact: contacts.find(c=>String(c.id)===String(t.contactId))?.name||"",
    Company: companies.find(c=>c.id===t.companyId)?.name||"",
    Notes: t.notes||"",
  })));

  // ── User Form ──
  function UserForm({ initial, onSave, onClose }) {
    const empty = { name:"", email:"", password:"", role:"user", title:"" };
    const [form, setForm] = useState(initial ? { ...initial } : empty);
    const [err, setErr] = useState("");
    const set = (k,v) => setForm(f=>({...f,[k]:v}));
    const roleColors = { admin:"#7c3aed", developer:"#2d6a8a", user:"#059669", viewer:"#9298a4" };

    const save = () => {
      if (!form.name.trim()) return setErr("Name is required.");
      if (!form.email.trim()) return setErr("Email is required.");
      if (!initial && !form.password.trim()) return setErr("Password is required.");
      if (!initial && users.find(u=>u.email===form.email.trim())) return setErr("Email already exists.");
      setErr("");
      onSave({ ...form, avatar: form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(), title: form.title || { admin:"Administrator", developer:"Developer", user:"Sales Rep", viewer:"Read Only" }[form.role] });
    };

    return (
      <div>
        <label style={lbl}>Full Name</label>
        <input style={inp} value={form.name} placeholder="Jane Smith" onChange={e=>set("name",e.target.value)} />
        <label style={lbl}>Email</label>
        <input style={inp} value={form.email} type="email" placeholder="jane@company.com" onChange={e=>set("email",e.target.value)} />
        {!initial && <>
          <label style={lbl}>Password</label>
          <input style={inp} value={form.password} type="password" placeholder="Set a password" onChange={e=>set("password",e.target.value)} />
        </>}
        <label style={lbl}>Role</label>
        <div style={{ display:"flex",gap:8,marginBottom:14 }}>
          {Object.entries(roleConfig).map(([role,rc])=>(
            <button key={role} onClick={()=>set("role",role)} style={{ flex:1,padding:"10px 8px",borderRadius:10,border:`2px solid`,borderColor:form.role===role?rc.color:"#e2e4e8",background:form.role===role?rc.bg:"#ffffff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:form.role===role?rc.color:"#5a5e68",transition:"all 0.15s" }}>
              {rc.label}
            </button>
          ))}
        </div>
        <label style={lbl}>Job Title <span style={{ fontWeight:400,textTransform:"none",fontSize:11,color:"#9298a4" }}>(optional)</span></label>
        <input style={inp} value={form.title} placeholder="e.g. Sales Manager" onChange={e=>set("title",e.target.value)} />
        {err&&<div style={{ background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:8,padding:"9px 13px",marginBottom:12,color:"#dc2626",fontSize:13,fontWeight:600 }}>⚠ {err}</div>}
        <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:8 }}>
          <button onClick={onClose} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button>
          <button onClick={save} style={{ padding:"10px 26px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14 }}>{initial?"Save Changes":"Add User"}</button>
        </div>
      </div>
    );
  }

  const addUser = (form) => {
    setUsers(prev=>[...prev,{...form,id:"u_"+Date.now()}]);
    setShowAddUser(false); showToast("User added");
  };
  const saveEditUser = (form) => {
    setUsers(prev=>prev.map(u=>u.id===editUser.id?{...u,...form}:u));
    setEditUser(null); showToast("User updated");
  };
  const doDeleteUser = () => {
    setUsers(prev=>prev.filter(u=>u.id!==deleteUser.id));
    setDeleteUser(null); showToast("User deleted");
  };
  const togglePerm = (role, key) => {
    if (role==="admin") return; // admin always full access
    setRoleConfig(prev=>({ ...prev, [role]:{ ...prev[role], [key]:!prev[role][key] } }));
    showToast("Permission updated");
  };

  return (
    <div style={{ display:"flex",gap:24 }}>
      {/* Sidebar */}
      <div style={{ width:200,flexShrink:0 }}>
        <div style={{ background:"#fff",borderRadius:16,padding:"12px",boxShadow:"0 2px 12px rgba(58,31,0,0.07)",border:"1px solid #e2e4e8" }}>
          <p style={{ fontSize:10,fontWeight:800,color:"#9298a4",letterSpacing:"0.1em",textTransform:"uppercase",margin:"6px 8px 10px",fontFamily:"'DM Sans',sans-serif" }}>Settings</p>
          {sideBtn("users","👥","User Management")}
          {sideBtn("roles","🔐","Role Permissions")}
          {sideBtn("preferences","🎨","Preferences")}
          {sideBtn("data","🗂 ","Data & Export")}
          {sideBtn("about","ℹ️","About")}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1,background:"#fff",borderRadius:16,boxShadow:"0 2px 12px rgba(58,31,0,0.07)",border:"1px solid #e2e4e8",overflow:"hidden" }}>

        {/* ── User Management ── */}
        {activeSection==="users"&&(
          <div>
            <div style={{ padding:"22px 28px 18px",borderBottom:"1px solid #e2e4e8",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div>
                <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:20,color:"#18191b",fontWeight:700 }}>User Management</h2>
                <p style={{ margin:"4px 0 0",fontSize:13,color:"#5a5e68" }}>{users.length} users in the system</p>
              </div>
              <button onClick={()=>setShowAddUser(true)} style={{ padding:"9px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,boxShadow:"0 3px 10px rgba(0,0,0,0.12)" }}>+ Add User</button>
            </div>
            <div style={{ padding:"20px 28px" }}>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {users.map(u=>{
                  const rc = roleConfig[u.role]||roleConfig.user;
                  const isSelf = u.id===currentUser.id;
                  return (
                    <div key={u.id} style={{ display:"flex",alignItems:"center",gap:16,padding:"14px 18px",borderRadius:14,border:"1.5px solid #e2e4e8",background:isSelf?"#f7f8fa":"#fff",transition:"all 0.15s" }}>
                      <div style={{ width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${rc.color}33,${rc.color}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:rc.color,flexShrink:0,border:`2px solid ${rc.color}33` }}>{u.avatar}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                          <span style={{ fontWeight:700,fontSize:14,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>{u.name}</span>
                          {isSelf&&<span style={{ fontSize:10,background:"#f7f8fa",color:"#5a5e68",borderRadius:20,padding:"2px 8px",fontWeight:700,border:"1px solid #e2e4e8" }}>You</span>}
                        </div>
                        <div style={{ fontSize:12,color:"#5a5e68" }}>{u.email} · {u.title}</div>
                      </div>
                      <span style={{ fontSize:11,fontWeight:800,letterSpacing:"0.07em",background:rc.bg,color:rc.color,borderRadius:20,padding:"4px 12px",border:`1px solid ${rc.color}33`,whiteSpace:"nowrap" }}>{rc.label}</span>
                      <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                        <button onClick={()=>setEditUser(u)} style={{ padding:"6px 14px",borderRadius:8,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:12,color:"#5a5e68",fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>✏️ Edit</button>
                        <button onClick={()=>{setResetUser(u);setResetNewPass("");setResetConfirm("");}} style={{ padding:"6px 14px",borderRadius:8,border:"1px solid rgba(58,110,168,0.25)",background:"transparent",cursor:"pointer",fontSize:12,color:"#3a6ea8",fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>🔑 Reset PW</button>
                        <button onClick={()=>!isSelf&&setDeleteUser(u)} disabled={isSelf} style={{ padding:"6px 14px",borderRadius:8,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:isSelf?"not-allowed":"pointer",fontSize:12,color:isSelf?"#ccc":"#dc2626",fontWeight:600,fontFamily:"'DM Sans',sans-serif",opacity:isSelf?0.4:1 }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Role Permissions ── */}
        {activeSection==="roles"&&(()=>{
          const COLORS = ["#7c3aed","#2d6a8a","#059669","#b84c20","#9298a4","#0891b2","#be185d","#ca8a04"];

          const startEditRole = (e, role, rc) => {
            e.stopPropagation();
            setEditingRole({ key:role, label:rc.label, color:rc.color });
          };

          const saveRoleLabel = () => {
            if (!editingRole||!editingRole.label.trim()) return;
            setRoleConfig(prev=>({ ...prev, [editingRole.key]:{ ...prev[editingRole.key], label:editingRole.label.trim(), color:editingRole.color, bg:`${editingRole.color}18` } }));
            setEditingRole(null);
            showToast("Role updated");
          };

          const deleteRole = (role) => {
            if (role==="admin") return;
            setRoleConfig(prev=>{ const n={...prev}; delete n[role]; return n; });
            showToast("Role deleted");
          };

          const addRole = () => {
            const k = newRole.key.trim().toLowerCase().replace(/\s+/g,"_");
            if (!k||!newRole.label.trim()) return;
            if (roleConfig[k]) return showToast("Role key already exists");
            const base = { label:newRole.label.trim(), color:newRole.color, bg:`${newRole.color}18`,
              canAdd:false, canEdit:false, canDelete:false, canManageCompanies:false };
            PERMISSION_KEYS.forEach(p=>{ base[p.key]=!!newRole.perms[p.key]; });
            setRoleConfig(prev=>({...prev,[k]:base}));
            setNewRole({ key:"", label:"", color:"#3a6ea8", perms:{} });
            setCreating(false);
            showToast(`Role "${newRole.label}" created`);
          };

          return (
            <div>
              <div style={{ padding:"22px 28px 18px",borderBottom:"1px solid #e2e4e8",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div>
                  <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:20,color:"#18191b",fontWeight:700 }}>Role Permissions</h2>
                  <p style={{ margin:"4px 0 0",fontSize:13,color:"#5a5e68" }}>Control what each role can do. Toggle permissions or create custom roles.</p>
                </div>
                <button onClick={()=>setCreating(c=>!c)} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,border:"none",background:creating?"#f2f3f5":"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:creating?"#5a5e68":"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13 }}>
                  {creating ? "✕ Cancel" : "+ New Role"}
                </button>
              </div>

              {/* Create new role form */}
              {creating&&(
                <div style={{ margin:"20px 28px",background:"#f7f8fa",borderRadius:14,border:"1.5px solid #e2e4e8",padding:"20px 24px" }}>
                  <div style={{ fontSize:13,fontWeight:800,color:"#18191b",marginBottom:16,fontFamily:"'Playfair Display',serif" }}>Create New Role</div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16 }}>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:5 }}>Role Label</label>
                      <input value={newRole.label} onChange={e=>setNewRole(r=>({...r,label:e.target.value}))} placeholder="e.g. Sales Manager"
                        style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e4e8",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:5 }}>Role Key (unique ID)</label>
                      <input value={newRole.key} onChange={e=>setNewRole(r=>({...r,key:e.target.value}))} placeholder="e.g. sales_manager"
                        style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e2e4e8",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" }}/>
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8 }}>Role Color</label>
                    <div style={{ display:"flex",gap:8 }}>
                      {COLORS.map(c=>(
                        <button key={c} onClick={()=>setNewRole(r=>({...r,color:c}))}
                          style={{ width:32,height:32,borderRadius:"50%",background:c,border:newRole.color===c?"3px solid #18191b":"3px solid transparent",cursor:"pointer",transition:"all 0.15s" }}/>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:10 }}>Permissions</label>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                      {PERMISSION_KEYS.map(p=>{
                        const on = !!newRole.perms[p.key];
                        return (
                          <button key={p.key} onClick={()=>setNewRole(r=>({...r,perms:{...r.perms,[p.key]:!on}}))}
                            style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:9,border:`1.5px solid ${on?newRole.color:"#e2e4e8"}`,background:on?`${newRole.color}12`:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:on?newRole.color:"#5a5e68",textAlign:"left",transition:"all 0.12s" }}>
                            <span style={{ fontSize:14,flexShrink:0 }}>{p.icon}</span>
                            <span style={{ lineHeight:1.3 }}>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}>
                    <button onClick={()=>setCreating(false)} style={{ padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,color:"#5a5e68" }}>Cancel</button>
                    <button onClick={addRole} disabled={!newRole.label.trim()||!newRole.key.trim()}
                      style={{ padding:"9px 24px",borderRadius:9,border:"none",background:newRole.label.trim()&&newRole.key.trim()?"linear-gradient(135deg,#3a6ea8,#4a84c0)":"#e2e4e8",color:newRole.label.trim()&&newRole.key.trim()?"#fff":"#9298a4",cursor:newRole.label.trim()&&newRole.key.trim()?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13 }}>
                      Create Role
                    </button>
                  </div>
                </div>
              )}

              <div style={{ padding:"20px 28px" }}>
                {/* Per-role cards with inline permission editing */}
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  {Object.entries(roleConfig).map(([role,rc])=>{
                    const isAdmin = role==="admin";
                    const expanded = expandedRole===role;
                    const granted = PERMISSION_KEYS.filter(p=>rc[p.key]).length;
                    const usersWithRole = users.filter(u=>u.role===role);
                    return (
                      <div key={role} style={{ background:"#fff",borderRadius:14,border:`1.5px solid ${expanded?rc.color+"66":"#e2e4e8"}`,overflow:"hidden",transition:"border-color 0.15s" }}>
                        {/* Role header row */}
                        <div onClick={()=>setExpandedRole(expanded?null:role)}
                          style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 20px",cursor:"pointer",background:expanded?`${rc.color}06`:"#fff",transition:"background 0.15s" }}>
                          <div style={{ width:40,height:40,borderRadius:12,background:rc.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${rc.color}33` }}>
                            <span style={{ fontWeight:800,fontSize:13,color:rc.color }}>{rc.label.slice(0,2).toUpperCase()}</span>
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            {editingRole?.key===role ? (
                              <div onClick={e=>e.stopPropagation()} style={{ display:"flex",flexDirection:"column",gap:8 }}>
                                <input
                                  autoFocus
                                  value={editingRole.label}
                                  onChange={e=>setEditingRole(r=>({...r,label:e.target.value}))}
                                  onKeyDown={e=>{ if(e.key==="Enter") saveRoleLabel(); if(e.key==="Escape") setEditingRole(null); }}
                                  style={{ fontSize:14,fontWeight:700,fontFamily:"'Playfair Display',serif",border:"1.5px solid #3a6ea8",borderRadius:7,padding:"4px 9px",outline:"none",color:"#18191b",width:"100%",boxSizing:"border-box" }}
                                />
                                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                                  {COLORS.map(c=>(
                                    <button key={c} onClick={()=>setEditingRole(r=>({...r,color:c}))}
                                      style={{ width:20,height:20,borderRadius:"50%",background:c,border:editingRole.color===c?"2.5px solid #18191b":"2px solid transparent",cursor:"pointer",flexShrink:0 }}/>
                                  ))}
                                  <button onClick={saveRoleLabel} style={{ marginLeft:6,padding:"3px 12px",borderRadius:6,border:"none",background:"#3a6ea8",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>Save</button>
                                  <button onClick={()=>setEditingRole(null)} style={{ padding:"3px 10px",borderRadius:6,border:"1px solid #e2e4e8",background:"transparent",color:"#5a5e68",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                                  <span style={{ fontWeight:700,fontSize:14,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>{rc.label}</span>
                                  {!isAdmin&&<button onClick={e=>startEditRole(e,role,rc)} style={{ padding:"2px 8px",borderRadius:5,border:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",fontSize:11,color:"#5a5e68",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>✏️ Rename</button>}
                                  {isAdmin&&<span style={{ fontSize:10,background:"rgba(124,58,237,0.1)",color:"#7c3aed",borderRadius:20,padding:"2px 8px",fontWeight:700 }}>Full Access</span>}
                                  {usersWithRole.length>0&&<span style={{ fontSize:11,color:"#9298a4",fontWeight:600 }}>· {usersWithRole.length} user{usersWithRole.length!==1?"s":""}</span>}
                                </div>
                                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                                  <div style={{ flex:1,maxWidth:160,height:4,borderRadius:2,background:"#f2f3f5",overflow:"hidden" }}>
                                    <div style={{ height:"100%",background:rc.color,width:`${Math.round(granted/PERMISSION_KEYS.length*100)}%`,borderRadius:2 }}/>
                                  </div>
                                  <span style={{ fontSize:11,color:"#9298a4",fontWeight:600,flexShrink:0 }}>{granted}/{PERMISSION_KEYS.length} permissions</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                            {!isAdmin&&!editingRole&&<button onClick={e=>{e.stopPropagation();deleteRole(role);}} style={{ padding:"5px 12px",borderRadius:7,border:"1px solid rgba(220,38,38,0.2)",background:"transparent",cursor:"pointer",fontSize:11,color:"#dc2626",fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>🗑 Delete</button>}
                            {!editingRole&&<span style={{ fontSize:16,color:"#9298a4",transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s",display:"block" }}>⌄</span>}
                          </div>
                        </div>

                        {/* Expanded permission grid */}
                        {expanded&&(
                          <div style={{ padding:"16px 20px",borderTop:`1px solid ${rc.color}22`,background:`${rc.color}04` }}>
                            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                              {PERMISSION_KEYS.map(p=>{
                                const on = !!rc[p.key];
                                return (
                                  <button key={p.key}
                                    onClick={()=>!isAdmin&&togglePerm(role,p.key)}
                                    style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${on?rc.color:"#e2e4e8"}`,background:on?rc.bg:"#fff",cursor:isAdmin?"default":"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:on?rc.color:"#9298a4",textAlign:"left",transition:"all 0.12s",opacity:isAdmin?0.9:1 }}>
                                    <span style={{ fontSize:15,flexShrink:0 }}>{on?"✅":"🚫"}</span>
                                    <div>
                                      <div style={{ fontWeight:700,lineHeight:1.2 }}>{p.icon} {p.label}</div>
                                      <div style={{ fontSize:10,color:on?rc.color:"#c0c8d4",fontWeight:400,marginTop:2 }}>{p.desc}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {isAdmin&&<p style={{ margin:"12px 0 0",fontSize:11,color:"#9298a4",textAlign:"center" }}>🔒 Admin permissions are locked and cannot be modified.</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:16,padding:"12px 16px",background:"#f7f8fa",borderRadius:12,border:"1px solid #e2e4e8" }}>
                  <p style={{ margin:0,fontSize:12,color:"#5a5e68" }}>💡 Click any role to expand and toggle individual permissions. Changes apply immediately across the app.</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── About ── */}
        {activeSection==="preferences"&&(
          <div style={{ padding:"28px" }}>
            <h2 style={{ margin:"0 0 6px",fontFamily:"'Playfair Display',serif",fontSize:20,color:"#18191b",fontWeight:700 }}>Preferences</h2>
            <p style={{ margin:"0 0 24px",fontSize:13,color:"#9298a4" }}>Customize how Meridian CRM looks and behaves</p>
            <div style={{ background:"rgba(39,146,74,0.07)",border:"1px solid rgba(39,146,74,0.2)",borderRadius:10,padding:"10px 16px",marginBottom:20,fontSize:13,color:"#27924a",fontWeight:600,display:"flex",alignItems:"center",gap:8 }}>
              ✅ Changes apply immediately across the app
            </div>
            {[
              {
                icon:"🌍", key:"defaultCountry", title:"Default Country",
                desc:"Pre-selected country when adding new contacts",
                control: (
                  <select value={prefs.defaultCountry} onChange={e=>setPrefs(p=>({...p,defaultCountry:e.target.value}))}
                    style={{ padding:"7px 12px",borderRadius:8,border:"1.5px solid #e2e4e8",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",background:"#fff",cursor:"pointer",outline:"none",minWidth:180 }}>
                    {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                )
              },
              {
                icon:"📅", key:"dateFormat", title:"Date Format",
                desc:"How dates are displayed throughout the app",
                control: (
                  <select value={prefs.dateFormat} onChange={e=>setPrefs(p=>({...p,dateFormat:e.target.value}))}
                    style={{ padding:"7px 12px",borderRadius:8,border:"1.5px solid #e2e4e8",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",background:"#fff",cursor:"pointer",outline:"none",minWidth:180 }}>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2025-03-15)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (15/03/2025)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (03/15/2025)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (15 Mar 2025)</option>
                  </select>
                )
              },
              {
                icon:"🕐", key:"timeFormat", title:"Time Format",
                desc:"12-hour or 24-hour clock display",
                control: (
                  <div style={{ display:"flex",gap:6 }}>
                    {[["12h","12-hour (AM/PM)"],["24h","24-hour"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setPrefs(p=>({...p,timeFormat:v}))}
                        style={{ padding:"7px 16px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                          borderColor:prefs.timeFormat===v?"#3a6ea8":"#e2e4e8",
                          background:prefs.timeFormat===v?"#3a6ea8":"#fff",
                          color:prefs.timeFormat===v?"#fff":"#5a5e68" }}>{l}</button>
                    ))}
                  </div>
                )
              },
              {
                icon:"💬", key:"defaultTaskType", title:"Default Task Type",
                desc:"Pre-selected type when creating new tasks",
                control: (
                  <select value={prefs.defaultTaskType} onChange={e=>setPrefs(p=>({...p,defaultTaskType:e.target.value}))}
                    style={{ padding:"7px 12px",borderRadius:8,border:"1.5px solid #e2e4e8",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",background:"#fff",cursor:"pointer",outline:"none",minWidth:180 }}>
                    {TASK_TYPES.map(t=><option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                  </select>
                )
              },
              {
                icon:"🔔", key:"overdueAlerts", title:"Overdue Alerts",
                desc:"Show badge on Dashboard for overdue and today tasks",
                control: (
                  <div style={{ display:"flex",gap:6 }}>
                    {[[true,"Enabled"],[false,"Disabled"]].map(([v,l])=>(
                      <button key={l} onClick={()=>setPrefs(p=>({...p,overdueAlerts:v}))}
                        style={{ padding:"7px 16px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                          borderColor:prefs.overdueAlerts===v?(v?"#27924a":"#dc2626"):"#e2e4e8",
                          background:prefs.overdueAlerts===v?(v?"#27924a":"#dc2626"):"#fff",
                          color:prefs.overdueAlerts===v?"#fff":"#5a5e68" }}>{l}</button>
                    ))}
                  </div>
                )
              },
              {
                icon:"⚡", key:"autoTaskDays", title:"Auto-Task Schedule",
                desc:"Days after adding a contact to schedule the 3 automatic follow-up tasks",
                control: (
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    {["Follow-up Call","Meeting","Proposal"].map((label,i)=>(
                      <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                        <span style={{ fontSize:10,fontWeight:700,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap" }}>{label.split(" ").pop()}</span>
                        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                          <button onClick={()=>setPrefs(p=>{ const d=[...p.autoTaskDays]; d[i]=Math.max(1,d[i]-1); return {...p,autoTaskDays:d}; })}
                            style={{ width:24,height:24,borderRadius:6,border:"1.5px solid #e2e4e8",background:"#f7f8fa",cursor:"pointer",fontSize:14,fontWeight:700,color:"#5a5e68",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>−</button>
                          <input
                            type="number" min="1" max="365"
                            value={prefs.autoTaskDays[i]}
                            onChange={e=>setPrefs(p=>{ const d=[...p.autoTaskDays]; d[i]=Math.max(1,Math.min(365,parseInt(e.target.value)||1)); return {...p,autoTaskDays:d}; })}
                            style={{ width:44,textAlign:"center",padding:"4px 6px",borderRadius:7,border:"1.5px solid #e2e4e8",fontSize:13,fontWeight:700,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none" }}
                          />
                          <button onClick={()=>setPrefs(p=>{ const d=[...p.autoTaskDays]; d[i]=Math.min(365,d[i]+1); return {...p,autoTaskDays:d}; })}
                            style={{ width:24,height:24,borderRadius:6,border:"1.5px solid #e2e4e8",background:"#f7f8fa",cursor:"pointer",fontSize:14,fontWeight:700,color:"#5a5e68",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>+</button>
                        </div>
                        <span style={{ fontSize:10,color:"#9298a4" }}>day{prefs.autoTaskDays[i]!==1?"s":""}</span>
                      </div>
                    ))}
                  </div>
                )
              },
            ].map((item,i,arr)=>(
              <div key={item.key} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 0",borderBottom:i<arr.length-1?"1px solid #f2f3f5":"none",gap:16,flexWrap:"wrap" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                  <span style={{ fontSize:22,width:36,textAlign:"center",flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,color:"#18191b" }}>{item.title}</div>
                    <div style={{ fontSize:12,color:"#9298a4",marginTop:2 }}>{item.desc}</div>
                  </div>
                </div>
                <div style={{ flexShrink:0 }}>{item.control}</div>
              </div>
            ))}
            <div style={{ marginTop:24,padding:"12px 18px",background:"rgba(39,146,74,0.05)",borderRadius:12,border:"1px solid rgba(39,146,74,0.2)",display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:16 }}>✅</span>
              <div style={{ fontSize:12,color:"#27924a",fontWeight:600 }}>Changes apply immediately across the app.</div>
            </div>
          </div>
        )}

        {activeSection==="data"&&(()=>{
          const totalTasks    = window.__crmTasks?.length     || 0;
          const totalContacts = window.__crmContacts?.length  || 0;
          const totalCompanies= window.__crmCompanies?.length || 0;
          return (
            <div style={{ padding:"28px" }}>
              <h2 style={{ margin:"0 0 6px",fontFamily:"'Playfair Display',serif",fontSize:20,color:"#18191b",fontWeight:700 }}>Data & Export</h2>
              <p style={{ margin:"0 0 24px",fontSize:13,color:"#9298a4" }}>Overview of your CRM data and export options</p>
              {/* Data summary */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24 }}>
                {[
                  { icon:"🏢", label:"Companies", value:totalCompanies||"—" },
                  { icon:"👤", label:"Contacts",  value:totalContacts||"—" },
                  { icon:"✅", label:"Tasks",      value:totalTasks||"—" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"#f7f8fa",borderRadius:12,padding:"16px",border:"1.5px solid #e2e4e8",textAlign:"center" }}>
                    <div style={{ fontSize:24,marginBottom:6 }}>{s.icon}</div>
                    <div style={{ fontSize:22,fontWeight:800,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
                    <div style={{ fontSize:11,color:"#9298a4",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Export options */}
              <div style={{ fontSize:11,fontWeight:800,color:"#9298a4",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12 }}>Export Data</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[
                  { icon:"📊", label:"Export Companies", desc:"Company names, industry, country, owner, contacts count", color:"#3a6ea8", fn: exportCompanies },
                  { icon:"👥", label:"Export Contacts",  desc:"All contacts with email, phone, status, company", color:"#27924a", fn: exportContacts },
                  { icon:"✅", label:"Export Tasks",     desc:"All tasks with type, priority, due date, assignee", color:"#7c6fb0", fn: exportTasks },
                ].map(item=>(
                  <div key={item.label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderRadius:12,border:"1.5px solid #e2e4e8",background:"#fff" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                      <span style={{ fontSize:22 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize:14,fontWeight:700,color:"#18191b" }}>{item.label}</div>
                        <div style={{ fontSize:11,color:"#9298a4",marginTop:2 }}>{item.desc}</div>
                      </div>
                    </div>
                    <button onClick={item.fn} style={{ padding:"7px 16px",borderRadius:9,border:`1.5px solid ${item.color}`,background:"transparent",color:item.color,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:700,flexShrink:0 }}>
                      ↓ CSV
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:20,padding:"14px 18px",background:"rgba(220,38,38,0.04)",borderRadius:12,border:"1px solid rgba(220,38,38,0.15)" }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#dc2626",marginBottom:4 }}>⚠ Danger Zone</div>
                <div style={{ fontSize:12,color:"#5a5e68",marginBottom:10 }}>Permanently delete all CRM data. This cannot be undone.</div>
                {!confirmReset
                  ? <button onClick={()=>setConfirmReset(true)} style={{ padding:"7px 16px",borderRadius:9,border:"1.5px solid rgba(220,38,38,0.3)",background:"transparent",color:"#dc2626",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:700 }}>
                      🗑 Reset All Data
                    </button>
                  : <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:12,color:"#dc2626",fontWeight:600 }}>Are you sure? This cannot be undone.</span>
                      <button onClick={()=>{ if(setCompanies)setCompanies([]); if(setContacts)setContacts([]); if(setTasks)setTasks([]); try{["crm_contacts","crm_companies","crm_tasks"].forEach(k=>localStorage.removeItem(k));}catch{} setConfirmReset(false); showToast("All data reset"); }}
                        style={{ padding:"7px 16px",borderRadius:9,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:700 }}>
                        Yes, Reset
                      </button>
                      <button onClick={()=>setConfirmReset(false)} style={{ padding:"7px 14px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"transparent",color:"#5a5e68",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>
                        Cancel
                      </button>
                    </div>
                }
              </div>
            </div>
          );
        })()}

        {activeSection==="about"&&(
          <div style={{ padding:"28px 28px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:24 }}>
              <div style={{ width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#4a84c0,#3a6ea8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>◈</div>
              <div>
                <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:22,color:"#18191b",fontWeight:700 }}>Meridian CRM</h2>
                <p style={{ margin:"3px 0 0",fontSize:13,color:"#5a5e68" }}>Version 2.0 · Built with React</p>
              </div>
            </div>
            {[
              {icon:"👥",label:"Total Users",   value:users.length},
              {icon:"🔐",label:"Roles",         value:Object.keys(roleConfig).length},
              {icon:"👑",label:"Admins",        value:users.filter(u=>u.role==="admin").length},
              {icon:"✅",label:"Version",       value:"2.1"},
              {icon:"⚛️",label:"Built With",   value:"React"},
              {icon:"🎨",label:"Design",        value:"Meridian"},
            ].map(s=>(
              <div key={s.label} style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:"1px solid #f7f8fa" }}>
                <span style={{ fontSize:18 }}>{s.icon}</span>
                <span style={{ flex:1,fontSize:14,color:"#18191b",fontWeight:600 }}>{s.label}</span>
                <span style={{ fontSize:16,fontWeight:700,color:"#5a5e68",fontFamily:"'Playfair Display',serif" }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddUser&&<Modal title="Add New User" onClose={()=>setShowAddUser(false)}><UserForm onSave={addUser} onClose={()=>setShowAddUser(false)}/></Modal>}
      {editUser&&<Modal title="Edit User" onClose={()=>setEditUser(null)}><UserForm initial={editUser} onSave={saveEditUser} onClose={()=>setEditUser(null)}/></Modal>}
      {deleteUser&&(
        <Modal title="Delete User" onClose={()=>setDeleteUser(null)}>
          <p style={{ color:"#18191b",fontSize:15,marginTop:0 }}>Delete <strong>{deleteUser.name}</strong>? They will lose all access immediately.</p>
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
            <button onClick={()=>setDeleteUser(null)} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button>
            <button onClick={doDeleteUser} style={{ padding:"10px 22px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#c0392b,#e74c3c)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700 }}>Delete</button>
          </div>
        </Modal>
      )}
      {resetUser&&(
        <Modal title={`Reset Password · ${resetUser.name}`} onClose={()=>setResetUser(null)}>
          <div style={{ background:"rgba(58,110,168,0.06)",border:"1px solid rgba(58,110,168,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#3a6ea8",fontWeight:600 }}>
            🔑 Setting new password for <strong>{resetUser.name}</strong> ({resetUser.email})
          </div>
          <label style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6 }}>New Password</label>
          <input value={resetNewPass} onChange={e=>setResetNewPass(e.target.value)} type="password" placeholder="Min 4 characters"
            style={{ width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:14,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:12 }}/>
          <label style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Confirm Password</label>
          <input value={resetConfirm} onChange={e=>setResetConfirm(e.target.value)} type="password" placeholder="Repeat new password"
            style={{ width:"100%",padding:"10px 13px",borderRadius:9,border:"1.5px solid #e2e4e8",background:"#fff",fontSize:14,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:4 }}/>
          {resetNewPass&&resetConfirm&&resetNewPass!==resetConfirm&&<div style={{ fontSize:12,color:"#dc2626",marginBottom:10,fontWeight:600 }}>⚠ Passwords do not match</div>}
          {resetNewPass&&resetNewPass.length<4&&<div style={{ fontSize:12,color:"#dc2626",marginBottom:10,fontWeight:600 }}>⚠ Must be at least 4 characters</div>}
          <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:12 }}>
            <button onClick={()=>setResetUser(null)} style={{ padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#5a5e68",fontWeight:600 }}>Cancel</button>
            <button
              disabled={!resetNewPass||resetNewPass.length<4||resetNewPass!==resetConfirm}
              onClick={()=>{
                setUsers(prev=>prev.map(u=>u.id===resetUser.id?{...u,password:resetNewPass,passwordHint:"Set by admin"}:u));
                // Also mutate the live object so login still works
                resetUser.password = resetNewPass;
                resetUser.passwordHint = "Set by admin";
                setResetUser(null); showToast(`Password reset for ${resetUser.name}`);
              }}
              style={{ padding:"10px 22px",borderRadius:10,border:"none",background:(!resetNewPass||resetNewPass.length<4||resetNewPass!==resetConfirm)?"#e2e4e8":"linear-gradient(135deg,#27924a,#34a85a)",color:(!resetNewPass||resetNewPass.length<4||resetNewPass!==resetConfirm)?"#9298a4":"#fff",cursor:(!resetNewPass||resetNewPass.length<4||resetNewPass!==resetConfirm)?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700 }}>
              Reset Password ✓
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Profile & Security Modal ──────────────────────────────────────────────────
const SECURITY_QUESTIONS = [
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your primary school?",
  "What is your oldest sibling's middle name?",
  "What street did you grow up on?",
  "What was the make of your first car?",
  "What is your favourite movie?",
];

function ProfileModal({ user, users, setUsers, onClose, showToast }) {
  const [profileTab, setProfileTab] = useState("password"); // password | security
  const inputStyle = { width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e2e4e8",background:"#fafafa",fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" };
  const labelStyle = { display:"block",fontSize:11,fontWeight:800,color:"#5a5e68",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5 };

  // Password change state
  const [curPass,   setCurPass]   = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confPass,  setConfPass]  = useState("");
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [passError, setPassError] = useState("");
  const [passStrength, setPassStrength] = useState(0);

  const calcStrength = (p) => {
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthLabel = ["","Weak","Fair","Good","Strong","Very strong"][passStrength]||"";
  const strengthColor = ["","#dc2626","#b84c20","#b45309","#27924a","#1a7a3e"][passStrength]||"#e2e4e8";

  const handleNewPass = (v) => { setNewPass(v); setPassStrength(calcStrength(v)); setPassError(""); };

  const savePassword = () => {
    if (curPass !== user.password) { setPassError("Current password is incorrect."); return; }
    if (newPass.length < 4)        { setPassError("New password must be at least 4 characters."); return; }
    if (newPass !== confPass)      { setPassError("Passwords do not match."); return; }
    user.password = newPass;
    user.passwordHint = newPass.slice(0,2) + "•••";
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, password: newPass, passwordHint: newPass.slice(0,2)+"•••" } : u));
    setCurPass(""); setNewPass(""); setConfPass(""); setPassError("");
    showToast("Password updated successfully");
  };

  // Security Q&A state
  const [secQ,     setSecQ]     = useState(user.securityQuestion || SECURITY_QUESTIONS[0]);
  const [secA,     setSecA]     = useState("");
  const [secError, setSecError] = useState("");

  const saveSecurityQA = () => {
    if (!secA.trim()) { setSecError("Please enter an answer."); return; }
    if (secA.trim().length < 2) { setSecError("Answer must be at least 2 characters."); return; }
    user.securityQuestion = secQ;
    user.securityAnswer   = secA.trim().toLowerCase();
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, securityQuestion: secQ, securityAnswer: secA.trim().toLowerCase() } : u));
    setSecA(""); setSecError("");
    showToast("Security question updated");
  };

  const tabBtn = (id, label, icon) => {
    const active = profileTab === id;
    return (
      <button onClick={()=>setProfileTab(id)} style={{ flex:1,padding:"10px 0",border:"none",background:active?"#fff":"transparent",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:active?"#18191b":"#9298a4",borderRadius:9,boxShadow:active?"0 2px 8px rgba(0,0,0,0.08)":"none",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
        {icon} {label}
      </button>
    );
  };

  const rc2 = ROLE_CONFIG[user.role]||{color:"#9298a4",bg:"rgba(100,116,139,0.1)",label:user.role};

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={onClose}>
      <div style={{ background:"#fff",borderRadius:18,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",overflow:"hidden",animation:"slideUp 0.2s cubic-bezier(.16,1,.3,1)" }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#1c1e22,#2a2d35)",padding:"22px 24px 20px",position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.12)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#f2f3f5",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${rc2.color}55,${rc2.color}33)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:rc2.color,border:`2px solid ${rc2.color}44` }}>{user.avatar}</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#f2f3f5" }}>{user.name}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2 }}>{user.email}</div>
            </div>
          </div>
          <div style={{ marginTop:12,display:"flex",gap:8 }}>
            <span style={{ fontSize:11,fontWeight:700,color:rc2.color,background:`${rc2.color}22`,borderRadius:6,padding:"3px 10px",border:`1px solid ${rc2.color}33` }}>{rc2.label}</span>
            <span style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"3px 10px" }}>Hint: {user.passwordHint||"—"}</span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex",gap:4,background:"#f2f3f5",margin:"16px 20px 0",borderRadius:12,padding:4 }}>
          {tabBtn("password","Change Password","🔑")}
          {tabBtn("security","Security Question","🛡️")}
        </div>

        {/* Content */}
        <div style={{ padding:"20px 24px 24px" }}>

          {/* ── PASSWORD TAB ── */}
          {profileTab==="password"&&(
            <div>
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Current Password</label>
                <div style={{ position:"relative" }}>
                  <input type={showCur?"text":"password"} value={curPass} onChange={e=>{setCurPass(e.target.value);setPassError("");}}
                    placeholder="Enter current password" style={{...inputStyle,paddingRight:40}}/>
                  <button onClick={()=>setShowCur(s=>!s)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#9298a4" }}>{showCur?"🙈":"👁"}</button>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>New Password</label>
                <div style={{ position:"relative" }}>
                  <input type={showNew?"text":"password"} value={newPass} onChange={e=>handleNewPass(e.target.value)}
                    placeholder="Enter new password" style={{...inputStyle,paddingRight:40}}/>
                  <button onClick={()=>setShowNew(s=>!s)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#9298a4" }}>{showNew?"🙈":"👁"}</button>
                </div>
                {newPass&&(
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:"flex",gap:3,marginBottom:4 }}>
                      {[1,2,3,4,5].map(i=>(
                        <div key={i} style={{ flex:1,height:3,borderRadius:2,background:i<=passStrength?strengthColor:"#e2e4e8",transition:"background 0.2s" }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:11,fontWeight:700,color:strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Confirm New Password</label>
                <input type="password" value={confPass} onChange={e=>{setConfPass(e.target.value);setPassError("");}}
                  placeholder="Repeat new password" style={{...inputStyle, borderColor:confPass&&confPass!==newPass?"rgba(220,38,38,0.4)":confPass&&confPass===newPass?"rgba(39,146,74,0.4)":"#e2e4e8"}}/>
                {confPass&&confPass===newPass&&<div style={{ fontSize:11,color:"#27924a",marginTop:4,fontWeight:600 }}>✓ Passwords match</div>}
              </div>
              {passError&&<div style={{ fontSize:12,color:"#dc2626",background:"rgba(220,38,38,0.06)",borderRadius:8,padding:"8px 12px",marginBottom:12,fontWeight:600 }}>⚠ {passError}</div>}
              <button onClick={savePassword}
                style={{ width:"100%",padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,boxShadow:"0 4px 14px rgba(58,110,168,0.25)" }}>
                🔑 Update Password
              </button>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {profileTab==="security"&&(
            <div>
              {/* Current question display */}
              {user.securityQuestion&&(
                <div style={{ background:"rgba(58,110,168,0.06)",borderRadius:10,padding:"12px 14px",marginBottom:16,border:"1px solid rgba(58,110,168,0.12)" }}>
                  <div style={{ fontSize:11,fontWeight:800,color:"#3a6ea8",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4 }}>Current Security Question</div>
                  <div style={{ fontSize:13,color:"#18191b",fontWeight:600 }}>{user.securityQuestion}</div>
                  <div style={{ fontSize:12,color:"#9298a4",marginTop:4 }}>Answer is stored securely (case-insensitive)</div>
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>New Security Question</label>
                <select value={secQ} onChange={e=>{setSecQ(e.target.value);setSecError("");}}
                  style={{...inputStyle,cursor:"pointer",background:"#fafafa"}}>
                  {SECURITY_QUESTIONS.map(q=><option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Your Answer</label>
                <input type="text" value={secA} onChange={e=>{setSecA(e.target.value);setSecError("");}}
                  placeholder="Enter your answer (not case-sensitive)" style={inputStyle}/>
                <div style={{ fontSize:11,color:"#9298a4",marginTop:4 }}>Your answer will be saved in lowercase for case-insensitive matching.</div>
              </div>
              {secError&&<div style={{ fontSize:12,color:"#dc2626",background:"rgba(220,38,38,0.06)",borderRadius:8,padding:"8px 12px",marginBottom:12,fontWeight:600 }}>⚠ {secError}</div>}
              <button onClick={saveSecurityQA}
                style={{ width:"100%",padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3a6ea8,#4a84c0)",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,boxShadow:"0 4px 14px rgba(58,110,168,0.25)" }}>
                🛡️ Save Security Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const lsAvailable = (() => { try { localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; } catch { return false; } })();

function usePersisted(key, fallback) {
  const [val, setVal] = useState(() => {
    if (!lsAvailable) return fallback;
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  const setPersisted = (next) => {
    setVal(prev => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (lsAvailable) { try { localStorage.setItem(key, JSON.stringify(resolved)); } catch {} }
      return resolved;
    });
  };
  return [val, setPersisted];
}

function CRMApp({ currentUser, onLogout, roleConfig, setRoleConfig }) {
  const [users, setUsers]       = usePersisted("crm_users", USERS);
  const [prefs, setPrefs]       = usePersisted("crm_prefs", {
    defaultCountry: "US",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "12h",
    defaultTaskType: "Follow-up Call",
    overdueAlerts: true,
    autoTaskDays: [5, 7, 10],
  });
  const rc = roleConfig[currentUser.role] || roleConfig.user;
  const [tab,setTab]            = useState("dashboard");
  const [contacts,setContacts]  = usePersisted("crm_contacts", initialContacts);
  const [companies,setCompanies]= usePersisted("crm_companies", initialCompanies);
  const [tasks,setTasks]        = usePersisted("crm_tasks", initialTasks);
  const [toast,setToast] = useState(null);
  const [highlightCompanyId,setHighlightCompanyId] = useState(null);
  const [highlightContactId,setHighlightContactId] = useState(null);
  const [triggerAdd,setTriggerAdd] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showGlobalResults, setShowGlobalResults] = useState(false);
  const globalSearchRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (globalSearchRef.current && !globalSearchRef.current.contains(e.target)) setShowGlobalResults(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const globalResults = React.useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    const visibleContacts = rc.canViewAll ? contacts : contacts.filter(c => c.ownerId === currentUser?.id);
    const matchedContacts = visibleContacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email||"").toLowerCase().includes(q) ||
      (c.tag||"").toLowerCase().includes(q)
    ).slice(0, 20);
    const visibleCompanies = rc.canViewAll ? companies : companies.filter(c => c.ownerId === currentUser?.id);
    const matchedCompanies = visibleCompanies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.industry||"").toLowerCase().includes(q)
    ).slice(0, 6);
    return [
      ...matchedContacts.map(c => ({ type:"contact", item:c, company: companies.find(co=>co.id===c.companyId) })),
      ...matchedCompanies.map(c => ({ type:"company", item:c })),
    ];
  }, [globalSearch, contacts, companies]);

  const handleGlobalSelect = (result) => {
    setGlobalSearch("");
    setShowGlobalResults(false);
    if (result.type === "company") {
      handleViewCompany(result.item.id);
    } else {
      setTab("companies");
      setHighlightCompanyId(result.item.companyId);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2500); };
  const handleViewContact = (id) => {
    const ct = contacts.find(c => String(c.id) === String(id));
    if (ct) { setTab("companies"); setHighlightCompanyId(ct.companyId); setHighlightContactId(String(id)); }
  };
  const handleViewCompany = (id) => { setTab("companies"); setHighlightCompanyId(id); };
  const overdueCt = tasks.filter(t=>!t.done&&t.dueDate<TODAY).length;
  const todayCt   = tasks.filter(t=>!t.done&&t.dueDate===TODAY).length;

  const navBtn = (id,label,badge) => {
    const active = tab===id;
    return (
      <button onClick={()=>setTab(id)} style={{ padding:"10px 18px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,background:active?"rgba(255,255,255,0.15)":"transparent",color:active?"#f2f3f5":"rgba(219,234,254,0.65)",borderRadius:8,transition:"all 0.15s",borderBottom:active?"2px solid #3a6ea8":"2px solid transparent",display:"flex",alignItems:"center",gap:6 }}>
        {label}
        {badge>0&&<span style={{ background:"#dc2626",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:11,fontWeight:800 }}>{badge}</span>}
      </button>
    );
  };

  const headerAction = tab==="dashboard"?"New Task":tab==="companies"?"New Company":null;

  return (
    <div style={{ minHeight:"100vh",background:"#f7f8fa",fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#c0c8d4; border-radius:3px; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        input:focus,textarea:focus,select:focus { border-color:#3a6ea8 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(180deg,#1c1e22,#23262e)",padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#4a84c0,#3a6ea8)",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:17 }}>◈</span></div>
            <h1 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f2f3f5",fontWeight:700 }}>Meridian CRM</h1>
          </div>
          <div style={{ width:1,height:26,background:"rgba(255,255,255,0.2)",margin:"0 2px" }}/>
          <nav style={{ display:"flex",gap:2 }}>
            {navBtn("dashboard","📊 Dashboard",prefs.overdueAlerts&&overdueCt+todayCt>0?overdueCt+todayCt:0)}
            {navBtn("companies","🏢 Companies & Contacts",0)}
            {navBtn("reports","📈 Reports",0)}
            {currentUser.role==="admin"&&navBtn("settings","⚙️ Settings",0)}
          </nav>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {/* Global Search */}
          <div ref={globalSearchRef} style={{ position:"relative" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"7px 14px",width:230,transition:"all 0.2s" }}>
              <span style={{ fontSize:13,opacity:0.5 }}>🔍</span>
              <input
                value={globalSearch}
                onChange={e=>{ setGlobalSearch(e.target.value); setShowGlobalResults(true); }}
                onFocus={()=>globalSearch.length>=1&&setShowGlobalResults(true)}
                placeholder="Search contacts…"
                style={{ background:"transparent",border:"none",outline:"none",fontSize:13,color:"#f2f3f5",fontFamily:"'DM Sans',sans-serif",width:"100%",fontWeight:500 }}
              />
              {globalSearch&&<button onClick={()=>{setGlobalSearch("");setShowGlobalResults(false);}} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:14,padding:0,lineHeight:1 }}>✕</button>}
            </div>
            {showGlobalResults&&globalSearch.length>=1&&(
              <div style={{ position:"absolute",top:"calc(100% + 8px)",left:0,right:0,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",border:"1px solid #e2e4e8",zIndex:9999,overflow:"hidden",minWidth:320,maxHeight:400,overflowY:"auto" }}>
                {globalResults.length===0
                  ? <div style={{ padding:"16px 18px",fontSize:13,color:"#9298a4",textAlign:"center" }}>No results for "{globalSearch}"</div>
                  : <>
                      {globalResults.filter(r=>r.type==="contact").length>0&&(
                        <div>
                          <div style={{ padding:"8px 14px 4px",fontSize:10,fontWeight:800,color:"#9298a4",letterSpacing:"0.1em",textTransform:"uppercase",borderBottom:"1px solid #f2f3f5" }}>Contacts</div>
                          {globalResults.filter(r=>r.type==="contact").map(r=>{
                            const sc = STATUS_COLORS[r.item.status]||STATUS_COLORS.lead;
                            return (
                              <div key={r.item.id} onClick={()=>handleGlobalSelect(r)}
                                style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",transition:"background 0.1s" }}
                                onMouseEnter={e=>e.currentTarget.style.background="#f7f8fa"}
                                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <div style={{ width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${sc.bg},${sc.bg}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:sc.text,flexShrink:0,border:`1.5px solid ${sc.bg}` }}>{r.item.avatar}</div>
                                <div style={{ flex:1,minWidth:0 }}>
                                  <div style={{ fontWeight:700,fontSize:13,color:"#18191b",fontFamily:"'DM Sans',sans-serif" }}>{r.item.name}</div>
                                  <div style={{ fontSize:11,color:"#9298a4",marginTop:1 }}>{r.company?.name||"No company"} · {r.item.email}</div>
                                </div>
                                <span style={{ fontSize:10,fontWeight:700,background:sc.bg,color:sc.text,borderRadius:20,padding:"2px 8px",flexShrink:0,textTransform:"capitalize" }}>{r.item.status}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {globalResults.filter(r=>r.type==="company").length>0&&(
                        <div style={{ borderTop:"1px solid #f2f3f5" }}>
                          <div style={{ padding:"8px 14px 4px",fontSize:10,fontWeight:800,color:"#9298a4",letterSpacing:"0.1em",textTransform:"uppercase" }}>Companies</div>
                          {globalResults.filter(r=>r.type==="company").map(r=>(
                            <div key={r.item.id} onClick={()=>handleGlobalSelect(r)}
                              style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",transition:"background 0.1s" }}
                              onMouseEnter={e=>e.currentTarget.style.background="#f7f8fa"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#3a6ea822,#4a84c022)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#3a6ea8",flexShrink:0,border:"1.5px solid #3a6ea822" }}>{companyInitials(r.item.name)}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:700,fontSize:13,color:"#18191b" }}>{r.item.name}</div>
                                <div style={{ fontSize:11,color:"#9298a4" }}>{r.item.industry}</div>
                              </div>
                              <span style={{ fontSize:10,color:"#9298a4" }}>→</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                }
              </div>
            )}
          </div>
          <span style={{ fontSize:11,fontWeight:800,letterSpacing:"0.07em",background:rc.bg,color:rc.color,borderRadius:20,padding:"4px 12px",border:`1px solid ${rc.color}33` }}>{rc.label.toUpperCase()}</span>
          {rc.canAddTask&&headerAction&&(
            <button onClick={()=>setTriggerAdd(n=>n+1)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4a84c0,#3a6ea8)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 14px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize:15 }}>+</span> {headerAction}
            </button>
          )}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowUserMenu(s=>!s)} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(59,130,246,0.15)",cursor:"pointer",color:"#f2f3f5",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600 }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#4a84c0,#3a6ea8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff" }}>{currentUser.avatar}</div>
              <span>{currentUser.name.split(" ")[0]}</span>
              <span style={{ fontSize:10,opacity:0.6 }}>▾</span>
            </button>
            {showUserMenu&&(
              <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,background:"#ffffff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",border:"1.5px solid #e2e4e8",minWidth:210,zIndex:500,overflow:"hidden",animation:"fadeIn 0.15s ease" }}>
                <div style={{ padding:"14px 16px",borderBottom:"1px solid #e2e4e8",background:"#f7f8fa" }}>
                  <div style={{ fontWeight:700,fontSize:14,color:"#18191b",fontFamily:"'Playfair Display',serif" }}>{currentUser.name}</div>
                  <div style={{ fontSize:12,color:"#5a5e68",marginTop:2 }}>{currentUser.email}</div>
                  <div style={{ marginTop:6 }}><span style={{ fontSize:11,fontWeight:800,background:rc.bg,color:rc.color,borderRadius:20,padding:"3px 10px",border:`1px solid ${rc.color}33` }}>{currentUser.title}</span></div>
                </div>
                <div style={{ padding:"12px 16px",borderBottom:"1px solid #e2e4e8" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#5a5e68",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8 }}>Permissions</div>
                  {PERMISSION_KEYS.map(p=>(
                    <div key={p.key} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:5 }}>
                      <span style={{ fontSize:12 }}>{rc[p.key]?"✅":"🚫"}</span>
                      <span style={{ fontSize:12,color:rc[p.key]?"#18191b":"#9298a4" }}>{p.icon} {p.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>{setShowUserMenu(false);setShowProfileModal(true);}} style={{ width:"100%",padding:"11px 16px",border:"none",borderBottom:"1px solid #e2e4e8",background:"transparent",cursor:"pointer",textAlign:"left",fontSize:13,color:"#18191b",fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8 }}>
                  🔐 My Profile & Security
                </button>
                <button onClick={()=>{setShowUserMenu(false);onLogout();}} style={{ width:"100%",padding:"12px 16px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left",fontSize:13,color:"#dc2626",fontWeight:700,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8 }}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!rc.canAddTask&&(
        <div style={{ background:"rgba(3,105,161,0.07)",borderBottom:"1px solid rgba(3,105,161,0.15)",padding:"8px 32px",display:"flex",alignItems:"center",gap:8 }}>
          <span>🔒</span>
          <span style={{ fontSize:13,color:"#5a5e68",fontWeight:600 }}>Read-only access. Contact your admin to request edit permissions.</span>
        </div>
      )}

      <div style={{ padding:"14px 32px",display:"flex",gap:12 }}>
        {[
          {label:"Contacts",  value:contacts.length,  icon:"👥"},
          {label:"Companies", value:companies.length,  icon:"🏢"},
          {label:"Active",    value:contacts.filter(c=>c.status==="active").length, icon:"✅"},
          {label:"Open Tasks",value:tasks.filter(t=>!t.done).length, icon:"📋"},
          {label:"Overdue",   value:overdueCt, icon:"🚨", alert:overdueCt>0},
        ].map(s=>(
          <div key={s.label} style={{ flex:1,background:s.alert?"rgba(220,38,38,0.06)":"#fff",borderRadius:12,padding:"12px 16px",boxShadow:"0 1px 8px rgba(58,31,0,0.06)",border:s.alert?"1.5px solid rgba(220,38,38,0.2)":"1px solid #e2e4e8" }}>
            <div style={{ fontSize:16,marginBottom:2 }}>{s.icon}</div>
            <div style={{ fontSize:22,fontWeight:700,color:s.alert?"#dc2626":"#18191b",fontFamily:"'Playfair Display',serif" }}>{s.value}</div>
            <div style={{ fontSize:10,color:s.alert?"#dc2626":"#5a5e68",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:"0 32px 40px" }}>
        {tab==="dashboard"&&<DashboardView tasks={tasks} contacts={contacts} companies={companies} setTasks={setTasks} showToast={showToast} triggerAdd={triggerAdd} rc={rc} roleConfig={roleConfig} onViewContact={handleViewContact} onViewCompany={handleViewCompany} users={users} currentUser={currentUser} prefs={prefs}/>}
        {tab==="companies"&&<CompaniesView companies={companies} contacts={contacts} setCompanies={setCompanies} setContacts={setContacts} tasks={tasks} setTasks={setTasks} showToast={showToast} onViewContacts={handleViewContact} triggerAdd={triggerAdd} rc={rc} highlightId={highlightCompanyId} clearHighlight={()=>setHighlightCompanyId(null)} highlightContactId={highlightContactId} clearHighlightContact={()=>setHighlightContactId(null)} currentUser={currentUser} users={users} prefs={prefs}/>}
        {tab==="reports"&&<ReportsView contacts={contacts} companies={companies} tasks={tasks} users={users} currentUser={currentUser} rc={rc} onViewContact={handleViewContact} onViewCompany={handleViewCompany}/>}
        {tab==="settings"&&currentUser.role==="admin"&&<SettingsView currentUser={currentUser} users={users} setUsers={setUsers} roleConfig={roleConfig} setRoleConfig={setRoleConfig} showToast={showToast} prefs={prefs} setPrefs={setPrefs} companies={companies} contacts={contacts} tasks={tasks} setCompanies={setCompanies} setContacts={setContacts} setTasks={setTasks}/>}
      </div>

      {showUserMenu&&<div style={{ position:"fixed",inset:0,zIndex:499 }} onClick={()=>setShowUserMenu(false)}/>}
      {showProfileModal&&<ProfileModal user={currentUser} users={users} setUsers={setUsers} onClose={()=>setShowProfileModal(false)} showToast={showToast}/>}
      {toast&&<div style={{ position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#18191b",color:"#f2f3f5",borderRadius:12,padding:"12px 24px",fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",animation:"toastIn 0.2s ease",zIndex:2000,fontFamily:"'DM Sans',sans-serif" }}>✓ {toast}</div>}
    </div>
  );
}

export default function CRM() {
  const [currentUser, setCurrentUser] = useState(() => {
    if (!lsAvailable) return null;
    try { const s = localStorage.getItem("crm_currentUser"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [roleConfig, setRoleConfig] = useState(() => {
    if (!lsAvailable) return ROLE_CONFIG;
    try { const s = localStorage.getItem("crm_roleConfig"); return s ? JSON.parse(s) : ROLE_CONFIG; } catch { return ROLE_CONFIG; }
  });
  const persistRoleConfig = (next) => {
    const resolved = typeof next === "function" ? next(roleConfig) : next;
    if (lsAvailable) { try { localStorage.setItem("crm_roleConfig", JSON.stringify(resolved)); } catch {} }
    setRoleConfig(resolved);
  };
  const handleLogin = (user) => {
    if (lsAvailable) { try { localStorage.setItem("crm_currentUser", JSON.stringify(user)); } catch {} }
    setCurrentUser(user);
  };
  const handleLogout = () => {
    if (lsAvailable) { try { localStorage.removeItem("crm_currentUser"); } catch {} }
    setCurrentUser(null);
  };
  if (!currentUser) return <LoginScreen onLogin={handleLogin} roleConfig={roleConfig}/>;
  return <CRMApp currentUser={currentUser} onLogout={handleLogout} roleConfig={roleConfig} setRoleConfig={persistRoleConfig}/>;
}
