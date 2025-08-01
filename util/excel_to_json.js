const XLSX = require('xlsx');
const fs = require('fs');

function excelToJson(excelFile, outputFile) {
    try {
        // 엑셀 파일 읽기
        const workbook = XLSX.readFile(excelFile);
        
        // 결과를 저장할 객체
        const result = {};
        
        // 각 시트 처리
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            
            // 시트를 JSON으로 변환
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: null 
            });
            
            if (jsonData.length > 0) {
                const headers = jsonData[0];
                const data = jsonData.slice(1);
                
                result[sheetName] = {
                    columns: headers,
                    data: data
                };
            }
        });
        
        // JSON 파일로 저장
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
        
        console.log(`변환 완료! ${excelFile} -> ${outputFile}`);
        console.log(`시트 개수: ${Object.keys(result).length}`);
        
        Object.keys(result).forEach(sheetName => {
            const sheet = result[sheetName];
            console.log(`  - ${sheetName}: ${sheet.data.length}행, ${sheet.columns.length}열`);
        });
        
    } catch (error) {
        console.error(`오류 발생: ${error.message}`);
    }
}

// 실행
const excelFile = '황금경로.xlsx';
const outputFile = '황금경로.json';

if (fs.existsSync(excelFile)) {
    excelToJson(excelFile, outputFile);
} else {
    console.log(`파일을 찾을 수 없습니다: ${excelFile}`);
} 