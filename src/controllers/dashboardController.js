import pool from '../config/db.js';
import { getUserQuota } from '../services/quota.service.js';

export const getDashboardData = async (req, res, next) => {
    try {
        // 인증 미들웨어에서 req.user에 저장된 사용자 ID를 가져옵니다.
        const userId = req.user.id;

        // [개선] 두 개의 비동기 작업을 병렬로 실행하여 성능을 향상시킵니다.
        const [quotaData, recentPostsResult] = await Promise.all([
            getUserQuota(userId),
            pool.query(
                'SELECT id, title, status, created_at FROM posts WHERE author_id = $1 ORDER BY created_at DESC LIMIT 5',
                [userId]
            )
        ]);

        // 병렬 처리된 결과를 구조 분해하여 변수에 할당합니다.
        const { currentUsage, totalUsage } = quotaData;

        // 4. 프론트엔드 형식에 맞게 데이터 가공
        const recentPosts = recentPostsResult.rows.map(post => ({
            id: post.id,
            title: post.title,
            status: post.status,
            // 'date' 대신 'createdAt'으로 키를 통일하고, 원본 날짜 데이터를 전달합니다.
            createdAt: post.created_at,
        }));

        // 5. 최종 데이터를 JSON 형태로 응답
        res.json({
            usage: {
                current: currentUsage,
                total: totalUsage,
            },
            recentPosts,
        });
    } catch (error) {
        console.error('대시보드 데이터 조회 중 에러 발생:', error);
        next(error);
    }
};
