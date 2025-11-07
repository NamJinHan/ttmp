const express = require('express');
const sgMail = require('@sendgrid/mail'); 
const app = express();

const port = process.env.PORT || 8080;

const ALLOWED_SERIAL_NUMBERS = [
    'RFCT910CYRE',           
    'EMULATOR30X1X12',       
    'YOUR_DEVICE_SERIAL_HERE' 
];

sgMail.setApiKey(process.env.SENDGRID_API_KEY); 

app.get('/check-license', (req, res) => {
    // [수정] req.query.serial을 받은 즉시 .trim()으로 공백/줄바꿈을 제거합니다.
    const serial = req.query.serial ? req.query.serial.trim() : null;

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

app.get('/report-denial', (req, res) => {
    // [수정] 리포트할 때도 .trim()을 적용합니다.
    const serial = req.query.serial ? req.query.serial.trim() : null;

    if (!serial) {
        return res.status(400).json({ error: 'serial is required' });
    }

    const msg = {
        to: 'ssaulabi75@gmail.com', 
        from: 'YOUR_VERIFIED_EMAIL@example.com', // 👈 SendGrid에 인증한 이메일
        subject: `[tmAutoCall] 미승인 기기 접속 시도`,
        html: `
            <h3>미승인 기기의 접속이 감지되었습니다.</h3>
            <p>라이선스 서버에 등록되지 않은 기기가 프로그램을 실행했습니다.</p>
            <hr>
            <p><strong>시리얼 번호:</strong> ${serial}</p>
            <p><strong>접속 시간:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
        `
    };

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

app.listen(port, () => {
    console.log(`라이선스 서버가 포트 ${port} 에서 실행 중입니다.`);
    console.log('등록된 시리얼 번호 목록:');
    console.log(ALLOWED_SERIAL_NUMBERS);
});
