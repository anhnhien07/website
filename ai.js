// ===== GEMINI AI INTEGRATION =====

class AIAssistant {
    constructor() {
        this.apiKey = '';
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.loadApiKey();
        this.attachEvents();
    }

    loadApiKey() {
        const user = Storage.getCurrentUser();
        if (user && user.settings && user.settings.apiKey) {
            this.apiKey = user.settings.apiKey;
        }
    }

    attachEvents() {
        // AI Suggest Time button
        const aiSuggestBtn = document.getElementById('aiSuggestBtn');
        if (aiSuggestBtn) {
            aiSuggestBtn.addEventListener('click', () => this.suggestPomodoroTime());
        }

        // AI Schedule button
        const aiScheduleBtn = document.getElementById('aiScheduleBtn');
        if (aiScheduleBtn) {
            aiScheduleBtn.addEventListener('click', () => {
                document.getElementById('aiScheduleForm').style.display = 'block';
            });
        }

        // Generate Schedule button
        const generateBtn = document.getElementById('generateSchedule');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateSchedule());
        }

        // Save API Key button
        const saveApiKeyBtn = document.getElementById('saveApiKey');
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        }
    }

    async callGemini(prompt) {
        if (!this.apiKey) {
            alert('Vui lòng cài đặt API Key trong phần Cài đặt để sử dụng tính năng AI!');
            return null;
        }

        try {
            const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('API call failed');
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            return text;

        } catch (error) {
            console.error('Gemini API Error:', error);
            alert('Lỗi khi gọi AI. Vui lòng kiểm tra API Key và kết nối internet.');
            return null;
        }
    }

    async suggestPomodoroTime() {
        const user = Storage.getCurrentUser();
        if (!user) return;

        const suggestionDiv = document.getElementById('aiSuggestionText');
        suggestionDiv.textContent = 'AI đang suy nghĩ...';
        suggestionDiv.classList.add('show');

        const prompt = `Bạn là chuyên gia về phương pháp Pomodoro. Dựa trên thông tin sau:
        - Người dùng đã học ${user.stats.totalMinutes} phút
        - Đã hoàn thành ${user.stats.totalSessions} phiên học
        - Streak hiện tại: ${user.streak} ngày
        
        Hãy gợi ý thời gian tập trung (focus time) và thời gian nghỉ (break time) tối ưu cho người dùng này.
        Trả lời ngắn gọn trong 2-3 câu, bao gồm cụ thể số phút nên đặt.`;

        const suggestion = await this.callGemini(prompt);

        if (suggestion) {
            suggestionDiv.textContent = '🤖 AI gợi ý: ' + suggestion;
        } else {
            suggestionDiv.textContent = 'Không thể lấy gợi ý từ AI. Vui lòng thử lại.';
            setTimeout(() => suggestionDiv.classList.remove('show'), 3000);
        }
    }

    async generateSchedule() {
        const request = document.getElementById('scheduleRequest').value.trim();

        if (!request) {
            alert('Vui lòng nhập yêu cầu của bạn!');
            return;
        }

        const loadingDiv = document.getElementById('scheduleLoading');
        const displayDiv = document.getElementById('scheduleDisplay');

        loadingDiv.style.display = 'flex';
        displayDiv.innerHTML = '';

        const prompt = `Bạn là trợ lý AI giúp học sinh/sinh viên lập lịch học tập.
        
        Yêu cầu của người dùng: "${request}"
        
        Hãy tạo một lịch học 7 ngày (Thứ 2 đến Chủ nhật) chi tiết, bao gồm:
        - Các môn học/chủ đề cần học
        - Thời gian cụ thể (ví dụ: 8:00-10:00)
        - Thời gian nghỉ
        - Lời khuyên để duy trì năng suất
        
        Trả lời theo định dạng JSON như sau:
        {
            "monday": ["8:00-10:00 Toán - Đại số", "10:15-12:00 Lý - Cơ học", "14:00-16:00 Hóa - Hữu cơ"],
            "tuesday": [...],
            ...
            "sunday": [...],
            "advice": "Lời khuyên chung"
        }
        
        Chỉ trả về JSON, không thêm text khác.`;

        const response = await this.callGemini(prompt);

        loadingDiv.style.display = 'none';

        if (!response) {
            displayDiv.innerHTML = '<p>Không thể tạo lịch. Vui lòng thử lại.</p>';
            return;
        }

        try {
            // Try to parse JSON from response
            let jsonStr = response.trim();
            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            const schedule = JSON.parse(jsonStr);
            this.displaySchedule(schedule);

            // Save schedule
            const user = Storage.getCurrentUser();
            if (user) {
                Storage.saveSchedule(user, {
                    name: `Lịch ${new Date().toLocaleDateString('vi-VN')}`,
                    data: schedule
                });
                this.loadSavedSchedules();
            }

        } catch (error) {
            console.error('Parse error:', error);
            // If JSON parsing fails, display as text
            displayDiv.innerHTML = `<div class="schedule-text">${response.replace(/\n/g, '<br>')}</div>`;
        }
    }

    displaySchedule(schedule) {
        const displayDiv = document.getElementById('scheduleDisplay');
        const days = {
            monday: 'Thứ 2',
            tuesday: 'Thứ 3',
            wednesday: 'Thứ 4',
            thursday: 'Thứ 5',
            friday: 'Thứ 6',
            saturday: 'Thứ 7',
            sunday: 'Chủ nhật'
        };

        let html = '';

        Object.keys(days).forEach(day => {
            if (schedule[day]) {
                html += `
                    <div class="schedule-day">
                        <h4>${days[day]}</h4>
                        ${schedule[day].map(item => `<div class="schedule-item">${item}</div>`).join('')}
                    </div>
                `;
            }
        });

        if (schedule.advice) {
            html += `
                <div class="schedule-advice" style="grid-column: 1 / -1; background: var(--bg-card); padding: var(--space-lg); border-radius: var(--radius-md); margin-top: var(--space-lg);">
                    <h4>💡 Lời khuyên:</h4>
                    <p>${schedule.advice}</p>
                </div>
            `;
        }

        displayDiv.innerHTML = html;
    }

    loadSavedSchedules() {
        const user = Storage.getCurrentUser();
        if (!user) return;

        const listDiv = document.getElementById('savedScheduleList');
        if (!listDiv) return;

        if (!user.schedules || user.schedules.length === 0) {
            listDiv.innerHTML = '<p style="color: var(--text-muted);">Chưa có lịch đã lưu</p>';
            return;
        }

        const html = user.schedules.map(schedule => `
            <div class="schedule-card" data-schedule-id="${schedule.id}">
                <h4>${schedule.name}</h4>
                <p style="color: var(--text-muted); font-size: 0.9rem;">
                    ${new Date(schedule.createdAt).toLocaleDateString('vi-VN')}
                </p>
            </div>
        `).join('');

        listDiv.innerHTML = html;

        // Add click handlers
        listDiv.querySelectorAll('.schedule-card').forEach(card => {
            card.addEventListener('click', () => {
                const scheduleId = card.dataset.scheduleId;
                const schedule = user.schedules.find(s => s.id === scheduleId);
                if (schedule) {
                    this.displaySchedule(schedule.data);
                }
            });
        });
    }

    saveApiKey() {
        const input = document.getElementById('apiKeyInput');
        const apiKey = input.value.trim();

        if (!apiKey) {
            alert('Vui lòng nhập API Key!');
            return;
        }

        const user = Storage.getCurrentUser();
        if (user) {
            user.settings.apiKey = apiKey;
            Storage.updateUser(user.username, user);
            this.apiKey = apiKey;

            alert('✅ Đã lưu API Key thành công!');
            input.type = 'password';
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
}
