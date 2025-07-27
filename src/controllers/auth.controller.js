import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { createJwtPayload, signAndSetCookie } from '../services/token.service.js';

/**
 * 데이터베이스 사용자 객체를 프론트엔드 응답 형식으로 변환합니다.
 * @param {object} dbUser - 데이터베이스에서 조회한 사용자 객체 (snake_case)
 * @returns {object} 프론트엔드에 전달할 사용자 객체 (camelCase)
 */
const _transformUserForResponse = (dbUser) => {
  if (!dbUser) {
    return null;
  }
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    position: dbUser.position,
    regionMetro: dbUser.region_metro,
    regionLocal: dbUser.region_local,
    electoralDistrict: dbUser.electoral_district,
  };
};

/**
 * @description 사용자 회원가입을 처리하는 컨트롤러
 */
export const register = async (req, res, next) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' });
  }

  try {
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 새 사용자 추가
    // DB 컬럼명에 맞게 full_name -> name 으로 수정
    const newUserResult = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, position, role, region_metro, region_local, electoral_district, created_at',
      [email, hashedPassword, fullName]
    );

    const dbUser = newUserResult.rows[0];
    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.', user: _transformUserForResponse(dbUser) });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    next(error);
  }
};

/**
 * @description 사용자 로그인을 처리하는 컨트롤러
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 모두 입력해주세요.' });
    }

    // DB 컬럼명에 맞게 full_name -> name 으로 수정
    const result = await pool.query(
      'SELECT id, email, name, password, position, role, region_metro, region_local, electoral_district FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 페이로드 생성 및 토큰 발급
    const payload = createJwtPayload(user);
    signAndSetCookie(res, payload);

    // JWT 페이로드(payload)가 아닌, 완전한 사용자 정보(userForFrontend)를 전달
    res.status(200).json({ message: '로그인 성공!', user: _transformUserForResponse(user) });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * @description 사용자 로그아웃을 처리하는 컨트롤러
 */
export const logout = (req, res, next) => {
  res.clearCookie('authToken', { path: '/' });
  res.status(200).json({ message: '로그아웃 되었습니다.' });
};

/**
 * @description 토큰 유효성을 검증하는 컨트롤러
 */
export const verify = async (req, res, next) => {
  try {
    // verifyToken 미들웨어에서 JWT 페이로드를 req.user에 저장했습니다.
    const userId = req.user?.id;
    if (!userId) {
      // 이 경우는 verifyToken 미들웨어에서 이미 처리했겠지만, 방어적으로 코딩합니다.
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // DB에서 최신 사용자 정보를 조회합니다.
    const result = await pool.query(
      'SELECT id, email, name, role, position, region_metro, region_local, electoral_district FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const dbUser = result.rows[0];

    res.status(200).json({ message: '토큰이 유효합니다.', user: _transformUserForResponse(dbUser) });
  } catch (error) {
    console.error('Token verification error:', error);
    next(error);
  }
};

/**
 * 🔥 임시 테스트용 회원가입 (DB 없이)
 */
export const registerTest = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ 
        success: false,
        error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' 
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '올바른 이메일 형식을 입력해주세요.'
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '비밀번호는 6자 이상이어야 합니다.'
      });
    }

    // 기존 사용자 체크 (임시)
    if (email === 'existing@test.com') {
      return res.status(409).json({
        success: false,
        error: '이미 존재하는 이메일입니다.'
      });
    }

    // 임시 응답 (DB 저장 없이)
    res.status(201).json({ 
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: Date.now(),
        email: email,
        name: fullName,
        role: 'user',
        position: null,
        regionMetro: null,
        regionLocal: null,
        electoralDistrict: null
      },
      token: 'temp-register-token-' + Date.now()
    });
  } catch (error) {
    console.error('Register test error:', error);
    next(error);
  }
};

/**
 * 🔥 임시 테스트용 로그인 (DB 없이)
 */
export const loginTest = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: '이메일과 비밀번호를 모두 입력해주세요.' 
      });
    }

    // 임시 로그인 (test@test.com / test123)
    if (email === 'test@test.com' && password === 'test123') {
      res.status(200).json({ 
        success: true,
        message: '로그인 성공!',
        user: {
          id: 1,
          email: email,
          name: '테스트 사용자',
          role: 'user',
          position: '시의원',
          regionMetro: '서울시',
          regionLocal: '강남구',
          electoralDistrict: '강남구을'
        },
        token: 'temp-jwt-token-' + Date.now()
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다. (test@test.com / test123)'
      });
    }
  } catch (error) {
    console.error('Login test error:', error);
    next(error);
  }
};

/**
 * 🔥 임시 테스트용 토큰 검증 (DB 없이)
 */
export const verifyTest = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization token required' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // 임시 토큰 검증
    if (token.startsWith('temp-')) {
      return res.status(200).json({
        success: true,
        message: '토큰이 유효합니다.',
        user: {
          id: 1,
          email: 'test@test.com',
          name: '테스트 사용자',
          role: 'user',
          position: '시의원',
          regionMetro: '서울시',
          regionLocal: '강남구',
          electoralDistrict: '강남구을'
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
  } catch (error) {
    console.error('Verify test error:', error);
    next(error);
  }
};