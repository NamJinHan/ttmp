const express = require('express');
const nodemailer = require('nodemailer'); // [추가]
const app = express();

const port = process.env.PORT || 8080;

// [중요] 여기에 등록된 '기기 시리얼 번호' 목록을 추가하세요.
const ALLOWED_SERIAL_NUMBERS = [
    'R5CR81QXXXX',           
    'EMULATOR30X1X12',       
    'YOUR_DEVICE_SERIAL_HERE' 
];

// --- [추가] 이메일 발송기 설정 ---
// Gmail을 사용하며, '앱 비밀번호'를 사용해야 합니다.
// (GMAIL_USER와 GMAIL_APP_PASSWORD는 Cloud Run 환경변수에서 가져옵니다)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.GMAIL_USER,       // 👈 GMAIL_USER 환경 변수
        pass: process.env.GMAIL_APP_PASSWORD, // 👈 GMAIL_APP_PASSWORD 환경 변수
    },
});
// ---------------------------------


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


// --- [추가] 인증 실패 시 이메일 발송 엔드포인트 ---
app.get('/report-denial', (req, res) => {
    const serial = req.query.serial;

    if (!serial) {
        return res.status(400).json({ error: 'serial is required' });
    }

    const mailOptions = {
        from: `"tmAutoCall 알림" <${process.env.GMAIL_USER}>`, // 보내는 사람
        to: 'jeasukyu@gmail.com',                      // 받는 사람 (요청하신 이메일)
        subject: `[tmAutoCall] 미승인 기기 접속 시도`,       // 제목
        html: `
            <h3>미승인 기기의 접속이 감지되었습니다.</h3>
            <p>라이선스 서버에 등록되지 않은 기기가 프로그램을 실행했습니다.</p>
            <hr>
            <p><strong>시리얼 번호:</strong> ${serial}</p>
            <p><strong>접속 시간:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
        `
    };

    // 이메일 발송
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('이메일 발송 실패:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
        console.log('이메일 발송 성공 (미승인 기기 리포트):', info.response);
        res.json({ success: true });
    });
});
// ----------------------------------------------------

app.listen(port, () => {
    console.log(`라이선스 서버가 포트 ${port} 에서 실행 중입니다.`);
    console.log('등록된 시리얼 번호 목록:');
    console.log(ALLOWED_SERIAL_NUMBERS);
});
