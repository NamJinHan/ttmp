const express = require('express');
const app = express();

// [수정] GCP가 지정하는 포트를 사용하거나, 없을 경우 8080을 사용
const port = process.env.PORT || 8080;

// [중요] 여기에 등록된 유심번호(ICCID) 목록을 추가하세요.
const ALLOWED_ICCIDS = [
    '1234567890123456789', // 예시 번호 1
    '9876543210987654321', // 예시 번호 2
    'YOUR_SIM_ICCID_HERE'  // 실제 등록할 유심 번호
];

app.get('/check-license', (req, res) => {
    const iccid = req.query.iccid;

    if (!iccid) {
        console.warn('ICCID가 없는 요청이 들어왔습니다.');
        return res.status(400).json({ error: 'ICCID is required' });
    }

    const isAuthorized = ALLOWED_ICCIDS.includes(iccid);
    
    if (isAuthorized) {
        console.log(`[승인] 등록된 ICCID: ${iccid}`);
    } else {
        console.warn(`[거부] 미등록 ICCID: ${iccid}`);
    }

    res.json({ authorized: isAuthorized });
});

// [수정] '0.0.0.0' 호스트 지정을 제거하고 포트만 사용합니다.
app.listen(port, () => {
    console.log(`라이선스 서버가 포트 ${port} 에서 실행 중입니다.`);
    console.log('등록된 ICCID 목록:');
    console.log(ALLOWED_ICCIDS);
});