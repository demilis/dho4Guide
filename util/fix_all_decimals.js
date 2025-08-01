const fs = require('fs');

function fixDecimalsInFile(jsonFile) {
    try {
        // JSON 파일 읽기
        let content = fs.readFileSync(jsonFile, 'utf8');
        
        // NaN 값을 null로 변환
        content = content.replace(/: NaN/g, ': null');
        
        const data = JSON.parse(content);
        let modified = false;
        
        // 재귀적으로 객체를 탐색하여 소수점 제거
        function fixDecimalsRecursive(obj) {
            if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    if (typeof item === 'number' && !isNaN(item)) {
                        const rounded = Math.round(item);
                        if (rounded !== item) {
                            obj[index] = rounded;
                            modified = true;
                        }
                    } else if (typeof item === 'object' && item !== null) {
                        fixDecimalsRecursive(item);
                    }
                });
            } else if (typeof obj === 'object' && obj !== null) {
                Object.keys(obj).forEach(key => {
                    if (typeof obj[key] === 'number' && !isNaN(obj[key])) {
                        const rounded = Math.round(obj[key]);
                        if (rounded !== obj[key]) {
                            obj[key] = rounded;
                            modified = true;
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        fixDecimalsRecursive(obj[key]);
                    }
                });
            }
        }
        
        fixDecimalsRecursive(data);
        
        if (modified) {
            // 수정된 JSON 파일로 저장
            fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2), 'utf8');
            console.log(`소수점 제거 완료: ${jsonFile}`);
        } else {
            console.log(`소수점 없음: ${jsonFile}`);
        }
        
    } catch (error) {
        console.error(`오류 발생 (${jsonFile}): ${error.message}`);
    }
}

// 모든 JSON 파일 처리
const jsonFiles = [
    '황금항로 계산기_sample.json',
    'calculator_trade_data.json',
    'calculator_ports.json',
    'calculator_settings.json',
    '데이터_sample.json',
    '교역데이터_sample.json',
    '무역 계산기_sample.json',
    'dh4_ver4.json',
    '동료얻기.json',
    '아지자.json',
    '일반동료얻기.json'
];

jsonFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fixDecimalsInFile(file);
    }
}); 