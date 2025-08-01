const fs = require('fs');

function fixDecimals(jsonFile, outputFile) {
    try {
        // JSON 파일 읽기
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        
        // 각 시트의 데이터에서 소수점 제거
        Object.keys(data).forEach(sheetName => {
            const sheet = data[sheetName];
            
            // 데이터 행들을 처리
            sheet.data.forEach(row => {
                row.forEach((cell, index) => {
                    // 숫자인 경우 소수점 제거
                    if (typeof cell === 'number') {
                        row[index] = Math.round(cell);
                    }
                });
            });
        });
        
        // 수정된 JSON 파일로 저장
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
        
        console.log(`소수점 제거 완료! ${jsonFile} -> ${outputFile}`);
        
    } catch (error) {
        console.error(`오류 발생: ${error.message}`);
    }
}

// 실행
const inputFile = '황금경로.json';
const outputFile = '황금경로_fixed.json';

if (fs.existsSync(inputFile)) {
    fixDecimals(inputFile, outputFile);
} else {
    console.log(`파일을 찾을 수 없습니다: ${inputFile}`);
} 