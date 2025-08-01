import pandas as pd
import json
import os

def excel_to_json(excel_file, output_file):
    """
    엑셀 파일을 JSON으로 변환하는 함수
    """
    try:
        # 엑셀 파일의 모든 시트 읽기
        excel_data = pd.read_excel(excel_file, sheet_name=None)
        
        # 결과를 저장할 딕셔너리
        result = {}
        
        for sheet_name, df in excel_data.items():
            # DataFrame을 딕셔너리로 변환
            # NaN 값을 None으로 변환
            df_clean = df.where(pd.notnull(df), None)
            
            # 시트별로 데이터 저장
            result[sheet_name] = {
                'columns': df_clean.columns.tolist(),
                'data': df_clean.values.tolist()
            }
        
        # JSON 파일로 저장
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"변환 완료! {excel_file} -> {output_file}")
        print(f"시트 개수: {len(result)}")
        for sheet_name in result.keys():
            print(f"  - {sheet_name}: {len(result[sheet_name]['data'])}행, {len(result[sheet_name]['columns'])}열")
            
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    excel_file = "황금경로.xlsx"
    output_file = "황금경로.json"
    
    if os.path.exists(excel_file):
        excel_to_json(excel_file, output_file)
    else:
        print(f"파일을 찾을 수 없습니다: {excel_file}") 