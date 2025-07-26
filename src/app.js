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

// --- 미들웨어 설정 ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true, // 쿠키를 포함한 요청을 허용합니다.
  optionsSuccessStatus: 200,
};
app.use(helmet()); // HTTP 헤더 보안 설정
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// --- API 라우트 연결 ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);

// --- 404 핸들러 ---
app.use((req, res, next) => {
  res.status(404).json({ message: '요청하신 API 경로를 찾을 수 없습니다.' });
});

// --- 중앙 에러 핸들러 ---
app.use((err, req, res, next) => {
  console.error(err); // 디버깅을 위해 전체 에러 객체를 로깅합니다.
  
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 프로덕션 환경이고 예측하지 못한 서버 오류일 경우, 상세 메시지를 숨깁니다.
  const message = (isProduction && statusCode === 500)
    ? '서버 내부 오류가 발생했습니다.'
    : err.message;

  res.status(statusCode).json({ message });
});

// --- 서버 실행 ---
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
