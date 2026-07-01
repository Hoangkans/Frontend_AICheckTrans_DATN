import { useState } from 'react';
import { Camera, ShieldCheck, Mail, KeyRound, ArrowRight } from 'lucide-react';

interface AuthScreensProps {
    onAuthenticated: () => void;
}

type AuthStep = 'login' | '2fa' | 'forgot' | 'reset' | 'success';

export function AuthScreens({ onAuthenticated }: AuthScreensProps) {
    const [step, setStep] = useState<AuthStep>('login');

    const renderStep = () => {
        switch (step) {
            case 'login':
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-on-surface">Đăng nhập hệ thống</h2>
                            <p className="text-on-surface-variant text-sm mt-2">Hệ thống Giám sát & Phân tích Giao thông AIDA</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-on-surface">Tên đăng nhập / Operator ID (Nhập tùy ý)</label>
                                <input type="text" defaultValue="admin" placeholder="Nhập ID cán bộ..." className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-on-surface">Mật khẩu</label>
                                <input type="password" defaultValue="password" placeholder="••••••••" className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <div className="flex justify-end pt-1">
                                <button type="button" onClick={() => setStep('forgot')} className="text-sm text-primary hover:underline">Quên mật khẩu?</button>
                            </div>
                            <button onClick={() => setStep('2fa')} className="w-full bg-primary text-on-primary py-3 rounded-lg font-medium hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2">
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            case '2fa':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-on-surface">Xác thực bảo mật</h2>
                            <p className="text-on-surface-variant text-sm mt-2">Nhập mã xác thực 6 số gửi về điện thoại hoặc ứng dụng Authenticator của bạn.</p>
                        </div>
                        <div className="flex justify-center gap-2 mb-6">
                            {[1,2,3,4,5,6].map(i => (
                                <input key={i} type="text" maxLength={1} className="w-12 h-14 bg-surface text-center text-xl font-bold border border-outline-variant/50 rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
                            ))}
                        </div>
                        <button onClick={onAuthenticated} className="w-full bg-primary text-on-primary py-3 rounded-lg font-medium hover:bg-primary-fixed-dim transition-colors">
                            Xác thực
                        </button>
                        <button onClick={() => setStep('login')} className="w-full py-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                            Quay lại đăng nhập
                        </button>
                    </div>
                );
            case 'forgot':
                 return (
                    <div className="space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                <Mail className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-on-surface">Khôi phục mật khẩu</h2>
                            <p className="text-on-surface-variant text-sm mt-2">Nhập Operator ID hoặc Email đã đăng ký để nhận liên kết khôi phục ứng dụng.</p>
                        </div>
                         <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-on-surface">Email / Operator ID</label>
                                <input type="text" placeholder="admin@aidavision.gov.vn" className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <button onClick={() => setStep('reset')} className="w-full bg-primary text-on-primary py-3 rounded-lg font-medium hover:bg-primary-fixed-dim transition-colors">
                                Gửi mã khôi phục
                            </button>
                            <button onClick={() => setStep('login')} className="w-full py-3 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                                Quay lại đăng nhập
                            </button>
                        </div>
                    </div>
                );
            case 'reset':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                                <KeyRound className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-on-surface">Thiết lập mật khẩu mới</h2>
                            <p className="text-on-surface-variant text-sm mt-2">Vui lòng tạo một mật khẩu mạnh kết hợp các ký tự chữ cái, số và ký tự đặc biệt.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-on-surface">Mật khẩu mới</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-on-surface">Xác nhận mật khẩu</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-surface border border-outline-variant/50 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <button onClick={() => setStep('success')} className="w-full bg-primary text-on-primary py-3 rounded-lg font-medium hover:bg-primary-fixed-dim transition-colors mt-2">
                                Lưu mật khẩu mới
                            </button>
                        </div>
                    </div>
                );
            case 'success':
                 return (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface">Thành công!</h2>
                        <p className="text-on-surface-variant text-sm mt-2">Mật khẩu của bạn đã được thay đổi an toàn.</p>
                        <button onClick={() => setStep('login')} className="w-full bg-surface-container-high text-on-surface py-3 rounded-lg font-medium hover:bg-surface-container-highest transition-colors mt-6">
                            Đăng nhập ngay
                        </button>
                    </div>
                 )
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 shadow-2xl">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 text-primary">
                        <Camera className="w-8 h-8" />
                        <span className="font-bold text-2xl text-on-surface tracking-tight">AIDA Vision</span>
                    </div>
                </div>
                
                {renderStep()}
            </div>
            
            <div className="mt-8 text-center text-xs text-on-surface-variant font-mono">
                &copy; {new Date().getFullYear()} AIDA Traffic AI Systems. All rights reserved. <br/>
                Unauthorized access is strictly prohibited.
            </div>
        </div>
    );
}
