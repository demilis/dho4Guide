class GoldRouteManager {
    constructor() {
        this.goldrouteItems = [];
        this.goldrouteSearchInput = document.getElementById('goldrouteSearchInput');
        this.goldrouteRegionFilter = document.getElementById('goldrouteRegionFilter');
        this.goldrouteCityFilter = document.getElementById('goldrouteCityFilter');
        this.goldrouteTypeFilter = document.getElementById('goldrouteTypeFilter');
        this.goldrouteItemFilter = document.getElementById('goldrouteItemFilter');
        this.goldrouteResults = document.getElementById('goldrouteResults');
        this.goldrouteNoResults = document.getElementById('goldrouteNoResults');
        this.goldrouteLoading = document.getElementById('goldrouteLoading');
        
        // 페이징 관련 속성
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.totalPages = 1;
        this.filteredItems = [];
        
        this.isInitialized = false;
        this.isInitializing = false;
        
        // 캐시된 데이터가 있는지 확인
        if (window.goldrouteDataCache) {
            console.log(`[성능] 캐시된 데이터 사용: ${new Date().toISOString()}`);
            console.log(`[성능] 캐시된 데이터 개수: ${window.goldrouteDataCache.length}`);
            this.goldrouteItems = window.goldrouteDataCache;
            this.isInitialized = true;
            this.setupEventListeners();
            this.populateFilters();
            this.filteredItems = this.goldrouteItems;
            this.displayGoldrouteTable();
            console.log(`[성능] 캐시 사용으로 인스턴스 생성 완료: ${new Date().toISOString()}`);
        } else {
            console.log(`[성능] 캐시된 데이터 없음, 새로 로딩 시작: ${new Date().toISOString()}`);
            this.init();
        }
    }

    // 공통 유틸리티 함수들
    setElementVisible(element, displayType = 'block') {
        if (!element) return;
        
        const styles = {
            display: displayType,
            visibility: 'visible',
            opacity: '1',
            height: 'auto',
            overflow: 'visible',
            position: 'relative',
            left: 'auto',
            top: 'auto',
            zIndex: 'auto'
        };
        
        Object.entries(styles).forEach(([property, value]) => {
            element.style.setProperty(property, value, 'important');
        });
    }

    setElementHidden(element) {
        if (!element) return;
        
        const styles = {
            display: 'none',
            visibility: 'hidden',
            opacity: '0',
            height: '0',
            overflow: 'hidden',
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            zIndex: '-1'
        };
        
        Object.entries(styles).forEach(([property, value]) => {
            element.style.setProperty(property, value, 'important');
        });
    }

    async init() {
        console.log(`[성능] GoldRouteManager init 시작: ${new Date().toISOString()}`);
        
        // 이미 초기화 중이면 중복 실행 방지
        if (this.isInitializing) {
            console.log(`[성능] GoldRouteManager 이미 초기화 중, 중복 실행 방지`);
            return;
        }
        
        this.isInitializing = true;
        
        try {
            this.showLoading();
            console.log(`[성능] loadData 호출 시작: ${new Date().toISOString()}`);
            await this.loadData();
            console.log(`[성능] loadData 완료: ${new Date().toISOString()}`);
            console.log(`[성능] setupEventListeners 호출: ${new Date().toISOString()}`);
            this.setupEventListeners();
            console.log(`[성능] populateFilters 호출: ${new Date().toISOString()}`);
            this.populateFilters();
            
            // 즉시 테이블 표시 (setTimeout 제거)
            console.log(`[성능] 즉시 테이블 표시 시작: ${new Date().toISOString()}`);
            this.filteredItems = this.goldrouteItems; // 초기에는 모든 아이템을 필터링된 아이템으로 설정
            console.log(`[성능] displayGoldrouteTable 호출: ${new Date().toISOString()}`);
            this.displayGoldrouteTable();
            console.log(`[성능] hideLoading 호출: ${new Date().toISOString()}`);
            this.hideLoading();
            this.isInitialized = true;
            console.log(`[성능] GoldRouteManager init 완료: ${new Date().toISOString()}`);
            
        } catch (error) {
            console.error('황금 경로 데이터 로딩 중 오류가 발생했습니다:', error);
            this.hideLoading();
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.isInitializing = false;
        }
    }

    async loadData() {
        console.log(`[성능] loadData 시작: ${new Date().toISOString()}`);
        try {
            console.log(`[성능] fetch 시작: ${new Date().toISOString()}`);
            const response = await fetch('db/황금경로.json');
            console.log(`[성능] fetch 완료: ${new Date().toISOString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(`[성능] response.json() 시작: ${new Date().toISOString()}`);
            const data = await response.json();
            console.log(`[성능] response.json() 완료: ${new Date().toISOString()}`);
            this.goldrouteItems = data.Sheet1.data;
            
            // 데이터를 전역 캐시에 저장
            window.goldrouteDataCache = this.goldrouteItems;
            console.log(`[성능] 데이터 캐시에 저장: ${new Date().toISOString()}`);
            console.log(`[성능] 캐시에 저장된 데이터 개수: ${window.goldrouteDataCache.length}`);
            console.log(`[성능] loadData 완료, 데이터 개수: ${this.goldrouteItems.length}, ${new Date().toISOString()}`);
        } catch (error) {
            console.error('황금 경로 데이터를 불러오는 중 오류가 발생했습니다:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // 검색 이벤트
        if (this.goldrouteSearchInput) {
            this.goldrouteSearchInput.addEventListener('input', () => {
                this.performSearch();
            });
        }

        // 모든 필터 이벤트
        const filters = [
            this.goldrouteRegionFilter,
            this.goldrouteCityFilter,
            this.goldrouteTypeFilter,
            this.goldrouteItemFilter
        ];

        filters.forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.performSearch();
                });
            }
        });
    }

    populateFilters() {
        // 고유한 값들을 추출
        const regions = [...new Set(this.goldrouteItems.map(item => item[0]))].sort();
        const cities = [...new Set(this.goldrouteItems.map(item => item[2]))].sort();
        const types = [...new Set(this.goldrouteItems.map(item => item[3]))].sort();
        const items = [...new Set(this.goldrouteItems.map(item => item[4]))].sort();

        // 필터 옵션 추가 함수
        const populateFilter = (filterElement, options, placeholder) => {
            if (!filterElement) return;
            
            filterElement.innerHTML = `<option value="">${placeholder}</option>`;
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                filterElement.appendChild(optionElement);
            });
        };

        // 각 필터 초기화
        populateFilter(this.goldrouteRegionFilter, regions, '모든 지역');
        populateFilter(this.goldrouteCityFilter, cities, '모든 도시');
        populateFilter(this.goldrouteTypeFilter, types, '모든 종류');
        populateFilter(this.goldrouteItemFilter, items, '모든 교역품');
    }

    performSearch() {
        if (!this.isInitialized) {
            return;
        }
        
        const searchTerm = this.goldrouteSearchInput ? this.goldrouteSearchInput.value.toLowerCase() : '';
        const selectedRegion = this.goldrouteRegionFilter ? this.goldrouteRegionFilter.value : '';
        const selectedCity = this.goldrouteCityFilter ? this.goldrouteCityFilter.value : '';
        const selectedType = this.goldrouteTypeFilter ? this.goldrouteTypeFilter.value : '';
        const selectedItem = this.goldrouteItemFilter ? this.goldrouteItemFilter.value : '';

        let filteredItems = this.goldrouteItems;

        // 검색어로 필터링
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => {
                const [해역, 문화권, 도시, 종류, 교역품] = item;
                return 해역.toLowerCase().includes(searchTerm) ||
                       문화권.toLowerCase().includes(searchTerm) ||
                       도시.toLowerCase().includes(searchTerm) ||
                       종류.toLowerCase().includes(searchTerm) ||
                       교역품.toLowerCase().includes(searchTerm);
            });
        }

        // 필터링
        if (selectedRegion) {
            filteredItems = filteredItems.filter(item => item[0] === selectedRegion);
        }
        if (selectedCity) {
            filteredItems = filteredItems.filter(item => item[2] === selectedCity);
        }
        if (selectedType) {
            filteredItems = filteredItems.filter(item => item[3] === selectedType);
        }
        if (selectedItem) {
            filteredItems = filteredItems.filter(item => item[4] === selectedItem);
        }

        // 필터링된 결과 저장
        this.filteredItems = filteredItems;
        
        // 검색 시 첫 페이지로 초기화
        this.currentPage = 1;
        
        // 결과 표시
        this.displayFilteredResults(filteredItems);
    }

    displayFilteredResults(filteredItems) {
        if (!this.goldrouteResults) return;

        if (filteredItems.length === 0) {
            if (this.goldrouteNoResults) {
                this.goldrouteNoResults.style.display = 'block';
            }
            this.goldrouteResults.innerHTML = '';
            return;
        }

        if (this.goldrouteNoResults) {
            this.goldrouteNoResults.style.display = 'none';
        }

        // 페이징 계산
        this.calculatePagination();
        
        // 현재 페이지의 아이템들만 가져오기
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageItems = filteredItems.slice(startIndex, endIndex);

        // 테이블 생성 및 표시
        this.displayGoldrouteTable(currentPageItems);
        
        // 페이징 컨트롤 추가
        this.displayPagination();
    }

    displayGoldrouteTable(items = this.goldrouteItems) {
        console.log(`[성능] displayGoldrouteTable 시작, 아이템 수: ${items.length}, ${new Date().toISOString()}`);
        if (!items || !this.goldrouteResults) {
            console.error('displayGoldrouteTable: items 또는 goldrouteResults가 없습니다');
            return;
        }

        // 결과 컨테이너 강제 표시
        this.setElementVisible(this.goldrouteResults);
        
        // 로딩 상태 숨기기
        if (this.goldrouteLoading) {
            this.goldrouteLoading.style.display = 'none';
        }

        // 페이징 계산 (초기 로드 시)
        if (this.filteredItems.length === 0) {
            this.filteredItems = items;
            this.calculatePagination();
        }

        // 테이블 헤더 생성
        let html = `
            <div class="goldroute-table-container">
                <table class="goldroute-table">
                    <thead>
                        <tr>
                            <th>해역</th>
                            <th>문화권</th>
                            <th>도시</th>
                            <th>종류</th>
                            <th>교역품</th>
                            <th>발전도</th>
                            <th>영국</th>
                            <th>플랑드르</th>
                            <th>독일</th>
                            <th>북유럽</th>
                            <th>포르투갈</th>
                            <th>스페인</th>
                            <th>이탈리아</th>
                            <th>그리스</th>
                            <th>터키</th>
                            <th>이집트</th>
                            <th>서아프리카</th>
                            <th>동아프리카</th>
                            <th>아랍</th>
                            <th>인도</th>
                            <th>인도차이나</th>
                            <th>인도네시아</th>
                            <th>중국</th>
                            <th>조선</th>
                            <th>일본</th>
                            <th>카리브 해</th>
                            <th>멕시코</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // 데이터 행 추가
        items.forEach(item => {
            const [해역, 문화권, 도시, 종류, 교역품, 등장발전도, ...가격] = item;
            
            // 500 이상인 가격에 대해 하이라이트 클래스 추가
            const priceHtml = 가격.map(price => {
                const isHighValue = price >= 500;
                return `<td class="${isHighValue ? 'high-value' : ''}">${price}</td>`;
            }).join('');

            html += `
                <tr>
                    <td>${해역}</td>
                    <td>${문화권}</td>
                    <td>${도시}</td>
                    <td>${종류}</td>
                    <td>${교역품}</td>
                    <td>${등장발전도}</td>
                    ${priceHtml}
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        console.log(`[성능] innerHTML 설정 시작: ${new Date().toISOString()}`);
        this.goldrouteResults.innerHTML = html;
        console.log(`[성능] displayGoldrouteTable 완료: ${new Date().toISOString()}`);
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        this.goldrouteResults.innerHTML = '';
        this.goldrouteResults.appendChild(errorElement);
    }

    showLoading() {
        if (this.goldrouteLoading) {
            this.goldrouteLoading.style.display = 'flex';
        }
        if (this.goldrouteResults) {
            this.goldrouteResults.style.display = 'none';
        }
        if (this.goldrouteNoResults) {
            this.goldrouteNoResults.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.goldrouteLoading) {
            this.goldrouteLoading.style.display = 'none';
        }
        if (this.goldrouteResults) {
            this.goldrouteResults.style.display = 'block';
        }
    }

    // 페이징 계산
    calculatePagination() {
        this.totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        
        // 현재 페이지가 총 페이지 수를 초과하면 마지막 페이지로 조정
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
        
        // 최소 1페이지 보장
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }
    }

    // 페이징 컨트롤 표시
    displayPagination() {
        if (this.totalPages <= 1) {
            return; // 페이징이 필요없으면 표시하지 않음
        }

        const paginationContainer = document.getElementById('goldroutePagination');
        if (!paginationContainer) {
            // 페이징 컨테이너가 없으면 생성
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'goldroutePagination';
            paginationDiv.className = 'pagination';
            this.goldrouteResults.parentNode.appendChild(paginationDiv);
        }

        const pagination = document.getElementById('goldroutePagination');
        if (!pagination) return;

        let paginationHTML = '<div class="pagination-controls">';
        
        // 이전 페이지 버튼
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="window.goldrouteManager.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> 이전
            </button>`;
        }
        
        // 페이지 번호들
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="pagination-page current">${i}</span>`;
            } else {
                paginationHTML += `<button class="pagination-btn" onclick="window.goldrouteManager.goToPage(${i})">${i}</button>`;
            }
        }
        
        // 다음 페이지 버튼
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="window.goldrouteManager.goToPage(${this.currentPage + 1})">
                다음 <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        paginationHTML += '</div>';
        
        // 페이지 정보 표시
        paginationHTML += `<div class="pagination-info">
            ${this.currentPage} / ${this.totalPages} 페이지 
            (총 ${this.filteredItems.length}개 중 ${(this.currentPage - 1) * this.itemsPerPage + 1}-${Math.min(this.currentPage * this.itemsPerPage, this.filteredItems.length)}개)
        </div>`;
        
        pagination.innerHTML = paginationHTML;
        this.setElementVisible(pagination);
    }

    // 특정 페이지로 이동
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.displayFilteredResults(this.filteredItems);
            
            // 페이지 상단으로 스크롤
            this.goldrouteResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// 페이지 로드 시 GoldRouteManager 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    window.goldRouteManager = new GoldRouteManager();
});