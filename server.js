const express = require('express');
const sgMail = require('@sendgrid/mail'); // [수정] SendGrid 모듈 사용
const app = express();

const port = process.env.PORT || 8080;

// [중요] 여기에 등록된 '기기 시리얼 번호' 목록을 추가하세요.
const ALLOWED_SERIAL_NUMBERS = [
    'R5CR81QXXXX',           
    'EMULATOR30X1X12',       
    'YOUR_DEVICE_SERIAL_HERE' 
];

// --- [수정] SendGrid API 키 설정 ---
// (Cloud Run 환경변수에서 API 키를 가져옵니다)
sgMail.setApiKey(process.env.SENDGRID_API_KEY); 

// --- 기존 라이선스 체크 로직 ---
app.get('/check-license', (req, res) => {
    const serial = req.query.serial;

    if (!serial) {
        console.warn('시리얼(serial)이 없는 요청이 들어왔습니다.');
        return res.status(400).json({ error: 'serial is required' });
    }

    const isAuthorized = ALLOWED_SERIAL_NUMBERS.includes(serial);
    
    if (isAuthorized) {
        console.log(`[승인] 등록된 시리얼: ${serial}`);
    } else {
        console.warn(`[거부] 미등록 시리얼: ${serial}`);
    }

    res.json({ authorized: isAuthorized });
});


// --- [수정] 인증 실패 시 SendGrid로 이메일 발송 ---
app.get('/report-denial', (req, res) => {
    const serial = req.query.serial;

    if (!serial) {
        return res.status(400).json({ error: 'serial is required' });
    }

    // [중요] SendGrid는 'from' 이메일 주소가
    // 가입 시 인증된 본인 이메일이어야 합니다.
    const msg = {
        to: 'jeasukyu@gmail.com', // 받는 사람
        from: 'ssaulabi75@gmail.com', // 👈 SendGrid에 가입/인증한 이메일
        subject: `[tmAutoCall] 미승인 기기 접속 시도`,
        html: `
            <h3>미승인 기기의 접속이 감지되었습니다.</h3>
            <p>라이선스 서버에 등록되지 않은 기기가 프로그램을 실행했습니다.</p>
            <hr>
            <p><strong>시리얼 번호:</strong> ${serial}</p>
            <p><strong>접속 시간:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
        `
    };

    // 이메일 발송
    sgMail
        .send(msg)
        .then(() => {
            console.log('이메일 발송 성공 (SendGrid 리포트)');
            res.json({ success: true });
        })
        .catch((error) => {
            console.error('SendGrid 이메일 발송 실패:', error.response.body.errors);
            res.status(500).json({ success: false, error: error.message });
        });
});
// ----------------------------------------------------

app.listen(port, () => {
    console.log(`라이선스 서버가 포트 ${port} 에서 실행 중입니다.`);
    console.log('등록된 시리얼 번호 목록:');
    console.log(ALLOWED_SERIAL_NUMBERS);
});
