// 자유게시판 관리 클래스
class BoardManager {
    constructor() {
        this.posts = JSON.parse(localStorage.getItem('boardPosts')) || [];
        this.currentPostId = parseInt(localStorage.getItem('boardPostId')) || 1;
        this.isDeveloperMode = localStorage.getItem('boardDeveloperMode') === 'true';
        
        // DOM 요소들
        this.boardWriteForm = document.getElementById('boardWriteForm');
        this.boardTitle = document.getElementById('boardTitle');
        this.boardAuthor = document.getElementById('boardAuthor');
        this.boardContent = document.getElementById('boardContent');
        this.boardList = document.getElementById('boardList');
        this.boardSearchInput = document.getElementById('boardSearchInput');
        this.boardSortFilter = document.getElementById('boardSortFilter');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.displayPosts();
        this.setupDeveloperMode();
    }
    
    // 개발자 모드 설정 (숨겨진 기능)
    setupDeveloperMode() {
        // 키보드 단축키로 개발자 모드 토글 (Ctrl + Shift + D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDeveloperMode();
            }
        });
        
        // 콘솔 명령어로 개발자 모드 제어
        window.toggleDevMode = () => this.toggleDeveloperMode();
        window.setDevMode = (enabled) => this.setDeveloperMode(enabled);
        
        // 개발자 모드 상태를 콘솔에 표시 (개발자만 확인 가능)
        if (this.isDeveloperMode) {
            console.log('🔧 개발자 모드가 활성화되어 있습니다.');
            console.log('사용 가능한 명령어:');
            console.log('- toggleDevMode(): 개발자 모드 토글');
            console.log('- setDevMode(true/false): 개발자 모드 설정');
        }
    }
    
    // 개발자 모드 토글
    toggleDeveloperMode() {
        this.isDeveloperMode = !this.isDeveloperMode;
        localStorage.setItem('boardDeveloperMode', this.isDeveloperMode.toString());
        this.displayPosts();
        
        const message = this.isDeveloperMode ? 
            '🔧 개발자 모드가 활성화되었습니다.' : 
            '🔧 개발자 모드가 비활성화되었습니다.';
        
        this.showMessage(message, 'info');
    }
    
    // 개발자 모드 설정
    setDeveloperMode(enabled) {
        this.isDeveloperMode = enabled;
        localStorage.setItem('boardDeveloperMode', this.isDeveloperMode.toString());
        this.displayPosts();
        
        const message = this.isDeveloperMode ? 
            '🔧 개발자 모드가 활성화되었습니다.' : 
            '🔧 개발자 모드가 비활성화되었습니다.';
        
        this.showMessage(message, 'info');
    }
    
    setupEventListeners() {
        // 게시글 작성 폼 이벤트
        if (this.boardWriteForm) {
            this.boardWriteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addPost();
            });
        }
        
        // 검색 이벤트
        if (this.boardSearchInput) {
            this.boardSearchInput.addEventListener('input', () => {
                this.filterPosts();
            });
        }
        
        // 정렬 이벤트
        if (this.boardSortFilter) {
            this.boardSortFilter.addEventListener('change', () => {
                this.sortPosts();
            });
        }
        
        // 작성자 입력 필드 변경 이벤트 (삭제 버튼 표시/숨김을 위해)
        if (this.boardAuthor) {
            this.boardAuthor.addEventListener('input', () => {
                this.displayPosts();
            });
        }
    }
    
    // 새 게시글 추가
    addPost() {
        // 수정 모드인 경우 수정 완료 처리
        if (this.currentEditId) {
            this.updatePost();
            return;
        }
        
        const title = this.boardTitle.value.trim();
        const author = this.boardAuthor.value.trim();
        const content = this.boardContent.value.trim();
        
        if (!title || !author || !content) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        const newPost = {
            id: this.currentPostId++,
            title: title,
            author: author,
            content: content,
            date: new Date().toISOString(),
            views: 0
        };
        
        this.posts.unshift(newPost);
        this.savePosts();
        this.displayPosts();
        this.clearForm();
        
        // 성공 메시지
        this.showMessage('게시글이 성공적으로 등록되었습니다!', 'success');
    }
    
    // 게시글 삭제
    deletePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) {
            this.showMessage('게시글을 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 개발자 모드가 아닌 경우 작성자 확인
        if (!this.isDeveloperMode) {
            const currentAuthor = this.boardAuthor ? this.boardAuthor.value.trim() : '';
            if (!currentAuthor || currentAuthor !== post.author) {
                this.showMessage('자신이 작성한 게시글만 삭제할 수 있습니다.', 'error');
                return;
            }
        }
        
        if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            this.posts = this.posts.filter(post => post.id !== postId);
            this.savePosts();
            this.displayPosts();
            this.showMessage('게시글이 삭제되었습니다.', 'info');
        }
    }
    
    // 게시글 수정 모드 시작
    startEditPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) {
            this.showMessage('게시글을 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 개발자 모드가 아닌 경우 작성자 확인
        if (!this.isDeveloperMode) {
            const currentAuthor = this.boardAuthor ? this.boardAuthor.value.trim() : '';
            if (!currentAuthor || currentAuthor !== post.author) {
                this.showMessage('자신이 작성한 게시글만 수정할 수 있습니다.', 'error');
                return;
            }
        }
        
        // 폼에 기존 데이터 채우기
        this.boardTitle.value = post.title;
        this.boardAuthor.value = post.author;
        this.boardContent.value = post.content;
        
        // 수정 모드로 변경
        this.currentEditId = postId;
        this.updateFormForEdit();
        
        // 폼으로 스크롤
        this.boardWriteForm.scrollIntoView({ behavior: 'smooth' });
        
        this.showMessage('수정 모드입니다. 내용을 수정한 후 저장 버튼을 클릭하세요.', 'info');
    }
    
    // 수정 모드에서 폼 업데이트
    updateFormForEdit() {
        const submitBtn = this.boardWriteForm.querySelector('.board-submit-btn');
        const formTitle = this.boardWriteForm.querySelector('h3');
        
        if (this.currentEditId) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> 수정 완료';
            formTitle.innerHTML = '<i class="fas fa-edit"></i> 게시글 수정';
            
            // 취소 버튼 추가
            if (!this.boardWriteForm.querySelector('.board-cancel-btn')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'board-cancel-btn';
                cancelBtn.innerHTML = '<i class="fas fa-times"></i> 취소';
                cancelBtn.addEventListener('click', () => this.cancelEdit());
                submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
            }
        } else {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 게시글 등록';
            formTitle.innerHTML = '<i class="fas fa-edit"></i> 새 게시글 작성';
            
            // 취소 버튼 제거
            const cancelBtn = this.boardWriteForm.querySelector('.board-cancel-btn');
            if (cancelBtn) {
                cancelBtn.remove();
            }
        }
    }
    
    // 수정 취소
    cancelEdit() {
        this.currentEditId = null;
        this.clearForm();
        this.updateFormForEdit();
        this.showMessage('수정이 취소되었습니다.', 'info');
    }
    
    // 게시글 수정 완료
    updatePost() {
        const title = this.boardTitle.value.trim();
        const author = this.boardAuthor.value.trim();
        const content = this.boardContent.value.trim();
        
        if (!title || !author || !content) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        const postIndex = this.posts.findIndex(p => p.id === this.currentEditId);
        if (postIndex === -1) {
            this.showMessage('수정할 게시글을 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 게시글 업데이트
        this.posts[postIndex] = {
            ...this.posts[postIndex],
            title: title,
            author: author,
            content: content,
            date: new Date().toISOString() // 수정 날짜 업데이트
        };
        
        this.savePosts();
        this.displayPosts();
        this.currentEditId = null;
        this.clearForm();
        this.updateFormForEdit();
        
        this.showMessage('게시글이 성공적으로 수정되었습니다!', 'success');
    }
    
    // 게시글 내용 확장/축소
    toggleContent(postId) {
        const contentElement = document.querySelector(`[data-post-id="${postId}"] .board-item-content`);
        if (contentElement) {
            contentElement.classList.toggle('expanded');
        }
    }
    
    // 게시글 필터링
    filterPosts() {
        const searchTerm = this.boardSearchInput.value.toLowerCase();
        const filteredPosts = this.posts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm) ||
            post.author.toLowerCase().includes(searchTerm)
        );
        this.displayPosts(filteredPosts);
    }
    
    // 게시글 정렬
    sortPosts() {
        const sortType = this.boardSortFilter.value;
        let sortedPosts = [...this.posts];
        
        switch (sortType) {
            case 'latest':
                sortedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'oldest':
                sortedPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'title':
                sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        this.displayPosts(sortedPosts);
    }
    
    // 게시글 목록 표시
    displayPosts(postsToDisplay = null) {
        const posts = postsToDisplay || this.posts;
        
        if (posts.length === 0) {
            this.boardList.innerHTML = `
                <div class="board-empty">
                    <i class="fas fa-comments"></i>
                    <h3>게시글이 없습니다</h3>
                    <p>첫 번째 게시글을 작성해보세요!</p>
                </div>
            `;
            return;
        }
        
        this.boardList.innerHTML = posts.map(post => this.createPostHTML(post)).join('');
        
        // 게시글 클릭 이벤트 추가
        this.boardList.querySelectorAll('.board-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.board-action-btn')) {
                    const postId = parseInt(item.dataset.postId);
                    this.toggleContent(postId);
                }
            });
        });
        
        // 수정 버튼 이벤트 추가
        this.boardList.querySelectorAll('.board-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = parseInt(btn.closest('.board-item').dataset.postId);
                this.startEditPost(postId);
            });
        });
        
        // 삭제 버튼 이벤트 추가
        this.boardList.querySelectorAll('.board-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = parseInt(btn.closest('.board-item').dataset.postId);
                this.deletePost(postId);
            });
        });
    }
    
    // 게시글 HTML 생성
    createPostHTML(post) {
        const date = new Date(post.date);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        // 현재 작성자 확인 (작성자 입력 필드에서 가져옴)
        const currentAuthor = this.boardAuthor ? this.boardAuthor.value.trim() : '';
        const isAuthor = currentAuthor && currentAuthor === post.author;
        
        // 개발자 모드이거나 작성자인 경우 버튼 표시
        const showButtons = this.isDeveloperMode || isAuthor;
        
        return `
            <div class="board-item" data-post-id="${post.id}">
                <div class="board-item-header">
                    <h4 class="board-item-title">${this.escapeHtml(post.title)}</h4>
                    <div class="board-item-meta">
                        <span class="board-item-author">${this.escapeHtml(post.author)}</span>
                        <span class="board-item-date">${formattedDate}</span>
                        ${this.isDeveloperMode ? '<span class="board-item-dev-badge" style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px;">DEV</span>' : ''}
                    </div>
                </div>
                <p class="board-item-content">${this.escapeHtml(post.content)}</p>
                <div class="board-item-actions">
                    ${showButtons ? `
                        <button class="board-action-btn edit" title="수정">
                            <i class="fas fa-edit"></i> 수정
                        </button>
                        <button class="board-action-btn delete" title="삭제">
                            <i class="fas fa-trash"></i> 삭제
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 폼 초기화
    clearForm() {
        this.boardTitle.value = '';
        this.boardAuthor.value = '';
        this.boardContent.value = '';
    }
    
    // 데이터 저장
    savePosts() {
        localStorage.setItem('boardPosts', JSON.stringify(this.posts));
        localStorage.setItem('boardPostId', this.currentPostId.toString());
    }
    
    // 메시지 표시
    showMessage(message, type = 'info') {
        // 간단한 알림 메시지
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                alertDiv.style.backgroundColor = '#27ae60';
                break;
            case 'error':
                alertDiv.style.backgroundColor = '#e74c3c';
                break;
            default:
                alertDiv.style.backgroundColor = '#3498db';
        }
        
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(alertDiv);
            }, 300);
        }, 3000);
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 페이지 로드 시 게시판 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 자유게시판 탭이 활성화될 때만 초기화
    const boardTab = document.getElementById('board-tab');
    if (boardTab) {
        window.boardManager = new BoardManager();
    }
}); 