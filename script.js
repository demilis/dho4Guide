class ItemSearchApp {
    constructor() {
        // 디버깅 로그 제거
        this.items = [];
        this.filteredItems = [];
        this.searchInput = document.getElementById('searchInput');
        this.typeFilter = document.getElementById('typeFilter');
        this.positionFilter = document.getElementById('positionFilter');
        this.regionFilter = document.getElementById('regionFilter');
        this.characterFilter = document.getElementById('characterFilter');
        this.mainCharacterFilter = document.getElementById('mainCharacterFilter');
        this.acquiredFilter = document.getElementById('acquiredFilter');
        this.resultsContainer = document.getElementById('results');
        this.noResultsElement = document.getElementById('noResults');
        this.totalCountElement = document.getElementById('totalCount');
        this.filteredCountElement = document.getElementById('filteredCount');
        this.currentView = 'list';
        
        // 페이징 관련 속성
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
        
        this.acquiredItems = this.loadAcquiredItems();
        
        // 탭 전환 중복 방지
        this.isTabSwitching = false;
        this.lastTabSwitchTime = 0;
        
        // 탭 관련 요소들 추가
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 일반동료 관련 요소들
        this.crewData = null;
        this.crewSearchInput = document.getElementById('crewSearchInput');
        this.crewCharacterFilter = document.getElementById('crewCharacterFilter');
        this.crewResults = document.getElementById('crewResults');
        this.crewSearchStats = document.getElementById('crewSearchStats');
        
        // 특수동료 관련 요소들
        this.specialCrewData = null;
        this.specialCrewContent = document.getElementById('specialCrewContent');
        
        this.init();
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

    clearElementContent(element) {
        if (element && element.innerHTML) {
            element.innerHTML = '';
        }
    }

    // 성능 최적화된 DOM 요소 정리 함수
    clearElementsBySelectors(selectors, clearContent = true) {
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementHidden(element);
                if (clearContent) {
                    this.clearElementContent(element);
                }
            }
        });
    }

    async init() {
        try {
            await this.loadData();
            console.log('초기화 시작 - crewData 상태:', this.crewData ? this.crewData.length : 'null');
            
            this.setupEventListeners();
            this.setupTabNavigation();
            this.setupCrewSubmenu();
            this.updateStats();
            this.switchView();
            this.displayItems();
            this.performCrewSearch();
            this.displaySpecialCrew();
            
            // 모든 컨텐츠를 강제로 정리
            this.forceClearAllContent();
            
            // 홈 탭으로 초기화
            this.switchTabFinal('home');
            
        } catch (error) {
            console.error('데이터 로딩 중 오류가 발생했습니다:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    // 탭 네비게이션 설정
    setupTabNavigation() {
        if (this.tabButtons.length === 0) {
            this.tabButtons = document.querySelectorAll('.tab-btn');
        }
        
        this.tabButtons.forEach((button, index) => {
            // 기존 이벤트 리스너 제거 (중복 방지)
            button.removeEventListener('click', this.handleTabClick);
            
            // 새로운 이벤트 리스너 추가
            button.addEventListener('click', this.handleTabClick.bind(this));
        });
    }
    
    // 탭 클릭 핸들러
    handleTabClick(e) {
        const button = e.currentTarget;
        const targetTab = button.getAttribute('data-tab');
        
        // 탭 전환 중복 방지
        const now = Date.now();
        if (this.isTabSwitching || (now - this.lastTabSwitchTime) < 100) {
            console.log(`[성능] 탭 전환 중복 방지: ${targetTab}`);
            return;
        }
        
        this.isTabSwitching = true;
        this.lastTabSwitchTime = now;
        
        console.log(`[성능] 아이템 검색 버튼 클릭 시작: ${new Date().toISOString()}`);
        this.switchTabFinal(targetTab);
    }

    // 탭 전환 함수
    switchTabFinal(tabName) {
        try {
            
            // 모든 탭 버튼에서 active 클래스 제거
            if (this.tabButtons) {
                this.tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
            }
            
            // 모든 탭 컨텐츠에서 active 클래스 제거 (CSS !important 규칙 때문에 중요)
            if (this.tabContents) {
                this.tabContents.forEach(content => {
                    content.classList.remove('active');
                });
            }
            
            // 선택된 탭 버튼에 active 클래스 추가
            const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            } else {
                console.error('탭 버튼을 찾을 수 없음:', tabName);
            }
            
            // 선택된 탭 컨텐츠에 active 클래스 추가 (CSS가 자동으로 표시/숨김 처리)
            const activeContent = document.getElementById(`${tabName}-tab`);
            if (activeContent) {
                activeContent.classList.add('active');
                console.log('활성 탭 컨텐츠 설정:', activeContent.id);
            } else {
                console.error('탭 컨텐츠를 찾을 수 없음:', `${tabName}-tab`);
            }
            
            console.log('initializeTabContent 호출 직전');
            // 각 탭별 초기화 및 기능 실행
            this.initializeTabContent(tabName);
            console.log('initializeTabContent 호출 완료');
            
            // 탭 전환 완료 후 플래그 해제
            setTimeout(() => {
                this.isTabSwitching = false;
            }, 50);
            
        } catch (error) {
            console.error('switchTab 함수에서 오류 발생:', error);
            this.isTabSwitching = false;
        }
    }

    // 탭별 초기화 함수
    initializeTabContent(tabName) {
        console.log(`initializeTabContent 호출됨: ${tabName}`);
        
        const tabInitializers = {
            'search': () => this.initializeSearchTab(),
            'goldroute': () => this.initializeGoldrouteTab(),
            'board': () => this.initializeBoardTab(),
            'crew': () => this.initializeCrewTab(),
            'map': () => this.initializeMapTab(),
            'home': () => this.initializeHomeTab(),
            'tavern': () => this.initializeTavernTab()
        };

        const initializer = tabInitializers[tabName];
        if (initializer) {
            console.log(`${tabName} 탭 초기화 함수 실행`);
            try {
                initializer();
            } catch (error) {
                console.error(`${tabName} 탭 초기화 오류:`, error);
            }
        } else {
            console.warn(`${tabName} 탭에 대한 초기화 함수가 없습니다.`);
        }
    }

    // 검색 탭 초기화
    initializeSearchTab() {
        console.log(`[성능] initializeSearchTab 시작: ${new Date().toISOString()}`);
        try {
            // 다른 탭의 요소들을 숨기기 (배치 처리로 성능 향상)
            const elementsToHide = [
                '#goldrouteResults',
                '#goldrouteNoResults',
                '#goldrouteLoading',
                '#crewResults',
                '#crewSearchStats'
            ];
            
            elementsToHide.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    this.setElementHidden(element);
                }
            });
            
            // 아이템 검색 관련 요소들을 한 번에 표시
            const searchElements = [
                '.stats-section',
                '#totalCount',
                '#filteredCount',
                '#listHeader',
                '.results-section',
                '#results'
            ];
            
            searchElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    // 인라인 스타일 제거 (필요한 것만)
                    element.style.removeProperty('display');
                    element.style.removeProperty('visibility');
                    element.style.removeProperty('opacity');
                    element.style.removeProperty('height');
                    element.style.removeProperty('overflow');
                    element.style.removeProperty('position');
                    element.style.removeProperty('left');
                    element.style.removeProperty('top');
                    element.style.removeProperty('z-index');
                    
                    // 기본 표시 스타일 적용
                    this.setElementVisible(element);
                }
            });
        
            // resultsContainer 확인 및 설정
            if (!this.resultsContainer) {
                this.resultsContainer = document.getElementById('results');
            }
            
            if (this.resultsContainer) {
                this.resultsContainer.classList.add('list-view');
            }
            
            // 리스트 헤더 표시
            const listHeader = document.getElementById('listHeader');
            if (listHeader) {
                this.setElementVisible(listHeader, 'flex');
            }
            
            // 즉시 검색 실행 (지연 제거)
            if (this.items && this.items.length > 0) {
                console.log(`[성능] performSearch 호출 시작: ${new Date().toISOString()}`);
                this.performSearch();
            } else {
                // 데이터가 없으면 비동기로 로드 후 검색
                console.log(`[성능] loadData 호출 시작: ${new Date().toISOString()}`);
                this.loadData().then(() => {
                    console.log(`[성능] loadData 완료 후 performSearch 호출: ${new Date().toISOString()}`);
                    this.performSearch();
                });
            }
        } catch (error) {
            console.error('initializeSearchTab 오류:', error);
        }
    }

    // 황금항로 탭 초기화
    initializeGoldrouteTab() {
        console.log(`[성능] initializeGoldrouteTab 시작: ${new Date().toISOString()}`);
        // 아이템 검색 관련 요소들을 숨기기
        const searchElementsToHide = [
            '.stats-section',
            '#totalCount',
            '#filteredCount',
            '#listHeader',
            '.results-section',
            '#results',
            '#noResults'
        ];
        
        searchElementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementHidden(element);
            }
        });
        
        // 항해사 등용 관련 요소들을 숨기기
        const crewElementsToHide = [
            '#crewResults',
            '#crewSearchStats'
        ];
        
        crewElementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementHidden(element);
            }
        });
        
        // 황금항로 관련 요소들을 명시적으로 표시
        const goldrouteElementsToShow = [
            '#goldrouteResults',
            '#goldrouteNoResults',
            '#goldrouteLoading'
        ];
        
        goldrouteElementsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementVisible(element, 'block');
            }
        });
        
        console.log(`[성능] initializeGoldroute 호출 시작: ${new Date().toISOString()}`);
        this.initializeGoldroute();
        console.log(`[성능] checkGoldrouteLoading 호출 시작: ${new Date().toISOString()}`);
        this.checkGoldrouteLoading();
        console.log(`[성능] initializeGoldrouteTab 완료: ${new Date().toISOString()}`);
    }

    // 자유게시판 탭 초기화
    initializeBoardTab() {
        this.initializeBoard();
    }

    // 항해주점 탭 초기화
    initializeTavernTab() {
        // 항해주점은 별도의 숨기기/표시 로직이 필요 없음
        console.log('항해주점 탭 초기화 완료');
    }

    // 항해사 등용 탭 초기화
    initializeCrewTab() {
        // 아이템 검색 관련 요소들을 숨기기
        const searchElementsToHide = [
            '.stats-section',
            '#totalCount',
            '#filteredCount',
            '#listHeader',
            '.results-section',
            '#results',
            '#noResults'
        ];
        
        searchElementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementHidden(element);
            }
        });
        
        // 황금항로 관련 요소들을 숨기기
        const goldrouteElementsToHide = [
            '#goldrouteResults',
            '#goldrouteNoResults',
            '#goldrouteLoading'
        ];
        
        goldrouteElementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementHidden(element);
            }
        });
        
        // 요소들을 다시 찾아서 확인
        this.crewResults = document.getElementById('crewResults');
        this.crewSearchInput = document.getElementById('crewSearchInput');
        this.crewCharacterFilter = document.getElementById('crewCharacterFilter');
        this.crewSearchStats = document.getElementById('crewSearchStats');
        
        // crewResults 요소를 명시적으로 표시
        if (this.crewResults) {
            this.setElementVisible(this.crewResults, 'block');
        }
        
        // crewSearchStats 요소를 명시적으로 표시
        if (this.crewSearchStats) {
            this.setElementVisible(this.crewSearchStats, 'block');
        }
        
        // 일반동료 데이터가 로드되었는지 확인
        if (!this.crewData) {
            console.error('일반동료 데이터가 로드되지 않았습니다.');
            if (this.crewResults) {
                this.crewResults.innerHTML = `
                    <div class="no-crew-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>데이터 로딩 오류</h3>
                        <p>일반동료 데이터를 불러올 수 없습니다. 페이지를 새로고침해주세요.</p>
                    </div>
                `;
            }
            return;
        }
        
        // crewResults 요소가 존재하는지 확인
        if (!this.crewResults) {
            console.error('crewResults 요소를 찾을 수 없습니다.');
            return;
        }
        
        this.performCrewSearch();
    }

    // 보급항 지도 탭 초기화
    initializeMapTab() {
        this.clearSearchResultsOnly();
    }

    // 홈 탭 초기화
    initializeHomeTab() {
        this.forceClearAllContent();
        
        // 아이템 검색 관련 요소들을 숨기기
        const searchElementsToHide = [
            '.stats-section',
            '#totalCount',
            '#filteredCount',
            '#listHeader',
            '.results-section',
            '#results',
            '#noResults'
        ];
        
        searchElementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementHidden(element);
            }
        });
        
        // 홈 탭만 active 클래스 유지
        const homeTab = document.getElementById('home-tab');
        if (homeTab) {
            homeTab.classList.add('active');
        }
    }

    // 모든 컨텐츠 강제 정리
    forceClearAllContent() {
        const goldrouteElements = [
            '#goldrouteResults',
            '#goldrouteNoResults',
            '#goldrouteLoading'
        ];
        
        const crewElements = [
            '#crewResults',
            '#crewSearchStats'
        ];
        
        this.clearElementsBySelectors(goldrouteElements, false); // 로딩은 내용 유지
        this.clearElementsBySelectors(crewElements);
        
        // 모든 탭 컨텐츠에서 active 클래스 제거 (홈 탭 제외)
        this.tabContents.forEach(content => {
            if (content.id !== 'home-tab') {
                content.classList.remove('active');
            }
        });
    }

    // 모든 검색 결과 숨기기
    clearAllSearchResults() {
        const elementsToHide = [
            '.stats-section',
            '#totalCount',
            '#filteredCount',
            '#listHeader',
            '.results-section',
            '#results',
            '#noResults',
            '#goldrouteResults',
            '#goldrouteNoResults',
            '#crew-results'
        ];
        
        this.clearElementsBySelectors(elementsToHide);
    }

    // 아이템 검색 결과만 숨기기
    clearSearchResultsOnly() {
        const searchElements = [
            '#noResults'
            // '.stats-section' 제거 - 통계는 숨기지 않음
            // '#totalCount' 제거 - 전체 개수는 숨기지 않음
            // '#filteredCount' 제거 - 필터링 개수는 숨기지 않음
            // '#listHeader' 제거 - 리스트 헤더는 숨기지 않음
            // '.results-section' 제거 - 결과 섹션은 숨기지 않음
            // '#results' 제거 - results 요소는 숨기지 않음
            // '#crew-results' 제거 - crew 결과는 숨기지 않음
        ];
        
        this.clearElementsBySelectors(searchElements);
    }

    // 검색 탭 요소들 다시 표시
    showSearchElements() {
        const elementsToShow = [
            { selector: '.stats-section', display: 'block' },
            { selector: '#totalCount', display: 'inline' },
            { selector: '#filteredCount', display: 'inline' },
            { selector: '#listHeader', display: 'flex' },
            { selector: '.results-section', display: 'block' },
            { selector: '#results', display: 'grid' }
        ];
        
        elementsToShow.forEach(({ selector, display }) => {
            const element = document.querySelector(selector);
            if (element) {
                this.setElementVisible(element, display);
            }
        });
        
        // 아이템 검색 결과 컨테이너 표시
        if (this.resultsContainer) {
            this.setElementVisible(this.resultsContainer, 'grid');
        }
        
        // 아이템 검색 결과 없음 메시지 숨기기
        if (this.noResultsElement) {
            this.setElementHidden(this.noResultsElement);
        }
    }

    // 항해사 등용 서브메뉴 설정
    setupCrewSubmenu() {
        const submenuButtons = document.querySelectorAll('.submenu-btn');
        const submenuPanels = document.querySelectorAll('.submenu-panel');
        
        submenuButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSubmenu = button.getAttribute('data-submenu');
                
                // 모든 서브메뉴 버튼에서 active 클래스 제거
                submenuButtons.forEach(btn => btn.classList.remove('active'));
                
                // 모든 서브메뉴 패널 숨기기
                submenuPanels.forEach(panel => panel.classList.remove('active'));
                
                // 선택된 서브메뉴 버튼에 active 클래스 추가
                button.classList.add('active');
                
                // 선택된 서브메뉴 패널 표시
                const activePanel = document.getElementById(`${targetSubmenu}-crew`);
                if (activePanel) {
                    activePanel.classList.add('active');
                }
            });
        });
    }

    async loadData() {
        try {
            console.log('데이터 로딩 시작...');
            
            // 아이템 데이터 로드
            const response = await fetch('db/dh4_ver4.json');
            if (!response.ok) {
                throw new Error('JSON 파일을 불러올 수 없습니다.');
            }
            this.items = await response.json();
            this.filteredItems = [...this.items];
            console.log('아이템 데이터 로드 완료:', this.items.length, '개');

            // 일반동료 데이터 로드
            const crewResponse = await fetch('db/일반동료얻기.json');
            if (!crewResponse.ok) {
                throw new Error('일반동료 데이터를 불러올 수 없습니다.');
            }
            this.crewData = await crewResponse.json();
            console.log('일반동료 데이터 로드 완료:', this.crewData ? this.crewData.length : 'null', '개');
            
            // 특수동료 아지자 데이터 로드
            const specialCrewResponse = await fetch('db/아지자.json');
            if (!specialCrewResponse.ok) {
                throw new Error('아지자 데이터를 불러올 수 없습니다.');
            }
            this.specialCrewData = await specialCrewResponse.json();
            console.log('특수동료 데이터 로드 완료:', this.specialCrewData ? this.specialCrewData.length : 'null', '개');
            
            console.log('모든 데이터 로딩 완료');

        } catch (error) {
            console.error('데이터 로딩 오류:', error);
            throw error;
        }
    }

    loadAcquiredItems() {
        const saved = localStorage.getItem('acquiredItems');
        return saved ? JSON.parse(saved) : {};
    }

    saveAcquiredItems() {
        localStorage.setItem('acquiredItems', JSON.stringify(this.acquiredItems));
    }

    toggleAcquiredItem(itemIndex) {
        if (this.acquiredItems[itemIndex]) {
            delete this.acquiredItems[itemIndex];
        } else {
            this.acquiredItems[itemIndex] = true;
        }
        this.saveAcquiredItems();
        this.performSearch(); // 검색 결과 업데이트
    }

    setupEventListeners() {
        // 검색 입력 이벤트 (디바운싱 적용)
        if (this.searchInput) {
            let searchTimeout;
            this.searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch();
                }, 300); // 300ms 디바운싱
            });
        }

        // 필터 변경 이벤트 - 이벤트 위임 사용
        document.addEventListener('change', (e) => {
            if (e.target.matches('#typeFilter, #regionFilter, #characterFilter, #mainCharacterFilter, #acquiredFilter')) {
                console.log('필터 변경됨:', e.target.id, '값:', e.target.value);
                this.handleFilterChange();
            } else if (e.target.matches('#positionFilter')) {
                console.log('보직 필터 변경됨:', e.target.id, '값:', e.target.value);
                // 보직 필터는 updatePositionFilter 호출하지 않고 바로 검색만 실행
                this.performSearch();
            }
        });

        // 엔터키 이벤트
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // 일반동료 검색 이벤트
        if (this.crewSearchInput) {
            let crewSearchTimeout;
            this.crewSearchInput.addEventListener('input', () => {
                clearTimeout(crewSearchTimeout);
                crewSearchTimeout = setTimeout(() => {
                    this.performCrewSearch();
                }, 300);
            });
        }

        if (this.crewCharacterFilter) {
            this.crewCharacterFilter.addEventListener('change', () => {
                this.performCrewSearch();
            });
        }
        
        // 교역품 검색 이벤트
        if (this.specialtySearchInput) {
            let specialtySearchTimeout;
            this.specialtySearchInput.addEventListener('input', () => {
                clearTimeout(specialtySearchTimeout);
                specialtySearchTimeout = setTimeout(() => {
                    this.performSpecialtySearch();
                }, 300);
            });
            
            this.specialtySearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSpecialtySearch();
                }
            });
        }
        
        if (this.specialtyRegionFilter) {
            this.specialtyRegionFilter.addEventListener('change', () => {
                this.performSpecialtySearch();
            });
        }
        
        if (this.specialtyTypeFilter) {
            this.specialtyTypeFilter.addEventListener('change', () => {
                this.performSpecialtySearch();
            });
        }
    }

    // 필터 변경 핸들러 (최적화된)
    handleFilterChange() {
        // 종류 필터가 변경되면 보직 필터 업데이트
        if (this.typeFilter && this.positionFilter) {
            this.updatePositionFilter();
        }
        
        // 캐릭터 필터가 변경되면 주인공 필터 업데이트
        if (this.characterFilter && this.mainCharacterFilter) {
            this.updateMainCharacterFilter();
        }
        
        // 주인공 필터가 변경되면 캐릭터 필터 업데이트
        if (this.mainCharacterFilter && this.characterFilter) {
            this.updateCharacterFilter();
        }
        
        // 검색 실행
        this.performSearch();
    }

    // 성능 최적화된 검색 함수
    performSearch() {
        console.log(`[성능] performSearch 시작: ${new Date().toISOString()}`);
        if (!this.searchInput || !this.resultsContainer) {
            console.error('필수 DOM 요소를 찾을 수 없습니다.');
            return;
        }
        
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const selectedType = this.typeFilter.value;
        const selectedPosition = this.positionFilter.value;
        const selectedRegion = this.regionFilter.value;
        const selectedCharacter = this.characterFilter.value;
        const selectedMainCharacter = this.mainCharacterFilter.value;
        const selectedAcquired = this.acquiredFilter.value;
        
        console.log('필터 값들:', {
            searchTerm,
            selectedType,
            selectedPosition,
            selectedRegion,
            selectedCharacter,
            selectedMainCharacter,
            selectedAcquired
        });

        // 필터링 최적화
        this.filteredItems = this.items.filter(item => {
            // 빈 아이템 제외
            if (!item.이름 && !item.인덱스) {
                return false;
            }
            
            // 이름 및 인덱스 검색
            const nameMatch = !searchTerm || 
                (item.이름 && item.이름.toLowerCase().includes(searchTerm)) ||
                (item.인덱스 && item.인덱스.toLowerCase().includes(searchTerm));

            if (!nameMatch) return false;

            // 종류 필터
            const itemType = this.getItemType(item);
            const typeMatch = !selectedType || itemType === selectedType;
            
            if (!typeMatch) return false;

            // 보직 필터
            let positionMatch = true;
            if (selectedPosition) {
                // 특정 보직이 선택된 경우
                positionMatch = item.보직 && item.보직 === selectedPosition;
                console.log(`아이템 "${item.이름}" 보직 필터링: 보직="${item.보직}", 선택="${selectedPosition}", 매치=${positionMatch}`);
            } else {
                // "모든 보직"이 선택된 경우 - 모든 아이템 포함 (보직 유무 상관없이)
                positionMatch = true;
            }
            
            if (!positionMatch) return false;

            // 지역 필터
            let regionMatch = true;
            if (selectedRegion) {
                if (item.지역 && typeof item.지역 === 'string') {
                    regionMatch = item.지역 === selectedRegion;
                } else if (item.지역 && typeof item.지역 === 'object') {
                    regionMatch = item.지역['구 캐릭터'] === selectedRegion || 
                                 item.지역['신 캐릭터'] === selectedRegion;
                } else {
                    regionMatch = false;
                }
            }
            
            if (!regionMatch) return false;

            // 캐릭터 필터
            let characterMatch = true;
            if (selectedCharacter) {
                if (selectedCharacter === '구 캐릭터') {
                    characterMatch = item.지역 && (
                        (typeof item.지역 === 'object' && item.지역['구 캐릭터'] !== null) ||
                        (typeof item.지역 === 'string')
                    );
                } else if (selectedCharacter === '신 캐릭터') {
                    characterMatch = item.지역 && (
                        (typeof item.지역 === 'object' && item.지역['신 캐릭터'] !== null) ||
                        (typeof item.지역 === 'string')
                    );
                }
            }
            
            if (!characterMatch) return false;

            // 주인공 캐릭터 필터
            let mainCharacterMatch = true;
            if (selectedMainCharacter) {
                mainCharacterMatch = this.checkMainCharacterCondition(item, selectedMainCharacter);
            }
            
            if (!mainCharacterMatch) return false;

            // 획득여부 필터
            let acquiredMatch = true;
            if (selectedAcquired) {
                const isAcquired = this.acquiredItems[item.인덱스] || false;
                if (selectedAcquired === 'acquired') {
                    acquiredMatch = isAcquired;
                } else if (selectedAcquired === 'not-acquired') {
                    acquiredMatch = !isAcquired;
                }
            }
            
            return acquiredMatch;
        });

        // 무기와 방어구는 효과치 높은 순으로 정렬
        this.sortItemsByEffect();

        // 검색 시 첫 페이지로 초기화
        this.currentPage = 1;
        
        console.log(`[성능] performSearch 필터링 완료, 필터링된 아이템 수: ${this.filteredItems.length}, ${new Date().toISOString()}`);

        this.updateStats();
        this.displayItems();
    }

    updateStats() {
        const acquiredCount = Object.keys(this.acquiredItems).length;
        const progressPercentage = this.items.length > 0 ? Math.round((acquiredCount / this.items.length) * 100) : 0;
        
        if (this.totalCountElement) {
            this.totalCountElement.textContent = `총 ${this.items.length}개 아이템 (획득: ${acquiredCount}개, ${progressPercentage}%)`;
        }
        if (this.filteredCountElement) {
            this.filteredCountElement.textContent = `검색 결과: ${this.filteredItems.length}개`;
        }
    }

    displayItems() {
        console.log(`[성능] displayItems 시작: ${new Date().toISOString()}`);
        if (!this.resultsContainer) {
            console.error('resultsContainer를 찾을 수 없습니다.');
            return;
        }
        
        if (this.filteredItems.length === 0) {
            this.resultsContainer.innerHTML = '';
            if (this.noResultsElement) {
                this.setElementVisible(this.noResultsElement);
            }
            return;
        }

        if (this.noResultsElement) {
            this.setElementHidden(this.noResultsElement);
        }
        
        // 페이징 계산
        this.calculatePagination();
        
        // 현재 페이지의 아이템들만 가져오기
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageItems = this.filteredItems.slice(startIndex, endIndex);
        
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        
        // HTML 생성 최적화
        const html = currentPageItems.map(item => this.createItemCard(item, searchTerm)).join('');
        
        // DOM 업데이트 최적화
        this.resultsContainer.innerHTML = html;
        
        // 페이징 컨트롤 추가
        this.displayPagination();
        
        console.log(`[성능] displayItems 완료: ${new Date().toISOString()}`);
    }

    switchView() {
        this.currentView = 'list';
        
        // 헤더 표시
        const listHeader = document.getElementById('listHeader');
        if (listHeader) {
            this.setElementVisible(listHeader, 'flex');
        }
        
        // 뷰 클래스 업데이트
        this.updateViewClass();
    }

    updateViewClass() {
        if (this.resultsContainer) {
            this.resultsContainer.classList.add('list-view');
            
            // 강제로 리플로우 트리거
            this.resultsContainer.offsetHeight;
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

        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) {
            // 페이징 컨테이너가 없으면 생성
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'pagination';
            paginationDiv.className = 'pagination';
            this.resultsContainer.parentNode.appendChild(paginationDiv);
        }

        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        let paginationHTML = '<div class="pagination-controls">';
        
        // 이전 페이지 버튼
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="app.goToPage(${this.currentPage - 1})">
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
                paginationHTML += `<button class="pagination-btn" onclick="app.goToPage(${i})">${i}</button>`;
            }
        }
        
        // 다음 페이지 버튼
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="app.goToPage(${this.currentPage + 1})">
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
            this.displayItems();
            
            // 페이지 상단으로 스크롤
            this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }



    createItemCard(item, searchTerm) {
        // 빠른 검증
        if (!item.이름 && !item.인덱스) {
            return '';
        }
        
        // 캐시된 값들 미리 계산
        const selectedCharacter = this.characterFilter?.value || '';
        const selectedMainCharacter = this.mainCharacterFilter?.value || '';
        const itemTypeValue = this.getItemType(item);
        
        const highlightedName = this.highlightText(item.이름 || '', searchTerm);
        const highlightedIndex = this.highlightText(item.인덱스 || '', searchTerm);
        
        // 효과 표시 (다양한 형태 지원)
        let effectText = '';
        let showEffectSeparately = false;
        if (item.효과) {
            if (typeof item.효과 === 'number') {
                effectText = `${item.효과}`;
            } else {
                effectText = `${item.효과}`;
            }
            // 선수상과 항해용품의 경우 효과를 별도 영역에 표시
            if (itemTypeValue === '선수상' || itemTypeValue === '항해용품') {
                showEffectSeparately = true;
            }
        }
        
        // 보직 정보 표시 (장비품의 경우)
        let positionText = '';
        if (item.보직 && itemTypeValue === '장비품') {
            positionText = `${item.보직}`;
        }
        
        // 지역 정보 처리
        let regionInfo = '';
        if (item.지역) {
            if (typeof item.지역 === 'string') {
                // 원산물의 경우
                regionInfo = `
                    <div class="detail-group">
                        <div class="detail-label">지역</div>
                        <div class="detail-value">${item.지역}</div>
                    </div>
                `;
            } else {
                // 일반 아이템의 경우 - 선택된 캐릭터 정보 강조
                const selectedCharacter = this.characterFilter.value;
                const selectedMainCharacter = this.mainCharacterFilter.value;
                
                let oldCharacterInfo = this.createDetailGroup('구 캐릭터', item.지역['구 캐릭터'], item.위치['구 캐릭터']);
                let newCharacterInfo = this.createDetailGroup('신 캐릭터', item.지역['신 캐릭터'], item.위치['신 캐릭터']);
                
                // 선택된 캐릭터 정보만 표시
                if (selectedMainCharacter) {
                    if (['라파엘', '릴', '마리아', '호드람'].includes(selectedMainCharacter)) {
                        // 구 캐릭터 선택 시 구 캐릭터 정보만 표시
                        oldCharacterInfo = oldCharacterInfo.replace('detail-group', 'detail-group selected-character');
                        regionInfo = oldCharacterInfo;
                    } else if (['교타로', '웃딘', '티알'].includes(selectedMainCharacter)) {
                        // 신 캐릭터 선택 시 신 캐릭터 정보만 표시
                        newCharacterInfo = newCharacterInfo.replace('detail-group', 'detail-group selected-character');
                        regionInfo = newCharacterInfo;
                    }
                } else {
                    // 주인공이 선택되지 않았을 때는 모든 정보 표시
                    if (selectedCharacter === '구 캐릭터') {
                        oldCharacterInfo = oldCharacterInfo.replace('detail-group', 'detail-group selected-character');
                        regionInfo = oldCharacterInfo;
                    } else if (selectedCharacter === '신 캐릭터') {
                        newCharacterInfo = newCharacterInfo.replace('detail-group', 'detail-group selected-character');
                        regionInfo = newCharacterInfo;
                    } else {
                        regionInfo = oldCharacterInfo + newCharacterInfo;
                    }
                }
            }
        }
        
        // 추가 정보 (원산물의 사용처 등)
        let additionalInfo = '';
        if (item.사용처) {
            additionalInfo = `
                <div class="item-condition">
                    <div class="condition-label">사용처</div>
                    <div class="condition-text">${item.사용처}</div>
                </div>
            `;
        } else if (item.조건 && !item['좋아하는 여급 위치']) {
            // 여성이 동경하는 물건이 아닌 경우에만 조건을 여기에 표시
            additionalInfo = this.createConditionSection(item.조건);
        }

        // 여성이 동경하는 물건의 경우 좋아하는 여급 위치와 획득조건 표시
        let hostessInfo = '';
        let conditionInfo = '';
        if (item['좋아하는 여급 위치']) {
            hostessInfo = `<div class="item-hostess">좋아하는 여급 위치: ${item['좋아하는 여급 위치']}</div>`;
            
            // 획득조건(조건)
            if (item.조건) {
                const selectedCharacter = this.characterFilter.value;
                const selectedMainCharacter = this.mainCharacterFilter.value;
                
                let cond = '';
                if (typeof item.조건 === 'string') {
                    cond = item.조건;
                } else if (typeof item.조건 === 'object') {
                    if (selectedMainCharacter) {
                        if (['라파엘', '릴', '마리아', '호드람'].includes(selectedMainCharacter)) {
                            cond = item.조건['구 캐릭터'] || '';
                        } else if (['교타로', '웃딘', '티알'].includes(selectedMainCharacter)) {
                            cond = item.조건['신 캐릭터'] || '';
                        }
                    } else if (selectedCharacter === '구 캐릭터') {
                        cond = item.조건['구 캐릭터'] || '';
                    } else if (selectedCharacter === '신 캐릭터') {
                        cond = item.조건['신 캐릭터'] || '';
                    } else {
                        const oldCond = item.조건['구 캐릭터'] ? `구: ${item.조건['구 캐릭터']}` : '';
                        const newCond = item.조건['신 캐릭터'] ? `신: ${item.조건['신 캐릭터']}` : '';
                        cond = [oldCond, newCond].filter(Boolean).join(' | ');
                    }
                }
                if (cond) {
                    conditionInfo = `<div class="item-condition-final">획득조건: ${cond}</div>`;
                }
            }
        }

        // 리스트 뷰용 형식
        const oldCharInfo = item.지역 && typeof item.지역 === 'object' ? 
            `${item.지역['구 캐릭터'] || '정보 없음'} | ${item.위치['구 캐릭터'] || '정보 없음'}` : '정보 없음';
        const newCharInfo = item.지역 && typeof item.지역 === 'object' ? 
            `${item.지역['신 캐릭터'] || '정보 없음'} | ${item.위치['신 캐릭터'] || '정보 없음'}` : '정보 없음';
        
        let conditionText = '';
        if (item.조건) {
            if (typeof item.조건 === 'string') {
                conditionText = item.조건;
            } else if (typeof item.조건 === 'object') {
                const oldCond = item.조건['구 캐릭터'] ? `구: ${item.조건['구 캐릭터']}` : '';
                const newCond = item.조건['신 캐릭터'] ? `신: ${item.조건['신 캐릭터']}` : '';
                conditionText = [oldCond, newCond].filter(Boolean).join(' | ');
            }
        }
        
        // 원산물의 경우 사용처 정보를 획득조건 영역에 표시
        if (this.getItemType(item) === '원산물' && item.사용처) {
            conditionText = `사용처: ${item.사용처}`;
        }
        
        // 항해용품의 경우 효과를 기타 영역에 표시
        if (this.getItemType(item) === '항해용품' && item.효과) {
            conditionText = `효과: ${item.효과}`;
        }
        
        // 여성이 동경하는 물건의 경우 좋아하는 여급 위치와 조건을 기타 영역에 표시
        if (this.getItemType(item) === '여성이 동경하는 물건') {
            let hostessText = '';
            if (item['좋아하는 여급 위치']) {
                hostessText = `좋아하는 여급 위치: ${item['좋아하는 여급 위치']}`;
            }
            
            let conditionPart = '';
            if (item.조건) {
                if (typeof item.조건 === 'string') {
                    conditionPart = item.조건;
                } else if (typeof item.조건 === 'object') {
                    const oldCond = item.조건['구 캐릭터'] ? `구: ${item.조건['구 캐릭터']}` : '';
                    const newCond = item.조건['신 캐릭터'] ? `신: ${item.조건['신 캐릭터']}` : '';
                    conditionPart = [oldCond, newCond].filter(Boolean).join(' | ');
                }
            }
            
            if (hostessText && conditionPart) {
                conditionText = `${hostessText}<br>${conditionPart}`;
            } else if (hostessText) {
                conditionText = hostessText;
            } else if (conditionPart) {
                conditionText = conditionPart;
            }
        }
        
        // 선수상일 때 클릭 가능한 아이콘 추가
        const itemType = this.getItemType(item);
        let nameWithIcon = highlightedName;
        if (itemType === '선수상') {
            nameWithIcon = `${highlightedName} <span class="figurehead-icon" onclick="app.showFigureheadAbility('${item.인덱스}', event)">⚓</span>`;
        }

        // 획득 상태 체크박스 추가
        const isAcquired = this.acquiredItems[item.인덱스] || false;
        const checkbox = `<input type="checkbox" class="acquired-checkbox" ${isAcquired ? 'checked' : ''} onchange="app.toggleAcquiredItem('${item.인덱스}')">`;
        
        return `
            <div class="item-card">
                <div class="item-name">${checkbox} ${nameWithIcon}${!showEffectSeparately && effectText ? ` (${effectText})` : ''}</div>
                <div class="item-old-char">${oldCharInfo}</div>
                <div class="item-new-char">${newCharInfo}</div>
                <div class="item-type">${this.getItemType(item) === '장비품' && positionText ? positionText : this.getItemType(item)}</div>
                <div class="item-condition">${conditionText}</div>
            </div>
        `;
    }

    createDetailGroup(characterType, region, location) {
        const regionText = region || '정보 없음';
        const locationText = location || '정보 없음';
        
        return `
            <div class="detail-group">
                <div class="detail-label">${characterType}</div>
                <div class="detail-value">지역: ${regionText}</div>
                <div class="detail-value">위치: ${locationText}</div>
            </div>
        `;
    }

    createConditionSection(condition) {
        const oldCondition = condition['구 캐릭터'];
        const newCondition = condition['신 캐릭터'];
        
        if (!oldCondition && !newCondition) {
            return '';
        }

        let conditionText = '';
        if (oldCondition && newCondition) {
            conditionText = `구 캐릭터: ${oldCondition}\n신 캐릭터: ${newCondition}`;
        } else if (oldCondition) {
            conditionText = `구 캐릭터: ${oldCondition}`;
        } else if (newCondition) {
            conditionText = `신 캐릭터: ${newCondition}`;
        }

        return `
            <div class="item-condition">
                <div class="condition-label">획득 조건</div>
                <div class="condition-text">${conditionText.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }

    highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    showItemDetails(itemIndex) {
        const item = this.items.find(i => i.인덱스 === itemIndex);
        if (!item) return;

        let details = `아이템 상세 정보:\n`;
        details += `- 이름: ${item.이름 || '정보 없음'}\n`;
        details += `- 종류: ${this.getItemType(item)}\n`;
        
        if (item.효과) {
            const itemType = this.getItemType(item);
            if (itemType === '선수상') {
                details += `- 선수상 능력: ${item.효과}\n`;
            } else {
                details += `- 효과: ${item.효과}\n`;
            }
        }
        
        // 지역 정보 처리
        if (item.지역) {
            if (typeof item.지역 === 'string') {
                details += `- 지역: ${item.지역}\n`;
            } else {
                details += `- 구 캐릭터 지역: ${item.지역['구 캐릭터'] || '정보 없음'}\n`;
                details += `- 신 캐릭터 지역: ${item.지역['신 캐릭터'] || '정보 없음'}\n`;
            }
        }
        
        // 위치 정보 처리
        if (item.위치) {
            if (typeof item.위치 === 'string') {
                details += `- 위치: ${item.위치}\n`;
            } else {
                details += `- 구 캐릭터 위치: ${item.위치['구 캐릭터'] || '정보 없음'}\n`;
                details += `- 신 캐릭터 위치: ${item.위치['신 캐릭터'] || '정보 없음'}\n`;
            }
        }
        
        // 사용처 정보
        if (item.사용처) {
            details += `- 사용처: ${item.사용처}\n`;
        }
        
        // 조건 정보
        if (item.조건) {
            if (item.조건['구 캐릭터']) {
                details += `- 구 캐릭터 조건: ${item.조건['구 캐릭터']}\n`;
            }
            if (item.조건['신 캐릭터']) {
                details += `- 신 캐릭터 조건: ${item.조건['신 캐릭터']}\n`;
            }
        }
        
        // 여성이 동경하는 물건의 경우
        if (item['좋아하는 여급 위치']) {
            details += `- 좋아하는 여급 위치: ${item['좋아하는 여급 위치']}\n`;
        }
        
        // 주인공 캐릭터 정보 추가
        details += `\n- 사용 가능한 주인공:\n`;
        const availableCharacters = this.getAvailableCharacters(item);
        details += availableCharacters;
        
        // 선택된 캐릭터 정보 강조
        const selectedMainCharacter = this.mainCharacterFilter.value;
        if (selectedMainCharacter) {
            const characterGroups = {
                '라파엘': '구 캐릭터',
                '릴': '구 캐릭터', 
                '마리아': '구 캐릭터',
                '호드람': '구 캐릭터',
                '교타로': '신 캐릭터',
                '웃딘': '신 캐릭터',
                '티알': '신 캐릭터'
            };
            
            const characterGroup = characterGroups[selectedMainCharacter];
            details += `\n- 선택된 캐릭터 (${selectedMainCharacter}): ${characterGroup}`;
        }

        alert(details);
    }

    checkMainCharacterCondition(item, selectedMainCharacter) {
        // 모든 아이템을 표시하도록 수정
        return true;
    }

    getItemType(item) {
        // 이미 종류가 설정되어 있으면 그대로 사용
        if (item.종류) {
            return item.종류;
        }
        
        // 인덱스 기반으로 종류 자동 설정
        const index = item.인덱스;
        if (!index) {
            return '장비품'; // 기타 대신 장비품으로 분류
        }
        
        if (index.startsWith('item_w_')) {
            return '무기';
        } else if (index.startsWith('item_a_')) {
            return '방어구';
        } else if (index.startsWith('item_e_')) {
            return '장비품';
        } else if (index.startsWith('item_f_')) {
            return '선수상';
        } else if (index.startsWith('item_g_')) {
            return '여성이 동경하는 물건';
        } else if (index.startsWith('item_p_')) {
            return '원산물';
        } else if (index.startsWith('item_c_')) {
            return '항해용품';
        }
        
        return '장비품'; // 기타 대신 장비품으로 분류
    }

    getConditionText(item) {
        let conditionText = '';
        
        if (item.조건) {
            if (item.조건['구 캐릭터']) {
                conditionText += item.조건['구 캐릭터'] + ' ';
            }
            if (item.조건['신 캐릭터']) {
                conditionText += item.조건['신 캐릭터'] + ' ';
            }
        }
        
        return conditionText.trim();
    }

    updateCharacterFilter() {
        const selectedMainCharacter = this.mainCharacterFilter.value;
        
        if (!selectedMainCharacter) {
            // 주인공이 선택되지 않았으면 캐릭터 필터 초기화
            this.characterFilter.value = '';
            return;
        }

        // 주인공별 구/신 캐릭터 분류
        const characterGroups = {
            '라파엘': '구 캐릭터',
            '릴': '구 캐릭터', 
            '마리아': '구 캐릭터',
            '호드람': '구 캐릭터',
            '교타로': '신 캐릭터',
            '웃딘': '신 캐릭터',
            '티알': '신 캐릭터'
        };

        const characterGroup = characterGroups[selectedMainCharacter];
        if (characterGroup) {
            this.characterFilter.value = characterGroup;
        }
    }

    updatePositionFilter() {
        if (!this.typeFilter || !this.positionFilter) {
            console.error('필터 요소를 찾을 수 없습니다');
            return;
        }
        
        const selectedType = this.typeFilter.value;
        
        if (selectedType === '장비품') {
            // 장비품이 선택되면 보직 필터 표시
            this.positionFilter.style.display = 'inline-block';
            
            // 현재 선택된 보직 값 저장
            const currentPosition = this.positionFilter.value;
            
            // 사용 가능한 보직 목록 생성
            const positions = new Set();
            this.items.forEach(item => {
                if (this.getItemType(item) === '장비품' && item.보직) {
                    positions.add(item.보직);
                }
            });
            
            // 보직 필터 옵션 업데이트
            this.positionFilter.innerHTML = '<option value="">모든 보직</option>';
            Array.from(positions).sort().forEach(position => {
                const option = document.createElement('option');
                option.value = position;
                option.textContent = position;
                this.positionFilter.appendChild(option);
            });
            
            // 이전에 선택된 보직이 여전히 유효하면 다시 선택
            if (currentPosition && Array.from(positions).includes(currentPosition)) {
                this.positionFilter.value = currentPosition;
            }
        } else {
            // 다른 종류가 선택되면 보직 필터 숨김
            this.positionFilter.style.display = 'none';
            this.positionFilter.value = '';
        }
    }

    updateMainCharacterFilter() {
        const selectedCharacter = this.characterFilter.value;
        
        if (!selectedCharacter) {
            // 캐릭터 필터가 선택되지 않았으면 주인공 필터 초기화
            this.mainCharacterFilter.value = '';
            return;
        }

        // 구/신 캐릭터별 주인공 분류
        const characterGroups = {
            '구 캐릭터': ['라파엘', '릴', '마리아', '호드람'],
            '신 캐릭터': ['교타로', '웃딘', '티알']
        };

        const availableCharacters = characterGroups[selectedCharacter];
        if (availableCharacters && availableCharacters.length > 0) {
            // 현재 선택된 주인공이 해당 그룹에 속하는지 확인
            const currentMainCharacter = this.mainCharacterFilter.value;
            if (!currentMainCharacter || !availableCharacters.includes(currentMainCharacter)) {
                // 속하지 않으면 첫 번째 캐릭터로 설정
                this.mainCharacterFilter.value = availableCharacters[0];
            }
        }
    }

    getAvailableCharacters(item) {
        const conditionText = this.getConditionText(item);
        if (!conditionText) {
            return "  모든 주인공 사용 가능";
        }

        const availableCharacters = [];
        const allCharacters = {
            '라파엘': ['라파엘', '라파엘:'],
            '릴': ['릴', '릴:'],
            '마리아': ['마리아', '마리아:'],
            '호드람': ['호드람', '호드람:'],
            '교타로': ['교타로', '교타로:'],
            '웃딘': ['웃딘', '웃딘:'],
            '티알': ['티알', '티알:']
        };

        for (const [character, keywords] of Object.entries(allCharacters)) {
            const isAvailable = keywords.some(keyword => 
                conditionText.toLowerCase().includes(keyword.toLowerCase())
            );
            if (isAvailable) {
                availableCharacters.push(character);
            }
        }

        if (availableCharacters.length === 0) {
            return "  특정 조건 필요 (상세 조건 확인)";
        } else {
            return "  " + availableCharacters.join(", ");
        }
    }

    sortItemsByEffect() {
        // 무기와 방어구만 효과치로 정렬
        const weaponAndArmorTypes = ['무기', '방어구'];
        
        this.filteredItems.sort((a, b) => {
            const aType = this.getItemType(a);
            const bType = this.getItemType(b);
            
            // 무기나 방어구가 아닌 경우 원래 순서 유지
            if (!weaponAndArmorTypes.includes(aType) && !weaponAndArmorTypes.includes(bType)) {
                return 0;
            }
            
            // 무기나 방어구인 경우 효과치로 정렬
            const aEffect = this.getEffectValue(a);
            const bEffect = this.getEffectValue(b);
            
            // 효과치가 높은 순으로 정렬 (내림차순)
            return bEffect - aEffect;
        });
    }

    getEffectValue(item) {
        if (!item.효과) return 0;
        
        // 숫자인 경우 그대로 반환
        if (typeof item.효과 === 'number') {
            return item.효과;
        }
        
        // 문자열인 경우 숫자 부분 추출
        if (typeof item.효과 === 'string') {
            const match = item.효과.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        }
        
        return 0;
    }

    showFigureheadAbility(itemIndex, event) {
        event.stopPropagation(); // 이벤트 버블링 방지
        
        const item = this.items.find(i => i.인덱스 === itemIndex);
        if (!item || this.getItemType(item) !== '선수상') return;
        
        // 기존 툴팁 제거
        const existingTooltip = document.querySelector('.figurehead-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // 새 툴팁 생성
        const tooltip = document.createElement('div');
        tooltip.className = 'figurehead-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-header">선수상 능력</div>
                <div class="tooltip-body">${item.효과 || '능력 정보 없음'}</div>
                <div class="tooltip-close" onclick="this.parentElement.parentElement.remove()">×</div>
            </div>
        `;
        
        // 툴팁 위치 설정
        const iconElement = event.target;
        const rect = iconElement.getBoundingClientRect();
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.zIndex = '1000';
        
        // 툴팁을 body에 추가
        document.body.appendChild(tooltip);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (tooltip.parentElement) {
                tooltip.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <p>페이지를 새로고침해주세요.</p>
            </div>
        `;
    }

    // 일반동료 검색 기능
    performCrewSearch() {
        console.log('performCrewSearch 호출됨');
        console.log('crewData:', this.crewData);
        console.log('crewResults:', this.crewResults);
        
        if (!this.crewData) {
            console.error('crewData가 null입니다.');
            return;
        }
        
        if (!this.crewResults) {
            console.error('crewResults가 null입니다.');
            return;
        }

        const searchTerm = this.crewSearchInput ? this.crewSearchInput.value.toLowerCase().trim() : '';
        const selectedCharacter = this.crewCharacterFilter ? this.crewCharacterFilter.value : '';

        console.log('검색 조건:', { searchTerm, selectedCharacter });

        console.log('crewData 첫 번째 항목 예시:', this.crewData[0]);
        
        const filteredCrew = this.crewData.filter(crew => {
            // 이름 검색
            const nameMatch = !searchTerm || crew.name.toLowerCase().includes(searchTerm);
            
            // 주인공 필터
            const characterMatch = !selectedCharacter || 
                crew.routes.some(route => route.character === selectedCharacter);

            console.log(`동료 ${crew.name} 필터링:`, {
                nameMatch,
                characterMatch,
                selectedCharacter,
                routes: crew.routes.map(r => r.character)
            });

            return nameMatch && characterMatch;
        });

        console.log('필터링된 결과:', filteredCrew.length, '개');
        if (filteredCrew.length > 0) {
            console.log('첫 번째 필터링된 결과 예시:', filteredCrew[0]);
        }
        this.displayCrewResults(filteredCrew);
        this.updateCrewStats(filteredCrew.length);
    }

    // 일반동료 결과 표시
    displayCrewResults(crewList) {
        console.log('displayCrewResults 호출됨, crewList:', crewList);
        
        if (!this.crewResults) {
            console.error('crewResults가 null입니다.');
            return;
        }

        if (crewList.length === 0) {
            console.log('검색 결과가 없습니다.');
            this.crewResults.innerHTML = `
                <div class="no-crew-results">
                    <i class="fas fa-search"></i>
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 검색어를 입력하거나 필터를 변경해보세요.</p>
                </div>
            `;
            return;
        }

        const selectedCharacter = this.crewCharacterFilter ? this.crewCharacterFilter.value : '';

        const crewHTML = crewList.map(crew => {
            // 선택된 주인공이 있으면 해당 주인공의 조건만 표시
            let routesToShow = crew.routes;
            if (selectedCharacter) {
                routesToShow = crew.routes.filter(route => route.character === selectedCharacter);
            }

            // 간결한 형식으로 표시 (조건이 null이 아닌 경우만)
            const routesText = routesToShow
                .filter(route => route.condition && route.condition.trim() !== '')
                .map(route => {
                    const conditionText = route.condition;
                    // 선택된 주인공이 있으면 주인공 이름은 표시하지 않음
                    if (selectedCharacter) {
                        return conditionText;
                    } else {
                        return `${route.character} | ${conditionText}`;
                    }
                }).join(' | ');

            return `
                <div class="crew-card-compact">
                    <div class="crew-name-compact">
                        <i class="fas fa-user"></i>
                        ${crew.name}
                    </div>
                    <div class="crew-condition-compact">
                        ${routesText}
                    </div>
                </div>
            `;
        }).join('');

        console.log('생성된 HTML 길이:', crewHTML.length);
        console.log('생성된 HTML 내용 (처음 500자):', crewHTML.substring(0, 500));
        this.crewResults.innerHTML = crewHTML;
        console.log('HTML이 crewResults에 설정됨');
    }

    // 일반동료 통계 업데이트
    updateCrewStats(count) {
        console.log('updateCrewStats 호출됨, count:', count);
        
        if (!this.crewSearchStats) {
            console.error('crewSearchStats가 null입니다.');
            return;
        }
        
        if (!this.crewData) {
            console.error('crewData가 null입니다.');
            return;
        }
        
        this.crewSearchStats.textContent = `전체 ${this.crewData.length}명 중 ${count}명의 동료`;
        console.log('통계 업데이트 완료:', this.crewSearchStats.textContent);
    }
    
    // 특수동료 아지자 표시
    displaySpecialCrew() {
        if (!this.specialCrewData || !this.specialCrewContent) return;
        
        const data = this.specialCrewData;
        let html = '';
        
        // 요구사항 카드들 생성
        data.requirements.forEach((req, index) => {
            const iconClass = this.getRequirementIconClass(req.type);
            const iconText = this.getRequirementIconText(req.type);
            
            html += `
                <div class="requirement-card">
                    <div class="requirement-header">
                        <div class="requirement-icon ${iconClass}">
                            <i class="fas ${iconText}"></i>
                        </div>
                        <div class="requirement-title">${this.getRequirementTitle(req.type)}</div>
                    </div>
                    <div class="requirement-description">${req.description}</div>
                    ${this.getRequirementDetails(req)}
                </div>
            `;
        });
        
        // 노트 섹션 추가
        if (data.notes && data.notes.length > 0) {
            html += `
                <div class="notes-section">
                    <h4><i class="fas fa-info-circle"></i> 중요 참고사항</h4>
                    <ul>
                        ${data.notes.map(note => `<li>${note}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        this.specialCrewContent.innerHTML = html;
    }
    
    // 요구사항 타입별 아이콘 클래스 반환
    getRequirementIconClass(type) {
        const iconMap = {
            'item_required': 'item',
            'money_required': 'money',
            'main_fleet_members': 'members',
            'event_trigger': 'event',
            'battle_event': 'battle',
            'special_case': 'special'
        };
        return iconMap[type] || 'special';
    }
    
    // 요구사항 타입별 아이콘 텍스트 반환
    getRequirementIconText(type) {
        const iconMap = {
            'item_required': 'fa-sword',
            'money_required': 'fa-coins',
            'main_fleet_members': 'fa-users',
            'event_trigger': 'fa-map-marker-alt',
            'battle_event': 'fa-ship',
            'special_case': 'fa-star'
        };
        return iconMap[type] || 'fa-star';
    }
    
    // 요구사항 타입별 제목 반환
    getRequirementTitle(type) {
        const titleMap = {
            'item_required': '필수 아이템',
            'money_required': '필수 자금',
            'main_fleet_members': '필수 동료',
            'event_trigger': '이벤트 발생',
            'battle_event': '전투 이벤트',
            'special_case': '특수 조건'
        };
        return titleMap[type] || '특수 조건';
    }
    
    // 요구사항 상세 정보 생성


    getRequirementDetails(req) {
        let details = '';
        
        switch (req.type) {
            case 'item_required':
                details = `
                    <div class="requirement-details">
                        <ul>
                            <li><strong>필수 아이템:</strong> ${req.item}</li>
                            <li><strong>장비 여부:</strong> ${req.must_be_equipped ? '장비 중이어야 함' : '장비 중이면 안 됨'}</li>
                            <li><strong>소지 여부:</strong> ${req.must_be_carried ? '소지해야 함' : '소지하지 않아도 됨'}</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'money_required':
                details = `
                    <div class="requirement-details">
                        <ul>
                            <li><strong>필요 자금:</strong> ${req.money_min.toLocaleString()}닢</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'main_fleet_members':
                details = `
                    <div class="requirement-details">
                        <ul>
                            ${req.required_members.map(member => `<li>${member}</li>`).join('')}
                        </ul>
                        ${req.note ? `<div class="requirement-note">${req.note}</div>` : ''}
                    </div>
                `;
                break;
                
            case 'event_trigger':
                details = `
                    <div class="requirement-details">
                        <ul>
                            <li><strong>위치:</strong> ${req.location}</li>
                            <li><strong>필요 아이템:</strong> ${req.requires_item}</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'battle_event':
                details = `
                    <div class="requirement-details">
                        <ul>
                            <li><strong>위치:</strong> ${req.location}</li>
                            <li><strong>상대:</strong> ${req.opponent}</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'special_case':
                details = `
                    <div class="requirement-details">
                        <ul>
                            <li><strong>특수 조건:</strong> ${req.character} 플레이 시</li>
                            ${req.required_members.map(member => `<li>${member}</li>`).join('')}
                        </ul>
                    </div>
                `;
                break;
        }
        
        return details;
    }

    // 황금항로 로딩 상태 확인
    checkGoldrouteLoading() {
        const goldrouteLoading = document.getElementById('goldrouteLoading');
        const goldrouteResults = document.getElementById('goldrouteResults');
        
        // 로딩바가 표시되어 있고 결과가 비어있으면 로딩 상태로 유지
        if (goldrouteLoading && goldrouteLoading.style.display !== 'none' && 
            goldrouteResults && goldrouteResults.children.length === 0) {
            // 로딩 상태 유지
        }
    }
    
    // 황금항로 초기화
    initializeGoldroute() {
        console.log(`[성능] initializeGoldroute 시작: ${new Date().toISOString()}`);
        try {
            // 황금항로 매니저가 없으면 생성
            if (!window.goldrouteManager) {
                window.goldrouteManager = new GoldRouteManager();
            } else {
                // 기존 매니저가 있으면 데이터가 로드되었는지 확인하고 표시
                if (window.goldrouteManager.goldrouteResults && window.goldrouteManager.isInitialized) {
                    console.log(`[성능] 기존 goldrouteManager 사용: ${new Date().toISOString()}`);
                    console.log(`[성능] 기존 매니저 데이터 개수: ${window.goldrouteManager.goldrouteItems.length}`);
                    window.goldrouteManager.goldrouteResults.style.display = 'block';
                    window.goldrouteManager.hideLoading();
                } else if (window.goldrouteManager.isInitializing) {
                    // 초기화 중이면 로딩 상태만 표시
                    console.log(`[성능] goldrouteManager 초기화 중, 로딩 상태 유지: ${new Date().toISOString()}`);
                    window.goldrouteManager.showLoading();
                } else {
                    // 초기화되지 않았으면 다시 초기화
                    console.log(`[성능] goldrouteManager 재초기화: ${new Date().toISOString()}`);
                    window.goldrouteManager.init();
                }
            }
        } catch (error) {
            console.error('황금항로 초기화 오류:', error);
        }
        console.log(`[성능] initializeGoldroute 완료: ${new Date().toISOString()}`);
    }
    
    // 자유게시판 초기화
    initializeBoard() {
        try {
            // 게시판 매니저가 없으면 생성
            if (!window.boardManager) {
                window.boardManager = new BoardManager();
            }
        } catch (error) {
            console.error('자유게시판 초기화 오류:', error);
        }
    }
}

// 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ItemSearchApp();
});

// 전역 함수로 아이템 상세보기 접근
window.app = null;
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
}); 