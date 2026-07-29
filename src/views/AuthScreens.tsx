import { useState, useEffect } from 'react';
import { Camera, Mail, KeyRound, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../lib/api';

interface AuthScreensProps {
  onAuthenticated: () => void;
}

type AuthStep = 'login' | 'register' | 'verify-email' | 'change-password' | 'forgot';

export function AuthScreens({ onAuthenticated }: AuthScreensProps) {
  const [step, setStep] = useState<AuthStep>('login');
  
  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');

  // Email verification state
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Forgot password & OTP state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Password Visibility Toggle States
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Check URL query parameters for otp/token/email (e.g. /verify-email?otp=123456&email=admin@example.com)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const otpParam = urlParams.get('otp') || urlParams.get('token');
      const emailParam = urlParams.get('email');
      if (otpParam) {
        setVerifyOtp(otpParam);
        if (emailParam) setVerifyEmail(emailParam);
        setStep('verify-email');
      } else if (emailParam) {
        setVerifyEmail(emailParam);
      }
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.login(username, password);
      setIsOfflineMode(!res.isOnline);
      setSuccessMsg('Đăng nhập thành công!');
      setTimeout(() => {
        onAuthenticated();
      }, 500);
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập không thành công.';
      setError(msg);
      if (msg.toLowerCase().includes('chua xac thuc email') || msg.toLowerCase().includes('chưa xác thực email')) {
        if (username.includes('@')) {
          setVerifyEmail(username);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        fullName: regFullName
      });
      setIsOfflineMode(!res.isOnline);
      setVerifyEmail(regEmail);
      setSuccessMsg('Đăng ký tài khoản thành công! Mã OTP xác thực đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.');
      setStep('verify-email');
    } catch (err: any) {
      setError(err.message || 'Đăng ký tài khoản thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyOtp) {
      setError('Vui lòng nhập mã OTP 6 chữ số.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.verifyEmail(verifyOtp, verifyEmail);
      setIsOfflineMode(!res.isOnline);
      setSuccessMsg(res.data?.message || 'Xác thực email thành công! Bạn có thể đăng nhập ngay.');
      setVerifyOtp('');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Xác thực email thất bại. Mã OTP có thể không chính xác hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verifyEmail) {
      setError('Vui lòng nhập Email để gửi lại mã OTP xác thực.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.resendVerification(verifyEmail);
      setSuccessMsg(res.data?.message || 'Nếu email tồn tại và chưa xác thực, hệ thống đã gửi lại mã OTP.');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại email xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Vui lòng nhập email tài khoản.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setOtpSent(true);
      setSuccessMsg(res.data?.message || 'Nếu email tồn tại, hệ thống đã gửi mã OTP xác thực.');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP đặt lại mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotOtp || !forgotNewPassword) {
      setError('Vui lòng điền đầy đủ Email, Mã OTP và Mật khẩu mới.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.resetPassword(forgotEmail, forgotOtp, forgotNewPassword);
      setSuccessMsg(res.data?.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setOtpSent(false);
      setForgotOtp('');
      setForgotNewPassword('');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Mã OTP có thể không chính xác hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword
      });
      setSuccessMsg(res.data?.message || 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setCurrentPassword('');
      setNewPassword('');
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-on-surface">Đăng nhập hệ thống</h2>
              <p className="text-on-surface-variant text-sm mt-1">Hệ thống Giám sát & Phân tích Giao thông AIDA</p>
            </div>

            {error && (
              <div className="p-3.5 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-semibold space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {(error.toLowerCase().includes('chua xac thuc email') || error.toLowerCase().includes('chưa xác thực email')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setStep('verify-email');
                    }}
                    className="w-full bg-error/20 hover:bg-error/30 text-error font-medium py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <span>Nhập mã OTP xác thực tài khoản ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface">Tên đăng nhập / Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username hoặc email..."
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-4 pr-11 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => { setError(null); setSuccessMsg(null); setStep('register'); }}
                  className="text-primary hover:underline font-medium cursor-pointer"
                >
                  Chưa có tài khoản? Đăng ký
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setError(null); setSuccessMsg(null); setStep('forgot'); }}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                  <button
                    type="button"
                    onClick={() => { setError(null); setSuccessMsg(null); setStep('verify-email'); }}
                    className="text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
                  >
                    Xác thực OTP
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary-fixed-dim text-on-primary py-3 rounded-xl font-medium hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang kiểm tra...
                  </>
                ) : (
                  <>
                    Đăng nhập <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        );

      case 'register':
        return (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-on-surface">Đăng ký tài khoản</h2>
              <p className="text-on-surface-variant text-sm mt-1">Đăng ký Operator mới cho hệ thống giám sát</p>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Họ và tên</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Tên đăng nhập (Username) *</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Nhập username..."
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Địa chỉ Email *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface">Mật khẩu *</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="•••••••• (tối thiểu 6 ký tự)"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-4 pr-11 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors cursor-pointer"
                    title={showRegPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Đăng ký tài khoản <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setSuccessMsg(null); setStep('login'); }}
                className="w-full py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface cursor-pointer text-center"
              >
                Đã có tài khoản? Đăng nhập ngay
              </button>
            </div>
          </form>
        );

      case 'verify-email':
        return (
          <form onSubmit={handleVerifyEmailSubmit} className="space-y-6">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Mail className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-on-surface">Xác thực Email bằng OTP</h2>
              <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
                Nhập mã OTP 6 chữ số được gửi qua Email của bạn để kích hoạt tài khoản.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface">Địa chỉ Email</label>
                <input
                  type="email"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface">Mã OTP (6 chữ số) *</label>
                <input
                  type="text"
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ví dụ: 123456"
                  maxLength={6}
                  className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-lg font-mono tracking-widest text-center text-on-surface focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Xác thực tài khoản'}
              </button>

              <div className="border-t border-outline-variant/20 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Chưa nhận được mã OTP?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Gửi lại mã OTP
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setError(null); setSuccessMsg(null); setStep('login'); }}
                  className="w-full py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface cursor-pointer text-center"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          </form>
        );

      case 'change-password':
        return (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <KeyRound className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-on-surface">Đổi mật khẩu</h2>
              <p className="text-on-surface-variant text-xs mt-1.5">Cập nhật mật khẩu mới cho tài khoản của bạn</p>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface">Mật khẩu hiện tại *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-4 pr-11 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors cursor-pointer"
                    title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="•••••••• (tối thiểu 6 ký tự)"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-4 pr-11 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors cursor-pointer"
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lưu mật khẩu mới'}
              </button>

              <button
                type="button"
                onClick={() => { setError(null); setSuccessMsg(null); setStep('login'); }}
                className="w-full py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface cursor-pointer text-center"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        );

      case 'forgot':
        return (
          <div className="space-y-6">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <KeyRound className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-on-surface">Quên mật khẩu</h2>
              <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
                {!otpSent
                  ? 'Nhập email tài khoản để nhận mã OTP xác thực đặt lại mật khẩu.'
                  : 'Nhập mã OTP 6 chữ số vừa gửi về email và mật khẩu mới của bạn.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/30 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface">Địa chỉ Email *</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Gửi mã OTP qua Email'}
                </button>

                <button
                  type="button"
                  onClick={() => { setError(null); setSuccessMsg(null); setStep('login'); }}
                  className="w-full py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface cursor-pointer text-center"
                >
                  Quay lại đăng nhập
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface">Mã OTP (6 chữ số) *</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Ví dụ: 123456"
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface font-mono tracking-widest text-center focus:outline-none focus:border-primary transition-all"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="•••••••• (tối thiểu 6 ký tự)"
                      className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-4 pr-11 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors cursor-pointer"
                      title={showForgotNewPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Xác nhận đổi mật khẩu'}
                </button>

                <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="hover:text-on-surface underline cursor-pointer"
                  >
                    Gửi lại OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => { setError(null); setSuccessMsg(null); setStep('login'); }}
                    className="hover:text-on-surface underline cursor-pointer"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface-container-lowest/90 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/30 shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-2xl text-on-surface tracking-tight">AIDA Vision</span>
          </div>
        </div>

        {renderStep()}
      </div>

      <div className="mt-8 text-center text-xs text-on-surface-variant font-mono relative z-10">
        &copy; {new Date().getFullYear()} AIDA Traffic Monitoring AI Platform. All rights reserved.
      </div>
    </div>
  );
}
