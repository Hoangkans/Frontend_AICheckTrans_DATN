/**
 * Module Client API Core: Quản lý HTTP Fetch, Token JWT (Access & Refresh),
 * kiểm tra Backend Health và hệ thống Debug Logger cho DevTools.
 */

// Địa chỉ gốc của Server Backend FastAPI
const BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Interface cấu trúc log ghi nhận nhật ký gọi API
 */
export interface ApiLogEntry {
  timestamp: string;
  method: string;
  url: string;
  payload: any;
  status?: number;
  success: boolean;
  data?: any;
  error?: string;
}

// Khởi tạo công cụ Debug API trong Console Trình duyệt
if (typeof window !== 'undefined') {
  (window as any).apiDebug = {
    logs: [] as ApiLogEntry[],
    lastError: null as ApiLogEntry | null,
    getLogs: () => (window as any).apiDebug.logs,
    clearLogs: () => { (window as any).apiDebug.logs = []; },
    setForceOffline: (force: boolean) => {
      localStorage.setItem('force_offline', force ? 'true' : 'false');
      console.log(`%c[API_DEBUG] Chế độ Offline giả lập = ${force}`, 'color: #4cd7f6; font-weight: bold;');
    },
    isForcedOffline: () => localStorage.getItem('force_offline') === 'true'
  };
}

/**
 * Kiểm tra trạng thái máy chủ Backend FastAPI có phản hồi hay không.
 * Endpoint gửi request: GET http://localhost:8000/health
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (typeof window !== 'undefined' && (window as any).apiDebug?.isForcedOffline()) {
    return false;
  }
  try {
    const res = await fetch('http://localhost:8000/health', { method: 'GET', signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Lấy Access Token JWT từ bộ nhớ LocalStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Lấy Refresh Token JWT từ bộ nhớ LocalStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/**
 * Lưu cặp Token JWT (Access & Refresh) vào LocalStorage sau khi đăng nhập thành công
 */
export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

/**
 * Xóa sạch Tokens và thông tin người dùng khỏi LocalStorage khi Đăng xuất
 */
export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Hàm gửi HTTP Request tổng quát (Wrapper xung quanh Fetch API)
 * - Tự động đính kèm Authorization Header (Bearer token)
 * - Tự động ghi log Debug
 * - Xử lý chuyển đổi dữ liệu JSON và catch lỗi HTTP Server
 * 
 * @param path Đường dẫn tương đối (ví dụ: '/auth/login', '/users')
 * @param options Cấu hình Fetch Request (method, body, headers...)
 */
export async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAccessToken();
  
  // Đính kèm token và Content-Type mặc định
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${BASE_URL}${path}`;
  const requestPayload = options.body ? JSON.parse(options.body as string) : null;
  
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (e: any) {
    // Ghi nhận lỗi kết nối mạng (Server sập hoặc mất mạng)
    const errorLog: ApiLogEntry = {
      timestamp: new Date().toISOString(),
      method: options.method || 'GET',
      url,
      payload: requestPayload,
      success: false,
      error: `Lỗi kết nối mạng: ${e.message}`
    };
    if (typeof window !== 'undefined' && (window as any).apiDebug) {
      (window as any).apiDebug.logs.push(errorLog);
      (window as any).apiDebug.lastError = errorLog;
    }
    console.error(
      `%c[LỖI KẾT NỐI API] ${options.method || 'GET'} ${path}`, 
      'color: #ffb4ab; font-weight: bold; background-color: #1f0101; padding: 4px; border-radius: 4px;',
      e.message
    );
    throw new Error(`Không thể kết nối đến máy chủ API: ${e.message}`);
  }

  // Đọc nội dung phản hồi từ Server
  const responseText = await response.text();
  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    responseData = { text: responseText };
  }

  // Ghi log chi tiết phản hồi vào DevTools Logger
  const logEntry: ApiLogEntry = {
    timestamp: new Date().toISOString(),
    method: options.method || 'GET',
    url,
    payload: requestPayload,
    status: response.status,
    success: response.ok,
    data: response.ok ? responseData : undefined,
    error: !response.ok ? (responseData.detail || `Lỗi HTTP ${response.status}`) : undefined
  };

  if (typeof window !== 'undefined' && (window as any).apiDebug) {
    (window as any).apiDebug.logs.push(logEntry);
    if (!response.ok) {
      (window as any).apiDebug.lastError = logEntry;
      console.error(
        `%c[LỖI HTTP API] ${options.method || 'GET'} ${path} - Status: ${response.status}`, 
        'color: #ffb4ab; font-weight: bold; background-color: #1f0101; padding: 4px; border-radius: 4px;',
        responseData.detail || responseText
      );
    } else {
      console.log(
        `%c[API THÀNH CÔNG] ${options.method || 'GET'} ${path}`,
        'color: #4cd7f6; font-weight: bold;'
      );
    }
  }

  // Nếu HTTP Status không nằm trong dải 200-299, ném ngoại lệ với chi tiết lỗi từ FastAPI
  if (!response.ok) {
    throw new Error(responseData.detail || `Lỗi HTTP ${response.status}`);
  }

  // Xử lý status 204 No Content
  if (response.status === 204) {
    return null;
  }

  return responseData;
}
