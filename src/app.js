import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import helmet from 'helmet'; // 보안 강화를 위해 helmet 추가

import './config/db.js'; // DB 연결 실행

// --- 라우터 임포트 ---
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// --- 🔥 수정된 CORS 설정 ---
const corsOptions = {
  origin: [
    'http://localhost:3000',                          // React 개발 서버
    'http://localhost:5173',                          // Vite 개발 서버
    'https://ai-secretary-36b03.web.app',            // Firebase Hosting
    'https://ai-secretary-36b03.firebaseapp.com',    // Firebase 백업 도메인
    process.env.CORS_ORIGIN                           // 환경변수로 추가 도메인 허용
  ].filter(Boolean), // undefined 값 제거
  credentials: true, // 쿠키를 포함한 요청을 허용합니다.
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
};

// --- 미들웨어 설정 ---
app.use(helmet()); // HTTP 헤더 보안 설정
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// --- 🔥 디버깅용 테스트 라우터 ---
app.get('/test', (req, res) => {
  res.json({ 
    message: '✅ 백엔드 서버 정상 작동!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API 라우터 정상!',
    routes: [
      'GET /api/auth/verify',
      'POST /api/auth/login', 
      'POST /api/auth/register',
      'POST /api/auth/register-test (DB 없이)',
      'POST /api/auth/login-test (DB 없이)',
      'GET /api/auth/verify-test (DB 없이)'
    ]
  });
});

// --- API 라우트 연결 ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);

// --- 404 핸들러 ---
app.use((req, res, next) => {
  res.status(404).json({ 
    message: '요청하신 API 경로를 찾을 수 없습니다.',
    path: req.path,
    method: req.method
  });
});

// --- 중앙 에러 핸들러 ---
app.use((err, req, res, next) => {
  console.error('🚨 서버 에러:', err); // 디버깅을 위해 전체 에러 객체를 로깅합니다.
  
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 프로덕션 환경이고 예측하지 못한 서버 오류일 경우, 상세 메시지를 숨깁니다.
  const message = (isProduction && statusCode === 500)
    ? '서버 내부 오류가 발생했습니다.'
    : err.message;

  res.status(statusCode).json({ 
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }) // 개발 환경에서만 스택 트레이스 포함
  });
});

// --- 서버 실행 ---
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ 서버가 ${PORT}번 포트에서 실행 중입니다.`);
  console.log(`🌐 서버 URL: http://localhost:${PORT}`);
  console.log(`🧪 테스트 URL: http://localhost:${PORT}/test`);
});